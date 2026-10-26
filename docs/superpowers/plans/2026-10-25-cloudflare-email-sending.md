# Implementación de Envío de Correos Electrónicos con Cloudflare Email Sending (`bella-forever.com`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar una arquitectura robusta, tipada y desacoplada para el envío de correos electrónicos transaccionales desde el dominio `bella-forever.com` utilizando el binding nativo `env.EMAIL.send()` de Cloudflare Email Sending en la aplicación Astro (`@astrojs/cloudflare`).

**Architecture:** Se adopta un patrón de puertos y adaptadores (Hexagonal): un cliente de transporte de email (`src/lib/email/client.ts`) aísla la dependencia directa de Cloudflare Workers, proporcionando validación de esquemas, manejo de fallos tolerante (graceful degradation para que fallos de red/DNS no bloqueen la creación de pedidos), un simulador de desarrollo local, plantillas HTML responsive basadas en la identidad visual de Bella Forever (`identidad-marca.md`), un endpoint HTTP (`/api/email/send`) y la integración automática en la confirmación de pedidos.

**Tech Stack:** Astro v7 (SSR `@astrojs/cloudflare`), Cloudflare Workers Email Sending API (`workerd`), TypeScript 6, Drizzle ORM / Cloudflare D1.

---

## User Review Required

> [!IMPORTANT]
> **Requisitos de la cuenta y DNS en Cloudflare para `bella-forever.com`:**
> 1. **Plan de Cloudflare**: Cloudflare Email Sending para destinatarios arbitrarios (cualquier cliente en internet) requiere una suscripción a **Workers Paid**. En el plan Free, Cloudflare solo permite despachar correos a direcciones verificadas en Email Routing.
> 2. **Configuración en el Dashboard de Cloudflare**:
>    - Navegar a **Compute > Email Service > Email Sending > Settings**.
>    - Asegurarse de que el dominio `bella-forever.com` tenga sus registros DNS automáticos activos y en estado **Locked** o válidos:
>      - `MX` en `cf-bounce.bella-forever.com`
>      - `SPF` (TXT) en `cf-bounce.bella-forever.com`: `"v=spf1 include:_spf.mx.cloudflare.net ~all"`
>      - `DKIM` (TXT) en `cf-bounce._domainkey.bella-forever.com`
>      - `DMARC` (TXT) en `_dmarc.bella-forever.com`
> 3. **Modo Local (`wrangler dev`)**: Durante el desarrollo local, `wrangler dev` simula la entrega de emails imprimiéndolos en consola sin costo ni consumo de cuota, a menos que se configure `"remote": true` en el binding.

---

## Open Questions

> [!NOTE]
> 1. **Remitente predeterminado**: Proponemos usar `pedidos@bella-forever.com` con el nombre para mostrar `"Bella Forever <pedidos@bella-forever.com>"` para compras, y `welcome@bella-forever.com` o `notificaciones@bella-forever.com` para avisos generales. ¿Deseas algún alias o nombre adicional?
> 2. **Copia de seguridad / Bcc del administrador**: ¿Deseas que cada confirmación de compra enviada al cliente envíe automáticamente una copia oculta (`bcc`) a un correo administrativo tuyo (por ejemplo `silvia...` o `pedidos@bella-forever.com`)?

---

## Proposed Changes

```
src/
├── lib/
│   └── email/
│       ├── types.ts              [NEW] Contratos, esquemas y tipos de email
│       ├── client.ts             [NEW] Capa de transporte y abstracción env.EMAIL
│       └── templates/
│           ├── brand-layout.ts   [NEW] Layout HTML base con diseño Bella Forever
│           ├── welcome.ts        [NEW] Plantilla HTML & TXT de bienvenida
│           └── order-confirmation.ts [NEW] Plantilla HTML & TXT de pedido
├── pages/
│   └── api/
│       ├── email/
│       │   └── send.ts           [NEW] Endpoint API para pruebas y envíos directos
│       └── orders/
│           └── index.ts          [MODIFY] Disparo asíncrono no bloqueante de confirmación
wrangler.jsonc                     [MODIFY] Agregar binding send_email
cloudflare-env.d.ts                [MODIFY] Tipado SendEmail en CloudflareEnv
```

---

### Componente 1: Configuración de Cloudflare y Tipado TypeScript

#### [MODIFY] [wrangler.jsonc](file:///Users/santiago/proyectos/bella-catalog/wrangler.jsonc)
- Agregar la sección `send_email` para registrar el binding `EMAIL` en el worker.
- Especificar los remitentes autorizados del dominio `bella-forever.com`.

```jsonc
	"send_email": [
		{
			"name": "EMAIL",
			"allowed_sender_addresses": [
				"welcome@bella-forever.com",
				"pedidos@bella-forever.com",
				"notificaciones@bella-forever.com",
				"soporte@bella-forever.com"
			]
		}
	],
```

#### [MODIFY] [cloudflare-env.d.ts](file:///Users/santiago/proyectos/bella-catalog/cloudflare-env.d.ts)
- Definir las interfaces de `SendEmail`, `SendEmailOptions`, `SendEmailResult` en los tipos de entorno de Cloudflare para que `env.EMAIL` tenga autocompletado estricto en todo el proyecto.

```ts
export interface SendEmailOptions {
	to: string | string[] | { email: string; name?: string } | Array<string | { email: string; name?: string }>;
	from: string | { email: string; name?: string };
	subject: string;
	html?: string;
	text?: string;
	cc?: string | string[] | { email: string; name?: string } | Array<string | { email: string; name?: string }>;
	bcc?: string | string[] | { email: string; name?: string } | Array<string | { email: string; name?: string }>;
	replyTo?: string | { email: string; name?: string };
	headers?: Record<string, string>;
}

export interface SendEmailResult {
	messageId: string;
}

export interface SendEmail {
	send(message: SendEmailOptions): Promise<SendEmailResult>;
}

// En __BaseEnv_CloudflareEnv:
EMAIL: SendEmail;
```

---

### Componente 2: Capa de Dominio y Servicio de Email (`src/lib/email`)

#### [NEW] [types.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/types.ts)
- Define los tipos de entrada, remitentes canónicos de la marca, constantes y resultado de envío.

```ts
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

export const BRAND_SENDERS = {
  DEFAULT: { email: 'pedidos@bella-forever.com', name: 'Bella Forever' },
  WELCOME: { email: 'welcome@bella-forever.com', name: 'Bella Forever' },
  ORDERS: { email: 'pedidos@bella-forever.com', name: 'Bella Forever Pedidos' },
  NOTIFICATIONS: { email: 'notificaciones@bella-forever.com', name: 'Bella Forever' },
  SUPPORT: { email: 'soporte@bella-forever.com', name: 'Bella Forever Soporte' },
} as const;
```

#### [NEW] [client.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/client.ts)
- Resuelve el binding `env.EMAIL` desde el contexto global de Cloudflare Workers (`import { env } from 'cloudflare:workers'`) o por inyección explícita `customEnv`.
- Valida los correos receptores antes del despacho.
- **Modo Simulado / Fallback**: Si se ejecuta localmente sin el binding activo, formatea el correo y lo muestra en la consola con un `messageId` simulado en lugar de romper la ejecución.
- **Aislamiento de errores**: Captura cualquier excepción de red o rechazo de Cloudflare y devuelve `{ success: false, error: ... }` para evitar caídas en cascada.

```ts
import { env } from 'cloudflare:workers';
import type { SendEmailParams, EmailSendResponse } from './types';
import { BRAND_SENDERS } from './types';

export function getEmailBinding(customEnv?: CloudflareEnv) {
  const target = customEnv || (env as unknown as CloudflareEnv);
  return target?.EMAIL;
}

export async function sendEmail(
  params: SendEmailParams,
  customEnv?: CloudflareEnv
): Promise<EmailSendResponse> {
  const emailBinding = getEmailBinding(customEnv);
  const from = params.from || BRAND_SENDERS.DEFAULT;

  if (!emailBinding) {
    console.warn('[EmailService] env.EMAIL no disponible. Simulando envío local:', {
      to: params.to,
      from,
      subject: params.subject,
    });
    return { success: true, messageId: `simulated-${crypto.randomUUID()}` };
  }

  try {
    const result = await emailBinding.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || (params.html ? stripHtml(params.html) : ''),
      cc: params.cc,
      bcc: params.bcc,
      replyTo: params.replyTo,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[EmailService] Error enviando correo:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
```

---

### Componente 3: Plantillas HTML y Texto con Identidad de Marca Bella Forever

#### [NEW] [brand-layout.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/templates/brand-layout.ts)
- Maquetación HTML compatible con clientes de correo (Outlook, Gmail, Apple Mail, iOS Mail).
- Diseñado con la paleta de `identidad-marca.md`:
  - Borgoña oscuro `#5A1623` (cabecera, títulos de acento, botones principales)
  - Dorado `#D7B06A` (líneas divisorias, bordes sutiles, detalles premium)
  - Rosa pastel `#F6D6D9` / Crema `#FAF7F5` (fondo sutil de contenedor)
  - Tipografía serif clásica en encabezados (`Georgia, Garamond, serif`)
  - Enlaces directos a Instagram (`@bellaforeverbeauty`) y WhatsApp (`+573117887806`).

#### [NEW] [welcome.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/templates/welcome.ts)
- Implementación de la plantilla de bienvenida solicitada en el ejemplo de Cloudflare (`welcome@bella-forever.com`).
- Genera versión HTML enriquecida y versión de texto plano accesible.

#### [NEW] [order-confirmation.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/templates/order-confirmation.ts)
- Resumen detallado de la orden para el cliente:
  - Número de pedido (`#BF-...`) y fecha
  - Datos de entrega (Nombre, Dirección, Ciudad, Teléfono)
  - Tabla de productos: Imagen pequeña, nombre, tono, cantidad, precio unitario y subtotal formateado en COP
  - Total a pagar y método de pago / notas
  - Botón de acción directa con mensaje prellenado a WhatsApp para coordinar el despacho.

---

### Componente 4: API Routes e Integración en la Creación de Pedidos

#### [NEW] [src/pages/api/email/send.ts](file:///Users/santiago/proyectos/bella-catalog/src/pages/api/email/send.ts)
- Endpoint `POST /api/email/send` para despachar correos directamente o probar la integración:
  - Permite enviar correos personalizados o invocar plantillas predefinidas (`welcome`, `notification`).
  - Ejemplo exacto adaptado a Astro:
    ```ts
    import type { APIRoute } from 'astro';
    import { sendEmail } from '../../../lib/email/client';

    export const prerender = false;

    export const POST: APIRoute = async ({ request, locals }) => {
      const body = await request.json();
      const result = await sendEmail(body, locals.runtime?.env);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    ```

#### [MODIFY] [src/pages/api/orders/index.ts](file:///Users/santiago/proyectos/bella-catalog/src/pages/api/orders/index.ts)
- Al crear una orden exitosa en `POST /api/orders`:
  - Si el cliente suministró un correo válido (`order.customerEmail`), se invoca `sendOrderConfirmationEmail(order)` de forma no bloqueante (`context.waitUntil` o promesa en segundo plano protegida por `catch`).
  - Si el envío falla o la dirección es errónea, la orden **no se cancela**, garantizando la integridad de la transacción comercial y registrando el incidente en los logs de Cloudflare Observability.

---

## Plan de Tareas Detallado

### Task 1: Configurar Wrangler y Tipos de Cloudflare
- [ ] **Step 1:** Agregar la propiedad `send_email` con el binding `EMAIL` en `wrangler.jsonc`.
- [ ] **Step 2:** Actualizar `cloudflare-env.d.ts` con la interfaz `SendEmail` y añadir `EMAIL: SendEmail` a `__BaseEnv_CloudflareEnv`.
- [ ] **Step 3:** Ejecutar `pnpm typecheck` para verificar que la declaración es válida.

### Task 2: Implementar la Capa de Servicio y Tipos de Email
- [ ] **Step 1:** Crear `src/lib/email/types.ts` con constantes de marca y tipos.
- [ ] **Step 2:** Crear `src/lib/email/client.ts` con la función `sendEmail`, soporte de `customEnv` y fallback simulado.
- [ ] **Step 3:** Ejecutar `pnpm typecheck` para asegurar tipado estricto.

### Task 3: Crear las Plantillas HTML de Bella Forever
- [ ] **Step 1:** Crear `src/lib/email/templates/brand-layout.ts` con el diseño base de la marca.
- [ ] **Step 2:** Crear `src/lib/email/templates/welcome.ts` con la plantilla de bienvenida.
- [ ] **Step 3:** Crear `src/lib/email/templates/order-confirmation.ts` con el desglose de productos y datos de envío.

### Task 4: Crear Endpoint API de Envío de Email
- [ ] **Step 1:** Crear `src/pages/api/email/send.ts` con validación de payload y respuesta JSON tipada.
- [ ] **Step 2:** Ejecutar `pnpm check` para verificar que la ruta API Astro compile sin advertencias.

### Task 5: Integrar Notificación de Confirmación en Pedidos
- [ ] **Step 1:** Modificar `src/pages/api/orders/index.ts` para enviar la plantilla `renderOrderConfirmationEmail` de forma asíncrona tras la inserción en base de datos.
- [ ] **Step 2:** Ejecutar `pnpm typecheck` y `pnpm check`.

---

## Verification Plan

### Automated Tests & Type Checking
- Ejecutar verificación de tipos TypeScript:
  ```bash
  pnpm typecheck
  ```
  *Resultado esperado:* 0 errores de compilación.
- Ejecutar verificación diagnóstica de Astro:
  ```bash
  pnpm check
  ```
  *Resultado esperado:* 0 errores en todos los archivos `.ts` y `.astro`.
- Ejecutar linter:
  ```bash
  pnpm lint
  ```
  *Resultado esperado:* 0 errores en archivos creados/modificados.

### Manual Verification
1. **Prueba local del Endpoint API de Email:**
   - Iniciar el servidor local: `pnpm dev`
   - Realizar una petición POST a `/api/email/send`:
     ```bash
     curl -X POST http://localhost:4321/api/email/send \
       -H "Content-Type: application/json" \
       -d '{"to": "test@example.com", "from": "welcome@bella-forever.com", "subject": "Bienvenida a Bella Forever", "html": "<h1>Bienvenida!</h1>"}'
     ```
   - *Resultado esperado:* Respuesta HTTP 200 con `{ "success": true, "messageId": "simulated-..." }` y log visible en terminal con el contenido simulado.
2. **Prueba de Creación de Orden con Email:**
   - Realizar un pedido desde el carrito o vía API con un email de prueba.
   - *Resultado esperado:* Pedido creado exitosamente en D1 y evento de envío de confirmación ejecutado sin excepciones.
3. **Verificación en Cloudflare Dashboard (Producción):**
   - Confirmar en **Compute > Email Service > Email Sending > Settings** que el dominio `bella-forever.com` tiene los registros DNS validados.
   - Desplegar (`pnpm deploy`) y comprobar en **Observability > Logs** la respuesta real de `env.EMAIL.send(...)` retornando el `messageId` oficial de Cloudflare.
