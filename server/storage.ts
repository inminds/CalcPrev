import {
  leads,
  companySnapshots,
  simulations,
  calculationParams,
  fpas,
  emailSettings,
  webhookSettings,
  appSettings,
  type Lead,
  type InsertLead,
  type CompanySnapshot,
  type InsertCompanySnapshot,
  type Simulation,
  type InsertSimulation,
  type CalculationParams,
  type InsertCalculationParams,
  type Fpas,
  type InsertFpas,
  type EmailSettings,
  type InsertEmailSettings,
  type WebhookSettings,
  type InsertWebhookSettings,
  type AppSettings,
  type InsertAppSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<(Lead & { simulationsCount: number })[]>;

  // Company Snapshots
  createCompanySnapshot(snapshot: InsertCompanySnapshot): Promise<CompanySnapshot>;
  getCompanySnapshot(id: string): Promise<CompanySnapshot | undefined>;

  // Simulations
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  getSimulation(id: string): Promise<Simulation | undefined>;
  getSimulationsWithDetails(id: string): Promise<{ simulation: Simulation; companySnapshot: CompanySnapshot; lead: Lead } | undefined>;

  // Calculation Params
  getCalculationParams(): Promise<CalculationParams | undefined>;
  upsertCalculationParams(params: InsertCalculationParams): Promise<CalculationParams>;

  // FPAS
  getAllFpas(): Promise<Fpas[]>;
  getFpasByCode(code: string): Promise<Fpas | undefined>;
  createFpas(fpas: InsertFpas): Promise<Fpas>;
  updateFpas(id: string, fpas: Partial<InsertFpas>): Promise<Fpas>;
  deleteFpas(id: string): Promise<void>;

  // Email Settings
  getEmailSettings(): Promise<EmailSettings | undefined>;
  upsertEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;

  // Webhook Settings
  getWebhookSettings(): Promise<WebhookSettings | undefined>;
  upsertWebhookSettings(settings: InsertWebhookSettings): Promise<WebhookSettings>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  upsertAppSettings(settings: InsertAppSettings): Promise<AppSettings>;
}

export class DatabaseStorage implements IStorage {
  // Leads
  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.email, email));
    return lead || undefined;
  }

  async getAllLeads(): Promise<(Lead & { simulationsCount: number })[]> {
    const result = await db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        consentedAt: leads.consentedAt,
        createdAt: leads.createdAt,
        simulationsCount: sql<number>`count(${simulations.id})::int`,
      })
      .from(leads)
      .leftJoin(simulations, eq(leads.id, simulations.leadId))
      .groupBy(leads.id)
      .orderBy(desc(leads.createdAt));
    return result;
  }

  // Company Snapshots
  async createCompanySnapshot(snapshot: InsertCompanySnapshot): Promise<CompanySnapshot> {
    const [created] = await db.insert(companySnapshots).values(snapshot).returning();
    return created;
  }

  async getCompanySnapshot(id: string): Promise<CompanySnapshot | undefined> {
    const [snapshot] = await db.select().from(companySnapshots).where(eq(companySnapshots.id, id));
    return snapshot || undefined;
  }

  // Simulations
  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [created] = await db.insert(simulations).values(simulation).returning();
    return created;
  }

  async getSimulation(id: string): Promise<Simulation | undefined> {
    const [simulation] = await db.select().from(simulations).where(eq(simulations.id, id));
    return simulation || undefined;
  }

  async getSimulationsWithDetails(id: string): Promise<{ simulation: Simulation; companySnapshot: CompanySnapshot; lead: Lead } | undefined> {
    const result = await db
      .select()
      .from(simulations)
      .innerJoin(companySnapshots, eq(simulations.companySnapshotId, companySnapshots.id))
      .innerJoin(leads, eq(simulations.leadId, leads.id))
      .where(eq(simulations.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      simulation: row.simulations,
      companySnapshot: row.company_snapshots,
      lead: row.leads,
    };
  }

  // Calculation Params
  async getCalculationParams(): Promise<CalculationParams | undefined> {
    const [params] = await db.select().from(calculationParams).limit(1);
    return params || undefined;
  }

  async upsertCalculationParams(params: InsertCalculationParams): Promise<CalculationParams> {
    const existing = await this.getCalculationParams();
    if (existing) {
      const [updated] = await db
        .update(calculationParams)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(calculationParams.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(calculationParams).values(params).returning();
      return created;
    }
  }

  // FPAS
  async getAllFpas(): Promise<Fpas[]> {
    return db.select().from(fpas).orderBy(fpas.code);
  }

  async getFpasByCode(code: string): Promise<Fpas | undefined> {
    const [result] = await db.select().from(fpas).where(eq(fpas.code, code));
    return result || undefined;
  }

  async createFpas(fpasData: InsertFpas): Promise<Fpas> {
    const [created] = await db.insert(fpas).values(fpasData).returning();
    return created;
  }

  async updateFpas(id: string, fpasData: Partial<InsertFpas>): Promise<Fpas> {
    const [updated] = await db
      .update(fpas)
      .set({ ...fpasData, updatedAt: new Date() })
      .where(eq(fpas.id, id))
      .returning();
    return updated;
  }

  async deleteFpas(id: string): Promise<void> {
    await db.delete(fpas).where(eq(fpas.id, id));
  }

  // Email Settings
  async getEmailSettings(): Promise<EmailSettings | undefined> {
    const [settings] = await db.select().from(emailSettings).limit(1);
    return settings || undefined;
  }

  async upsertEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const existing = await this.getEmailSettings();
    if (existing) {
      const [updated] = await db
        .update(emailSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(emailSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(emailSettings).values(settings).returning();
      return created;
    }
  }

  // Webhook Settings
  async getWebhookSettings(): Promise<WebhookSettings | undefined> {
    const [settings] = await db.select().from(webhookSettings).limit(1);
    return settings || undefined;
  }

  async upsertWebhookSettings(settings: InsertWebhookSettings): Promise<WebhookSettings> {
    const existing = await this.getWebhookSettings();
    if (existing) {
      const [updated] = await db
        .update(webhookSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(webhookSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(webhookSettings).values(settings).returning();
      return created;
    }
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings || undefined;
  }

  async upsertAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const existing = await this.getAppSettings();
    if (existing) {
      const [updated] = await db
        .update(appSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(appSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(appSettings).values(settings).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
