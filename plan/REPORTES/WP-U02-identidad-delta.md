# WP-U02 · identidad-delta — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U02) |
| fecha | 2026-07-17 |
| rama | `wp/u02-identidad-delta` |
| commit(s) | _(ver `git log` en la rama; hashes tras commit)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se retiró la marca «CAUDAL» en favor de **delta** (D-8) en specs, READMEs y
cadenas/banners de código bajo `packages/`. La metáfora hidráulica en prosa
(«caudal» = flujo de agua) pasó a **flujo** para que el CA case-insensitive
quede limpio, sin notas «(antes CAUDAL)». Claves de localStorage
(`delta:<view>:<id>`), feature handshake (`delta-0.1`) y franjas DOM/CSS de
cache/firehose-browser (`delta-strip*`) se renombraron como identidad; no se
tocaron rooms (`ARG_DELTA`), eventos (`arg:*`) ni rutas HTTP.

## Archivos tocados

- modificado `packages/arg/spec/{LORE,CASOS,CONTRATO,MAR,UX,VALIDACION,BACKLOG}.md` — títulos/prosa identidad
- modificado `packages/arg/README.md`, `arg-domain/README.md`, `arg-demos/README.md` — marca delta
- modificado `packages/arg/*/package.json` (console, demos, domain, feeds, player-mcp) — descriptions
- modificado `packages/arg/arg-console` (kit/panel/vistas/server/shell/portal/css/tests) — banners y clave storage
- modificado `packages/arg/arg-demos` (authority, launch) — banners y `delta-0.1`
- modificado `packages/arg/arg-domain` (contract, index, domain-state, delta-v0) — comentarios identidad
- modificado `packages/arg/arg-feeds`, `arg-player-mcp` — comentarios/features/playbook strings
- modificado `packages/platform/{cache,firehose}-browser` — franja de juego DOM/CSS
- modificado `packages/lib/presets-sdk/test/env-stop-services.mjs` — nombre del test
- creado `plan/REPORTES/WP-U02-identidad-delta.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- CA grep (`grep -ri CAUDAL packages/`):

```
(sin salida — limpio)
exit code: 1  (sin coincidencias)
```

- `npm run test:arg` → exit 0 (arg-domain 51, arg-feeds 4, arg-console completo, arg-player-mcp 21; fail 0).

- `npm run e2e:arg` → exit 0:

```
🌊 e2e CAUDAL · puertos aislados { SOCKET_PORT: 13027, CONSOLE_PORT: 13031, ROOM: 'ARG_E2E' }

✅ G-ARG-E2E.1 consola · health 200, shells ok
✅ G-ARG-E2E.2 join · uno en plaza
✅ G-ARG-E2E.3 no-op · grifo sigue cerrado desde la plaza
✅ G-ARG-E2E.4 riada · 1 gotas en rio-a
✅ G-ARG-E2E.6 cloak · tronco
✅ G-ARG-E2E.5 etiqueta · ledger: label
✅ G-ARG-E2E.6b presets API · HTTP 200
✅ G-ARG-E2E.9 salvage · murk 6→5, crystals 0→1
✅ G-ARG-E2E.10 track:cast · firehose://synthetic/5/0#brindis

🟢 e2e CAUDAL: todos los gates en verde
```

- `npm run lint` → exit 0 (0 errors, 16 warnings preexistentes fuera de este WP).

- Arranque visual demo: ⏳ sin verificar (no se abrió navegador; e2e cubre health/shells/protocolo).

## Demolición

Nombre de juego «CAUDAL» retirado de `packages/`. Sin «(antes CAUDAL)» en specs.
Etimología del nombre viejo eliminada de LORE (historia en git + D-8).

```
$ grep -ri CAUDAL packages/
(sin salida)
$ grep -ri 'antes CAUDAL\|antes caudal' packages/
(sin salida)
```

Quedan menciones históricas en `plan/DECISIONES.md` (permitidas por el CA) y
banners en `e2e/` + `.vscode/tasks.json` (fuera de `packages/`; ver hallazgos).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no añadí ninguno; rooms/eventos/rutas intactos.
- [x] Cadenas if/switch que debieron ser tabla: n/a (solo renombres).
- [x] Duplicación con otros paquetes: n/a.
- [x] console.log / código comentado / TODO sin backlog: no añadí; solo cambié textos de logs existentes.
- [x] Nombres fuera de glosario o de transición: usé `delta` (D-8) y `flujo` para la metáfora; sin v2/old/new.
- [x] Demolición completa en `packages/` (grep arriba). Fuera de packages quedan e2e/vscode (hallazgo).
- [x] Tests prueban comportamiento: tests existentes actualizados (panelStorageKey); CA del WP = tests verdes, no tests nuevos (WP de identidad/demolición).
- [ ] Arranque real verificado (qué levanté y miré): ⏳ e2e sí; demo visual en navegador no.
- [x] README/specs del paquete siguen siendo verdad: sí, alineados a delta.
- [x] El diff contiene solo el alcance del WP: sí (identidad en packages/; no BACKLOG plan, no features del spec/BACKLOG).

## Hallazgos fuera de alcance

1. **Banners e2e / vscode aún dicen CAUDAL** (`e2e/arg-demo.mjs`,
   `e2e/arg-mcp-demo.mjs`, `e2e/arg-horse-demo.mjs`, `.vscode/tasks.json`). El
   CA del WP solo exige `packages/`; no se tocaron para no ensanchar alcance.
   Candidato a micro-WP o follow-up del orquestador.
2. **`plan/README.md`** menciona «CAUDAL» hasta WP-U02 — coherente con plan;
   no es `packages/`.
3. Feature handshake `caudal-0.1` → `delta-0.1`: no es room/evento/ruta; si
   algo externo filtraba por el string viejo, dejaría de matchear (no hay
   consumidores conocidos en el repo).

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador (sin tocar `plan/BACKLOG.md`).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
