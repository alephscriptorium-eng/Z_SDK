# Brief — WP-U140 · Scrub rutas absolutas locales en plan/

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-31** · GO **usuario** (GO I5 externo). Nota externa
recibida (temp-review, 2026-07-19) — higiene de portabilidad. Repo:
**zeus-sdk** (solo `plan/` + reportes; sin tocar código de paquetes).

**Adenda vigía (obligatoria · pre-✅):** el alcance incluye
`plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md`.
Neutralizar su ejemplo de patrón a la forma redactada sin nombre de
repo (`C:` + `\Users\...\<externo>\...`, partido). El CA (grep por
clase = 0) se corre **sin eximir** ese fichero. Cero nombres de repo
externos en el árbol.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U140 · Scrub rutas absolutas locales en plan/
Rama: wp/u140-scrub-rutas-locales
Worktree: (opcional; lote no paralelo) ../zeus-wp-u140
Reporte: plan/REPORTES/WP-U140-scrub-rutas-locales.md

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero.
Reporte desde plan/REPORTES/PLANTILLA.md.
Commits convencionales. NO merge a main. NO ✅ BACKLOG.

Fuente (ruta INTERNA; NO inventar rutas de máquina):
plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md
(§Nota + adenda vigía en cabecera — esa es la orden).

Problema:
- El repo es público y plan/ cita rutas absolutas de disco local
  como procedencia de notas externas. Deuda de portabilidad + privacidad.
- La propia entrega archivada es alcance: no puede dejar un ejemplo que
  sea hit de clase ni nombre de repo externo.

Alcance (lista mínima + esta entrega + clase completa):
- plan/BACKLOG.md
- plan/DECISIONES.md
- plan/BACKLOG-HISTORICO.md
- plan/REPORTES/briefs/WP-U108-volumes-gitignore.md
- plan/REPORTES/briefs/WP-U138-api-nav-spa.md
- plan/REPORTES/briefs/WP-U139-api-nav-cuerpo.md
- plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-INDICE.md
- plan/REPORTES/temp-review-2026-07-17.md
- plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md
  ← OBLIGATORIO (adenda vigía); ejemplo de patrón ya neutro / partido;
  CA SIN eximir este fichero
- + TODO hit de clase (p.ej. evidencia literal en
  plan/REPORTES/WP-U122-registry-password-auth.md) — CA es por CLASE,
  no por lista fija.

Fix:
- Sustituir cada cita de ruta local por:
  «nota externa recibida (temp-review, <fecha>)»
  conservando el texto de la nota si ya está pegado en el repo.
- En briefs/DECISIONES/BACKLOG: preferir cita a ruta INTERNA de
  plan/REPORTES/ cuando la nota ya esté archivada.
- Entrega archivada: ejemplo pedagógico = forma redactada sin nombre
  de repo (partido: no contiguedad que auto-falle el grep).
- NO reintroducir rutas absolutas ni nombres de repo externos en
  brief, reporte ni diff.
- Worktree en el reporte: ruta relativa (../zeus-wp-u140), nunca
  absoluta bajo el home del usuario.
- Al documentar el CA en el reporte, NO pegar needles literales;
  citar «patrón (1)/(2) de la §Nota».

CA verificables (needles solo en el comando; SIN eximir la entrega):
1. Grep repo: 0 hits patrón (1) — letra-unidad pegada a Users.
2. Grep repo: 0 hits patrón (2) — prefijo Git-Bash /c/ pegado a Users.
3. Grep repo: 0 hits de nombres de repo externos usados como
   procedencia (si el scrub los tocaba).
4. Los ficheros de la lista (incluida la entrega archivada) limpios.
5. git diff acotado a plan/** (+ reporte). Sin tocar packages/, docs/
   de producto, ni código.

Demolición: rutas absolutas de máquina local y nombres de repo
externos usados como procedencia en el árbol público.

Evidencia CI: tras push, gh run list --branch wp/u140-scrub-rutas-locales
→ run_id/conclusion o N/A (paths-ignore U104 si solo plan/**).
Protocolo Actions U135.

Empieza: rama/worktree, PRACTICAS, scrub (incluida la entrega),
verifica CA (grep clase SIN exenciones), reporta, push rama. NO merge.
```
