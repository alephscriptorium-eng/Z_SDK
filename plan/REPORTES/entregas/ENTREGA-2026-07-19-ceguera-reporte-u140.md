# ENTREGA — ceguera del reporte U140 (2026-07-19)

Nota externa recibida (temp-review, 2026-07-19 · residual post-U140).
Archivada aquí para citar por ruta **interna** del repo.

Fuente vigía (estación externa; no rutas de máquina): acta de re-verificación
post-merge U140 — micro entregable vía custodio. §Lectura de marco / roles
externos **no** se archiva aquí.

---

## §Nota — Enmascarar token de nombre-repo-externo en evidencia U140

El reporte `plan/REPORTES/WP-U140-scrub-rutas-locales.md` cita en claro el
**token objetivo** (nombre de un repo externo usado como needle de scrub)
dentro de su evidencia de grep (líneas tipo «&lt;token&gt;=0»). La
recursión de la regla «las notas de scrub no citan literalmente aquello
que mandan borrar»: el reporte que prueba la ausencia lo reintroduce.

**WP propuesto (micro):** en ese único fichero, sustituir cada mención
literal del token por máscara neutra (p.ej. `<externo>` o
«nombre-repo-externo»). No tocar código de paquetes ni reabrir el scrub
de rutas absolutas (U140 ✅ intacto).

**CA:** grep del token (nombre-repo-externo) = **0** en **todo** el árbol
del repo, **incluido** el propio reporte U140. Tras merge, re-verificación
externa puede cerrar el gate residual asociado.

Prioridad: antes del próximo push que re-sirva el reporte público.
