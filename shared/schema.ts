import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, decimal, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Lead - Representa o contato comercial gerado pela calculadora
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  consentedAt: timestamp("consented_at"), // LGPD consent timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("leads_email_idx").on(table.email),
]);

// CompanySnapshot - Snapshot da empresa no momento da simulação
export const companySnapshots = pgTable("company_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cnpj: text("cnpj").notNull(),
  razaoSocial: text("razao_social").notNull(),
  segmento: text("segmento").notNull(),
  fpasCode: text("fpas_code").notNull(),
  isDesonerada: boolean("is_desonerada").notNull(),
  colaboradores: integer("colaboradores").notNull(),
  baseInputType: text("base_input_type").notNull().default("colaboradores"),
  folhaMedia: decimal("folha_media", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Simulation - Coração do sistema. Guarda input + output do cálculo
export const simulations = pgTable("simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  companySnapshotId: varchar("company_snapshot_id").notNull().references(() => companySnapshots.id),
  
  // Inputs de cálculo
  salarioMinimo: decimal("salario_minimo", { precision: 10, scale: 2 }).notNull(),
  aliquotaFpas: decimal("aliquota_fpas", { precision: 5, scale: 4 }).notNull(),
  aliquotaRat: decimal("aliquota_rat", { precision: 5, scale: 4 }).notNull(),
  aliquotaCpp: decimal("aliquota_cpp", { precision: 5, scale: 4 }).notNull().default("0"),
  mesesProjetados: integer("meses_projetados").notNull(),
  baseInputType: text("base_input_type").notNull().default("colaboradores"),
  folhaMedia: decimal("folha_media", { precision: 15, scale: 2 }),
  
  // Resultados
  baseFolha: decimal("base_folha", { precision: 15, scale: 2 }).notNull(),
  impostoMensalEstimado: decimal("imposto_mensal_estimado", { precision: 15, scale: 2 }).notNull(),
  totalProjetado: decimal("total_projetado", { precision: 15, scale: 2 }).notNull(),
  creditoEstimadoTotal: decimal("credito_estimado_total", { precision: 15, scale: 2 }).notNull(),
  
  // Split Semáforo
  creditoVerde: decimal("credito_verde", { precision: 15, scale: 2 }).notNull(),
  creditoAmarelo: decimal("credito_amarelo", { precision: 15, scale: 2 }).notNull(),
  creditoVermelho: decimal("credito_vermelho", { precision: 15, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("simulations_created_at_idx").on(table.createdAt),
]);

// CalculationParams - Parâmetros globais configuráveis pelo Backoffice
export const calculationParams = pgTable("calculation_params", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salarioMinimo: decimal("salario_minimo", { precision: 10, scale: 2 }).notNull(),
  percentualCredito: decimal("percentual_credito", { precision: 5, scale: 4 }).notNull(), // Ex: 0.28
  percentualCreditoDesonerada: decimal("percentual_credito_desonerada", { precision: 5, scale: 4 }).notNull().default("0.76"),
  percentualVerde: decimal("percentual_verde", { precision: 5, scale: 4 }).notNull(), // Ex: 0.15
  percentualAmarelo: decimal("percentual_amarelo", { precision: 5, scale: 4 }).notNull(), // Ex: 0.35
  percentualVermelho: decimal("percentual_vermelho", { precision: 5, scale: 4 }).notNull(), // Ex: 0.50
  mesesProjecao: integer("meses_projecao").notNull(), // Default: 65
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FPAS - Tabela de Apoio para alíquotas
export const fpas = pgTable("fpas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  descricao: text("descricao").notNull(),
  aliquotaTerceiros: decimal("aliquota_terceiros", { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// EmailSettings - Configurações de envio de email automático (Resend)
export const emailSettings = pgTable("email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enabled: boolean("enabled").notNull().default(false),
  fromEmail: text("from_email").notNull().default("noreply@msh.adv.br"),
  fromName: text("from_name").notNull().default("Machado Schutz Advogados e Associados"),
  subject: text("subject").notNull().default("Seu Diagnóstico Previdenciário"),
  bodyTemplate: text("body_template").notNull().default("Olá {{name}},\n\nSegue em anexo o seu diagnóstico previdenciário.\n\nAtenciosamente,\nMachado Schutz Advogados e Associados"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// WebhookSettings - Configurações de webhook para integração externa
export const webhookSettings = pgTable("webhook_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enabled: boolean("enabled").notNull().default(false),
  url: text("url").notNull().default(""),
  headers: text("headers").notNull().default("{}"), // JSON string of headers
  retryCount: integer("retry_count").notNull().default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AppSettings - Configurações gerais da aplicação
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  privacyPolicyUrl: text("privacy_policy_url").notNull().default("https://msh.adv.br/politica-de-privacidade/"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CNAE RAT - Tabela de alíquotas RAT por CNAE (Decreto 10.410/2020)
export const cnaeRat = pgTable("cnae_rat", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cnaeCode: text("cnae_code").notNull().unique(),
  descricao: text("descricao").notNull(),
  aliquota: decimal("aliquota", { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("cnae_rat_code_idx").on(table.cnaeCode),
]);

// Insert Schemas
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySnapshotSchema = createInsertSchema(companySnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
  createdAt: true,
});

export const insertCalculationParamsSchema = createInsertSchema(calculationParams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFpasSchema = createInsertSchema(fpas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookSettingsSchema = createInsertSchema(webhookSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  headers: z.string().max(4096, "Headers não pode exceder 4KB").refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }, { message: "Headers deve ser um JSON válido (objeto)" }),
  retryCount: z.number().min(0).max(10).default(3),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCnaeRatSchema = createInsertSchema(cnaeRat).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  aliquota: z.enum(["0.01", "0.02", "0.03"], { message: "Alíquota deve ser 1%, 2% ou 3%" }),
});

// Types
export type CnaeRat = typeof cnaeRat.$inferSelect;
export type InsertCnaeRat = z.infer<typeof insertCnaeRatSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type CompanySnapshot = typeof companySnapshots.$inferSelect;
export type InsertCompanySnapshot = z.infer<typeof insertCompanySnapshotSchema>;

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;

export type CalculationParams = typeof calculationParams.$inferSelect;
export type InsertCalculationParams = z.infer<typeof insertCalculationParamsSchema>;

export type Fpas = typeof fpas.$inferSelect;
export type InsertFpas = z.infer<typeof insertFpasSchema>;

export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;

export type WebhookSettings = typeof webhookSettings.$inferSelect;
export type InsertWebhookSettings = z.infer<typeof insertWebhookSettingsSchema>;

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

// Form validation schemas
export const calculatorFormSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(18),
  razaoSocial: z.string().min(1, "Razão Social é obrigatória"),
  segmento: z.string().min(1, "Segmento é obrigatório"),
  fpasCode: z.string().min(1, "FPAS é obrigatório"),
  cnae: z.string().optional(),
  isDesonerada: z.boolean(),
  baseInputType: z.enum(["colaboradores", "folha"]).default("colaboradores"),
  colaboradores: z.number().min(10, "Mínimo de 10 colaboradores").optional(),
  folhaMedia: z.number().min(1, "Informe o valor médio da folha").optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  lgpdConsent: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar a Política de Privacidade para continuar",
  }),
}).refine((data) => {
  if (data.baseInputType === "colaboradores") {
    return (data.colaboradores ?? 0) >= 10;
  }
  return (data.folhaMedia ?? 0) > 0;
}, {
  message: "Informe colaboradores ou valor médio de folha conforme o modo escolhido",
  path: ["baseInputType"],
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Simulation result type for frontend
export interface SimulationResult {
  simulation: Simulation;
  companySnapshot: CompanySnapshot;
  lead: Lead;
}
