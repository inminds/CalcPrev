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
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

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
  createSimulationWithSnapshot(params: {
    lead: InsertLead | Lead;
    companySnapshot: InsertCompanySnapshot;
    simulation: Omit<InsertSimulation, 'leadId' | 'companySnapshotId'>;
  }): Promise<{ lead: Lead; companySnapshot: CompanySnapshot; simulation: Simulation }>;

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
  private async getDb() {
    const { db } = await import("./db");
    return db;
  }

  // Leads
  async createLead(lead: InsertLead): Promise<Lead> {
    const db = await this.getDb();
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    const db = await this.getDb();
    const [lead] = await db.select().from(leads).where(eq(leads.email, email));
    return lead || undefined;
  }

  async getAllLeads(): Promise<(Lead & { simulationsCount: number })[]> {
    const db = await this.getDb();
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
    const db = await this.getDb();
    const [created] = await db.insert(companySnapshots).values(snapshot).returning();
    return created;
  }

  async getCompanySnapshot(id: string): Promise<CompanySnapshot | undefined> {
    const db = await this.getDb();
    const [snapshot] = await db.select().from(companySnapshots).where(eq(companySnapshots.id, id));
    return snapshot || undefined;
  }

  // Simulations
  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const db = await this.getDb();
    const [created] = await db.insert(simulations).values(simulation).returning();
    return created;
  }

  async getSimulation(id: string): Promise<Simulation | undefined> {
    const db = await this.getDb();
    const [simulation] = await db.select().from(simulations).where(eq(simulations.id, id));
    return simulation || undefined;
  }

  async getSimulationsWithDetails(id: string): Promise<{ simulation: Simulation; companySnapshot: CompanySnapshot; lead: Lead } | undefined> {
    const db = await this.getDb();
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
    const db = await this.getDb();
    const [params] = await db.select().from(calculationParams).limit(1);
    return params || undefined;
  }

  async upsertCalculationParams(params: InsertCalculationParams): Promise<CalculationParams> {
    const db = await this.getDb();
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
    const db = await this.getDb();
    return db.select().from(fpas).orderBy(fpas.code);
  }

  async getFpasByCode(code: string): Promise<Fpas | undefined> {
    const db = await this.getDb();
    const [result] = await db.select().from(fpas).where(eq(fpas.code, code));
    return result || undefined;
  }

  async createFpas(fpasData: InsertFpas): Promise<Fpas> {
    const db = await this.getDb();
    const [created] = await db.insert(fpas).values(fpasData).returning();
    return created;
  }

  async updateFpas(id: string, fpasData: Partial<InsertFpas>): Promise<Fpas> {
    const db = await this.getDb();
    const [updated] = await db
      .update(fpas)
      .set({ ...fpasData, updatedAt: new Date() })
      .where(eq(fpas.id, id))
      .returning();
    return updated;
  }

  async deleteFpas(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete(fpas).where(eq(fpas.id, id));
  }

  // Email Settings
  async getEmailSettings(): Promise<EmailSettings | undefined> {
    const db = await this.getDb();
    const [settings] = await db.select().from(emailSettings).limit(1);
    return settings || undefined;
  }

  async upsertEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const db = await this.getDb();
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
    const db = await this.getDb();
    const [settings] = await db.select().from(webhookSettings).limit(1);
    return settings || undefined;
  }

  async upsertWebhookSettings(settings: InsertWebhookSettings): Promise<WebhookSettings> {
    const db = await this.getDb();
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
    const db = await this.getDb();
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings || undefined;
  }

  async upsertAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const db = await this.getDb();
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

  // Transactional simulation creation
  async createSimulationWithSnapshot(params: {
    lead: InsertLead | Lead;
    companySnapshot: InsertCompanySnapshot;
    simulation: Omit<InsertSimulation, 'leadId' | 'companySnapshotId'>;
  }): Promise<{ lead: Lead; companySnapshot: CompanySnapshot; simulation: Simulation }> {
    const db = await this.getDb();
    return await db.transaction(async (tx) => {
      // Get or create lead
      let lead: Lead;
      if ('id' in params.lead) {
        lead = params.lead;
      } else {
        const [createdLead] = await tx.insert(leads).values(params.lead).returning();
        lead = createdLead;
      }

      // Create company snapshot
      const [companySnapshot] = await tx.insert(companySnapshots).values(params.companySnapshot).returning();

      // Create simulation
      const [simulation] = await tx.insert(simulations).values({
        ...params.simulation,
        leadId: lead.id,
        companySnapshotId: companySnapshot.id,
      }).returning();

      return { lead, companySnapshot, simulation };
    });
  }
}

export class InMemoryStorage implements IStorage {
  private leadsData: Lead[] = [];
  private snapshotsData: CompanySnapshot[] = [];
  private simulationsData: Simulation[] = [];
  private calcParamsData?: CalculationParams;
  private fpasData: Fpas[] = [];
  private emailSettingsData?: EmailSettings;
  private webhookSettingsData?: WebhookSettings;
  private appSettingsData?: AppSettings;

  async createLead(lead: InsertLead): Promise<Lead> {
    const created: Lead = {
      id: randomUUID(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? null,
      consentedAt: lead.consentedAt ?? null,
      createdAt: new Date(),
    };
    this.leadsData.push(created);
    return created;
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    return this.leadsData.find((l) => l.email === email);
  }

  async getAllLeads(): Promise<(Lead & { simulationsCount: number })[]> {
    return this.leadsData
      .map((lead) => ({
        ...lead,
        simulationsCount: this.simulationsData.filter((s) => s.leadId === lead.id).length,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createCompanySnapshot(snapshot: InsertCompanySnapshot): Promise<CompanySnapshot> {
    const created: CompanySnapshot = {
      id: randomUUID(),
      cnpj: snapshot.cnpj,
      razaoSocial: snapshot.razaoSocial,
      segmento: snapshot.segmento,
      fpasCode: snapshot.fpasCode,
      isDesonerada: snapshot.isDesonerada,
      colaboradores: snapshot.colaboradores,
      baseInputType: snapshot.baseInputType ?? "colaboradores",
      folhaMedia: snapshot.folhaMedia ?? null,
      createdAt: new Date(),
    };
    this.snapshotsData.push(created);
    return created;
  }

  async getCompanySnapshot(id: string): Promise<CompanySnapshot | undefined> {
    return this.snapshotsData.find((s) => s.id === id);
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const created: Simulation = {
      id: randomUUID(),
      leadId: simulation.leadId,
      companySnapshotId: simulation.companySnapshotId,
      salarioMinimo: simulation.salarioMinimo,
      aliquotaFpas: simulation.aliquotaFpas,
      aliquotaRat: simulation.aliquotaRat,
      mesesProjetados: simulation.mesesProjetados,
      baseInputType: simulation.baseInputType ?? "colaboradores",
      folhaMedia: simulation.folhaMedia ?? null,
      baseFolha: simulation.baseFolha,
      impostoMensalEstimado: simulation.impostoMensalEstimado,
      totalProjetado: simulation.totalProjetado,
      creditoEstimadoTotal: simulation.creditoEstimadoTotal,
      creditoVerde: simulation.creditoVerde,
      creditoAmarelo: simulation.creditoAmarelo,
      creditoVermelho: simulation.creditoVermelho,
      createdAt: new Date(),
    };
    this.simulationsData.push(created);
    return created;
  }

  async getSimulation(id: string): Promise<Simulation | undefined> {
    return this.simulationsData.find((s) => s.id === id);
  }

  async getSimulationsWithDetails(id: string): Promise<{ simulation: Simulation; companySnapshot: CompanySnapshot; lead: Lead } | undefined> {
    const simulation = this.simulationsData.find((s) => s.id === id);
    if (!simulation) return undefined;

    const companySnapshot = this.snapshotsData.find((s) => s.id === simulation.companySnapshotId);
    const lead = this.leadsData.find((l) => l.id === simulation.leadId);
    if (!companySnapshot || !lead) return undefined;

    return { simulation, companySnapshot, lead };
  }

  async createSimulationWithSnapshot(params: {
    lead: InsertLead | Lead;
    companySnapshot: InsertCompanySnapshot;
    simulation: Omit<InsertSimulation, 'leadId' | 'companySnapshotId'>;
  }): Promise<{ lead: Lead; companySnapshot: CompanySnapshot; simulation: Simulation }> {
    let lead: Lead;
    if ("id" in params.lead) {
      lead = params.lead;
      if (!this.leadsData.some((l) => l.id === lead.id)) {
        this.leadsData.push(lead);
      }
    } else {
      lead = await this.createLead(params.lead);
    }

    const companySnapshot = await this.createCompanySnapshot(params.companySnapshot);
    const simulation = await this.createSimulation({
      ...params.simulation,
      leadId: lead.id,
      companySnapshotId: companySnapshot.id,
    });

    return { lead, companySnapshot, simulation };
  }

  async getCalculationParams(): Promise<CalculationParams | undefined> {
    return this.calcParamsData;
  }

  async upsertCalculationParams(params: InsertCalculationParams): Promise<CalculationParams> {
    const now = new Date();
    if (this.calcParamsData) {
      this.calcParamsData = {
        ...this.calcParamsData,
        ...params,
        updatedAt: now,
      };
      return this.calcParamsData;
    }

    this.calcParamsData = {
      id: randomUUID(),
      ...params,
      createdAt: now,
      updatedAt: now,
    };
    return this.calcParamsData;
  }

  async getAllFpas(): Promise<Fpas[]> {
    return [...this.fpasData].sort((a, b) => a.code.localeCompare(b.code));
  }

  async getFpasByCode(code: string): Promise<Fpas | undefined> {
    return this.fpasData.find((entry) => entry.code === code);
  }

  async createFpas(fpasInput: InsertFpas): Promise<Fpas> {
    if (this.fpasData.some((entry) => entry.code === fpasInput.code)) {
      throw new Error(`FPAS code already exists: ${fpasInput.code}`);
    }

    const now = new Date();
    const created: Fpas = {
      id: randomUUID(),
      ...fpasInput,
      createdAt: now,
      updatedAt: now,
    };
    this.fpasData.push(created);
    return created;
  }

  async updateFpas(id: string, fpasInput: Partial<InsertFpas>): Promise<Fpas> {
    const index = this.fpasData.findIndex((entry) => entry.id === id);
    if (index < 0) {
      throw new Error("FPAS not found");
    }

    const current = this.fpasData[index];
    const updated: Fpas = {
      ...current,
      ...fpasInput,
      updatedAt: new Date(),
    };
    this.fpasData[index] = updated;
    return updated;
  }

  async deleteFpas(id: string): Promise<void> {
    this.fpasData = this.fpasData.filter((entry) => entry.id !== id);
  }

  async getEmailSettings(): Promise<EmailSettings | undefined> {
    return this.emailSettingsData;
  }

  async upsertEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const now = new Date();
    if (this.emailSettingsData) {
      this.emailSettingsData = {
        ...this.emailSettingsData,
        enabled: settings.enabled ?? this.emailSettingsData.enabled,
        fromEmail: settings.fromEmail ?? this.emailSettingsData.fromEmail,
        fromName: settings.fromName ?? this.emailSettingsData.fromName,
        subject: settings.subject ?? this.emailSettingsData.subject,
        bodyTemplate: settings.bodyTemplate ?? this.emailSettingsData.bodyTemplate,
        updatedAt: now,
      };
      return this.emailSettingsData;
    }

    this.emailSettingsData = {
      id: randomUUID(),
      enabled: settings.enabled ?? false,
      fromEmail: settings.fromEmail ?? "noreply@msh.adv.br",
      fromName: settings.fromName ?? "Machado Schutz Advogados e Associados",
      subject: settings.subject ?? "Seu Diagnóstico Previdenciário",
      bodyTemplate:
        settings.bodyTemplate ??
        "Olá {{name}},\n\nSegue em anexo o seu diagnóstico previdenciário.\n\nAtenciosamente,\nMachado Schutz Advogados e Associados",
      createdAt: now,
      updatedAt: now,
    };
    return this.emailSettingsData;
  }

  async getWebhookSettings(): Promise<WebhookSettings | undefined> {
    return this.webhookSettingsData;
  }

  async upsertWebhookSettings(settings: InsertWebhookSettings): Promise<WebhookSettings> {
    const now = new Date();
    if (this.webhookSettingsData) {
      this.webhookSettingsData = {
        ...this.webhookSettingsData,
        enabled: settings.enabled ?? this.webhookSettingsData.enabled,
        url: settings.url ?? this.webhookSettingsData.url,
        headers: settings.headers ?? this.webhookSettingsData.headers,
        retryCount: settings.retryCount ?? this.webhookSettingsData.retryCount,
        updatedAt: now,
      };
      return this.webhookSettingsData;
    }

    this.webhookSettingsData = {
      id: randomUUID(),
      enabled: settings.enabled ?? false,
      url: settings.url ?? "",
      headers: settings.headers ?? "{}",
      retryCount: settings.retryCount ?? 3,
      createdAt: now,
      updatedAt: now,
    };
    return this.webhookSettingsData;
  }

  async getAppSettings(): Promise<AppSettings | undefined> {
    return this.appSettingsData;
  }

  async upsertAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const now = new Date();
    if (this.appSettingsData) {
      this.appSettingsData = {
        ...this.appSettingsData,
        privacyPolicyUrl: settings.privacyPolicyUrl ?? this.appSettingsData.privacyPolicyUrl,
        updatedAt: now,
      };
      return this.appSettingsData;
    }

    this.appSettingsData = {
      id: randomUUID(),
      privacyPolicyUrl: settings.privacyPolicyUrl ?? "https://msh.adv.br/politica-de-privacidade/",
      createdAt: now,
      updatedAt: now,
    };
    return this.appSettingsData;
  }
}

const useInMemoryStorage =
  process.env.STORAGE_MODE === "memory" ||
  (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production");

export const storage: IStorage = useInMemoryStorage
  ? new InMemoryStorage()
  : new DatabaseStorage();
