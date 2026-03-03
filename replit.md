# Calculadora Previdenciária - Machado Schutz V1.1

## Visão Geral
Aplicação web para estimativa de oportunidades de crédito previdenciário. Gera leads qualificados para o time comercial da Machado Schutz. V1.1 inclui automação de e-mail, webhook e compliance LGPD.

## Arquitetura

### Stack Tecnológica
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + Node.js
- **ORM**: Drizzle ORM
- **Banco de Dados**: PostgreSQL
- **PDF**: PDFKit para geração server-side
- **Email**: Resend API para envio de e-mails automáticos

### Estrutura do Projeto
```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     # Header, Footer, PublicLayout (reutilizáveis)
│   │   │   ├── language-switcher.tsx  # Seletor PT-BR / EN-US
│   │   │   └── ...         # Componentes de UI
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── lib/
│   │   │   ├── i18n.tsx    # Sistema de internacionalização (PT-BR / EN-US)
│   │   │   └── ...         # Utilitários e helpers
│   │   └── hooks/          # React hooks customizados
├── server/                 # Backend Express
│   ├── routes.ts           # Rotas da API
│   ├── storage.ts          # Camada de persistência
│   ├── calculation.ts      # Lógica de cálculo previdenciário
│   ├── pdf-generator.ts    # Geração de PDF
│   ├── email-service.ts    # Serviço de envio de e-mail (Resend)
│   ├── webhook-service.ts  # Serviço de webhook com retry
│   ├── seed.ts             # Dados iniciais (FPAS, parâmetros)
│   └── db.ts               # Conexão com PostgreSQL
├── shared/                 # Código compartilhado
│   └── schema.ts           # Modelos de dados Drizzle + Zod
```

## Modelos de Dados

### Lead
Contato comercial gerado pela calculadora (nome, email, telefone).

### CompanySnapshot
Snapshot imutável dos dados da empresa no momento da simulação.

### Simulation
Resultado do cálculo previdenciário com inputs e outputs.

### CalculationParams
Parâmetros configuráveis: salário mínimo, percentuais de crédito, meses de projeção.

### Fpas
Tabela de códigos FPAS com alíquotas de terceiros.

### EmailSettings (V1.1)
Configurações de envio de e-mail: habilitado, remetente, assunto, template.

### WebhookSettings (V1.1)
Configurações de webhook: habilitado, URL, headers JSON, quantidade de retries.

### AppSettings (V1.1)
Configurações gerais: URL da política de privacidade.

## Rotas da API

### Públicas
- `GET /api/fpas` - Lista todos os códigos FPAS
- `GET /api/cnpj/:cnpj` - Consulta CNPJ via BrasilAPI
- `POST /api/simulate` - Executa simulação previdenciária
- `GET /api/simulations/:id/pdf` - Gera PDF do diagnóstico

### Administrativas (requer autenticação)
- `POST /api/admin/login` - Login do administrador
- `GET /api/admin/params` - Obtém parâmetros de cálculo
- `PUT /api/admin/params` - Atualiza parâmetros
- `GET /api/admin/leads` - Lista todos os leads
- `GET /api/admin/leads/export` - Exporta leads em CSV
- `POST /api/admin/fpas` - Cria novo FPAS
- `PUT /api/admin/fpas/:id` - Atualiza FPAS
- `DELETE /api/admin/fpas/:id` - Remove FPAS
- `GET /api/admin/email-settings` - Obtém configurações de e-mail
- `PUT /api/admin/email-settings` - Atualiza configurações de e-mail
- `GET /api/admin/webhook-settings` - Obtém configurações de webhook
- `PUT /api/admin/webhook-settings` - Atualiza configurações de webhook
- `GET /api/admin/app-settings` - Obtém configurações do app (LGPD)
- `PUT /api/admin/app-settings` - Atualiza configurações do app

## Regras de Negócio (Cálculo)

1. **Base da Folha** = Salário Mínimo × Quantidade de Colaboradores
2. **Alíquota Total** = Alíquota FPAS (terceiros) + RAT (3% se não desonerada)
3. **Imposto Mensal** = Base da Folha × Alíquota Total
4. **Total Projetado** = Imposto Mensal × 65 meses
5. **Crédito Estimado** = Total Projetado × 20%
6. **Distribuição Semáforo**:
   - Verde (baixo risco): 15%
   - Amarelo (médio risco): 35%
   - Vermelho (alto risco): 50%

## Variáveis de Ambiente

- `DATABASE_URL` - URL de conexão PostgreSQL (automático no Replit)
- `ADMIN_PASSWORD` - Senha do backoffice administrativo (padrão: admin123)

## Comandos

```bash
npm run dev          # Inicia em desenvolvimento
npm run db:push      # Sincroniza schema com banco de dados
```

## URLs

- `/` - Calculadora pública
- `/admin` - Login do backoffice
- `/admin/dashboard` - Dashboard administrativo

## Identidade Visual - Machado Schutz

### Paleta de Cores
- **Primária**: #00513B (Verde Institucional) - Header, footer, botões principais
- **Secundária/Accent**: #D7AE81 (Dourado/Bege) - Detalhes e acentos
- **Texto Principal**: #1C1C1C (Preto Grafite)
- **Background**: #FFFFFF (Branco)
- **Muted**: Bege claro (seções alternadas)
- **Bordas**: Tom bege sutil

### Aplicação
- Header e footer com fundo verde institucional e texto branco
- Componentes reutilizáveis: Header, Footer, PublicLayout
- Seletor de idioma PT-BR / EN-US no header
- Tipografia: Helvetica Neue, tracking-tight, font-semibold nos headings
- Dark mode com variações do verde para manter identidade

## Consulta de CNPJ

### Fluxo
1. Usuário digita 14 dígitos do CNPJ
2. Após 500ms (debounce), consulta automática é disparada
3. APIs consultadas em ordem: BrasilAPI → ReceitaWS (fallback)
4. Campos preenchidos automaticamente: Razão Social, Segmento, FPAS

### Mapeamento CNAE → FPAS
- CNAE 01-03 (Agropecuária) → FPAS 787
- CNAE 10-33 (Indústria) → FPAS 507
- CNAE 41-43 (Construção) → FPAS 507
- CNAE 45-47 (Comércio) → FPAS 515
- CNAE 49-99 (Serviços) → FPAS 515

## Changelog

### V1.2 (2026-03-03)
- **Identidade Visual Padronizada**: Header, Footer e PublicLayout como componentes reutilizáveis
- **i18n (PT-BR / EN-US)**: Sistema de internacionalização com seletor de idioma no header
- **Paleta Atualizada**: Primary #00513B, Secondary/Accent #D7AE81 (dourado/bege)
- **Tipografia**: Helvetica Neue com headings tracking-tight e font-semibold
- **Webhook Teams**: Formato Adaptive Card para Microsoft Teams com detecção automática de URL
- **CSS Design System**: Utility classes glass-panel e card-elevated, variáveis padronizadas

### V1.1 (2026-01-27)
- **Automação de E-mail**: Envio automático de PDF via Resend após simulação
- **Webhook de Leads**: Notificação para sistemas externos (CRM) com retry e headers customizáveis
- **LGPD Compliance**: Checkbox obrigatório de consentimento com link configurável para política de privacidade
- **Admin Integrações**: Nova aba no backoffice para configurar e-mail, webhook e URL da política
- **Identidade visual Machado Schutz**: Paleta de cores verde institucional aplicada
- **PDF com logo Negativo_Dourado-Horizontal.png**: Logo horizontal com barra dourada no header do PDF
- Consulta de CNPJ com debounce e fallback de APIs
- Mapeamento automático CNAE → FPAS
- Dark mode com identidade visual preservada

### V1 (2026-01-27)
- Formulário público de cálculo previdenciário
- Consulta automática de CNPJ via BrasilAPI
- Motor de cálculo com regras de negócio PRD
- Visualização de resultado com semáforo de risco
- Geração de PDF institucional
- Backoffice com gestão de parâmetros, FPAS e leads
- Exportação de leads em CSV
- Autenticação segura com tokens temporários
