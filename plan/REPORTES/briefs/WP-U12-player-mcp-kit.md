# Brief — WP-U12 · `@zeus/player-mcp-kit`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U12 · @zeus/player-mcp-kit
Rama: wp/u12-player-mcp-kit
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u12-player-mcp-kit
Reporte: plan/REPORTES/WP-U12-player-mcp-kit.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U12-player-mcp-kit.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Generalizar `arg-player-mcp`: patrón «un MCP por actor» con
  semántica verificable:
  · emitir intent → esperar evidencia en state/ledger
  · dry-run de rechazos
  · resources estándar (`<game>://player/state`, `<game>://scene`,
    `<game>://casos`)
  · health con `connected` + `lastStateTs`
- CA:
  · arg-player-mcp instancia el kit
  · `e2e:arg-mcp` verde
  · `test:arg-player-mcp` verde
- Demolición:
  · lo genérico duplicado en arg-player-mcp

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md § layout engine/player-mcp-kit + §4 deps
- plan/DECISIONES.md D-2 y D-8 (dos juegos; engine sin nombres de juego)
- packages/lib/protocol (U10 ✅) — makeIntent / validateIntent / roles
- packages/arg/arg-player-mcp (fuente a generalizar)
- PRACTICAS §1.1 (puertos vía presets-sdk/env; MCP catalogs)

Notas del orquestador:
- Lote 1b paralelo con WP-U11. NO implementar U11 ni U13.
- U13 (@zeus/playbook-kit) dep U12 — NO empezar U13 en este chat.
- Merge preferido: U11 y U12 independientes; tras U12 aceptado el
  orquestador asignará U13.
- Hallazgo U10 (contexto; cableo principal en U11): wire `arg:*` vs
  kinds canónicos y Peer Card handshake — U12 consume @zeus/protocol
  sin canonizar nombres de juego; si el MCP asume kinds/wire, alinear
  con lo que exponga protocol + lo que U11 decida, sin bloquear a U11.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo puede consumir
  @zeus/player-mcp-kit tal cual?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
