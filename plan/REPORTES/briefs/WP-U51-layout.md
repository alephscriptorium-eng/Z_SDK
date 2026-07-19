# Brief — WP-U51 · Layout final

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U51 · Layout final
Rama: wp/u51-layout
Worktree: .worktrees/wp-u51-layout
Reporte: plan/REPORTES/WP-U51-layout.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U51-layout.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog)
  — tras el move: packages/games/delta/spec/BACKLOG.md.

Política de swarm (dura) — OBLIGATORIA:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish.
- Solo move mecánico + workspaces/scripts/imports + verificación CA.

WP completo (de plan/BACKLOG.md) — Ola 5; dep olas 1–4; D-8/D-9:
- Mover a `packages/{engine,editor,mesh,games}` + `examples/` según
  ARQUITECTURA §2. Un solo WP, mecánico, repo ya convergido (U50 ✅).
- Actualizar workspaces, scripts raíz, paths hardcodeados e imports
  de ruta (si los hay). Los nombres de paquete npm `@zeus/*` NO tienen
  por qué cambiar — solo la ruta en disco.
- Preferir `git mv` (o equivalente que preserve historial) para que
  `git log --follow` conserve historia. Evitar copy+delete.
- CA:
  · `npm install` limpio (tras el move: borrar node_modules +
    package-lock regenerado o `npm install` que deje workspaces
    resolviendo sin ghost/`extraneous` por paths viejos)
  · `npm run lint` verde
  · `npm run test:arg` verde
  · `npm run gates` verde
  · e2e de la matriz verdes (como mínimo: `e2e:arg`, y los e2e que
    CI / scripts raíz ya cablean — p.ej. arg-mcp, pozo, player-ui /
    dual-ui / player-3d / 3d-monitor según existan; listar en reporte
    con evidencia literal; ⏳ honesto si alguno no corre por ambiente)
  · `git log --follow` conserva historia de archivos movidos
    (muestra al menos 1–2 ejemplos en el reporte)
- Demolición (obligatoria — cero carpetas fantasma):
  · tras el move, NO deben quedar `packages/lib/`, `packages/app/`,
    `packages/platform/`, `packages/mcp/`, `packages/arg/` (ni
    re-exports de compatibilidad en esas rutas)
  · `packages/operator-ui/` en la raíz de packages/ también se mueve
    a `packages/mesh/operator-ui/` (hoy está fuera de `app/`)

Mapa orientativo (fuente: ARQUITECTURA §2 + layout actual):

  engine/  ← packages/lib/* EXCEPTO operator-bridge
    protocol, authority-kit, player-mcp-kit, view-kit, playbook-kit,
    game-engine, rooms, presets-sdk, http-contract, ui-kit, ui-3d-kit,
    app-shell, firehose-core, room-client-browser, test-utils

  editor/  ← packages/app/editor-ui
    editor-ui/

  mesh/    ← platform + mcp + apps de operar/jugar + operator-*
    socket-server, cache-browser, firehose-browser, console-monitor,
    3d-monitor (← packages/platform/*)
    linea-system, linea-firehose, solar-system (← packages/mcp/*)
    player-ui, player-3d-ui (← packages/app/*)
    operator-ui (← packages/operator-ui)
    operator-bridge (← packages/lib/operator-bridge)

  games/
    delta/  ← packages/arg/* (domain, feeds, console, player-mcp,
              demos, spec, README) — subpaquetes bajo games/delta/
    pozo/   ← packages/games/pozo (ya en games/; confirmar path final)

  examples/ (raíz del repo, NO bajo packages/)
    ← packages/app/game-demos, packages/app/ping-pong-bots
    + escenas/configs mínimas de view-kit si ya existen o se
      reubican sin fork (D-9: visores viven en mesh; examples
      ilustran, no copian)

Workspaces raíz objetivo (ajustar a la realidad post-move):
  "packages/engine/*",
  "packages/editor/*",
  "packages/mesh/*",
  "packages/games/*",
  "packages/games/delta/*",   // si delta es carpeta-contenedor
  "examples/*"
  (el worker elige el glob mínimo que haga `npm install` limpio;
   documentar en el reporte)

Regla de los dos juegos (PRACTICAS §1.11 / gate U00):
- Este WP NO introduce nombres de juego en engine. Solo mueve.
- Tras move, gates deben seguir verdes (paths de excepciones /
  scripts de gates pueden necesitar update a nuevas rutas).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §2 (layout objetivo; mapa canónico)
- plan/DECISIONES.md D-8 (games/delta|pozo), D-9 (visores en mesh,
  examples sin fork)
- root package.json (workspaces + scripts con paths
  packages/lib|app|platform|mcp|arg|operator-ui)
- scripts/gates/ (pueden hardcodear rutas viejas)
- .github/workflows/ci.yml (matriz de paths si las hay)
- docs/ / VitePress (enlaces a packages/… viejos — actualizar lo
  roto; no reescribir portal entero)

Notas del orquestador:
- U50 ✅. Solo U51 ahora. U52 es la última de la refundación.
  U53/U54 pueden ir después o en paralelo blando — NO asignar /
  NO tocar en este WP.
- WP mecánico: no features, no renombrar `@zeus/*` salvo que un
  path de import de archivo lo exija. Diff grande de paths = OK;
  diff de comportamiento = sospechoso.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Para e2e del CA:
  NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana.
- Pregunta obligatoria (CA): ¿npm install limpio? ¿lint / test:arg /
  gates / e2e matriz verdes? ¿git log --follow OK? ¿carpetas
  lib/app/platform/mcp/arg (y operator-ui suelto) demolidas?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
