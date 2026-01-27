# FASE 5 — Flowcharts (Mermaid)

## Objetivo
Documentar visualmente os fluxos principais da aplicação, garantindo alinhamento entre negócio, tecnologia e futuras evoluções.

## Fluxos Documentados

### 1. Fluxo do Usuário
- Acesso ao site
- Preenchimento do formulário
- Execução do cálculo
- Exibição do diagnóstico
- Geração de PDF
- Captura de lead

### 2. Fluxo de Cálculo Previdenciário
- Obtenção de parâmetros
- Cálculo da base da folha
- Aplicação de alíquotas
- Projeção de valores
- Distribuição do crédito por semáforo

### 3. Fluxo do Backoffice
- Autenticação simples (V1)
- Gestão de parâmetros
- Gestão de FPAS
- Visualização e exportação de leads

## Benefícios
- Facilita entendimento do sistema
- Serve como referência para IA e desenvolvedores
- Base sólida para documentação e auditoria

## Status
Fluxos definidos e prontos para uso.


---

## Instruções Executáveis para IA

### Como usar este arquivo
- Leia este documento como **fonte prescritiva**, não apenas conceitual.
- Siga exatamente a ordem e as restrições aqui descritas.

### Ordem obrigatória de execução
1. Ler completamente o PRD (FASE 2).
2. Usar este documento como guia para gerar o código.
3. Não implementar nada fora do escopo descrito.

### Restrições
- Não criar autenticação de usuários finais.
- Não integrar CRM.
- Não implementar upload de arquivos.

### Resultado esperado
- Aplicação funcional conforme PRD.
- Código organizado, comentado e pronto para evolução V2.


---

## Instruções Executáveis para IA

### Como usar este arquivo
Este documento define **a modelagem de dados obrigatória** da aplicação. A IA deve gerar o arquivo `schema.prisma` exatamente conforme abaixo.

### Prisma Schema (copiar integralmente)
```prisma
model Lead {
  id          String   @id @default(uuid())
  name        String
  email       String
  phone       String?
  createdAt   DateTime @default(now())

  simulations Simulation[]

  @@index([email])
}

model CompanySnapshot {
  id             String   @id @default(uuid())
  cnpj           String
  razaoSocial    String
  segmento       String
  fpasCode       String
  isDesonerada   Boolean
  colaboradores  Int

  createdAt      DateTime @default(now())

  simulations    Simulation[]
}

model Simulation {
  id                    String   @id @default(uuid())

  leadId                String
  companySnapshotId     String

  lead                  Lead @relation(fields: [leadId], references: [id])
  companySnapshot       CompanySnapshot @relation(fields: [companySnapshotId], references: [id])

  salarioMinimo         Decimal
  aliquotaFpas          Decimal
  aliquotaRat           Decimal
  mesesProjetados       Int

  baseFolha             Decimal
  impostoMensalEstimado Decimal
  totalProjetado        Decimal
  creditoEstimadoTotal  Decimal

  creditoVerde          Decimal
  creditoAmarelo        Decimal
  creditoVermelho       Decimal

  createdAt             DateTime @default(now())
}

model CalculationParams {
  id                  String   @id @default(uuid())

  salarioMinimo       Decimal
  percentualCredito   Decimal

  percentualVerde     Decimal
  percentualAmarelo   Decimal
  percentualVermelho  Decimal

  mesesProjecao       Int

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Fpas {
  id                 String   @id @default(uuid())
  code               String   @unique
  descricao          String
  aliquotaTerceiros  Decimal

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### Regras obrigatórias
- Usar `Decimal` para valores monetários.
- Não alterar nomes de entidades ou campos.
- Não normalizar além do definido.

