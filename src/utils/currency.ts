import { CONFIG } from '../config';

/**
 * Formateador de moneda COP singleton memoizado.
 * Evita instanciar `new Intl.NumberFormat` en cada render de producto o carrito.
 */
const copFormatter = new Intl.NumberFormat(CONFIG.currency.locale, {
  style: 'currency',
  currency: CONFIG.currency.code,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formatea un monto numérico a formato estándar de Pesos Colombianos: "$ 25.000"
 */
export function formatCop(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '$ 0';
  return copFormatter.format(amount);
}

/**
 * Parsea de forma segura cualquier entrada numérica o de texto a un entero COP válido.
 * Maneja entradas con separadores de miles ("25.000", "25,000", "$ 25.000", "25000")
 * previniendo el error clásico donde parseFloat("25.000") produce 25 pesos.
 */
export function parseCop(input: string | number | null | undefined): number {
  if (input == null) return 0;
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : Math.max(0, Math.round(input));
  }

  const str = input.toString().trim();
  if (!str) return 0;

  // Elimina cualquier caracter que no sea dígito numérico (signos $, puntos de miles, comas, espacios)
  const cleanedDigits = str.replace(/\D/g, '');
  if (!cleanedDigits) return 0;

  const parsed = parseInt(cleanedDigits, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}
