# WP-U269 — el detector de claves deja de adivinar y PARSEA

Rama `wp/u269-detector-con-parseo`, worktree `C:/S_LAB/wt/z-u269`.
Continúa el límite 6 que `WP-U231` dejó abierto **a propósito**, para no entrar
en carrera armamentística de expresiones regulares.

**Segunda entrega, tras devolución.** La contrarrevisión encontró un agujero que
anulaba la tesis de seguridad del WP (B1), tres clases de pérdida no declaradas
(B2) y seis menores. Todo está cerrado o declarado abajo; §2 y §3 son nuevas.

---

## 0 · Lo primero: el denominador cambió y las cifras del encargo caducaron

El encargo cita «90 hallazgos en 1741 ficheros trackeados». Ninguna de las dos
cifras se sostiene, y una tampoco sobre el reporte del que salía:

| cifra | de dónde venía | medido hoy |
|---|---|---|
| ficheros trackeados | 1741 (U231 §2.7) | **1762** (1759 antes de añadir la obra de este WP) |
| hallazgos con el detector de U231 | «90» en el encargo; **121** en U231 §2.7 | **135** |

El 90 no aparece en el reporte de U231 —allí la cifra con el léxico elegido es
121— y el árbol ha crecido. Todas las mediciones de abajo están **re-medidas en
este árbol**, con la orden exacta y con el denominador al lado.

---

## 1 · El antes y el después, con denominador y con la orden exacta

Misma orden, **sólo cambia el detector**: se extrae el de `main` a un temporal y
se apunta ahí la variable `DETECTOR`.

```
$ node <scratchpad>/densidad.mjs C:/S_LAB/wt/z-u269 --detalle
```

`densidad.mjs` recorre `git --no-optional-locks ls-files`, llama a
`hallazgosEnFichero` sobre cada fichero regular y cuenta en proceso. No hay
`wc -l` sobre una tubería; el `rc` se comprueba aparte.

```
ANTES  (detector de U231, extraído de main)
  ficheros trackeados: 1762 · inspeccionados: 1762 · saltados: 0
  HALLAZGOS: 135 en 77 ficheros

DESPUÉS (detector con analizadores)
  ficheros trackeados: 1762 · inspeccionados: 1762 · saltados: 0
  HALLAZGOS: 61 en 44 ficheros
```

**135 → 61 sobre 1762 ficheros trackeados.** Diff de conjuntos: **77
desaparecen, 3 aparecen.**

### 1.1 · Los 77 que desaparecen

Agrupados por la línea que los producía: el valor no era un literal. Ocho veces
la asignación de `resolveMcpApprovalToken()` a una constante llamada `token`;
cuatro, una propiedad `token` cuyo valor es un acceso a miembro; dos,
anotaciones de tipo de un parámetro `privateKey`; cinco, TÍTULOS de `test(...)`
que contienen la palabra `clave` en castellano corriente; el resto, llamadas
asignadas a una variable `auth` y prosa de comentarios.

**Corrección respecto a la primera entrega (M6).** Escribí «ninguna de las 75
líneas contiene un literal de cadena con material». **Es falso, y la
contrarrevisión lo midió.** Cuatro de las 77 llevan un literal:

| línea | por qué se va |
|---|---|
| `e2e/local-first-ca.mjs:1233` | el valor es `path.join(...)`; el literal es un ARGUMENTO (`'secret.txt'`), un nombre de fichero |
| `packages/mesh/ssb-system/test/export.test.mjs:1390` | ídem: `tempRoot('u253c-semilla-')` |
| `packages/mesh/operator-ui/fixtures/puerta-entry.mjs:59` | una propiedad de identidad cuyo valor es una expresión con `??`: el literal es el valor por DEFECTO, alcanzado a través de la expresión, no el valor asignado |
| `test/gates/claves.test.mjs:210` | el FIXTURE de i18n del propio U231, material sintético dentro de un array de test |

La conclusión aguanta —ninguna es una credencial de un servicio— pero la frase
absoluta no, y era mía. Las tres primeras son el efecto buscado: el valor de un
campo de identidad es lo que se le asigna, no lo que aparece dentro de la
expresión que lo calcula. La cuarta es un fixture.

### 1.2 · Los 3 que aparecen, declarados

```
packages/engine/embajador-kit/src/tipos.mjs:27                  export const CREDENCIAL_VERSION = 'embajador/1';
packages/mesh/linea-editor/src/editor-server.mjs:91             token_env: 'ZEUS_MCP_APPROVAL_TOKEN',
packages/mesh/linea-editor/test/reparto-autoria.test.mjs:262    approvalToken: 'TOKEN-INCORRECTO',
```

Los tres son **nombres compuestos** que el barrido de línea no veía —su patrón
exige que el léxico llegue pegado a los dos puntos— y que `esNombreDeIdentidad`
sí ve. El primero es una versión, el segundo es **el nombre de una variable de
entorno** (no su valor) y el tercero un fixture de test. **No los cierro**:
cerrarlos pedía una lista de sufijos inocentes (`_VERSION`, `_env`), que es el
instrumento del que este WP intenta salir. Quedan como coste declarado.

---

## 2 · B1 — la retirada tenía una puerta de servicio sin vigilar

**El agujero.** `parYaml` sólo entraba en estado de comilla si la comilla estaba
en `k === 0`, así que en `"api_key":"…"` no veía ningún `:` separador y devolvía
`null`. `flujoYaml` caía entonces en la retirada puesta para `{{DB_PASSWORD}}`,
que **devolvía `null` sin lanzar**. Sin excepción no hay retirada:
`hallazgosEnFichero` nunca llegaba al `catch`, no se empujaba ningún campo, y el
fichero salía **limpio con la clave dentro**.

```
$ git archive HEAD | tar -x -C <tmp> && cd <tmp>
$ printf '{"id":"demo","api_key":"…"}\n' > VOLUMES/DISK_02/LINEAS/zz-fuga.yaml
$ node scripts/gates/run.mjs
gates: OK (0 offenders)   rc=0        <- con la clave sembrada
```

Reproducido tal cual. **JSON es YAML legal, esa forma es la salida exacta de
`JSON.stringify`, y `VOLUMES/**` ya contiene `.yaml`.** No era laboratorio. Y
peor: las formas que *sí* se cazaban se cazaban por accidente —con espacio tras
los dos puntos, `camposDeYaml` devolvía un nombre truncado que conservaba por
casualidad la subcadena que dispara—.

**El arreglo, en dos piezas.**

1. **Corrección**: `parYaml` acepta el separador pegado al cierre de una clave
   entrecomillada, que es la regla del contexto de flujo de YAML. Ahora esa
   forma se **entiende**, no se sortea.
2. **Seguridad**: `flujoYaml` tiene ahora **una sola** salida `null`, y significa
   información positiva —«esto no empieza por corchete ni por llave, no es
   flujo»—. **Todo lo demás LANZA `NoEntiendo`**: cola tras el cierre, flujo sin
   equilibrar, mal cerrado, y elemento de mapa que no es una pareja.

**Las ocho formas, por el CLI como proceso, sobre el árbol de volúmenes real:**

```
                                    main   rama
{"api_key":"…"}                     rc=0   rc=1
cfg: {"api_key":"…"}                rc=0   rc=1
- {"api_key":"…"}                   rc=0   rc=1
items:\n  - {"token":"…"}           rc=0   rc=1
[{"api_key":"…"}]                   rc=0   rc=1
{'api_key':'…'}                     rc=0   rc=1
{api_key:…} sin espacio             rc=0   rc=1
{"a":{"api_key":"…"}}               rc=0   rc=1

formas que se escapan: main 8 de 8 · rama 0 de 8
control negativo (sin sembrar): rc=0 en las dos
```

Siete se **entienden**; la octava (sin espacio y sin comillas) **se retira** y la
caza el barrido crudo. Las dos respuestas son correctas y ninguna es silencio.

**La auditoría de salidas silenciosas que pidió la devolución**, sitio por sitio:

| sitio | qué devuelve | veredicto |
|---|---|---|
| `formatoDe` | `null` = formato desconocido | **legítimo**: información positiva, quien llama barre en crudo |
| `parYaml` | `null` = «no es una pareja» | **legítimo**: información positiva; quien llama decide |
| `flujoYaml` | `null` = «no es una colección de flujo» | **legítimo**, y ahora es la ÚNICA; las otras cuatro salidas LANZAN |
| JSON · fin de cada rama de `valor()` | consume o llama a `err()` | **lanza**; no hay rama muda |
| JSON · valor NUMÉRICO | antes se consumía sin empujar campo | **cerrado** (B2): ahora empuja |
| JSON · cadena en la RAÍZ (`nombre === null`) | no empuja | **legítimo**: sin nombre no hay `campo-identidad`; los patrones por forma siguen barriendo |
| Dockerfile · línea que no es `INSTRUCCION args` | antes `continue` mudo | **cerrado**: ahora LANZA |
| Dockerfile · instrucción no modelada (`RUN`, `COPY`…) | antes `continue` mudo | **cerrado** (B2): ahora OPACA y a barrido crudo |
| Dockerfile · trozo sin `=` en forma de pares | antes `continue` mudo | **cerrado**: ahora LANZA |
| Dockerfile · `ARG X` / `ENV X` sin valor | `continue` | **legítimo**: no hay valor que juzgar |
| código · literal sin nombre delante | no empuja | **cerrado en parte** (B2): si el literal ES un documento JSON, se analiza |
| código · comentario | antes se tiraba | **cerrado** (B2): OPACO y a barrido crudo |

---

## 3 · B2 — las clases de pérdida frente a U231: cerradas, no declaradas

La devolución pedía decidir caso por caso. **Las nueve se cierran**, porque todas
son la misma cosa —texto que el analizador no analiza y por tanto no puede dar
por limpio— y todas con el mismo mecanismo ya presente: marcar el valor **OPACO**
y barrerlo en crudo además de juzgarlo.

```
$ node <scratchpad>/u269-b2.mjs <claves.mjs de main>
caso                               main rama
comentario YAML                       1    1
comentario Dockerfile                 1    1
comentario de linea en codigo         1    1
comentario de bloque en codigo        1    1
valor NUMERICO en JSON                1    1
blob JSON en literal de codigo        1    1
blob JSON en plantilla                1    1
RUN de Dockerfile con export          1    1
flujo YAML JSON.stringify             1    1

clases perdidas: 0 de 9
```

Las tres que nombraba la devolución, más seis que aparecieron al auditar. **El
coste está medido**: cerrar los comentarios subió la densidad de 52 a 61 (+9,
casi todo en `.mjs`), y aun así el saldo es 135 → 61.

Nótese que la primera entrega declaraba la pérdida de comentarios **sólo en
código**, y era más ancha: también YAML y Dockerfile. La evidencia estaba en mi
propia medición y no la leí — `.github/workflows/publish-operator-bridge.yml:3`,
uno de los hallazgos que «desaparecían», es exactamente un comentario.

---

## 4 · Las tres formas del enunciado

Escapaban las tres (`hallazgosEnTexto` da 0 sobre las tres, y hay test que lo
fija). Ahora se cazan **por el CLI lanzado como proceso** sobre `VOLUMES/` real:

```
$ node scripts/gates/run.mjs
gates: FAIL (6 offender(s))
  [clave-en-volumen] …/u269-ctrl.json:3        - campo-identidad
  [clave-en-volumen] …/u269-ctrl.yaml:3        - campo-identidad
  [clave-en-volumen] …/u269-ctrl.Dockerfile:2  - campo-identidad
  [contexto-imagen]  …/u269-ctrl.Dockerfile:2  - campo-identidad
  [contexto-imagen]  … no hay .dockerignore en un contexto plausible (x2)
GATES rc=1
$ rm …/u269-ctrl.*   &&   node scripts/gates/run.mjs
gates: OK (0 offenders)   rc=0
```

1. **Array JSON** — analizador descendente recursivo con posición; un elemento
   de array **hereda el nombre de la clave del array**.
2. **Escalar de bloque YAML** — el cuerpo son las líneas SIGUIENTES; ninguna
   expresión regular de una línea puede verlo.
3. **`ENV API_KEY valor` sin `=`** — analizador de instrucciones: aquí no hace
   falta separador, **lo dice la gramática**.

---

## 5 · La decisión escrita: NO hay dependencia nueva

`package.json` no gana ni una línea, y no es de gusto:

- **El gate no debe necesitar `node_modules`.** U231 cerró un hueco justo por
  ahí. Su guardián de espacios irregulares —que no necesita dependencias y cubre
  todo `.mjs` de `scripts/gates` y `test/gates`, o sea también los ficheros
  nuevos— pasa.
- **El `npm ci` de esta máquina está incompleto**: verifiqué que
  `node_modules/.bin/eslint` **no existe**, así que `npm run lint` no se puede
  correr aquí. (La contrarrevisión fue más lejos y comprobó que el worktree
  entregado **no tiene `node_modules` en absoluto** y `run.mjs` sale verde ahí.)

**Aquí no se implementa YAML**: se implementa el subconjunto de bloque que este
árbol usa, y lo que no se entiende **se retira**. Retiradas sobre este árbol:

```
con formato conocido: 1141
   de esos, >1 MiB (ni llegan al analizador): 1   <- package-lock.json
analizados: 1140 · OK: 1132 · retiradas: 8
   5 x JSON: valor no reconocido "/* To learn "    (JSON con comentarios)
   1 x JSON: valor no reconocido "// presentat"
   1 x codigo: expresion regular sin cerrar
   1 x YAML: ancla o alias no modelado
```

(M5: la primera entrega decía «8 de 1138» sin explicar el hueco. El denominador
correcto es 1141 con formato conocido, de los que 1 es `package-lock.json`, que
supera 1 MiB y va por el camino troceado de U231.)

---

## 6 · Los siete falsos positivos de U231, y los gemelos que sí caen

Los siete entran otra vez **por el camino real** —se escriben a disco y se llama
a `hallazgosEnFichero`—, y no por la capa de abajo. La diferencia es la lección
de B1: **el analizador LANZA y quien se retira es `hallazgosEnFichero`**. Medir
abajo mide media cadena, y el primero de los siete es justo un caso en que abajo
lanza y arriba responde «limpio», que es lo correcto. Hay test que comprueba las
dos mitades por separado: que el analizador **lanza** y que el camino real **da
limpio**.

Los gemelos que **sí** caen son ahora **dieciséis**: los siete originales más
las nueve clases recuperadas en §3. Si alguien ensancha el clasificador para
quitar un falso positivo, ese test se pone rojo.

---

## 7 · El ancla del léxico: de quién eran los falsos positivos (M1)

`LEXICO_IDENTIDAD.source` es una alternancia de primer nivel sin paréntesis, así
que interpolarla entre un lookbehind y un lookahead ataba el primero sólo a la
primera alternativa y el segundo sólo a la última. `author`, `tokenizer`,
`secretaria` y `xxpwdyy` daban verdadero.

**Corrección de la primera entrega.** Escribí que eran falsos positivos que
venía arrastrando el árbol. **No lo eran: eran míos.** Medido:

```
main (barrido crudo de U231)            135 hallazgos · en lineas con `author`:  0
rama U269 (con el ancla cerrada)         61 hallazgos · en lineas con `author`:  0
rama U269 con el ancla OTRA VEZ ROTA    100 hallazgos · en lineas con `author`: 36
```

El bug del **código fuente** sí es preexistente —está en `main`—, pero en `main`
no producía ni un falso positivo, porque su único consumidor era
`censarVolumenes`, que sale idéntico con y sin arreglo. Los 36 los produce **el
camino estructural nuevo**, que pregunta por el nombre de CADA campo. O sea: el
arreglo no limpia deuda ajena, **evita que la mía se dispare**. El arreglo se
queda; la frase se corrige.

### 7.1 · Y cerrar el ancla no puede costar nombres (M2)

La contrarrevisión midió que el arreglo, tal cual, dejaba de casar doce nombres
de identidad —`authToken`, `apiSecret`, `password2`, `claveAdmin`…— porque el
ancla exige frontera no alfanumérica y en `authToken` la frontera es un cambio
de caja. Latente en CA2: un `${ZEUS_AUTHTOKEN}` pasaría de `identidad` a
`localizador`. **Arreglar un fallo abriendo otro no es arreglarlo.**

Se cierra con `esNombreDeIdentidad`, que hace **dos** preguntas: el nombre
entero contra el léxico anclado (cubre los compuestos del léxico, `api_key`), y
cada palabra por separado tras partir por separador, camelCase y dígito (cubre
los compuestos del programador). Recupera **10 de 12**; cuesta **+1** falso
positivo (§1.2, `approvalToken`).

**Límite declarado**: una tirada entera en mayúsculas sin separador —`AUTHTOKEN`,
`ZEUS_AUTHTOKEN`— no se puede partir porque no hay frontera que leer.
`AUTHTOKEN` y `AUTHOR` son el mismo problema y sólo un diccionario los
distingue: **se prefiere perder el primero a recuperar el segundo**, porque un
autor es identidad pública y sale once veces en este árbol. Con separador
(`ZEUS_AUTH_TOKEN`) se caza. Tiene test en las dos direcciones.

---

## 8 · Qué negativos verifiqué DESACTIVANDO su guardián

**Censo de mutación, segunda vuelta: 17 mutantes, 17 rojos.** Línea base verde
comprobada antes de empezar.

| mutante | rojos | |
|---|---|---|
| M1 · el ancla vuelve a estar rota | 3 | |
| M2 · el array JSON no hereda el nombre | 3 | |
| M3 · el bloque no recoge el cuerpo | 2 | |
| M4 · Dockerfile pierde la forma de espacio | 3 | |
| M5 · **el mapa de flujo devuelve `null` en vez de lanzar** | 1 | **B1** |
| M6 · la retirada se vuelve silencio | 7 | |
| M7 · el lexer no separa comentarios | 2 | |
| M8 · el espacio interior no marca prosa | 5 | |
| M9 · literal de cadena sin cerrar: sigue como si nada | 1 | **vivo antes** |
| M10 · comentario de bloque sin cerrar: se lo traga | 1 | |
| M11 · expresión regular sin cerrar: se la traga | 1 | |
| M12 · `parYaml` pierde la clave entrecomillada | 1 | **vivo antes** |
| M13 · el comentario de YAML se vuelve a tirar | 2 | |
| M14 · el número de JSON deja de ser un valor | 1 | |
| M15 · el blob JSON en un literal no se analiza | 1 | |
| M16 · `esNombreDeIdentidad` no parte en palabras | 2 | |
| M17 · la izada vuelve a dejar la bandera `y` | 1 | |

**Tres mutantes salieron VIVOS y hubo que escribirles guardián:**

- **M9** (lo encontró la contrarrevisión, M4 de la devolución): cambiar el
  `throw` del literal sin cerrar por «sigue como si nada» dejaba los 82 tests en
  verde. Sólo estaba cubierta **una** de las tres ramas de rotura del lexer.
  **Se cierra la clase**: las tres roturas —cadena, comentario de bloque,
  expresión regular— tienen test, y cada una se comprueba dos veces (que LANZA, y
  que por el camino real el material que viene DESPUÉS se sigue cazando). Lo
  mismo para las cinco roturas del analizador de JSON.
- **M12**: quitar la rama de clave entrecomillada de `parYaml` dejaba la suite
  verde **porque el hallazgo sobrevivía por la retirada**. La seguridad estaba
  cubierta y la **precisión** no: sin esa rama, todo `.yaml` con JSON dentro se
  retira entero al barrido crudo. Guardián nuevo: se exige que el analizador lo
  **entienda**, no que alguien lo cace.
- **M17** (M3 de la devolución): la izada quitaba `g` pero no `y`. Arreglado
  (`.replace(/[gy]/g,'')`) y con test que pasa un patrón `gy` y exige las tres
  coincidencias.

En la primera entrega ya habían salido vivos **M3 y M7**, y perseguir M3 destapó
un agujero que iba a introducir yo: un `run: |` de CI con `export API_KEY=…`
quedaba tapado por el análisis. Cerrado con el mecanismo OPACO.

**La ausencia sigue siendo ruidosa**: `hallazgosEstructurales` con lista de
patrones vacía, `null` o `Object.freeze([])` lanza `TypeError`, y la retirada
**no se lo traga** (sólo perdona `NoEntiendo`). Con test.

---

## 9 · El léxico, re-medido

Caducó por el árbol (1741 → 1762) y por el detector (barrido → análisis):

```
$ node <scratchpad>/lexico.mjs
sin `clave` ni `key` a secas   ->   54 hallazgos
con `clave` (EL ELEGIDO)       ->   61 hallazgos      (+7)
con `clave` y `key`            ->  222 hallazgos    (+161)
denominador: 1762 ficheros trackeados
```

**Aviso, porque la primera medición salió mal y parecía bien:** las tres
variantes daban 61. El temporal de cada una se nombraba con un hash truncado del
título, y «con `clave` (EL ELEGIDO)» y «con `clave` y `key`» comparten los seis
primeros bytes: mismo fichero, y **la caché de módulos de ESM devolvía la primera
variante para la tercera**. Se detectó porque el resultado era *demasiado*
limpio y se contrastó aparte (la variante con `key` encuentra 10 hallazgos en
`ssb-log.json`, donde la elegida encuentra 0). La decisión de U231 **no cambia**:
`key` cuesta veintitres veces más que `clave`.

---

## 10 · Coste

Medido en proceso, caché caliente, mismo listado, mínimo de 3 corridas. El
`npm run gates` de punta a punta en esta máquina es **demasiado ruidoso para
afirmar nada** (rango 1,9 – 10,5 s para las dos versiones; las medianas no se
separan).

```
main   min 4333 ms · 125 hallazgos     (medido antes de anadir la obra del WP)
U269   min 1783 ms ·  52 hallazgos
```

Buena parte de la mejora no es del análisis sino de un punto caliente en
`hallazgosEnTexto`, que compilaba `new RegExp` **una vez por línea y por
patrón**. Izarla no cambia un resultado —se comprueba, no se argumenta: el mismo
conjunto, diff de 0 líneas— pero hay que quitar **`g` e `y`**, no sólo `g` (M17).

---

## 11 · Qué límite queda declarado

1. **Markdown, `.env` y el texto plano no se analizan.** Siguen en barrido crudo.
   **22 de los 61 hallazgos están en `.md`** y son prosa de reportes.
2. **Una frase de paso con espacios LITERALES no se caza.** Con el valor entero
   delante, «tiene un espacio dentro» separa prosa de material. Con guiones sí se
   caza, y es el gemelo que lo prueba.
3. **Los 3 falsos positivos de §1.2 siguen ahí.** Cerrarlos pedía una lista de
   sufijos inocentes.
4. **Una tirada en mayúsculas sin separador** (`AUTHTOKEN`) no se parte en
   palabras (§7.1), con la razón medida.
5. **Ficheros de más de 1 MiB no se analizan**: van por el camino troceado de
   U231, que es el conservador. Hoy, uno: `package-lock.json`.
6. **YAML es un subconjunto**: anclas, alias, etiquetas, claves complejas, claves
   de fusión y flujo multilínea **se retiran**. 8 retiradas de 1140 hoy.
7. **El valor de un campo es lo que se le asigna**, no lo que aparezca dentro de
   la expresión que lo calcula: un literal por defecto alcanzado tras un `??` ya
   no se denuncia (§1.1). Es deliberado y es una pérdida frente a `main`.
8. **Sigue sin haber detección por entropía** ni **lista de excepciones** para
   estas tres reglas. Los falsos positivos nuevos se declaran, no se eximen. Y
   cuando el detector se cazó a sí mismo —una constante `ID_POR_CLAVE`, y cuatro
   comentarios míos— se **renombró y se reescribió**, no se exceptuó.
9. **Lo que este WP NO toca**, y U231 ya declaraba: el historial de git, el
   tarball de npm, UTF-16, y contextos de build que no sean el directorio de la
   receta ni la raíz.

---

## 12 · Estado de las comprobaciones

```
$ node scripts/gates/run.mjs                 ->  gates: OK (0 offenders) · rc=0
$ node --test test/gates/*.test.mjs          ->  189 tests · 189 pass · 0 fail
$ node --test test/gates/formatos.test.mjs   ->   31 tests ·  31 pass · 0 fail (nuevos)
$ node <scratchpad>/u269-mutar.mjs           ->  17 mutantes · 17 rojos · 0 vivos
$ node <scratchpad>/u269-b1-cli.mjs          ->  0 de 8 formas se escapan (main: 8 de 8)
$ node <scratchpad>/u269-b2.mjs              ->  0 de 9 clases perdidas
```

Con la obra del WP ya trackeada: **1762 ficheros · 61 hallazgos**, de los que
`formatos.mjs`, `formatos.test.mjs` y este reporte aportan **0**. Ese cero costó
tres arreglos, todos por la misma regla —*no contradigas la tesis con tu propia
obra*—: el reporte citaba sus propios falsos positivos en un bloque de código
(+7), el detector se cazaba con una constante `ID_POR_CLAVE`, cuatro comentarios
de `formatos.mjs` citaban las formas que el detector busca (+4), y en la segunda
vuelta dos más —una fila de una tabla de este reporte y un vector de test— (+2).
Cada vez lo detectó la misma medición, no una revisión.

`npm run lint` no se pudo correr: no hay `eslint` en esta máquina (§5).

## 13 · Ficheros

| fichero | qué |
|---|---|
| `scripts/gates/formatos.mjs` | **nuevo** — analizadores de JSON, JSONL, YAML de bloque, Dockerfile y lexer de código; `NoEntiendo`, la retirada y el marcado OPACO |
| `scripts/gates/claves.mjs` | `hallazgosEstructurales`, encaminamiento con retirada, `esHuecoEstructural`, `esNombreDeIdentidad`, ancla cerrada, compilación izada sin `g` ni `y`, límites 6 y 7 de la cabecera reescritos |
| `test/gates/formatos.test.mjs` | **nuevo** — 31 tests |
| `test/gates/claves.test.mjs` | cifras del léxico actualizadas |
