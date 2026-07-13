# CAUDAL — ARG del delta (packages/arg/\*)

Juego multijugador three.js sobre el runtime Scriptorium: el tablero son los
volúmenes de datos (firehose + wikicache) y jugar los hace crecer. Derivado
evolucionado del `3d-monitor`, autocontenido en esta familia de paquetes.

| paquete | qué es |
| ------- | ------ |
| [`arg-domain`](arg-domain/) | dominio puro: contrato, escena `delta-v0`, flow-engine (grifos/ríos/mar), maze-engine (cantera), reducers, feeds |
| [`arg-console`](arg-console/) | portal de vistas :3021 — `tablero` (overview global) y `jugador` (vista encarnada con input) |
| [`arg-demos`](arg-demos/) | autoridad del juego (10 Hz) + launcher de la demo de 3 visores |

## Dosier

- [spec/LORE.md](spec/LORE.md) — concepto, las dos fuerzas (Riada/Cantera), mapping con parlament
- [spec/CONTRATO.md](spec/CONTRATO.md) — entidades, eventos (`arg:state` / `arg:intent` / `arg:track` / `arg:ledger`), invariantes y gates
- [spec/UX.md](spec/UX.md) — sistema de juego, controles, menú de cloak MCP, las dos vistas
- [spec/BACKLOG.md](spec/BACKLOG.md) — work packages para el swarm (fase 0 = vertical slice)

## Demo rápida (3 visores)

```bash
npm run demo:arg
# Navegador 1 → http://localhost:3021/views/tablero
# Navegador 2 → http://localhost:3021/views/jugador?actor=uno
# Navegador 3 → http://localhost:3021/views/jugador?actor=dos
```

Controles jugador: `WASD` mover · `E` montar/bajar del río · `1..3` etiquetar
gota · `Espacio` contacto · `Q` inventario · `X` emote.

## Disciplina

Una sola autoridad (`arg-demos/apps/authority`); las vistas solo emiten
intents y proyectan snapshots (gates G-ARG.1..5 del contrato). Transporte:
socket-server :3017, room `ARG_DELTA`.
