# CMS audit, inbox e incidencias

## Colecciones

| Colección | Escritura | Lectura |
|---|---|---|
| `pageAudits` | Cloud Functions | Root o quien puede editar la página |
| `notifications` | Cloud Functions | Destinatario (o root); marcar leído en cliente |
| `tickets` | Cloud Functions | Root / admin con acceso a la página |

`tickets.source` es `cms` hoy; `public` queda reservado para un futuro formulario en la landing.

## Flujo de guardado

1. El admin guarda con `savePageFromEditor` (cliente).
2. Tras éxito, llama `recordPageAudit` con un snapshot `before`.
3. La Function lee el documento actual (`after`), calcula `changedKeys`, escribe `pageAudits` y notifica al owner de billing + admins asignados.

## Callables

- `recordPageAudit`, `listPageAudits`
- `listMyNotifications`, `markNotificationRead`, `markAllNotificationsRead`
- `createCmsTicket`, `updateCmsTicket`, `listCmsTickets`
- `reportSystemIncident`

## UI

- `/app/inbox` — notificaciones in-app
- `/app/tickets` — tickets internos (root/admin)
- Editor → sección **Historial de cambios**

## Incidencias automáticas (fase 4)

- Deploy fallido en `triggerHostingDeploy` → ticket `deploy` + notificación
- Cambio de stage de acceso (`grace` / `ads` / `offline`) en billing → notificación (`offline` también abre ticket)
