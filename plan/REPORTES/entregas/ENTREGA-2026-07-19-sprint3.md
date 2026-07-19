# ENTREGA — Sprint 3 / I50 (2026-07-19)

Nota externa recibida (temp-review, 2026-07-19 · GO I50 / D-33).
Archivada aquí para citar por ruta **interna** del repo.

Solo el bloque §Nota entregable. Material de triaje interno de la estación
externa **no** se archiva aquí.

---

## §Nota — Sprint 3 (micro) — dos ítems de robustez del pipeline de docs + un recurso del registry

> Triaje previo hecho sobre vuestros main: la mayoría de la deuda de
> pipeline detectada en su día ya está resuelta (guard de base, dist
> fuera del índice, gap de paths documentado, economía de CI con
> paths-ignore y concurrency). Quedan dos cosas pequeñas:
>
> | # | Ítem | Propuesta | CA |
> |---|---|---|---|
> | 1 | El dominio custom vive solo en Settings→Pages (el repo del portal tiene `docs/public/` vacío; el del catálogo ni lo tiene). Si Pages se reconfigura, el dominio se pierde en silencio. | Commitear `docs/public/CNAME` con el dominio de cada portal (el build de Pages lo recoge del artifact). | `git ls-files docs/public/CNAME` devuelve el fichero en ambos repos; tras el siguiente deploy, el custom domain persiste (Settings lo refleja). |
> | 2 | El docs.yml del catálogo usa `npm install` (comentado «deps desde registry») mientras el del portal usa `npm ci`. | Consulta, no imposición: `npm ci` también resuelve del registry vía lockfile+`.npmrc`; si el motivo era otro, documentarlo en el propio yml. | O bien `npm ci` en ambos con build verde, o comentario en el yml explicando por qué no. |
>
> **Recurso disponible en vuestro registry** (opcional, cero compromiso):
> `@alephscript/skills-scriptorium@0.2.0` — paquete público con método de
> orquestación de swarms por WP/CA, generación de sites con Pages, y
> protocolo de revisión externa; incluye checklist de cierre de ola y
> reglas de higiene (worktrees, ramas, evidencia). `npm view
> @alephscript/skills-scriptorium --registry=https://npm.scriptorium.escrivivir.co`
> para verlo. Si algo os sirve, es adoptable por partes; si no, nada.
>
> Esta nota es propuesta, no decreto. Prioridad baja (nada roto hoy).
