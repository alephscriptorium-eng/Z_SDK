# Brief — WP-U156 · types subpaths presets / webrtc / ui-3d

(rol) plan/roles/README.md → WORKER

WP: WP-U156 · Condiciones `"types"` en subpaths de los otros tipados
Rama: wp/u156-types-subpaths-presets-webrtc-ui3d
Worktree: C:\S_LAB\.worktrees\z\wp-u156-types-subpaths-presets-webrtc-ui3d
Reporte: plan/REPORTES/WP-U156-types-subpaths-presets-webrtc-ui3d.md

## Lecturas
- REPLAN Sprint 7 · PRACTICAS · package.json de:
  `@zeus/presets-sdk`, `@zeus/webrtc-signaling`, `@zeus/ui-3d-kit`
- `@zeus/rooms` = N/A (solo export `.` ya tipado)

## Tarea
1. `@zeus/presets-sdk`: types en subpaths usados (`./env` `./paths`
   `./discovery` `./mcp` `./volumes` …) — priorizar los que importa el
   mesh; documentar los deferidos.
2. `@zeus/webrtc-signaling`: `./peer-session` `./messages`
   `./peer-card-gate`.
3. `@zeus/ui-3d-kit`: `./node`.
4. Changesets por paquete tocado.

## CA
- Cada subpath JS tocado resuelve `"types"` a fichero incluido en publish.
- Tests de los tres paquetes verdes.
- Grep/export audit en reporte (tabla subpath → types path).

## Notas
- ALCANCE_DIFF = esos tres packages + changesets + reporte
- **DESPACHADO** 2026-07-23 · R2-Z PASS + GO · ∥ U155 ∥ U159
- Estimación: M · Eje IV
