# Brief — WP-U173 · Kit de reparto y permisos de dominio

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U173 · Kit de reparto y permisos de dominio
Rama: wp/u173-kit-reparto-permisos
Worktree: C:\S_LAB\.worktrees\z\wp-u173-kit-reparto-permisos
Reporte: plan/REPORTES/WP-U173-kit-reparto-permisos.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md
- plan/REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md (§WP)
- packages/engine/protocol (peer-card / seat) · packages/engine/authority-kit
- packages/engine/view-kit (componentes de reparto existentes)

## Tarea
1. Kit de **reparto** del dominio narrativo (personajes/roles) +
   **permisos** de dominio, montado sobre identidad y seats
   **existentes** (`@zeus/protocol` peer-card/seat + authority-kit).
2. Reutilizar componentes de reparto existentes (view-kit) como consumo
   real; sin fork ni copia.
3. Contrato mínimo estable (shape congelado, patrón parte-kit); sin
   identidad nueva.
4. Ubicación propuesta: `packages/engine/reparto-kit` (nombre final a
   validar en la contrarrevisión; no colisionar con kits existentes).

## CA
- Kit consume peer-card/seat existentes; **cero** identidad paralela.
- Permisos verificables por test (rol permitido / denegado).
- Regla de los dos juegos (D-8): el kit no nombra juego concreto.
- Contrarrevisión independiente PASS documentada antes de pedir ✅.
- Cero publish / flip private / changesets.

## ALCANCE_DIFF
- `packages/engine/reparto-kit/**` (nuevo) — o ruta acordada en
  contrarrevisión
- `package-lock.json` si el workspace nuevo lo exige
- reporte bajo `plan/REPORTES/`
- **Prohibido:** protocol/authority-kit/view-kit (solo lectura) ·
  linea-editor (dueño U175) · story-board-schema (dueño U174) · publish

## Notas
- Estado planificado: **⬜** — NO despachar hasta: asiento DA-S21
  commiteado + R12 cerrado + **R13-Z PASS** + GO implementación.
- Estimación: M · Eje I · Ola A (∥ U172)
- Runner despacho futuro: preferir Fable; si no, GPT-5.6 Sol; si no,
  el mejor disponible (anotar cascada en el aviso).
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY · No editar `plan/BACKLOG.md` (solo orquestador)
