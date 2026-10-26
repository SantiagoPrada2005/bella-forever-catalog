export type EmailAddressInput = string | { email: string; name?: string };

export interface SendEmailParams {
  to: EmailAddressInput | EmailAddressInput[];
  subject: string;
  html?: string;
  text?: string;
  from?: EmailAddressInput;
  cc?: EmailAddressInput | EmailAddressInput[];
  bcc?: EmailAddressInput | EmailAddressInput[];
  replyTo?: EmailAddressInput;
  headers?: Record<string, string>;
}

export interface EmailSendSuccess {
  success: true;
  messageId: string;
}

export interface EmailSendFailure {
  success: false;
  error: string;
}

export type EmailSendResponse = EmailSendSuccess | EmailSendFailure;

/**
 * Direcciones canónicas oficiales de la marca bajo el dominio bella-forever.com
 */
export const BRAND_SENDERS = {
  DEFAULT: { email: 'pedidos@bella-forever.com', name: 'Bella Forever' },
  WELCOME: { email: 'welcome@bella-forever.com', name: 'Bella Forever' },
  ORDERS: { email: 'pedidos@bella-forever.com', name: 'Bella Forever Pedidos' },
  NOTIFICATIONS: { email: 'notificaciones@bella-forever.com', name: 'Bella Forever' },
  SUPPORT: { email: 'soporte@bella-forever.com', name: 'Bella Forever Soporte' },
} as const;

/**
 * Correos de administradores configurados para recibir copia oculta (BCC) en eventos clave
 */
export const ADMIN_BCC_EMAILS: readonly string[] = [
  'santiagopradamoreno@gmail.com',
  'silvana1isabella2501@gmail.com',
] as const;
