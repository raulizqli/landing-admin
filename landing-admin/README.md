# landing-admin

Panel CMS para gestionar todas las landing pages del ecosistema. Tres paneles en una sola vista: listado, editor y vista previa en vivo.

## Desarrollo local

```bash
# Crea .env.local con las variables VITE_FIREBASE_* (ver landing-template/.env.example)
npm install
npm run dev   # http://localhost:5173
```

Variables en `.env.local`:

- `VITE_FIREBASE_*` — credenciales del proyecto Firebase
- `VITE_TEMPLATE_PREVIEW_URL` — opcional en dev (por defecto `http://localhost:5174`)

## Vista previa

- **Espejo** — renderizado local instantáneo al escribir en el formulario (sin lecturas extra a Firestore).
- **Local** — iframe del template en `localhost:5174`, sincronizado en tiempo real en desarrollo.

---

## Cómo agregar una nueva web

Ver [Desarrollo local](../docs/local-development.md#crear-una-página) para crear y probar una página.

En resumen: crea la landing en el CMS → edítala → **Guardar y Publicar** → ábrela en el template con `?pageId=<id>` o configura su dominio.

## Documentación

- [Arquitectura del ecosistema](../docs/architecture.md)
- [Variables y desarrollo local](../docs/local-development.md)
- [Autenticación, roles y billing](../docs/auth-and-billing.md)
- [Modelo de datos](../docs/page-model.md)
