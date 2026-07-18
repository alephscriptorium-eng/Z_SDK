# Games

Juegos de referencia que consumen el mismo engine
([regla](/guide/two-games)):

| Juego | Ubicación | Demo |
| ----- | --------- | ---- |
| [delta](/games/delta) | [`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library) · `packages/delta/*` | `npm run demo:arg` (en la library) |
| [pozo](/games/pozo) | misma library · `packages/pozo` | `npm run demo:pozo` (en la library) |

Este monorepo queda con engine + editor + mesh + examples. Los juegos viven
en la library.

**Catálogo público:** Pages + piel zine en la library —
dominio objetivo [`games.z-sdk.escrivivir.co`](https://games.z-sdk.escrivivir.co/)
(DNS = tick ops). Repo:
[`Z_SDK-games-library/docs`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/docs).

## Kit de experiencia (CARPETA DRAMATURGO)

Plantilla para juegos narrativos del **mundo A** (dramaturgo), destilada de
ALEPH_ET_OMEGA / SOLVE_ET_COAGULA. Vive en la library:

→ [`Z_SDK-games-library/kits/carpeta-dramaturgo/`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/kits/carpeta-dramaturgo)

```bash
cd ../Z_SDK-games-library
npm run instantiate:carpeta-dramaturgo -- --slug mi-juego --title "…"
npm run test:carpeta-dramaturgo
```

## SOLVE ET COAGULA

Juego adicional del mundo A: dramaturgia + startpack + mesh. delta y pozo
siguen siendo el mínimo del engine (≥2 juegos de referencia).

→ [`packages/solve-coagula/`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/packages/solve-coagula)
· startpack [`@zeus/startpack-solve-coagula`](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/packages/startpack-solve-coagula)

```bash
cd ../Z_SDK-games-library
npm run demo:solve-coagula
npm run e2e:solve-coagula-mcp
```

Corpus natural: fixture **linea-aleph** (historial Wikipedia SolveCoagula) en
el start pack; fuente viva `network-engine/linea-aleph`. Originales en
`scriptorium-network-games/SOLVE_ET_COAGULA` quedan como referencia histórica.

Ids de WP: [estado del swarm](/guide/estado).
