# WP-U269 — el detector de claves deja de adivinar y PARSEA

Rama `wp/u269-detector-con-parseo`, worktree `C:/S_LAB/wt/z-u269`.
Continúa el límite 6 que `WP-U231` dejó abierto **a propósito**, para no entrar
en carrera armamentística de expresiones regulares.

**Sexta entrega.** El historial de este WP en una tabla, porque es el hilo:

| vuelta | la frase | lo que la rompió |
|---|---|---|
| 1.ª | «la retirada nunca a silencio» | `flujoYaml` devolvía `null` al no entender |
| 2.ª | «la duda se lanza, **siempre**» | un `catch` se la comía |
| 3.ª | «0 de 9 clases perdidas» | eran 8; una era media clase que yo daba por cerrada |
| 4.ª | «las salidas son exactamente las auditadas» | el instrumento contaba **sintaxis** |
| 5.ª | «no hay lista que evadir» | la ley entera se apagaba sin que nada enrojeciera |
| 6.ª | «B7 cerrado: 0 de 6 pierde» | **la rama tenía cuatro formas más por el otro lado de la heurística** |

Las seis son la misma forma de error: **medir la lista que yo mismo escribí**.
Por eso esta vuelta el cierre **no es un cuarto canario**, que es lo que habría
traído la séptima devolución. Es una **invariante sobre las ramas del lexer**
(§2), que convierte B9 en imposible por construcción en vez de en la próxima
lista de formas.

---

## 1 · El antes y el después

```
$ node <scratchpad>/densidad.mjs C:/S_LAB/wt/z-u269 --detalle

ANTES  (detector de U231, de main)   1763 trackeados · HALLAZGOS: 145 en 77 ficheros
DESPUÉS (con analizadores)           1763 trackeados · HALLAZGOS:  98 en 51 ficheros
```

**145 → 98.** Bruto: **50 se van, 3 llegan** — y los 3 son exactamente los tres
declarados desde la 2.ª vuelta (una constante de VERSIÓN con `CREDENCIAL` en el
nombre, un `token_env` cuyo valor es el NOMBRE de una variable de entorno, un
`approvalToken` de fixture).

`main` sube de 135 a 145 y no es que `main` cambie: **son líneas de mi propio
fichero de test**, que crece con los vectores de B9. Los ficheros del WP aportan **22** hallazgos al recuento de `main` y **20** al mío.

*(Corrección de la vuelta anterior: dije «+5 y las cinco las señala main». El
bruto real que mediste era 12 nuevas y 7 que se iban, con 12 de 12 en líneas que
`main` también señala. Mi cifra era el neto otra vez.)*

---

## 2 · B9 — la invariante del lexer, no un cuarto canario

Tres familias, diez formas, **todas en silencio y todas invisibles para la ley**
—porque la ley 1 salta el código y la ley 2 sólo mira valores de campos—:

```
$ node <scratchpad>/u269-w-b9.mjs <claves.mjs de main>
caso                         main rama lanza ley        ANTES
F1 tras `)` / `]` / ident / llamada   1    0    no   0   <-- PIERDE (x4)
F2 decimal / hex / separador / BigInt 1    0    no   0   <-- PIERDE (x4)
F3 plantilla anidada / etiquetada     1    0    no   0   <-- PIERDE (x2)

                                                        DESPUÉS
PIERDE vs main: 0 de 12
```

### 2.1 · La invariante, y el censo de ramas que la sostiene

> **Toda rama del lexer que CONSUME entrada, o emite campo, o la marca opaca, o
> lanza. Ninguna consume y calla** — salvo las que declaran, con su nombre y su
> motivo, que lo que consumen no es dato.

**OCHO ramas** de primer nivel —siete `if` mas la caida final— con **DIEZ
desenlaces**, porque dos se bifurcan: la `/` en expresion regular o division, y
la corrida alfanumerica en numero o identificador. *(La quinta version de esta
tabla decia «nueve ramas» y listaba diez filas; en un documento cuya tesis es
«enumere la superficie entera», el numero y la lista tienen que cuadrar. El
recuento lo fija ahora un test sobre el fuente, no mi cuenta — m17.)*

| rama | consume | desenlace |
|---|---|---|
| salto de línea | 1 carácter | no es dato (declarada) |
| blanco | 1 carácter | no es dato (declarada) |
| `//` comentario de línea | hasta fin de línea | **OPACO** |
| `/* */` comentario de bloque | hasta el cierre | **OPACO**, o **LANZA** si no cierra |
| `/` expresión regular (heurística dice sí) | el literal | **OPACO**, o **LANZA** si no cierra |
| `/` división (heurística dice no) | 1 carácter | **OPACO** el tramo hasta la siguiente `/` de la línea ← **familia 1** |
| `"` `'` `` ` `` literal | el literal | **CAMPO** + **OPACO** + análisis JSON extra, o **LANZA** |
| corrida que empieza por DÍGITO | el número | **CAMPO si liga un nombre** (ver C1); si no liga, consume y no emite ← **familia 2 + C1** |
| corrida que empieza por letra (identificador) | el identificador | no es dato — **declarada**: un campo de identidad cuyo valor es un IDENTIFICADOR es una expresión, y quitarla es la precisión que este WP compró |
| puntuación | 1 carácter | no es dato (declarada) |

**Familia 1** no se arregla afinando la heurística: `(a+b)/c` y `x /re/g` son
ambiguos de verdad sin un analizador sintáctico entero. Se arregla aplicando la
doctrina que ya gobierna el módulo — **lo ambiguo se barre**: si hay otra `/` en
la misma línea, el tramo puede ser una expresión regular, así que se marca
opaco. El avance del lexer no cambia (sigue consumiendo un carácter), de modo
que no hay riesgo de desincronizar nada; lo único que cambia es que ese texto
deja de ser invisible. **Coste medido: cero falsos positivos sobre aritmética
corriente**, con test propio (`(a+b)/c`, `a / b / c`, `total/n`).

**Familia 2** es una asimetría que había creado yo: en la 3.ª vuelta arreglé
**esto mismo para JSON** —«el número TAMBIÉN es un valor»— y no para código.

**Familia 3** eran dos cosas distintas: la plantilla **etiquetada** perdía su
nombre porque `nombreAntesDe` no saltaba la etiqueta, y la plantilla
**anidada** se leía como un hueco `${VAR}` porque el patrón aceptaba
`[^}]*` como cuerpo. Ahora el cuerpo tiene que **parecer una referencia**
(identificador con puntos o corchetes), que es lo que cubre los casos reales
(`${ZEUS_SSB_PUB_URL}`, `${cfg.token}`).

---

## 2.2 · C1 — la celda decía más de lo que hacía el código, y qué se cerró

La fila «dígito → CAMPO» emitía **condicionalmente**: cuando `nombreAntesDe` no
ligaba, la rama consumía el número y no emitía nada —justo lo que la invariante
prohíbe, dentro de la fila que la tabla declaraba cumplidora—. Cuatro formas
perdían frente a `main`, todas `lanza=no`.

**Medido antes de decidir, y la medición parte la decisión en dos:**

| extensión de la ligadura | formas que recupera | coste medido |
|---|---|---|
| saltar el **signo unario** (`-`, `+`) | 3 de 4 | **cero falsos positivos** |
| saltar además el **`[` de apertura** | la 4.ª | **+1 falso positivo real** |

El falso positivo del corchete no es hipotético: `const SEMILLAS = ['REPO_ROOT',
…]` en `test/gates/arbol-inmutable.test.mjs`. `SEMILLAS` **es léxico de identidad
en castellano** (`semillas?`, que U231 metió a propósito) y el primer elemento
del array pasa a colgar de él.

**Decisión: se cierra el signo, que sale gratis; NO se cierra el corchete.** Tres
formas recuperadas por dos caracteres y cero coste; la cuarta queda declarada en
§C2 con las demás de su clase. Y un `-` **binario** no cuela por esto: en
`x = a - 123…` detrás del signo hay un operando, no un `=`.

*(El arreglo obvio —añadir el suelo opaco al número— ya lo habías descartado con
medición, y lo confirmo: la causa no es la invariante sino la ligadura.)*

## 2.3 · C2 — la regla de ligadura, entera

La 3.ª vuelta declaró «el valor de un campo es lo que se le asigna, no lo que
aparezca en la expresión que lo calcula» y lo ejemplificó con `??`. La regla
completa, que es lo que evita que esto vuelva:

> **`nombreAntesDe` liga sólo a través de un `:` o un `=` inmediatamente
> anterior** (saltando blancos, un signo unario y la etiqueta de una plantilla).
> Un literal alcanzado **dentro de un array**, **tras `??`**, **tras `||`** o
> **en un ternario** NO queda ligado, y por tanto la vía de detección **por
> NOMBRE** no lo mira.

Las cuatro formas están fijadas en un test de límite declarado, para que sean
conocidas y no un descubrimiento. **Lo que NO se pierde**: el mismo valor como
CADENA sigue cayendo por el suelo opaco, que no depende de la ligadura — la
pérdida es de la vía por nombre, no del fichero.

## 3 · Menores

- **m14 · el CONSUMO de la ley no estaba vigilado.** La ley sí (§B8 de la vuelta
  anterior), pero neutralizar el `push` del recorrido dejaba las 199 en verde. El
  recorrido está **extraído a una función** y hay un test que le mete una entrada
  que **sí** viola —con un analizador mutilado, para que la violación sea real y
  producida por la ley de verdad— y exige que la recoja. Mutante M40: rojo.
- **m15 · registrado como inerte.** Forzar `abreRegex` a cierto hace que todo `/`
  abra regex → sin cerrar → lanza → retirada: **más** cobertura. Falla hacia el
  lado seguro, como `trozosDocker` (m7) y el cierre de la regex (m12). **Las tres
  piezas sin guardián van declaradas y son las tres inertes.**
- **m16 · la ley atada a la suite.** `conservacion.mjs` no casa con
  `test/gates/*.test.mjs` y entra en CI sólo porque `formatos.test.mjs` la
  importa. Hay test que exige que **alguna suite la importe**; si la importación
  desaparece, rojo. Mutante M41: rojo. *(Guarda contra que la importación
  desaparezca, no contra toda forma en que la ley podría dejar de correr.)*

---

## 4 · Censo de mutación: 44 mutantes, 0 vivos, 0 no aplicados

Los 35 anteriores más **M36–M44**: las tres familias de B9, el hueco de
plantilla, el consumo de la ley (m14), la atadura de `conservacion.mjs` (m16) y
el inerte de m15.

**Y el censo se arregló a sí mismo dos veces**, que es la parte que importa:

- **M31–M33 salieron «no aplicadas»** porque anclaban en el fichero de test y la
  ley se había mudado a su propio módulo. Un ancla que no casa deja el fichero
  intacto, la suite verde, y **parece un mutante muerto**. El censo lo distingue
  desde la 3.ª vuelta y por eso se vio.
- **M41 no mutaba nada**: sólo añadía un comentario y la importación seguía ahí.

Tres piezas sin guardián, las tres **inertes y declaradas**: `trozosDocker`
ignorando comillas, el cierre de la regex, y `abreRegex` siempre cierto.

---

## 5 · Estado de las comprobaciones

```
$ node scripts/gates/run.mjs               ->  gates: OK (0 offenders) · rc=0
$ node --test test/gates/*.test.mjs        ->  206 tests · 206 pass · 0 fail
$ node <scratchpad>/u269-mutar.mjs         ->  44 mutantes · 0 vivos · 0 no aplicados
$ node <scratchpad>/u269-w-ley-hijo.mjs    ->  CORPUS=0 BATERIA=0/16
$ node <scratchpad>/u269-w-ley-demo.mjs    ->  4 de 4 agujeros cazados a ciegas
$ node <scratchpad>/u269-b1-cli.mjs        ->  0 de 8 formas se escapan
$ node <scratchpad>/u269-b2.mjs            ->  0 de 9 clases perdidas
$ node <scratchpad>/u269-b3.mjs            ->  0 de 10 pierde vs main
$ node <scratchpad>/u269-b5.mjs            ->  0 de 4 pierde vs main
$ node <scratchpad>/u269-w-b7.mjs          ->  0 de 6 pierde vs main
$ node <scratchpad>/u269-w-b9.mjs          ->  0 de 12 pierde vs main
```

---

## 6 · Qué límite queda declarado

1. **La ley 1 no se aplica a código**, y en código la ley 2 sólo mira valores de
   campos. **Lo que en código no llega a ser campo no lo mira la ley.** Lo que
   cubre ese hueco ya no es una lista de canarios sino **la invariante de las
   nueve ramas** (§2.1) — pero la invariante la sostengo yo leyendo las ramas, no
   una comprobación automática. **Es el punto más débil que queda.**
2. **Tres ramas declaran que lo que consumen no es dato**: blanco, salto de línea
   y puntuación. Y una cuarta, el **identificador**, lo declara a propósito:
   un campo de identidad cuyo valor es un IDENTIFICADOR es una expresión, y quitarla
   WP compró. Si alguna vez hay que cazar eso, vuelven los falsos positivos.
3. **Tres piezas sin guardián**, las tres inertes y las tres fallando hacia el
   lado seguro (§4).
4. **La ley no demuestra que los analizadores sean correctos**, sólo que no
   pierden entrada — y está medido que eso no produce regresión frente a `main`.
5. **Markdown, `.env` y texto plano no se analizan**: **22 de los 98 están en
   `.md`**. Los ficheros del WP aportan **20**.
6. **La ligadura por nombre no alcanza** array, `??`, `||` ni ternario (§2.3),
   y el `[` de apertura NO se cierra porque cuesta un falso positivo medido
   (§2.2). La vía por FORMA y el suelo opaco siguen mirando esos ficheros.
7. **Los 3 falsos positivos de §1**, frase de paso con espacios literales,
   `AUTHTOKEN` sin separador, ficheros >1 MiB, y el subconjunto de YAML.
8. **Sigue sin haber entropía ni lista de excepciones.** Lo que el WP no toca, y
   U231 ya declaraba: historial de git, tarball de npm, UTF-16, contextos de
   build que no sean el directorio de la receta ni la raíz.

---

## 7 · Ficheros

| fichero | qué |
|---|---|
| `scripts/gates/formatos.mjs` | analizadores de JSON, JSONL, YAML de bloque, Dockerfile y lexer de código; `NoEntiendo`, la retirada, los **diez** valores opacos, la contabilidad de claves consumidas y la invariante de las nueve ramas |
| `scripts/gates/claves.mjs` | `hallazgosEstructurales`, encaminamiento con retirada, `esHuecoEstructural`, `esNombreDeIdentidad`, hueco de plantilla acotado a referencias |
| `test/gates/conservacion.mjs` | la ley de conservación, fuera del test para que la demostración no use una copia |
| `test/gates/formatos.test.mjs` | 46 tests: el censo de la invariante, los que matan a la ley, el que vigila su consumo y el que la ata a la suite |
| `test/gates/claves.test.mjs` | cifras del léxico actualizadas |
