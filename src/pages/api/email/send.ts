import type { APIRoute } from 'astro';
import {
  sendEmail,
  renderWelcomeEmail,
  renderOrderConfirmationEmail,
  BRAND_SENDERS,
  type SendEmailParams,
  type WelcomeEmailData,
  type OrderEmailData,
} from '../../../lib/email';
import { getErrorMessage } from '../../../lib/errors';

export const prerender = false;

interface EmailRequestBody extends Partial<SendEmailParams> {
  template?: 'welcome' | 'order-confirmation';
  templateData?: WelcomeEmailData | OrderEmailData;
}

/**
 * Endpoint API para el envío directo y programático de correos electrónicos
 * utilizando el binding nativo de Cloudflare Email Sending bajo el dominio bella-forever.com
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as EmailRequestBody;

    if (!body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cuerpo de la petición inválido o vacío' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let sendParams: SendEmailParams;

    // Soporte para plantillas tipadas predefinidas
    if (body.template === 'welcome') {
      const data = (body.templateData || {}) as WelcomeEmailData;
      const targetTo = body.to || data.email;
      if (!targetTo) {
        return new Response(
          JSON.stringify({ success: false, error: 'Se requiere "to" o "templateData.email" para la plantilla welcome' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const rendered = renderWelcomeEmail({
        name: data.name,
        email: typeof targetTo === 'string' ? targetTo : (Array.isArray(targetTo) ? targetTo[0].toString() : targetTo.email),
      });

      sendParams = {
        to: targetTo,
        from: body.from || BRAND_SENDERS.WELCOME,
        subject: body.subject || rendered.subject,
        html: rendered.html,
        text: rendered.text,
        cc: body.cc,
        bcc: body.bcc,
        replyTo: body.replyTo,
      };
    } else if (body.template === 'order-confirmation') {
      const data = body.templateData as OrderEmailData | undefined;
      if (!data || !data.orderNumber || !data.items) {
        return new Response(
          JSON.stringify({ success: false, error: 'Datos de orden incompletos en templateData' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const targetTo = body.to || data.customerEmail;
      if (!targetTo) {
        return new Response(
          JSON.stringify({ success: false, error: 'Se requiere una dirección de correo para confirmar el pedido' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const rendered = renderOrderConfirmationEmail(data);

      sendParams = {
        to: targetTo,
        from: body.from || BRAND_SENDERS.ORDERS,
        subject: body.subject || rendered.subject,
        html: rendered.html,
        text: rendered.text,
        cc: body.cc,
        bcc: body.bcc,
        replyTo: body.replyTo,
      };
    } else {
      // Envío directo libre (como en el ejemplo de Cloudflare)
      if (!body.to || !body.subject || (!body.html && !body.text)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Campos requeridos: "to", "subject" y al menos "html" o "text"',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      sendParams = {
        to: body.to,
        from: body.from || BRAND_SENDERS.DEFAULT,
        subject: body.subject,
        html: body.html,
        text: body.text,
        cc: body.cc,
        bcc: body.bcc,
        replyTo: body.replyTo,
      };
    }

    const result = await sendEmail(sendParams);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMsg = getErrorMessage(error);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
