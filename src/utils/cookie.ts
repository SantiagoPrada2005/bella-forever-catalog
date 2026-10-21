export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  city: string;
  email?: string;
  notes?: string;
  lastOrderId?: string;
  lastOrderNumber?: string;
  updatedAt?: string;
}

export const CUSTOMER_COOKIE_NAME = 'bella_customer';
export const COOKIE_MAX_AGE_DAYS = 365;

/**
 * Obtiene el valor de una cookie por nombre en el navegador.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

/**
 * Guarda una cookie en el navegador con SameSite=Lax y vigencia configurable.
 */
export function setCookie(name: string, value: string, days: number = COOKIE_MAX_AGE_DAYS): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Elimina una cookie del navegador.
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Obtiene los datos del cliente persistidos en la cookie `bella_customer`.
 */
export function getCustomerCookie(): CustomerData | null {
  try {
    const raw = getCookie(CUSTOMER_COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
      return parsed as CustomerData;
    }
  } catch (e: unknown) {
    console.warn('Error al parsear cookie de cliente:', e);
  }
  return null;
}

/**
 * Guarda los datos del cliente en la cookie `bella_customer`.
 */
export function setCustomerCookie(data: CustomerData): void {
  try {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setCookie(CUSTOMER_COOKIE_NAME, JSON.stringify(payload), COOKIE_MAX_AGE_DAYS);
  } catch (e: unknown) {
    console.warn('Error al guardar cookie de cliente:', e);
  }
}

/**
 * Genera el encabezado `Set-Cookie` para respuestas HTTP en el servidor (Astro / Cloudflare).
 */
export function formatCustomerSetCookie(data: CustomerData): string {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  const encoded = encodeURIComponent(JSON.stringify(payload));
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  return `${CUSTOMER_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
