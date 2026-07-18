# Games

Dos juegos de referencia consumen el mismo engine ([D-8](/guide/two-games)):

| Juego | Ubicación hoy | Demo |
| ----- | ------------- | ---- |
| [delta](/games/delta) | `packages/delta (Z_SDK-games-library)/*` | `npm run demo:arg (en Z_SDK-games-library)` |
| [pozo](/games/pozo) | `packages/pozo (Z_SDK-games-library)` | `npm run demo:pozo (en Z_SDK-games-library)` |

Tras la ola 6 viven en `Z_SDK-games-library`; el monorepo queda con engine +
editor + mesh + examples.

**Catálogo público** (WP-U107): Pages + piel zine en la library —
dominio objetivo [`games.z-sdk.escrivivir.co`](https://games.z-sdk.escrivivir.co/)
(DNS = tick usuario). Repo:
[`Z_SDK-games-library/docs`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/docs).

## Kit de experiencia (CARPETA DRAMATURGO · WP-U86)

Plantilla para juegos narrativos del **mundo A** (dramaturgo), destilada de
ALEPH_ET_OMEGA / SOLVE_ET_COAGULA. Vive en la library:

→ [`Z_SDK-games-library/kits/carpeta-dramaturgo/`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/kits/carpeta-dramaturgo)

```bash
cd ../Z_SDK-games-library
npm run instantiate:carpeta-dramaturgo -- --slug mi-juego --title "…"
npm run test:carpeta-dramaturgo
```

## SOLVE ET COAGULA (tercer juego · WP-U87)

Prueba de fuego del mundo A: dramaturgia + startpack + mesh. **No** endurece
la regla de los dos juegos (delta+pozo siguen siendo el mínimo del engine).

→ [`packages/solve-coagula/`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/packages/solve-coagula)
· startpack [`@zeus/startpack-solve-coagula`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/packages/startpack-solve-coagula)

```bash
cd ../Z_SDK-games-library
npm run demo:solve-coagula
npm run e2e:solve-coagula-mcp
```

Corpus natural: fixture **linea-aleph** (historial Wikipedia SolveCoagula) en
el start pack; fuente viva `network-engine/linea-aleph`. Originales en
`scriptorium-network-games/SOLVE_ET_COAGULA` no se modifican.
