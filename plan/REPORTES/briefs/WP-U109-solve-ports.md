# Brief — WP-U109 · Slots puertos `solve*` (+ residual `pozo*`)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: hallazgo U87 §7 + residual pozo (cola U23 / README pozo).
**Micro higiene post-U87** — GO usuario 2026-07-18. Orden: U109 → U110.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U109 · Slots puertos solve* (+ residual pozo*) en presets-sdk
Rama: wp/u109-solve-ports
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u109-solve-ports
Reporte: plan/REPORTES/WP-U109-solve-ports.md

Library (consumidores): sibling ../Z_SDK-games-library
  Rama: wp/u109-solve-ports
  Worktree (si hace falta): ../Z_SDK-games-library/.worktrees/wp-u109-solve-ports

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U109-solve-ports.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits en rama WP zeus + push de la rama WP OK (habitual).
- SÍ permitido: commits + push rama WP en Z_SDK-games-library
  (consumidores pozo/solve viven allí).
- NO merge a main (zeus ni library) — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main (no master).
- NO tocar U110 ni frente U111–U114.

WP completo (de plan/BACKLOG.md) — post-U87; deps U87 ✅ · U23 ✅:
- Añadir slots canónicos en packages/engine/presets-sdk/src/env:
  · MCP: solvePlayer (default 4132, env ZEUS_MCP_SOLVE) y
    pozoPlayer (default 4131, env ZEUS_MCP_POZO) en DEFAULT_ZEUS_MCP
    + MCP_PORT_ENV + resolveZeusMcpPorts.
  · UI: solveView (default 3026, env ZEUS_PORT_SOLVE_VIEW) y
    pozoView (default 3025, env ZEUS_PORT_POZO_VIEW) en
    DEFAULT_ZEUS_UI_MESH + UI_PORT_ENV + resolveZeusUiPorts.
  · Espejo en scripts/gates/scan.mjs → KNOWN_ZEUS_PORTS
    (3025, 3026, 4131, 4132).
- Library: @zeus/solve-coagula y @zeus/pozo dejan de aportar
  DEFAULT_*_PORT literales; leen resolveZeusMcpPorts /
  resolveZeusUiPorts (mismo patrón que argPlayer / argConsole).
- Tests presets-sdk + gates verdes; README env al día.
- CA:
  · rg sin defaults de puerto hardcodeados solve/pozo fuera de
    presets-sdk/env y docs/specs (zeus + library código de juego);
  · resolveZeus*Ports expone las claves;
  · npm test -w @zeus/presets-sdk + npm run gates verdes;
  · demos/e2e solve y pozo siguen resolviendo puertos (library o
    smoke documentado).
- Demolición: DEFAULT_SOLVE_*_PORT / DEFAULT_POZO_*_PORT y
  cualquier ?? 30xx/41xx de solve/pozo que el resolver sustituya
  (en código de juego; specs/CASOS.md pueden citar ejemplos).

Alcance orientativo:
- Zeus: presets-sdk/env + tests + README + KNOWN_ZEUS_PORTS (+
  changeset patch si publicable).
- Library: packages/pozo + packages/solve-coagula (endpoints /
  contract / README que mientan «defaults viven en el juego»).
- NO U110 (startpack-kit). NO U111–U114. NO publish/U55/DNS.
- NO editar plan/BACKLOG.md.
- Evidencia literal en reporte.

Regla de los dos juegos (PRACTICAS §1.11) + gate:
- Catálogo de puertos en presets-sdk ya tiene argPlayer (precedente).
- Claves pozoPlayer/pozoView contienen «pozo» → pueden disparar
  gate two-games en packages/engine. Si falla: excepción comentada
  en scripts/gates/exceptions.mjs (PRACTICAS §5) — legitimidad =
  BACKLOG nombra esos slots; no meter conceptos de juego fuera del
  catálogo env.
- «solve» no está en GAME_EXCLUSIVE_RE hoy.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- packages/engine/presets-sdk/src/env/index.mjs
- scripts/gates/scan.mjs (KNOWN_ZEUS_PORTS)
- ../Z_SDK-games-library/packages/pozo/src/{endpoints,contract}.mjs
- ../Z_SDK-games-library/packages/solve-coagula/src/{endpoints,contract}.mjs
- plan/REPORTES/WP-U87-solve-coagula.md §hallazgo 7
- plan/REPORTES/WP-U23-pozo.md (residual slots)

Notas del orquestador:
- Solo U109. No abrir U110 ni frente editor.
- Worktree zeus listo; library: crear rama/worktree desde main
  library actualizado.
- Changeset patch @zeus/presets-sdk si el WP toca API pública env.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
