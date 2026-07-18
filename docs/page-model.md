# Modelo de datos de una página

## Fuente de verdad

Cada landing se representa con un documento en:

```text
pages/{pageId}
```

La fuente de verdad del modelo es `packages/landing-core/src/pageModel.js`. Esta guía explica sus grupos principales; consulta el código para defaults y compatibilidad exactos.

Reglas:

- campos, estados y props de datos en inglés;
- `normalizePageData()` en cada lectura;
- `hydratePageForm()` para preparar el formulario;
- `normalizePageData()` antes de renderizar;
- guardar solamente claves canónicas en inglés;
- `paginas/{pageId}` y campos españoles son compatibilidad de lectura.

## Identidad y contacto

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre profesional o comercial |
| `specialty` | string | Especialidad o descriptor |
| `vertical` | string | Preset de industria |
| `aboutTagline` | string | Frase destacada |
| `aboutBio` | string | Texto descriptivo |
| `aboutBioEnabled` | boolean | Muestra el texto descriptivo |
| `location` | string | Dirección o ubicación |
| `locationMapsUrl` | string | URL o embed de Google Maps |
| `showLocationMap` | boolean | Muestra el mapa |
| `contactMapLayout` | `below` \| `beside` | Posición del mapa |
| `email` | string | Email público |
| `phone` | string | Teléfono público |
| `phoneIsWhatsapp` | boolean | Abre WhatsApp en vez de llamada |

Verticales soportados:

```text
generic, psychology, dental, veterinary, legal, medical,
beauty, fitness, education, ecommerce
```

## Dominio, hosting y datos externos

| Campo | Tipo | Descripción |
|---|---|---|
| `customDomain` | string | Dominio sin protocolo |
| `useExternalFirebase` | boolean | Usa contenido en otro Firebase |
| `externalFirebase` | object | Configuración web del proyecto externo |
| `hostingProvider` | `hub` \| `webhook` \| `github` | Estrategia de hosting |
| `hostingPublicUrl` | string | URL pública informativa |
| `hostingDeployHookUrl` | string | Deploy Hook secreto |
| `hostingGithubOwner` | string | Owner del workflow |
| `hostingGithubRepo` | string | Repositorio del workflow |
| `hostingGithubWorkflow` | string | Archivo o ID del workflow |
| `hostingGithubRef` | string | Branch o ref |
| `analyticsMeasurementId` | string | ID de GA4 |

## Navegación

| Campo | Tipo | Descripción |
|---|---|---|
| `navMode` | `profile` \| `logo` | Presentación de marca |
| `navIconUrl` | string | Icono o foto |
| `navLogoUrl` | string | Logo |
| `navIconOnly` | boolean | Oculta nombre y especialidad |
| `navAlign` | string | Alineación del contenido |
| `navCtaTarget` | `email` \| `whatsapp` \| `link` | Destino del CTA |
| `navCtaLink` | string | URL del CTA personalizado |
| `navCtaBgColor` | string | Fondo del CTA |
| `navCtaTextColor` | string | Texto del CTA |

## Pre-hero

| Campo | Tipo | Descripción |
|---|---|---|
| `preHeroEnabled` | boolean | Activa la sección |
| `preHeroMode` | `banner` \| `split` | Layout |
| `preHeroImageSide` | `left` \| `right` | Posición en modo split |
| `preHeroImageUrl` | string | Imagen |
| `preHeroTitle` | string | Título |
| `preHeroText` | string | Cuerpo |

## Hero

`heroSlides` es un array. Cada diapositiva puede incluir:

| Campo | Tipo | Descripción |
|---|---|---|
| `imageUrl` | string | Imagen de fondo |
| `videoUrl` | string | YouTube, Vimeo o MP4 |
| `title` | string | Título |
| `text` | string | Texto |
| `showTitle` | boolean | Muestra el título |
| `showText` | boolean | Muestra el texto |
| `showButtons` | boolean | Muestra CTAs |
| `buttonsPosition` | string | Posición de CTAs |
| `showGradient` | boolean | Activa el velo de contraste |

Al guardar, `heroTitle` y `heroSubtitle` se sincronizan desde la primera diapositiva para compatibilidad.

## Servicios

Campos de sección:

- `servicesSectionEnabled`
- `servicesSectionTitle`
- `servicesSectionText`
- `servicesDisplayMode`: `stack` o `carousel`
- `servicesCarouselPerView`
- `servicesCarouselAutoplay`
- `services`

Cada servicio:

| Campo | Tipo | Descripción |
|---|---|---|
| `layout` | `title` \| `title_description` \| `title_list` | Layout |
| `title` | string | Nombre |
| `description` | string | Descripción |
| `listItems` | string[] | Lista |
| `imageUrl` | string | Imagen opcional |

Aliases legacy se normalizan en `landing-core`; no deben guardarse otra vez.

## Catálogo, galería y video

### Catálogo

`catalogItems[]` admite `title`, `description`, `imageUrl`, `price` y `link`.

### Galería

`galleryItems[]` admite `imageUrl`, `caption` y `alt`. La sección también admite `galleryPortfolioUrl` y `galleryPortfolioLabel`.

### Video

La sección usa `videoSectionEnabled`, `videoSectionUrl`, `videoSectionTitle` y `videoSectionText`.

## Testimonios y blog

`testimonials[]`:

```json
{
  "title": "María G.",
  "quote": "Texto del testimonio",
  "imageUrl": "https://..."
}
```

`blogPosts[]` admite los layouts:

```text
title_text
title_text_image_left
title_image_right_text
title_image
image_only
```

Cada post usa `title`, `text`, `imageUrl` e `imageAlt`.

## Embeds personalizados

`customEmbeds[]` permite insertar bloques en distintas posiciones.

Campos comunes:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | ID estable |
| `enabled` | boolean | Estado |
| `type` | string | Tipo de bloque |
| `label` | string | Nombre interno |
| `title` | string | Título visible |
| `placement` | string | Punto de inserción |
| `fullWidth` | boolean | Ancho completo |
| `sortOrder` | number | Orden |

Tipos principales:

| Tipo | Uso |
|---|---|
| `pre_hero` | Banner o bloque split |
| `services` | Grupo adicional de servicios |
| `portfolio` | Portafolio externo o embed |
| `faq` | Preguntas frecuentes |
| `steps` | Proceso por pasos |
| `text` | Texto editorial |
| `cta` | Banner de llamada a la acción |
| `quote` | Cita destacada |
| `embed` | HTML personalizado |

Solo root puede cambiar la estructura habilitada cuando aplica el bloqueo de layout. Otros roles editan el contenido permitido.

## Labels e idioma

| Campo | Tipo | Descripción |
|---|---|---|
| `defaultLanguage` | `es` \| `en` | Idioma predeterminado y fallback |
| `enabledLanguages` | (`es` \| `en`)[] | Idiomas públicos (mínimo uno) |
| `translations` | object | Contenido textual por idioma |
| `labelLanguage` | `es` \| `en` | Compatibilidad; se sincroniza con `defaultLanguage` al guardar |
| `customLabels` | object | Overrides por idioma (`{ es: {}, en: {} }`) |

Reglas:
- Debe haber al menos un idioma público (`es` o `en`).
- No es obligatorio mantener español si inglés está activo (y viceversa).
- Al cambiar el idioma activo (admin o landing), las etiquetas del sistema (`resolvePageLabels`) cambian con ese idioma.

La resolución sigue:

```text
contenido del idioma activo → contenido del idioma default → top-level legacy
labels base → overrides del vertical → customLabels del idioma activo
```

Usa `resolvePageLabels()` y `getLabel()`; no hardcodees labels de contenido en componentes.

### Estructura bilingüe

La configuración visual, media, enlaces y contacto se comparten. Solo el texto se replica:

```json
{
  "defaultLanguage": "en",
  "enabledLanguages": ["en", "es"],
  "translations": {
    "en": {
      "specialty": "Clinical psychologist",
      "aboutBio": "English biography",
      "heroSlides": {
        "slide-id": {
          "title": "A space for you",
          "text": "Online and in-person care"
        }
      }
    },
    "es": {
      "specialty": "Psicóloga clínica",
      "aboutBio": "Biografía en español",
      "heroSlides": {
        "slide-id": {
          "title": "Un espacio para ti",
          "text": "Atención presencial y en línea"
        }
      }
    }
  }
}
```

Los elementos repetibles llevan un `id` estable para relacionar sus traducciones aunque se reordenen. El admin mantiene los campos top-level sincronizados con el idioma predeterminado para documentos y consumidores legacy.

## Redes sociales

Los campos guardan identificadores, no URLs completas:

```text
instagram, whatsapp, facebook, linkedin,
doctoralia, tiktok, youtube
```

`socialIconOnly` muestra únicamente los iconos.

## Apariencia

`sectionThemes` configura cada sección:

```json
{
  "services": {
    "backgroundColor": "#FFFFFF",
    "useGradient": true,
    "gradientColor": "#F4F1EA",
    "gradientDirection": "to-bottom-right"
  }
}
```

Claves de sección:

```text
page, nav, preHero, hero, about, services, catalog, gallery,
video, testimonials, blog, contact, social, footer
```

`nav` también acepta `backgroundOpacity`.

## Documentos legales

Los documentos legales permiten términos y privacidad con contenido por defecto o personalizado. Los links se muestran en el footer y abren un diálogo dentro de la landing.

## Ejemplo reducido

```json
{
  "name": "Dra. María García",
  "specialty": "Psicología clínica",
  "vertical": "psychology",
  "customDomain": "dra-maria.com",
  "email": "contacto@dra-maria.com",
  "phone": "525512345678",
  "phoneIsWhatsapp": true,
  "heroSlides": [
    {
      "imageUrl": "https://...",
      "title": "Un espacio para ti",
      "text": "Atención presencial y en línea",
      "showTitle": true,
      "showText": true,
      "showButtons": true,
      "showGradient": true
    }
  ],
  "servicesSectionEnabled": true,
  "services": [
    {
      "layout": "title_description",
      "title": "Terapia individual",
      "description": "Acompañamiento personalizado",
      "listItems": [],
      "imageUrl": ""
    }
  ]
}
```

## Persistencia

- El formulario vive en memoria mientras se edita.
- Subir una imagen crea el archivo en Storage.
- **Guardar y Publicar** escribe el documento normalizado.
- El template lee el documento una vez al cargar.
- Analytics registra eventos, no contenido editable.

## Lecturas relacionadas

- [Arquitectura](architecture.md)
- [Desarrollo local](local-development.md)
- [Despliegues](deployment.md)
