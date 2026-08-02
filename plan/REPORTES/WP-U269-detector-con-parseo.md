# WP-U269 — el detector de claves deja de adivinar y PARSEA

Rama `wp/u269-detector-con-parseo`, worktree `C:/S_LAB/wt/z-u269`.
Continúa el límite 6 que `WP-U231` dejó abierto **a propósito**, para no entrar
en carrera armamentística de expresiones regulares.

**Cuarta entrega.** Cuatro devoluciones, **el mismo defecto mío las cuatro
veces**: una frase absoluta sobre una superficie que no había enumerado entera.

| vuelta | la frase | lo que la rompió |
|---|---|---|
| 1.ª | «la retirada nunca a silencio» | `flujoYaml` devolvía `null` al no entender |
| 2.ª | «la duda se lanza, **siempre**» | un `catch` en `camposDeCodigo` se la comía |
| 3.ª | «0 de 9 clases perdidas» | eran 8 pérdidas; una era media clase que yo enumeraba como cerrada |
| 4.ª | «las salidas silenciosas son exactamente las auditadas» | **el instrumento contaba dos formas sintácticas, no las salidas** |

La 4.ª es la que importa: **el instrumento que puse para no repetir el error lo
repitió**. Contar `return null` y `catch\s*\(` es una lista, y —como avisa la
doctrina de U231— *mientras el instrumento sea una lista, el mutante que la
evade existe*: `catch {` sin paréntesis la evadía, y también `return campos;`.

Así que esta vuelta el instrumento **deja de mirar el código y mira el
resultado**: una **ley de conservación** (§3). No se evade añadiendo una salida,
porque no hay lista que evadir. Y está **demostrado** que caza: revirtiendo cada
arreglo de este WP, la ley enrojece **sin conocerlos**.

---

## 1 · El antes y el después

Misma orden, sólo cambia el detector:

```
$ node <scratchpad>/densidad.mjs C:/S_LAB/wt/z-u269 --detalle

ANTES  (detector de U231, de main)   1762 trackeados · HALLAZGOS: 135 en 77 ficheros
DESPUÉS (con analizadores)           1762 trackeados · HALLAZGOS:  83 en 49 ficheros
```

**135 → 83.** Diff de conjuntos, **en bruto** (m8): **55 se van, 3 llegan**. El
neto que citaba antes como «+22» era eso, un neto; el bruto de aquella medición
era 23 que llegaban y 1 que se movía de línea (`claves.mjs:424`→`:433`,
desplazamiento por mis propias ediciones, no pérdida). Queda dicho.

Los 3 que llegan son los declarados en las vueltas anteriores —una constante de
VERSIÓN con `CREDENCIAL` en el nombre, un `token_env` cuyo valor es el NOMBRE de
una variable de entorno, y un `approvalToken` de fixture—. **No los cierro**:
pedirían una lista de sufijos inocentes.

---

## 2 · B5 — la 57.ª `continue`, tercera aparición de la misma clase

Un comentario **fuera** de una continuación de Dockerfile se marcaba opaco;
**dentro** de la continuación se tiraba. El mismo texto se barría o no según
dónde estuviera.

```
$ node <scratchpad>/u269-b5.mjs <claves.mjs de main>
caso                                                   main rama lanza
ENV con comentario dentro de la continuacion              1    1    no
RUN con comentario dentro de la continuacion              1    1    no
dos comentarios seguidos dentro de la continuacion        1    1    no
CONTROL: el mismo comentario FUERA de la continuacion     1    1    no

PIERDE vs main: 0 de 4
```

Arreglo: empujar el comentario como opaco antes del `continue`.

**El aviso de método sirvió**: la fixture se construye **por líneas**
(`['ENV A=1 \\', '# api_key=…'].join('\n')`), nunca con `printf`. Un `printf` no
produce la barra+salto y el intento sale verde, que parece prueba de que el
agujero no existe.

---

## 3 · B6 — de contar salidas a una LEY DE CONSERVACIÓN

Elijo **la vía que propones**, no la barata. (La barata también está, como
cinturón además de tirantes, y con el título acotado a lo que cuenta: §3.3.)

### 3.1 · La ley

No mira el código; mira el resultado de analizar una entrada.

- **Ley 1 · cobertura.** En un formato de **datos**, todo token candidato de la
  entrada tiene que aparecer en el nombre o en el valor de alguna campo. Si el
  analizador no lo mira, se perdió.
- **Ley 2 · anidamiento.** Ninguna campo NO opaca puede llevar dentro una forma
  `nombre: valor` con material sin que una campo OPACA la cubra. Juzgar un
  documento como si fuera un átomo es no juzgarlo.
- Si el analizador **lanza**, conserva por definición: quien llama se retira al
  barrido crudo y mira el fichero entero.

La ley 1 se aplica a JSON, JSONL, YAML y Dockerfile. **En código no**, y la
razón se escribe: allí un token suelto es un identificador (`defineConfig`,
`console.log`), no un dato; un secreto en código vive siempre dentro de un
literal o de un comentario, y de eso se ocupan la ley 2 y el canario de B3.

### 3.2 · Qué encontró, y qué demuestra

Aplicada al **corpus real** encontró tres huecos de contabilidad que nadie
buscaba: la clave que abre un bloque, la clave de un objeto JSON y **la clave
que lleva una colección de flujo** (`parameters: []`, `position: { x: 4 }`) no
se declaraban consumidas — seis ficheros de `spec/`. Cerrado emitiendo esas
claves con valor vacío (que es hueco por longitud: **cero impacto en detección**,
y hay mutante para cada una). Hoy:

```
$ node <scratchpad>/u269-ley.mjs --corpus
ficheros con formato conocido mirados: 1140
ficheros que VIOLAN la ley: 0
```

**Y la prueba de que no es decorado** — se revierte cada arreglo de este WP y se
mide la ley sobre el corpus y sobre una batería **genérica** de 15 formas de
configuración (no vectores de los bugs). Cada medición en un **proceso hijo**,
porque reutilizar el proceso hace que la caché de módulos de ESM devuelva el
`formatos.mjs` sin mutar y las reversiones salgan «0 violaciones» —me pasó, y es
el mismo error que ya me costó una medición del léxico—:

```
$ node <scratchpad>/u269-ley-demo.mjs
SIN REVERTIR (arbol entregado)                       corpus:    0 · bateria: 0/15

B1 completo · las dos mitades a la vez               corpus:    0 · bateria: 2/15
B1a solo · flujoYaml devuelve null (no basta)        corpus:    0 · bateria: 0/15
B1b solo · parYaml pierde la clave (no basta: lanza) corpus:    0 · bateria: 0/15
B3 · el literal de codigo deja de marcarse opaco     corpus:    3 · bateria: 2/15
B5 · el comentario dentro de la continuacion se tira corpus:    0 · bateria: 1/15
m6 · el `%` vuelve a saltarse en silencio            corpus:    0 · bateria: 1/15

agujeros REALES que la ley caza SIN buscarlos: 4 de 4
```

Dos cosas que decir de ahí, y las dos importan:

1. **B1 sólo se reproduce revirtiendo las DOS mitades.** Con `parYaml` bueno
   nunca se llega a la salida mala; con `flujoYaml` bueno la duda lanza y se
   retira. Medir las mitades por separado habría dado «la ley no lo caza», y
   habría sido falso. Los dos «solo» quedan como **controles**: media reversión
   no es un agujero, y la ley **acierta al no señalarlos**.
2. La ley tiene su propio **control positivo** en la suite: si el analizador se
   tragara una línea, la ley tiene que verlo. Sin eso, «0 violaciones» podría
   significar «la ley no mira».

### 3.3 · Lo que la ley NO es

No es una demostración de que los analizadores sean correctos. Es una
demostración de que **nada de la entrada se pierde sin que alguien lo mire**.
El test de recuento sintáctico se mantiene, **con el título acotado** —«las dos
clases siguen contadas», no «las salidas son exactamente las auditadas»— porque
avisa antes, al escribir el código y no al correr el corpus. Sus expresiones van
ensanchadas: `catch\s*[({]` cubre el binding opcional de ES2019, que era la
evasión.

---

## 4 · B1, B2, B3, del ciclo anterior

```
B1 (mapa de flujo YAML)          0 de 8 formas se escapan   (main: 8 de 8)
B2 (clases de pérdida vs U231)   0 de 9 clases perdidas
B3 (blob en literal de código)   PIERDE vs main: 0 de 10
```

Sobre los **+22** de B3, y ahora con tu propia medición que es más fuerte que la
mía: **23 de 23** hallazgos nuevos caen en líneas que `main` también señala. No
es ruido nuevo; es ruido que la rama estaba comprando con silencio.

---

## 5 · Censo de mutación: 29 mutantes

| bloque | resultado |
|---|---|
| M1–M17 (vueltas 1-3) | 17 rojos |
| M18–M24 (los cinco `throw` de m1, B3, m6) | 7 rojos |
| **M25** · B5: el comentario dentro de la continuación se tira | **rojo** |
| **M26** · `trozosDocker` ignora las comillas | **sobrevive — INERTE, declarado** |
| **M27** · YAML: la clave que abre bloque no se contabiliza | **rojo** (la ley) |
| **M28** · JSON: la clave no se contabiliza | **rojo** (la ley) |
| **M29** · YAML: la clave con colección de flujo no se contabiliza | **rojo** (la ley) |

**29 mutantes · 0 vivos · 0 no aplicados.**

**m7 · la pieza sin guardián y sin carga, registrada.** `trozosDocker` ignorando
las comillas deja la suite verde, y **no es load-bearing**: cuatro formas se
siguen cazando. Queda en el censo marcada `INERTE`, y el censo la trata aparte:
si algún día **enrojece**, es que ha pasado a tener carga y hay que mirarla. Es
el mismo trato que le di al quinto `throw` de m1.

Tres mutantes salieron vivos a lo largo del WP y hubo que escribirles guardián
(M3 y M7 en la 1.ª vuelta, M9 y M12 en la 2.ª, M15 en la 3.ª). El patrón que se
repite: **sobrevivían porque otro mecanismo tapaba el agujero** —seguridad
cubierta, precisión no—. El guardián correcto en esos casos exige que la pieza
se **entienda**, no que alguien lo cace.

---

## 6 · Menores de esta vuelta

- **m7 · cerrado**, ver §5.
- **m8 · cerrado**: el bruto va en §1 junto al neto.
- **m9 · las 57 `continue`, con su desenlace.** En la vuelta anterior las declaré
  sin demostrarlas **y B5 estaba dentro**. La cautela fue acertada; entregar con
  el agujero dentro, no. Desenlace:

  | grupo | n.º | desenlace |
  |---|---|---|
  | avance de índice en los escáneres (JSON, YAML, Dockerfile, lexer) | 51 | control de bucle: no saltan contenido, avanzan sobre él |
  | línea en blanco / directiva `%YAML`,`%TAG` / `---` | 4 | no hay contenido que perder |
  | `ARG X` y `ENV X` sin valor | 2 | no hay valor que juzgar |
  | **comentario dentro de una continuación de Dockerfile** | **1** | **era B5 — ahora marca opaco** |

  Y lo que sostiene la tabla no es la tabla: es que **la ley de conservación
  pasa sobre los 1140 ficheros del corpus**. Si alguna de las 51 perdiera
  contenido, la ley lo vería sin que yo la hubiera clasificado bien.

---

## 7 · Lo demás, sin cambios

- **No hay dependencia nueva.** El gate no necesita `node_modules`.
- **Retiradas**: 1141 con formato conocido, 1 supera 1 MiB (`package-lock.json`),
  de los 1140 restantes 1132 OK y 8 retiradas.
- **Coste**: 2356 ms contra los 4880 del detector que sustituye — el suelo opaco
  cuesta +27 % sobre la vuelta anterior y sigue en **la mitad** que U231.
- **Ficheros en LF y sin NUL**, verificado **en el blob** con `git cat-file`.

---

## 8 · Qué límite queda declarado

1. **Markdown, `.env` y texto plano no se analizan**: barrido crudo. **22 de los
   83 están en `.md`**.
2. **Una frase de paso con espacios LITERALES no se caza.** Con guiones sí.
3. **Los 3 falsos positivos de §1**, y los **10 de los ficheros del WP** (2 en
   `claves.mjs`, 8 en el test: un corpus que prueba un detector de secretos
   contiene cadenas con forma de secreto, por construcción).
4. **Una tirada en mayúsculas sin separador** (`AUTHTOKEN`) no se parte en
   palabras.
5. **Ficheros de más de 1 MiB** van por el camino troceado de U231.
6. **YAML es un subconjunto**: anclas, alias, etiquetas, claves complejas, claves
   de fusión y flujo multilínea **se retiran**.
7. **La ley 1 no se aplica a código.** Allí la cobertura la dan la ley 2 y el
   canario de literales y comentarios. Es el punto más débil de la
   demostración y por eso va escrito aquí y no enterrado.
8. **La ley no demuestra que los analizadores sean correctos**, sólo que no
   pierden entrada. Un valor mal leído pero contabilizado la satisface.
9. **`trozosDocker` no tiene guardián** (m7), declarado inerte y medido.
10. **Sigue sin haber entropía ni lista de excepciones.** Lo que este WP no toca,
    y U231 ya declaraba: historial de git, tarball de npm, UTF-16, contextos de
    build que no sean el directorio de la receta ni la raíz.

---

## 9 · Estado de las comprobaciones

```
$ node scripts/gates/run.mjs                 ->  gates: OK (0 offenders) · rc=0
$ node --test test/gates/*.test.mjs          ->  195 tests · 195 pass · 0 fail
$ node --test test/gates/formatos.test.mjs   ->   36 tests ·  36 pass · 0 fail
$ node <scratchpad>/u269-mutar.mjs           ->  29 mutantes · 0 vivos · rc=0
$ node <scratchpad>/u269-ley.mjs --corpus    ->  1140 ficheros · 0 violaciones
$ node <scratchpad>/u269-ley-demo.mjs        ->  4 de 4 agujeros cazados a ciegas · rc=0
$ node <scratchpad>/u269-b1-cli.mjs          ->  0 de 8 formas se escapan
$ node <scratchpad>/u269-b2.mjs              ->  0 de 9 clases perdidas
$ node <scratchpad>/u269-b3.mjs              ->  0 de 10 pierde vs main
$ node <scratchpad>/u269-b5.mjs              ->  0 de 4 pierde vs main
```

`npm run lint` no se puede correr: no hay `node_modules` en esta máquina.

## 10 · Ficheros

| fichero | qué |
|---|---|
| `scripts/gates/formatos.mjs` | analizadores de JSON, JSONL, YAML de bloque, Dockerfile y lexer de código; `NoEntiendo`, la retirada, los **ocho** valores opacos y la contabilidad de claves consumidas |
| `scripts/gates/claves.mjs` | `hallazgosEstructurales`, encaminamiento con retirada, `esHuecoEstructural`, `esNombreDeIdentidad`, ancla cerrada, compilación izada sin `g` ni `y` |
| `test/gates/formatos.test.mjs` | 36 tests, incluida la **ley de conservación** sobre el corpus real |
| `test/gates/claves.test.mjs` | cifras del léxico actualizadas |
