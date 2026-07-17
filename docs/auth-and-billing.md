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
  "pageId": ""
}
```

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

Archivo local: `functions/.env`, basado en `functions/.env.example`.

```env
ADMIN_PUBLIC_URL=https://admin.ejemplo.com

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
STRIPE_PRICE_ENTERPRISE=price_...

MERCADOPAGO_ACCESS_TOKEN=TEST-...
```

Los nombres exactos disponibles están documentados en `functions/.env.example`.

Nunca:

- subas `functions/.env`;
- pongas secretos en variables `VITE_`;
- expongas Deploy Hooks o tokens en documentos públicos;
- aceptes webhooks sin verificar su autenticidad.

## Configurar Stripe

1. Crea productos y precios recurrentes en modo test.
2. Asigna los IDs a `STRIPE_PRICE_*`.
3. Configura `STRIPE_SECRET_KEY`.
4. Crea el endpoint:

   ```text
   https://us-central1-<project-id>.cloudfunctions.net/stripeBillingWebhook
   ```

5. Suscribe al menos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Guarda el signing secret en `STRIPE_WEBHOOK_SECRET`.
7. Despliega Functions y ejecuta un checkout de prueba.

No cambies a claves live hasta validar creación, actualización, cancelación y reintentos.

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
