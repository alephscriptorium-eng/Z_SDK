# Brief — WP-U160 · migrar rooms/socket-server y cortar dep cruzada

(rol) plan/roles/README.md → WORKER

WP: WP-U160 · Consumir `@zeus/socket-core`; cortar `@alephscript/mcp-core-sdk` en `@zeus/*`
Rama: wp/u160-migrar-corte-mcp-core
Worktree: C:\S_LAB\.worktrees\z\wp-u160-migrar-corte-mcp-core
Reporte: plan/REPORTES/WP-U160-migrar-corte-mcp-core.md

## Lecturas
- WP-U159 reporte · REPLAN grafo · eje I + II

## Tarea
1. `@zeus/rooms` → import desde `@zeus/socket-core/client`; quitar dep mcp-core-sdk.
2. `@zeus/socket-server` → server + client desde socket-core; quitar dep.
3. `@zeus/webrtc-signaling`: sustituir `import('@alephscript/mcp-core-sdk/client')`
   por tipos de `@zeus/socket-core` (o rooms).
4. Destino canónico de cada símbolo (tabla en reporte) — eje II.
5. Tests rooms + socket-server verdes; changesets.

## CA
- `rg '@alephscript/mcp-core-sdk' packages` → **0** en packages `@zeus/*`
  (excepto si queda solo en examples/root — listar residuales).
- Grep de `SocketClient`/`SocketServer` → definición única en socket-core.
- Tests cliente/servidor verdes.

## Notas
- Dep: U159 ✅ · Estimación: M · Ejes I + II
- Root `package.json` / examples: residual explícito → U161 o cola
