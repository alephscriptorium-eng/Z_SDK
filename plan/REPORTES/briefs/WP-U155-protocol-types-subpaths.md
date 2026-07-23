# Brief — WP-U155 · `@zeus/protocol` types en subpaths

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U155 · Condiciones `"types"` en subpaths de `@zeus/protocol`
Rama: wp/u155-protocol-types-subpaths
Worktree: C:\S_LAB\.worktrees\z\wp-u155-protocol-types-subpaths
Reporte: plan/REPORTES/WP-U155-protocol-types-subpaths.md

## Lecturas
- plan/PRACTICAS.md · WP en BACKLOG §Sprint 7
- plan/REPORTES/entregas/REPLAN-2026-07-23-sprint7-ts-extraccion.md
- `packages/engine/protocol/package.json` + `src/peer-card-seat.mjs`

## Tarea
1. Empezar por `./peer-card-seat`: emitir `.d.ts` (o ampliar
   `types/` + generador) y condición `"types"` en `exports`.
2. Cubrir el resto de subpaths JS públicos: `./contract` `./roles`
   `./gates` `./acl` `./peer-card` `./node` `./node-src-dir`
   (`./spec*` puede quedar sin types si es YAML/build — documentar).
3. Changeset en `@zeus/protocol`.
4. Evidencia: resolución TS de
   `import … from '@zeus/protocol/peer-card-seat'` sin `any` forzado.

## CA
- `exports["./peer-card-seat"].types` apunta a `.d.ts` real publicado en `files`.
- Resto de subpaths JS con `types` o justificación explícita en reporte.
- `npm test` del paquete verde; changeset presente.
- Diff acotado a protocol + reporte (+ changeset).

## Notas
- ALCANCE_DIFF = `packages/engine/protocol/**`, `.changeset/**`, reporte
- Eje: IV (contrato de export)
- **DESPACHADO** 2026-07-23 · R2-Z PASS + GO custodio (Ola 1)
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- Estimación: M
