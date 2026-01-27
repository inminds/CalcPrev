# PRD — Calculadora Previdenciária (V1)

## 1. Visão Geral

A **Calculadora Previdenciária** é uma aplicação web pública, integrada ao site institucional da Machado Schutz, com o objetivo de **estimar oportunidades de crédito previdenciário** de forma rápida, confiável e orientada à geração de leads qualificados para o time comercial.

Inspirada no racional histórico já validado em Excel, a solução traduz o conhecimento jurídico-previdenciário em um **ativo digital escalável**, mantendo simplicidade operacional na V1 e preparando o terreno para evoluções futuras (V2).

---

## 2. Objetivo de Negócio

- Aumentar a geração de leads qualificados via site institucional.
- Apoiar o time comercial na pré-venda e diagnóstico inicial.
- Padronizar e profissionalizar a apresentação da oportunidade de crédito.
- Reduzir atrito no processo de entendimento do valor potencial do projeto.

**KPI primário:** número de leads gerados.  
**KPI secundário:** taxa de conversão lead → proposta.

---

## 3. Escopo da Versão

### 3.1 Dentro do Escopo (V1)

- **Simular** oportunidade de crédito previdenciário.
- **Capturar** leads (nome, e-mail, telefone opcional).
- **Gerar** resultado do diagnóstico em tela.
- **Enviar** automaticamente PDF com o diagnóstico por e-mail.
- **Persistir** dados de simulação e leads em banco de dados.
- **Disponibilizar** backoffice admin-only para gestão de parâmetros.
- **Exportar** leads em formato CSV.
- **Integrar** opcionalmente com disparo de notificações via webhook (Microsoft Teams, Power Automate, N8N etc.).

### 3.2 Fora do Escopo (Roadmap / V2)

- Upload e leitura de XML (eSocial) e PDF.
- Retificação via webservice do eSocial.
- Portal autenticado para clientes.
- Integração com CRM.

---

## 4. Personas

### 4.1 Cliente Externo

Empresa que acessa o site da Machado Schutz buscando identificar oportunidades de recuperação de crédito previdenciário.

### 4.2 Consultor Comercial

Profissional da Machado Schutz que utiliza a calculadora como ferramenta de apoio em reuniões comerciais.

### 4.3 Administrador (Backoffice)

Usuário interno responsável por manter parâmetros de cálculo e exportar leads.

---

## 5. Jornada do Usuário (Cliente / Comercial)

1. Usuário acessa o site da Machado Schutz.
2. Clica em “Calculadora Previdenciária / Faça sua Pré-Análise”.
3. Preenche os dados da empresa.
4. Informa nome e e-mail (telefone opcional).
5. Submete o formulário.
6. Visualiza o diagnóstico em tela.
7. Recebe o PDF automaticamente por e-mail.
8. Lead é armazenado para o time comercial.
9. Time comercial recebe um alerta via webhook customizado e parametrizado pelo admin.

---

## 6. Dados de Entrada

### 6.1 Dados da Empresa

- CNPJ (obrigatório).
- Razão Social (auto-preenchido pela API pública e, caso não encontrada, permitir preenchimento manual).
- Segmento (auto-preenchido pela API pública e, caso não encontrado, selecionado a partir da lista SegmentoCodFpas).
- Enquadramento Previdenciário (FPAS), derivado do segmento informado.
- Empresa desonerada: Sim / Não.
- Quantidade de colaboradores.

### 6.2 Dados do Lead

- Nome (obrigatório).
- E-mail (obrigatório).
- Telefone (opcional).

---

## 7. Regras de Negócio (Cálculo)

> Os cálculos apresentados têm caráter **estimativo**, não vinculante, e servem exclusivamente como diagnóstico preliminar.

### 7.1 Parâmetros Base (Configuráveis no Backoffice)

- Salário mínimo vigente.
- Percentual de crédito estimado: **20%**.
- Projeção temporal: **65 meses**.
- Split de risco:
  - Verde (baixo risco): **15%**
  - Amarelo (médio risco): **35%**
  - Vermelho (alto risco): **50%**

### 7.2 Cálculo

1. Base da folha = salário mínimo × quantidade de colaboradores.
2. Aplicar alíquotas conforme:
   - FPAS (terceiros).
   - Empresa desonerada ou não.
3. Calcular imposto mensal estimado.
4. Projetar valores para 65 meses.
5. Calcular crédito estimado (20% do total projetado).
6. Distribuir crédito por semáforo (verde / amarelo / vermelho).

---

## 8. Resultado Apresentado ao Usuário

- Base de contribuição.
- Imposto mensal estimado.
- Valor total projetado (65 meses).
- Crédito previdenciário estimado.
- Visualização gráfica do split de risco (semáforo).
- Texto institucional explicativo padrão.

---

## 9. PDF Gerado

O PDF enviado por e-mail deve conter:

- Identificação da empresa.
- Resumo executivo do diagnóstico.
- Valores calculados.
- Representação visual do semáforo.
- Texto institucional da Machado Schutz.
- Aviso legal (disclaimer).

---

## 10. Backoffice (Admin-only)

Funcionalidades:

- Atualizar salário mínimo.
- Atualizar percentuais (20%, 15/35/50).
- Manter tabela FPAS e alíquotas.
- Visualizar lista de leads.
- Exportar leads em CSV.

Acesso restrito por mecanismo simples de autenticação administrativa (V1).

---

## 11. Requisitos Não Funcionais

- Interface simples, responsiva e institucional.
- Performance adequada para uso público.
- Logs básicos de erro.
- Código preparado para evolução futura.

---

## 12. Stack Tecnológica (Confirmada)

- Frontend: **Next.js / React**
- Backend: **Node.js (API Routes)**
- ORM: **Prisma**
- Banco de Dados: **SQLite (V1)**
- Infra: **Replit**
- PDF: **Geração server-side**

---

## 13. Riscos e Mitigações

- **Interpretação incorreta do cálculo** → Validação prévia com especialista.
- **Expectativa do cliente** → Disclaimer claro no PDF e na tela.
- **Escopo inflado** → Fora de escopo documentado (V2).

---

## 14. Roadmap Indicativo

- V1: Calculadora + Lead + PDF.
- V2: Upload XML/PDF, eSocial, CRM, Portal do Cliente.

---

**Status:** PRD aprovado para execução técnica.

