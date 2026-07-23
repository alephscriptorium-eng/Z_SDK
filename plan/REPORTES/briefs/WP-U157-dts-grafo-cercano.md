# Brief — WP-U157 · `.d.ts` grafo cercano (fase 2)

(rol) plan/roles/README.md → WORKER

WP: WP-U157 · Declaraciones `.d.ts` kits publicables del grafo de los cinco
Rama: wp/u157-dts-grafo-cercano
Worktree: C:\S_LAB\.worktrees\z\wp-u157-dts-grafo-cercano
Reporte: plan/REPORTES/WP-U157-dts-grafo-cercano.md

## Lecturas
- REPLAN §fase 2 · deps directas BARE de protocol/presets/rooms/ui-3d/webrtc

## Tarea
1. Fijar lote en el reporte (mínimo propuesto):
   `view-kit`, `game-engine`, `authority-kit`, `room-client-browser`,
   `http-contract`, `ui-kit`, `app-shell`, `player-mcp-kit`,
   `socket-server` (+ fans protocol si caben sin inflar el WP).
2. Añadir `types` root (y subpaths críticos) + incluir en `files`.
3. Changesets por paquete.
4. No inventar API — tipar la superficie exportada real.

## CA
- Cada paquete del lote resuelve types desde un consumer TS de prueba
  (fixture local o snippet en test).
- Lista lote cerrada en reporte; residuales → cola, no silencio.
- Tests de paquetes tocados verdes.

## Notas
- Deps: U155 + U156 ✅ (o tip main equivalente)
- Estimación: L · Eje IV · puede partirse si el lote crece
