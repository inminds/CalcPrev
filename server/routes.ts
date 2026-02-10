import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculatePrevidenciario } from "./calculation";
import { generatePDF } from "./pdf-generator";
import { sendPdfEmail } from "./email-service";
import { sendLeadWebhook } from "./webhook-service";
import { enqueueJob } from "./background-jobs";
import { startAzureLogin, handleAzureCallback, buildAzureLogoutUrl, isAzureConfigured } from "./azure-auth";
import { cnpjCache } from "./cnpj-cache";
import { calculatorFormSchema, insertCalculationParamsSchema, insertFpasSchema, insertEmailSettingsSchema, insertWebhookSettingsSchema, insertAppSettingsSchema } from "@shared/schema";
import { randomBytes } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const activeTokens = new Map<string, { createdAt: number }>();
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of Array.from(activeTokens.entries())) {
    if (now - data.createdAt > TOKEN_EXPIRY_MS) {
      activeTokens.delete(token);
    }
  }
}

function getSessionAdmin(req: Request) {
  const admin = req.session.admin;
  if (!admin) return null;
  if (admin.expiresAt <= Date.now()) {
    req.session.admin = undefined;
    return null;
  }
  return admin;
}

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const sessionAdmin = getSessionAdmin(req);
  if (sessionAdmin) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const tokenData = activeTokens.get(token);

  if (!tokenData) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (Date.now() - tokenData.createdAt > TOKEN_EXPIRY_MS) {
    activeTokens.delete(token);
    return res.status(401).json({ error: "Token expired" });
  }

  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/fpas", async (req, res) => {
    try {
      const fpasList = await storage.getAllFpas();
      res.json(fpasList);
    } catch (error) {
      console.error("Error fetching FPAS:", error);
      res.status(500).json({ error: "Failed to fetch FPAS" });
    }
  });

  app.get("/api/app-settings", async (req, res) => {
    try {
      let settings = await storage.getAppSettings();
      if (!settings) {
        settings = await storage.upsertAppSettings({
          privacyPolicyUrl: "https://msh.adv.br/politica-de-privacidade/",
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({ error: "Failed to fetch app settings" });
    }
  });

  function determinarFPAS(cnae: string | number | undefined): string {
    if (!cnae) return "515";
    const cnaeStr = cnae.toString().padStart(7, "0");
    const prefixo = cnaeStr.substring(0, 2);
    const prefixoNum = parseInt(prefixo, 10);
    
    if (["01", "02", "03"].includes(prefixo)) return "787";
    if (prefixoNum >= 10 && prefixoNum <= 33) return "507";
    if (prefixoNum >= 41 && prefixoNum <= 43) return "507";
    if (prefixoNum >= 45 && prefixoNum <= 47) return "515";
    return "515";
  }

  async function fetchCnpjFromBrasilAPI(cleanCnpj: string) {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CalculadoraPrevidenciaria/1.0)",
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`BrasilAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      razaoSocial: data.razao_social || data.nome_fantasia || "",
      cnae: data.cnae_fiscal,
      segmento: data.cnae_fiscal_descricao || "",
    };
  }

  async function fetchCnpjFromReceitaWS(cleanCnpj: string) {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CalculadoraPrevidenciaria/1.0)",
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`ReceitaWS error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "ERROR") {
      throw new Error(data.message || "CNPJ não encontrado");
    }
    
    const cnae = data.atividade_principal?.[0]?.code?.replace(/[.-]/g, "") || "";
    return {
      razaoSocial: data.nome || data.fantasia || "",
      cnae: cnae,
      segmento: data.atividade_principal?.[0]?.text || "",
    };
  }

  app.get("/api/cnpj/:cnpj", async (req, res) => {
    try {
      const { cnpj } = req.params;
      const cleanCnpj = cnpj.replace(/\D/g, "");

      if (cleanCnpj.length !== 14) {
        return res.status(400).json({ error: "CNPJ inválido - deve ter 14 dígitos" });
      }

      // Verifica cache primeiro
      const cachedData = cnpjCache.get(cleanCnpj);
      if (cachedData) {
        return res.json(cachedData);
      }

      let cnpjData;
      
      try {
        cnpjData = await fetchCnpjFromBrasilAPI(cleanCnpj);
      } catch (brasilApiError) {
        console.log("BrasilAPI failed, trying ReceitaWS...", brasilApiError);
        try {
          cnpjData = await fetchCnpjFromReceitaWS(cleanCnpj);
        } catch (receitaWsError) {
          console.log("ReceitaWS also failed", receitaWsError);
          return res.status(404).json({ 
            error: "CNPJ não encontrado. Verifique o número ou preencha manualmente." 
          });
        }
      }

      const fpasCode = determinarFPAS(cnpjData.cnae);

      const responseData = {
        razaoSocial: cnpjData.razaoSocial,
        segmento: cnpjData.segmento,
        fpasCode: fpasCode,
        cnae: cnpjData.cnae?.toString() || "",
      };

      // Armazena no cache
      cnpjCache.set(cleanCnpj, responseData);

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching CNPJ:", error);
      res.status(500).json({ error: "Não foi possível consultar o CNPJ. Tente novamente." });
    }
  });

  app.post("/api/simulate", async (req, res) => {
    try {
      const validation = calculatorFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }

      const data = validation.data;

      const baseInputType = data.baseInputType || "colaboradores";
      const colaboradores = baseInputType === "colaboradores" ? data.colaboradores ?? 0 : 0;
      const folhaMedia = baseInputType === "folha" ? data.folhaMedia ?? 0 : undefined;

      let params = await storage.getCalculationParams();
      if (!params) {
        params = await storage.upsertCalculationParams({
          salarioMinimo: "1412.00",
          percentualCredito: "0.20",
          percentualVerde: "0.15",
          percentualAmarelo: "0.35",
          percentualVermelho: "0.50",
          mesesProjecao: 65,
        });
      }

      const fpasData = await storage.getFpasByCode(data.fpasCode);
      if (!fpasData) {
        return res.status(400).json({ error: "FPAS code not found" });
      }

      const calculationResult = calculatePrevidenciario({
        colaboradores,
        isDesonerada: data.isDesonerada,
        fpas: fpasData,
        params: params,
        baseInputType,
        folhaMedia,
      });

      const fpasDescricao = fpasData.descricao;

      // Get existing lead or prepare new lead data
      const existingLead = await storage.getLeadByEmail(data.email);
      const leadData = existingLead || {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        consentedAt: data.lgpdConsent ? new Date() : null,
      };

      // Create simulation, snapshot, and lead (if needed) atomically in a transaction
      const { lead, companySnapshot, simulation } = await storage.createSimulationWithSnapshot({
        lead: leadData,
        companySnapshot: {
          cnpj: data.cnpj,
          razaoSocial: data.razaoSocial,
          segmento: data.segmento,
          fpasCode: data.fpasCode,
          isDesonerada: data.isDesonerada,
          colaboradores: colaboradores,
          baseInputType,
          folhaMedia,
        },
        simulation: {
          salarioMinimo: params.salarioMinimo,
          aliquotaFpas: calculationResult.aliquotaFpas,
          aliquotaRat: calculationResult.aliquotaRat,
          mesesProjetados: calculationResult.mesesProjetados,
          baseInputType,
          folhaMedia,
          baseFolha: calculationResult.baseFolha,
          impostoMensalEstimado: calculationResult.impostoMensalEstimado,
          totalProjetado: calculationResult.totalProjetado,
          creditoEstimadoTotal: calculationResult.creditoEstimadoTotal,
          creditoVerde: calculationResult.creditoVerde,
          creditoAmarelo: calculationResult.creditoAmarelo,
          creditoVermelho: calculationResult.creditoVermelho,
        },
      });

      enqueueJob("lead-webhook", async () => {
        await sendLeadWebhook({ lead, simulation, companySnapshot });
      });

      enqueueJob("pdf-email", async () => {
        try {
          const pdfBuffer = await generatePDF(
            simulation,
            companySnapshot,
            lead,
            params,
            fpasDescricao
          );
          await sendPdfEmail({ lead, simulation, companySnapshot, pdfBuffer });
        } catch (pdfError) {
          console.error("[PDF] Failed to generate PDF for email:", pdfError);
        }
      });

      res.json({
        simulation,
        companySnapshot,
        lead,
      });
    } catch (error) {
      console.error("Error creating simulation:", error);
      res.status(500).json({ error: "Failed to create simulation" });
    }
  });

  app.get("/api/simulations/:id/pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.getSimulationsWithDetails(id);

      if (!result) {
        return res.status(404).json({ error: "Simulation not found" });
      }

      let params = await storage.getCalculationParams();
      if (!params) {
        return res.status(500).json({ error: "Calculation params not found" });
      }

      const fpasInfo = await storage.getFpasByCode(result.companySnapshot.fpasCode);

      const pdfBuffer = await generatePDF(
        result.simulation,
        result.companySnapshot,
        result.lead,
        params,
        fpasInfo?.descricao
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="diagnostico-${result.companySnapshot.cnpj}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Azure AD SSO (padrão unificado em /admin/auth)
  app.get("/admin/auth/login", startAzureLogin);

  app.get("/admin/auth", handleAzureCallback);

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      cleanupExpiredTokens();
      const token = generateSecureToken();
      activeTokens.set(token, { createdAt: Date.now() });
      req.session.admin = {
        method: "password",
        expiresAt: Date.now() + TOKEN_EXPIRY_MS,
      };
      res.json({ token, success: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.get("/api/public/azure-config", (req, res) => {
    res.json({ azureConfigured: isAzureConfigured() });
  });

  app.get("/api/admin/me", (req, res) => {
    const sessionAdmin = getSessionAdmin(req);
    if (sessionAdmin) {
      return res.json({
        authenticated: true,
        method: sessionAdmin.method,
        name: sessionAdmin.name,
        email: sessionAdmin.email,
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ authenticated: false });
    }

    const token = authHeader.substring(7);
    const tokenData = activeTokens.get(token);
    if (!tokenData || Date.now() - tokenData.createdAt > TOKEN_EXPIRY_MS) {
      activeTokens.delete(token);
      return res.status(401).json({ authenticated: false });
    }

    return res.json({ authenticated: true, method: "password" });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.admin = undefined;
    const logoutUrl = buildAzureLogoutUrl(req.body?.returnTo);
    res.json({ success: true, logoutUrl });
  });

  app.get("/api/admin/params", adminAuth, async (req, res) => {
    try {
      let params = await storage.getCalculationParams();
      if (!params) {
        params = await storage.upsertCalculationParams({
          salarioMinimo: "1412.00",
          percentualCredito: "0.20",
          percentualVerde: "0.15",
          percentualAmarelo: "0.35",
          percentualVermelho: "0.50",
          mesesProjecao: 65,
        });
      }
      res.json(params);
    } catch (error) {
      console.error("Error fetching params:", error);
      res.status(500).json({ error: "Failed to fetch params" });
    }
  });

  app.get("/api/admin/cnpj-cache-stats", adminAuth, (req, res) => {
    try {
      const stats = cnpjCache.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      res.status(500).json({ error: "Failed to fetch cache stats" });
    }
  });

  app.put("/api/admin/params", adminAuth, async (req, res) => {
    try {
      const validation = insertCalculationParamsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }
      const params = await storage.upsertCalculationParams(validation.data);
      res.json(params);
    } catch (error) {
      console.error("Error updating params:", error);
      res.status(500).json({ error: "Failed to update params" });
    }
  });

  app.get("/api/admin/leads", adminAuth, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/admin/leads/export", adminAuth, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      
      const csv = [
        ["Nome", "Email", "Telefone", "Simulações", "Data de Cadastro"].join(","),
        ...leads.map((lead) =>
          [
            `"${lead.name}"`,
            `"${lead.email}"`,
            `"${lead.phone || ""}"`,
            lead.simulationsCount,
            `"${new Date(lead.createdAt).toLocaleDateString("pt-BR")}"`,
          ].join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ error: "Failed to export leads" });
    }
  });

  app.post("/api/admin/fpas", adminAuth, async (req, res) => {
    try {
      const validation = insertFpasSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }
      const fpasData = await storage.createFpas(validation.data);
      res.json(fpasData);
    } catch (error) {
      console.error("Error creating FPAS:", error);
      res.status(500).json({ error: "Failed to create FPAS" });
    }
  });

  app.put("/api/admin/fpas/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (Array.isArray(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const validation = insertFpasSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }
      const fpasData = await storage.updateFpas(id, validation.data);
      res.json(fpasData);
    } catch (error) {
      console.error("Error updating FPAS:", error);
      res.status(500).json({ error: "Failed to update FPAS" });
    }
  });

  app.delete("/api/admin/fpas/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (Array.isArray(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      await storage.deleteFpas(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting FPAS:", error);
      res.status(500).json({ error: "Failed to delete FPAS" });
    }
  });

  app.get("/api/admin/email-settings", adminAuth, async (req, res) => {
    try {
      let settings = await storage.getEmailSettings();
      if (!settings) {
        settings = await storage.upsertEmailSettings({
          enabled: false,
          fromEmail: "noreply@msh.adv.br",
          fromName: "Machado Schutz Advogados e Associados",
          subject: "Seu Diagnóstico Previdenciário",
          bodyTemplate: "Olá {{name}},\n\nSegue em anexo o seu diagnóstico previdenciário.\n\nAtenciosamente,\nMachado Schutz Advogados e Associados",
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ error: "Failed to fetch email settings" });
    }
  });

  app.put("/api/admin/email-settings", adminAuth, async (req, res) => {
    try {
      const validation = insertEmailSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }
      const settings = await storage.upsertEmailSettings(validation.data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });

  app.get("/api/admin/webhook-settings", adminAuth, async (req, res) => {
    try {
      let settings = await storage.getWebhookSettings();
      if (!settings) {
        settings = await storage.upsertWebhookSettings({
          enabled: false,
          url: "",
          headers: "{}",
          retryCount: 3,
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching webhook settings:", error);
      res.status(500).json({ error: "Failed to fetch webhook settings" });
    }
  });

  app.put("/api/admin/webhook-settings", adminAuth, async (req, res) => {
    try {
      const validation = insertWebhookSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }
      const settings = await storage.upsertWebhookSettings(validation.data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating webhook settings:", error);
      res.status(500).json({ error: "Failed to update webhook settings" });
    }
  });

  app.get("/api/admin/app-settings", adminAuth, async (req, res) => {
    try {
      let settings = await storage.getAppSettings();
      if (!settings) {
        settings = await storage.upsertAppSettings({
          privacyPolicyUrl: "https://msh.adv.br/politica-de-privacidade/",
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({ error: "Failed to fetch app settings" });
    }
  });

  app.put("/api/admin/app-settings", adminAuth, async (req, res) => {
    try {
      const validation = insertAppSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }
      const settings = await storage.upsertAppSettings(validation.data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating app settings:", error);
      res.status(500).json({ error: "Failed to update app settings" });
    }
  });

  return httpServer;
}
