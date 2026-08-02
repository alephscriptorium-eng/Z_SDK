---
'@zeus/linea-kit': patch
---

`@zeus/linea-kit` publica tipos: los DIEZ subpaths de `exports` resuelven su
condición `types` y las declaraciones viajan en el tarball.

El paquete llevaba `0.3.0` con CERO ficheros `.d.ts`, sin `types` en la raíz
del manifiesto y sin carpeta de tipos en `files`. Un consumidor TypeScript
externo veía diez subpaths sin forma. Ahora hay 50 declaraciones bajo
`types/`: 31 de módulo (una por módulo alcanzable desde un subpath) y 19 de
schema, una por documento de `schemas/`, que es lo que exige el comodín
`./schemas/*` — el `*` vale `volumes.json`, así que la declaración se llama
`types/schemas/volumes.json.d.ts` y el `types` del comodín apunta a
`./types/schemas/*.d.ts`.

Adición compatible, no cambio de comportamiento. **El diff de runtime es
exactamente cero**: los 50 ficheros de `src/`, `schemas/` y `bin/` conservan
su OID de blob contra `main`, sin altas ni bajas. Lo único que se toca del
manifiesto es `types` en la raíz, la condición `types` de cada subpath (el
target de runtime de cada uno queda idéntico, incluido el del comodín),
y `"types"` dentro de `files`. Nada más. El paquete no gana dependencias:
el chequeo de tipos toma prestado el `typescript` izado del monorepo y lo
dice en voz alta si no lo encuentra, en vez de fingir que pasa.

Lo que las declaraciones NO prometen queda escrito como `unknown`, con su
razón, y no como `any`: los documentos leídos sin validar (`card`,
`manifest` de un corpus de forces), las escenas que el llamador pasa a
`crearCotas`, los anchors de `fetch-priority-viaje1.json` —que no tiene
schema en este paquete— y los cuatro campos de una parte de tronco, porque
`manifest-tronco.json` declara `meta.partes` como objetos abiertos SIN
propiedad alguna declarada. Cero `any` en `types/` (grep con salida vacía).

Dos detalles del contrato que un consumidor necesita saber y que el tipo por
sí solo no grita:

- las funciones de `./resolve`, `./loader` y las consultas del cargador de
  forces se estrechan con `if (result.error !== undefined)`, NO con
  `if (result.error)`: el `error` del fallo es `string`, que incluye `''`, y
  una prueba de verdad no elimina el constituyente de fallo de la rama falsa;
- `source_kind` de un recorrido de viaje es la enumeración de cuatro tokens
  de `viaje-recorrido.json`, no un `string` libre: un `GraphSource` con otro
  `kind` produce un rechazo de schema en `buildRecorrido`, no un quinto token.

**El comodín `./schemas/*` cobra un precio, y va dicho aquí porque afecta a
quien lo importe.** Su condición `types` apaga el error TS1543 de TypeScript,
así que el compilador deja de exigir el atributo de importación — pero Node
lo sigue exigiendo. Los diecinueve documentos se importan
`with { type: 'json' }`; sin él, `ERR_IMPORT_ATTRIBUTE_MISSING` al cargar.
Está escrito en las diecinueve declaraciones y fijado en el runtime por
`test/json-import-attribute.test.mjs`, que corre en CI.

Dos promesas más que el runtime NO respalda y por eso el tipo tampoco:
`acceptWalks` comprueba tres cosas y devuelve el array de entrada tal cual,
así que su resultado queda tipado POR LA ENTRADA y nunca inventa un `hop`
que nadie miró; y `editorAllowlist` es un `Set`, nunca un array — la regla
`editor` llama a `.size` y `.has()`, y `segmentarViaje` (a diferencia de
`segmentarHistorial`) no normaliza.

Queda un gate propio en `test/` (no viaja en el tarball) que falla en las DOS
direcciones —subpath en `exports` sin declaración, y declaración retirada,
tanto la de entrada como una que sólo importan los barriles— más dos
consumidores TypeScript independientes (`NodeNext` estricto y `bundler` con
`verbatimModuleSyntax` / `exactOptionalPropertyTypes` /
`noUncheckedIndexedAccess`) y trece controles negativos que **deben NO
compilar**: una declaración que dejara de rechazar el código que la motivó es
una declaración que volvió a mentir.
