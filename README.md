# Ecosistema Landings

Plataforma multi-tenant para administrar y desplegar landing pages de psicólogas profesionales.

| Proyecto | Puerto dev | Descripción |
|----------|------------|-------------|
| [`landing-admin/`](landing-admin/) | `5173` | Panel CMS con editor y vista previa en vivo |
| [`landing-template/`](landing-template/) | `5174` | Plantilla pública (un deploy multi-dominio o uno por cliente) |

---

## Arquitectura

```
Proyecto Firebase (hub) — Firestore, Storage, Hosting, Analytics
        │
        ├── landing-admin (Hosting)  ←── edición + guardar
        │
        └── landing-template (Hosting)
                 │
                 ├── Modo A: un deploy, muchos dominios → resuelve pageId por customDomain
                 └── Modo B: un sitio/build por cliente → VITE_PAGINA_ID en el build

Paginas/{id} en hub          Contenido en el mismo proyecto
        o
Paginas/{id} en hub (ruta)   + contenido en proyecto Firebase externo (otra cuenta)
```

- **Un documento** en Firestore = una landing.
- **Modo multi-dominio:** un solo build en Hosting; cada dominio apunta al mismo sitio y la app busca `customDomain` en el hub.
- **Modo por sitio:** varios sitios de Hosting con `VITE_PAGINA_ID` distinto en cada build (alternativa legacy).
- **Proyecto externo (solo datos):** el hub guarda dominio + credenciales web; el **contenido** vive en otra cuenta Firebase. El admin suele quedar en Hosting del hub; el **template** puede desplegarse en el hub o en otro hosting (cuenta manual + Deploy Hook desde el admin).

**Stack en producción (hub):** Firestore (rutas), Hosting (admin + template), reglas, Auth/usuarios CMS y Analytics del deploy. No se requiere Vercel ni otro hosting externo.

| Pieza | ¿Dónde vive? |
|-------|----------------|
| Hosting del admin | Proyecto **hub** (mismo que el CMS) |
| Hosting del `landing-template` | Proyecto **hub** por defecto; también puede desplegarse en **otro hosting** (cuenta manual + Deploy Hook desde el admin) |
| Dominios de clientes (`customDomain`) | Apuntan al Hosting donde sirvas el template (hub u otro) |
| Contenido de la landing (textos, slides…) | Hub **o** proyecto Firebase externo del cliente |
| Imágenes subidas | Storage del hub **o** del proyecto externo (según `useExternalFirebase`) |

Cuando activas “datos en otro proyecto Firebase”, **no** mueves el hosting: solo el documento de contenido y el Storage asociados a esa página.

---

## Cómo funciona `landing-template`

`landing-template` es la **aplicación pública de solo lectura**. No edita datos: al cargar resuelve *qué* landing mostrar, lee **un documento** de Firestore y lo pinta con los componentes compartidos. El contenido viviente está en Firestore; el código del template es el mismo para todas las profesionales.

### Rol en el ecosistema

```
Admin (5173)                    Template (5174 / Hosting)
─────────────                   ─────────────────────────
Edita formData en local    →    (opcional) Espejo / iframe Local
       │                              │  postMessage en preview
       ▼                              ▼
«Guardar y Publicar»           Visitante abre la URL
       │                              │
       ▼                              ▼
Firestore pages/{id}              resolvePageContext → getDoc
                              normalizePageData → LandingPage
```

| | Admin | Template |
|---|---|---|
| Escritura | Sí | No |
| Lectura | Lista + documento al editar | Un solo documento al cargar |
| Qué define el contenido | Formulario → Firestore | Firestore (no el `.env`) |
| Re-deploy al guardar | No | No: basta con publicar en el admin |

### 1. Resolver el `pageId`

Al arrancar (`landing-template/src/App.jsx` → `resolvePageContext`), elige el documento en este orden:

1. **Query** — `?pageId=maria-garcia` (alias legado `?paginaId=`). Útil en local y en la vista **Local** del admin.
2. **Dominio** — en producción (no en `localhost`), busca en el hub un documento cuyo `customDomain` coincida con el hostname.
3. **Variable de build** — `VITE_PAGINA_ID` embebida al hacer `vite build` / `npm run dev`.

Si no hay `pageId`: en **producción** muestra error; en **desarrollo** o con `?preview=true` muestra contenido demo para diseñarlo sin Firestore.

### 2. Leer y normalizar el documento

Con el `pageId` resuelto:

1. Si la ruta indica **Firebase externo** (`useExternalFirebase` + credenciales), lee en ese proyecto; si no, en el **hub**.
2. Intenta `getDoc` en la colección canónica **`pages`**, y si no existe, en la legado **`paginas`**.
3. Pasa el resultado por `normalizePageData()` (`@raulizqli/landing-core`) para migrar campos antiguos en español (`nombre` → `name`, etc.).

No hay listados ni listeners: **una lectura** al montar la página.

### 3. Renderizar la landing

El UI sale de `@raulizqli/landing-ui` (`LandingPage`, navbar, hero, secciones…). La lógica de modelo (slides, labels, temas, embeds…) está en `@raulizqli/landing-core`. En el template, muchos archivos de `src/components/` y `src/utils/` son **re-exports** hacia esos paquetes.

### 4. Vista previa desde el admin

| Modo | Qué pasa |
|------|----------|
| **Espejo** | El admin renderiza un espejo interno con `formData` (sin tocar el template ni Firestore por tecla). |
| **Local** | Iframe a `VITE_TEMPLATE_PREVIEW_URL` (dev: `http://localhost:5174`) con `?pageId=…&preview=true`. El admin envía `LANDING_PREVIEW_UPDATE` / `LANDING_PREVIEW_SCROLL` por `postMessage`. |

En preview, el template solo acepta mensajes del origen admin (`localhost` en DEV; `VITE_ADMIN_ORIGIN` en producción). Analytics no se dispara en DEV ni con `?preview=true`.

### 5. Dos formas de desplegarlo

| Modo | Cómo sabe qué landing es | Cuándo usarlo |
|------|--------------------------|---------------|
| **Multi-dominio** (recomendado) | Hostname → `customDomain` en Firestore | Un solo Hosting; muchos dominios al mismo sitio |
| **Por sitio** | `VITE_PAGINA_ID` fijo en cada build | Un sitio Hosting por cliente (`scripts/deploy-client-template.sh`) |

En ambos casos, textos e imágenes siguen en Firestore (o en el Firebase externo del cliente). Cambiar el contenido **no** exige redeploy del template.

### Variables que importan

| Variable | Rol |
|----------|-----|
| `VITE_FIREBASE_*` | Conexión al hub (siempre; también para resolver dominios) |
| `VITE_PAGINA_ID` | Fallback / modo por sitio; en multi-dominio es opcional |
| `VITE_ENABLE_APP_CHECK` | Opt-in; por defecto **apagado** en el template público |
| `VITE_ADMIN_ORIGIN` | Origen del admin para aceptar `postMessage` en preview remoto |
| `VITE_FIREBASE_MEASUREMENT_ID` | GA4 por defecto si el documento no trae `analyticsMeasurementId` |

Detalle de `.env.local` y deploys: [Para qué sirve `landing-template/.env.local`](#para-qué-sirve-landing-templateenvlocal) y [`landing-template/README.md`](landing-template/README.md).

---

## Desarrollo local

```bash
# Terminal 1 — Admin
cd landing-admin
cp .env.example .env.local   # completa VITE_FIREBASE_* y VITE_TEMPLATE_PREVIEW_URL
npm install
npm run dev                  # http://localhost:5173

# Terminal 2 — Template
cd landing-template
cp .env.example .env.local   # completa Firebase + VITE_PAGINA_ID
npm install
npm run dev                  # http://localhost:5174
```

Ambos proyectos liberan su puerto automáticamente antes de arrancar (`5173` admin, `5174` template).

### Variables de entorno

**`landing-admin/.env.local`**

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_FIREBASE_API_KEY` | Sí | Credenciales Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sí | |
| `VITE_FIREBASE_PROJECT_ID` | Sí | |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sí | Necesaria para subir imágenes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sí | |
| `VITE_FIREBASE_APP_ID` | Sí | |
| `VITE_TEMPLATE_PREVIEW_URL` | Dev | `http://localhost:5174` para vista previa Local |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | GA4 por defecto si la landing no define ID propio |
| `VITE_BOOTSTRAP_ROOT_EMAIL` | No | Email del primer root; al iniciar sesión crea `users/{uid}` con rol `root` si no existe |
| `VITE_RECAPTCHA_SITE_KEY` | Sí (prod) | Clave **reCAPTCHA v3** para App Check (no uses v2) |
| `VITE_APP_CHECK_DEBUG_TOKEN` | Dev | Token de depuración registrado en Firebase Console |

### Firebase App Check

Las escrituras en Firestore, Storage y las Cloud Functions del CMS exigen un token válido de **App Check**. El login con Auth funciona sin App Check hasta que lo actives en la consola para Authentication.

**Por qué no puedes habilitarlo:** casi siempre es porque la clave es **reCAPTCHA v2** (checkbox). App Check solo acepta **reCAPTCHA v3** (score-based).

**Configuración paso a paso:**

1. Crea una clave nueva en [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create) → tipo **reCAPTCHA v3**.
2. Dominios: `localhost`, `127.0.0.1`, `landing-admin-9452e.firebaseapp.com` y tus dominios de producción.
3. Firebase Console → **App Check** → **Apps** → tu app web → proveedor **reCAPTCHA v3** → pega la site key.
4. En `landing-admin/.env.local` y `landing-template/.env.local`:
   ```
   VITE_RECAPTCHA_SITE_KEY=tu_clave_v3
   ```
5. **Desarrollo local:** arranca el admin, abre la consola del navegador y copia el token debug que imprime App Check. Regístralo en App Check → **Manage debug tokens**.
6. Activa App Check en modo **Monitor** para Firestore, Storage y Functions antes de **Enforce**.
7. Si la API falla al registrar: habilita **Firebase App Check API** en [Google Cloud Console](https://console.cloud.google.com/apis/library/firebaseappcheck.googleapis.com?project=landing-admin-9452e).

El secreto de reCAPTCHA (`RECAPCHA_SECRET`) **no** va en el cliente; solo la site key con prefijo `VITE_`.

### Autenticación y roles (admin)

El panel admin requiere **Firebase Authentication** (email/contraseña). Los permisos viven en Firestore, colección **`users/{uid}`**:

| Rol | Acceso |
|-----|--------|
| `root` | Ve y edita **todas** las páginas. Gestiona usuarios. |
| `admin` | Ve y edita solo las páginas en `assignedPageIds`. |
| `user` | Ve y edita **una sola** página (`pageId`). |

**Bootstrap inicial (desarrollo):**

1. Activa **Email/Password** en Firebase Console → Authentication.
2. Crea un usuario con email/contraseña.
3. En `landing-admin/.env.local`, define `VITE_BOOTSTRAP_ROOT_EMAIL` con ese email.
4. Inicia sesión en el admin → se crea automáticamente `users/{uid}` con rol `root`.
5. Despliega las reglas de `firestore.rules` y `storage.rules` (escritura autenticada por rol + App Check).
6. Configura App Check (ver sección anterior) antes de guardar páginas en producción.
7. Despliega las Cloud Functions: `npm run deploy:functions` (necesarias para crear usuarios desde el panel).

**Gestionar usuarios desde el panel:** el root abre **Usuarios** en la barra lateral, completa email, contraseña, rol y páginas, y pulsa **Crear usuario**. La función `createCmsUser` registra la cuenta en Firebase Auth y el perfil en `users/{uid}`.

**Cloud Functions** (`functions/`):

| Función | Quién puede llamarla | Qué hace |
|---------|----------------------|----------|
| `createCmsUser` | root autenticado | Crea usuario Auth (email/contraseña) + perfil Firestore |
| `deleteCmsUser` | root autenticado | Elimina perfil Firestore y cuenta Auth |

Despliegue:

```bash
npm run deploy:functions
```

Desarrollo local con emulador (opcional):

```bash
firebase emulators:start --only functions
# En landing-admin/.env.local:
# VITE_FUNCTIONS_EMULATOR_HOST=127.0.0.1:5001
```

**Edición de usuarios existentes:** actualiza rol y páginas en Firestore. El email y la contraseña de Authentication no se cambian desde el panel (requeriría otra función).

Esquema de perfil:

```json
{
  "email": "ana@ejemplo.com",
  "role": "admin",
  "assignedPageIds": ["maria-garcia", "lucia-ruiz"],
  "pageId": ""
}
```

Para `user`, solo `pageId` (una página). Las reglas de Firestore y Storage validan estos permisos en el servidor.

**`landing-template/.env.local`**

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_FIREBASE_*` | Sí | Mismas credenciales que el admin |
| `VITE_PAGINA_ID` | No* | Fallback del documento a leer (ej. `maria-garcia`). *Obligatorio en modo por-sitio; en multi-dominio suele bastar `customDomain` |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | ID de medición GA4 (`G-XXXXXXXX`) |
| `VITE_ADMIN_ORIGIN` | Prod | Origen del admin para `postMessage` en vista previa remota |

### Para qué sirve `landing-template/.env.local`

El archivo **`.env.local`** es la configuración de **tu máquina** al ejecutar `npm run dev` en `landing-template`. No forma parte del repositorio (está en `.gitignore`) y **no** guarda el contenido de las landings: solo indica *cómo conectar* la plantilla con Firebase y *qué documento* leer.

**Flujo de trabajo:**

1. Copia la plantilla sin secretos: `cp .env.example .env.local`
2. Rellena las variables con los mismos valores Firebase que usa `landing-admin`
3. Pon en `VITE_PAGINA_ID` el slug del documento que quieres ver (ej. `maria-garcia`)
4. Arranca `npm run dev` → la app resuelve el `pageId` (`?pageId=`, `VITE_PAGINA_ID` o dominio) y hace `getDoc` a `pages/{id}` (o `paginas/{id}` legado)

**Qué hace cada variable en el template:**

| Variable | Función en desarrollo |
|----------|----------------------|
| `VITE_FIREBASE_*` | Credenciales del proyecto Firebase compartido con el admin. Sin ellas no hay conexión a Firestore ni Storage. |
| `VITE_PAGINA_ID` | **Selector de cliente.** Define qué landing cargar. Cambia este valor para previsualizar otra profesional sin tocar código. |
| `VITE_FIREBASE_MEASUREMENT_ID` | GA4 por defecto si el documento en Firestore no define `analyticsMeasurementId`. En dev el tracking suele estar desactivado. |
| `VITE_ADMIN_ORIGIN` | Solo si usas vista previa **Local** del admin apuntando a un template desplegado (no a `localhost`). Debe coincidir con la URL del admin para aceptar `postMessage`. |

**`.env.local` vs producción (Firebase Hosting):**

| Entorno | Dónde va la config | Notas |
|---------|-------------------|--------|
| Desarrollo | `landing-template/.env.local` | Un solo archivo; cambias `VITE_PAGINA_ID` para probar distintas landings |
| Producción | `landing-template/.env.production` antes del build | Vite embebe las variables al compilar; un **sitio de Hosting** por cliente con su `VITE_PAGINA_ID` |

El código del template es **el mismo** para todas las webs. La diferencia entre la landing de una oftalmóloga y la de una psicóloga no está en `.env.local` salvo por `VITE_PAGINA_ID`: textos, imágenes, catálogo y secciones viven en **Firestore** y se editan desde el admin.

**Alternativa en dev sin cambiar `.env.local`:** pasa el ID por query: `http://localhost:5174?pageId=maria-garcia` (así lo abre la vista previa Local del admin). Si no hay `pageId` ni `VITE_PAGINA_ID`, en desarrollo/`?preview=true` verás contenido demo; en producción sin preview, un error de configuración.

Explicación completa del runtime: [Cómo funciona `landing-template`](#cómo-funciona-landing-template).

**No confundir con:**

- **`.env.example`** — plantilla documentada para el equipo; sin valores reales; sí se sube a git
- **Contenido de la landing** — nombre, servicios, catálogo, etc.; eso está en Firestore, no en variables de entorno
- **`landing-admin/.env.local`** — config del panel CMS (`VITE_TEMPLATE_PREVIEW_URL`, mismas credenciales Firebase)

---

## Esquema de datos (`pages`)

Cada documento en la colección **`pages`** representa una landing. La colección legada **`paginas`** sigue siendo legible para compatibilidad; los guardados nuevos van a `pages`.

### Identidad y contenido

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre profesional |
| `specialty` | string | Especialidad o enfoque |
| `vertical` | string | Preset de industria (`generic`, `psychology`, `dental`, `veterinary`, `legal`, `medical`, `beauty`, `fitness`, `education`, `ecommerce`). Default `generic`. Ajusta textos por defecto; `customLabels` tiene prioridad. |
| `aboutTagline` | string | Frase destacada en «Sobre mí» |
| `aboutBio` | string | Biografía |
| `location` | string | Ubicación del consultorio |
| `locationMapsUrl` | string | Enlace de Google Maps o URL embed (`/maps/embed?pb=...`) |
| `showLocationMap` | boolean | Mostrar mapa embebido en la sección contacto |
| `contactMapLayout` | `'below'` \| `'beside'` | Posición del mapa: debajo (default) o al lado en escritorio (en móvil siempre abajo) |
| `email` | string | Email público |
| `phone` | string | Teléfono público |
| `phoneIsWhatsapp` | boolean | Si es `true`, el teléfono abre WhatsApp en lugar de llamada |

### Barra de navegación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `navMode` | `'profile'` \| `'logo'` | Estilo de marca en el navbar |
| `navIconUrl` | string | URL de icono/foto (modo perfil) |
| `navLogoUrl` | string | URL del logo grande (modo logo) |
| `navIconOnly` | boolean | En modo perfil: solo icono, sin nombre/especialidad |
| `navCtaTarget` | `'email'` \| `'whatsapp'` \| `'link'` | Destino del botón «Reservar cita» |
| `navCtaLink` | string | URL personalizada (solo si `navCtaTarget` es `'link'`) |

### Sección antes del hero (`preHero`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `preHeroEnabled` | boolean | Mostrar la sección (por defecto `false`) |
| `preHeroMode` | `'banner'` \| `'split'` | Imagen completa o foto + título/texto editables |
| `preHeroImageSide` | `'left'` \| `'right'` | En modo `split`: lado de la imagen (por defecto `left`) |
| `preHeroImageUrl` | string | URL o imagen subida a Storage |
| `preHeroTitle` | string | Título (solo modo `split`) |
| `preHeroText` | string | Párrafos separados por línea en blanco (solo modo `split`) |

### Carrusel hero (`heroSlides`)

Array de diapositivas. Cada elemento:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `imageUrl` | string | Imagen de fondo (URL o Firebase Storage) |
| `videoUrl` | string | Enlace de video opcional (YouTube, Vimeo o `.mp4` directo). Fondo en bucle sin sonido |
| `title` | string | Título opcional |
| `text` | string | Texto opcional |
| `showTitle` | boolean | Mostrar título en la diapositiva |
| `showText` | boolean | Mostrar texto en la diapositiva |
| `showButtons` | boolean | Mostrar CTAs «Contactar» / «Conocer más» |
| `buttonsPosition` | string | `center` · `top` · `bottom` · `top-left` · `top-right` · `bottom-left` · `bottom-right` |
| `showGradient` | boolean | Mostrar velo/degradado oscuro sobre la imagen (por defecto `true`) |

Al guardar, el admin sincroniza `heroTitle` y `heroSubtitle` desde la primera diapositiva (compatibilidad con datos antiguos).

### Servicios y temas (`services`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `servicesSectionEnabled` | boolean | Mostrar la sección (por defecto `false`) |
| `servicesSectionTitle` | string | Título de la sección |
| `servicesSectionText` | string | Texto introductorio opcional |
| `servicesDisplayMode` | `'stack'` \| `'carousel'` | Lista vertical o carrusel |
| `servicesCarouselPerView` | `1`–`4` | Ítems visibles por página del carrusel (default `3`) |
| `servicesCarouselAutoplay` | boolean | `true` = avance automático (~5 s); `false` = solo botones. En automático se pausa al pasar el mouse |
| `services` | array | Lista de servicios o temas |

Cada elemento de `services`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `layout` | string | `title` · `title_description` · `title_list` (ver abajo) |
| `title` | string | Nombre del servicio o tema |
| `description` | string | Texto (layouts con descripción) |
| `listItems` | string[] | Ítems de lista, una línea cada uno (layout `title_list`) |
| `imageUrl` | string | Imagen **opcional** en los tres layouts |

Layouts de ítem:

| `layout` | Contenido |
|----------|-----------|
| `title` | Solo título (+ imagen opcional) |
| `title_description` | Título + descripción (+ imagen opcional) |
| `title_list` | Título + viñetas (`listItems`) (+ imagen opcional) |

Aliases legacy al leer: `list` / `title_description_image` → `title_description`; `title_image` → `title`; `title_list_image` → `title_list`.

Ubicada entre «Sobre mí» y la sección de catálogo. Solo se muestran ítems visibles según su layout (título/descripción/lista/imagen).

### Catálogo de productos (`catalog`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `catalogSectionEnabled` | boolean | Mostrar la sección (por defecto `false`) |
| `catalogSectionTitle` | string | Título de la sección |
| `catalogSectionText` | string | Texto introductorio opcional |
| `catalogItems` | array | Lista de productos |

Cada elemento de `catalogItems`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | string | Nombre del producto |
| `description` | string | Descripción breve |
| `imageUrl` | string | Foto del producto (URL o Firebase Storage) |
| `price` | string | Precio visible opcional (ej. `$2,500 MXN`) |
| `link` | string | Enlace opcional («Ver más») |

Ubicada entre «Servicios» y «Galería». Útil para lentes, armazones, paquetes u otros productos.

### Galería (`gallery`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `gallerySectionEnabled` | boolean | Mostrar la sección (por defecto `false`) |
| `gallerySectionTitle` | string | Título de la sección |
| `gallerySectionText` | string | Intro opcional |
| `galleryPortfolioUrl` | string | URL opcional al portafolio completo externo (Pixieset, SmugMug, Format, etc.) |
| `galleryPortfolioLabel` | string | Texto del botón CTA (si vacío: etiqueta `gallery.viewPortfolio`) |
| `galleryItems` | array | Fotos de la galería |

Cada elemento de `galleryItems`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `imageUrl` | string | Imagen (obligatoria para publicarse) |
| `caption` | string | Leyenda opcional |
| `alt` | string | Texto alternativo opcional |

Ubicada entre «Catálogo» y «Video». Ideal para una selección curada; el CTA apunta al portafolio grande externo.

### Sección de video (`videoSection`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `videoSectionEnabled` | boolean | Mostrar la sección (por defecto `false`) |
| `videoSectionUrl` | string | Enlace YouTube, Vimeo o `.mp4` directo |
| `videoSectionTitle` | string | Título opcional sobre el reproductor |
| `videoSectionText` | string | Texto introductorio opcional (párrafos con línea en blanco) |

Reproductor 16:9 con controles visibles, ubicado entre «Galería» y «Testimonios».

### Testimonios (`testimonials`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `testimonialsEnabled` | boolean | Mostrar la sección (por defecto `false`) |
| `testimonialsSectionTitle` | string | Título de la sección (por defecto «Testimonios») |
| `testimonials` | array | Lista de testimonios |

Cada elemento de `testimonials`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | string | Nombre o atribución (ej. «María G.») |
| `quote` | string | Frase del testimonio (obligatoria para mostrarse) |
| `imageUrl` | string | Foto opcional (URL o Firebase Storage) |

Ubicada entre la sección de video y «Blog» / «Contacto». Solo se muestran entradas con `quote` no vacío. Sin foto, se muestran iniciales del `title` (o una comilla tipográfica).

### Blog / noticias (`blog`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `blogSectionEnabled` | boolean | Mostrar la sección (por defecto `false`) |
| `blogSectionTitle` | string | Título de la sección |
| `blogSectionText` | string | Intro opcional |
| `blogPosts` | array | Entradas / bloques |

Cada elemento de `blogPosts`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `layout` | string | `title_text` · `title_text_image_left` · `title_image_right_text` · `title_image` · `image_only` |
| `title` | string | Título del bloque |
| `text` | string | Cuerpo |
| `imageUrl` | string | Imagen (según layout) |
| `imageAlt` | string | Alt opcional |

Ubicada entre «Testimonios» y «Contacto».

### Secciones personalizadas (`customEmbeds`)

Array de bloques extras insertables en distintas posiciones (`placement`: `before_pre_hero`, `after_hero`, `after_gallery`, `after_contact`, …).

| Campo común | Tipo | Descripción |
|-------------|------|-------------|
| `id` | string | Identificador estable |
| `enabled` | boolean | Activo |
| `type` | string | Tipo de bloque (ver abajo) |
| `label` | string | Nombre interno (solo admin) |
| `title` | string | Título visible |
| `placement` | string | Ancla de posición |
| `fullWidth` | boolean | Sin contenedor central |
| `sortOrder` | number | Orden relativo |

Tipos:

| `type` | Uso / campos relevantes |
|--------|-------------------------|
| `pre_hero` | Bloque banner/split (`preHeroMode`, `preHeroImageSide`, `imageUrl`, `body`) |
| `services` | Servicios extra (`serviceItems` con los mismos layouts, `servicesDisplayMode`, `servicesCarouselPerView`, `servicesCarouselAutoplay`) |
| `portfolio` | Portafolio externo: `portfolioUrl`, `portfolioProvider` (`pixieset` \| `smugmug` \| `format` \| `adobe` \| `custom`), CTA, `htmlCode` opcional (embed) |
| `faq` | Preguntas (`faqItems[]`) |
| `steps` | Proceso (`steps[]`) |
| `text` | Texto editorial (`body`) |
| `cta` | Banner de cita (`ctaText`, `ctaButtonLabel`, `ctaButtonUrl`) |
| `quote` | Cita destacada (`quoteText`, `quoteAttribution`) |
| `embed` | HTML libre (`htmlCode`) |

**Layout lock (roles):** solo **root** puede activar/desactivar secciones de página y añadir/quitar embeds. Admin/user editan el contenido de lo ya habilitado.

> **Compatibilidad:** al leer documentos antiguos con nombres en español (`nombre`, `ubicacion`, `navModo: 'perfil'`, etc.), `normalizePageData()` los convierte automáticamente al esquema en inglés.

### Redes sociales

Se guardan **solo identificadores** (no URLs completas). El prefijo del enlace es fijo en la UI.

| Campo | Prefijo | Ejemplo guardado |
|-------|---------|------------------|
| `instagram` | `instagram.com/` | `usuario` |
| `whatsapp` | `wa.me/` | `525512345678` |
| `facebook` | `facebook.com/` | `pagina` |
| `linkedin` | `linkedin.com/in/` | `usuario` |
| `doctoralia` | `doctoralia.com.mx/` | `nombre-apellido/especialidad` |
| `tiktok` | `tiktok.com/@` | `usuario` |
| `youtube` | `youtube.com/@` | `canal` |
| `socialIconOnly` | — | `true` = botones solo con icono |

### Apariencia por sección (`sectionThemes`)

Objeto opcional con el fondo de cada bloque de la landing. Si no existe, se usan los colores por defecto del diseño.

Claves disponibles: `page`, `nav`, `preHero`, `hero`, `about`, `services`, `catalog`, `gallery`, `video`, `testimonials`, `blog`, `contact`, `social`, `footer`.

Cada sección admite:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `backgroundColor` | string | Color hex (`#F4F1EA`) |
| `useGradient` | boolean | Activar degradado entre dos colores |
| `gradientColor` | string | Segundo color del degradado |
| `gradientDirection` | string | `to-bottom`, `to-top`, `to-left`, `to-right`, `to-bottom-right`, `to-bottom-left`, `to-top-right`, `to-top-left` |

Solo en `nav`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `backgroundOpacity` | number | Transparencia 0–100 (por defecto `90`). Incluye blur de fondo |

Ejemplo:

```json
"sectionThemes": {
  "nav": {
    "backgroundColor": "#F4F1EA",
    "useGradient": false,
    "gradientColor": "#E8E4DB",
    "gradientDirection": "to-bottom",
    "backgroundOpacity": 70
  },
  "services": {
    "backgroundColor": "#FFFFFF",
    "useGradient": true,
    "gradientColor": "#F4F1EA",
    "gradientDirection": "to-bottom-right"
  }
}
```

En el admin, cada sección del formulario incluye un bloque **Fondo de sección**; la barra de navegación añade el control de transparencia. **Apariencia general** configura página, hero (fallback sin imagen) y pie.

### Dominio y proyecto Firebase (`customDomain`, `externalFirebase`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `customDomain` | string | Dominio sin `www.` (ej. `dra-maria.com`). Resolución multi-dominio en producción |
| `useExternalFirebase` | boolean | Si `true`, el **contenido** se lee/escribe en otro proyecto Firebase |
| `externalFirebase` | object | `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` |

Con proyecto externo, el **hub** guarda nombre, `customDomain` y credenciales web; el documento completo vive en la otra cuenta. Configura reglas de **lectura pública** en `pages` / `paginas` (y Storage) en ese proyecto.

**Hosting:** el admin suele estar en el **hub**. El `landing-template` puede estar en el hub o en **otro hosting** (Vercel/Netlify/…): la cuenta se crea a mano y desde el admin se dispara el Deploy Hook — ver [Publicar el template en otro hosting](#publicar-el-template-en-otro-hosting-desde-el-admin).

Guía de datos externos: [Landing con contenido en otra cuenta Firebase](#landing-con-contenido-en-otra-cuenta-firebase).

### Analytics

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `analyticsMeasurementId` | string | ID GA4 (`G-XXXXXXXX`). Si está vacío, usa `VITE_FIREBASE_MEASUREMENT_ID` del deploy |

En producción se registran: `page_view`, clics en CTAs, contacto (email/teléfono) y redes sociales. No se activa en desarrollo ni en vista previa (`?preview=true`).

---

## Dónde se guardan los datos

Todo el contenido editable de cada landing vive en **tu proyecto de Firebase**. El código en Firebase Hosting/Git solo sirve la aplicación; **no** guarda textos ni imágenes de las profesionales.

### Resumen rápido

| Qué | Dónde | Cuándo se escribe |
|-----|--------|-------------------|
| Textos, toggles, redes, carrusel, configuración | **Firestore** → colección `paginas` | Al pulsar **Guardar y Publicar** en el admin |
| Imágenes subidas desde el admin | **Firebase Storage** → `paginas/{id}/...` | Al subir un archivo (la URL resultante se guarda en Firestore al publicar) |
| URLs de imágenes pegadas manualmente | **Firestore** (campo `*Url`) | Al publicar |
| Credenciales Firebase, `VITE_PAGINA_ID`, GA4 | **`.env.local`** (dev) o **`.env.production`** + build (prod) | Se compilan en el bundle estático; no van en Firestore |
| Vista previa mientras escribes | **Memoria del navegador** (`formData` en el admin) | En cada tecla; **no** se persiste hasta guardar |
| Métricas de visitas y clics | **Firebase Analytics / GA4** | Automático en producción (no en dev ni `?preview=true`) |

### Firestore — contenido de cada landing

**Ruta en consola:** [Firebase Console](https://console.firebase.google.com/) → tu proyecto → **Firestore Database** → colección **`paginas`** → documento **`{id}`**.

Ejemplo para la psicóloga con ID `maria-garcia`:

```
paginas/
└── maria-garcia/          ← mismo valor que VITE_PAGINA_ID en el deploy
    ├── name: "Dra. María García"
    ├── specialty: "Psicología clínica"
    ├── email: "contacto@ejemplo.com"
    ├── heroSlides: [ { imageUrl, title, text, ... }, ... ]
    ├── navIconUrl: "https://firebasestorage.googleapis.com/..."
    ├── instagram: "usuario"
    ├── analyticsMeasurementId: "G-XXXXXXXX"
    └── ... (resto de campos del esquema)
```

- **Un documento** = una landing.
- El **ID del documento** es el identificador permanente (slug). Debe coincidir con `VITE_PAGINA_ID` en el deploy del template de esa cliente.
- El admin **lee** la lista al abrir y **escribe** con `updateDoc` al guardar.
- El template en producción **solo lee** un documento (`getDoc`) al cargar la página.

### Firebase Storage — archivos de imagen

**Ruta en consola:** Firebase Console → **Storage** → carpeta **`paginas/`**.

Estructura al subir desde el admin:

```
paginas/
└── maria-garcia/
    ├── hero-slide-1-1712345678901.jpg
    ├── pre-hero-1712345678902.png
    ├── nav-icono-1712345678903.jpg
    └── nav-logo-1712345678904.png
```

- El admin sube el archivo a Storage y obtiene una **URL pública de descarga**.
- Esa URL se guarda en el campo correspondiente del documento Firestore (`imagenUrl`, `navIconoUrl`, etc.) cuando publicas.
- Si pegas una URL externa (Unsplash, CDN propio), **no** pasa por Storage: la URL va directo a Firestore.

### Variables de entorno (no son contenido de la landing)

Archivos locales (no subir a git):

- `landing-admin/.env.local`
- `landing-template/.env.local`

Guía detallada del template: [Para qué sirve `landing-template/.env.local`](#para-qué-sirve-landing-templateenvlocal).

En Firebase Hosting, cada **sitio** del template puede apuntar a un build con `VITE_PAGINA_ID` distinto. Lo importante:

- **`VITE_PAGINA_ID`** indica **qué documento** de Firestore leer; el contenido sigue estando en Firebase.
- **`VITE_FIREBASE_*`** apuntan al mismo proyecto Firebase que usa el admin.

### Qué no se guarda en la nube

| Dato | Motivo |
|------|--------|
| Cambios del formulario sin guardar | Solo existen en el estado React del admin hasta **Guardar y Publicar** |
| Modo demo (`vista-previa-demo`) | No hay documento en Firestore; contenido de relleno local |
| Build de `landing-admin/dist` y `landing-template/dist` | Artefactos estáticos subidos a Firebase Hosting; se regeneran en cada deploy |

### Cómo comprobar que los datos están guardados

1. Edita una landing en el admin y pulsa **Guardar y Publicar**.
2. Abre Firebase Console → Firestore → `paginas` → el documento de esa landing.
3. Verifica que los campos actualizados coinciden con el formulario.
4. Si subiste imágenes, revisa Storage en `paginas/{id}/` y que los campos `*Url` en Firestore apunten a `firebasestorage.googleapis.com`.
5. Recarga la landing pública (o el template local con el `VITE_PAGINA_ID` correcto) para confirmar que lee esos datos.

---

## Subida de imágenes

Desde el admin puedes **subir imágenes** (JPG, PNG, WEBP, GIF; máx. 5 MB) además de pegar URLs:

- Fondo del carrusel hero (por diapositiva)
- Sección antes del hero (foto o banner)
- Icono/foto del navbar
- Logo personalizado del navbar

Las imágenes se almacenan en Firebase Storage bajo `paginas/{id}/...` y la URL de descarga se guarda en Firestore al publicar.

### Reglas de Storage

Despliega las reglas incluidas en [`storage.rules`](storage.rules):

```bash
firebase deploy --only storage
```

---

## Landing con contenido en otra cuenta Firebase

Usa esto cuando el **cliente** quiere que textos e imágenes vivan en **su** proyecto Firestore/Storage, pero el sitio web sigue sirviéndose desde el Hosting del hub (admin + template).

### Qué es externo y qué no

| | Proyecto hub (admin + template) | Proyecto Firebase del cliente |
|--|--------------------------------|-------------------------------|
| Hosting / URL / dominios | Sí | No (no hace falta Hosting ahí) |
| Documento de ruta (`customDomain`, credenciales) | Sí | — |
| Documento de contenido (`name`, hero, servicios…) | Solo si externo está apagado | Sí, si `useExternalFirebase` |
| Storage de imágenes de esa landing | Solo si externo está apagado | Sí, si externo está activo |
| Credenciales en el `.env` del template | Siempre del **hub** | Van en el documento (`externalFirebase`), no en el build |

### Paso 1 — Proyecto del cliente

1. En [Firebase Console](https://console.firebase.google.com/), crea el proyecto en la cuenta del cliente.
2. Activa **Firestore** y **Storage**.
3. Añade una app **Web** y copia: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
4. Reglas mínimas de lectura pública (el template solo lee):

```
match /pages/{pageId} {
  allow read: if true;
  allow write: if false; // o con Auth si el admin escribe autenticado ahí
}
match /paginas/{pageId} {
  allow read: if true;
  allow write: if false;
}
```

Ajusta Storage para servir las imágenes públicas que suba el admin.

### Paso 2 — Crear la landing en el admin (hub)

Con un usuario **root** (crear páginas):

1. Abre el admin del hub.
2. **+ Nueva landing** → ID slug (ej. `dra-maria`), nombre y vertical.
3. Se crea el documento de ruta en el hub (`pages/{id}`).

### Paso 3 — Conectar el Firebase externo

1. En el editor, sección **Hosting, analytics y pie**.
2. (Opcional) **Dominio personalizado** → `dra-maria.com` (sin `www.`).
3. Marca **Los datos de esta landing viven en otro proyecto Firebase**.
4. Pega las seis credenciales web del proyecto del cliente.
5. **Guardar y Publicar**.

Al publicar con externo activo:

- el **contenido** se escribe en el Firestore/Storage del cliente;
- el **hub** queda con nombre, `customDomain`, `useExternalFirebase` y `externalFirebase`.

### Paso 4 — Cómo se ve en público

| Modo | Qué hacer |
|------|-----------|
| **Multi-dominio** (recomendado) | El mismo deploy del template; el hostname debe coincidir con `customDomain`. Añade el dominio al Hosting del **hub**. |
| **Por sitio** | Build del template con `VITE_PAGINA_ID=dra-maria` y `VITE_FIREBASE_*` del **hub**. |

Probar en local (admin/template apuntando al hub):

```text
http://localhost:5174?pageId=dra-maria
```

### Flujo de datos

```
Hub Firebase                              Firebase del cliente
─────────────────                         ───────────────────
Hosting: admin + template                 (sin Hosting obligatorio)
pages/{id}:                               pages/{id}:
  customDomain                              name, hero, services…
  useExternalFirebase: true                 imágenes en Storage
  externalFirebase: { …creds }
```

Mientras el checkbox esté **apagado**, demo y contenido viven en el hub. Las ediciones posteriores siguen el mismo **Guardar y Publicar** (el admin escribe en el externo).

---

## Publicar el template en otro hosting (desde el admin)

La **creación de la cuenta** en Vercel / Netlify / Cloudflare / otro Firebase Hosting es **manual**. El admin solo guarda la config y dispara el deploy.

### Campos por landing

| Campo | Uso |
|-------|-----|
| `hostingProvider` | `hub` \| `webhook` \| `github` |
| `hostingDeployHookUrl` | Deploy Hook (Vercel/Netlify/…) |
| `hostingGithubOwner` / `Repo` / `Workflow` / `Ref` | Para `workflow_dispatch` |
| `hostingPublicUrl` | URL pública de referencia |

Con contenido externo, estos campos se guardan en el **hub** (junto a dominio y credenciales).

### Flujo recomendado (webhook)

1. Crea el proyecto/sitio a mano en el hosting.
2. Conecta el repo o sube el build del `landing-template` (con `VITE_FIREBASE_*` del **hub**).
3. Genera un **Deploy Hook** y pégalo en el admin → **Hosting del template**.
4. Guarda la página.
5. Pulsa **Publicar hosting** (root o admin).

La Cloud Function `triggerHostingDeploy` hace `POST` al hook.

### Alternativa GitHub Actions

1. Usa el workflow [`.github/workflows/deploy-template-manual.yml`](.github/workflows/deploy-template-manual.yml) (`workflow_dispatch`).
2. En Cloud Functions, define el env `GITHUB_DEPLOY_TOKEN` (PAT con `actions:write`).
3. En la landing: provider `github`, owner, repo, workflow `deploy-template-manual.yml`, branch.
4. **Publicar hosting** dispara el workflow.

### Hook global del hub

Si muchas landings comparten el mismo sitio multi-dominio del hub, puedes fijar en Functions:

`DEFAULT_TEMPLATE_DEPLOY_HOOK_URL`

Con `hostingProvider: hub` y sin hook por página, se usa ese URL.

### Desplegar la función

```bash
npm run deploy:functions
```

---

## Cómo agregar una nueva web

### Paso 1 — Crear el documento en Firestore

1. Abre la [Firebase Console](https://console.firebase.google.com/).
2. Ve a **Build → Firestore Database** (actívala si aún no existe).
3. Crea o abre la colección **`paginas`**.
4. Añade un documento con ID en formato slug (ej. `maria-garcia`, `dra-elena-morales`).

   > El ID es permanente. Sin espacios ni mayúsculas.

5. Puedes crear el documento vacío y completar todo desde el admin.

### Paso 2 — Configurar Firebase

**Firestore** — lectura pública para el template:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /paginas/{paginaId} {
      allow read: if true;
      allow write: if false;  // ajusta según tu autenticación en el admin
    }
  }
}
```

**Storage** — ver [`storage.rules`](storage.rules) y despliega con `firebase deploy --only storage`.

**Analytics** (opcional) — en Firebase Console activa Google Analytics y obtén el ID `G-XXXXXXXX`.

### Paso 3 — Editar y publicar desde el admin

1. Configura `landing-admin/.env.local` con `VITE_FIREBASE_*`.
2. En dev: `VITE_TEMPLATE_PREVIEW_URL=http://localhost:5174`
3. Arranca: `npm run dev`
4. Selecciona la landing en la barra lateral.
5. Edita el formulario; la vista previa (Espejo / Local) se actualiza al instante.
6. **Guardar y Publicar** persiste en Firestore.

### Paso 4 — Probar el template en local

```env
VITE_PAGINA_ID=maria-garcia
```

```bash
cd landing-template && npm run dev
```

Abre `http://localhost:5174`.

### Paso 5 — Desplegar con Firebase Hosting

El **Hosting** del admin y del template vive en el **proyecto hub**. El contenido de cada landing puede estar en el hub o en un Firebase externo ([guía](#landing-con-contenido-en-otra-cuenta-firebase)).

#### Configuración inicial (una vez)

```bash
# En la raíz del repositorio
npm install
cp .firebaserc.example .firebaserc   # edita TU_PROJECT_ID

# Firebase CLI (si no usas el de node_modules)
npm install -g firebase-tools
firebase login
```

En [Firebase Console](https://console.firebase.google.com/) → **Hosting** → **Comenzar** y crea dos sitios:

| Sitio sugerido | Target en `firebase.json` | Contenido |
|----------------|---------------------------|-----------|
| `landing-admin` | `admin` | Panel CMS |
| `landing-template` (o uno por cliente) | `template` | Landing pública |

Asocia los targets:

```bash
firebase target:apply hosting admin landing-admin
firebase target:apply hosting template landing-template
```

Variables de producción (se leen al hacer `vite build`):

```bash
cp landing-admin/.env.production.example landing-admin/.env.production
cp landing-template/.env.production.example landing-template/.env.production
# Completa VITE_FIREBASE_* y VITE_PAGINA_ID en el template
```

Despliega reglas + hosting:

```bash
npm run deploy:rules      # firestore.rules + storage.rules
npm run deploy:admin      # build + hosting del CMS
npm run deploy:template   # build + hosting del template
# o todo junto:
npm run deploy:hosting
```

URLs por defecto: `https://landing-admin-9452e.web.app` (admin) y `https://landing-template-9452e.web.app` (template).

#### Modo recomendado: un deploy, muchos dominios

1. Un solo sitio de Hosting para `landing-template` (sin `VITE_PAGINA_ID` en producción, o como fallback).
2. En el admin → **Dominio y proyecto Firebase**, asigna `customDomain` a cada landing.
3. En Firebase Hosting del template, añade **todos los dominios** de clientes al mismo sitio.
4. Despliega una vez: `npm run deploy:template` — cualquier fix llega a todas las landings.

```bash
# .env.production del template — solo credenciales hub, VITE_PAGINA_ID opcional
npm run deploy:template
```

#### Modo alternativo: un sitio Hosting por cliente

Cada profesional puede tener su **propio sitio** en el mismo proyecto Firebase:

1. Console → Hosting → **Agregar otro sitio** (ej. `landing-maria-garcia`)
2. En `.env.production` del template, pon `VITE_PAGINA_ID=maria-garcia`
3. Despliega:

```bash
chmod +x scripts/deploy-client-template.sh
./scripts/deploy-client-template.sh maria-garcia landing-maria-garcia
```

#### Proyecto Firebase en otra cuenta (cliente)

Para que los datos (textos, imágenes, Firestore) vivan en la cuenta del cliente:

1. En el admin, activa **Los datos viven en otro proyecto Firebase**.
2. Pega las credenciales del proyecto externo (Firebase Console → Configuración del proyecto).
3. Configura en **esa cuenta** las mismas reglas de lectura en `paginas` y Storage (`paginas/{id}/...`).
4. **Guardar y Publicar** escribe el contenido en el proyecto externo; el hub solo guarda dominio + credenciales.

El listado del admin sigue en el hub; al abrir la landing se carga el documento completo del proyecto externo.

| Variable en `.env.production` (template) | Valor |
|------------------------------------------|-------|
| `VITE_FIREBASE_*` | Credenciales del **hub** (siempre, para resolver dominios) |
| `VITE_PAGINA_ID` | Opcional si usas solo dominios; obligatorio en modo por sitio |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXX` (opcional) |

### Paso 6 — Dominio personalizado (opcional)

Firebase Console → **Hosting** → sitio del cliente → **Agregar dominio personalizado** → configura DNS (registros A/TXT que indica Firebase).

---

## Vista previa en el admin

| Modo | Comportamiento |
|------|----------------|
| **Espejo** | Renderiza un componente interno con `formData` local (sin lecturas a Firestore por tecla) |
| **Local** | Iframe a `landing-template` con `?pageId=...&preview=true` y sincronización por `postMessage` |

En dev, si no hay documentos en Firestore, aparece **Vista previa demo** con contenido aleatorio.

### Indicadores de contenido (acordeón)

Las secciones del formulario muestran, **colapsadas**, una pastilla con el estado de datos:

- **Verde** — hay información (ej. nombre · especialidad, `3 ítems`, `Con video`)
- **Gris** — vacía o incompleta (`Sin datos`, `Activo, falta URL`)

Así se ve de un vistazo qué bloques ya tienen contenido capturado.

### Layout del CMS

El admin usa pantalla completa fija (`h-dvh`) sin scroll del documento: cada columna (lista, formulario, espejo) scrollea por su cuenta. El espejo sincroniza la sección activa **solo** dentro del panel de vista previa (no mueve el formulario).

---

## Estructura del repositorio

```
ecosistema-landings/              # Repo hub (admin + infra Firebase)
├── packages/
│   ├── landing-core/             # Utilidades compartidas (pageModel, labels, secciones…)
│   └── landing-ui/               # Componentes React compartidos (LandingPage, Navbar…)
├── firebase.json                 # Firestore, Storage, Functions, Hosting admin
├── firestore.rules
├── storage.rules
├── .firebaserc.example
├── package.json                  # Workspaces + deploy:admin, deploy:rules…
├── scripts/
│   └── deploy-client-template.sh
├── landing-admin/                # CMS (React + Vite + Tailwind + Firebase)
│   └── src/
│       ├── App.jsx
│       ├── components/
│       └── utils/                # Re-exporta @raulizqli/landing-core + lógica admin
├── landing-template/             # Landing pública (desplegable como repo aparte)
│   ├── firebase.json             # Solo Hosting del template
│   ├── .firebaserc.example
│   └── src/
└── README.md
```

**Código compartido:** `packages/landing-core` centraliza el modelo de página y normalizadores. `packages/landing-ui` centraliza los componentes de la landing (Navbar, Hero, secciones…). Admin y template importan ambos paquetes; los archivos locales en `src/utils/` y `src/components/` son re-exports finos.

**Deploy:** el hub despliega admin y reglas (`npm run deploy:admin`). El template se despliega desde su carpeta (`npm run deploy:template` en la raíz, o `npm run deploy` dentro de `landing-template/`). Ambos apuntan al mismo proyecto Firebase.

Los editores del admin (`*FieldsEditor.jsx`) siguen solo en `landing-admin`.

---

## Separar en repositorios Git

| Repo | Contenido |
|------|-----------|
| **ecosistema-landings** (hub) | `landing-admin`, `functions`, reglas Firestore/Storage, `packages/` |
| **landing-template** (opcional) | Template + copia de `packages/` para deploy autónomo |

### Extraer el template

```bash
npm run extract:template-repo
# → ../landing-template-repo/

cd ../landing-template-repo
cp .firebaserc.example .firebaserc
npm install && npm run dev
git init && git remote add origin <url> && git push -u origin main
```

El hub puede seguir en el monorepo con `landing-template/` como carpeta local hasta que migres por completo. La vista previa Local del admin usa `VITE_TEMPLATE_PREVIEW_URL` (dev: `http://localhost:5174`).

### Publicar paquetes en GitHub Packages

`@raulizqli/landing-core` y `@raulizqli/landing-ui` se publican en GitHub Packages del repo `raulizqli/landing-admin`.

```bash
git tag packages-v0.1.0 && git push origin packages-v0.1.0   # dispara CI
# o localmente (con GITHUB_TOKEN exportado):
npm run publish:packages
```

Instalación en otros proyectos: [`packages/README.md`](packages/README.md).

---

## Comandos útiles

```bash
# Instalar CLI de deploy (raíz)
npm install

# Build de producción
npm run build
# o por proyecto:
cd landing-admin && npm run build
cd landing-template && npm run build

# Firebase (desde la raíz, con .firebaserc configurado)
npm run deploy:rules
npm run deploy:admin
npm run deploy:template
npm run deploy:hosting

# Generar repo standalone del template
npm run extract:template-repo

# Lint
cd landing-admin && npm run lint
cd landing-template && npm run lint
```
