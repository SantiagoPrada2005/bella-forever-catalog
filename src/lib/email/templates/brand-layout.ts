import { CONFIG } from '../../../config';

export interface BrandEmailLayoutOptions {
  title: string;
  previewText?: string;
  contentHtml: string;
  footerNotes?: string;
}

/**
 * Convierte cualquier ruta relativa (/images/..., /api/images/...) en una URL absoluta pública HTTPS.
 */
export function toAbsoluteUrl(path: string | null | undefined): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `https://bella-forever.com${cleanPath}`;
}

/**
 * Plantilla base editorial Luxury Dark Mode oficial de Bella Forever.
 * Diseñada en SECCIONES DE ANCHO COMPLETO (Full-Width Bands), sin contenedor tipo modal/caja flotante.
 * Colores extraídos estrictamente de la identidad de marca (src/index.css):
 * - Canvas Principal: #0A0405 (Obsidiana Profundo)
 * - Encabezado / Masthead: #120609 con filete dorado #D7B06A
 * - Secciones de Contenido: #1F0A11, #2A0B12 y #17090D (Vino Terciopelo y Cacao Oscuro)
 * - Acentos y Botones: #D7B06A (Oro Imperial)
 * - Tipografía: #FCF9F9 (Blanco Nieve), #F6D6D9 (Rosa Pastel), #C9B1B6 (Rosa Ceniza)
 *
 * Cada elemento lleva atributos 'bgcolor' y estilos 'background-color !important'
 * para garantizar compatibilidad total con Gmail (iOS/Android/Web), Apple Mail y Outlook.
 */
export function renderBrandEmailLayout({
  title,
  previewText = '',
  contentHtml,
  footerNotes,
}: BrandEmailLayoutOptions): string {
  const brandName = CONFIG.brandName;
  const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber.replace(/[^0-9]/g, '')}`;
  const instagramUrl = `https://instagram.com/${CONFIG.instagramUser}`;
  const siteUrl = 'https://bella-forever.com';
  const isotipoUrl = toAbsoluteUrl('/isotipo.png');

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: dark only; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #0A0405 !important;
      -webkit-font-smoothing: antialiased;
    }
    body, table, td, p, a, span {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    a {
      color: #D7B06A !important;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-section-inner {
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 14px !important;
        padding-right: 14px !important;
      }
      .mobile-full-width {
        width: 100% !important;
        display: block !important;
      }
      .mobile-center {
        text-align: center !important;
      }
      .header-title {
        font-size: 22px !important;
        letter-spacing: 4px !important;
      }
    }
  </style>
</head>
<body bgcolor="#0A0405" style="margin: 0; padding: 0; width: 100% !important; min-width: 100% !important; background-color: #0A0405 !important; color: #FCF9F9;">
  ${
    previewText
      ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #0A0405;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
      : ''
  }

  <!-- ============================================================ -->
  <!-- SECCIÓN 1: BARRA SUPERIOR DE UBICACIÓN Y BOUTIQUE (FULL WIDTH) -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#0A0405" style="background-color: #0A0405 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.18);">
    <tr>
      <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important; padding: 10px 14px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          <tr>
            <td align="center" style="font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #D7B06A !important;">
              ROLDANILLO, COLOMBIA • BOUTIQUE DE MAQUILLAJE &amp; BELLEZA
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 2: MASTHEAD PRINCIPAL DE MARCA (FULL WIDTH #120609)  -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#120609" style="background-color: #120609 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.28);">
    <tr>
      <td align="center" bgcolor="#120609" style="background-color: #120609 !important; padding: 26px 14px 22px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          <tr>
            <td align="center" bgcolor="#120609" style="background-color: #120609 !important;">
              <!-- Monograma Isotipo Circular con borde dorado -->
              <a href="${siteUrl}" style="color: #D7B06A !important; text-decoration: none; display: inline-block;">
                <img src="${isotipoUrl}" alt="Bella Forever Monograma" width="56" height="56" style="display: block; width: 56px; height: 56px; border-radius: 50%; border: 1.5px solid #D7B06A; margin: 0 auto 12px; background-color: #0A0405;" />
              </a>
              <!-- Logotipo Tipográfico Oficial -->
              <a href="${siteUrl}" style="color: #D7B06A !important; text-decoration: none; display: block;">
                <span class="header-title" style="color: #D7B06A !important; font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; letter-spacing: 5px; text-transform: uppercase; display: block; line-height: 1.2;">
                  ${brandName}
                </span>
              </a>
              <span style="color: #F6D6D9 !important; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; font-weight: 500; display: block; margin-top: 6px;">
                ✦ Tu dosis diaria de brillo y color ✦
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN DINÁMICA DE CONTENIDO (SECCIONES INDIVIDUALES)        -->
  <!-- ============================================================ -->
  ${contentHtml}

  <!-- ============================================================ -->
  <!-- SECCIÓN FOOTER DE MARCA (FULL WIDTH #0A0405)                 -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#0A0405" style="background-color: #0A0405 !important; width: 100% !important; margin: 0; padding: 0; border-top: 1px solid rgba(215, 176, 106, 0.22);">
    <tr>
      <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important; padding: 36px 14px 44px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto; text-align: center;">
          
          <!-- Firma Editorial "Bella." -->
          <tr>
            <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important; padding-bottom: 12px;">
              <span style="font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-style: italic; color: #D7B06A !important; font-size: 34px; line-height: 1; display: inline-block;">
                Bella.
              </span>
            </td>
          </tr>

          <!-- Lema de la Boutique -->
          <tr>
            <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important; padding-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #F6D6D9 !important; line-height: 1.5; max-width: 440px;">
                Cosméticos y maquillaje de alta pigmentación en Roldanillo, Valle del Cauca.
                Entregas directas locales y envíos a todo Colombia.
              </p>
            </td>
          </tr>

          <!-- Enlaces Rápidos con Viñetas Doradas -->
          <tr>
            <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important; padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td bgcolor="#0A0405" style="padding: 0 10px; background-color: #0A0405 !important;">
                    <a href="${instagramUrl}" target="_blank" style="color: #D7B06A !important; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
                      📷 @${CONFIG.instagramUser}
                    </a>
                  </td>
                  <td bgcolor="#0A0405" style="color: rgba(215, 176, 106, 0.45) !important; font-size: 12px; background-color: #0A0405 !important;">•</td>
                  <td bgcolor="#0A0405" style="padding: 0 10px; background-color: #0A0405 !important;">
                    <a href="${whatsappUrl}" target="_blank" style="color: #D7B06A !important; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
                      💬 WhatsApp: ${CONFIG.whatsappNumber}
                    </a>
                  </td>
                  <td bgcolor="#0A0405" style="color: rgba(215, 176, 106, 0.45) !important; font-size: 12px; background-color: #0A0405 !important;">•</td>
                  <td bgcolor="#0A0405" style="padding: 0 10px; background-color: #0A0405 !important;">
                    <a href="${siteUrl}/catalogo" target="_blank" style="color: #D7B06A !important; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
                      🛍️ Catálogo Online
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            footerNotes
              ? `<tr>
                  <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important; padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #B89FA3 !important; line-height: 1.5; max-width: 500px;">${footerNotes}</p>
                  </td>
                </tr>`
              : ''
          }

          <!-- Copyright y Aviso Legal -->
          <tr>
            <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important;">
              <p style="margin: 0; font-size: 11px; color: #B89FA3 !important; line-height: 1.4;">
                © ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.<br>
                Este correo fue enviado porque interactuaste con nuestra tienda en línea en <a href="${siteUrl}" style="color: #D7B06A !important; text-decoration: underline;">bella-forever.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
