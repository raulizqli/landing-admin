# Valhalla Recording Studio — configuración en Toqua

Plantilla de contenido: `createValhallaRecordingStudioSeed()` en `@raulizqli/landing-core`.

## Pasos en admin

1. Crea una página nueva en `landing-admin` (colección `pages`).
2. En la consola del navegador (con el formulario vacío cargado) o vía script root:

```js
import { buildValhallaPageForm } from './utils/valhallaSeed.js';
// o desde el paquete:
// import { createValhallaRecordingStudioSeed } from '@raulizqli/landing-core';
```

3. Completa assets del cliente (no inventar):
   - Logo / favicon
   - `heroSlides[0].videoUrl` + `imageUrl` (poster)
   - 3–6 URLs en `videoSectionItems` del canal [@valhallarecordingstudio](https://youtube.com/@valhallarecordingstudio)
   - Fotos en galería
   - WhatsApp Business (`whatsapp` / `phone` + `phoneIsWhatsapp`)
   - Email, ubicación, Facebook
4. Activa `contactFormEnabled` (ya viene en el seed) y revisa consultas en la sección Contacto.
5. Asigna `customDomain` o `VITE_PAGINA_ID` en el deploy del template.
6. Publica con **Guardar y Publicar**.

## Tema

`sectionThemes` del seed usa carbón `#0B0C0E` / `#121418` / `#16181C` y texto `#F4F1EA`, con CTA oro `#C9A227`.
