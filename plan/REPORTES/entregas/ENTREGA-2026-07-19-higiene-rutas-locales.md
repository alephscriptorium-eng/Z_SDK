# ENTREGA — higiene rutas absolutas locales (2026-07-19)

Nota externa recibida (temp-review, 2026-07-19). Archivada aquí para
citar por ruta **interna** del repo (no rutas de máquina local).

**Adenda vigía (pre-✅ U140):** esta entrega entra en el alcance del scrub;
su ejemplo de patrón va **neutro** (sin nombre de repo). El CA por clase
se corre **sin eximir** este fichero. Las notas de scrub no citan
literalmente aquello que mandan borrar.

---

## §Nota — Higiene · rutas absolutas de máquina local en el plan público

El repo es público y `plan/` cita rutas absolutas de una máquina de
desarrollo (formato pedagógico redactado: `C:` + `\Users\...\<externo>\...`
y similares — **sin nombre de repo**; escrito partido para no auto-fallar
el grep de clase) como procedencia de notas externas recibidas. Es deuda
de portabilidad y de privacidad: rutas de un disco ajeno al repo no son
resolubles por ningún lector y exponen estructura local.

Ficheros afectados (grep de hoy sobre main):
`plan/BACKLOG.md` (líneas ~181, ~203) · `plan/DECISIONES.md` (~331) ·
`plan/BACKLOG-HISTORICO.md` (~1237, ~1353) ·
`plan/REPORTES/briefs/WP-U108-volumes-gitignore.md` ·
`plan/REPORTES/briefs/WP-U138-api-nav-spa.md` ·
`plan/REPORTES/briefs/WP-U139-api-nav-cuerpo.md` ·
`plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-INDICE.md` ·
`plan/REPORTES/temp-review-2026-07-17.md` ·
**esta misma entrega** (`plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md`).

**WP propuesto (micro):** sustituir cada cita de ruta local por la
referencia neutral «nota externa recibida (temp-review, &lt;fecha&gt;)»
— conservando el texto de la nota si está pegado.
**CA (por clase, no por instancia):** grep en todo el repo de rutas
absolutas locales = 0 — patrones (1) letra de unidad pegada a Users con
barra invertida; (2) prefijo Git-Bash `/c/` pegado a Users — needles solo
en el comando de verificación, no en prosa del plan. **Sin eximir este
fichero.** Los listados limpios.
**Guía a futuro:** las notas externas se archivan pegadas en
`plan/REPORTES/` propias del repo y se citan por su ruta INTERNA.
Notas de scrub: no citar literalmente aquello que mandan borrar.

Prioridad sugerida: antes del próximo push a main (el repo es público;
cada push re-sirve la deuda).
