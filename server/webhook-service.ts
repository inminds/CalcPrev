import { storage } from './storage';
import type { Lead, Simulation, CompanySnapshot } from '@shared/schema';

interface WebhookPayload {
  event: 'lead.created';
  timestamp: string;
  data: {
    lead: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      consentedAt: string | null;
      createdAt: string;
    };
    simulation: {
      id: string;
      baseFolha: string;
      impostoMensalEstimado: string;
      totalProjetado: string;
      creditoEstimadoTotal: string;
      creditoVerde: string;
      creditoAmarelo: string;
      creditoVermelho: string;
      createdAt: string;
    };
    company: {
      cnpj: string;
      razaoSocial: string;
      segmento: string;
      fpasCode: string;
      isDesonerada: boolean;
      colaboradores: number;
    };
  };
}

interface SendWebhookParams {
  lead: Lead;
  simulation: Simulation;
  companySnapshot: CompanySnapshot;
}

function isTeamsWebhook(url: string): boolean {
  return url.includes('webhook.office.com');
}

function formatBRL(value: string): string {
  const num = parseFloat(value);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
  }
  return cnpj;
}

function buildTeamsAdaptiveCard(payload: WebhookPayload): object {
  const { lead, simulation, company } = payload.data;
  const dashboardUrl = `${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : ''}/admin/dashboard`;

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "Container",
              style: "emphasis",
              items: [
                {
                  type: "TextBlock",
                  text: "Novo Lead - Calculadora Previdenciaria",
                  weight: "Bolder",
                  size: "Large",
                  color: "Good"
                },
                {
                  type: "TextBlock",
                  text: `Recebido em ${new Date(payload.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
                  size: "Small",
                  isSubtle: true
                }
              ]
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: "Dados do Lead",
                  weight: "Bolder",
                  size: "Medium",
                  spacing: "Medium"
                },
                {
                  type: "FactSet",
                  facts: [
                    { title: "Nome", value: lead.name },
                    { title: "E-mail", value: lead.email },
                    { title: "Telefone", value: lead.phone || "Nao informado" }
                  ]
                }
              ]
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: "Dados da Empresa",
                  weight: "Bolder",
                  size: "Medium",
                  spacing: "Medium"
                },
                {
                  type: "FactSet",
                  facts: [
                    { title: "Razao Social", value: company.razaoSocial },
                    { title: "CNPJ", value: formatCNPJ(company.cnpj) },
                    { title: "Segmento", value: company.segmento },
                    { title: "FPAS", value: company.fpasCode },
                    { title: "Colaboradores", value: String(company.colaboradores) },
                    { title: "Desonerada", value: company.isDesonerada ? "Sim" : "Nao" }
                  ]
                }
              ]
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: "Resultado da Simulacao",
                  weight: "Bolder",
                  size: "Medium",
                  spacing: "Medium"
                },
                {
                  type: "FactSet",
                  facts: [
                    { title: "Base da Folha", value: formatBRL(simulation.baseFolha) },
                    { title: "Imposto Mensal", value: formatBRL(simulation.impostoMensalEstimado) },
                    { title: "Total Projetado", value: formatBRL(simulation.totalProjetado) },
                    { title: "Credito Estimado Total", value: formatBRL(simulation.creditoEstimadoTotal) }
                  ]
                }
              ]
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: "Distribuicao de Risco",
                  weight: "Bolder",
                  size: "Medium",
                  spacing: "Medium"
                },
                {
                  type: "ColumnSet",
                  columns: [
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: "Verde (Baixo)",
                          color: "Good",
                          weight: "Bolder",
                          horizontalAlignment: "Center"
                        },
                        {
                          type: "TextBlock",
                          text: formatBRL(simulation.creditoVerde),
                          horizontalAlignment: "Center"
                        }
                      ]
                    },
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: "Amarelo (Medio)",
                          color: "Warning",
                          weight: "Bolder",
                          horizontalAlignment: "Center"
                        },
                        {
                          type: "TextBlock",
                          text: formatBRL(simulation.creditoAmarelo),
                          horizontalAlignment: "Center"
                        }
                      ]
                    },
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: "Vermelho (Alto)",
                          color: "Attention",
                          weight: "Bolder",
                          horizontalAlignment: "Center"
                        },
                        {
                          type: "TextBlock",
                          text: formatBRL(simulation.creditoVermelho),
                          horizontalAlignment: "Center"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          actions: dashboardUrl ? [
            {
              type: "Action.OpenUrl",
              title: "Ver Leads no Dashboard",
              url: dashboardUrl
            }
          ] : []
        }
      }
    ]
  };
}

async function sendWithRetry(
  url: string,
  body: object,
  headers: Record<string, string>,
  retryCount: number
): Promise<{ success: boolean; error?: string }> {
  let lastError: string = '';
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        console.log(`[Webhook] Success on attempt ${attempt + 1}`);
        return { success: true };
      }

      const responseBody = await response.text().catch(() => '');
      lastError = `HTTP ${response.status}: ${response.statusText}${responseBody ? ` - ${responseBody}` : ''}`;
      console.log(`[Webhook] Attempt ${attempt + 1} failed: ${lastError}`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[Webhook] Attempt ${attempt + 1} failed: ${lastError}`);
    }

    if (attempt < retryCount) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[Webhook] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: lastError };
}

export async function sendLeadWebhook(params: SendWebhookParams): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookConfig = await storage.getWebhookSettings();
    
    if (!webhookConfig || !webhookConfig.enabled || !webhookConfig.url) {
      console.log('[Webhook] Webhook is disabled or URL not configured');
      return { success: false, error: 'Webhook is disabled or URL not configured' };
    }

    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(webhookConfig.headers);
    } catch {
      console.log('[Webhook] Invalid headers JSON, using empty headers');
    }

    const payload: WebhookPayload = {
      event: 'lead.created',
      timestamp: new Date().toISOString(),
      data: {
        lead: {
          id: params.lead.id,
          name: params.lead.name,
          email: params.lead.email,
          phone: params.lead.phone,
          consentedAt: params.lead.consentedAt?.toISOString() || null,
          createdAt: params.lead.createdAt.toISOString(),
        },
        simulation: {
          id: params.simulation.id,
          baseFolha: params.simulation.baseFolha,
          impostoMensalEstimado: params.simulation.impostoMensalEstimado,
          totalProjetado: params.simulation.totalProjetado,
          creditoEstimadoTotal: params.simulation.creditoEstimadoTotal,
          creditoVerde: params.simulation.creditoVerde,
          creditoAmarelo: params.simulation.creditoAmarelo,
          creditoVermelho: params.simulation.creditoVermelho,
          createdAt: params.simulation.createdAt.toISOString(),
        },
        company: {
          cnpj: params.companySnapshot.cnpj,
          razaoSocial: params.companySnapshot.razaoSocial,
          segmento: params.companySnapshot.segmento,
          fpasCode: params.companySnapshot.fpasCode,
          isDesonerada: params.companySnapshot.isDesonerada,
          colaboradores: params.companySnapshot.colaboradores,
        },
      },
    };

    const isTeams = isTeamsWebhook(webhookConfig.url);
    let body: object;

    if (isTeams) {
      console.log('[Webhook] Teams webhook detected, using Adaptive Card format');
      body = buildTeamsAdaptiveCard(payload);
      const { Authorization, authorization, ...cleanHeaders } = headers;
      headers = cleanHeaders;
    } else {
      body = payload;
    }

    console.log('[Webhook] Sending webhook to:', webhookConfig.url);
    const result = await sendWithRetry(webhookConfig.url, body, headers, webhookConfig.retryCount);

    if (result.success) {
      console.log('[Webhook] Webhook sent successfully');
    } else {
      console.error('[Webhook] Failed to send webhook after retries:', result.error);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Webhook] Unexpected error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
