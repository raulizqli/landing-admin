# Arquitectura

## Visión general

El ecosistema separa la edición del contenido, su persistencia y su presentación pública:

```text
┌──────────────────────┐
│ landing-admin        │
│ formulario + preview │
└──────────┬───────────┘
           │ Guardar y Publicar
           ▼
┌──────────────────────┐
│ Firebase hub         │
│ Auth · Firestore     │
│ Storage · Functions  │
└──────────┬───────────┘
           │ getDoc pages/{pageId}
           ▼
┌──────────────────────┐
│ landing-template     │
│ sitio público        │
└──────────────────────┘
```

Un documento en `pages` representa una landing. El mismo código del template sirve todas las páginas; los textos, imágenes, colores y secciones cambian según el documento.

## Responsabilidades

### `landing-admin`

- Autentica usuarios del CMS.
- Lista las páginas permitidas según el rol.
- Mantiene un `formData` local mientras se edita.
- Renderiza una vista previa inmediata sin escrituras por tecla.
- Normaliza y persiste datos al pulsar **Guardar y Publicar**.
- Gestiona usuarios, planes y disparadores de hosting.

Rutas:

| Ruta | Sin sesión | Con sesión |
|---|---|---|
| `/` | Redirige al sitio comercial | Redirige a `/app` |
| `/login` | Muestra el acceso | Redirige a `/app` |
| `/app` | Redirige a `/login` | Muestra el CMS |

### `landing-template`

- Es una aplicación pública de solo lectura.
- Resuelve qué página mostrar.
- Ejecuta una lectura `getDoc` al cargar.
- Normaliza documentos legacy.
- Renderiza `LandingPage` desde `landing-ui`.
- No contiene formularios administrativos ni listados de páginas.

El `pageId` se resuelve en este orden:

1. Query `?pageId=`; se mantiene `?paginaId=` como alias legacy.
2. `customDomain` cuando el hostname no es local.
3. `VITE_PAGINA_ID` como fallback o para despliegues dedicados.

### `landing-core`

Contiene el modelo de datos, valores por defecto, normalización, labels, verticales y utilidades sin UI. Sus exports son la fuente compartida entre admin y template.

### `landing-ui`

Contiene `LandingPage` y sus secciones visuales. El admin lo reutiliza para el espejo y el template para la página pública.

### `functions`

Cloud Functions para:

- crear y eliminar usuarios del CMS;
- iniciar y sincronizar facturación;
- activar planes manualmente;
- disparar Deploy Hooks o workflows de hosting.

## Vista previa

| Modo | Funcionamiento | Firestore al escribir |
|---|---|---:|
| **Espejo** | Renderiza `LandingPage` dentro del admin con `formData` | 0 operaciones |
| **Local** | Iframe del template y sincronización con `postMessage` | 0 operaciones |

La persistencia ocurre únicamente con **Guardar y Publicar**. En preview remoto, el template valida el origen configurado en `VITE_ADMIN_ORIGIN`.

## Firebase hub y Firebase externo

El proyecto hub siempre conserva la ruta necesaria para identificar la landing. De forma opcional, el contenido y las imágenes pueden vivir en el Firebase de un cliente.

```text
Firebase hub                         Firebase del cliente
────────────                         ────────────────────
pages/{pageId}                       pages/{pageId}
  customDomain                        name, heroSlides, ...
  useExternalFirebase                 contenido completo
  externalFirebase                    imágenes en Storage
```

Activar Firebase externo cambia el origen de los datos, no obliga a mover el hosting.

## Colecciones y rutas canónicas

| Recurso | Ruta canónica | Compatibilidad de lectura |
|---|---|---|
| Páginas | `pages/{pageId}` | `paginas/{pageId}` |
| Usuarios | `users/{uid}` | — |
| Facturación | `billingAccounts/{accountId}` | — |
| Imágenes | `pages/{pageId}/...` | `paginas/{pageId}/...` |

Los componentes no deben acceder directamente a claves antiguas en español. Esa migración en memoria pertenece a `normalizePageData()`.

## Modos de publicación

### Multi-dominio

Un build del template atiende varios dominios. El hostname se compara con `customDomain`. Es la opción preferida porque una actualización de código llega a todas las landings.

### Sitio dedicado

Cada cliente tiene un build con `VITE_PAGINA_ID`. Es útil cuando el proveedor o el aislamiento requieren un sitio independiente.

En ambos modos, editar contenido en Firestore no requiere compilar de nuevo.

## Estructura del repositorio

```text
ecosistema-landings/
├── landing-admin/
│   ├── public/
│   └── src/
├── landing-template/
│   ├── public/
│   └── src/
├── packages/
│   ├── landing-core/
│   └── landing-ui/
├── functions/
├── docs/
├── scripts/
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── storage.rules
└── package.json
```

## Principios de implementación

- Modelo, estado y props de datos en inglés; etiquetas visibles pueden estar en español.
- Normalizar siempre al leer.
- Guardar únicamente claves canónicas en inglés.
- Mantener admin y template desacoplados de la infraestructura de un cliente.
- Evitar listeners y lecturas repetidas en el sitio público.
- Reutilizar `landing-core` y `landing-ui` en vez de duplicar lógica.

## Lecturas relacionadas

- [Desarrollo local](local-development.md)
- [Despliegues y dominios](deployment.md)
- [Modelo de datos](page-model.md)
- [Autenticación y billing](auth-and-billing.md)
