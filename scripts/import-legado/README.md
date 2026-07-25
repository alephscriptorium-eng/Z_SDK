# import-legado — importador one-off de corpus legado (WP-U176)

Tooling **one-off** que lee un corpus legado en **solo lectura** y emite los
formatos **existentes** del engine, con IDs zeus deterministas (precedente
D-19). No reconstruye ningún editor: solo traduce a los contratos ya vivos.

## Qué emite (origen → destino)

Por cada **obra** del corpus produce un triple:

| Origen (neutro)            | Destino                                   | Formato / validador                     |
| -------------------------- | ----------------------------------------- | --------------------------------------- |
| obra                       | una línea + un story-board + un reparto   | —                                       |
| `chapters` → tramos        | `nodos-document` + `manifest-tronco` + `nodo-meta[]` + entrada `lineas-registry` | schemas de `@zeus/linea-kit` |
| `scenes` → actos           | `acts[]` del story-board (solve-inline)   | AJV de `@zeus/story-board-schema`       |
| `characters` → personajes  | `reparto.personajes[]` + `story-board.personajes.refs[]` (refs-only, U174) | validador de `@zeus/reparto-kit` |

- `asignaciones: []` en el reparto: los actores (identidad peer-card) llegan
  después; el importador solo deja el elenco y una `politica` mínima por rol.
- Los personajes viajan al story-board **solo por referencia**
  (`personajes.refs[].personajeId` → `reparto.personajes[].id`): nunca corpus
  embebido.
- Determinista: mismo input → mismos ids y mismas estructuras (sin reloj ni
  aleatoriedad; `generated_at` solo si se inyecta `IMPORT_NOW`).

## Contrato de entorno (el operador inyecta; aquí no hay valores)

Las rutas de las fuentes **jamás** se hornean en el árbol (clase U140/D-31):
se toman de variables de entorno del operador.

| Variable               | Sentido                                                          | Oblig. |
| ---------------------- | --------------------------------------------------------------- | ------ |
| `IMPORT_SRC_JSON`      | fichero JSON del corpus principal (`resources` con pozos `characters`/`scenes`/`chapters` + colección de obras) | opcional\* |
| `IMPORT_SRC_OBRA`      | directorio con una obra en markdown por capítulos (un `.md` = un tramo) | opcional\* |
| `IMPORT_SRC_WORKS_KEY` | nombre de la colección de obras dentro de `resources` (si no se auto-detecta) | opcional |
| `IMPORT_OUT`           | directorio de salida (por defecto `out-import`; **no** entra en git) | opcional |
| `IMPORT_NOW`           | ISO para `generated_at` (omitido = salida determinista)         | opcional |
| `CEGUERA_PATTERN`      | patrón de ceguera para validar la salida (valores locales, nunca commit) | opcional |

\* Debe definirse al menos una de `IMPORT_SRC_JSON` / `IMPORT_SRC_OBRA`.

> La colección de obras dentro de `resources` se localiza sin nombrarla en
> código: es «cualquier clave de `resources` que no sea uno de los tres pozos
> conocidos». `IMPORT_SRC_WORKS_KEY` permite fijarla explícitamente. Así el
> importador lee el corpus real sin que su vocabulario de origen aparezca en el
> árbol público.

## Uso

El operador exporta las variables y ejecuta (sin valores en este documento):

```sh
# Validar sin escribir (AJV story-board + validador reparto + schemas de línea)
node scripts/import-legado/index.mjs --check

# Importar y escribir la salida bajo $IMPORT_OUT/LINEAS
node scripts/import-legado/index.mjs
```

Salida escrita (por obra):

```
$IMPORT_OUT/LINEAS/
  registry.yaml
  <lineId>/nodos.yaml
  <lineId>/manifest.json
  <lineId>/nodos/<nodoId>/meta.json
  <lineId>/story-board.json
  <lineId>/reparto.json
```

## Tests

Fixtures **sintéticas** neutras (contenido inventado, mismo shape que el
corpus real; nada del corpus legado entra en git):

```sh
node --test scripts/import-legado/test/*.test.mjs
```
