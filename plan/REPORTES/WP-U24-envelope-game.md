# WP-U24 · envelope-game — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U24) |
| fecha | 2026-07-17 |
| rama | `wp/u24-envelope-game` |
| commit(s) | `a013374` feat(authority-kit)! · `8c81a58` refactor(arg-demos) · (este) docs(plan) |
| estado propuesto | listo para revisión |
| push | no intentado |
| browsers | no launch (`ZEUS_OPEN_BROWSER=0` / unset) |

## Qué se hizo

Se cerró A-02 en `@zeus/authority-kit`: `startAuthority` exige `game`
(string no vacío) y publica `state` / `track` / `ledger` exclusivamente vía
`makeEnvelope` de `@zeus/protocol` (campo `payload.game`). Se demolió la
publicación de payloads sueltos `{ from, ...snapshot }` / track / ledger
crudos.

La autoridad delta (`arg-demos/apps/authority`) pasa `game: GAME_ID`
(`'delta'`). El kit no nombra juegos. Dual-wire (A-05) no se tocó: se
conserva el mapa de eventos que ya aportaba el caller.

En ledger, el discriminante de hecho del dominio (`kind: 'label'|…`) colisiona
con el `kind` de protocolo (`'ledger'`): el kit pasa por `makeEnvelope` con
kind canónico, copia el discriminante a `entryKind` y restaura `kind` en el
payload publicado para no romper e2e/vistas que aún leen `entry.kind`.

## Archivos tocados

- modificado `packages/lib/authority-kit/src/create-authority.mjs` — `game` +
  `makeEnvelope` en state/track/ledger
- modificado `packages/lib/authority-kit/test/authority-kit.test.mjs` —
  aserciones `payload.game`; rechazo sin `game`
- modificado `packages/lib/authority-kit/README.md` — contrato `game` /
  envelope
- modificado `packages/arg/arg-demos/apps/authority/index.mjs` —
  `game: GAME_ID`
- creado `plan/REPORTES/WP-U24-envelope-game.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/authority-kit` → exit 0:

```
# tests 10
# suites 3
# pass 10
# fail 0
```

- `npm run lint` → exit 0 (0 errors; 18 warnings preexistentes).

- `npm run gates` → `gates: OK (0 offenders)`.

- `npm run test:arg` → exit 0 (incluye arg-domain / feeds / console /
  player-mcp; último bloque projection 20/20 pass).

- `ZEUS_OPEN_BROWSER=0 npm run e2e:arg` → exit 0:

```
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

- Arranque visual / navegador: **no** (política brief: opt-in; no se setearon
  browsers).

## Demolición

Publicación de payloads sin envelope en el kit:

```
$ rg -n "publishAll\(client.*\{ from: user" packages/lib/authority-kit/
(cero coincidencias)

$ rg -n "makeEnvelope" packages/lib/authority-kit/src/create-authority.mjs
(import + 3 usos: state, track, ledger)
```

Cero nombres de juego en el kit:

```
$ rg -n "delta|pozo|cantera|grifo|caudal" packages/lib/authority-kit/src/
(cero coincidencias)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; room/user/game vienen de opts.
- [x] Cadenas if/switch que debieron ser tabla: no; publish sigue por listas
  de eventos.
- [x] Duplicación: se reutiliza `makeEnvelope` de `@zeus/protocol` (no se
  reinventó el envelope).
- [x] console.log / código comentado / TODO sin backlog: comentario en
  ledger explica colisión `kind`/`entryKind` (hallazgo, no TODO suelto).
- [x] Nombres fuera de glosario o de transición: no `legacy`/`v2`; tests usan
  `game: 'kit-test'` (no nombre de juego real).
- [x] Demolición: greps arriba.
- [x] Tests de comportamiento: exigen `game`; asertan `payload.game` en
  state/track/ledger; rechazo sin `game`.
- [x] Arranque real: `e2e:arg` verde; sin navegador (política).
- [x] README del kit actualizado al contrato `game` + envelope.
- [x] Diff solo alcance U24: sí (kit + caller delta + reporte; no A-05 /
  dual-wire nuevo; no BACKLOG).

## ¿pozo puede arrancar autoridad solo pasando `game: 'pozo'` sin tocar el kit?
(PRACTICAS §1.11)

**Sí.** El kit solo exige `game` string no vacío y envuelve con
`makeEnvelope`. Pozo aportaría `game: 'pozo'`, su `domain` y (si quiere)
`events` canónicos; no hace falta cambiar el kit.

## Hallazgos fuera de alcance

- **Ledger `kind` vs `entryKind`:** AsyncAPI / `makeEnvelope` usan
  `kind: 'ledger'` y prevén `entryKind` para el discriminante de hecho.
  Delta y todos los consumidores (e2e, tablero, player-mcp) siguen leyendo
  `entry.kind === 'label'|…`. El kit publica ambos (`entryKind` + `kind`
  restaurado al discriminante) para no romper el wire. Migrar consumidores
  a `entryKind` (y dejar `kind: 'ledger'` en el envelope) es candidato a WP
  aparte — no es A-05.
- Dual-wire `arg:*` + canónico sigue en el caller delta (cola U11 / A-05);
  este WP no lo tocó.
- `npm install` en el worktree quedó lento/parcial al inicio; los tests
  corrieron con `node_modules` del worktree ya enlazando `@zeus/*` al
  paquete local.

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-17 (orquestador). Sin merge ni ✅ BACKLOG en esta
pasada (pedido explícito del usuario; autorización queda pendiente de
merge+✅ en master). Sin push.

### Verificado

- Merge `master` → rama: limpio (`chore(wp-u24): merge master`); hereda
  WP-U22 (3d-monitor / player-3d-ui sobre view-kit). Sin conflicto de
  producto con U24.
- Diff acotado a U24: `authority-kit` (`game` + `makeEnvelope` state/track/
  ledger), caller delta `game: GAME_ID`, README kit, reporte. Worker **no**
  tocó BACKLOG ni `packages/arg/spec/BACKLOG.md`. Dual-wire / A-05 no
  cambiado (solo aserción `payload.game` en test dual-wire ya existente).
- Commits convencionales: `feat(authority-kit)!` · `refactor(arg-demos)` ·
  docs · merge chore.
- Re-CA (worktree post-merge, `ZEUS_OPEN_BROWSER=0`):
  - `npm test -w @zeus/authority-kit` → 10/10 pass
  - `npm run test:arg` → exit 0
  - `npm run e2e:arg` → verde (G-ARG-E2E.1–.10; sin browser)
  - `npm run gates` → `gates: OK (0 offenders)`
- Demolición: cero `publishAll(...{ from:` sueltos; `makeEnvelope` ×3
  (state/track/ledger); cero nombres de juego en `authority-kit/src/`.
- PRACTICAS §1.11 pozo: respuesta sí (solo `game: 'pozo'` + domain).
- Auto-revisión PRACTICAS §3 honesta; evidencia literal coherente.

### CA

- [x] tests del kit asertan `payload.game` en state/track/ledger (+ rechazo
  sin `game`)
- [x] autoridad delta instancia el kit y `test:arg` / `e2e:arg` verdes
- [x] cero nombres de juego en el kit (caller inyecta `game`)

### Hallazgo (no bloquea)

- **Ledger `kind` vs `entryKind`:** documentado en reporte + comentario en
  kit. Payload lleva `entryKind` + `kind` restaurado al discriminante para
  no romper e2e/vistas. Migrar consumidores a `entryKind` (dejar
  `kind: 'ledger'` en envelope) = WP futuro; no es A-05.

### Merge

- Autorizado a merge temprano en master (gate pre-U23; pocos conflictos con
  vistas). Preferible antes de U23. U21 sigue en vuelo en paralelo — no
  bloquea este merge.
- Tras merge+✅: `git worktree remove` del worktree U24.
- Siguiente tras ✅: desbloquear U23.
