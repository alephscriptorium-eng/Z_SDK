# Regla de los dos juegos (D-8)

El SDK tiene **dos** juegos de referencia: **delta** y **pozo**. El engine
sirve a los dos o no es engine.

- `engine/*` **no nombra** un juego concreto ni conceptos exclusivos
  (grifo, cantera, pozo…). Si una abstracción necesita saber a qué juego
  sirve, es el ejemplo con disfraz.
- Lo específico de un juego vive en su paquete (`packages/delta (Z_SDK-games-library)/*`,
  `packages/pozo (Z_SDK-games-library)`).
- Docs de engine no presentan ejemplos de un solo juego como si fueran el kit.
- Todo WP que toque engine deja verdes los tests de **ambos** juegos.

Ver [Games](/games/) y los demos `npm run demo:arg (en Z_SDK-games-library)` / `npm run demo:pozo (en Z_SDK-games-library)`.
