# Brief — WP-U132 · Correctivo W-B′ (verdad de canales · CAPA rev2)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: **AMEND Sprint 2** · bloque **A** · **D-26** (ampara D-25).
Repo principal: `Z_SDK-games-library`. **Paralelo con U133 ∥ U134.**

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U132 · Aplicar CAPA rev2 verbatim (6 ficheros library/docs)
Rama zeus: wp/u132-wb-prime-canales
Worktree zeus: .worktrees/wp-u132-wb-prime-canales
Rama library: wp/u132-wb-prime-canales
Worktree library: (library)/.worktrees/wp-u132-wb-prime-canales
Reporte: plan/REPORTES/WP-U132-wb-prime-canales.md (en zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero (zeus).
Reporte desde plan/REPORTES/PLANTILLA.md (zeus).
Commits convencionales en ambos repos según toque.
NO mezclar con U133 / U134.
NO tocar packages/* de producto.

Política:
- Commits + push OK en ramas WP (library docs + zeus reporte).
- NO merge a main.
- Verbatim CAPA rev2 o reporte. Worker no redacta.
- Anclas ANTES literales del paquete.

Paths:
- Library: (library)
- Zeus (reporte): (zeus-sdk)

Fuente de verdad (leer ENTERO — rutas ABSOLUTAS; NO están en plan/):
- `nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/00-NOTA)
- `nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA)  (rev2)

Hecho de canal: @zeus/startpack-* NO existen en registry npm (404).
Canal operativo = tarball del GitHub Release.

Alcance (paquete §1–§4 · exactamente 6 ficheros):
1–3. docs/games/delta.md, pozo.md, solve-coagula.md — bloque «Llévatela»
   → tarball Release (línea-sello final intocada)
4. docs/releases.md — (2a) borrar tabla «Juegos con canal…» → link Releases;
   (2b) «### Futuros (SOLVE, …)» → «### Otros títulos»;
   (2c) reformular «### Registry npm (@zeus)» doctrinal + estado → Futuros
5. docs/startpacks.md — dos canales (Release operativo; npm → Futuros)
6. docs/.vitepress/config.mjs — nav + sidebar Juegos: SOLVE ET COAGULA tras pozo

CA (paquete §Verificación · C8/C9):
1. docs:build verde (library)
2. C8: grep `npm install @zeus/startpack` en docs/ = 0 fuera de § Registry
   doctrinal 2c (no copiable-directo)
3. C9: cero tabla manual juegos/versiones en releases.md; verdad = link Releases
4. Nav/sidebar muestran solve-coagula; git diff --stat = exactamente esos 6
5. futuros.md sigue siendo la única página con estado publish npm

Demolición: comandos npm-por-nombre como canal operativo + tabla manual
releases + título de sección Futuros(SOLVE) obsoleto.

Empieza: sitúate en worktrees, lee PRACTICAS + paquete rev2 entero, aplica
verbatim, verifica CA, reporta.
```
