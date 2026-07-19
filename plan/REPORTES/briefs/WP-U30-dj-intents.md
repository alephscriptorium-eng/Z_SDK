# Brief — WP-U30 · Intents del manipulador de líneas

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U30 · Intents del manipulador de líneas
Rama: wp/u30-dj-intents
Worktree: .worktrees/wp-u30-dj-intents
Reporte: plan/REPORTES/WP-U30-dj-intents.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U30-dj-intents.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Dep U10 ✅. El dominio del juego gana los intents del DJ con rol `dj`:
  `cache` (cachear línea), `curate`, `milestone` — hermanos de `label:cast`
  y `excavate`, con ledger y scoring.
- Diseño previo corto en el spec del juego delta (qué muta cada uno, tabla
  reducer, presupuesto snapshot) ANTES de cablear el reducer.
- CA:
  · tests de reducer válidos/inválidos por rol
  · entradas de ledger con evidencia
  · casos nuevos redactados en CASOS.md (formato playbook-kit)
- Demolición: n/a (adición al dominio).

Regla de los dos juegos (PRACTICAS §1.11) — obligatoria:
- Donde el cambio toque engine (`packages/lib/*` / `@zeus/*` kits): delta Y
  pozo deben quedar verdes (`test:arg` / e2e delta + suites pozo que apliquen;
  `gates` verde).
- Este WP es adición de dominio DJ en **delta** (`packages/arg/arg-domain` +
  spec). Pozo puede no necesitar intents DJ: si no aplica, documentarlo
  honestamente en el reporte (por qué pozo no gana `cache`/`curate`/
  `milestone` y qué se verificó para no romperlo). No forzar simetría falsa.
- Cero nombres de juego en engine; el `game` lo inyecta el caller.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- packages/arg/arg-domain/src/contract.mjs (INTENT_DEFS; comentario U30+ dj)
- packages/arg/arg-domain (reducer / applyIntent; patrón label:cast + excavate)
- packages/arg/spec/CONTRATO.md, LORE.md, CASOS.md (diseño + casos nuevos)
- packages/lib/protocol (roles `player|dj|operator`, assertIntentRole)
- packages/games/pozo (segundo juego — verificar no romper; no exigir DJ)
- Cola hallazgos U10/U11: dual-wire / Peer Card — NO mezclar; no es U30
- U31/U32 NO se toman en este chat (deps U30+U11 / U31)
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Ola 3 inicio. Solo U30 asignado. U31 (dep U30+U11) y U32 (dep U31)
  quedan ⬜ — no implementar player-ui ni operator-ui aquí.
- Alcance: dominio + spec + tests + CASOS. No cablear player-ui decks
  (eso es U31).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿delta y pozo verdes donde aplique?
  Si pozo no necesita intents DJ, ¿quedó documentado y sin regresión?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
