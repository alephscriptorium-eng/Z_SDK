# WP-U10 · protocol — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U10) |
| fecha | 2026-07-17 |
| rama | `wp/u10-protocol` |
| commit(s) | `faa76bd` feat(protocol) · `9f87dd2` refactor(arg-domain)! · `3bffbdc` refactor(session-protocol)! · `364b749` docs(plan) |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

Se creó `@zeus/protocol` (`packages/lib/protocol`): envelope
`state|intent|track|ledger` con campo `game`, `makeIntent`/`validateIntent`,
roles `player|dj|operator` por catálogo, gates G-PROTO.1–5, Peer Card como
credencial de rol desde el día 1, y AsyncAPI generado desde el contrato.
`@zeus/arg-domain` pasó a consumir el protocolo (capa delta: wire `arg:*` +
`INTENT_DEFS`); `applyIntent` rechaza `rol_no_autorizado`. arg-console sirve
`/protocol` en el import map. Se demolió `session-protocol/spec/generate.mjs`
y el portal AsyncAPI apunta a protocol.

## Archivos tocados

- creado `packages/lib/protocol/**` — paquete contrato + tests + AsyncAPI + README
- modificado `packages/arg/arg-domain/src/{contract,domain-state}.mjs` — consume protocol + gate de rol
- modificado `packages/arg/arg-domain/{package.json,README.md,test/domain-state.test.mjs}`
- modificado `packages/arg/arg-console/{package.json,src/server.mjs,src/views/shell.mjs,test/server.test.mjs}` — servir protocol
- modificado `packages/arg/spec/CONTRATO.md` — apunta al contrato único
- borrado `packages/lib/session-protocol/spec/generate.mjs`
- modificado `packages/lib/session-protocol/{package.json,spec/README.md,test/spec-sync.test.mjs}`
- modificado `scripts/spec-{asyncapi-html,studio}.mjs`, `package.json`, `package-lock.json`
- creado `plan/REPORTES/WP-U10-protocol.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/protocol` → exit 0 (13 pass, incl. roles + spec-sync):

```
# tests 13
# pass 13
# fail 0
```

- `npm run test:arg` → exit 0 (arg-domain 52 incl. «rol no autorizado ⇒ rechazo»,
  arg-feeds 4, arg-console completo incl. `/protocol/index.mjs`, arg-player-mcp 21).

- `npm run spec:generate -w @zeus/protocol` → Wrote `.../protocol/spec/asyncapi.yaml`

- `npm run spec:asyncapi:html` → exit 0:

```
→ Zeus protocol: packages\lib\protocol\spec\asyncapi.yaml
Check out your shiny new generated files at ...\docs\public\api\protocol
AsyncAPI HTML generated: docs/public/api/protocol/
```

  (`docs/public/api/protocol/index.html` presente; gitignored bajo `docs/public/api/`).

- `npm run lint` → exit 0 (0 errors, warnings preexistentes + ninguno nuevo bloqueante).

- `npm run gates` → `gates: OK (0 offenders)`

- Arranque visual demo: ⏳ sin verificar (no se abrió navegador; tests de server
  cubren import map + estáticos `/protocol`).

## Demolición

1. Contrato genérico duplicado en arg-domain → sustituido por import de
   `@zeus/protocol`; queda solo lo específico de delta (`EVENTS` `arg:*`,
   `INTENT_DEFS`, room/tick, poses/emotes/zones, `trackHintFor`).
2. `packages/lib/session-protocol/spec/generate.mjs` borrado; script
   `spec:generate` del paquete retirado; raíz `spec:generate` → `@zeus/protocol`.

```
$ ls packages/lib/session-protocol/spec/generate.mjs
ls: cannot access '.../generate.mjs': No such file or directory

$ rg "spec:generate -w @zeus/session-protocol" packages/lib/session-protocol package.json scripts/
(sin coincidencias en session-protocol / package.json / scripts de portal)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en protocol; Peer Card usa
  `endpoint` como dato de credencial (no hardcode). CONTRATO delta ya no cita
  `:3017` en el párrafo de transporte (env).
- [x] Cadenas if/switch que debieron ser tabla: catálogo Map + EVENT_META por
  kind; sin switch creciente nuevo.
- [x] Duplicación: lo genérico salió de arg-domain a protocol; no se copió
  session-protocol entero.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no `legacy`/`v2`; wire `arg:*`
  documentado como alias histórico de delta (comportamiento CA), no como
  paquete `-old`.
- [x] Demolición: generate.mjs de session-protocol ausente (grep arriba).
- [x] Tests de comportamiento: roles unauthorized → `rol_no_autorizado`;
  Peer Card expiry; snapshot budget; spec-sync.
- [x] Arranque real: ⏳ sin demo visual; server tests verdes.
- [x] README/specs: protocol README + CONTRATO; arg-domain README y CONTRATO
  actualizados; AsyncAPI regenerado.
- [x] Diff solo alcance U10: sí (no U11/U12/U13).

## Peer Card (decisión)

**Adoptada desde el día 1.** Forma
`{ roomId, endpoint, token, scopes, expiresAt }` con scopes `role:player|dj|operator`.
Convence porque: (1) revocable por `expiresAt`, (2) separa ticket de room de
identidad fuerte (SSB/U73), (3) misma pieza prevista para WebRTC (ola 10).
API: `makePeerCard`, `roleFromPeerCard`, `peerCardGrantsRole`. La autoridad
aún no exige Peer Card en cada intent (eso lo cableará authority-kit / mesh);
el formato y los helpers están listos.

## ¿pozo puede consumir `@zeus/protocol` tal cual? (PRACTICAS §1.11)

**Sí.** El paquete no nombra delta/pozo ni conceptos de juego. Un juego pozo
aportaría `game: 'pozo'`, su catálogo `intent → { roles }`, y usaría
`makeIntent` / `validateIntent` / Peer Card sin tocar el engine. Los wire
names canónicos son `state|intent|track|ledger`; delta conserva `arg:*` solo
en su capa.

## Hallazgos fuera de alcance

- Portal VitePress (`docs/`) no existe en el árbol trackeado; solo se genera
  HTML AsyncAPI bajo `docs/public/api/protocol/` (gitignored). U41 refundará
  el portal.
- Wire `arg:*` sigue en delta; migrar a kinds canónicos es candidato cuando
  U11 (authority-kit) y las vistas se recableen.
- session-protocol `build.mjs` + `asyncapi.yaml` congelados hasta U31
  (tests internos).
- e2e banners residuales «CAUDAL» (cola hallazgos U02) — no tocados.

## Dudas / bloqueos

Ninguno bloqueante. Pregunta al orquestador: ¿en U11 se exige Peer Card en
el handshake de room, o basta `role` en el intent hasta ola WebRTC?

---

## Revisión del orquestador

**Veredicto: aceptado ✅** — orquestador / 2026-07-17

Autorizado a merge + ✅ BACKLOG en master (paso aparte; **no** hechos en
esta revisión). Sin push.

### Verificado

- **Base**: rama 1 commit detrás de master → merge limpio
  `6cd8cb2 chore(u10): merge master into wp/u10-protocol` (solo brief +
  BACKLOG 🔶 de master; sin conflicto de producto).
- **Alcance** `master...HEAD`: `@zeus/protocol` nuevo, consumo en
  arg-domain/arg-console, demolición `session-protocol/spec:generate`,
  scripts portal AsyncAPI, reporte. Worker **no** editó `plan/BACKLOG.md`
  ni `packages/arg/spec/BACKLOG.md`. Sin U11/U12/U13.
- **Commits** convencionales + BREAKING donde toca:
  `feat(protocol)`, `refactor(arg-domain)!`, `refactor(session-protocol)!`,
  `docs(plan)`.
- **CA re-ejecutado** (worktree, 2026-07-17):
  - `npm test -w @zeus/protocol` → 13 pass / 0 fail
  - `npm run test:arg` → exit 0 (arg-domain 52 incl. «rol no autorizado ⇒
    rechazo»; arg-feeds 4; arg-console incl. `/protocol/index.mjs`;
    arg-player-mcp 21)
  - `npm run gates` → `gates: OK (0 offenders)`
  - `npm run spec:asyncapi:html` → `docs/public/api/protocol/index.html`
  - Test rol no autorizado: `denied.error === 'rol_no_autorizado'`
- **Demolición**:
  - arg-domain: contrato genérico vía `@zeus/protocol`; queda delta
    (`EVENTS` `arg:*`, `INTENT_DEFS`, room/tick, poses…)
  - `packages/lib/session-protocol/spec/generate.mjs` ausente; script
    `spec:generate` retirado del paquete; raíz apunta a `@zeus/protocol`
- **Peer Card**: decisión **adoptada** documentada en reporte
  (`makePeerCard` / scopes `role:*` / helpers); autoridad aún no exige
  card en cada intent (correcto; cableo U11+).
- **D-8 / §1.11**: `src/` de protocol sin nombres de juego; respuesta
  «pozo puede consumir tal cual» = sí, coherente.
- Auto-revisión PRACTICAS §3 honesta; evidencia literal coherente.

### Hallazgos → cola (no bloquean)

- Migrar wire `arg:*` → kinds canónicos cuando U11 + vistas (ya en reporte).
- session-protocol `build.mjs` + asyncapi congelados hasta U31; comentario
  residual «generate.mjs» en `session-protocol/spec/build.mjs` (higiene).
- Portal VitePress ausente → U41; HTML AsyncAPI bajo `docs/public/api/`
  (gitignored) cumple CA de render.
- Duda worker (no bloquea): ¿U11 exige Peer Card en handshake o basta
  `role` en intent hasta ola WebRTC? → anotar en brief U11 / DECISIONES
  si el usuario quiere cerrarlo.
- e2e banners «CAUDAL» residuales (cola U02) — fuera de alcance.

### Merge

Orden: **WP-U10 primero** (bloquea U11/U12). Tras merge en master: ✅
BACKLOG + `git worktree remove` del worktree U10. Luego asignar U11/U12
en paralelo.
