# Brief — WP-U159 · scaffold `@zeus/socket-core`

(rol) plan/roles/README.md → WORKER

WP: WP-U159 · Paquete `@zeus/socket-core` (superficie SocketClient/Server)
Rama: wp/u159-socket-core-scaffold
Worktree: C:\S_LAB\.worktrees\z\wp-u159-socket-core-scaffold
Reporte: plan/REPORTES/WP-U159-socket-core-scaffold.md

## Lecturas
- REPLAN arco B · `packages/engine/rooms/src/index.mjs` ·
  `packages/mesh/socket-server/src/{create-server,relay,close-server}.mjs`
- Eje I (extracción con cableado) — aún sin migrar consumidores (eso es U160)

## Tarea
1. Crear `packages/…/@zeus/socket-core` (ubicación engine o mesh — elegir
   y justificar; preferible `packages/engine/socket-core`).
2. Portar **solo** la superficie usada:
   - `SocketClient`: ctor(user, url, namespace, options), `.io`, `.room`
   - `SocketServer`: ctor(name, httpServer, …), `createNamespace`, `.io`
3. Exports `./client` y `./server` (+ types).
4. Tests unitarios del paquete nuevo (comportamiento, no solo import).
5. Changeset; workspace cableado en root `package.json` si aplica.
6. **Aún no** quitar dep de rooms/socket-server (U160).

## CA
- Paquete instalable en workspace; tests verdes.
- API documentada en README corto = superficie portada.
- Cero imports a `@alephscript/mcp-core-sdk` dentro del paquete nuevo.

## Notas
- **DESPACHADO** 2026-07-23 · R2-Z PASS + GO · ∥ U155 ∥ U156
- Estimación: L · Eje I (consumidor real llega en U160 — declarar en reporte)
- Nombre fijado en plan: `@zeus/socket-core` (cambiar solo con nota en DECISIONES)
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
