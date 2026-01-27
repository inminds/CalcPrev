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

async function sendWithRetry(
  url: string,
  payload: WebhookPayload,
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
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`[Webhook] Success on attempt ${attempt + 1}`);
        return { success: true };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;
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

    console.log('[Webhook] Sending webhook to:', webhookConfig.url);
    const result = await sendWithRetry(webhookConfig.url, payload, headers, webhookConfig.retryCount);

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
