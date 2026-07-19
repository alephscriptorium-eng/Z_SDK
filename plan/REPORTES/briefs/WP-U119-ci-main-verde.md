# Brief — WP-U119 · CI main verde (4 workspaces)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: Sprint 1 · [ENTREGA-2026-07-18d-sprint1.md](../entregas/ENTREGA-2026-07-18d-sprint1.md) · **D-24**.
**Solo U119** — no prosa (U120/U121), no auth registry (U122), no U55.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U119 · Diagnosticar y dejar CI de main verde
Rama: wp/u119-ci-main-verde
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u119-ci-main-verde
Reporte: plan/REPORTES/WP-U119-ci-main-verde.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U119-ci-main-verde.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits + push OK en rama wp/u119-ci-main-verde.
- NO merge a main — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / tocar secrets / .env con secretos.
- NO U120–U122 (prosa / release auth) en este chat.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main.
- NO editar plan/BACKLOG.md.

WP completo (de plan/BACKLOG.md) — Sprint 1 bloque A; PRIORIDAD:
- Desde ~U116/U117, CI + Release en main fallan (runs
  29656058145 / 29656058148) en:
  · @zeus/http-contract
  · @zeus/linea-system
  · @zeus/firehose-browser
  · @zeus/editor-ui
- Re-smokes locales de esos WP salían verdes → sospecha regresión de
  integración U111–U117 (candidato obvio: @zeus/story-board-schema de
  U117 + consumidores; linea-system ya tuvo dep de entorno en U102) o
  deriva local-vs-runner.
- Diagnosticar cada workspace; dejar main con CI completo verde.
- CA:
  · run de CI completo verde en main (evidence: npm test -w de los 4 +
    quality/gates locales; idealmente apuntar a run verde tras merge —
    o dejar evidencia local + nota ⏳ CI remoto);
  · causa raíz de CADA workspace en el reporte (no solo el fix);
  · si fix = «test no hermético»: patrón U102 (fixture/env explícito /
    skip-⏳) — NUNCA debilitar asserts.
- Demolición: stubs/skips que oculten el fallo sin causa; asserts
  aflojados «para pasar CI»; workarounds sin root cause documentada.

Alcance orientativo:
- packages tocados por los 4 workspaces (+ deps de integración si la
  causa está en story-board-schema / presets / env).
- .github/workflows solo si el fallo es del runner (paths, matrix) —
  preferir arreglar producto/tests.
- NO docs prosa · NO release.yml auth · NO U55.

Regla de los dos juegos (PRACTICAS §1.11):
- Si tocas engine: ambos juegos verdes cuando aplique.
- No meter nombres exclusivos de un juego en engine.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md (bloque A)
- plan/DECISIONES.md D-24
- plan/REPORTES/WP-U102-ci-hermetic.md (patrón tests herméticos)
- plan/REPORTES/WP-U117-story-board-schema.md (candidato integración)
- gh run view 29656058145 / 29656058148 (logs de fallo)
- packages de los 4 workspaces + sus test/

Notas del orquestador:
- Tip main al asignar ~2943885 (post U118) + chore(plan) Sprint 1.
- Worktree ya creado. Empieza por reproducir los 4 fallos (npm test -w).
- Anota root cause por workspace en el reporte aunque el fix sea uno.
- Tras listo-revisión: para; no merges.

Empieza: sitúate en el worktree, lee PRACTICAS entero, luego implementa.
```
