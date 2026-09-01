# Estrategia de deploy (producción segura)

Este documento es la **guía operativa** para desplegar Toqua sin romper `admin.toqua.site`, `web.toqua.site` ni `toqua.site`.

Contexto técnico ampliado: [`environments-dev-stage-prod.md`](./environments-dev-stage-prod.md).

---

## Modo actual: sin Stage real (interino)

Hoy **no hay** entorno Stage operativo (`landings-stage`, `admin.stage.toqua.site`, etc.) — solo está documentado y el workflow existe como plantilla.

Hasta que exista, el flujo es:

```text
feature/* ──PR──► CI (tests + smoke + lint)
                    │
                    ├─ Preview Hosting (URL temporal en el PR — esto ES tu “stage”)
                    │     Abrir /login, probar login, editor, mirror
                    │
                    merge a main/master
                    │
                    ▼
         Promote to Prod (manual, GitHub Actions)
                    │
                    └─ Smoke HTTP en admin / web / toqua
```

| Paso | Qué hacer |
|---|---|
| Antes del merge | CI verde + abrir preview del PR y pasar checklist (abajo) |
| Después del merge | **Promote to Prod** (no esperes “Deploy Stage” — está desactivado por defecto) |
| Emergencia | Workflow legacy “Deploy to Firebase Hosting (manual legacy)” con `confirm: deploy` |

Activar Stage automático más adelante: crear proyecto `landings-stage`, secretos en Environment `stage`, y poner variable de repo **`STAGE_ENABLED=true`**.

---

## Principios

1. **Nada va directo a Prod al hacer merge** (Phase C). Sin Stage, la compuerta es **CI + preview del PR**; Prod solo con **Promote to Prod**.
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

## Flujo objetivo (cuando Stage exista)

```text
merge → Deploy Stage (STAGE_ENABLED=true) → QA en Stage → Promote to Prod
```

Ver sección **Modo actual** arriba si Stage aún no está cableado.

### Qué dispara cada workflow

| Evento | Workflow | Destino |
|---|---|---|
| Pull request | `ci.yml` | Validación (tests + smoke) |
| Pull request | `firebase-hosting-pull-request.yml` | **Preview** admin + template (QA interino) |
| Push a `main`/`master` | `deploy-stage.yml` | Stage **solo si** `STAGE_ENABLED=true` |
| Manual «Promote to Prod» | `promote-prod.yml` | **Prod** (hosting admin + template + toqua) |
| Manual legacy | `firebase-hosting-merge.yml` | Prod de emergencia (`confirm: deploy`) |

---

## Checklist antes de promover a Prod

**Sin Stage:** hacer esto en la **URL de preview del PR** (comentario del bot de Firebase Hosting).

Mínimo 5 minutos:

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

1. PR con CI verde; validar **preview del PR** (checklist arriba).
2. Merge a `main`/`master`.
3. GitHub → **Actions** → **Promote to Prod** → **Run workflow**.
4. Input `confirm`: escribir `promote`.
5. Si configuraste Environment **prod**, aprobar revisores; si no, usa secretos del repo.
6. El workflow despliega hosting y ejecuta smoke HTTP en Prod.

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
| QA / ops | Preview del PR (o Stage cuando exista) antes de promote |
| Aprobador Prod | Ejecutar **Promote to Prod** tras QA |

---

## Incidente reciente (referencia)

**Sep 2026 — `admin.toqua.site` en blanco**

- **Causa:** `referralFunctions.js` llamaba `getFunctions()` al importar el módulo (app `[DEFAULT]`), pero el admin solo inicializa la app `hub`.
- **Por qué llegó a Prod:** merge a `main` disparaba deploy automático sin smoke de arranque.
- **Mitigaciones:** fix en código + esta estrategia (Phase C + smoke scripts).

---

## Próximos pasos ops (fuera del repo)

- [ ] **Opcional:** crear `landings-stage` + dominios + `STAGE_ENABLED=true`
- [ ] Configurar Environment `prod` con required reviewers (recomendado aunque no haya Stage)
- [ ] Alertas: Functions errors, uptime en `/login`
- [ ] Firestore scheduled backups en Prod
