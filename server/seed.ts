import { db } from "./db";
import { fpas, calculationParams } from "@shared/schema";
import { sql } from "drizzle-orm";

const DEFAULT_FPAS = [
  { code: "507", descricao: "Indústria em Geral", aliquotaTerceiros: "0.058" },
  { code: "515", descricao: "Comércio Atacadista", aliquotaTerceiros: "0.058" },
  { code: "531", descricao: "Comércio Varejista", aliquotaTerceiros: "0.058" },
  { code: "540", descricao: "Serviços de Transporte Rodoviário", aliquotaTerceiros: "0.058" },
  { code: "550", descricao: "Serviços de Comunicações", aliquotaTerceiros: "0.058" },
  { code: "566", descricao: "Hotelaria e Hospedagem", aliquotaTerceiros: "0.058" },
  { code: "574", descricao: "Serviços de Saúde", aliquotaTerceiros: "0.058" },
  { code: "582", descricao: "Atividades Financeiras", aliquotaTerceiros: "0.058" },
  { code: "590", descricao: "Escritório e Consultoria", aliquotaTerceiros: "0.058" },
  { code: "604", descricao: "Construção Civil", aliquotaTerceiros: "0.058" },
  { code: "612", descricao: "Telecomunicações", aliquotaTerceiros: "0.058" },
  { code: "680", descricao: "Agricultura e Pecuária", aliquotaTerceiros: "0.028" },
  { code: "795", descricao: "Entidades Beneficentes", aliquotaTerceiros: "0.028" },
];

const DEFAULT_PARAMS = {
  salarioMinimo: "1412.00",
  percentualCredito: "0.20",
  percentualVerde: "0.15",
  percentualAmarelo: "0.35",
  percentualVermelho: "0.50",
  mesesProjecao: 65,
};

export async function seedDatabase() {
  try {
    const existingFpas = await db.select().from(fpas).limit(1);
    if (existingFpas.length === 0) {
      console.log("Seeding FPAS data...");
      await db.insert(fpas).values(DEFAULT_FPAS);
      console.log("FPAS data seeded successfully");
    }

    const existingParams = await db.select().from(calculationParams).limit(1);
    if (existingParams.length === 0) {
      console.log("Seeding calculation params...");
      await db.insert(calculationParams).values(DEFAULT_PARAMS);
      console.log("Calculation params seeded successfully");
    }

    console.log("Database seeding complete");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
