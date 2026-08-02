# WP-U269 — el detector de claves deja de adivinar y PARSEA

Rama `wp/u269-detector-con-parseo`, worktree `C:/S_LAB/wt/z-u269`.
Continúa el límite 6 que `WP-U231` dejó abierto **a propósito**, para no entrar
en carrera armamentística de expresiones regulares.

---

## 0 · Lo primero: el denominador cambió y las cifras del encargo caducaron

El encargo cita «90 hallazgos en 1741 ficheros trackeados». **Ninguna de las dos
cifras se sostiene sobre este árbol**, y una de ellas tampoco sobre el reporte
del que salía:

| cifra | de dónde venía | medido hoy |
|---|---|---|
| ficheros trackeados | 1741 (U231 §2.7) | **1759** |
| hallazgos con el detector de U231 | «90» en el encargo; **121** en U231 §2.7 | **125** |

O sea: el encargo cita un 90 que no aparece en el reporte de U231 —allí la cifra
con el léxico elegido es 121— y el árbol ha crecido 18 ficheros desde entonces.
Las mediciones de abajo son todas **re-medidas en este árbol**, con la orden
exacta escrita al lado, y el denominador va en cada una.

---

## 1 · El antes y el después, con denominador y con la orden exacta

La orden es la misma en los dos casos y **sólo se cambia el detector**: se
extrae el de `HEAD` a un temporal y se apunta ahí la variable `DETECTOR`.

```
$ node <scratchpad>/densidad.mjs C:/S_LAB/wt/z-u269 --detalle
```

`densidad.mjs` recorre `git --no-optional-locks ls-files`, llama a
`hallazgosEnFichero` sobre cada fichero regular y cuenta. No usa `wc -l` sobre
una tubería: cuenta en proceso y devuelve `rc` propio, que se comprueba aparte.

```
ANTES  (detector de U231, extraído de HEAD)
  ficheros trackeados: 1759 · inspeccionados: 1759 · saltados: 0
  HALLAZGOS: 125 en 75 ficheros
    campo-identidad 122 · url-con-credencial 2 · pem-privada 1

DESPUÉS (detector con analizadores)
  ficheros trackeados: 1759 · inspeccionados: 1759 · saltados: 0
  HALLAZGOS: 52 en 37 ficheros
    campo-identidad 49 · url-con-credencial 2 · pem-privada 1
```

**125 → 52 sobre 1759 ficheros trackeados.** Y como un total puede bajar
tapando aciertos, va también el **diff de conjuntos**, que es lo que de verdad
responde:

- **75 hallazgos desaparecen.**
- **2 hallazgos aparecen.**

### 1.1 · Los 75 que desaparecen: ninguno era material

Agrupadas por la línea que las producía, las clases son cuatro y todas son la
misma cosa: **el valor no era un literal**.

- **8 veces**, la asignación del resultado de `resolveMcpApprovalToken()` a una
  constante llamada `token`; **2 más** con `resolveScriptoriumSecret()`.
- **4 veces**, una propiedad `token` cuyo valor es el acceso a miembro
  `cfg.token`; y variantes con `??`, con `||` y con encadenamiento opcional.
- **2 veces**, la anotación de tipo de un parámetro `privateKey`
  (`KeyObject`, unión con `string` y `Buffer`), y una vez la de `auth` como
  `Record` — ésta **dentro de un comentario JSDoc**.
- **5 veces**, el TÍTULO de un `test(...)` que contiene la palabra `clave` en
  castellano corriente («fichero que no rinde clave»).
- el resto, llamadas como `assertIntentRole(...)` asignadas a una variable
  `auth`, y prosa de comentarios.

**Ninguna de las 75 líneas contiene un literal de cadena con material.** Se
listaron todas y se leyeron todas.

> Estas líneas van descritas en prosa y **no citadas literalmente**, y la razón
> es el límite 1 de §9: el barrido crudo sigue mirando el Markdown, así que un
> reporte que cite sus propios falsos positivos **los vuelve a crear**. La
> primera versión de este párrafo los citaba en un bloque de código y añadía
> **7 hallazgos** al árbol — o sea, contradecía con su propia obra la tesis del
> WP. Está medido en §10.

### 1.2 · Los 2 que aparecen: los declaro, y son falsos positivos míos

```
packages/engine/embajador-kit/src/tipos.mjs:27   export const CREDENCIAL_VERSION = 'embajador/1';
packages/mesh/linea-editor/src/editor-server.mjs:91   token_env: 'ZEUS_MCP_APPROVAL_TOKEN',
```

Los dos son **nombres compuestos** que el barrido de línea no veía —su patrón
exige que el léxico llegue pegado a los dos puntos, y aquí llega `CREDENCIAL_` y
`token_`— y que el analizador sí ve, porque juzga el nombre del campo entero.
El primero es una versión; el segundo es **el nombre de una variable de entorno**,
no su valor. **No los he cerrado**, y no por descuido: cerrarlos pedía una lista
de sufijos inocentes (`_VERSION`, `_env`), que es exactamente el instrumento del
que este WP intenta salir. Quedan declarados como coste.

---

## 2 · Las tres formas del enunciado, cazadas con analizador

Estaban las tres abiertas. Se comprueba primero que **escapaban**:

```
$ node --input-type=module -e "… hallazgosEnTexto(t).length …"
1 array JSON          -> 0 hallazgos
2 YAML block scalar   -> 0 hallazgos
3 Dockerfile ENV sin = -> 0 hallazgos
```

Y ahora se cazan **por el CLI lanzado como proceso**, no llamando a la función
—U231 pagó caro esa diferencia: su test del detector aislado pasaba porque allí
la cadena nunca toca el disco—. Sembradas en el árbol de volúmenes **real** y
corriendo el gate de verdad:

```
$ node scripts/gates/run.mjs
gates: FAIL (6 offender(s))
  [clave-en-volumen] VOLUMES/DISK_02/LINEAS/u269-ctrl.json:3       — campo-identidad
  [clave-en-volumen] VOLUMES/DISK_02/LINEAS/u269-ctrl.yaml:3       — campo-identidad
  [clave-en-volumen] VOLUMES/DISK_02/LINEAS/u269-ctrl.Dockerfile:2 — campo-identidad
  [contexto-imagen]  VOLUMES/DISK_02/LINEAS/u269-ctrl.Dockerfile:2 — campo-identidad
  [contexto-imagen]  … no hay .dockerignore en un contexto plausible (x2)
GATES rc=1

$ rm VOLUMES/DISK_02/LINEAS/u269-ctrl.*   &&   node scripts/gates/run.mjs
gates: OK (0 offenders)
GATES rc=0
```

**Control positivo cumplido**: el verde de este árbol es un verde que mira. Los
tres testigos enrojecen el gate real y su retirada lo devuelve a verde; el
`Dockerfile` además arma `contexto-imagen`, que es la regla de U231 haciendo su
trabajo. Los testigos eran ficheros sin trackear y se borraron
(`git status` quedó limpio salvo la obra).

Cómo se caza cada una, y por qué no es una expresión regular:

1. **Array JSON.** `scripts/gates/formatos.mjs` trae un analizador descendente
   recursivo de JSON **con posición** (no `JSON.parse`, que tira la línea). Un
   elemento de array **hereda el nombre de la clave del array**: eso es lo que
   pone `{"tokens": ["…"]}` bajo el nombre `tokens`.
2. **Escalar de bloque YAML.** Analizador del subconjunto de bloque: indentación,
   comentarios respetando comillas, `|`/`>` con sus indicadores, colecciones de
   flujo y secuencias. El cuerpo del bloque son **las líneas siguientes**, y eso
   ninguna expresión regular de una línea puede verlo.
3. **`ENV API_KEY valor` sin `=`.** Analizador de instrucciones de Dockerfile
   con continuaciones de línea y directiva `escape`. Aquí no hace falta ningún
   separador: **lo dice la gramática de la instrucción**.

---

## 3 · La decisión que había que escribir: NO hay dependencia nueva

`package.json` no gana ni una línea. No hay `yaml` ni `js-yaml`, y la razón no
es de gusto:

- **El gate no debe necesitar `node_modules`.** U231 cerró un hueco exactamente
  por ahí: su guardián de espacios irregulares se escribió sin dependencias
  porque el agujero por el que entró un lint no pasado fue depender de que las
  dependencias estuvieran instaladas. Ese guardián sigue vivo y ahora cubre
  también `formatos.mjs` — comprobado, pasa.
- **El `npm ci` de esta máquina está incompleto**, y lo verifiqué en vez de
  suponerlo: `node_modules/.bin/eslint` **no existe**. O sea que `npm run lint`
  no se puede correr aquí, y una dependencia de gate sería un modo de fallo que
  no se observa donde se trabaja.

Lo que sí escribo, porque es el precio: **aquí no se implementa YAML**, se
implementa el subconjunto de bloque que este árbol usa. Anclas, alias,
etiquetas, claves complejas, claves de fusión y flujo multilínea **no se
modelan**, y cuando aparecen el analizador **lanza `NoEntiendo` y se retira al
barrido crudo de U231**. Sobre este árbol la retirada se dispara 8 veces de 1138
ficheros con formato conocido:

```
con formato conocido: 1138 · analizados OK: 1130 · retiradas: 8
   5 x json: valor no reconocido "/* To learn "   (JSON con comentarios)
   1 x json: valor no reconocido "// presentat"
   1 x codigo: expresion regular sin cerrar
   1 x yaml: ancla o alias no modelado
```

**La retirada es la pieza de seguridad del diseño.** Parsear sólo puede quitar
falsos positivos sobre lo que se entiende; sobre lo que no se entiende se sigue
mirando como antes. Un fallo de `formatos.mjs` degrada a la vigilancia anterior,
nunca a silencio — y eso tiene test y tiene mutante (M6, abajo).

---

## 4 · Los siete falsos positivos de U231, y los gemelos que sí caen

Los siete están en `test/gates/claves.test.mjs` (U231) y **entran otra vez** en
`test/gates/formatos.test.mjs` por el camino NUEVO, que es distinto y puede
romperlos de otra manera. **Y rompió uno**: el reparto de colecciones de flujo
sacaba `DB_PASSWORD` de dentro de `{{DB_PASSWORD}}` y lo denunciaba. Un mapa de
flujo sólo tiene parejas `clave: valor`; cuando un elemento no lo es, eso no es
YAML sino una plantilla incrustada, y el analizador **se retira**.

Los siete se comprueban tres veces: por el analizador de YAML, **por el CLI
sembrados en un volumen**, y por el analizador de JSON.

Y para que «más preciso» no signifique «más flojo», cada clase lleva su gemelo
que **sí** cae (`LA PRECISIÓN NO SE COMPRÓ AFLOJANDO`): URL con un tramo de 24
caracteres de material, kebab sin palabra de configuración
(`correct-horse-battery-staple`, que es una frase de paso real), ruta punteada
sin el punto inicial, i18n que no repite su etiqueta, plantilla **incompleta**
(`{{DB_PASSWORD` sin cerrar no es una plantilla), array JSON con material y
`ENV` de espacio con material.

---

## 5 · Un fallo real encontrado de camino: el «léxico anclado» no anclaba

`LEXICO_IDENTIDAD.source` es una alternancia de **primer nivel sin paréntesis**.
Interpolarla a pelo entre un lookbehind y un lookahead ata el lookbehind **sólo
a la primera alternativa** y el lookahead **sólo a la última**; las de en medio
quedan sin ancla ninguna. Medido:

```
              roto    bien
author        true    false     (por `auth`)
tokenizer     true    false     (por `token`)
secretaria    true    false     (por `secreta`)
xxpwdyy       true    false     (por `pwd`)
clave         true    true      (las trece de U231 siguen dentro)
```

Sobre este árbol eran **once falsos positivos en campos `author`** de
`ssb-log.json`, `ssb-feed-log.json` y un `package.json` — donde un autor de SSB
es una identidad **pública**. Se cierra con un `(?:…)`. No cambia qué palabras
están en el léxico: las trece que U231 midió siguen casando, y hay test que lo
fija en las dos direcciones.

---

## 6 · Qué negativos verifiqué DESACTIVANDO su guardián, y qué vi

Un negativo no está verificado hasta que se desactiva su guardián y se comprueba
que enrojece — separando **«nadie disparó»** de **«saltó OTRO guardián»**.

### 6.1 · Censo de mutación sobre la obra de este WP

Se rompe una pieza cada vez y se corre `test/gates/formatos.test.mjs` +
`test/gates/claves.test.mjs`. Línea base verde comprobada antes de empezar.

| mutante | tests rojos | qué demuestra |
|---|---|---|
| M1 · el ancla del léxico vuelve a estar rota | 1 | `author` vuelve a ser un hallazgo |
| M2 · el array JSON no hereda el nombre de su clave | 3 | forma 1 |
| M3 · el escalar de bloque no recoge el cuerpo | 2 | forma 2 |
| M4 · Dockerfile pierde la forma de espacio | 3 | forma 3 |
| M5 · el mapa de flujo no se retira ante `{{VAR}}` | 3 | el 1.º de los siete FP |
| M6 · la retirada se vuelve silencio (`return []`) | 4 | la retirada |
| M7 · el lexer no distingue comentarios | 1 | el lexer |
| M8 · el espacio interior deja de marcar prosa | 5 | el clasificador |

**Los ocho enrojecen.** Y no enrojecían al principio: **M3 y M7 salieron con
`rc=0` en la primera pasada** —«NADIE enrojeció»—, o sea que dos piezas no las
vigilaba nadie y dos tests estaban verdes sin medir lo que decían medir:

- **M3**: el test de la forma 2 pasaba **por otro camino**. Con el cuerpo del
  bloque de una sola línea, la herencia de nombre del escalar suelto lo caza
  igual, sin necesidad de analizar el bloque. El test estaba verde y el bloque
  sin vigilar. Se sustituyó por dos que **sólo** el análisis de bloque hace
  pasar: que un cuerpo de dos líneas es **una** fuga y no dos, y que el cuerpo
  no se lee como pares `clave: valor`.
- **M7**: no había ningún test que exigiera distinguir comentarios.

Perseguir M3 destapó **un agujero que iba a introducir yo**: si el cuerpo de un
bloque es el valor de su clave, un `run: |` de CI con `export API_KEY=…` dentro
quedaba **tapado por el análisis**, porque `run` no es un nombre de identidad. Se
cerró marcando el cuerpo del bloque como **opaco** —texto incrustado de un
lenguaje que este módulo no analiza— y barriéndolo **además** en crudo. Tiene
test (`un run: | de CI no se tapa`) y es lo que hace enrojecer M3.

### 6.2 · La ausencia sigue siendo ruidosa

La guardia de U231 no se relaja por venir por otra puerta: `hallazgosEstructurales`
con lista de patrones vacía, `null` o `Object.freeze([])` **lanza `TypeError`**, y
la retirada **no se lo traga** (sólo perdona `NoEntiendo`). Con test.

---

## 7 · Coste

Medido en proceso, con caché de disco caliente, mismo listado de ficheros,
mínimo de 3 corridas — porque el `npm run gates` de punta a punta en esta
máquina es **demasiado ruidoso para afirmar nada** (rango 1,9 s – 10,5 s para
las **dos** versiones; las medianas no se separan):

```
HEAD   min 4333 ms · 125 hallazgos
U269   min 1783 ms ·  52 hallazgos
```

El detector **baja a menos de la mitad**. Buena parte no es del análisis sino de
un punto caliente que estaba en `hallazgosEnTexto`: compilaba
`new RegExp(p.re.source, …)` **una vez por línea y por patrón**. Se iza fuera del
bucle. Sin la bandera `g` el `exec` no arrastra `lastIndex`, así que izarla no
puede cambiar un resultado — y se comprueba, no se argumenta: la medición de
densidad da **el mismo conjunto de 52, diff de 0 líneas**, antes y después de
izarla.

---

## 8 · El léxico, re-medido (las cifras de U231 caducaron dos veces)

Caducaron por el árbol (1741 → 1759) y por el detector (barrido → análisis).
Mismo detector, mismo corpus, moviendo **sólo** el léxico:

```
$ node <scratchpad>/lexico.mjs
sin `clave` ni `key` a secas   ->   47 hallazgos
con `clave` (EL ELEGIDO)       ->   52 hallazgos      (+5)
con `clave` y `key`            ->  184 hallazgos    (+132)
denominador: 1759 ficheros trackeados
```

**Aviso sobre esta medición, porque la primera salió mal y parecía bien:** las
tres variantes daban 52. El temporal de cada variante se nombraba con un hash
truncado del título, y «con `clave` (EL ELEGIDO)» y «con `clave` y `key`»
comparten los seis primeros bytes: mismo fichero, y **la caché de módulos de ESM
devolvía la primera variante para la tercera**. Tres cifras idénticas con pinta
de resultado. Se detectó porque el resultado era *demasiado* limpio y se
contrastó con una comprobación independiente (la variante con `key` encuentra 10
hallazgos en `ssb-log.json`, donde la elegida encuentra 0).

La decisión de U231 **no cambia**: `key` cuesta veintiséis veces más que `clave`
porque en YAML/JSON `key:` es vocabulario general de mapa. Parsear bajó las tres
cifras (eran 104 / 121 / 300) y no movió la conclusión. Las cifras del módulo y
del test están actualizadas.

---

## 9 · Qué límite queda declarado

Escrito aquí y en la cabecera de `formatos.mjs`, porque un gate es lo más fácil
de sobrevender.

1. **Markdown, `.env` y el texto plano no se analizan.** Siguen en barrido crudo,
   intacto. **22 de los 52 hallazgos de hoy están en `.md`** y son prosa de
   reportes. Es la bolsa de ruido que queda sin tocar.
2. **Un `campo-identidad` COMENTADO en código ya no se caza.** Precio de excluir
   los comentarios, que es de donde salía buena parte del ruido. Lo que **no** se
   pierde: los patrones por FORMA (PEM, JWT, token de proveedor,
   `usuario:clave@`, SSB) siguen barriendo el texto entero, comentarios
   incluidos. Hay test que fija las dos mitades.
3. **Una frase de paso con espacios LITERALES no se caza.** Con el valor entero
   delante, «tiene un espacio dentro» es la señal que separa prosa de material.
   Con guiones sí se caza, y es el gemelo que lo prueba. Tiene test propio.
4. **Los dos falsos positivos de §1.2 siguen ahí**, y cerrarlos pedía una lista
   de sufijos inocentes. No la abro.
5. **Ficheros de más de 1 MiB no se analizan**: van por el camino troceado de
   U231, que es el conservador. Un analizador no puede trabajar sobre un tramo.
6. **YAML es un subconjunto**: anclas, alias, etiquetas, claves complejas, claves
   de fusión y flujo multilínea se retiran al barrido crudo. 8 retiradas de 1138
   ficheros hoy.
7. **Sigue sin haber detección por entropía**, y por la razón medida de U231: el
   árbol está lleno de sha256 legítimos.
8. **Sigue sin haber lista de excepciones** para estas tres reglas. No la he
   tocado ni la he necesitado: los dos falsos positivos nuevos se declaran, no se
   eximen. Y el detector se cazaba a sí mismo con una constante que llamé
   `ID_POR_CLAVE`; se **renombró**, que es lo que hay que hacer, en vez de
   exceptuarla.
9. **Lo que este WP NO toca** y U231 ya declaraba: el historial de git, el
   tarball de npm, UTF-16, y contextos de build que no sean el directorio de la
   receta ni la raíz.

---

## 10 · Estado de las comprobaciones

```
$ node scripts/gates/run.mjs                 ->  gates: OK (0 offenders) · rc=0
$ node --test test/gates/*.test.mjs          ->  182 tests · 182 pass · 0 fail
$ node --test test/gates/formatos.test.mjs   ->   22 tests ·  22 pass · 0 fail (nuevos)
```

**La medición, rehecha con la obra de este WP ya trackeada** —porque los tres
ficheros nuevos entran en el denominador y pueden ensuciar el numerador—:

```
ficheros trackeados: 1762 · HALLAZGOS: 52 en 37 ficheros
aporte de `formatos.mjs`, `formatos.test.mjs` y este reporte: 0 hallazgos
```

Ese cero costó dos arreglos, los dos por la misma regla —*no contradigas la
tesis con tu propia obra*—: el reporte citaba sus propios falsos positivos en un
bloque de código y añadía 7 (§1.1), y el detector se cazaba a sí mismo con una
constante que llamé `ID_POR_CLAVE`, renombrada en vez de exceptuada (§9.8).

`npm run lint` **no se pudo correr**: `node_modules/.bin/eslint` no existe en
esta máquina (§3). El guardián de espacios irregulares de U231 —que no necesita
`node_modules` y que cubre todo `.mjs` de `scripts/gates` y `test/gates`, o sea
también los dos ficheros nuevos— **pasa**.

## 11 · Ficheros

| fichero | qué |
|---|---|
| `scripts/gates/formatos.mjs` | **nuevo** — analizadores de JSON, JSONL, YAML de bloque, Dockerfile y lexer de código; `NoEntiendo` y la retirada |
| `scripts/gates/claves.mjs` | `hallazgosEstructurales`, encaminamiento por formato con retirada, `esHuecoEstructural`, el ancla del léxico cerrada, la compilación de expresiones izada, límites 6 y 7 de la cabecera reescritos |
| `test/gates/formatos.test.mjs` | **nuevo** — 22 tests: las tres formas por el CLI como proceso, control negativo, censo de mutación, los siete FP por dos analizadores, los gemelos, la retirada, los límites declarados |
| `test/gates/claves.test.mjs` | cifras del léxico actualizadas |
