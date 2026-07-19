# Sprint 2 — acta de cierre (estreno PRACTICAS §7)

Fecha: **2026-07-19**. Fuente del lote:
[00-ADDENDA.md](00-ADDENDA.md) · **D-25**. Ciclo formalizado en
[PRACTICAS.md §7](../PRACTICAS.md) (WP-U130).

## Resultado del lote

| Bloque | WP | Estado |
| ------ | --- | ------ |
| A W-A | U124 | ✅ |
| A W-B | U125 | ✅ |
| B1–B4 | U126–U129 | ✅ |
| D | U131 | ✅ |
| C | U130 | entregado — pendiente revisión/merge |

## Estado declarado (fórmula §7)

> **esperando: revisión+merge U130 de orquestador**

Cuando el orquestador acepte U130 y mergee: el remate de `BACKLOG.md` debe
pasar a **`IDLE sin pendientes`** (lote Sprint 2 cerrado), salvo ticks ops
ajenos al lote (DNS U106/U107, etc. — ya fuera del GO ADDENDA).

## Retro → residuales (no colas por WP)

Hallazgos del sprint ya en o candidatos a
[`BACKLOG.md` §Cola residual viva](../BACKLOG.md) — **sin GO → sin 🔶**:

- (U124/U125) VitePress + Windows: case drive / `preserveSymlinks` /
  `docs:build` — candidate config; no aplicar sin GO
- (U126) `release-startpack` dispatch solo `delta|pozo` vs catálogo Notario
  (sketch/solve/plaza)
- (U125) nav/sidebar library sin ficha `solve-coagula` (reachable por card)
- (U131) VitePress worktree Windows path largo; cache
  `docs/.vitepress/cache/` no gitignored en library
- Ops ajenos al lote: DNS/custom domain U106/U107 ⏳

Registro voseo/tuteo (nota ADDENDA editorial) — fuera de zeus; no WP.

## Qué no queda en silencio

Este acta **declara** el cierre parcial del sprint. No hay «fin implícito»:
o IDLE, o esperando un tick nombrado.
