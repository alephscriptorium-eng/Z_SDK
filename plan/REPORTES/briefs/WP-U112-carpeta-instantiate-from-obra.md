# Brief — WP-U112 · Carpeta dramaturgo: instantiate desde obra

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: U87 §3 · frente editor GO · U111 ✅.
**Solo U112** — no U113–U115; no diferidos U87 §5–6; no micros GO vigilante.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U112 · Carpeta dramaturgo: instantiate desde obra
Rama: wp/u112-carpeta-instantiate-from-obra
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u112-carpeta-instantiate-from-obra
Reporte: plan/REPORTES/WP-U112-carpeta-instantiate-from-obra.md

Library (alcance principal): sibling ../Z_SDK-games-library
  Rama: wp/u112-carpeta-instantiate-from-obra
  Worktree: ../Z_SDK-games-library/.worktrees/wp-u112-carpeta-instantiate-from-obra

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U112-carpeta-instantiate-from-obra.md.
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
- NO tocar U113–U115 ni diferidos U87 §5–6.
- NO editar plan/BACKLOG.md.
- NO modificar originales en scriptorium-network-games/.

WP completo (de plan/BACKLOG.md) — post-U87; deps U86 ✅ · U111 ✅:
- `instantiate` hoy solo rellena plantilla vacía; falta
  `--from <obra>` (slug documentado o path) que copie dramaturgia real
  (story-board + blockchain/uichain/cadenas relevantes) a
  `instances/<slug>/` sin tocar originales.
- Fuentes documentadas: SOLVE_ET_COAGULA, ALEPH_ET_OMEGA (y path
  arbitrario a obra con la misma forma).
- Tabla/map de fuentes (PRACTICAS §1.2) — no if-creciente; ambas vías
  (plantilla vacía + from obra) sin duplicar lógica de escritura.
- CA:
  · `instantiate … --from <obra>` produce instancia con story-board/
    actos coherentes con la obra; schema U86 valida;
  · originales intactos (`git status` limpio en fuente);
  · test de kit + docs starterkit (README kit / library).
- Demolición: «solo plantilla vacía» como única vía → documentar ambas
  vías vía tabla de fuentes (no segundo script paralelo).

Alcance orientativo:
- Library: kits/carpeta-dramaturgo/scripts/instantiate.mjs (+ helpers
  si hace falta) · test/ · README kit · README library / docs si mienten.
- Zeus: reporte (+ puntero docs solo si hace falta).
- NO U113 (widgets runtime). NO U114 (dialectos editor). NO U115
  (schema AJV). NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- El kit NO mete nombres exclusivos delta/pozo en engine. Slugs de obra
  fuente (SOLVE/ALEPH) son datos de autoría mundo A, no conceptos de
  engine. Pregunta en reporte: ¿una obra nueva con la misma forma de
  carpetas puede usarse vía --from path sin tocar el kit?

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U86-carpeta-dramaturgo.md
- plan/REPORTES/WP-U111-editor-materialize-narrativo.md (contexto frente)
- plan/DATOS.md §6
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/scripts/instantiate.mjs
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/scripts/validate-story-board.mjs
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/{README,fixtures,plantilla}/
- ../scriptorium-network-games/{SOLVE_ET_COAGULA,ALEPH_ET_OMEGA}/ (solo lectura)

Notas del orquestador:
- Solo U112. Worktree zeus + library desde main fresco (post-U111).
- Preferir overlay: plantilla base + overlay desde obra (o fuente
  «plantilla» vs «obra» en tabla) — una sola función de escritura a
  instances/.
- Story-board: normalizar nombre destino a readerapp/story-board.json
  (fuentes usan *-story-board.json).
- Evidencia CA: validate instancia + git status limpio en
  scriptorium-network-games.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
