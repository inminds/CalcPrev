import "express-session";

declare module "express-session" {
  interface SessionData {
    admin?: {
      method: "azure" | "password";
      name?: string;
      email?: string;
      expiresAt: number;
    };
    azureAuth?: {
      state: string;
      nonce: string;
      codeVerifier: string;
    };
  }
}
