# Brief — WP-U115 · Schema story-board real (AJV en kit)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: triaje vigilante registro 2026-07-18 · H1 U86 · U114 ✅.
**Solo U115** — no micros U93 / STOP_SERVICES; no diferidos U87 §5–6
(siguen sin GO usuario).

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U115 · Schema story-board real (no solo existsSync)
Rama: wp/u115-schema-story-board-ajv
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u115-schema-story-board-ajv
Reporte: plan/REPORTES/WP-U115-schema-story-board-ajv.md

Library (alcance principal): sibling ../Z_SDK-games-library
  Rama: wp/u115-schema-story-board-ajv
  Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u115-schema-story-board-ajv

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U115-schema-story-board-ajv.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits en rama WP zeus (reporte + punteros docs si aplica) + push OK.
- SÍ permitido: commits + push rama WP en Z_SDK-games-library
  (kit carpeta-dramaturgo vive allí).
- NO merge a main (zeus ni library) — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main (no master).
- NO tocar editor-ui / STORY_BOARD_DIALECTS (eso es U114 ✅).
- NO inventar micros U93 / STOP_SERVICES ni diferidos U87 §5–6.
- NO editar plan/BACKLOG.md.

WP completo (de plan/BACKLOG.md) — vigilante; deps U86 ✅ · U114 ✅:
- En validate-story-board.mjs el JSON Schema se cita
  (existsSync(SCHEMA_PATH)) pero la validación real es a mano
  (validateStoryBoard); riesgo de drift schema↔código.
- Cablear validador al schema (AJV u equivalente ya en
  monorepo/library — p.ej. patrón linea-kit / dep ajv) como fuente
  de verdad.
- Dialectos/fixtures SOLVE+ALEPH+juguete siguen pasando.
- Test: board sintético inválido → rechazo explicable.
- CA:
  · validate-story-board carga y aplica el schema (no solo exists);
  · fixtures/dialectos verdes;
  · board sintético inválido → rechazo claro;
  · README kit veraz (schema = contrato, no decoración).
- Demolición: comentario/camino «touch schema so CA can cite it
  exists» como único uso del schema; reglas a mano que el schema ya
  cubra (sin duplicar — PRACTICAS §1.4).
  Semántica que JSON Schema no expresa (p.ej. block.act → act id
  conocido) puede quedar como post-check — documentar en reporte.

Alcance orientativo:
- Library: kits/carpeta-dramaturgo/scripts/validate-story-board.mjs
  · schema/ (solo si hace falta alinear) · test/run.mjs · README kit
  · package.json library (dep ajv explícita si no reutilizas transitiva
  documentada).
- Zeus: reporte (+ puntero docs solo si hace falta).
- NO packages/editor/editor-ui (U114).
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Schema/validador son del kit mundo A (library), no de engine.
- No meter nombres exclusivos delta/pozo en engine.
- Pregunta en reporte: ¿un tercer dialecto (nuevo $defs + oneOf)
  se valida sin reescribir reglas a mano?

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U86-carpeta-dramaturgo.md (H1 schema decorativo)
- plan/REPORTES/WP-U114-dialectos-story-board-editor.md (no solapar)
- packages/engine/linea-kit/src/validate.mjs (patrón AJV 2020)
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/scripts/validate-story-board.mjs
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/schema/story-board.schema.json
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/{README,test,fixtures}/

Notas del orquestador:
- Solo U115; tip main ~2834913 (post chore acepta U114).
- Frentes distintos: U114 = registro dialectos editor; U115 = schema
  as truth en kit. No reescribir editor-ui.
- Preferir reutilizar AJV ya en árbol (linea-kit dep / add ajv en
  library root) — no inventar validador propio.
- Worktree zeus + library listos al asignar.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
