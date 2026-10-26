import { renderBrandEmailLayout, toAbsoluteUrl } from './brand-layout';
import { stripHtml } from '../client';
import { formatCop } from '../../../utils/currency';
import { CONFIG } from '../../../config';
import type { RenderedEmail } from './welcome';

export interface OrderItemEmailData {
  productName: string;
  toneName?: string | null;
  toneHex?: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string | null;
}

export interface OrderEmailData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress: string;
  customerCity: string;
  customerNotes?: string | null;
  total: number;
  createdAt: string;
  items: OrderItemEmailData[];
}

/**
 * Plantilla de confirmación de pedido oficial con arquitectura por SECCIONES DE ANCHO COMPLETO.
 * Colores exactos de la boutique (src/index.css):
 * - #0A0405: Fondo exterior
 * - #120609: Masthead
 * - #1F0A11: Hero de Modelo
 * - #2A0B12: Tracker de Estado del Pedido
 * - #16080B / #17090D: Desglose de Productos
 * - #D7B06A: Acentos y Totales Oro Imperial
 */
export function renderOrderConfirmationEmail(order: OrderEmailData): RenderedEmail {
  const customerName = order.customerName ? order.customerName.trim() : 'Cliente Bella';
  const subject = `🛍️ Confirmación de Pedido #${order.orderNumber} - Bella Forever`;
  const previewText = `¡Gracias ${customerName}! Tu pedido #${order.orderNumber} por ${formatCop(order.total)} ha sido registrado con éxito.`;

  // Fotografía oficial de la modelo en JPG de alta compatibilidad
  const modelHeroUrl = toAbsoluteUrl('/images/studio-hero-blush.jpg');
  const cleanPhone = CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
  const encodedWhatsappMsg = encodeURIComponent(
    `¡Hola Bella Forever! Realicé el pedido #${order.orderNumber} a nombre de ${order.customerName} por valor de ${formatCop(order.total)} y me gustaría coordinar los detalles de la entrega.`
  );
  const whatsappOrderUrl = `https://wa.me/${cleanPhone}?text=${encodedWhatsappMsg}`;

  // Desglose de productos con foto en cuadro blanco y datos en oscuro
  const itemsCardsHtml = order.items
    .map((item) => {
      const fullImageUrl = item.imageUrl
        ? toAbsoluteUrl(item.imageUrl)
        : toAbsoluteUrl('/images/products/base-aura-trendy.jpg');

      const imageElement = `<img src="${fullImageUrl}" alt="${item.productName}" width="70" height="70" style="display: block; width: 70px; height: 70px; object-fit: contain; border: 0;" />`;

      const toneSwatch = item.toneHex
        ? `<span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${item.toneHex}; border: 1px solid #D7B06A; margin-right: 6px; vertical-align: middle;"></span>`
        : '';

      return `
      <tr>
        <td bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#17090D" style="background-color: #17090D !important; border: 1px solid rgba(215, 176, 106, 0.26); border-radius: 14px;">
            <tr>
              <!-- Foto del Producto en marco blanco de exhibición -->
              <td width="86" valign="middle" align="center" bgcolor="#FFFFFF" style="background-color: #FFFFFF !important; border-top-left-radius: 13px; border-bottom-left-radius: 13px; padding: 10px;">
                ${imageElement}
              </td>

              <!-- Información del Producto -->
              <td valign="middle" bgcolor="#17090D" style="background-color: #17090D !important; padding: 12px 16px;">
                <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: #FFFFFF !important; font-size: 17px; line-height: 1.3; display: block;">
                  ${item.productName}
                </span>
                <span style="font-size: 16px; font-weight: bold; color: #D7B06A !important; display: block; margin: 3px 0 6px;">
                  ${formatCop(item.subtotal)}
                </span>
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left" bgcolor="#17090D" style="background-color: #17090D !important;">
                      ${
                        item.toneName
                          ? `<span style="font-size: 11px; color: #F6D6D9 !important; text-transform: uppercase; letter-spacing: 0.5px;">
                              ${toneSwatch}<strong>TONO: ${item.toneName}</strong>
                            </span>`
                          : '<span style="font-size: 11px; color: #B89FA3 !important;">Tono Estándar</span>'
                      }
                    </td>
                    <td align="right" bgcolor="#17090D" style="background-color: #17090D !important;">
                      <span style="display: inline-block; padding: 2px 10px; background-color: #260810; border: 1px solid rgba(215, 176, 106, 0.35); border-radius: 6px; font-size: 11px; font-weight: 600; color: #FCF9F9 !important;">
                        Cant: ${item.quantity}
                      </span>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </td>
      </tr>
      `;
    })
    .join('');

  const contentHtml = `
  <!-- ============================================================ -->
  <!-- SECCIÓN 3: HERO CON FOTOGRAFÍA DE MODELO (FULL WIDTH #1F0A11) -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.25);">
    <tr>
      <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 20px 14px 26px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Imagen de la Modelo de Campaña -->
          <tr>
            <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#0A0405" style="border-radius: 16px; overflow: hidden; border: 1px solid rgba(215, 176, 106, 0.35); background-color: #0A0405 !important;">
                <tr>
                  <td align="center" bgcolor="#0A0405" style="padding: 0; background-color: #0A0405 !important;">
                    <a href="https://bella-forever.com" target="_blank" style="display: block;">
                      <img src="${modelHeroUrl}" alt="Modelo Bella Forever - Pedido Confirmado" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Epígrafe Editorial -->
          <tr>
            <td align="left" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 18px 4px 0;">
              <span style="font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-style: italic; color: #FFFFFF !important; font-size: 26px; display: block; line-height: 1.2;">
                Bella Forever.
              </span>
              <span style="font-size: 14px; color: #F6D6D9 !important; line-height: 1.5; display: block; margin-top: 4px;">
                Tu orden ha sido registrada con éxito y estamos preparando tus productos con el máximo cuidado.
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 4: CONFIRMACIÓN Y ESTADO DEL PEDIDO (FULL WIDTH #2A0B12) -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.22);">
    <tr>
      <td align="center" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; padding: 32px 14px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Badge Dorado de Confirmación -->
          <tr>
            <td align="left" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; padding-bottom: 14px;">
              <span style="display: inline-block; padding: 5px 16px; border: 1px solid #D7B06A; border-radius: 50px; font-size: 11px; font-weight: 700; color: #D7B06A !important; letter-spacing: 2px; text-transform: uppercase;">
                ✦ PEDIDO REGISTRADO CON ÉXITO ✦
              </span>
            </td>
          </tr>

          <!-- Título y Número de Orden -->
          <tr>
            <td align="left" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; padding-bottom: 20px;">
              <h2 style="margin: 0 0 8px; font-family: 'Cormorant Garamond', Georgia, serif; color: #FFFFFF !important; font-size: 28px; font-weight: normal; line-height: 1.25;">
                ¡Gracias por tu compra, ${customerName}! ✨
              </h2>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #FCF9F9 !important;">
                Hemos recibido tu orden <strong style="color: #D7B06A !important;">#${order.orderNumber}</strong>. Nuestro equipo de boutique ya comenzó a alistar tus productos favoritos.
              </p>
            </td>
          </tr>

          <!-- Barra de Seguimiento Visual (3 Pasos) -->
          <tr>
            <td bgcolor="#2A0B12" style="background-color: #2A0B12 !important;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#17090D" style="background-color: #17090D !important; border: 1px solid rgba(215, 176, 106, 0.35); border-radius: 12px; padding: 14px;">
                <tr>
                  <td align="center" width="33%" style="padding: 4px 6px;">
                    <span style="display: block; font-size: 18px; margin-bottom: 4px;">✔</span>
                    <span style="font-size: 11px; font-weight: 700; color: #D7B06A !important; text-transform: uppercase; letter-spacing: 1px;">
                      Recibido
                    </span>
                  </td>
                  <td align="center" width="33%" style="padding: 4px 6px; border-left: 1px solid rgba(215, 176, 106, 0.2); border-right: 1px solid rgba(215, 176, 106, 0.2);">
                    <span style="display: block; font-size: 18px; margin-bottom: 4px;">⏳</span>
                    <span style="font-size: 11px; font-weight: 700; color: #F6D6D9 !important; text-transform: uppercase; letter-spacing: 1px;">
                      En Preparación
                    </span>
                  </td>
                  <td align="center" width="33%" style="padding: 4px 6px;">
                    <span style="display: block; font-size: 18px; margin-bottom: 4px;">📦</span>
                    <span style="font-size: 11px; font-weight: 600; color: #B89FA3 !important; text-transform: uppercase; letter-spacing: 1px;">
                      Despacho
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 5: DETALLES DE ENTREGA (FULL WIDTH #16080B)          -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#16080B" style="background-color: #16080B !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.22);">
    <tr>
      <td align="center" bgcolor="#16080B" style="background-color: #16080B !important; padding: 28px 14px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <tr>
            <td bgcolor="#16080B" style="background-color: #16080B !important;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#17090D" style="background-color: #17090D !important; border: 1px solid rgba(215, 176, 106, 0.28); border-radius: 14px; padding: 18px 20px;">
                <tr>
                  <td align="left" bgcolor="#17090D" style="background-color: #17090D !important;">
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #D7B06A !important; display: block; margin-bottom: 10px;">
                      📍 DATOS DE ENVÍO Y CONTACTO
                    </span>
                    <p style="margin: 0 0 6px; font-size: 14px; color: #FCF9F9 !important;">
                      <strong>Destinataria:</strong> ${order.customerName}
                    </p>
                    <p style="margin: 0 0 6px; font-size: 14px; color: #FCF9F9 !important;">
                      <strong>Teléfono:</strong> ${order.customerPhone}
                    </p>
                    <p style="margin: 0 0 6px; font-size: 14px; color: #FCF9F9 !important;">
                      <strong>Dirección:</strong> ${order.customerAddress}
                    </p>
                    <p style="margin: 0 0 ${order.customerNotes ? '6px' : '0'}; font-size: 14px; color: #FCF9F9 !important;">
                      <strong>Ciudad:</strong> ${order.customerCity}
                    </p>
                    ${
                      order.customerNotes
                        ? `<p style="margin: 0; font-size: 13px; color: #F6D6D9 !important; font-style: italic;">
                            <strong>Notas de entrega:</strong> "${order.customerNotes}"
                          </p>`
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 6: LISTADO DE PRODUCTOS (FULL WIDTH #1F0A11)         -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.22);">
    <tr>
      <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 32px 14px 24px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Encabezado de Productos -->
          <tr>
            <td align="left" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding-bottom: 16px;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #D7B06A !important; display: block; margin-bottom: 4px;">
                ✦ RESUMEN DEL PEDIDO ✦
              </span>
              <h3 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; color: #FFFFFF !important; font-size: 24px; font-weight: normal;">
                Productos Seleccionados (${order.items.length})
              </h3>
            </td>
          </tr>

          <!-- Lista de Tarjetas de Productos -->
          ${itemsCardsHtml}

          <!-- Tarjeta de Total Final -->
          <tr>
            <td bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding-top: 10px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; border: 1.5px solid #D7B06A; border-radius: 14px; padding: 18px 22px;">
                <tr>
                  <td align="left" valign="middle" bgcolor="#2A0B12" style="background-color: #2A0B12 !important;">
                    <span style="font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #F6D6D9 !important; display: block;">
                      TOTAL DE TU ORDEN
                    </span>
                    <span style="font-size: 11px; color: #C9B1B6 !important; display: block; margin-top: 2px;">
                      Pago contra entrega / Coordinación directa
                    </span>
                  </td>
                  <td align="right" valign="middle" bgcolor="#2A0B12" style="background-color: #2A0B12 !important;">
                    <span style="font-size: 26px; font-weight: 800; color: #D7B06A !important; letter-spacing: 0.5px; display: block;">
                      ${formatCop(order.total)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 7: COORDINACIÓN WHATSAPP (FULL WIDTH #2A0B12)         -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; width: 100% !important; margin: 0; padding: 0;">
    <tr>
      <td align="center" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; padding: 34px 14px 40px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto; text-align: center;">
          <tr>
            <td align="center" bgcolor="#2A0B12" style="background-color: #2A0B12 !important;">
              <span style="font-size: 28px; display: block; margin-bottom: 8px;">📲</span>
              <h3 style="margin: 0 0 8px; font-family: 'Cormorant Garamond', Georgia, serif; color: #FFFFFF !important; font-size: 25px; font-weight: normal;">
                ¿Deseas coordinar la entrega de inmediato?
              </h3>
              <p style="margin: 0 auto 20px; font-size: 14px; line-height: 1.55; color: #F6D6D9 !important; max-width: 480px;">
                Haz clic en el botón a continuación para abrir WhatsApp con los datos de tu orden ya listos. Te confirmamos el horario de entrega en Roldanillo o tu guía nacional.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" bgcolor="#25D366" style="background-color: #25D366 !important; border-radius: 50px;">
                    <a href="${whatsappOrderUrl}" target="_blank" style="color: #FFFFFF !important; text-decoration: none; padding: 14px 34px; font-size: 13px; font-weight: 700; letter-spacing: 1px; display: inline-block;">
                      💬 Coordinar Entrega por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  const html = renderBrandEmailLayout({
    title: subject,
    previewText,
    contentHtml,
    footerNotes: `Pedido #${order.orderNumber} registrado el ${order.createdAt} para entrega en ${order.customerCity}.`,
  });

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productName}${item.toneName ? ` (Tono: ${item.toneName})` : ''} x${item.quantity}: ${formatCop(item.subtotal)}`
    )
    .join('\n');

  const text = `
¡Gracias por tu compra en Bella Forever, ${customerName}!
Confirmación de Pedido #${order.orderNumber}

Hemos recibido tu pedido y nuestro equipo ya está preparando tus productos.

RESUMEN DE PRODUCTOS:
${itemsText}

TOTAL: ${formatCop(order.total)}

DATOS DE ENVÍO:
- Destinataria: ${order.customerName}
- Teléfono: ${order.customerPhone}
- Dirección: ${order.customerAddress}, ${order.customerCity}
${order.customerNotes ? `- Notas: ${order.customerNotes}` : ''}

Coordina tu entrega directamente por WhatsApp:
${whatsappOrderUrl}

Bella Forever Boutique
Roldanillo, Colombia
`.trim();

  return { subject, html, text: stripHtml(text) };
}
