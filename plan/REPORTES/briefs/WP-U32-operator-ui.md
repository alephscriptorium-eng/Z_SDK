# Brief — WP-U32 · operator-ui = visor de operador

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U32 · operator-ui = visor de operador
Rama: wp/u32-operator-ui
Worktree: .worktrees/wp-u32-operator-ui
Reporte: plan/REPORTES/WP-U32-operator-ui.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U32-operator-ui.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md) — cierra Ola 3:
- Dep U31 ✅. `operator-bridge` se recablea del protocolo sesión al
  contrato único (proyección de slice de `state`); sus emisiones se
  vuelven intents con rol `operator`. operator-ui (Angular) consume el
  bridge nuevo.
- CA:
  · `verify:dual-ui` / `e2e:operator-ui` (adaptados) verdes
  · un intent de operador rechazado para rol `player` (roles e2e)
- Demolición (obligatoria, D-3 / PRACTICAS §1 — cero re-exports compat):
  · el camino `session:*` en operator-bridge y operator-ui
    (p.ej. listeners `session:state`, docs INTEGRATION, stubs
    `local-projection`, servicios ZeusSession* anclados a sesión)
  · Cero wrappers, aliases ni re-exports de compatibilidad hacia el
    protocolo sesión demolido en U31.

Regla de los dos juegos (PRACTICAS §1.11) — obligatoria:
- Donde el cambio toque engine (`packages/lib/*` / `@zeus/*`): delta Y
  pozo verdes donde aplique; `gates` verde.
- Este WP es mesh/vista operator sobre el contrato único. Pozo no gana
  operator-ui: si no aplica, documentarlo honestamente (sin regresión).
  Cero nombres de juego en engine; el `game` lo inyecta el caller.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-2 (contrato único), D-3 (sin vías muertas / sin compat)
- plan/ARQUITECTURA.md §1–3 (dos protocolos → uno; session-* muere ola 3)
- plan/REPORTES/WP-U31-player-ui-dj.md (demolición session-*; stubs
  operator → este WP; e2e legacy SKIPPED dual-ui/operator)
- packages/lib/operator-bridge (session:state → slice; INTEGRATION.md)
- packages/operator-ui (Angular; zeus-session-bridge, local-projection,
  session-hud; package-lock aún referencia session-protocol fantasma)
- packages/lib/protocol + authority-kit (U10/U11 — envelope, roles)
- packages/app/player-ui (patrón dj-transport post-U31 como referencia
  de join room + intents; no copiar decks)
- e2e: `e2e:operator-ui`, `verify:dual-ui` / `e2e:dual-ui` (adaptar)
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Ola 3. Solo U32 asignado. Cierra la ola al aceptar.
- Alcance: operator-bridge → contrato único + intents rol `operator` +
  operator-ui consume el bridge; e2e/CA. No reabrir demolición
  session-protocol/domain/tablero-core (ya U31).
- Cola / NO mezclar: OpenAPI CRLF flake en `test:player-ui` (Windows;
  bytes CRLF vs LF, contenido idéntico normalizado). Vive en cola U31;
  WP cleanup aparte — no “arreglar” spec-sync/openapi en este chat.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿delta y pozo verdes donde
  aplique? ¿quedó algún camino `session:*` en operator-bridge/operator-ui?
  (debe ser cero en código vivo)
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
