# Desarrollo local

## Requisitos

- Node.js y npm.
- Un proyecto Firebase con una aplicación web.
- Firestore, Authentication y Storage habilitados según las funciones que vayas a probar.
- Firebase CLI autenticado para emuladores o despliegues.

## Instalación

Desde la raíz del monorepo:

```bash
npm install
cp landing-admin/.env.example landing-admin/.env.local
cp landing-template/.env.example landing-template/.env.local
```

Los archivos `.env.local` son locales y no deben subirse al repositorio.

## Variables del admin

Archivo: `landing-admin/.env.local`

| Variable | Requerida | Uso |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Sí | Configuración web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sí | Dominio de Authentication |
| `VITE_FIREBASE_PROJECT_ID` | Sí | ID del proyecto hub |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sí | Bucket para imágenes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sí | Configuración web de Firebase |
| `VITE_FIREBASE_APP_ID` | Sí | ID de la aplicación web |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | GA4 por defecto |
| `VITE_TEMPLATE_PREVIEW_URL` | Dev | Template para preview Local; normalmente `http://localhost:5174` |
| `VITE_MARKETING_URL` | No | Destino de `/` sin sesión |
| `VITE_BOOTSTRAP_ROOT_EMAIL` | Inicial | Email autorizado para crear el primer perfil root |
| `VITE_RECAPTCHA_SITE_KEY` | Producción | Site key de reCAPTCHA v3 para App Check |
| `VITE_APP_CHECK_DEBUG_TOKEN` | Dev | Token debug registrado en App Check |
| `VITE_FUNCTIONS_EMULATOR_HOST` | No | Functions Emulator, por ejemplo `127.0.0.1:5001` |
| `VITE_BILLING_SALES_EMAIL` | No | Contacto comercial para Enterprise |

Ejemplo mínimo:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_TEMPLATE_PREVIEW_URL=http://localhost:5174
VITE_MARKETING_URL=http://localhost:5174?pageId=leftsidedev
```

## Variables del template

Archivo: `landing-template/.env.local`

| Variable | Requerida | Uso |
|---|---:|---|
| `VITE_FIREBASE_*` | Sí | Conexión al proyecto hub |
| `VITE_PAGINA_ID` | Según modo | Fallback local o ID fijo de un sitio dedicado |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | GA4 por defecto |
| `VITE_ADMIN_ORIGIN` | Preview remoto | Origen permitido para `postMessage` |
| `VITE_ENABLE_APP_CHECK` | No | Activa App Check en el template |
| `VITE_RECAPTCHA_SITE_KEY` | Con App Check | Site key de reCAPTCHA v3 |

`VITE_PAGINA_ID` conserva su nombre por compatibilidad de configuración, pero el modelo y las queries usan `pageId`.

Ejemplo:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_PAGINA_ID=leftsidedev
```

También puedes seleccionar una landing sin modificar el archivo:

```text
http://localhost:5174?pageId=leftsidedev
```

## Iniciar las aplicaciones

Terminal 1:

```bash
cd landing-admin
npm run dev
```

Terminal 2:

```bash
cd landing-template
npm run dev
```

| Aplicación | URL |
|---|---|
| Marketing local | `http://localhost:5174?pageId=leftsidedev` |
| Login | `http://localhost:5173/login` |
| CMS | `http://localhost:5173/app` |
| Template | `http://localhost:5174?pageId=<page-id>` |

## Crear una página

Con un usuario root:

1. Abre `/app`.
2. Pulsa **Nueva landing**.
3. Usa un ID permanente en formato slug, por ejemplo `dra-maria`.
4. Selecciona el vertical y completa el contenido.
5. Revisa la vista previa Espejo o Local.
6. Pulsa **Guardar y Publicar**.
7. Abre `http://localhost:5174?pageId=dra-maria`.

Los documentos nuevos se guardan en `pages/{pageId}`. No crees campos en español; `paginas` solo se conserva para compatibilidad de lectura.

## Configurar una landing bilingüe

1. En **Identidad y apariencia**, selecciona el idioma predeterminado.
2. Activa ES y/o EN en **Idiomas públicos** (debe quedar al menos uno).
3. Usa **Editando ahora** para cambiar el idioma del formulario y de las etiquetas.
4. Completa los textos de cada idioma; imágenes, layout, contacto y colores se comparten.
5. Revisa cada idioma en el espejo: botones y títulos fijos deben cambiar con el idioma.
6. Pulsa **Guardar y Publicar**.

La landing muestra el selector EN/ES en el navbar cuando hay más de un idioma habilitado. El visitante puede usar `?lang=en` o `?lang=es`; la selección queda guardada localmente por página. Si falta una traducción, se muestra el texto del idioma predeterminado.

## Página comercial de LeftSideDev

### Sitio corporativo (recomendado)

El sitio **AI Engineering Studio** vive en `leftsidedev-site/` (multi-ruta, SEO/GEO, blog, case studies):

```bash
npm run dev:site
# http://localhost:5175
```

Plan e implementación: [leftsidedev-optimization-plan.md](./leftsidedev-optimization-plan.md).

### Seed legacy del Landing CMS (`pages/leftsidedev`)

El seed sigue disponible para la landing del producto CMS en el template:

```bash
cd functions
node scripts/seed-leftsidedev-page.mjs
```

Ejecuta el script únicamente con las credenciales y el proyecto Firebase correctos.

## App Check

App Check protege escrituras del CMS y llamadas sensibles:

1. Crea una clave **reCAPTCHA v3**; no uses el checkbox v2.
2. Registra `localhost`, `127.0.0.1` y los dominios de producción.
3. Añade la site key como `VITE_RECAPTCHA_SITE_KEY`.
4. Para desarrollo, registra el token debug que muestra la consola.
5. Empieza con modo **Monitor** y valida el tráfico antes de activar **Enforce**.

Los secretos de reCAPTCHA no pertenecen a variables `VITE_`; esas variables son visibles en el navegador.

## Functions Emulator

```bash
firebase emulators:start --only functions
```

En el admin:

```env
VITE_FUNCTIONS_EMULATOR_HOST=127.0.0.1:5001
```

## Verificación antes de enviar cambios

```bash
npm run build
npm run lint --prefix landing-admin
npm run lint --prefix landing-template
```

## Solución rápida de problemas

### El template no encuentra una página

- Confirma `?pageId=` o `VITE_PAGINA_ID`.
- Verifica que exista `pages/{pageId}`.
- En producción multi-dominio, revisa `customDomain`.
- Comprueba que las reglas permitan lectura pública del documento.

### La vista Local no actualiza

- Confirma que el template esté en el puerto `5174`.
- Revisa `VITE_TEMPLATE_PREVIEW_URL`.
- Para URLs remotas, configura `VITE_ADMIN_ORIGIN`.

### El admin no puede guardar

- Confirma que el usuario tenga un perfil válido en `users/{uid}`.
- Revisa reglas y App Check.
- Comprueba el proyecto Firebase activo y el rol asignado.

## Lecturas relacionadas

- [Arquitectura](architecture.md)
- [Despliegues](deployment.md)
- [Autenticación y billing](auth-and-billing.md)
