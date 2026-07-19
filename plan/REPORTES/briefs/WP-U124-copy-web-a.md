# Brief — WP-U124 · Copy portal Zeus SDK (W1)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: Sprint 2 · ENTREGA-19-sprint2 · **D-25**. **Paralelo con U125.**
Repo: `zeus-sdk` solo. Marketing copy — **verbatim**, no redactar.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U124 · Aplicar copy final zeus-sdk/docs (01-COPY-WEB-A)
Rama: wp/u124-copy-web-a
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u124-copy-web-a
Reporte: plan/REPORTES/WP-U124-copy-web-a.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U124-copy-web-a.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md ni con U125.

Política:
- Commits + push OK en rama WP.
- NO merge a main. NO U125 / residuales / DNS.
- NO re-redactar, parafrasear ni «mejorar» copy. Verbatim o reporte.
- NO tocar .vitepress/config.mjs, guide/estado.md, contracts/*, api/, dist/.

Fuente de verdad del copy (leer ENTERO antes de tocar):
- plan/ENTREGA-2026-07-19-sprint2/00-PAQUETE.md (reglas 1–6)
- plan/ENTREGA-2026-07-19-sprint2/01-COPY-WEB-A.md (17 entradas)
- plan/ENTREGA-2026-07-19-sprint2/03-VERIFICACION.md §comunes + §W1

Alcance (solo lo enumerado en 01):
1. docs/index.md — frontmatter (tagline + features.details; name/text/actions intactos)
2–5. guide: getting-started, layout, two-games, external-handshake (marcos)
6–13. engine: index, protocol, authority-kit, player-mcp-kit, playbook-kit,
    view-kit, http-contract, rooms-presets (frases-marco)
14–17. editor/index, mesh/index, games/index, playbook/index (marcos)

CA (03-VERIFICACION):
- Cada DESPUÉS aparece carácter a carácter; cuerpos técnicos byte-idénticos
- git diff --stat = exactamente ficheros de 01 (ni uno más)
- npm run docs:build OK
- hero.name Zeus SDK + hero.text «Crear juegos, no dialectos» idénticos
- config.mjs cero diff; guide/estado.md + contracts/* cero diff
- Sin copy de cosecha propia

Conflicto (regla 4): ancla ausente / link rompe build → dejar campo, anotar
en reporte, NO improvisar.

Demolición: N/A.

Empieza: sitúate en el worktree, lee PRACTICAS + paquete, aplica 01, verifica, reporta.
```
