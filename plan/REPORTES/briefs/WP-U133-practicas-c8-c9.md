# Brief — WP-U133 · Portar C8/C9 a PRACTICAS

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **AMEND Sprint 2** · bloque **B** · **D-26**. **Paralelo con U132 ∥ U134.**

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U133 · C8 + C9 como criterio estándar de WPs de docs
Rama: wp/u133-practicas-c8-c9
Worktree: .worktrees/wp-u133-practicas-c8-c9
Reporte: plan/REPORTES/WP-U133-practicas-c8-c9.md

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero + plan/roles/ORQUESTADOR.md.

Política:
- Solo gobernanza en plan/PRACTICAS.md (y puntero mínimo en roles/ si hace falta).
- NO tocar library/docs (eso es U132).
- NO archivar ENTREGA-* (eso es U134).
- Commits + push OK. NO merge a main.

Fuente (leer ENTERO — rutas ABSOLUTAS; NO copiar a plan/):
- `nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/00-NOTA)  §(B)
- `nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA)
  (CA que citan C8/C9 — contexto)

Portar a PRACTICAS (criterio de aceptación estándar WPs de docs):
1. **C8**: todo comando copiable se EJECUTA contra su canal antes de
   entregar. «Publicado» es ambiguo: GitHub Release ≠ registry npm ≠
   tarball. Canales gated solo se anuncian en la página de estado.
2. **C9**: lista manual dependiente de eventos futuros = rot en potencia —
   se genera de la fuente, se borra dejando link, o lleva caducidad.
3. Valorar (propuesta en texto, no implementar tooling salvo que quepa
   en prosa): auditoría CANTERA/01 rev1 como práctica periódica o gate
   de docs:build — candidata a PRACTICAS.

CA:
- C8 y C9 aparecen en PRACTICAS como criterio citables por workers
- Texto alineado con 00-NOTA §(B) (sin inventar reglas nuevas)
- Sin tocar ENTREGA-* ni library docs

Demolición: N/A (gobernanza).

Empieza: sitúate en el worktree, lee PRACTICAS + 00-NOTA §(B), porta, reporta.
```
