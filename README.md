# Ecosistema Landings

Plataforma multi-tenant para crear, administrar y publicar landing pages dinámicas. El contenido se edita en un CMS, se guarda en Firebase y se renderiza con una plantilla pública compartida.

## Componentes

| Componente | Puerto | Responsabilidad |
|---|---:|---|
| [`landing-admin/`](landing-admin/) | `5173` | CMS, usuarios, facturación y vista previa en vivo |
| [`landing-template/`](landing-template/) | `5174` | Aplicación pública de solo lectura |
| [`leftsidedev-site/`](leftsidedev-site/) | `5175` | Sitio corporativo LeftSideDev (AI Engineering Studio) |
| [`packages/landing-core/`](packages/landing-core/) | — | Modelo de página, normalización y utilidades compartidas |
| [`packages/landing-ui/`](packages/landing-ui/) | — | Componentes React compartidos |
| [`functions/`](functions/) | — | Usuarios, billing y despliegues mediante Cloud Functions |

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
- [Optimización LeftSideDev (plan + arquitectura del sitio)](docs/leftsidedev-optimization-plan.md)
- [Enterprise Marketing Site (CMS multi-página para clientes)](docs/enterprise-marketing-site-plan.md)
- [Arquitectura y estructura del repositorio](docs/architecture.md)
- [Guía específica del administrador](landing-admin/README.md)
- [Guía específica del template](landing-template/README.md)

### Operar la plataforma

- [Despliegues, dominios y Firebase externo](docs/deployment.md)
- [Autenticación, roles y facturación](docs/auth-and-billing.md)
- [Modelo de datos de una página](docs/page-model.md)

### Paquetes compartidos

- [Uso de los paquetes](packages/README.md)
- [`landing-core`](packages/landing-core/README.md)
- [`landing-ui`](packages/landing-ui/README.md)

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
5. Prueba Stripe y Mercado Pago en sandbox antes de usar credenciales reales.

Consulta [Autenticación, roles y facturación](docs/auth-and-billing.md) para la configuración completa.
