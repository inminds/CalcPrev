# FASE 3 — Prompt para Replit Assistant

## Instruções Executáveis para IA
- Você deve seguir este prompt integralmente
- Não tomar decisões fora do escopo
- Usar exatamente a stack definida
- Gerar frontend, backend, banco, PDF e backoffice

---

# 🚀 PROMPT — REPLIT ASSISTANT

### Projeto: Calculadora Previdenciária (Machado Schutz) — V1

> **Contexto e Papel**
> Você é um **Engenheiro de Software Sênior Full Stack**, especialista em aplicações web modernas, com foco em **Next.js, Node.js, Prisma e geração de PDF server-side**.
> Seu objetivo é desenvolver uma aplicação web chamada **Calculadora Previdenciária**, seguindo rigorosamente o PRD fornecido abaixo.
> Evite decisões criativas fora do escopo. Priorize clareza, previsibilidade e código pronto para evolução futura (V2).

---

## 🎯 Objetivo da Aplicação

Criar uma **aplicação web pública**, integrada ao site institucional da Machado Schutz, para:

* Simular oportunidade de crédito previdenciário
* Gerar diagnóstico estimativo
* Capturar leads qualificados
* Enviar automaticamente um PDF com o resultado
* Disponibilizar um backoffice administrativo simples (V1)

---

## Estratégia
- Reduzir ambiguidade
- Evitar decisões criativas fora do escopo
- Garantir aderência total ao PRD

---

## 🧱 Stack Tecnológica (obrigatória)

* **Frontend:** Next.js + React
* **Backend:** Node.js (API Routes do Next.js)
* **ORM:** Prisma
* **Banco de Dados:** SQLite
* **Infra:** Replit
* **PDF:** Geração server-side (ex: pdf-lib ou pdfkit)

---

## 📐 Funcionalidades — Escopo V1

### Público (sem autenticação)

* Formulário com:

  * CNPJ
  * Razão Social (auto-preenchida via API pública, fallback manual)
  * Segmento
  * Enquadramento Previdenciário (FPAS)
  * Empresa desonerada (Sim / Não)
  * Quantidade de colaboradores
  * Nome do contato
  * E-mail
  * Telefone (opcional)

* Ao submeter:

  * Executar o cálculo previdenciário
  * Exibir o diagnóstico em tela
  * Persistir dados no banco
  * Enviar PDF por e-mail ao usuário
  * Registrar o lead
  * Disparar webhook opcional (configurável)

---

### Backoffice (Admin-only)

* Rota protegida por **senha definida em `.env`**
* Funcionalidades:

  * Atualizar salário mínimo
  * Atualizar percentuais:

    * Crédito estimado (20%)
    * Split semáforo (15% / 35% / 50%)
  * Gerenciar tabela FPAS e alíquotas
  * Listar leads
  * Exportar leads em CSV

---

## 🧮 Regras de Negócio (Cálculo)

* Base da folha = salário mínimo × quantidade de colaboradores
* Aplicar alíquotas conforme:

  * FPAS (terceiros)
  * Empresa desonerada ou não
* Calcular:

  * Imposto mensal estimado
  * Projeção para **65 meses**
  * Crédito estimado = **20%** do total projetado
* Distribuir crédito em:

  * Verde (15%)
  * Amarelo (35%)
  * Vermelho (50%)

> ⚠️ Todos os cálculos são **estimativos e não vinculantes**.

---

## 📄 PDF Gerado

* Layout institucional simples (clean)
* Conteúdo:

  * Identificação da empresa
  * Resumo executivo
  * Valores calculados
  * **Semáforo em blocos coloridos com percentuais**
  * Texto institucional padrão
  * Disclaimer legal

⚠️ Não usar gráficos de donut ou barras.

---

## 🗂️ Modelagem de Dados (orientação)

Crie modelos no Prisma para:

* Lead
* Simulation
* CompanySnapshot
* CalculationParams
* FPAS / Aliquotas

Prepare o schema pensando em **evolução futura (V2)**.

---

## 🚫 Fora de Escopo (não implementar)

* Upload de XML ou PDF
* Retificação via eSocial
* Portal autenticado para cliente
* Integração com CRM
* Controle de perfis (V2)

---

## 🧠 Boas Práticas Esperadas

* Código organizado e legível
* Separação clara entre cálculo, persistência e apresentação
* Comentários explicativos nas regras de negócio
* Preparar o projeto para fácil evolução futura

---

**Entrega esperada:**
Aplicação funcional, rodando no Replit, com frontend, backend, banco, PDF e backoffice administrativo.

---


