# WP-U21 · app-shell — reporte

| dato | valor |
| ---- | ----- |
| agente | worker lote-2b / Cursor Grok |
| fecha | 2026-07-17 |
| rama | `wp/u21-app-shell` |
| commit(s) | `e70a213` feat(app-shell); `0ecd845` refactor(arg-console)! |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

Se abrió `createAppConfig` para que `APP_DEFAULTS` sea enriquecimiento opcional
(no whitelist cerrada): appIds desconocidos funcionan con `extraDefaults` +
`defaultPort`. Se añadió el slot `argConsole` y la inyección runtime de
`scriptorium` (host/port/path desde el mesh UI; `secret` vía
`@zeus/rooms.resolveScriptoriumSecret`). `arg-console` pasó a consumir
`createAppConfig` (`skipConfigFile: true`) y se demolió la config divergente
con el comentario «a propósito NO usa createAppConfig». No se renombró el SSR
`src/view-kit/` (colisión de nombre U20): no bloqueaba este WP.

## Archivos tocados

- `packages/lib/app-shell/src/create-app-config.mjs` — modificado: argConsole,
  scriptorium volatile, updateSection más permisivo, docs de appId abierto
- `packages/lib/app-shell/package.json` — modificado: dep `@zeus/rooms`
- `packages/lib/app-shell/test/runtime-config.mjs` — modificado: tests
  argConsole + appId desconocido
- `packages/arg/arg-console/src/config.mjs` — modificado: createAppConfig
- `packages/arg/arg-console/src/viewer-config.mjs` — modificado: getConfig()
  sin env paralelo
- `packages/arg/arg-console/package.json` — modificado: dep `@zeus/app-shell`
- `package-lock.json` — modificado: lock de deps nuevas

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/app-shell` → **4 pass / 0 fail**
- `npm test -w @zeus/arg-console` → **32 pass / 0 fail**
- Consumidores app-shell (CA):
  - `@zeus/player-3d-ui` → `# pass 17 # fail 0`
  - `@zeus/3d-monitor` → `# pass 19 # fail 0`
  - `@zeus/console-monitor` → `# pass 10 # fail 0`
- OpenAPI drift **preexistente** (confirmado con stash de nuestros cambios;
  sin tocar código de este WP):
  - `player-ui` / `editor-ui` / `cache-browser` / `firehose-browser`
    fallan `* openapi.yaml is in sync (in-memory)` — mismo error con o sin
    diff U21. No es regresión de createAppConfig.
- `npm run lint` → `✖ 16 problems (0 errors, 16 warnings)` (warnings ajenos)
- Smoke config post-migración:

```
server: { host: "localhost", port: 3021 }
scriptorium: { path: "/runtime", host: "localhost", port: 3017, secret: "dev-secret" }
viewer: url http://localhost:3017/runtime, room ARG_DELTA
```

- Demo visual / `demo:arg` con navegador: `⏳ sin verificar` (política
  `ZEUS_OPEN_BROWSER` opt-in; no se setó `=1`)
- `e2e:arg`: `⏳ sin verificar` (CA del WP pide consumidores app-shell +
  arg-console sin config divergente; e2e no exigido en el CA literal)

### ¿pozo puede usar app-shell + createAppConfig tal cual? (PRACTICAS §1.11)

**Sí.** Test `unknown appId works with extraDefaults` pasa: un juego nuevo
puede llamar `createAppConfig({ appId: 'customGameUi', defaultPort, extraDefaults:
{ scriptorium: { path: '/runtime' }, … }, skipConfigFile: true })` sin entrar
en `APP_DEFAULTS`. Si el puerto debe resolverse por env mesh, el appId debe
coincidir con una clave de `APP_PORT_ENV` / UI mesh (o pasar `defaultPort`).

## Demolición

Borrado del comentario «a propósito NO usa createAppConfig», de
`DEFAULT_ARG_CONSOLE_PORT` / `DEFAULT_SCRIPTORIUM_PORT`, de
`ZEUS_ARG_CONSOLE_HOST` y de la `getConfig(env)` casera.

```
rg -n "NO usa createAppConfig|DEFAULT_ARG_CONSOLE_PORT|a propósito NO" -g '*.{mjs,js,md}' .
→ solo menciones en plan/BACKLOG.md y plan/REPORTES/briefs/WP-U21-app-shell.md
  (texto del WP / brief). Cero en packages/.
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: eliminados de arg-console; salen
  de `DEFAULT_ZEUS_UI_MESH` / `resolveZeusUiPorts` / `resolveAppPort`
- [x] Cadenas if/switch que debieron ser tabla: no añadidas
- [x] Duplicación: secret reutilizado de `@zeus/rooms` (no copiado)
- [x] console.log / código comentado / TODO: no añadidos (el `console.log` de
  creación de config.json en createAppConfig es preexistente; arg-console usa
  `skipConfigFile`)
- [x] Nombres: `argConsole` alineado con mesh; sin v2/old/new
- [x] Demolición completa (grep arriba): sí en packages/
- [x] Tests de comportamiento: port/scriptorium env + appId desconocido +
  suite arg-console intacta
- [x] Arranque: server tests de arg-console levantan Express en `port: 0` y
  ejercitan health/portal/vistas; demo con browser no
- [x] README/specs: app-shell no tiene README; contrato documentado en JSDoc
  del factory
- [x] Diff solo alcance WP: 7 archivos, sin BACKLOG

## Hallazgos fuera de alcance

- Colisión de nombre SSR `arg-console/src/view-kit/` (defineView) ≠
  `@zeus/view-kit` montado en `/view-kit` — diferido U20; no renombrado aquí
  (no bloqueaba createAppConfig). Candidato: renombrar SSR a p.ej.
  `src/view-ssr/` en WP corto o dentro de U22 si toca vistas.
- `plan/ARQUITECTURA.md` §1 aún dice «arg-console evita app-shell a propósito»
  — queda mentira tras este merge; actualizar en master al aceptar.
- Drift OpenAPI preexistente en player-ui / editor-ui / cache-browser /
  firehose-browser (`spec:generate` pendiente) — no causado por U21.
- `updateSection` ahora acepta secciones presentes en `DEFAULT_CONFIG` aunque
  no estén aún en el file config; comportamiento más permisivo, solo afecta
  callers que usen updateSection.

## Dudas / bloqueos

Ninguno. CA cumplido: arg-console sin config divergente; consumidores
app-shell verdes salvo openapi drift preexistente documentado.

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-17

### Verificado
- Diff acotado (8 archivos): app-shell + arg-console + reporte; sin BACKLOG
  tocado por el worker.
- Merge `master` → `wp/u21-app-shell` limpio (hereda U22/U24).
- CA-1 demolición: `rg` en `packages/` cero hits de
  `NO usa createAppConfig` / `DEFAULT_ARG_CONSOLE_PORT` / `a propósito NO`
  (solo plan/BACKLOG + reportes/brief).
- CA-2 consumidores: re-ejecutado post-merge —
  `npm test -w @zeus/app-shell` → 4/0;
  `npm test -w @zeus/arg-console` → 32/0;
  `@zeus/player-3d-ui` → 18/0; `@zeus/3d-monitor` → 15/0 (conteo post-U22);
  `@zeus/console-monitor` → 10/0.
- `npm run gates` → OK (0 offenders).
- PRACTICAS §1.1 puertos vía mesh; §1.11 pozo respondido (appId desconocido +
  extraDefaults); commits convencionales; OpenAPI drift preexistente no bloquea
  (documentado).

### Hallazgos a incorporar en master (higiene, no bloquean)
- Actualizar `plan/ARQUITECTURA.md` §1 («arg-console evita app-shell») —
  mentira post-merge.
- Colisión SSR `src/view-kit/` vs `@zeus/view-kit` — sigue diferida (U20/U22).

### Merge
Autorizado. Orden sugerido: U24/U22 ya en master; este WP puede entrar solo.
Tras merge: ✅ BACKLOG en master + `git worktree remove` del árbol U21.
No push en este ritual.
