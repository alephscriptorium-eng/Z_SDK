# WP-U269 — el detector de claves deja de adivinar y PARSEA

Rama `wp/u269-detector-con-parseo`, worktree `C:/S_LAB/wt/z-u269`.
Continúa el límite 6 que `WP-U231` dejó abierto **a propósito**, para no entrar
en carrera armamentística de expresiones regulares.

**Quinta entrega.** Y el patrón que hay que mirar ya no son los agujeros del
detector: son **los instrumentos con los que digo haberlos cerrado**.

| vuelta | la frase | lo que la rompió |
|---|---|---|
| 1.ª | «la retirada nunca a silencio» | `flujoYaml` devolvía `null` al no entender |
| 2.ª | «la duda se lanza, **siempre**» | un `catch` en `camposDeCodigo` se la comía |
| 3.ª | «0 de 9 clases perdidas» | eran 8; una era media clase que yo daba por cerrada |
| 4.ª | «las salidas silenciosas son exactamente las auditadas» | el instrumento contaba **sintaxis**, no salidas |
| 5.ª | «esto no se evade porque no hay lista que evadir» | **la ley entera se sustituye por `return []` y nada enrojece** |

Tres instrumentos seguidos —censo de mutación, recuento sintáctico, ley de
conservación— **que nadie podía matar**, escritos por alguien que cita en el
propio WP que *una regla que nadie puede matar no vigila nada*. Esta vuelta lo
cierra: el censo mata ahora también al fichero de test, y la ley tiene el
analizador **inyectable** para poder mutilarlo (§3).

---

## 1 · El antes y el después

```
$ node <scratchpad>/densidad.mjs C:/S_LAB/wt/z-u269 --detalle

ANTES  (detector de U231, de main)   1763 trackeados · HALLAZGOS: 135 en 77 ficheros
DESPUÉS (con analizadores)           1763 trackeados · HALLAZGOS:  88 en 50 ficheros
```

**135 → 88.** Bruto: **50 se van, 3 llegan**. Sube de 83 a 88 respecto a la
vuelta anterior, y **sube a propósito**: son cinco líneas más que el suelo opaco
recupera al cerrar B7, y **las cinco las señala `main` también**. Es el mismo
intercambio de siempre en este WP: prefiero ruido que `main` ya tenía a silencio
que sólo tendría yo.

Los 3 que llegan son los declarados desde la 2.ª vuelta (una constante de
VERSIÓN con `CREDENCIAL` en el nombre, un `token_env` cuyo valor es el NOMBRE de
una variable de entorno, un `approvalToken` de fixture). No los cierro: pedirían
una lista de sufijos inocentes.

---

## 2 · B7 — cuarta aparición de la misma clase

La rama de expresión regular de `camposDeCodigo` consumía el literal entero y
**no emitía campo ni marcaba opaco**: `i = k; continue;`. La misma forma que B1,
B3 y B5 — una salida que no lanza y no marca.

```
$ node <scratchpad>/u269-w-b7.mjs <claves.mjs de main>
caso                                     main rama lanza
regex simple                                1    1    no
regex con bandera                           1    1    no
regex dentro de un return                   1    1    no
regex en una clase de caracteres            1    1    no
CONTROL literal                             1    1    no

PIERDE vs main: 0 de 6
```

Arreglo: el mecanismo que ya existía —marcarla `opaco`—. Una expresión regular
es texto que el lexer **reconoce pero no entiende**, que es la definición de
opaco.

**Y cayó exactamente donde yo había declarado el punto débil.** No es una
casualidad afortunada: §8.7 de la vuelta anterior decía que la ley 1 salta el
código y que allí sólo cubre la ley 2. Lo escribí, y aun así entregué con el
agujero dentro. Declarar un hueco no es cerrarlo.

---

## 3 · B8 — el guardián que vigila no estaba vigilado

La ley se podía apagar entera sin que nada lo notase:

| mutante | suite ANTES | suite AHORA |
|---|---|---|
| `violacionesDeConservacion` → `return []` siempre | **verde** | **ROJO** (M31, 3 tests) |
| ley 1 apagada | **verde** | **ROJO** (M32, 2 tests) |
| ley 2 apagada | **verde** | **ROJO** (M33, 1 test) |

**Causa**: mi control positivo no llamaba a la función. Simulaba la idea con un
`heno` escrito a mano — comprobaba el concepto, no la implementación. Es la
misma familia que «probar la función no es probar el camino», aplicada al
instrumento en vez de al código.

**Arreglo**: `violacionesDeConservacion(texto, formato, analizar = camposDe)`.
Con el analizador inyectable, tres controles **llaman a la función de verdad**:

- un analizador **mutilado** que se traga una línea → la ley 1 tiene que verlo;
- un analizador que juzga un blob **como átomo** (la forma exacta de B3) → la
  ley 2 tiene que verlo;
- uno que **lanza** → conserva, frente a otro que **calla** → viola. Que lanzar
  cuente como conservar tiene que ser por lanzar, no porque la ley no mire.

Y **el censo de mutación muta ahora también `test/gates/`**, que es donde vive
la ley. Un instrumento que sólo se puede matar desde fuera del alcance del censo
no está vigilado.

### 3.1 · La ley salió de su fichero de test

Vive en `test/gates/conservacion.mjs`. La demostración de que caza corre **fuera
de la suite**, y si usara una copia de la ley, copia y ley podrían divergir sin
que nadie lo notara. Ahora las dos importan el mismo módulo.

### 3.2 · Hasta dónde llega la ley, medido

La frase que la vuelta pasada era más ancha que mi evidencia, sustituida por la
que sí mido:

> **La ley cubre los formatos de datos por cobertura de tokens, y el código sólo
> por la ley 2. Lo que en código no llega a ser campo no lo mira nadie.**

Demostrado revirtiendo cada arreglo, en procesos hijo:

```
$ node <scratchpad>/u269-w-ley-demo.mjs
SIN REVERTIR (arbol entregado)                        corpus: 0 · bateria: 0/16

B1 completo · las dos mitades a la vez                corpus: 0 · bateria: 2/16
B1a solo · flujoYaml devuelve null (no basta)         corpus: 0 · bateria: 0/16
B1b solo · parYaml pierde la clave (no basta: lanza)  corpus: 0 · bateria: 0/16
B3 · el literal de codigo deja de marcarse opaco      corpus: 3 · bateria: 2/16
B5 · el comentario dentro de la continuacion se tira  corpus: 0 · bateria: 1/16
B7 (DECLARADO: la ley NO llega) · la regex            corpus: 0 · bateria: 0/16
   ^ la ley NO lo caza, y esta declarado: lo cubre el canario u269-w-b7.mjs
m6 · el `%` vuelve a saltarse en silencio             corpus: 0 · bateria: 1/16

agujeros REALES que la ley caza SIN buscarlos: 4 de 4
```

**La ley caza cuatro de cinco y NO caza B7.** Lo digo así, con la cifra, en vez
de decir que caza. Los dos «solo» son controles: media reversión no es un
agujero y la ley acierta al no señalarlos.

---

## 4 · Censo de mutación: 35 mutantes, 0 vivos

| bloque | resultado |
|---|---|
| M1–M29 (vueltas 1-4) | rojos |
| **M30** · B7: la regex deja de marcarse opaca | rojo |
| **M31** · **la LEY entera devuelve vacío** | **rojo (3 tests)** |
| **M32** · **la LEY 1 apagada** | **rojo (2 tests)** |
| **M33** · **la LEY 2 apagada** | **rojo (1 test)** |
| **M34** · m11: la clave de deduplicación pierde la línea | rojo |
| **M35** · m12: el lexer no reconoce el cierre de la regex | **sobrevive — INERTE, declarado** |

**Piezas sin guardián, declaradas y medidas** (dos, y las dos sin carga):

- `trozosDocker` ignorando las comillas (m7, 4.ª vuelta): cuatro formas se
  siguen cazando.
- **m12 · el cierre de la expresión regular**: si el lexer deja de reconocerlo,
  todo lanza → retirada → **más** cobertura, no menos. **Falla hacia el lado
  seguro**, que es la única razón por la que se admite sin guardián.

El censo las trata aparte: si alguna **enrojece**, es que ha ganado carga.

---

## 5 · Menores

- **m10 · el `heno` no llevaba separador**, y era peor de lo que parecía: la
  línea tenía un byte de control **`\x01` crudo**, invisible, que es por lo que
  se lee como `join('')`. **Es la segunda vez que entrego un byte de control
  invisible** (la primera fue el NUL de m2). Sustituido por `join('\n')` visible,
  y **barridos los cinco ficheros entregados**: 0 bytes de control en todos.
- **m11 · cerrado**: la clave de deduplicación lleva la línea, con guardián
  (M34). Sin ella el corpus baja de 88 a ~61 sobre los mismos ficheros: no se
  pierde seguridad —el gate sigue rojo— pero **se pierde informe**, y el
  operador se queda sin saber cuántas fugas hay ni dónde.
- **m12 · registrada** como pieza inerte, §4.
- **m13 · scratchpad**: todo lo mío va ya con prefijo `u269-w-`. Los ficheros del
  revisor no se han tocado; el que me faltaba (`u269-ley.mjs`) no se recuperó y
  su contenido vive ahora en `test/gates/conservacion.mjs`, que es donde tenía
  que haber estado.
- **La corrección que agradezco**: el ataque de «un valor mal leído pero
  contabilizado» no produce regresión, porque `main` tampoco los caza. La puerta
  que declaré abierta no da a ninguna pérdida. Queda declarada igual, pero sin
  coste.

---

## 6 · Lo demás

- **No hay dependencia nueva.** El gate no necesita `node_modules`.
- **La ley entra en CI**: `test:gates` está en `ci.yml:47` y `release.yml:52`.
- **Coste**: 1648 ms contra 2810 de `main`, por debajo de la mitad.
- **Higiene verificada en el blob**: NUL=0, CRLF=0, 0 bytes de control.

---

## 7 · Qué límite queda declarado

1. **La ley 1 no se aplica a código.** En código la cobertura la da sólo la ley
   2, que inspecciona valores de campos: **lo que no llega a ser campo no lo
   mira nadie**. Es el hueco por el que entró B7 y **sigue siendo el punto más
   débil**; lo tapan los canarios de literal, comentario y regex, que son una
   lista de formas y por tanto evadibles.
2. **La ley no demuestra que los analizadores sean correctos**, sólo que no
   pierden entrada. Un valor mal leído pero contabilizado la satisface —y está
   medido que eso no produce regresión frente a `main`.
3. **Markdown, `.env` y texto plano no se analizan**: **22 de los 88 están en
   `.md`**.
4. **Los 3 falsos positivos de §1** y los **10 de los ficheros del WP** (2 en
   `claves.mjs`, 8 en el test: un corpus que prueba un detector de secretos
   contiene cadenas con forma de secreto).
5. **Frase de paso con espacios literales**, **tirada en mayúsculas sin
   separador** (`AUTHTOKEN`), **ficheros >1 MiB**, y el **subconjunto de YAML**
   (anclas, alias, etiquetas, claves complejas, fusión, flujo multilínea).
6. **Dos piezas sin guardián**, ambas sin carga y ambas fallando hacia el lado
   seguro (§4).
7. **Sigue sin haber entropía ni lista de excepciones.** Lo que el WP no toca, y
   U231 ya declaraba: historial de git, tarball de npm, UTF-16, contextos de
   build que no sean el directorio de la receta ni la raíz.

---

## 8 · Estado de las comprobaciones

```
$ node scripts/gates/run.mjs                  ->  gates: OK (0 offenders) · rc=0
$ node --test test/gates/*.test.mjs           ->  199 tests · 199 pass · 0 fail
$ node <scratchpad>/u269-mutar.mjs            ->  35 mutantes · 0 vivos · rc=0
$ node <scratchpad>/u269-w-ley-hijo.mjs       ->  CORPUS=0 BATERIA=0/16
$ node <scratchpad>/u269-w-ley-demo.mjs       ->  4 de 4 agujeros cazados a ciegas · rc=0
$ node <scratchpad>/u269-b1-cli.mjs           ->  0 de 8 formas se escapan
$ node <scratchpad>/u269-b2.mjs               ->  0 de 9 clases perdidas
$ node <scratchpad>/u269-b3.mjs               ->  0 de 10 pierde vs main
$ node <scratchpad>/u269-b5.mjs               ->  0 de 4 pierde vs main
$ node <scratchpad>/u269-w-b7.mjs             ->  0 de 6 pierde vs main
```

## 9 · Ficheros

| fichero | qué |
|---|---|
| `scripts/gates/formatos.mjs` | analizadores de JSON, JSONL, YAML de bloque, Dockerfile y lexer de código; `NoEntiendo`, la retirada, los **nueve** valores opacos y la contabilidad de claves consumidas |
| `scripts/gates/claves.mjs` | `hallazgosEstructurales`, encaminamiento con retirada, `esHuecoEstructural`, `esNombreDeIdentidad` |
| `test/gates/conservacion.mjs` | **nuevo** — la ley de conservación, fuera del fichero de test para que la demostración no use una copia |
| `test/gates/formatos.test.mjs` | 39 tests, incluidos los tres que **matan a la ley** y comprueban que se nota |
| `test/gates/claves.test.mjs` | cifras del léxico actualizadas |
