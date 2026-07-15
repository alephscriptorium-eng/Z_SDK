# Brief para lanzar worker

_Plantilla que rellena el **orquestador** (tras marcar 🔶 en BACKLOG) y el
usuario pega en un **chat nuevo** junto con el prompt de rol
`plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U?? · <título del WP>
Rama: wp/u??-<slug>
Worktree: ../zeus-wp-u??   (solo si hay workers en paralelo)
Reporte: plan/REPORTES/WP-U??-<slug>.md

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §…
- (archivos de código concretos que el orquestador ya identificó)

Notas del orquestador:
- (conflictos esperados con otros WPs en vuelo, orden de merge, excepciones…)

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```

---

## Ejemplo — Ola 0

### WP-U00

```text
(rol) plan/roles/WORKER.md

WP: WP-U00 · Gates de prácticas
Rama: wp/u00-gates
Worktree: ../zeus-wp-u00
Reporte: plan/REPORTES/WP-U00-gates.md

Lecturas extra:
- plan/ARQUITECTURA.md §4
- packages/arg/arg-console/test/grep-gates.test.mjs (el patrón de referencia)

Notas: merge después de U02 y U01 si hay conflictos en scripts raíz.
```

### WP-U01

```text
(rol) plan/roles/WORKER.md

WP: WP-U01 · Tests que faltan en el núcleo
Rama: wp/u01-core-tests
Worktree: ../zeus-wp-u01
Reporte: plan/REPORTES/WP-U01-core-tests.md

Lecturas extra:
- packages/lib/firehose-core y packages/lib/room-client-browser (API pública)

Notas: la Demolición del WP incluye borrar el `echo 'sin tests'`.
```

### WP-U02

```text
(rol) plan/roles/WORKER.md

WP: WP-U02 · Identidad del juego: delta
Rama: wp/u02-delta-identity
Worktree: ../zeus-wp-u02
Reporte: plan/REPORTES/WP-U02-delta-identity.md

Lecturas extra:
- plan/DECISIONES.md D-8
- packages/arg/spec/*.md, README de arg, arg-console, authority, launch, contract

Notas: solo identidad (CAUDAL→delta); no cambiar rooms/eventos/rutas (ola 5).
Merge preferido: primero entre los de la ola 0.
```
