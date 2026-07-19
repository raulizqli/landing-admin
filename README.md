# Ecosistema Landings

**ES** | [EN](#english-version)

Plataforma multi-tenant para crear, administrar y publicar landing pages dinámicas. El contenido se edita en un CMS, se guarda en Firebase y se renderiza con una plantilla pública compartida.

## Componentes

| Componente | Puerto | Responsabilidad |
|---|---:|---|
| [`landing-admin/`](landing-admin/) | `5173` | CMS, usuarios y vista previa en vivo |
| [`landing-template/`](landing-template/) | `5174` | Aplicación pública de solo lectura |
| [`leftsidedev-site/`](leftsidedev-site/) | `5175` | Sitio corporativo LeftSideDev (AI Engineering Studio) |
| [`packages/landing-core/`](packages/landing-core/) | — | Modelo de página, normalización y utilidades compartidas |
| [`packages/landing-ui/`](packages/landing-ui/) | — | Componentes React compartidos |
| [`functions/`](functions/) | — | Gestión de usuarios y despliegues mediante Cloud Functions |

## Inicio rápido

Requisitos: Node.js, npm y un proyecto Firebase con una aplicación web configurada.

```bash
# Instalar todos los workspaces
npm install

# Configurar variables locales
cp landing-admin/.env.example landing-admin/.env.local
cp landing-template/.env.example landing-template/.env.local
```

Completa las variables `VITE_FIREBASE_*` en ambos archivos. Después, abre dos terminales:

```bash
# Terminal 1 — CMS
cd landing-admin
npm run dev

# Terminal 2 — landing pública
cd landing-template
npm run dev
```

URLs locales:

- Corporate site: `http://localhost:5175`
- Marketing (CMS seed): `http://localhost:5174?pageId=leftsidedev`
- Login: `http://localhost:5173/login`
- CMS: `http://localhost:5173/app`
- Template: `http://localhost:5174?pageId=<page-id>`

## Flujo principal

1. Un usuario autorizado abre una página en el CMS.
2. El formulario actualiza la vista previa local sin escribir en Firestore.
3. **Guardar y Publicar** persiste el documento en `pages/{pageId}`.
4. El template resuelve el `pageId` por query, dominio o variable de entorno.
5. El template realiza una lectura, normaliza el documento y renderiza la landing.

```text
landing-admin ── Guardar y Publicar ──► Firestore pages/{pageId}
       │                                        │
       └── vista previa local                   ▼
                                      landing-template ──► visitante
```

La colección `paginas` y los campos antiguos en español se aceptan únicamente para lectura legacy. Las escrituras nuevas usan `pages` y campos en inglés.

## Documentación

### Empezar

- [Desarrollo local y variables de entorno](docs/local-development.md)
- [Arquitectura y estructura del repositorio](docs/architecture.md)
- [Guía específica del administrador](landing-admin/README.md)
- [Guía específica del template](landing-template/README.md)

### Operar la plataforma

- [Despliegues, dominios y Firebase externo](docs/deployment.md)
- [Modelo de datos de una página](docs/page-model.md)

### Proyectos especiales

- [Optimización LeftSideDev (arquitectura del sitio)](docs/leftsidedev-optimization-plan.md)
- [Enterprise Marketing Site (CMS multi-página)](docs/enterprise-marketing-site-plan.md)
- [Marketing Site deploy (SEO feeds + showcase)](docs/marketing-site-deploy.md)

### Paquetes compartidos

- [Uso de los paquetes](packages/README.md)
- [`landing-core`](packages/landing-core/README.md)
- [`landing-ui`](packages/landing-ui/README.md)

### Configuración avanzada

Para configuración completa de autenticación, roles, pasarelas de pago y funcionalidades avanzadas, consulta:

- [Autenticación, roles y facturación](docs/auth-and-billing.md)
- [Integración AI](docs/ai-integration-proposal.md)

## Comandos frecuentes

Ejecuta estos comandos desde la raíz:

```bash
npm run build             # admin + template + corporate site
npm run dev:site          # LeftSideDev corporate site
npm run build:site        # solo leftsidedev-site
npm run deploy:rules      # Firestore, índices y Storage
npm run deploy:functions  # Cloud Functions
npm run deploy:admin      # CMS en Firebase Hosting
npm run deploy:template   # landing pública
npm run deploy:site       # sitio corporativo (hosting:marketing)
npm run deploy:hosting    # admin + template
npm run extract:template-repo
```

Lint por aplicación:

```bash
npm run lint --prefix landing-admin
npm run lint --prefix landing-template
npm run lint --prefix leftsidedev-site
```

## Convenciones importantes

- Los campos de Firestore, estado React y props de datos están en inglés.
- `packages/landing-core/src/pageModel.js` es la fuente de verdad del modelo.
- El template es de solo lectura y carga un documento por página.
- La vista previa **Espejo** usa el estado local del formulario; no escribe por cada tecla.
- Las credenciales del cliente nunca se escriben directamente en JavaScript.
- Las variables expuestas por Vite deben comenzar con `VITE_`.
- `.env.local`, `.env.production` y secretos de Functions no se versionan.

## Estructura resumida

```text
ecosistema-landings/
├── landing-admin/       CMS React + Vite
├── landing-template/    aplicación pública React + Vite
├── leftsidedev-site/    sitio corporativo AI Engineering Studio
├── packages/
│   ├── landing-core/    modelo y utilidades
│   └── landing-ui/      componentes compartidos
├── functions/           Firebase Cloud Functions
├── docs/                documentación operativa y técnica
├── scripts/             automatización de despliegues y extracción
├── firebase.json
├── firestore.rules
└── storage.rules
```

## Seguridad

Antes de producción:

1. Configura Firebase Authentication y los roles en `users/{uid}`.
2. Despliega `firestore.rules` y `storage.rules`.
3. Configura App Check con reCAPTCHA v3.
4. Mantén claves privadas, tokens de proveedores y secretos fuera del repositorio.

Consulta la [documentación de configuración avanzada](#configuración-avanzada) para más detalles.

---

## English Version

**[ES](#ecosistema-landings)** | EN

Multi-tenant platform for creating, managing, and publishing dynamic landing pages. Content is edited in a CMS, stored in Firebase, and rendered with a shared public template.

## Components

| Component | Port | Responsibility |
|---|---:|---|
| [`landing-admin/`](landing-admin/) | `5173` | CMS, users, and live preview |
| [`landing-template/`](landing-template/) | `5174` | Read-only public application |
| [`leftsidedev-site/`](leftsidedev-site/) | `5175` | LeftSideDev corporate site (AI Engineering Studio) |
| [`packages/landing-core/`](packages/landing-core/) | — | Page model, normalization, and shared utilities |
| [`packages/landing-ui/`](packages/landing-ui/) | — | Shared React components |
| [`functions/`](functions/) | — | User management and deployments via Cloud Functions |

## Quick Start

Requirements: Node.js, npm, and a Firebase project with a web app configured.

```bash
# Install all workspaces
npm install

# Configure local variables
cp landing-admin/.env.example landing-admin/.env.local
cp landing-template/.env.example landing-template/.env.local
```

Complete the `VITE_FIREBASE_*` variables in both files. Then, open two terminals:

```bash
# Terminal 1 — CMS
cd landing-admin
npm run dev

# Terminal 2 — public landing
cd landing-template
npm run dev
```

Local URLs:

- Corporate site: `http://localhost:5175`
- Marketing (CMS seed): `http://localhost:5174?pageId=leftsidedev`
- Login: `http://localhost:5173/login`
- CMS: `http://localhost:5173/app`
- Template: `http://localhost:5174?pageId=<page-id>`

## Main Flow

1. An authorized user opens a page in the CMS.
2. The form updates the local preview without writing to Firestore.
3. **Save and Publish** persists the document to `pages/{pageId}`.
4. The template resolves the `pageId` by query, domain, or environment variable.
5. The template performs a read, normalizes the document, and renders the landing.

```text
landing-admin ── Save and Publish ──► Firestore pages/{pageId}
       │                                        │
       └── local preview                        ▼
                                      landing-template ──► visitor
```

The `paginas` collection and old Spanish fields are only accepted for legacy reads. New writes use `pages` and English fields.

## Documentation

### Getting Started

- [Local development and environment variables](docs/local-development.md)
- [Architecture and repository structure](docs/architecture.md)
- [Admin-specific guide](landing-admin/README.md)
- [Template-specific guide](landing-template/README.md)

### Operating the Platform

- [Deployments, domains, and external Firebase](docs/deployment.md)
- [Page data model](docs/page-model.md)

### Special Projects

- [LeftSideDev optimization (site architecture)](docs/leftsidedev-optimization-plan.md)
- [Enterprise Marketing Site (multi-page CMS)](docs/enterprise-marketing-site-plan.md)
- [Marketing Site deploy (SEO feeds + showcase)](docs/marketing-site-deploy.md)

### Shared Packages

- [Package usage](packages/README.md)
- [`landing-core`](packages/landing-core/README.md)
- [`landing-ui`](packages/landing-ui/README.md)

### Advanced Configuration

For complete configuration of authentication, roles, payment gateways, and advanced features, see:

- [Authentication, roles, and billing](docs/auth-and-billing.md)
- [AI integration](docs/ai-integration-proposal.md)

## Common Commands

Run these commands from the root:

```bash
npm run build             # admin + template + corporate site
npm run dev:site          # LeftSideDev corporate site
npm run build:site        # leftsidedev-site only
npm run deploy:rules      # Firestore, indexes, and Storage
npm run deploy:functions  # Cloud Functions
npm run deploy:admin      # CMS on Firebase Hosting
npm run deploy:template   # public landing
npm run deploy:site       # corporate site (hosting:marketing)
npm run deploy:hosting    # admin + template
npm run extract:template-repo
```

Lint per application:

```bash
npm run lint --prefix landing-admin
npm run lint --prefix landing-template
npm run lint --prefix leftsidedev-site
```

## Important Conventions

- Firestore fields, React state, and data props are in English.
- `packages/landing-core/src/pageModel.js` is the model source of truth.
- The template is read-only and loads one document per page.
- The **Mirror** preview uses local form state; it doesn't write on every keystroke.
- Client credentials are never written directly in JavaScript.
- Variables exposed by Vite must start with `VITE_`.
- `.env.local`, `.env.production`, and Functions secrets are not versioned.

## Summary Structure

```text
ecosistema-landings/
├── landing-admin/       CMS React + Vite
├── landing-template/    public application React + Vite
├── leftsidedev-site/    LeftSideDev corporate site (AI Engineering Studio)
├── packages/
│   ├── landing-core/    model and utilities
│   └── landing-ui/      shared components
├── functions/           Firebase Cloud Functions
├── docs/                operational and technical documentation
├── scripts/             deployment and extraction automation
├── firebase.json
├── firestore.rules
└── storage.rules
```

## Security

Before production:

1. Configure Firebase Authentication and roles in `users/{uid}`.
2. Deploy `firestore.rules` and `storage.rules`.
3. Configure App Check with reCAPTCHA v3.
4. Keep private keys, provider tokens, and secrets out of the repository.

See the [advanced configuration documentation](#advanced-configuration) for more details.
