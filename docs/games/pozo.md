# pozo

Juego mínimo de referencia que valida la abstracción del engine. Importa
engine + mesh vía presets/rooms.

Desde la library:

```bash
cd ../Z_SDK-games-library
npm run demo:pozo
```

Incluye dominio puro, autoridad, MCP jugador, vista (view-kit) y
`spec/CASOS.md`. README: `packages/pozo/README.md` en la library.

```bash
cd ../Z_SDK-games-library
npm test -w @zeus/pozo
npm run e2e:pozo-mcp
```
