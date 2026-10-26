import { env } from 'cloudflare:workers';
import type { SendEmailParams, EmailSendResponse, EmailAddressInput } from './types';
import { BRAND_SENDERS, ADMIN_BCC_EMAILS } from './types';
import { renderOrderConfirmationEmail } from './templates/order-confirmation';
import type { OrderWithItems } from '../../db/schema';

/**
 * Convierte un HTML simple en texto plano legible para clientes de correo sin soporte HTML.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Normaliza una dirección o lista de direcciones para el binding de Cloudflare.
 */
function normalizeAddress(
  addr: EmailAddressInput
): string | { name: string; email: string } {
  if (typeof addr === 'string') {
    return addr.trim();
  }
  return {
    email: addr.email.trim(),
    name: addr.name?.trim() || '',
  };
}

function normalizeAddressList(
  addrs?: EmailAddressInput | EmailAddressInput[]
): (string | { name: string; email: string }) | (string | { name: string; email: string })[] | undefined {
  if (!addrs) return undefined;
  if (Array.isArray(addrs)) {
    return addrs.map(normalizeAddress);
  }
  return normalizeAddress(addrs);
}

/**
 * Obtiene el binding nativo de Cloudflare EMAIL.
 */
export function getEmailBinding(customEnv?: CloudflareEnv) {
  const targetEnv = customEnv || (env as unknown as CloudflareEnv);
  return targetEnv?.EMAIL;
}

/**
 * Envía un correo electrónico utilizando Cloudflare Email Sending (`env.EMAIL.send`).
 * 
 * - Si el binding no está configurado (ej. entorno de prueba aislado), simula el despacho de forma segura.
 * - Captura y aisla errores para no romper la ejecución de la aplicación.
 */
export async function sendEmail(
  params: SendEmailParams,
  customEnv?: CloudflareEnv
): Promise<EmailSendResponse> {
  const emailBinding = getEmailBinding(customEnv);
  const from = normalizeAddress(params.from || BRAND_SENDERS.DEFAULT);
  const to = normalizeAddressList(params.to);

  if (!to || (Array.isArray(to) && to.length === 0)) {
    return {
      success: false,
      error: 'Se requiere al menos una dirección de destinatario ("to")',
    };
  }

  const html = params.html;
  const text = params.text || (html ? stripHtml(html) : '');

  if (!html && !text) {
    return {
      success: false,
      error: 'El correo debe contener al menos texto plano ("text") o contenido HTML ("html")',
    };
  }

  // Si no está disponible el binding (fallback defensivo)
  if (!emailBinding) {
    console.warn('[EmailService] env.EMAIL no disponible en este entorno. Simulando envío:', {
      from,
      to,
      subject: params.subject,
      preview: text.slice(0, 100),
    });
    return {
      success: true,
      messageId: `simulated-${crypto.randomUUID()}`,
    };
  }

  try {
    const cc = normalizeAddressList(params.cc);
    const bcc = normalizeAddressList(params.bcc);
    const replyTo = params.replyTo ? normalizeAddress(params.replyTo) : undefined;

    // Invocación del binding nativo de Cloudflare Workers Email Sending
    const result = await emailBinding.send({
      from,
      to,
      subject: params.subject,
      text,
      html,
      cc,
      bcc,
      replyTo,
      headers: params.headers,
    });

    console.info(`[EmailService] Correo enviado exitosamente: ${result.messageId} -> ${JSON.stringify(to)}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[EmailService] Fallo al despachar correo vía Cloudflare:', message, {
      from,
      to,
      subject: params.subject,
    });
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Despacha la notificación por correo del pedido recién creado.
 * - Si el cliente suministró email, le envía la confirmación con copia oculta (BCC) a los administradores.
 * - Si el cliente no suministró email, envía la notificación directa a los administradores.
 * - No arroja excepciones para proteger la persistencia del pedido.
 */
export async function sendOrderNotification(
  order: OrderWithItems,
  customEnv?: CloudflareEnv
): Promise<EmailSendResponse | null> {
  try {
    const customerEmail = order.customerEmail?.trim();
    const hasCustomerEmail = Boolean(customerEmail && customerEmail.includes('@'));

    const rendered = renderOrderConfirmationEmail({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      customerCity: order.customerCity,
      customerNotes: order.customerNotes,
      total: order.total,
      createdAt: order.createdAt,
      items: (order.items || []).map((i) => ({
        productName: i.productName,
        toneName: i.toneName,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal,
        imageUrl: i.imageUrl,
      })),
    });

    const bccRecipients = [...ADMIN_BCC_EMAILS];

    if (hasCustomerEmail) {
      return await sendEmail(
        {
          to: { email: customerEmail!, name: order.customerName },
          bcc: bccRecipients,
          from: BRAND_SENDERS.ORDERS,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        },
        customEnv
      );
    } else if (bccRecipients.length > 0) {
      return await sendEmail(
        {
          to: bccRecipients,
          from: BRAND_SENDERS.ORDERS,
          subject: `[Nuevo Pedido] #${order.orderNumber} - ${order.customerName}`,
          html: rendered.html,
          text: rendered.text,
        },
        customEnv
      );
    }

    return null;
  } catch (err: unknown) {
    console.error('[EmailService] Excepción no controlada en sendOrderNotification:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

