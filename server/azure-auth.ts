import type { Request, Response } from "express";
import { Issuer, generators, type Client } from "openid-client";

let cachedClient: Client | null = null;

const SESSION_KEY = "azureAuth";

function getAzureConfig() {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID || "organizations";
  const redirectUri = process.env.AZURE_REDIRECT_URI;
  const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
  const adminRole = process.env.AZURE_ADMIN_ROLE;

  return { clientId, clientSecret, tenantId, redirectUri, adminGroupId, adminRole };
}

function isAzureConfigured(): boolean {
  const { clientId, clientSecret, redirectUri } = getAzureConfig();
  return !!(clientId && clientSecret && redirectUri);
}

async function getAzureClient() {
  if (!isAzureConfigured()) {
    throw new Error("Azure authentication is not configured. Please set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_REDIRECT_URI environment variables.");
  }

  if (cachedClient) return cachedClient;

  const { clientId, clientSecret, tenantId, redirectUri } = getAzureConfig();
  // Type narrowing - these are guaranteed to be non-undefined if isAzureConfigured is true
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Azure config values must be defined");
  }

  const issuer = await Issuer.discover(`https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`);

  cachedClient = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ["code"],
  });

  return cachedClient;
}

function getGroupsAndRoles(claims: Record<string, unknown>) {
  const groups = Array.isArray(claims.groups) ? claims.groups : [];
  const roles = Array.isArray(claims.roles) ? claims.roles : [];
  return { groups, roles } as { groups: string[]; roles: string[] };
}

function isAuthorizedAdmin(claims: Record<string, unknown>) {
  if (!isAzureConfigured()) {
    return false;
  }

  const { adminGroupId, adminRole } = getAzureConfig();
  const { groups, roles } = getGroupsAndRoles(claims);

  // Valida se user está no grupo de admin
  if (adminGroupId && groups.includes(adminGroupId)) {
    console.log(`[AzureAuth] User authorized via group ${adminGroupId}`);
    return true;
  }

  // Fallback para validação por role (se configurado)
  if (adminRole && roles.includes(adminRole)) {
    console.log(`[AzureAuth] User authorized via role ${adminRole}`);
    return true;
  }

  // User não está no grupo/role autorizado
  const email = claims.preferred_username || claims.email || "unknown";
  console.warn(`[AzureAuth] Access denied for ${email}. Must be member of admin group ${adminGroupId}`);
  return false;
}

export { isAzureConfigured };

export async function startAzureLogin(req: Request, res: Response) {
  try {
    if (!isAzureConfigured()) {
      console.warn("[AzureAuth] Azure not configured - returning user-friendly error");
      return res.status(400).json({
        error: "Azure SSO não está configurado.",
        details: "O administrador precisa configurar as variáveis de ambiente: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_REDIRECT_URI",
        fallback: "Use a autenticação padrão de administrador por enquanto."
      });
    }

    const client = await getAzureClient();
    const { redirectUri } = getAzureConfig();

    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    req.session[SESSION_KEY] = { state, nonce, codeVerifier };

    const authorizationUrl = client.authorizationUrl({
      scope: "openid profile email Directory.Read.All",
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error("[AzureAuth] Failed to start login:", error);
    res.status(500).json({ 
      error: "Failed to start Azure login",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function handleAzureCallback(req: Request, res: Response) {
  try {
    if (!isAzureConfigured()) {
      return res.status(400).json({ 
        error: "Azure SSO não está configurado"
      });
    }

    const client = await getAzureClient();
    const { redirectUri } = getAzureConfig();

    const sessionData = req.session[SESSION_KEY];
    if (!sessionData) {
      return res.status(400).json({ error: "Invalid session state" });
    }

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(redirectUri, params, {
      state: sessionData.state,
      nonce: sessionData.nonce,
      code_verifier: sessionData.codeVerifier,
    });

    const claims = tokenSet.claims();
    const { groups } = getGroupsAndRoles(claims);
    const email = claims.preferred_username || claims.email;
    
    console.log(`[AzureAuth] Callback received - Email: ${email}, Groups: ${groups.join(", ") || "none"}`);
    
    if (!isAuthorizedAdmin(claims)) {
      return res.status(403).json({ 
        error: "Acesso negado",
        details: "Você não tem permissão de administrador"
      });
    }

    req.session.admin = {
      method: "azure",
      name: claims.name as string | undefined,
      email: (claims.preferred_username || claims.email) as string | undefined,
      expiresAt: tokenSet.expires_at ? tokenSet.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
    };

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("[AzureAuth] Callback error:", error);
    res.status(500).json({ error: "Azure login failed" });
  }
}

export function buildAzureLogoutUrl(returnTo?: string) {
  if (!isAzureConfigured()) {
    return null;
  }

  const tenantId = process.env.AZURE_TENANT_ID || "organizations";
  const postLogoutRedirect = process.env.AZURE_POST_LOGOUT_REDIRECT_URI || returnTo;
  if (!postLogoutRedirect) {
    return null;
  }

  const url = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`);
  url.searchParams.set("post_logout_redirect_uri", postLogoutRedirect);
  return url.toString();
}
