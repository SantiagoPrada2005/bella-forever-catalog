import { renderBrandEmailLayout, toAbsoluteUrl } from './brand-layout';
import { stripHtml } from '../client';
import { CONFIG } from '../../../config';

export interface WelcomeEmailData {
  name?: string;
  email: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Plantilla de bienvenida oficial con fotografía de modelos y arquitectura por SECCIONES DE ANCHO COMPLETO.
 * Colores exactos de bella-forever.com (src/index.css):
 * - #0A0405: Fondo exterior
 * - #120609: Masthead
 * - #1F0A11: Sección Hero de Modelo
 * - #2A0B12: Sección de Bienvenida y Terciopelo
 * - #16080B / #17090D: Secciones de Productos y Vitrina
 * - #D7B06A: Acentos y Botones Oro Imperial
 * - #FCF9F9 / #F6D6D9 / #B89FA3: Textos Luminosos
 */
export function renderWelcomeEmail(data: WelcomeEmailData): RenderedEmail {
  const customerName = data.name ? data.name.trim() : 'Amiga Bella';
  const subject = `✨ ¡Bienvenida a Bella Forever, ${customerName}! Tu dosis diaria de brillo y color`;
  const previewText = 'Fórmulas luminosas pensadas para realzar tu piel todos los días. Conoce nuestros favoritos.';

  // Fotografías oficiales de las modelos en JPG de alta compatibilidad
  const modelHeroUrl = toAbsoluteUrl('/images/studio-hero-blush.jpg');
  const modelStudioUrl = toAbsoluteUrl('/images/studio-gold-eyes-pose.jpg');

  // Productos estrella con imágenes reales
  const productAuraUrl = toAbsoluteUrl('/images/products/base-aura-trendy.jpg');
  const productBlushUrl = toAbsoluteUrl('/images/products/rubor-en-barra-trendy-blush-love.jpg');
  const productGlossUrl = toAbsoluteUrl('/images/products/brillo-labial-furia-trendy.jpg');

  const cleanPhone = CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappAdviceUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    '¡Hola Bella Forever! Me acabo de registrar en su boutique y me gustaría recibir asesoría personalizada para elegir mis tonos ideales.'
  )}`;

  const contentHtml = `
  <!-- ============================================================ -->
  <!-- SECCIÓN 3: HERO CON FOTOGRAFÍA DE MODELO (FULL WIDTH #1F0A11) -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.25);">
    <tr>
      <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 20px 14px 26px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Imagen de la Modelo Aplicando Rubor -->
          <tr>
            <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#0A0405" style="border-radius: 16px; overflow: hidden; border: 1px solid rgba(215, 176, 106, 0.35); background-color: #0A0405 !important;">
                <tr>
                  <td align="center" bgcolor="#0A0405" style="padding: 0; background-color: #0A0405 !important;">
                    <a href="https://bella-forever.com/catalogo" target="_blank" style="display: block;">
                      <img src="${modelHeroUrl}" alt="Modelo Bella Forever - Fórmulas Luminosas" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Epígrafe Editorial Idéntico a la Portada del Sitio -->
          <tr>
            <td align="left" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 18px 4px 0;">
              <span style="font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-style: italic; color: #FFFFFF !important; font-size: 26px; display: block; line-height: 1.2;">
                Bella Forever.
              </span>
              <span style="font-size: 14px; color: #F6D6D9 !important; line-height: 1.5; display: block; margin-top: 4px;">
                Fórmulas luminosas pensadas para realzar tu piel todos los días.
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 4: CARTA DE BIENVENIDA (FULL WIDTH #2A0B12)          -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.22);">
    <tr>
      <td align="center" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; padding: 32px 14px 34px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Badge Dorado de Bienvenida -->
          <tr>
            <td align="left" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; padding-bottom: 14px;">
              <span style="display: inline-block; padding: 5px 16px; border: 1px solid #D7B06A; border-radius: 50px; font-size: 11px; font-weight: 700; color: #D7B06A !important; letter-spacing: 2px; text-transform: uppercase;">
                ✦ BIENVENIDA A LA COMUNIDAD ✦
              </span>
            </td>
          </tr>

          <!-- Título y Mensaje de Bienvenida -->
          <tr>
            <td align="left" bgcolor="#2A0B12" style="background-color: #2A0B12 !important;">
              <h2 style="margin: 0 0 12px; font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; color: #FFFFFF !important; font-size: 28px; font-weight: normal; line-height: 1.25;">
                ¡Nos alegra tenerte aquí, ${customerName}! ✨
              </h2>
              <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.65; color: #FCF9F9 !important;">
                En Bella Forever creemos que el maquillaje es tu momento diario para expresarte, brillar y consentirte. Seleccionamos cuidadosamente cosméticos de alta pigmentación, texturas en crema y fórmulas que cuidan tu piel.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #F6D6D9 !important;">
                Desde nuestra boutique en <strong>Roldanillo</strong>, preparamos cada orden con un empaque especial y detalles pensados exclusivamente para ti.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 5: EDITORIAL RETRATO & TENDENCIAS (FULL WIDTH #16080B) -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#16080B" style="background-color: #16080B !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.22);">
    <tr>
      <td align="center" bgcolor="#16080B" style="background-color: #16080B !important; padding: 32px 14px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Tarjeta Editorial con Foto de Modelo de Estudio -->
          <tr>
            <td bgcolor="#16080B" style="background-color: #16080B !important;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#17090D" style="background-color: #17090D !important; border: 1px solid rgba(215, 176, 106, 0.3); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td align="center" bgcolor="#0A0405" style="background-color: #0A0405 !important; padding: 0;">
                    <img src="${modelStudioUrl}" alt="Retrato Glamour Bella Forever - Gold Eyes" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#17090D" style="background-color: #17090D !important; padding: 20px 22px 22px;">
                    <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: #FFFFFF !important; font-size: 22px; display: block; margin-bottom: 4px;">
                      Tendencias de Estudio
                    </span>
                    <span style="font-size: 17px; font-weight: 700; color: #D7B06A !important; display: block; margin-bottom: 10px;">
                      Destellos Dorados, Rubores y Labios Terciopelo
                    </span>
                    <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: #C9B1B6 !important;">
                      Descubre cómo combinar nuestras bases satinadas, fijadores de larga duración y tintas glow para crear looks que duran todo el día con acabado profesional.
                    </p>
                    
                    <!-- Botón Dorado -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#D7B06A" style="background-color: #D7B06A !important; border-radius: 50px;">
                          <a href="https://bella-forever.com/catalogo" target="_blank" style="color: #120609 !important; text-decoration: none; padding: 12px 28px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; display: inline-block;">
                            Ver Colección
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
      </td>
    </tr>
  </table>

  <!-- ============================================================ -->
  <!-- SECCIÓN 6: FAVORITOS DESTACADOS DE LA TIENDA (FULL WIDTH #1F0A11) -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; width: 100% !important; margin: 0; padding: 0; border-bottom: 1px solid rgba(215, 176, 106, 0.22);">
    <tr>
      <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding: 32px 14px 28px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Encabezado de Productos -->
          <tr>
            <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding-bottom: 22px;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #D7B06A !important; display: block; margin-bottom: 6px;">
                ✦ FAVORITOS DE LA BOUTIQUE ✦
              </span>
              <h3 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; color: #FFFFFF !important; font-size: 26px; font-weight: normal;">
                Los Más Amados de la Semana
              </h3>
            </td>
          </tr>

          <!-- PRODUCTO 1: BASE AURA TRENDY -->
          <tr>
            <td bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding-bottom: 14px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#17090D" style="background-color: #17090D !important; border: 1px solid rgba(215, 176, 106, 0.28); border-radius: 14px;">
                <tr>
                  <td width="90" valign="middle" align="center" bgcolor="#FFFFFF" style="background-color: #FFFFFF !important; border-top-left-radius: 13px; border-bottom-left-radius: 13px; padding: 12px;">
                    <img src="${productAuraUrl}" alt="Base Aura Trendy" width="70" height="70" style="display: block; width: 70px; height: 70px; object-fit: contain; border: 0;" />
                  </td>
                  <td valign="middle" bgcolor="#17090D" style="background-color: #17090D !important; padding: 14px 18px;">
                    <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: #FFFFFF !important; font-size: 17px; display: block;">
                      Base Aura Trendy
                    </span>
                    <span style="font-size: 16px; font-weight: bold; color: #D7B06A !important; display: block; margin: 3px 0;">
                      $ 30.000 COP
                    </span>
                    <span style="font-size: 12px; color: #C9B1B6 !important; line-height: 1.4; display: block;">
                      Cobertura construible con acabado luminoso natural que no se cuartea.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRODUCTO 2: RUBOR EN BARRA BLUSH LOVE -->
          <tr>
            <td bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding-bottom: 14px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#17090D" style="background-color: #17090D !important; border: 1px solid rgba(215, 176, 106, 0.28); border-radius: 14px;">
                <tr>
                  <td width="90" valign="middle" align="center" bgcolor="#FFFFFF" style="background-color: #FFFFFF !important; border-top-left-radius: 13px; border-bottom-left-radius: 13px; padding: 12px;">
                    <img src="${productBlushUrl}" alt="Rubor en Barra Trendy Blush Love" width="70" height="70" style="display: block; width: 70px; height: 70px; object-fit: contain; border: 0;" />
                  </td>
                  <td valign="middle" bgcolor="#17090D" style="background-color: #17090D !important; padding: 14px 18px;">
                    <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: #FFFFFF !important; font-size: 17px; display: block;">
                      Rubor en Barra Blush Love
                    </span>
                    <span style="font-size: 16px; font-weight: bold; color: #D7B06A !important; display: block; margin: 3px 0;">
                      $ 18.000 COP
                    </span>
                    <span style="font-size: 12px; color: #C9B1B6 !important; line-height: 1.4; display: block;">
                      Fórmula cremosa en barra que se funde perfectamente con tus mejillas.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRODUCTO 3: BRILLO LABIAL FURIA -->
          <tr>
            <td bgcolor="#1F0A11" style="background-color: #1F0A11 !important; padding-bottom: 22px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#17090D" style="background-color: #17090D !important; border: 1px solid rgba(215, 176, 106, 0.28); border-radius: 14px;">
                <tr>
                  <td width="90" valign="middle" align="center" bgcolor="#FFFFFF" style="background-color: #FFFFFF !important; border-top-left-radius: 13px; border-bottom-left-radius: 13px; padding: 12px;">
                    <img src="${productGlossUrl}" alt="Brillo Labial Furia Trendy" width="70" height="70" style="display: block; width: 70px; height: 70px; object-fit: contain; border: 0;" />
                  </td>
                  <td valign="middle" bgcolor="#17090D" style="background-color: #17090D !important; padding: 14px 18px;">
                    <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: #FFFFFF !important; font-size: 17px; display: block;">
                      Brillo Labial Furia Trendy
                    </span>
                    <span style="font-size: 16px; font-weight: bold; color: #D7B06A !important; display: block; margin: 3px 0;">
                      $ 15.000 COP
                    </span>
                    <span style="font-size: 12px; color: #C9B1B6 !important; line-height: 1.4; display: block;">
                      Efecto voluminizador con destellos multidimensionales no pegajosos.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Botón General del Catálogo -->
          <tr>
            <td align="center" bgcolor="#1F0A11" style="background-color: #1F0A11 !important;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" bgcolor="#D7B06A" style="background-color: #D7B06A !important; border-radius: 50px;">
                    <a href="https://bella-forever.com/catalogo" target="_blank" style="color: #120609 !important; text-decoration: none; padding: 14px 34px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; display: inline-block;">
                      Explorar Todos los Productos
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

  <!-- ============================================================ -->
  <!-- SECCIÓN 7: ASESORÍA VIP POR WHATSAPP (FULL WIDTH #2A0B12)    -->
  <!-- ============================================================ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; width: 100% !important; margin: 0; padding: 0;">
    <tr>
      <td align="center" bgcolor="#2A0B12" style="background-color: #2A0B12 !important; padding: 34px 14px 38px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-section-inner" style="max-width: 600px; width: 100%; margin: 0 auto; text-align: center;">
          <tr>
            <td align="center" bgcolor="#2A0B12" style="background-color: #2A0B12 !important;">
              <span style="font-size: 26px; display: block; margin-bottom: 8px;">💬</span>
              <h3 style="margin: 0 0 8px; font-family: 'Cormorant Garamond', Georgia, serif; color: #FFFFFF !important; font-size: 24px; font-weight: normal;">
                ¿Dudas sobre cuál es tu tono o acabado ideal?
              </h3>
              <p style="margin: 0 auto 18px; font-size: 14px; line-height: 1.5; color: #F6D6D9 !important; max-width: 460px;">
                Escríbenos a nuestra línea de WhatsApp. Te asesoramos en tiempo real con muestras, fotos de tonos y recomendaciones según tu tipo de piel.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" bgcolor="#25D366" style="background-color: #25D366 !important; border-radius: 50px;">
                    <a href="${whatsappAdviceUrl}" target="_blank" style="color: #FFFFFF !important; text-decoration: none; padding: 13px 30px; font-size: 13px; font-weight: 700; letter-spacing: 1px; display: inline-block;">
                      Solicitar Asesoría por WhatsApp
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
    footerNotes: 'Recibes este correo porque te suscribiste a las novedades de Bella Forever Boutique.',
  });

  const text = `
¡Bienvenida a Bella Forever, ${customerName}!
Tu dosis diaria de brillo y color.

Fórmulas luminosas pensadas para realzar tu piel todos los días.
Descubre cosméticos de alta pigmentación, bases satinadas y rubores en crema disponibles con entrega directa en Roldanillo y envíos a Colombia.

Visita nuestro catálogo completo:
https://bella-forever.com/catalogo

¿Dudas con tu tono ideal? Escríbenos a WhatsApp:
${CONFIG.whatsappNumber}

Bella Forever Boutique
Roldanillo, Colombia
`.trim();

  return { subject, html, text: stripHtml(text) };
}
