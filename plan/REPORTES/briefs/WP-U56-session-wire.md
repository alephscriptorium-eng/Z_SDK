# Brief — WP-U56 · Retirar wire vivo `session:*` del stack DJ

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U56 · Retirar wire vivo `session:*` del stack DJ
Rama: wp/u56-session-wire
Worktree: .worktrees/wp-u56-session-wire
Reporte: plan/REPORTES/WP-U56-session-wire.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U56-session-wire.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — cola residual post-Ola 5; lote-post5;
paralelo con U80 (otro worktree); post-U32 / U31:
- Retirar el wire vivo `session:*` del stack DJ local.
- Alcance de paquetes: player-ui, socket-server, console-monitor,
  ping-pong (bots / session-participant).
- Alinear al contrato room del engine: `state` / `intent` (como ya
  hace operator-ui / operator-bridge post-U32).
- Producto mesh real — no basta con aclarar READMEs.
- CA:
  · cero emit/on `session:*` en el stack DJ vivo
  · demos/e2e del stack usan el contrato room actual
- Demolición: allowlists y handlers `session:*` en esos paquetes.

Alcance orientativo:
- `packages/mesh/player-ui` — server, local-deck-io, socket-handlers,
  assets `session.js` / `deck.js` / console; tests que esperen
  `session:state`.
- `packages/mesh/socket-server` — allowlist `session:state` /
  `session:error` en config.
- `packages/mesh/console-monitor` — state-store / render / mcp-server
  que consumen payload `session:*`.
- `examples/ping-pong-bots` (y participantes session) — wire local.
- Referencia de destino: operator-bridge INTEGRATION.md (sustituyó
  puente sesión en U32); room-client-browser / protocol `state`/`intent`.
- Comentarios residuales en 3d-monitor que mencionan `session:state`
  como alias de SET_STATE: alinear o demoler si quedan vivos; no
  reabrir U32 salvo para el wire DJ.

Regla de los dos juegos (PRACTICAS §1.11):
- No introducir nombres de juego en paquetes engine; mesh puede
  ejercitar demos genéricas / ping-pong sin acoplar a delta/pozo.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U52-auditoria.md §hallazgos (origen de U56)
- plan/REPORTES/WP-U32-operator-ui.md + packages/mesh/operator-bridge/
  INTEGRATION.md (contrato room post-sesión)
- plan/REPORTES/WP-U31-player-ui-dj.md (contexto stack DJ)
- packages/engine/protocol/ (eventos room)
- packages/mesh/player-ui, socket-server, console-monitor
- examples/ping-pong-bots

Notas del orquestador:
- Lote-post5 paralelo con U80 (linea-kit). Particionar: U56 = mesh DJ
  wire; U80 = engine datos. Conflicto esperado bajo — no tocar
  linea-system / VOLUMES / DATOS.
- U55 (file: Angular) y Ola 6 (U60+) están **pausados** — no tocarios.
- Pregunta obligatoria (CA): ¿grep `session:` emit/on = 0 en stack DJ
  vivo? ¿demos/e2e del stack verdes con contrato room? ¿allowlists
  demolidas? Evidencia literal.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
