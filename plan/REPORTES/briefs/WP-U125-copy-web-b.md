# Brief — WP-U125 · Copy catálogo + ficha SOLVE (W2)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: Sprint 2 · ENTREGA-19-sprint2 · **D-25**. **Paralelo con U124.**
Repo principal: `Z_SDK-games-library`. Marketing copy — **verbatim**.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U125 · Aplicar copy final library docs (02-COPY-WEB-B)
Rama zeus: wp/u125-copy-web-b
Worktree zeus: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u125-copy-web-b
Rama library: wp/u125-copy-web-b
Worktree library: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u125-copy-web-b
Reporte: plan/REPORTES/WP-U125-copy-web-b.md (en zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero (zeus).
Reporte desde plan/REPORTES/PLANTILLA.md (zeus).
Commits convencionales en ambos repos según toque.
NO mezclar con U124 ni con packages/* de la library.

Política:
- Commits + push OK en ramas WP (library docs + zeus reporte).
- NO merge a main. NO U124 / residuales / DNS.
- NO re-redactar. Verbatim o reporte (regla 4).
- NO tocar docs/releases.md, packages/*, package.json scripts, workflows.
- Títulos de obra (El Común / El Aljibe / SOLVE ET COAGULA) SOLO en docs;
  slugs delta / pozo / solve-coagula intactos.

Paths:
- Library: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library
- Zeus (reporte): c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk

Fuente de verdad del copy (leer ENTERO antes de tocar):
- plan/ENTREGA-2026-07-19-sprint2/00-PAQUETE.md (reglas 1–6)
- plan/ENTREGA-2026-07-19-sprint2/02-COPY-WEB-B.md (7 secciones)
- plan/ENTREGA-2026-07-19-sprint2/03-VERIFICACION.md §comunes + §W2

Alcance (solo lo enumerado en 02):
1. docs/index.md — fichero completo
2–3. docs/games/delta.md + pozo.md — ficha nueva hasta tabla Pieza (cuerpo técnico intacto)
4. docs/games/solve-coagula.md — PÁGINA NUEVA
5. docs/games/futuros.md — marco + fila SOLVE + filas Fundación/Periódico
6. docs/startpacks.md — línea de marco
7. docs/.vitepress/config.mjs — description + nav Juegos + sidebar Juegos

CA (03-VERIFICACION):
- DESPUÉS literal; cuerpos técnicos delta/pozo desde tabla Pieza byte-idénticos
- git diff --stat = ficheros de 02 (+ solve-coagula.md nuevo)
- npm run docs:build OK (library)
- solve-coagula enlazada (portada, nav, sidebar, futuros)
- grep demo:solve-coagula en package.json raíz → existe
- releases.md cero diff; config solo §7
- grep «El Común|El Aljibe» en packages/ → 0

Conflicto: celda Estado de SOLVE en futuros ajustable a verdad viva (nota §5b);
resto sin improvisar.

Demolición: N/A.

Empieza: sitúate en worktrees (zeus + library), lee PRACTICAS + paquete, aplica 02, verifica, reporta.
```
