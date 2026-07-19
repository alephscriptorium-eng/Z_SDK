# Brief — WP-U91 · Loader MCP del volumen FORCES

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U91 · Loader MCP del volumen FORCES
Rama: wp/u91-forces-loader
Worktree: .worktrees/wp-u91-forces-loader
Reporte: plan/REPORTES/WP-U91-forces-loader.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U91-forces-loader.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 7; lote-7a; dep U80 ✅; D-19;
paralelo con U81 y U82 (otros worktrees):
- El volumen YA EXISTE: `VOLUMES/DISK_03/FORCES` (12 corpus, 68 escenas,
  registry.json, volumes.json; formato v0 en README).
- (a) schemas force/cota de U80 validan DISK_03 sin tocarlo.
- (b) MCP loader read-only hermano de linea-system:
  · `force://{id}`
  · `force://{id}/scene/…`
  · registry y cotas como resources
  · refs `linea:*` no montadas = pendiente, no error
- CA:
  · e2e — volumen valida contra U80; resource de escena ancla + registry
    con `session_budget` se leen por MCP; el loader no nombra ninguna
    force concreta en código (gate)
- Demolición: n/a (corpus fuente en network-engine = provenance; zeus
  no depende de él).

Alcance orientativo:
- Nuevo paquete mesh (hermano de linea-system / linea-firehose), p.ej.
  force-system o nombre alineado a ARQUITECTURA — consume
  `@zeus/linea-kit` (schemas + loader force/cota), no reimplementa
  validación.
- Read-only MCP; NO intents `force:activate` (eso es U92).
- NO tocar tools de segmentación (U81) ni CRUD medir/vaciar (U82).
- VOLUMES / worktrees (duro):
  · Worktrees NO heredan DISK gitignored del árbol principal.
  · Usar `ZEUS_VOLUMES_ROOT=VOLUMES`
    (o symlink local no commiteado) para apuntar a DISK_03 del master.
  · Hallazgo U80: `.gitignore` ignora `VOLUMES/*` sin
    `!VOLUMES/DISK_03/**` pese a D-19 — no es CA de este WP arreglar
    gitignore; si DISK_03 no está en el worktree, ZEUS_VOLUMES_ROOT o
    fixtures del kit para CI. Documentar en el reporte qué camino usaste.
  · No mutar el corpus DISK_03 (valida sin tocarlo).

Regla de los dos juegos (PRACTICAS §1.11):
- Loader = engine/mesh genérico: cero forces concretas hardcodeadas
  (`force-a`, `sima`, … solo como datos en VOLUMES/fixtures). Gate.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §8 (forces/cotas)
- plan/DECISIONES.md D-19
- plan/REPORTES/WP-U80-linea-kit.md (schemas + ZEUS_VOLUMES_ROOT)
- packages/engine/linea-kit/ (force/cota schemas)
- packages/mesh/linea-system/ (patrón MCP loader hermano)
- VOLUMES/DISK_03/FORCES/ (+ README, IMPORT_NOTES.md, registry.json)

Notas del orquestador:
- Lote-7a paralelo: U91 = MCP force://; U81 = tools segmentar; U82 =
  medir/vaciar. No pisar linea-kit tools ni capa CRUD volúmenes.
- NO U92 (intents activate/deactivate) — solo lectura MCP.
- Pregunta obligatoria (CA): ¿DISK_03 (o fixture) valida U80? ¿MCP
  escena ancla + registry session_budget? ¿grep sin forces concretas
  en código del loader? Evidencia literal.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
