# landing-template

Plantilla React + Vite desplegable por cliente. Lee un documento de Firestore (`pages/{pageId}` o legado `paginas/{pageId}`) y renderiza la landing pública.

Puede vivir **dentro del monorepo** `ecosistema-landings` o como **repositorio independiente** (ver [Repositorio standalone](#repositorio-standalone)).

> Cómo resuelve el `pageId`, lee Firestore y se relaciona con el admin:  
> [**Arquitectura del ecosistema**](../docs/architecture.md#landing-template).

## Desarrollo local (monorepo)

Desde la raíz del ecosistema:

```bash
npm install
cd landing-template
cp .env.example .env.local
npm run dev   # http://localhost:5174
```

Dependencias compartidas: `packages/landing-core` y `packages/landing-ui`.

Variables requeridas en `.env.local`: todas las `VITE_FIREBASE_*` y opcionalmente `VITE_PAGINA_ID`.

Consulta [**Variables del template**](../docs/local-development.md#variables-del-template).

En desarrollo, si Firestore no está disponible o el documento no existe, se muestra contenido de ejemplo para previsualizar el diseño.

## Deploy (monorepo)

```bash
# desde la raíz
npm run deploy:template

# o desde esta carpeta
npm run deploy
```

Requiere `.firebaserc` en esta carpeta (copia desde `.firebaserc.example` o desde la raíz del monorepo).

## Repositorio standalone

Para publicar solo el template en otro repo Git:

```bash
# desde la raíz del monorepo
npm run extract:template-repo
# genera ../landing-template-repo con packages/ incluidos

cd ../landing-template-repo
cp .firebaserc.example .firebaserc
cp .env.example .env.local
npm install
npm run dev
git init && git add . && git commit -m "Initial standalone landing-template"
```

El workflow `.github/workflows/deploy.yml` despliega en push a `main`/`master`. Configura en GitHub el secret `FIREBASE_SERVICE_ACCOUNT` y las variables `VITE_FIREBASE_*` para el build.

---

## Cómo agregar una nueva web

> Guía completa del ecosistema (admin + Firestore + Firebase Hosting): ver [`../README.md`](../README.md).

### Resumen rápido

1. **CMS** — Crea una landing con ID slug (ej. `maria-garcia`). Se guarda en `pages/{pageId}`.

2. **Admin** — Edita el contenido en `landing-admin`, previsualiza y pulsa **Guardar y Publicar**.

3. **Local** — Pon `VITE_PAGINA_ID=maria-garcia` en `.env.local` y ejecuta `npm run dev`.

4. **Producción (multi-dominio)** — Un deploy en Firebase Hosting; asigna `customDomain` en el admin y enlaza dominios al mismo sitio.

5. **Producción (por sitio)** — Sitio Hosting por cliente con `VITE_PAGINA_ID` en `.env.production`:

```bash
./scripts/deploy-client-template.sh maria-garcia landing-maria-garcia
```

6. **Proyecto Firebase externo** — En el admin, activa «otro proyecto Firebase» y pega la configuración web de la cuenta del cliente.

### Variables de entorno por deploy

Copia `.env.production.example` → `.env.production` antes del build:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_PAGINA_ID=maria-garcia   # ← cambia por cada cliente/sitio
```

El mismo código sirve para todas las webs; Firebase Hosting aloja el `dist/` compilado con el `VITE_PAGINA_ID` de ese build.

## Documentación

- [Desarrollo local](../docs/local-development.md)
- [Despliegues y dominios](../docs/deployment.md)
- [Modelo de datos](../docs/page-model.md)
