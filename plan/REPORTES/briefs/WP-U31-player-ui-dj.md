# Brief — WP-U31 · player-ui = vista manipuladora

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U31 · player-ui = vista manipuladora
Rama: wp/u31-player-ui-dj
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u31-player-ui-dj
Reporte: plan/REPORTES/WP-U31-player-ui-dj.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U31-player-ui-dj.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Dep U30 ✅ + U11 ✅. player-ui deja de ser master de su room: se une a
  la room del juego (delta) como vista con rol `dj`, emite los intents
  de U30 (`cache` / `curate` / `milestone`) desde sus decks (mismas
  líneas, misma cache), proyecta `state`/`ledger` donde le toque.
- El estado xstate local se queda local; lo compartido viaja solo vía
  autoridad (`@zeus/authority-kit` / contrato único).
- CA:
  · e2e — acción de deck en player-ui produce intent → evidencia en
    ledger → visible en el tablero de delta
  · suite de player-ui verde (recortada a su nuevo rol)
- Demolición (obligatoria, D-3 / PRACTICAS §1 — cero re-exports compat):
  · `packages/app/player-ui/src/session-transport.mjs` como master
  · room `scriptorium.<id>` como camino de estado compartido del Tablero
  · paquetes `@zeus/session-protocol`, `@zeus/session-domain`,
    `@zeus/tablero-core`: lo que sea dominio vivo se absorbe (a
    `packages/arg` / delta o `@zeus/protocol`); el resto se borra.
  · Cero wrappers, aliases ni re-exports de compatibilidad.
  · Higiene cola U10: comentario residual «generate.mjs» en
    session-protocol (el paquete muere aquí).

Regla de los dos juegos (PRACTICAS §1.11) — obligatoria:
- Donde el cambio toque engine (`packages/lib/*` / `@zeus/*` kits): delta Y
  pozo deben quedar verdes donde aplique (`test:arg` / e2e delta + suites
  pozo; `gates` verde).
- Este WP es mesh/vista DJ sobre delta. Pozo no gana player-ui: si no
  aplica, documentarlo honestamente (sin regresión). Cero nombres de
  juego en engine; el `game` lo inyecta el caller.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-1 (player-ui = manipulador), D-2 (contrato único),
  D-3 (sin vías muertas / sin compat)
- plan/ARQUITECTURA.md §1–3 (dos protocolos → uno; session-* muere ola 3)
- plan/REPORTES/WP-U30-dj-intents.md (intents + casos C-30..C-32; tools
  MCP `dj_*` / decks → cablear aquí)
- packages/app/player-ui (session-transport, decks, tests)
- packages/lib/session-protocol, session-domain, tablero-core (demoler)
- packages/arg/arg-domain (intents dj U30), arg-demos (autoridad / room)
- packages/lib/protocol + authority-kit (U10/U11 — envelope, roles, kit)
- Cola hallazgos U11: dual-wire hasta migrar vistas — este WP es el
  momento de migrar player-ui al wire canónico; anotar residuales
- U32 (operator-ui) dep U31 — NO se toma en este chat
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Ola 3. Solo U31 asignado. U32 queda ⬜ (dep U31) — no implementar
  operator-ui / operator-bridge aquí.
- Alcance: player-ui como vista `dj` + demolición session-* / tablero-core
  + e2e del CA. Tools MCP `dj_*` si caben en el cableado de decks; si no,
  hallazgo honesto (no inventar segundo camino).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿delta y pozo verdes donde
  aplique? ¿quedó algún re-export/compat de session-*? (debe ser cero)
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
