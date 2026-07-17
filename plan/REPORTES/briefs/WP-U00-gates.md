# Brief — WP-U00 · Gates de prácticas

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U00 · Gates de prácticas
Rama: wp/u00-gates
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u00-gates
Reporte: plan/REPORTES/WP-U00-gates.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U00-gates.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

WP completo (de plan/BACKLOG.md):
- Test raíz `npm run gates` estilo `grep-gates` (ARG WP-15):
  (a) puertos/URLs hardcodeados fuera de `presets-sdk/env`, docs y specs;
  (b) nombres de transición (`legacy|v2|-old|-new`) en código;
  (c) imports que violen ARQUITECTURA §4 (cuando exista el layout, empezar
      con: nada importa de `packages/arg/*` salvo arg);
  (d) regla de los dos juegos: paquetes engine (según nazcan en ola 1) no
      contienen nombres/conceptos exclusivos de un juego (`delta`, `pozo`,
      grifo, cantera…). Archivo de excepciones comentado.
- CA: gate rojo con violación sintética de cada tipo; verde en el repo
  actual (o lista de excepciones justificadas para lo preexistente).
- Demolición: n/a.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §4
- packages/arg/arg-console/test/grep-gates.test.mjs (patrón de referencia)
- plan/PRACTICAS.md §1 y §5 (criterio que los gates codifican)

Notas del orquestador:
- Lote 0a paralelo con U01 y U02. Merge: posibles conflictos en scripts raíz /
  package.json con U01 — coordinar vía orquestador si chocan.
- U03 (Z_SDK+CI) va DESPUÉS de U00 (dep blanda); no lo implementes.
- Excepciones preexistentes: justificar en el archivo de excepciones, no
  desactivar el gate.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
