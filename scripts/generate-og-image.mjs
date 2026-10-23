import fs from 'fs';
import { execSync } from 'child_process';

console.log('🎨 Creando Open Graph Card de Alta Gama para Bella Forever...');

// 1. Convert studio photo to base64 PNG for background embedding
execSync('sips -s format png public/images/studio-collection-silk.webp --out /tmp/silk-bg.png');
const photoBase64 = fs.readFileSync('/tmp/silk-bg.png').toString('base64');

// 2. Base64 encode golden isotipo
const isotipoBase64 = fs.readFileSync('public/isotipo.png').toString('base64');

// 3. Compose Luxury Editorial SVG (1200 x 630 px)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0405" />
      <stop offset="45%" stop-color="#19060B" />
      <stop offset="100%" stop-color="#3D0D16" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E8C88A" />
      <stop offset="50%" stop-color="#D7B06A" />
      <stop offset="100%" stop-color="#F2DEC0" />
    </linearGradient>

    <linearGradient id="fadeMask" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000" stop-opacity="0" />
      <stop offset="35%" stop-color="#000" stop-opacity="0.3" />
      <stop offset="75%" stop-color="#000" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#000" stop-opacity="0.95" />
    </linearGradient>

    <radialGradient id="glow" cx="20%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#5A1623" stop-opacity="0.6" />
      <stop offset="60%" stop-color="#1A0409" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#0A0405" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Deep Obsidian Base -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Embedded Luxury Product Photography on Right Half -->
  <g opacity="0.45" transform="translate(480, 0)">
    <image href="data:image/png;base64,${photoBase64}" width="820" height="630" preserveAspectRatio="xMidYMid slice" />
  </g>

  <!-- Dark Atmospheric Gradient Overlays -->
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect width="700" height="630" fill="url(#bgGrad)" opacity="0.92" />
  <rect x="500" width="700" height="630" fill="url(#fadeMask)" />

  <!-- Double Fine Gold Luxury Framing (28px Inset) -->
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#D7B06A" stroke-width="1" opacity="0.35" />
  <rect x="34" y="34" width="1132" height="562" fill="none" stroke="#D7B06A" stroke-width="0.5" opacity="0.2" />

  <!-- Corner Diamonds -->
  <polygon points="28,28 34,22 40,28 34,34" fill="#D7B06A" opacity="0.6" />
  <polygon points="1172,28 1166,22 1160,28 1166,34" fill="#D7B06A" opacity="0.6" />
  <polygon points="28,602 34,596 40,602 34,608" fill="#D7B06A" opacity="0.6" />
  <polygon points="1172,602 1166,596 1160,602 1166,608" fill="#D7B06A" opacity="0.6" />

  <!-- Content Safe Zone (Centrado y visible en cualquier crop móvil 1:1) -->
  <g transform="translate(80, 75)">
    <!-- Brand Crest & Micro Badge -->
    <g transform="translate(0, 0)">
      <image href="data:image/png;base64,${isotipoBase64}" width="76" height="76" />
      <g transform="translate(94, 26)">
        <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#D7B06A" letter-spacing="4" text-transform="uppercase">
          BOUTIQUE &amp; CATÁLOGO EXCLUSIVO
        </text>
        <text y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="400" fill="#B89FA3" letter-spacing="2" text-transform="uppercase">
          ROLDANILLO, VALLE DEL CAUCA
        </text>
      </g>
    </g>

    <!-- Main Title "BELLA FOREVER" -->
    <text x="0" y="195" font-family="Didot, 'Bodoni 72', 'Cormorant Garamond', Georgia, serif" font-size="78" font-weight="400" fill="url(#goldGrad)" letter-spacing="3">
      BELLA FOREVER
    </text>

    <!-- Subtitle -->
    <text x="0" y="255" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="300" fill="#FCF9F9" letter-spacing="0.5">
      Cosméticos y Maquillaje de Alta Gama
    </text>

    <!-- Value Proposition Description -->
    <text x="0" y="295" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="300" fill="#DDA3A9">
      Rubores, labiales velvet, iluminadores y tendencias en belleza.
    </text>

    <!-- Badges / Features Bar -->
    <g transform="translate(0, 360)">
      <!-- Badge 1: WhatsApp -->
      <g>
        <rect width="210" height="38" rx="19" fill="#5A1623" stroke="#D7B06A" stroke-width="1" stroke-opacity="0.6" />
        <circle cx="20" cy="19" r="4" fill="#D7B06A" />
        <text x="34" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#FCF9F9" letter-spacing="0.5">
          Pedidos por WhatsApp
        </text>
      </g>

      <!-- Badge 2: Local & Nacional -->
      <g transform="translate(225, 0)">
        <rect width="200" height="38" rx="19" fill="#1C060D" stroke="#D7B06A" stroke-width="1" stroke-opacity="0.35" />
        <circle cx="20" cy="19" r="4" fill="#D7B06A" />
        <text x="34" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="500" fill="#F6D6D9" letter-spacing="0.5">
          Entrega Inmediata
        </text>
      </g>

      <!-- Badge 3: 100% Original -->
      <g transform="translate(440, 0)">
        <rect width="180" height="38" rx="19" fill="#1C060D" stroke="#D7B06A" stroke-width="1" stroke-opacity="0.35" />
        <circle cx="20" cy="19" r="4" fill="#D7B06A" />
        <text x="34" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="500" fill="#F6D6D9" letter-spacing="0.5">
          Calidad Garantizada
        </text>
      </g>
    </g>

    <!-- Bottom URL Signature -->
    <text x="0" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#D7B06A" letter-spacing="3" opacity="0.9">
      BELLA-FOREVER.COM
    </text>
  </g>
</svg>`;

fs.writeFileSync('/tmp/og-bella-forever.svg', svgContent);

// 4. Render SVG to high-res PNG
execSync('sips -s format png /tmp/og-bella-forever.svg --out /tmp/og-bella-forever.png');

// 5. Convert PNG to optimized universal JPEG (88% quality, ~140KB, perfect for WhatsApp/Facebook/Twitter/Google)
execSync('sips -s format jpeg -s formatOptions 88 /tmp/og-bella-forever.png --out public/images/og-bella-forever.jpg');

// 6. Also update og-bella-forever.webp with the new 1200x630 composition for WebP-enabled bots
execSync('sips -s format png /tmp/og-bella-forever.png --out /tmp/og-temp.png');
// For webp, sips or node can handle it or copy jpg
const jpgStats = fs.statSync('public/images/og-bella-forever.jpg');
console.log('✅ og-bella-forever.jpg creado con éxito! Tamaño:', Math.round(jpgStats.size / 1024), 'KB (Óptimo < 300KB para WhatsApp)');
