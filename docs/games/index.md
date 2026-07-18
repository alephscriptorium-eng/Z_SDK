# Games

Dos juegos de referencia consumen el mismo engine ([D-8](/guide/two-games)):

| Juego | Ubicación hoy | Demo |
| ----- | ------------- | ---- |
| [delta](/games/delta) | `packages/delta (Z_SDK-games-library)/*` | `npm run demo:arg (en Z_SDK-games-library)` |
| [pozo](/games/pozo) | `packages/pozo (Z_SDK-games-library)` | `npm run demo:pozo (en Z_SDK-games-library)` |

Tras la ola 6 viven en `Z_SDK-games-library`; el monorepo queda con engine +
editor + mesh + examples.

## Kit de experiencia (CARPETA DRAMATURGO · WP-U86)

Plantilla para juegos narrativos del **mundo A** (dramaturgo), destilada de
ALEPH_ET_OMEGA / SOLVE_ET_COAGULA. Vive en la library:

→ [`Z_SDK-games-library/kits/carpeta-dramaturgo/`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/kits/carpeta-dramaturgo)

```bash
cd ../Z_SDK-games-library
npm run instantiate:carpeta-dramaturgo -- --slug mi-juego --title "…"
npm run test:carpeta-dramaturgo
```

No es un tercer juego de producto (eso es WP-U87). Los originales en
`scriptorium-network-games/` no se modifican.
