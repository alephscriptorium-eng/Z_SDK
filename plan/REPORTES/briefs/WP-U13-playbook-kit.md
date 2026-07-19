# Brief — WP-U13 · `@zeus/playbook-kit`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U13 · @zeus/playbook-kit
Rama: wp/u13-playbook-kit
Worktree: .worktrees/wp-u13-playbook-kit
Reporte: plan/REPORTES/WP-U13-playbook-kit.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U13-playbook-kit.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- El método CASOS como producto en `@zeus/playbook-kit`:
  · formato de caso (precondición / pasos MCP / observación humana /
    criterio / errores)
  · test de coherencia (generalizar `arg-player-mcp/test/casos.test.mjs`)
  · plantilla de acta (generalizar `packages/arg/spec/VALIDACION.md`)
  · runner e2e que ejecuta la **mitad MCP-verificable** de los casos de un
    playbook contra una demo levantada (la mitad visual sigue siendo humana,
    por diseño G-ARG.1)
- CA:
  · `packages/arg/spec/CASOS.md` pasa el test de coherencia del kit
  · el runner ejecuta C-01 / C-03 / C-04b / C-05 contra `demo:arg` y produce
    un acta pre-rellenada con la evidencia MCP
- Demolición:
  · el test de coherencia local de arg si queda subsumido
    (`packages/arg/arg-player-mcp/test/casos.test.mjs` y helpers locales
    que el kit absorba)

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md § layout engine/playbook-kit + §4 deps
- plan/DECISIONES.md D-2 y D-8 (dos juegos; engine sin nombres de juego)
- plan/VISION.md (método CASOS / acta)
- packages/lib/player-mcp-kit (U12 ✅) — `casos-md.mjs` (listCasoIds /
  extractCaso); coordinar absorción o re-export desde playbook-kit
  (hallazgo cola U12)
- packages/arg/spec/CASOS.md + packages/arg/spec/VALIDACION.md
- packages/arg/arg-player-mcp/test/casos.test.mjs + src/casos.mjs
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Lote 1c (solo U13). Dep U12 ✅ — NO implementar U20 ni otros WPs.
- Ubicación provisional: `packages/lib/playbook-kit` (layout engine/ llega
  en WP-U51).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e/runner del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación
  humana explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo puede consumir
  @zeus/playbook-kit tal cual?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
