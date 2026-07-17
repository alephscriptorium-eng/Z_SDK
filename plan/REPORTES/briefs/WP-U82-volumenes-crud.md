# Brief — WP-U82 · CRUD de volúmenes: medir y vaciar

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U82 · CRUD de volúmenes: medir y vaciar
Rama: wp/u82-volumenes-crud
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u82-volumenes-crud
Reporte: plan/REPORTES/WP-U82-volumenes-crud.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U82-volumenes-crud.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 7; lote-7a; dep U80 ✅; encaja con
ola 4 (patrón U40); paralelo con U81 y U91 (otros worktrees):
- Capa de operación sobre volumes.json / DISKs, files-first.
- Medición: tamaño por volumen / corpus / línea.
- Vaciado con roles (DATOS.md §4):
  · operator = purga dura con asiento en ledger
  · player/dj = vaciado jugable vía intent (no bypass)
- Expuesto REST + MCP resource desde una definición (patrón WP-U40).
- Nada toca disco sin pasar por autoridad (intents) u operación con
  ledger.
- CA:
  · e2e — llenar corpus sintético → medir por resource → vaciar con rol
    operator (asiento ledger + archivos fuera) → rechazo del mismo
    vaciado con rol player; volumes.json refleja contadores
- Demolición: scripts sueltos de limpieza si los hubiera (auditar).

Alcance orientativo:
- Capa nueva (engine/mesh según ARQUITECTURA) que consume schemas
  volumes.json de `@zeus/linea-kit` — no reescribir el kit ni las tools
  U81 ni el loader FORCES U91.
- Proyección REST→MCP al estilo U40 (http-contract / projector).
- Corpus sintético de prueba bajo VOLUMES o fixture aislado; no purgar
  DISK_01/02/03 reales del operador.
- Worktrees: `ZEUS_VOLUMES_ROOT=<repo-principal>/VOLUMES` si necesitas
  DISKs del árbol master (gitignored no se heredan). DISK_03 gitignore
  vs D-19 = hallazgo U80; no es el foco de este WP.
- NO U83 (tramas delta/pozo crecer/vaciar) — solo la capa de operación.
  NO U81 tools de segmentación. NO U91/U92.

Regla de los dos juegos (PRACTICAS §1.11):
- Si el código es engine: cero nombres de juego. Roles genéricos
  operator/player/dj. Juegos consumen en U83, no aquí.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §4 (roles / vaciado) y §5 (layout VOLUMES)
- plan/REPORTES/WP-U80-linea-kit.md + packages/engine/linea-kit/
  (volumes.json schema)
- plan/REPORTES/WP-U40-route-mcp.md (patrón REST→MCP)
- packages/engine/http-contract / authority-kit (intents + ledger)
- VOLUMES/volumes.json (si existe vía ZEUS_VOLUMES_ROOT)

Notas del orquestador:
- Lote-7a paralelo: U82 = medir/vaciar + REST/MCP; U81 = segmentar;
  U91 = force:// loader. Conflicto bajo si no tocas linea-kit tools ni
  el paquete MCP FORCES.
- Pregunta obligatoria (CA): ¿e2e medir + vaciar operator OK + rechazo
  player? ¿ledger asienta? ¿volumes.json contadores? Evidencia literal.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
