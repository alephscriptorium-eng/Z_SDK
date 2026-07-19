# Sprint 2 — paquete para el orquestador

Entregar: esta nota + el fichero `01-PAQUETE-CAPA.md` de la capa editorial
(pasarlo tal cual — ya está en idioma de zeus, anclas verificadas por el
vigía contra los ficheros actuales el 19-jul).

---

> **Sprint 2 — lote**
>
> **(A) Capa editorial W-A ∥ W-B** (paquete adjunto, aplicación VERBATIM —
> el worker no redacta; conflicto texto↔repo = reporte). W-A: 1 fichero
> (hero zeus/docs). W-B: 5 ficheros library/docs (hero+features, ficha nueva
> solve-coagula — su startpack ESTÁ released, corrección factual válida —,
> futuros→call4makers, capa en delta/pozo). CAs al pie del paquete.
> **Sustituye y archiva el micro pendiente «hero en positivo»** (misma zona,
> decisión «lema fuera» ya incorporada).
>
> **(B) Higiene (4 micros, paralelizables con A):**
> 1. `release-startpack.yml` (library) tiene **YAML inválido desde su
>    creación** (prosa sin `#` en cabecera; el workflow jamás parseó — las
>    releases las hizo el script del Notario, por eso no se notó). Arreglar
>    o demoler si el script es la vía canónica. **CA:** parser YAML pasa; o
>    fichero demolido con nota.
> 2. Higiene worktrees library: retirar worktree `u107-review` (detached,
>    obsoleto) y 2 dirs huérfanos (`wp-u121-*`, `wp-u123-*`).
>    **CA:** `git worktree list` = solo main; `.worktrees/` limpio.
> 3. Juegos declaran deps `@zeus/*: "*"` — lockfile pinea pero el rango es
>    laxo. Fijar a semver real (caret de las publicadas).
>    **CA:** cero `"*"` en deps @zeus de packages/ de la library.
> 4. URL `zeus-sdk` vs `Z_SDK` en `docs/guide/estado.md` (cola U120).
>    **CA:** links del portal apuntan al repo real.
>
> **(C) Plantilla de sprint (gobernanza, sin código):** formalizar en
> `plan/PRACTICAS.md` o roles/ el ciclo ya probado: entrada = lote con GO
> explícito; ejecución = WPs con CA (Devuelto legítimo); **cierre = estado
> declarado siempre** («IDLE sin pendientes» o «esperando: <tick> de
> <quién>» — nunca silencio); retro = hallazgos nuevos al registro de
> residuales, no a colas por WP. **CA:** el texto existe y el cierre de este
> mismo sprint lo estrena.
>
> **(D) El sistema de regeneración de la web, documentado junto a docs.**
> La maquinaria existe (VitePress en `docs/`, workflow `docs.yml` con
> trigger por `paths: docs/**` + `workflow_dispatch`, GitHub Pages con
> dominio custom y HTTPS forzado, catálogo de la library alimentado por
> GitHub Releases) pero no hay página que la cuente: editarla hoy exige
> arqueología. **WP-D:** página `docs/guide/publicar-la-web.md` (o
> equivalente) en zeus que documente el ciclo completo: editar (`docs/`),
> previsualizar en local (`docs:dev`), construir (`docs:build`), publicar
> (push a `docs/**` → Actions → Pages; o `workflow_dispatch` manual),
> dominios (custom domain + CNAME del gestor DNS + Enforce HTTPS), y cómo el
> catálogo de la library se auto-alimenta de Releases (añadir un juego =
> ficha + card, sin tocar el pipeline). Puntero corto equivalente en la
> library. Estilo post-U120: sin refs WP/D-## (es doctrina operativa, no
> estado).
> **CA:** la página existe en el portal publicado; cada comando citado corre
> tal cual; lo descrito calza con los workflows reales (sin pasos
> inventados — spot-check contra `docs.yml`); la library enlaza o replica en
> corto.
>
> Orden: A y B en paralelo; C al cierre como acta del propio sprint; D cabe
> con A (misma zona docs) o tras ella.

---

Observación editorial para el custodio (no va a zeus; arbitrar si se desea
antes de entregar): registro inconsistente en la capa — voseo en la card
call4makers («Entrá y arrancá») vs tuteo en fichas («Llévatela»).
