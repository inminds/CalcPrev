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
  mesesProjetados: integer("meses_projetados").notNull(),
  
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
  percentualCredito: decimal("percentual_credito", { precision: 5, scale: 4 }).notNull(), // Ex: 0.20
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

// Types
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

// Form validation schemas
export const calculatorFormSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(18),
  razaoSocial: z.string().min(1, "Razão Social é obrigatória"),
  segmento: z.string().min(1, "Segmento é obrigatório"),
  fpasCode: z.string().min(1, "FPAS é obrigatório"),
  isDesonerada: z.boolean(),
  colaboradores: z.number().min(1, "Mínimo de 1 colaborador"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Simulation result type for frontend
export interface SimulationResult {
  simulation: Simulation;
  companySnapshot: CompanySnapshot;
  lead: Lead;
}
