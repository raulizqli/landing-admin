# @raulizqli/landing-core

Utilidades compartidas entre `landing-admin` y `landing-template` (modelo de página, normalización, labels, verticals, secciones, etc.).

## Verticals (industry presets)

Campo `vertical` en el documento de página. Resolución de labels:

`LABEL_CATALOGS` → overrides del vertical → `customLabels`

Ids: `generic` (default), `psychology`, `dental`, `veterinary`, `legal`, `medical`, `beauty`, `fitness`, `education`, `ecommerce`.

Ver `src/verticals.js`.

Publicado en [GitHub Packages](https://github.com/raulizqli/landing-admin/packages).
