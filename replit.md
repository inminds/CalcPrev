# Calculadora Previdenciária - Machado Schutz V1

## Visão Geral
Aplicação web para estimativa de oportunidades de crédito previdenciário. Gera leads qualificados para o time comercial da Machado Schutz.

## Arquitetura

### Stack Tecnológica
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + Node.js
- **ORM**: Drizzle ORM
- **Banco de Dados**: PostgreSQL
- **PDF**: PDFKit para geração server-side

### Estrutura do Projeto
```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── lib/            # Utilitários e helpers
│   │   └── hooks/          # React hooks customizados
├── server/                 # Backend Express
│   ├── routes.ts           # Rotas da API
│   ├── storage.ts          # Camada de persistência
│   ├── calculation.ts      # Lógica de cálculo previdenciário
│   ├── pdf-generator.ts    # Geração de PDF
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

## Changelog

### V1 (2026-01-27)
- Formulário público de cálculo previdenciário
- Consulta automática de CNPJ via BrasilAPI
- Motor de cálculo com regras de negócio PRD
- Visualização de resultado com semáforo de risco
- Geração de PDF institucional
- Backoffice com gestão de parâmetros, FPAS e leads
- Exportação de leads em CSV
- Autenticação segura com tokens temporários
