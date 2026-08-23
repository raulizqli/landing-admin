# Autenticación, roles y facturación

## Autenticación del CMS

El admin usa Firebase Authentication con email y contraseña. Los permisos de aplicación viven en:

```text
users/{uid}
```

Perfil:

```json
{
  "email": "ana@ejemplo.com",
  "role": "admin",
  "accountId": "billing-account-id",
  "assignedPageIds": ["dra-maria", "clinica-centro"],
  "pageId": "",
  "phone": "+525512345678",
  "approvalStatus": "approved"
}
```

## Auto-registro (pendiente de root)

Desde `/login` → **Crear cuenta**, un visitante puede solicitar acceso con nombre, email, teléfono (MX/US) y contraseña.

1. Callable pública `requestCmsAccess` crea Auth + `users/{uid}` con `approvalStatus: "pending"` (sin rol ni páginas).
2. El login está bloqueado (`getLoginBlockReason` → `pending`) hasta que root apruebe.
3. Root en `/app/users` (filtro Pendientes) → **Aprobar** (asigna rol/páginas) o **Rechazar** (soft: `approvalStatus: "rejected"` + Auth `disabled`).
4. Al aprobar, `approveCmsAccess` envía email automático vía **Resend** (o cola Firestore `mail` para la extensión Trigger Email).

### Email transaccional (Resend)

Los correos del CMS (aprobación de acceso, recuperación de contraseña e invitaciones) se envían con [Resend](https://resend.com) cuando Functions tiene:

```env
RESEND_API_KEY=re_...
RESEND_FROM=Toqua <noreply@tudominio.com>
```

(`APPROVAL_EMAIL_FROM` es alias de `RESEND_FROM`.)

| Flujo | Callable / acción |
|---|---|
| Recuperar contraseña (`/login`) | `requestPasswordResetEmail` (pública) |
| Invitación al crear usuario | `createCmsUser` con `createInvitation: true` |
| Reenviar invitación | `generateCmsUserInvitation` |
| Aprobar auto-registro | `approveCmsAccess` |

El dominio del remitente debe estar verificado en Resend (p. ej. `toqua.site`). El enlace de reset/invitación sigue generándose con Firebase Admin; solo cambia quién entrega el email (Resend en lugar de `noreply@*.firebaseapp.com`).

Validación de teléfono: solo México (`+52`) y Estados Unidos (`+1`).

## Roles

| Rol | Acceso |
|---|---|
| `root` | Todas las páginas, estructura, usuarios y operaciones globales |
| `admin` | Páginas incluidas en `assignedPageIds` |
| `user` | Una página indicada por `pageId` |

El frontend oculta acciones según el rol, pero las reglas de Firestore, Storage y la validación de Functions son las barreras de autorización reales.

## Crear el primer root

1. Activa Email/Password en Firebase Authentication.
2. Crea el usuario inicial.
3. Define su email en `landing-admin/.env.local`:

   ```env
   VITE_BOOTSTRAP_ROOT_EMAIL=root@ejemplo.com
   ```

4. Inicia sesión para crear `users/{uid}` cuando corresponda al flujo bootstrap.
5. Retira la variable de bootstrap cuando ya no sea necesaria.
6. Despliega reglas y Functions.

```bash
npm run deploy:rules
npm run deploy:functions
```

No uses el bootstrap como mecanismo permanente de asignación de permisos.

## Gestión de usuarios

Un root puede crear usuarios desde el panel. La Function `createCmsUser`:

1. valida sesión, App Check y rol root;
2. crea la cuenta en Authentication;
3. crea el perfil en `users/{uid}`;
4. asigna páginas según el rol.

`deleteCmsUser` elimina el perfil y la cuenta. La edición de email o contraseña requiere un flujo administrativo explícito; no debe hacerse escribiendo directamente en Firestore.

## Invitaciones de usuario (enlace para contraseña)

Root crea usuarios sin contraseña; el enlace de invitación es un **password reset** generado por Firebase Admin y enviado por email vía Resend (`sendInvitationEmail`).

El enlace tiene **dos dominios distintos**:

| Parte | Ejemplo | Qué controla |
|---|---|---|
| **Host del enlace** (página de reset) | `landing-admin-9452e.firebaseapp.com/__/auth/action?...` | Dominio de Auth emails en Firebase |
| **continueUrl** (vuelta al admin tras reset) | `admin.toqua.site/login?email=...` | `ADMIN_PUBLIC_URL` + Authorized domains |

Si ves `landing-admin-9452e` en el enlace, es **normal** mientras no configures dominio personalizado en Auth. Tras el fix de invitaciones, quitamos `linkDomain` automático porque rompía la generación; Firebase usa entonces su dominio por defecto del proyecto.

Si `admin.toqua.site` **no** está en *Authorized domains*, el `continueUrl` también cae a `landing-admin-9452e.web.app`.

### Marca completa (`admin.toqua.site` en el enlace)

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains** → añade `admin.toqua.site`.
2. **Authentication** → **Templates** → en cada plantilla → **Customize domain** → `admin.toqua.site` → verifica registros DNS (TXT/CNAME).
3. Cuando diga *Verification complete*, en `functions/.env`:

   ```env
   AUTH_LINK_DOMAIN=admin.toqua.site
   ```

4. Redeploy: `firebase deploy --only functions:createCmsUser,functions:generateCmsUserInvitation`

Hasta el paso 3, el enlace seguirá abriendo en `*.firebaseapp.com` pero el usuario volverá al admin correcto si el paso 1 está hecho.

## App Check

Las operaciones sensibles deben exigir tokens válidos:

- escrituras en Firestore;
- escrituras en Storage;
- Functions callable del CMS.

Usa reCAPTCHA v3 para aplicaciones web. Empieza en **Monitor**, registra tokens debug para desarrollo y activa **Enforce** después de verificar tráfico legítimo.

## Modelo de facturación

Las cuentas se guardan en:

```text
billingAccounts/{accountId}
```

`users/{uid}.accountId` enlaza un usuario con su cuenta de facturación.

Campos principales:

```text
plan, status, provider, pageIds,
stripeCustomerId, stripeSubscriptionId,
mercadoPagoPreapprovalId
```

## Planes

| Plan | Límite de páginas | Enfoque |
|---|---:|---|
| Starter | 1 | Secciones básicas |
| Pro | 1 | Contenido y presentación avanzados |
| Agency | Hasta 5 | Operación multi-cliente y hosting |
| Enterprise | Configurable | Límites y soporte personalizados |

Los límites y capacidades canónicos están en:

```text
packages/landing-core/src/billingPlans.js
```

No dupliques reglas de entitlement en componentes.

## Cloud Functions

| Function | Autorización | Responsabilidad |
|---|---|---|
| `createCmsUser` | root | Crea Auth + perfil |
| `deleteCmsUser` | root | Elimina Auth + perfil |
| `ensureBillingAccount` | usuario autenticado | Crea o enlaza una cuenta |
| `createBillingCheckout` | usuario autenticado | Inicia checkout |
| `setBillingPlanManual` | root | Activa un plan manual |
| `stripeBillingWebhook` | firma Stripe | Sincroniza suscripción |
| `mercadoPagoBillingWebhook` | validación Mercado Pago | Sincroniza preapproval |
| `triggerHostingDeploy` | rol autorizado | Dispara hosting externo |

## Variables de Functions

- **Prod** (`landing-admin-9452e`): `functions/.env` basado en `functions/.env.production.example` con claves **live**.
- **Stage**: `functions/.env.staging` / `.env.landings-stage` con claves **test**.

```env
ADMIN_PUBLIC_URL=https://admin.ejemplo.com

STRIPE_SECRET_KEY=sk_live_...   # Prod; Stage usa sk_test_
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_USD=price_...
STRIPE_PRICE_STARTER_MXN=price_...
STRIPE_PRICE_PRO_USD=price_...
STRIPE_PRICE_PRO_MXN=price_...
STRIPE_PRICE_AGENCY_USD=price_...
STRIPE_PRICE_AGENCY_MXN=price_...
# Fallback si falta el precio por moneda:
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...

MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
```

Los nombres exactos están en `functions/.env.example` y `functions/.env.production.example`.

Nunca:

- subas `functions/.env` / `.env.production` / `.env.staging`;
- pongas secretos en variables `VITE_`;
- expongas Deploy Hooks o tokens en documentos públicos;
- aceptes webhooks sin verificar su autenticidad;
- despliegues Prod con `sk_test_` (el guardrail `scripts/check-env.mjs --env prod` lo bloquea).

## Configurar Stripe (Stage / test)

1. Crea productos y precios recurrentes en modo **test**, o ejecuta:

   ```bash
   cd functions
   node scripts/ensure-stripe-catalog.mjs --env .env.staging
   ```

2. Pega los `STRIPE_PRICE_*` generados en el `.env` de Stage.
3. Configura `STRIPE_SECRET_KEY` (test).
4. Crea el endpoint de webhook (modo test):

   ```text
   https://us-central1-<stage-project-id>.cloudfunctions.net/stripeBillingWebhook
   ```

5. Suscribe al menos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Guarda el signing secret en `STRIPE_WEBHOOK_SECRET`.
7. Despliega Functions y ejecuta un checkout de prueba.

## Configurar Stripe (Prod / live)

1. En el Dashboard, cambia a **Live**.
2. Copia la Secret key live a `functions/.env.production` (luego a `functions/.env` antes del deploy Prod).
3. Genera el catálogo live:

   ```bash
   cd functions
   node scripts/ensure-stripe-catalog.mjs --env .env.production
   ```

4. Pega los price IDs en `.env.production` / `.env`.
5. Crea el webhook **en modo Live**:

   ```text
   https://us-central1-landing-admin-9452e.cloudfunctions.net/stripeBillingWebhook
   ```

   Mismos eventos que en Stage. Guarda `STRIPE_WEBHOOK_SECRET` live.
6. Verifica:

   ```bash
   node scripts/check-env.mjs --mode production --env prod
   ```

7. `npm run deploy:functions` contra el proyecto Prod.
8. Haz un checkout real pequeño (Starter) y confirma webhook → `billingAccounts` `status: active`.

No mezcles customers/`price_` de test con claves live.
## Configurar Mercado Pago

1. Obtén un Access Token de prueba.
2. Define `MERCADOPAGO_ACCESS_TOKEN`.
3. Configura notificaciones en:

   ```text
   https://us-central1-<project-id>.cloudfunctions.net/mercadoPagoBillingWebhook
   ```

4. Despliega Functions.
5. Prueba alta, actualización y cancelación.

## Desplegar

```bash
npm run deploy:rules
npm run deploy:functions
```

Después:

1. inicia sesión con cada rol;
2. comprueba acceso a páginas permitidas y denegadas;
3. prueba crear y eliminar un usuario no root;
4. ejecuta checkouts sandbox;
5. confirma que los webhooks actualizan `billingAccounts`;
6. revisa logs de Functions sin exponer datos sensibles.

## Checklist de seguridad

- [ ] Authentication email/password habilitado.
- [ ] No quedan mecanismos bootstrap innecesarios.
- [ ] Reglas desplegadas y probadas.
- [ ] App Check activo en operaciones sensibles.
- [ ] Functions validan identidad y rol.
- [ ] Webhooks verifican firma o autenticidad.
- [ ] Claves test y live están separadas.
- [ ] Secretos no aparecen en Git ni bundles.
- [ ] Root se reserva para tareas operativas.
- [ ] Los entitlements se validan fuera de la UI.

## Lecturas relacionadas

- [Desarrollo local](local-development.md)
- [Arquitectura](architecture.md)
- [Despliegues](deployment.md)
