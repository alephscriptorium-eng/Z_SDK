# Brief — WP-U117 · Schema story-board único en zeus

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: vigilante post-U115 · deps U115 ✅ · U114 ✅.
**Solo U117** — no U116 (view-kit alias; paralelo en otro worktree).

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U117 · Schema story-board único en zeus (post-U115)
Rama: wp/u117-story-board-schema
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u117-story-board-schema
Reporte: plan/REPORTES/WP-U117-story-board-schema.md

Library (alcance): sibling ../Z_SDK-games-library
  Rama: wp/u117-story-board-schema
  Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u117-story-board-schema

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U117-story-board-schema.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits en rama WP zeus (paquete + editor + reporte) + push OK.
- SÍ permitido: commits + push rama WP en Z_SDK-games-library
  (kit carpeta-dramaturgo: import + demoler schema local).
- NO merge a main (zeus ni library) — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main (no master).
- NO tocar view-kit / cast-table / panel-elenco (eso es U116, paralelo).
- NO inventar micros U93 / STOP_SERVICES ni diferidos U87 §5–6.
- NO editar plan/BACKLOG.md.

WP completo (de plan/BACKLOG.md) — vigilante; deps U115 ✅ · U114 ✅:
- U115 dejó AJV+schema en library; editor sigue con validación a mano
  (ACT_ID / WIDGET_ID + validateSolveShape / validateAlephBlocks).
- Dos fuentes de verdad — PRACTICAS §1.4.
- Dirección deps: library → zeus. Schema vive en zeus.
- Paquete: @zeus/story-board-schema en packages/engine/story-board-schema
  (schema JSON + export patrón linea-kit/schemas/* + helper validate AJV;
  changeset).
- Library importa y demuele copia local.
- Editor valida forma contra el mismo schema; STORY_BOARD_DIALECTS
  (ids/labels/resolve/detect) permanece — solo demuele validación a mano.
- Post-check semántico blocks[].act → act id: en el helper del paquete
  o script kit; no reintroducir regex de forma en editor.
- CA:
  1. Un solo story-board.schema.json en zeus+library (library: 0 copia).
  2. rg ACT_ID packages/editor/editor-ui → 0.
  3. Tests library (test:carpeta-dramaturgo) + editor (world-draft) verdes.
  4. README paquete + kit + editor: contrato único @zeus/story-board-schema.
- Demolición:
  · kits/carpeta-dramaturgo/schema/story-board.schema.json
  · editor: ACT_ID, WIDGET_ID, validateSolveShape, validateAlephBlocks

Alcance orientativo:
- Zeus: packages/engine/story-board-schema (nuevo) + changeset
  · packages/editor/editor-ui (dep + dialects → AJV)
  · README editor + reporte
- Library: validate-story-board.mjs importa paquete; demuele schema/
  · package.json dep file:.deps/.../story-board-schema
  · test/run.mjs + README kit
- NO packages/engine/view-kit (U116).
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Schema/validador son contrato narrativo genérico (acts/widgets), no
  nombran delta/pozo/solve en engine.
- Pregunta en reporte: ¿pozo (u otro juego narrativo) puede consumir
  @zeus/story-board-schema tal cual?

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U115-schema-story-board-ajv.md
- plan/REPORTES/WP-U114-dialectos-story-board-editor.md
- packages/engine/linea-kit/{package.json,src/validate.mjs,schemas/}
- packages/editor/editor-ui/src/world/story-board-dialects.mjs
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/{schema,scripts,test,README}/

Notas del orquestador:
- Paralelo con U116 (view-kit). No pisar wp/u116-* ni view-kit.
- Tip main ~183b4b7 (post U116 🔶); re-fetch/rebase si U116 toca BACKLOG
  en main otra vez (tú no editas BACKLOG).
- Preferir contenido schema = el de U115 (mover, no reinventar).
- Worktree zeus + library listos al asignar.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
