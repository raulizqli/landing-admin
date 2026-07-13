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

Ver la guía paso a paso completa en [`../README.md`](../README.md).

En resumen: crea el documento en Firestore → edítalo aquí → despliega `landing-template` con el `VITE_PAGINA_ID` correspondiente.
