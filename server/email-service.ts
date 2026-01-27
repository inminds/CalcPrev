import { Resend } from 'resend';
import { storage } from './storage';
import type { Lead, Simulation, CompanySnapshot } from '@shared/schema';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

interface SendPdfEmailParams {
  lead: Lead;
  simulation: Simulation;
  companySnapshot: CompanySnapshot;
  pdfBuffer: Buffer;
}

export async function sendPdfEmail(params: SendPdfEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const emailConfig = await storage.getEmailSettings();
    
    if (!emailConfig || !emailConfig.enabled) {
      console.log('[Email] Email sending is disabled');
      return { success: false, error: 'Email sending is disabled' };
    }

    const { client, fromEmail: connectorFromEmail } = await getUncachableResendClient();
    
    const bodyText = emailConfig.bodyTemplate
      .replace(/\{\{name\}\}/g, params.lead.name)
      .replace(/\{\{razaoSocial\}\}/g, params.companySnapshot.razaoSocial)
      .replace(/\{\{cnpj\}\}/g, params.companySnapshot.cnpj);

    const result = await client.emails.send({
      from: `${emailConfig.fromName} <${connectorFromEmail || emailConfig.fromEmail}>`,
      to: params.lead.email,
      subject: emailConfig.subject,
      text: bodyText,
      attachments: [
        {
          filename: `diagnostico-previdenciario-${params.companySnapshot.cnpj.replace(/\D/g, '')}.pdf`,
          content: params.pdfBuffer.toString('base64'),
        },
      ],
    });

    if (result.error) {
      console.error('[Email] Error sending email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('[Email] Email sent successfully to:', params.lead.email);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Failed to send email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
