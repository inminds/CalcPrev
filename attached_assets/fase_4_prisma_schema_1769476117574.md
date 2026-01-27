# FASE 4 — Prisma Schema

## Instruções Executáveis para IA
Copie este schema **integralmente** para o arquivo schema.prisma.

## Objetivo
Definir a modelagem de dados da Calculadora Previdenciária de forma clara, escalável e preparada para evolução futura (V2).

## Princípios de Modelagem
- Clareza e rastreabilidade
- Histórico imutável de simulações
- Separação entre parâmetros e resultados
- Preparação para autenticação e documentos futuros

## Entidades Principais
- Lead
- CompanySnapshot
- Simulation
- CalculationParams
- FPAS

## Boas Práticas
- Uso de Decimal para valores monetários
- Snapshot de dados da empresa por simulação
- Parâmetros centralizados no backoffice

## Resultado da Fase
Schema Prisma pronto para uso no Replit, compatível com SQLite (V1) e preparado para PostgreSQL (V2).

---

**Projeto: Calculadora Previdenciária — V1**

> **Premissas de modelagem**

* Clareza > excesso de normalização
* Auditoria e rastreabilidade
* Preparado para:

  * V2 (auth, portal, XML, eSocial)
  * Crescimento de volume
* Compatível com **SQLite (V1)**

---

## 📦 Entidades Principais

### 1️⃣ Lead

Representa o contato comercial gerado pela calculadora.

```prisma
model Lead {
  id            String      @id @default(uuid())
  name          String
  email         String
  phone         String?
  createdAt     DateTime    @default(now())

  simulations   Simulation[]

  @@index([email])
}
```

---

### 2️⃣ CompanySnapshot

Snapshot da empresa no momento da simulação
(evita inconsistência histórica se dados mudarem no futuro).

```prisma
model CompanySnapshot {
  id                    String   @id @default(uuid())
  cnpj                  String
  razaoSocial           String
  segmento               String
  fpasCode              String
  isDesonerada           Boolean
  colaboradores          Int

  createdAt             DateTime @default(now())

  simulations            Simulation[]
}
```

---

### 3️⃣ Simulation

Coração do sistema. Guarda **input + output do cálculo**.

```prisma
model Simulation {
  id                       String   @id @default(uuid())

  // Relacionamentos
  leadId                   String
  companySnapshotId        String

  lead                     Lead     @relation(fields: [leadId], references: [id])
  companySnapshot          CompanySnapshot @relation(fields: [companySnapshotId], references: [id])

  // Inputs de cálculo
  salarioMinimo            Decimal
  aliquotaFpas             Decimal
  aliquotaRat              Decimal
  mesesProjetados          Int

  // Resultados
  baseFolha                Decimal
  impostoMensalEstimado    Decimal
  totalProjetado           Decimal
  creditoEstimadoTotal     Decimal

  // Split Semáforo
  creditoVerde             Decimal
  creditoAmarelo           Decimal
  creditoVermelho          Decimal

  createdAt                DateTime @default(now())

  @@index([createdAt])
}
```

---

### 4️⃣ CalculationParams

Parâmetros globais configuráveis pelo **Backoffice (admin)**.

```prisma
model CalculationParams {
  id                     String   @id @default(uuid())

  salarioMinimo          Decimal
  percentualCredito      Decimal   // Ex: 0.20

  percentualVerde        Decimal   // Ex: 0.15
  percentualAmarelo      Decimal   // Ex: 0.35
  percentualVermelho     Decimal   // Ex: 0.50

  mesesProjecao          Int       // Default: 65

  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

> 🔎 **Boa prática**: manter **apenas um registro ativo**
> (opcionalmente controlar via flag `isActive` se quiser).

---

### 5️⃣ FPAS (Tabela de Apoio)

Tabela estática + administrável no backoffice.

```prisma
model Fpas {
  id             String   @id @default(uuid())
  code           String   @unique
  descricao      String

  aliquotaTerceiros Decimal

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 🔮 Preparação para V2 (sem implementar agora)

Esse schema já permite, futuramente:

* 🔐 adicionar `User`, `Role`, `Permission`
* 📄 relacionar `Document` (XML / PDF)
* 🔁 versionar simulações
* 🔗 integrar CRM sem refactor

Nada aqui será jogado fora. **Capital técnico preservado.**

---

## 🧠 Observações Estratégicas (importantes)

* **Snapshot de empresa** evita bugs jurídicos
* **Simulation imutável** = histórico confiável
* **Params separados** = governança clara
* **Decimal em tudo que é dinheiro** (não Float!)