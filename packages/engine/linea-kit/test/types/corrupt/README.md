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
| `rota-con-nota.d.ts.vector` | una de las **19 de `schemas/`** con el código roto y **la nota del atributo intacta** | `TS1005` ×3, todos en `types/schemas/volumes.json.d.ts` |

## Por qué el tercero existe, y por qué es el que faltaba

El gate viejo no es ciego a las 50: es ciego a **31**. Las **19 del comodín
`./schemas/*`** las cubre su **pierna J**, que lee la prosa buscando
`with { type: 'json' }` — y una declaración **vacía** la pierde, así que J la
caza (`J:attribute_contract_missing`).

Lo que J **no** puede ver es una de esas 19 **rota con la nota puesta**: J
compara una cadena, no compila. `rota-con-nota.d.ts.vector` conserva el
docblock **entero y bien cerrado** —J queda satisfecha de verdad, no por
accidente— y rompe el código de debajo:

```
GATE  ok=true  []  decls=50        ← no lo nota
TSC   exit=2   3 errores, los tres en types/schemas/volumes.json.d.ts
```

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
