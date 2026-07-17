# Despliegues, dominios y Firebase externo

## Preparación inicial

Desde la raíz:

```bash
npm install
cp .firebaserc.example .firebaserc
cp landing-admin/.env.production.example landing-admin/.env.production
cp landing-template/.env.production.example landing-template/.env.production
```

Completa el ID de tu proyecto y las variables `VITE_FIREBASE_*`. Los archivos de producción reales no deben versionarse.

En Firebase Hosting crea los sitios necesarios y asocia los targets de `firebase.json`:

```bash
firebase login
firebase target:apply hosting admin <admin-site-id>
firebase target:apply hosting template <template-site-id>
```

## Comandos de despliegue

| Comando | Publica |
|---|---|
| `npm run deploy:rules` | Reglas e índices de Firestore y reglas de Storage |
| `npm run deploy:functions` | Cloud Functions |
| `npm run deploy:admin` | Build y Hosting del CMS |
| `npm run deploy:template` | Build y Hosting del template |
| `npm run deploy:hosting` | Admin y template |

Build sin desplegar:

```bash
npm run build
```

## Modo recomendado: un template, varios dominios

Un solo sitio de Hosting sirve el template para todas las landings:

1. Despliega el template sin fijar `VITE_PAGINA_ID`, o úsalo únicamente como fallback.
2. Asigna un `customDomain` único a cada documento desde el admin.
3. Conecta todos los dominios al sitio que aloja `landing-template`.
4. El runtime busca el documento por hostname.

```text
cliente-a.com ─┐
cliente-b.com ─┼──► landing-template ── customDomain ──► pages/{pageId}
cliente-c.com ─┘
```

Ventajas:

- un cambio de código se despliega una vez;
- editar contenido no requiere redeploy;
- el mismo Firebase hub resuelve todos los dominios.

## Modo alternativo: sitio por cliente

Cada build incluye un `VITE_PAGINA_ID`:

```env
VITE_PAGINA_ID=dra-maria
```

Puedes desplegar un sitio dedicado con:

```bash
chmod +x scripts/deploy-client-template.sh
./scripts/deploy-client-template.sh dra-maria <firebase-site-id>
```

Este modo aumenta la cantidad de builds y sitios que debes mantener.

## Dominio personalizado

Para un sitio en Firebase Hosting:

1. Abre Firebase Console → Hosting → sitio del template.
2. Selecciona **Agregar dominio personalizado**.
3. Añade los registros TXT/A/AAAA solicitados.
4. Espera la verificación de DNS y la emisión del certificado.
5. Guarda el dominio, sin protocolo ni `www.`, en `customDomain`.

El challenge `/.well-known/acme-challenge/*` debe estar disponible desde el hosting que recibe el dominio cuando el proveedor solicite una validación HTTP-01.

## Contenido en otro proyecto Firebase

Esta opción mantiene el enrutamiento en el hub, pero almacena el contenido y las imágenes en el proyecto del cliente.

### Preparar el proyecto del cliente

1. Crea el proyecto Firebase.
2. Habilita Firestore y Storage.
3. Registra una aplicación web.
4. Copia `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` y `appId`.
5. Configura lectura pública para la página publicada y permisos de escritura compatibles con el CMS.

El template necesita poder leer:

```text
pages/{pageId}
```

La colección `paginas` puede habilitarse temporalmente si aún existen documentos legacy.

### Conectarlo en el admin

1. Crea la landing en el hub.
2. Abre **Hosting, analytics y pie**.
3. Activa **Los datos de esta landing viven en otro proyecto Firebase**.
4. Introduce la configuración web del proyecto externo.
5. Pulsa **Guardar y Publicar**.

Resultado:

| Proyecto hub | Proyecto externo |
|---|---|
| `customDomain` | Contenido completo |
| `useExternalFirebase` | Imágenes |
| `externalFirebase` | Documento `pages/{pageId}` |

Las credenciales web de Firebase identifican la aplicación, pero las reglas siguen siendo la barrera de seguridad. No incluyas claves privadas ni cuentas de servicio en Firestore.

## Template en Vercel, Netlify u otro hosting

El admin no crea cuentas de hosting. Operaciones crea el sitio y registra un Deploy Hook; el CMS puede dispararlo mediante `triggerHostingDeploy`.

### Configuración del sitio

Configura el proyecto con:

- build desde la raíz: `npm run build:template`;
- output: `landing-template/dist`;
- o root `landing-template/`, build `npm run build` y output `dist`;
- variables `VITE_FIREBASE_*` del hub;
- `VITE_PAGINA_ID` solo para un sitio dedicado.

Haz un primer deploy manual y crea un Deploy Hook.

### Configuración por landing

En **Hosting del template**:

1. Proveedor: `Webhook`.
2. URL pública: dominio o URL del sitio.
3. Deploy Hook URL: URL secreta del proveedor.
4. **Guardar y Publicar**.
5. **Publicar hosting** para disparar el rebuild.

La Function debe estar desplegada:

```bash
npm run deploy:functions
```

Cambiar textos o imágenes solo requiere **Guardar y Publicar**. Usa **Publicar hosting** cuando cambie el código o necesites forzar un build.

## GitHub Actions

Para usar `workflow_dispatch`:

1. Configura el workflow de despliegue en el repositorio.
2. Proporciona a Functions un `GITHUB_DEPLOY_TOKEN` con el permiso mínimo requerido.
3. En la landing selecciona proveedor GitHub e indica owner, repo, workflow y branch.
4. Despliega Functions y prueba **Publicar hosting**.

No guardes tokens de GitHub en documentos públicos ni en variables `VITE_`.

## Template standalone

Para extraer el template con sus paquetes:

```bash
npm run extract:template-repo
cd ../landing-template-repo
cp .firebaserc.example .firebaserc
cp .env.example .env.local
npm install
npm run dev
```

Consulta también [`landing-template/README.md`](../landing-template/README.md).

## Checklist de producción

- [ ] Build de admin y template exitoso.
- [ ] Reglas e índices desplegados.
- [ ] Functions desplegadas.
- [ ] Variables de producción revisadas.
- [ ] App Check monitoreado antes de aplicar enforcement.
- [ ] Dominio resuelve al hosting correcto.
- [ ] `customDomain` coincide con el hostname.
- [ ] Página pública lee `pages/{pageId}`.
- [ ] Login y permisos del CMS probados.
- [ ] Webhooks de billing probados en sandbox.
- [ ] Secretos fuera de Git y del bundle Vite.

## Lecturas relacionadas

- [Arquitectura](architecture.md)
- [Desarrollo local](local-development.md)
- [Modelo de datos](page-model.md)
- [Autenticación y billing](auth-and-billing.md)
