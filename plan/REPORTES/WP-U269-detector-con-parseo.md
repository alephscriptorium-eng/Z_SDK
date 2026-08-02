# WP-U269 — el detector de claves deja de adivinar y PARSEA

Rama `wp/u269-detector-con-parseo`, worktree `C:/S_LAB/wt/z-u269`.
Continúa el límite 6 que `WP-U231` dejó abierto **a propósito**, para no entrar
en carrera armamentística de expresiones regulares.

**Tercera entrega.** Tres devoluciones, y las tres por **el mismo defecto mío**:
escribir una frase absoluta sobre una superficie que no había enumerado entera.

| vuelta | la frase que escribí | lo que la rompió |
|---|---|---|
| 1.ª | «la retirada nunca a silencio» | `flujoYaml` devolvía `null` al no entender |
| 2.ª | «la duda se lanza, **siempre**» | un `catch` en `camposDeCodigo` se la comía |
| 3.ª | «0 de 9 clases perdidas» | había 8 pérdidas, y una era **media clase que enumeré como cerrada** |

No fallé en lógica ninguna de las tres veces. Fallé en **contar**. Por eso el
cambio central de esta vuelta no es una línea de código: es que **la regla que
gobierna `formatos.mjs` ha dejado de ser una promesa y es un recuento
mecanizado** (§3). Si alguien añade un `return null` o un `catch`, un test se
pone rojo y le obliga a clasificarlo.

---

## 0 · Denominador y cifras del encargo

El encargo citaba «90 hallazgos en 1741 ficheros». Ninguna cifra se sostiene: el
90 no aparece en el reporte de U231 (allí es 121) y el árbol tiene hoy **1762**
ficheros trackeados. Todo lo de abajo está re-medido en este árbol.

---

## 1 · El antes y el después

Misma orden, **sólo cambia el detector** (se extrae el de `main` a un temporal y
se apunta ahí `DETECTOR`):

```
$ node <scratchpad>/densidad.mjs C:/S_LAB/wt/z-u269 --detalle

ANTES  (detector de U231, de main)   1762 trackeados · HALLAZGOS: 135 en 77 ficheros
DESPUÉS (con analizadores)           1762 trackeados · HALLAZGOS:  83 en 49 ficheros
```

**135 → 83.** Diff de conjuntos: **55 desaparecen, 3 aparecen**, y de los 3
**ninguno lo señalaba `main`** (§1.2).

La cifra subió de 61 a 83 en esta vuelta, y **subió a propósito**: es el precio
de cerrar B3 (§2). Los 22 que vuelven **son todos líneas que `main` también
señala** — comprobado con `comm`: la intersección de «los 22» con el conjunto de
`main` es 22 de 22. O sea que el suelo opaco **no inventa ruido nuevo**;
devuelve exactamente la cobertura que la rama estaba comprando con silencio.

### 1.1 · Los 55 que desaparecen

El valor no era un literal: llamadas a función asignadas a una variable `token`
o `auth`, accesos a miembro, anotaciones de tipo de un parámetro `privateKey`,
títulos de `test(...)` con la palabra `clave` en castellano corriente.

**Cuatro de ellas SÍ llevan un literal de cadena** (lo midió la 2.ª
contrarrevisión; mi frase absoluta anterior era falsa): dos son argumentos de
una llamada (`path.join(...)`, `tempRoot(...)`), una es un valor por defecto tras
un `??`, y la cuarta es el fixture de i18n del propio U231. Ninguna es una
credencial de un servicio.

### 1.2 · Los 3 que aparecen, declarados

```
packages/engine/embajador-kit/src/tipos.mjs:27                 una constante de VERSIÓN cuyo nombre lleva `CREDENCIAL`
packages/mesh/linea-editor/src/editor-server.mjs:91            un campo `token_env` cuyo valor es el NOMBRE de una variable de entorno
packages/mesh/linea-editor/test/reparto-autoria.test.mjs:262   un `approvalToken` de fixture
```

Nombres compuestos que el barrido de línea no veía y que `esNombreDeIdentidad`
sí ve. **No los cierro**: pedirían una lista de sufijos inocentes (`_VERSION`,
`_env`), que es el instrumento del que este WP intenta salir.

---

## 2 · B3 — la clase de B1, viva en `camposDeCodigo`

**Reproducido**: ocho formas, todas con `camposDe(...)` devolviendo **sin
lanzar**, o sea en silencio y no en retirada.

```
$ node <scratchpad>/u269-b3.mjs <claves.mjs de main>
caso                                   main rama(antes) lanza
blob YAML en literal                      1     0         no   <-- PIERDE
blob JSON con coma final                  1     0         no   <-- PIERDE
blob JSON clave sin comillas              1     0         no   <-- PIERDE
blob JSON con comentario dentro           1     0         no   <-- PIERDE
casi-valido en plantilla                  1     0         no   <-- PIERDE
blob .env en literal                      1     0         no   <-- PIERDE
YAML en plantilla multilinea              1     0         no   <-- PIERDE
.env en plantilla multilinea              1     0         no   <-- PIERDE
```

**Dos mecanismos, los dos míos:** un `catch` que se tragaba la duda, justificado
con un comentario que decía que el literal «ya se juzgó por su propio nombre»
—y el nombre es `cfg`—; y que **`camposDeCodigo` nunca marcaba `opaco` un
literal**. Marqué opacos los comentarios, el cuerpo del bloque YAML y el
argumento de `RUN`. El literal no.

**Arreglo y decisión.** El lexer sabe que eso **es** una cadena; **no** sabe qué
hay dentro. Así que el literal se marca opaco **incondicionalmente** —ése es el
suelo— y el análisis de JSON se queda encima como extra que da nombre de campo y
línea propios. Tras el arreglo: **PIERDE vs main: 0 de 10**.

**Pago el precio y lo escribo: 61 → 83, +22 falsos positivos.** Elijo pagar por
tres razones, y la tercera es la que decide:

1. Es la única opción que hace **cierta** la frase del fichero, y ésa es la
   lección de esta devolución.
2. La alternativa —cerrar sólo algunas sintaxis— sería otra superficie sin
   enumerar: exactamente el error que llevo tres vueltas cometiendo.
3. **Los 22 son líneas que `main` también señala** (22 de 22, medido). No es
   ruido nuevo: es ruido que la rama estaba ocultando. Cambiar «ruido» por
   «silencio» en un gate de secretos es el intercambio equivocado.

Composición de los 22: **10 son fixtures de los propios tests de gates** (un
corpus que prueba un detector de secretos contiene cadenas con forma de secreto,
por construcción), 5 son títulos de `test(...)` en castellano y el resto,
plantillas que generan tipos.

---

## 3 · B4 — la auditoría, mecanizada en vez de prometida

Enumeración **completa** de las salidas de `formatos.mjs`, obtenida con un
recuento sobre el fichero (no a ojo), y clasificada una por una:

| clase | n.º | veredicto |
|---|---|---|
| `return null` | **3** | **auditadas**: `formatoDe` («no encamino este formato»), `parYaml` («no es una pareja»), `flujoYaml` («no es una colección de flujo»). Las tres son información POSITIVA, no duda. |
| `catch` | **1** | el del análisis JSON dentro de un literal. **Legítimo sólo porque debajo hay un suelo opaco incondicional**; sin él (mutante M23) vuelve a ser el agujero B3. |
| `throw NoEntiendo` | **14** | la duda. Cada uno con mutante propio (§5). |
| `opaco: true` | **7** | comentario YAML · cuerpo de bloque YAML · comentario Dockerfile · argumento de instrucción no modelada · comentario de línea · comentario de bloque · **contenido de literal de cadena**. |
| `return` sin valor | 7 | todos dentro de `valor()` del analizador JSON, que **consume o llama a `err()`**: no hay rama muda. |
| `continue` / `break` | 57 / 8 | control de bucle de los escáneres (avance de índice, saltar línea en blanco). No son salidas del analizador. |

**Y esto no es prosa: es un test.** `AUTHORÍA: las salidas silenciosas de
formatos.mjs son exactamente las auditadas` fija los números de `return null`
(3), `catch` (1) y `opaco: true` (7). Añadir cualquiera de los tres pone la
suite roja con un mensaje que pide clasificarlo. **La frase del fichero ya no
dice «siempre»: dice «hay exactamente tres y uno, y están auditados».**

Además se cerró **m6**, que era otra salida muda aunque no fuera regresión: toda
línea que empezara por `%` se saltaba en silencio. Ahora sólo se saltan `%YAML`
y `%TAG`; cualquier otra **lanza**.

---

## 4 · B1 y B2, del ciclo anterior

- **B1** (mapa de flujo de YAML devolvía `null` al no entender): cerrado.
  **0 de 8 formas se escapan** (main: 8 de 8), control negativo verde.
- **B2** (clases de pérdida frente a U231): **0 de 9 clases perdidas**.

---

## 5 · Censo de mutación: 24 mutantes, 24 rojos

Línea base verde comprobada antes de empezar; `rc` del censo comprobado aparte
del `tail`. Una mutación cuya ancla no aparece **exactamente una vez** cuenta
como **fallo**, no como muerto — un ancla que no casa deja el fichero intacto y
la suite verde, que parece un mutante muerto y no lo es. (Me pasó: dos
mutaciones de esta vuelta dejaban el `throw` alcanzable y salían «vivas»; eran
mutaciones rotas, no supervivientes.)

Los 17 de la vuelta anterior, más los **siete nuevos** que exige la devolución:

| mutante | qué revierte |
|---|---|
| M18 · flujo: quitar el `throw` de «cola tras el cierre» | m1 · load-bearing |
| M19 · flujo: quitar el `throw` de «sin equilibrar» | m1 · load-bearing |
| M20 · flujo: quitar el `throw` de «mal cerrada» | m1 · load-bearing |
| M21 · Dockerfile: quitar el `throw` de «no es instrucción» | m1 · load-bearing |
| M22 · Dockerfile: quitar el `throw` de «trozo sin `=`» | m1 |
| M23 · el literal de código deja de marcarse opaco | **B3** |
| M24 · `%` vuelve a saltarse en silencio | m6 |

**Y uno más salió VIVO al añadirlos: M15**, el análisis de JSON dentro del
literal. Sobrevivía porque el suelo opaco lo cazaba igual: **seguridad cubierta,
precisión no** —sin el análisis el hallazgo sale de un barrido a ciegas en vez de
traer el nombre del campo—. Es el mismo patrón que M12 en la vuelta anterior, y
se cierra igual: un test que exige que el blob **se entienda**, no que alguien lo
cace. Con él, 24 de 24.

Sobre m1, y es justo: cinco `throw` que añadí **como arreglo de B1/B2** no
tenían un solo guardián. Cuatro son load-bearing —revertidos, el material pasa de
rojo a silencio— y el quinto no lo es: en su forma no hay ningún nombre de
identidad que cazar y `main` tampoco caza nada. El test lo distingue
explícitamente en vez de exigirle un hallazgo que no existe.

---

## 6 · Menores

- **m2 · entregué el fichero binario.** `claves.mjs` llevaba **3 bytes NUL** y
  había volteado de LF a CRLF, con lo que `file(1)` lo daba por `data` y el diff
  pasaba de 72 líneas a 2819. **Corregido**: los NUL eran separadores donde iba
  un espacio, y la alternativa `| ` del `split` era además **redundante**
  (`[^A-Za-z0-9]+` ya casa el espacio), así que se ha quitado entera. El fichero
  vuelve a ser **LF** y `file(1)` lo clasifica `JavaScript source`. Comprobado
  que `esNombreDeIdentidad` da idéntico resultado (22 nombres, 0 diferencias), y
  que el blob **almacenado en git** es LF y sin NUL (`git cat-file -p`), no sólo
  la copia de trabajo.

  **Los dos síntomas eran uno solo, y lo verifiqué en vez de suponerlo.** Esta
  máquina tiene `core.autocrlf=true`, que normaliza CRLF→LF al commitear… salvo
  que el fichero sea binario. Un NUL lo vuelve binario, la normalización se
  desactiva y el CRLF entra tal cual. Comprobado con dos ficheros gemelos en un
  repo de usar y tirar:

  ```
  con-nul.mjs    blob -> CRLF: 202 | NUL: 1
  sin-nul.mjs    blob -> CRLF:   0 | NUL: 0
  ```

  O sea: **el NUL era la causa raíz de las dos cosas**, no dos descuidos. Quitarlo
  arregla el CRLF sin tocar nada más. (Primero supuse que el NUL caía dentro de
  la ventana de 8000 bytes con que `git diff` detecta binarios; medí y estaba en
  el byte 11710, así que esa explicación era falsa. El experimento de arriba es
  el que sostiene la afirmación.)
- **m3 · §11.7 inducía a error, y en la dirección contraria a la temida.**
  Corregido con tu medición: **`main` nunca detectó el literal por defecto** —
  señalaba la *expresión*, y `cfg?.token ?? ""` y `cfg?.token` dan `main=1`
  igual. Lo que se pierde es **uno de los falsos positivos**, no una detección.
  Ya no figura como límite; figura en §1.1 como uno de los 55 que se van.
- **m4 · cifra caducada dentro del código nuevo.** El comentario de
  `esNombreDeIdentidad` decía «un autor sale once veces en este árbol». Ahora
  dice lo medido: **en `main` el ancla rota no produce ni un falso positivo; por
  el camino estructural produce 36**.
- **m5 · §12 decía «aportan 0» y era incompleto.** Medido ahora: los ficheros
  del WP aportan **10 de los 83** — `claves.mjs:6` (prosa de la cabecera de
  U231) y `claves.mjs:424` (la descripción del patrón `url-con-credencial`, que
  contiene `usuario:clave@` por definición), más **8 en
  `test/gates/formatos.test.mjs`**, que son los vectores de contraprueba. Un
  corpus que prueba un detector de secretos contiene cadenas con forma de
  secreto: es inherente, y prefiero declararlo a contorsionar los tests.
  **El reporte aporta 0.**
- **m6 · cerrado**, ver §3.

---

## 7 · Lo demás, sin cambios respecto a la vuelta anterior

- **No hay dependencia nueva.** El gate no debe necesitar `node_modules`, y el
  worktree entregado no lo tiene.
- **Retiradas**: 1141 ficheros con formato conocido, de los que **1 supera 1 MiB**
  (`package-lock.json`) y ni llega al analizador; de los 1140 restantes, **1132
  OK y 8 retiradas**.
- **Léxico re-medido**: 70 / **83** / 246 sobre 1762 ficheros. `key` sigue
  costando ~3 veces lo que cuesta `clave`; la decisión de U231 no cambia.
- **Coste**: el `npm run gates` de punta a punta es demasiado ruidoso en esta
  máquina para afirmar nada (1,9–10,5 s en ambas versiones).

---

## 8 · Qué límite queda declarado

1. **Markdown, `.env` y texto plano no se analizan**: barrido crudo. **22 de los
   83 están en `.md`** y son prosa de reportes.
2. **Una frase de paso con espacios LITERALES no se caza.** Con guiones sí.
3. **Los 3 falsos positivos de §1.2**, y los **10 de los ficheros del WP** (m5).
4. **Una tirada en mayúsculas sin separador** (`AUTHTOKEN`) no se parte en
   palabras: `AUTHTOKEN` y `AUTHOR` son el mismo problema sin diccionario.
5. **Ficheros de más de 1 MiB** van por el camino troceado de U231.
6. **YAML es un subconjunto**: anclas, alias, etiquetas, claves complejas, claves
   de fusión y flujo multilínea **se retiran**.
7. **Sigue sin haber detección por entropía** ni **lista de excepciones**.
8. **Lo que este WP no toca**, y U231 ya declaraba: historial de git, tarball de
   npm, UTF-16, contextos de build que no sean el directorio de la receta ni la
   raíz.
9. **Lo que esta auditoría NO demuestra**: que las 57 `continue` y las 8 `break`
   sean correctas. Demuestra que son control de bucle y no salidas de analizador,
   y que las dos clases que **sí** han producido agujeros —`return null` y
   `catch`— están contadas y fijadas por un test. No escribo una frase más ancha.

---

## 9 · Estado de las comprobaciones

```
$ node scripts/gates/run.mjs                 ->  gates: OK (0 offenders) · rc=0
$ node --test test/gates/*.test.mjs          ->  193 tests · 193 pass · 0 fail
$ node --test test/gates/formatos.test.mjs   ->   33 tests ·  33 pass · 0 fail
$ node <scratchpad>/u269-mutar.mjs           ->  24 mutantes · 0 vivos · 0 no aplicados · rc=0
$ node <scratchpad>/u269-b1-cli.mjs          ->  0 de 8 formas se escapan (main: 8 de 8)
$ node <scratchpad>/u269-b2.mjs              ->  0 de 9 clases perdidas
$ node <scratchpad>/u269-b3.mjs              ->  PIERDE vs main: 0 de 10
$ file scripts/gates/claves.mjs              ->  JavaScript source, UTF-8 (LF)
```

`npm run lint` no se puede correr: no hay `node_modules` en esta máquina.

## 10 · Ficheros

| fichero | qué |
|---|---|
| `scripts/gates/formatos.mjs` | analizadores de JSON, JSONL, YAML de bloque, Dockerfile y lexer de código; `NoEntiendo`, la retirada y los **siete** valores opacos |
| `scripts/gates/claves.mjs` | `hallazgosEstructurales`, encaminamiento con retirada, `esHuecoEstructural`, `esNombreDeIdentidad`, ancla cerrada, compilación izada sin `g` ni `y`. **En LF y sin NUL** |
| `test/gates/formatos.test.mjs` | 33 tests, incluida la **auditoría mecanizada** de salidas |
| `test/gates/claves.test.mjs` | cifras del léxico actualizadas |
