import { Cormorant_Garamond, Outfit } from 'next/font/google';
import '../src/index.css';
import GSAPRegister from '../src/components/GSAPRegister';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Bella Forever | Catálogo Premium de Maquillaje',
  description: 'Explora el catálogo digital premium de Bella Forever en Roldanillo. Encuentra maquillaje de alta calidad: rubores, labiales, correctores, cejas y pestañas. Haz tu pedido fácil por WhatsApp.',
  keywords: 'Bella Forever, maquillaje Roldanillo, cosméticos, catálogo de maquillaje, labiales, rubor, pestañas, cejas, correctores, belleza, Valle del Cauca',
  authors: [{ name: 'Bella Forever' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'Bella Forever | Catálogo Premium de Maquillaje',
    description: 'Explora nuestra exclusiva línea de maquillaje en Roldanillo. Rubores, labiales, correctores y más. Pedidos directos por WhatsApp.',
    locale: 'es_CO',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${outfit.variable}`}>
      <body>
        <GSAPRegister />
        {children}
      </body>
    </html>
  );
}
