# Estrategia de deploy (producción segura)

Este documento es la **guía operativa** para desplegar Toqua sin romper `admin.toqua.site`, `web.toqua.site` ni `toqua.site`.

Contexto técnico ampliado: [`environments-dev-stage-prod.md`](./environments-dev-stage-prod.md).

---

## Principios

1. **Nada va directo a Prod al hacer merge.** Stage valida primero; Prod solo con aprobación explícita.
2. **CI debe detectar regresiones de arranque** (pantalla en blanco, Firebase mal inicializado) antes del deploy.
3. **Smoke post-deploy** confirma que HTML + assets responden 200 tras publicar.
4. **Un proyecto Firebase por entorno** — nunca mezclar `VITE_FIREBASE_*` de Stage con dominios de Prod.
5. **Rollback = redeploy de la revisión anterior** (Firebase Hosting conserva versiones; ver abajo).

---

## Topología actual

| Entorno | Proyecto Firebase | Admin | Template | Marketing |
|---|---|---|---|---|
| **Local** | emuladores / `.env.development` | `:5173` | `:5174` | `:5176` |
| **Stage** | `landings-stage` | `admin.stage.toqua.site` (cuando esté cableado) | `sites.stage.toqua.site` | opcional |
| **Prod** | `landing-admin-9452e` | `admin.toqua.site` | `web.toqua.site` | `toqua.site` |

---

## Flujo obligatorio

```text
feature/* ──PR──► CI (tests + builds + smoke bootstrap)
                    │
                    ├─ Preview Hosting en el PR (canal temporal)
                    │
                    merge a main/master
                    │
                    ▼
              Deploy Stage (automático)
                    │
                    ├─ QA manual en Stage (checklist abajo)
                    │
                    ▼
         Promote to Prod (manual + aprobación GitHub Environment "prod")
                    │
                    └─ Smoke post-deploy en URLs de Prod
```

### Qué dispara cada workflow

| Evento | Workflow | Destino |
|---|---|---|
| Pull request | `ci.yml` | Solo validación |
| Pull request | `firebase-hosting-pull-request.yml` | Preview admin + template |
| Push a `main`/`master` | `deploy-stage.yml` | **Stage** (rules, functions, hosting) |
| Manual «Promote to Prod» | `promote-prod.yml` | **Prod** (hosting admin + template + toqua) |
| ~~Push a `main`~~ | ~~`firebase-hosting-merge.yml`~~ | **Desactivado** (Phase C) |

---

## Checklist antes de promover a Prod

Mínimo 5 minutos en Stage (o preview del PR para hotfixes urgentes):

- [ ] `/login` muestra formulario (no pantalla en blanco)
- [ ] Login con cuenta QA
- [ ] Abrir landing, editar campo → vista previa espejo reactiva
- [ ] Guardar y Publicar (cuenta de prueba)
- [ ] `web` / template resuelve una página conocida
- [ ] Functions críticas responden (billing test, AI Lite si aplica)
- [ ] Sin claves `sk_test_`, `TEST-`, ni `VITE_APP_CHECK_DEBUG_TOKEN` en build Prod

Lista completa: [`environments-dev-stage-prod.md` → Smoke checklist](./environments-dev-stage-prod.md#smoke-checklist-stage--prod-gate).

---

## Cómo promover a Prod

1. Merge del PR a `main`/`master` y esperar **Deploy Stage** en verde.
2. Validar Stage (checklist arriba).
3. GitHub → **Actions** → **Promote to Prod** → **Run workflow**.
4. Input `confirm`: escribir `promote`.
5. Aprobar en Environment **prod** (revisores configurados).
6. El workflow construye con secretos Prod, despliega hosting y ejecuta smoke HTTP.

### Hotfix urgente (Prod caído)

1. Branch desde `main`, fix mínimo, PR con CI verde.
2. Merge.
3. **Opción A (preferida):** Stage verde → Promote to Prod.
4. **Opción B (emergencia):** Promote to Prod saltando Stage solo si el fix ya pasó CI + preview PR y el incidente es P0. Documentar en el PR.

---

## Rollback

Firebase Hosting mantiene historial de releases.

**Consola:** Firebase → Hosting → sitio (`landing-admin-9452e` admin) → **Release history** → Rollback.

**CLI (ejemplo admin):**

```bash
firebase hosting:clone landing-admin-9452e:live landing-admin-9452e:live --version <VERSION_ID>
# o redeploy del commit anterior vía Promote to Prod desde un revert merge
```

Orden recomendado si el fallo es frontend-only:

1. Rollback **admin** (prioridad — CMS)
2. Rollback **template** si afecta landings públicas
3. **Functions** solo si el bug está en backend (rollback de functions es más delicado)

---

## Controles automáticos en CI

| Control | Script / job | Qué evita |
|---|---|---|
| Tests unitarios | `npm run test:core`, `npm test --prefix landing-admin` | Regresiones de lógica |
| Guardrails de env | `npm run check:env` | Claves de test en Prod |
| Smoke bootstrap admin | `node scripts/smoke-admin-bootstrap.mjs` | Pantalla en blanco por imports rotos (ej. `getFunctions()` sin hub app) |
| Lint Firebase clients | `node scripts/lint-firebase-clients.mjs` | `getFunctions()` / `getAuth()` sin app hub a nivel módulo |
| Smoke hosting | `node scripts/smoke-hosting.mjs --url …` | Deploy con HTML roto o assets 404 |

---

## Secretos y GitHub Environments

| Environment | Uso |
|---|---|
| *(repo secrets)* | CI builds contra config Prod (solo compile, no deploy) |
| `stage` | Deploy Stage — proyecto `landings-stage` |
| `prod` | Promote to Prod — proyecto `landing-admin-9452e` + aprobación |

Sincronizar secretos desde máquina local (con `.env.production` válido):

```bash
scripts/sync-github-secrets.sh
```

---

## Responsabilidades del día a día

| Rol | Acción |
|---|---|
| Dev | PR + CI verde; probar preview del PR |
| Revisor | Merge solo con CI verde |
| QA / ops | Stage checklist antes de promote |
| Aprobador Prod | Ejecutar **Promote to Prod** tras QA |

---

## Incidente reciente (referencia)

**Sep 2026 — `admin.toqua.site` en blanco**

- **Causa:** `referralFunctions.js` llamaba `getFunctions()` al importar el módulo (app `[DEFAULT]`), pero el admin solo inicializa la app `hub`.
- **Por qué llegó a Prod:** merge a `main` disparaba deploy automático sin smoke de arranque.
- **Mitigaciones:** fix en código + esta estrategia (Phase C + smoke scripts).

---

## Próximos pasos ops (fuera del repo)

- [ ] Crear / cablear `landings-stage` con dominios `admin.stage.toqua.site`
- [ ] Configurar Environment `prod` con required reviewers
- [ ] Alertas: Functions errors, uptime en `/login`
- [ ] Firestore scheduled backups en Prod
