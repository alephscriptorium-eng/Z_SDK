# `corrupt/` — vectores de declaración corrompida (WP-U264)

Deuda que declaró WP-U245 y que estos vectores cierran: el gate
`test/gate-exports-types.mjs` **nunca parsea** una declaración, sólo hace
`existsSync`. Una `.d.ts` **vacía** o **sintácticamente rota** pasaba
`PASS … 50 declarations` con `EXIT=0` mientras `tsc` sobre ese mismo paquete
escupía `TS2306` / `TS1005`.

Los dos ficheros de aquí son **contenido**, no declaraciones vivas: llevan
sufijo `.vector` justamente para que ningún editor, ningún `tsc -p` y ningún
barrido de `.d.ts` los cargue por accidente. `test/types.test.mjs` los copia
sobre una declaración real dentro de una copia temporal del paquete y compila.

| vector | qué reproduce | error que debe dar |
| --- | --- | --- |
| `vacia.d.ts.vector` | 0 bytes: una regeneración que escribió el fichero y no escribió nada dentro | `TS2306: File … is not a module` |
| `rota.d.ts.vector` | `types/model.d.ts` cortado a la mitad: regeneración interrumpida, merge mal resuelto, escritura que no terminó | `TS1005: '}' expected` (familia `TS1xxx`, gramática) |

## Por qué el compilado lleva un `probe.ts` generado

Compilar las 50 declaraciones **no basta**, y está medido: un
`types/index.d.ts` **vacío** —el barril raíz, el que apunta el subpath `.` y al
que **no importa nadie**— compila `EXIT=0`, porque un fichero vacío es un
script válido. Sólo enrojece si alguien lo **importa**. Por eso el test genera
un `probe.ts` que importa las 50 declaraciones una a una: sin él, el vector
`vacia` sobre un barril de entrada sería un falso verde.

## Lo que estos vectores NO cubren

No cubren una declaración que compila pero **miente** (promete más que el
runtime). Para eso está `must-fail/`, que es el eje ortogonal: aquéllos
comprueban que la declaración sigue **rechazando**, éstos que la declaración
sigue **existiendo de verdad**. Un chequeo que sólo sabe decir «compila» no se
entera de ninguno de los dos por separado.
