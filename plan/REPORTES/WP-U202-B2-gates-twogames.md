# WP-U202-B2 · `npm run gates` en rojo — 3 offenders `two-games`

- **Rama**: `wp/u202b2-gates-twogames` · **base fijada**: `87bd93f3ac7647912b6400ebfa9c34f2d06d83d6`
- **Worktree**: `C:/S_LAB/wt/z-u202b2` · **Fecha**: 2026-08-01
- **Vía elegida**: **A-BIS (ensanchar por forma)**. `scan.mjs` y `exceptions.mjs` **intactos**.

---

## 1. La medida real del gate (CA-1)

El brief lo dejó dicho: ni el investigador ni la contrarrevisión ejecutaron el gate;
las dos lo dedujeron leyendo la regla. Primer acto de este WP: ejecutarlo.

### ANTES — `node scripts/gates/run.mjs` sobre `87bd93f`, stdout literal

```
gates: FAIL (3 offender(s))
  [two-games] packages/engine/linea-kit/src/curation.mjs:56 — matched delta: * `registro.md` / `delta.md` anywhere in a LINEAS volume, plus ANY `*.md`
  [two-games] packages/engine/linea-kit/src/curation.mjs:68 — matched delta: if (base === 'registro.md' || base === 'delta.md') return true;
  [two-games] packages/engine/volumes-ops/src/driver-lineas.mjs:21 — matched delta: * - curación intocable: `registro.md`/`delta.md` (and any `*.md` under
EXIT=1
```

**La deducción estática era correcta al carácter**: tres offenders, esos tres ficheros,
esas tres líneas. La premisa del WP se sostiene y no hubo que re-medir el alcance.

### DESPUÉS — mismo comando, tip `wp/u202b2-gates-twogames`

```
gates: OK (0 offenders)
EXIT=0
```

### CA-0 · la secuencia del job `quality` de CI (`ci.yml:38-42`), en orden

| paso | resultado |
| --- | --- |
| `npm run lint` | **EXIT 0** — 18 problems (**0 errors**, 18 warnings), ninguno en ficheros de este WP |
| `npm run gates` | **EXIT 0** — `gates: OK (0 offenders)` |
| `npm run test:gates` | **23 pass · 0 fail** |

### CA-3 · el grep case-insensitive

```
$ grep -rniE "\bdelta\b" packages/engine/linea-kit/src packages/engine/volumes-ops/src
(sin salida — exit 1)
```

Antes daba 3. Y sin trucos: no hay concatenación, escape ni `String.fromCharCode` que
reconstruya el nombre; el literal **se eliminó de `src/`**, no se disfrazó. (Partirlo no
habría funcionado de todos modos: la comilla es frontera de palabra y `\bdelta\b` lo
seguiría cazando — comprobado, §5.)

**Alcance exacto de esta medida, que la primera entrega no explicitó.** El grep está
acotado a los dos `src/`, y el mismo commit **planta 6 ocurrencias del nombre** en
`packages/engine/linea-kit/test/curation-sidecar.test.mjs` (líneas 41, 84, 196, 198, 251,
253): el predicado *legacy* de P1 no se puede expresar sin escribir los dos nombres que
comparaba, y la tabla de verdad tampoco. Están **legítimamente exentas por categoría**
—`isTwoGamesPathExempt('packages/engine/linea-kit/test/curation-sidecar.test.mjs')` →
`true`, ejecutado— igual que las que ya vivían en `import-lineas-driver.test.mjs`. Pero
como este mismo reporte argumenta que **eliminar es mejor que excusar**, el argumento
obliga a decirlo en vez de dejar que el recorte del grep lo tape: en `src/` el nombre
desapareció; en `test/` sigue, amparado por una exención de categoría que yo no he tocado
ni ampliado.

---

## 2. Por qué estaban ahí esos literales

**No es un fixture filtrado a `src/`, ni un ejemplo hardcodeado.** Es una colisión
léxica genuina, y verificarla decidió la forma del arreglo:

- `plan/DATOS.md:45` da a `registro.md` / `delta.md` como **capa de curación humana**
  del corpus LINEAS, con su ubicación viva en `linea-aleph/registros/`. Son nombres de
  fichero canónicos del dato, no del juego.
- El token que dispara es la cadena `delta.md`: el **punto** crea la frontera de palabra
  que exige `GAME_EXCLUSIVE_RE` (`scan.mjs:285-286`, bandera `gi`). Por eso `delta_status`
  (`curation.mjs:48`) o `delta_md` (`loader.mjs:406`) **no** disparan: el `_` es carácter
  de palabra. El gate no está siendo tonto — `delta` **sí** es un nombre de juego en este
  repo (`docs/games/delta.md`), y la regla D-8 prohíbe nombrarlo bajo `packages/engine`.

Así que «borrar el dato» estaba descartado desde el principio: el predicado tiene que
seguir protegiendo esos ficheros. La pregunta real era **cómo nombrarlos sin nombrarlos**.

**Y el repo ya había contestado esa pregunta, en el mismo paquete.** `loader.mjs:360-362`,
que es el **lector real** de la capa de curación, dice literalmente:

```js
 * Read curated markdown sidecars for a registro (any *.md in the registro dir).
 * Avoids hardcoding game-named filenames in engine code (two-games gate).
```

…y lee los sidecars **por forma** (`entries.filter((f) => f.endsWith('.md'))`,
`loader.mjs:383`), conservando la clave de salida `delta_md` porque el guión bajo no
colisiona.

**Matiz obligado, porque la primera entrega se pasó de ancha aquí** (y de paso la citó una
línea más abajo de donde está: es `:383`, no `:384` — el mismo off-by-one que este WP le
afeó al brief). El precedente es real pero **no es puro**: `loader.mjs` sigue hardcodeando
`registro.md` en `:391` (`markdown['registro.md']`) y en `:397`
(`name !== 'registro.md'`). Lo que evita es exactamente lo que dice su propio comentario
—nombres **de juego**—, no todo nombre de fichero; `registro` no está en el léxico del
gate y por eso puede permitirse el literal. Así que el precedente sostiene «no hardcodees
el nombre de juego», que es lo que este WP necesita, y **no** el eslogan más ancho de
«forma, nunca literal». El predicado de U202 no siguió ni siquiera la versión estrecha.

---

## 3. Por qué esta vía y no las otras (CA-7)

### El hallazgo que reordena los precios

Antes de elegir, hay un dato que **ni el brief ni la contrarrevisión declaran**, y que
cambia la aritmética de las tres vías. Leyendo `driver-lineas.mjs:160-193` y confirmándolo
**ejecutando el `merge` real** sobre un árbol sintético:

```
moves            : [ 'demo/wp/historia/registros/r1/nuevo.md', 'demo/nodos/N01/meta.json' ]
skips            : [ 'registry.yaml' ]
divergences      : [ 'demo/wp/historia/manifest.json' ]
protectedSidecars: [ 'demo/wp/historia/registros/r1/registro.md' ]

rutas existentes en destino que merge MOVERÍA (=pisaría): []
sidecar humano en destino tras el plan: "HUMANO"
```

**`merge` no mueve JAMÁS sobre un fichero que ya existe en el destino** — ni curado, ni
divergente, ni idéntico. `moves` (lo único que `importPack` ejecuta, `import.mjs:391`)
sólo recibe ausentes, y para los ausentes **las dos ramas del predicado hacen lo mismo**
(`driver-lineas.mjs:167-172`).

Corolario: **dentro de este monorepo el predicado no decide si se pisa; decide el cajón
del reporte** (`curacion_protegida` vs `contenido_distinto`/`skips`). Eso rebaja el precio
de *cualquiera* de las tres vías a una cuestión de clasificación, y **desmiente una frase
del brief**: «con el ensanche `raw/linea.md` … deja de actualizarse por import» es falso
en las dos direcciones — una vez presente en el destino, `raw/linea.md` no se actualizaba
por import ni antes ni después.

Donde el predicado **sí** puede decidir escrituras es fuera: es **API pública publicada**
(`linea-kit/package.json:12`, subpath `./curation`; `src/index.mjs:14`; v0.3.0, registry
propio). Y ahí la asimetría manda.

### La decisión

| vía | ¿quita el literal? | ¿ablanda la protección? | veredicto |
| --- | --- | --- | --- |
| **A** estrechar a `registro.md` | sí | **SÍ** — `registros/r1/delta.md` y `demo/wp/historia/delta.md` dejan de estar protegidos | descartada |
| **A-BIS** ensanchar a `*.md` | sí | **no** — superconjunto estricto | **elegida** |
| **B** excepción en `exceptions.mjs` | no (lo excusa) | no, pero **ciega el gate** sobre dos ficheros enteros | descartada |

**Elijo A-BIS.** Las razones, en orden de peso:

1. **Es la única vía de código que cumple el objetivo declarado del propio brief**
   («SIN ablandar la protección de curación de U202»). La vía A lo incumple por
   construcción: encoge el conjunto protegido. A-BIS es superconjunto estricto —
   0 rutas pierden protección, y hay un test que lo afirma.
2. **Dice lo que ya dice la regla de diseño del corpus.** `DATOS.md` cierra §2 con:
   *«Regla de diseño heredada y vigente: **el wikitext (dato de autoridad) es la verdad;
   el markdown es índice y curación**»*. «Todo `*.md` es curación» no es una política que
   yo invente para esquivar el gate: es la frase del documento de datos, ahora ejecutable.
3. **Sigue el precedente del propio paquete** (`loader.mjs:361`), que ya resolvió este
   nombre de fichero por forma y por este mismo gate.
4. **La asimetría de fallos, sobre API pública con consumidores externos desconocidos**:
   un falso positivo sólo reclasifica una entrada del reporte; un falso negativo pisa
   curación humana y **eso no se recupera**. Para un predicado que se llama
   `isCuratedSidecarPath` y cuyo JSDoc promete «Import merges must NEVER overwrite these
   paths», errar ancho es el único error tolerable.
5. **Deja el gate viendo.** La vía B habría dejado `exceptions.mjs` —territorio compartido
   por todos los carriles— con dos ficheros ciegos para la regla `two-games` entera: a
   partir de ahí, cualquier nombre de juego que alguien escribiera en `curation.mjs`
   pasaría inadvertido. Eliminar el offender es estrictamente mejor que excusarlo, y el
   probe rojo de §5 demuestra que el gate **sigue mirando** ese fichero.

### Tabla de verdad ANTES/DESPUÉS (CA-7), generada por ejecución

| ruta relativa al volumen | ANTES (`87bd93f`) | DESPUÉS |
| --- | --- | --- |
| `demo/wp/historia/registros/r0001-oldid-2/cualquier-nombre.md` | true | true |
| `demo/wp/historia/registros/r1/registro.md` | true | true |
| `demo/wp/historia/registro.md` | true | true |
| `registros/r1/delta.md` | true | true |
| `registros/r1/notas.md` | **false** | **true** ←cambia |
| `demo/wp/historia/delta.md` | true | true |
| `demo/raw/linea.md` | **false** | **true** ←cambia |
| `demo/wp/historia/registros/r1/data.json` | false | false |
| `registry.yaml` | false | false |
| `demo/cache/snapshots/1.wikitext` | false | false |

**El conjunto se ENSANCHÓ. Rutas que perdieron protección: 0.** Los dos cambios son:

- `registros/r1/notas.md` — **esto arregla una mentira preexistente**, no la introduce.
  El JSDoc de `curation.mjs:57` prometía «ANY `*.md` inside a `registros/` directory»
  mientras el código exigía `p.includes('/registros/')`, con barra **previa**: un
  `registros/` colgando de la raíz del volumen no casaba. Como `DATOS.md:45` sitúa la capa
  viva justo en `linea-aleph/registros/`, ese caso no era teórico. **CA-6 ya estaba roja
  antes de este WP** y ahora doc y código coinciden en las 10 filas.
- `demo/raw/linea.md` — **precio declarado**. `DATOS.md:46` lo da como export crudo del
  historial, no como curación. Pasa a `curacion_protegida`. Efecto real, acotado por §3:
  cambia el cajón del reporte y se pierde el par `destSha256`/`packSha256` para ese
  fichero; **no** cambia si se escribe o no.

### Un efecto a favor que la primera entrega no declaró: cierra un crash preexistente

Hallado al intentar falsar la afirmación de §3. Si el **destino** tiene un DIRECTORIO
donde el pack trae un `.md` que el predicado de la base no consideraba curación, la base
entra por `sha256File(destAbs)` → `readFileSync` sobre un directorio → **EISDIR**. El tip
lo clasifica antes y ni lo toca. Ejecutado sobre el mismo árbol con los **dos** drivers
(el de `87bd93f` reconstruido y el del tip):

```
BASE  (87bd93f) -> LANZA EISDIR: EISDIR: illegal operation on a directory, read
TIP   (u202b2)  -> OK  moves=[] protected=["curacion_protegida"] divergences=0
```

Así que el ensanche no sólo no pierde protección: **elimina un modo de fallo no declarado
por el contrato** para todo `*.md`. No era un objetivo del WP; es una consecuencia, y se
declara como tal.

### Changeset: **SÍ** → `.changeset/curated-sidecar-por-forma.md`

`isCuratedSidecarPath` es API pública publicada y su comportamiento cambia para entradas
reales ⇒ **minor** de `@zeus/linea-kit`. `@zeus/volumes-ops` no lleva entrada propia (sólo
cambió un comentario); `updateInternalDependencies: "patch"` (`.changeset/config.json`) le
da el bump por dependencia. `packages/engine/linea-kit/CHANGELOG.md` **no se toca a mano**
— lo genera `changeset publish`.

---

## 4. La prosa, alineada con el código (CA-6)

- `curation.mjs:53-75` — JSDoc reescrito nombrando el conjunto **por su forma**, con la
  sobre-aproximación **declarada en el propio comentario** (incluye el caso `raw/linea.md`
  y la razón de la asimetría). Coincide fila a fila con la tabla de §3.
- `driver-lineas.mjs:21-22` — **sólo comentario, comportamiento cero**. Nota de alcance:
  el offender está en la línea 21, pero el paréntesis que abre cierra en la 22, así que
  **dos** líneas es la edición mínima sintácticamente coherente. El `merge` no se tocó
  (territorio de U205 / WP ya aceptado): `git diff` de ese fichero = 2 líneas de bloque
  de comentario.

---

## 5. El test que impide la regresión (CA-5)

**Fichero nuevo**: `packages/engine/linea-kit/test/curation-sidecar.test.mjs`
(recogido solo por `node --test test/*.test.mjs`, `package.json:23` del paquete).

Un detalle que decide su diseño: **un test de entrada/salida NO habría bastado.** Como el
predicado ya devuelve `true` para todo `*.md`, reintroducir `base === 'delta.md'` **no
cambia ninguna salida** — el gate volvería a rojo y ningún assert de comportamiento se
enteraría.

> ### Corrección de la primera entrega
> La versión anterior de este apartado afirmaba que su «propiedad de superconjunto»
> *«se pondría roja si alguien estrechara el conjunto más adelante»*. **Era falso**, y la
> devolución lo demostró con un vector: no era una propiedad sino **una lista de 9 rutas
> fijas**, y un estrechamiento que las esquive pasa entero. Reproducido aquí sobre el
> fichero de entonces, insertando `if (p.startsWith('borradores/')) return false;`:
> **gate VERDE · test VERDE (4/4)** — y perdían protección 4 rutas que el predicado de la
> base sí protegía (`borradores/registros/r1/{registro,notas,delta}.md`,
> `borradores/x/delta.md`). Medía **la vuelta atrás que yo imaginé, no la propiedad.**
> Reescrito a propiedades sobre universo generado, y **esta vez intentando esquivarlo yo**
> antes de describirlo.

El fichero fija ahora cuatro cosas (7 tests), sobre un universo generado de
**466 prefijos × 56 nombres base = 26.096 rutas** (nombres fijos + pseudoaleatorios con
semilla, deterministas):

| | propiedad | qué garantiza |
| --- | --- | --- |
| **P1** | superconjunto vs. el predicado de `87bd93f` | nada de lo protegido dejó de estarlo (>500 rutas protegidas por el legacy en el universo) |
| **P2** | independencia de ruta | el resultado sólo mira el nombre base |
| **P3** | sólo la extensión decide | la especificación entera: `base.endsWith('.md')` |
| **P4** | **cuerpo exacto** | el cuerpo ENTERO del predicado es, carácter a carácter (normalizando espacios), la forma esperada |

**Por qué hizo falta P4, y por qué es estructural.** Al intentar esquivar P1-P3 encontré
**yo mismo** que mi primera redacción volvía a pasarse de ancha: escribí que P2 era
«universal sobre la parte de directorio, no depende del alfabeto». **No lo es.** P1-P3
recorren 26.096 rutas pero son exhaustivas **sólo sobre su propio alfabeto**, y dos
vectores míos las pasaron en verde ablandando la protección:
`p.startsWith('inventadisimo-zzz/')` (carpeta fuera del alfabeto de prefijos) y
`base.startsWith('z')` (ningún nombre base generado empieza por `z`). Ningún muestreo del
espacio de entradas cierra la clase. Pero **todo** estrechamiento —esté o no en el
alfabeto— necesita una **rama**. Prohibir la rama cierra las dos vías a la vez sin
adivinar ningún nombre.

### Batería de evasión — 14 vectores ejecutados contra el guardián nuevo

```
A · ESTRECHAMIENTOS CON RAMA (el test DEBE ponerse rojo)
  gate=VERDE  test=ROJO   | V1 startsWith('borradores/')            [vector del revisor]
  gate=VERDE  test=ROJO   | V2 includes('/tmp/')
  gate=VERDE  test=ROJO   | V3 carpeta FUERA de mi alfabeto         [antes ESCAPABA]
  gate=VERDE  test=ROJO   | V4 profundidad > 3 segmentos
  gate=VERDE  test=ROJO   | V5 longitud de ruta > 40
  gate=VERDE  test=ROJO   | V6 base === 'notas.md'
  gate=VERDE  test=ROJO   | V7 base.startsWith('z')                 [antes ESCAPABA]
  gate=ROJO   test=ROJO   | V8 vuelve el literal de juego

B · ESTRECHAMIENTOS SIN `if` (ternario / booleanos)
  gate=VERDE  test=ROJO   | V10 ternario por directorio
  gate=VERDE  test=ROJO   | V11 AND negado por directorio
  gate=VERDE  test=ROJO   | V12 AND por nombre base

C · CONTROL
  gate=VERDE  test=ROJO   | V13 refactor sin ramas equivalente
  gate=VERDE  test=VERDE  | V14 el predicado tal cual (control)
```

**11 de 11 estrechamientos caen**, incluidos los dos que escapaban antes. Nótese la
columna `gate`: **sólo V8 pone el gate rojo**. Los otros diez ablandan la curación con el
gate en verde — es decir, el gate **no** es una red para esta clase; el test sí.

### Tercera vuelta: quedaba una puerta, y era una línea más arriba

Esa versión de P4 vigilaba **el `return`** (sin `if`, un solo `return`, forma exacta). Pero
el predicado tiene **dos líneas de normalización antes**, y P4 no decía nada de ellas. El
ablandamiento cabe entero ahí, sin `if`, con un solo `return` y con el `return` intacto.
Vector del custodio, reproducido sobre mi tip:

```js
const base = p.startsWith('inventadisimo-zzz/') ? '' : (p.split('/').pop() || '');
```

```
GATE: gates: OK (0 offenders)   ·   MI SUITE: 7 tests · 7 pass · 0 fail
inventadisimo-zzz/registros/r1/registro.md → false   (la base lo protegía)
inventadisimo-zzz/delta.md                 → false   (la base lo protegía)
demo/wp/historia/registro.md               → true
```

Es **mi propio hallazgo del alfabeto movido una línea más arriba**: el prefijo cae fuera
del alfabeto de P1-P3, y la mutación no toca nada de lo que P4 miraba. **Eran TRES vías
—normalización, rama, retorno—, y yo había escrito «cierra las dos vías a la vez».**

**Salida tomada: (a), cerrar la clase entera.** P4 pasa a asever­ar el **cuerpo completo**
del predicado, normalizado sólo en espacios y saltos de línea (para que CRLF/LF no lo
rompa en Windows):

```js
const EXPECTED = String.raw`function isCuratedSidecarPath(relPath) { const p = String(relPath || '').replace(/\\/g, '/').toLowerCase(); const base = p.split('/').pop() || ''; return base.endsWith('.md'); }`;
```

Se eligió (a) y no (b) porque el predicado son **tres líneas puras y es API pública
publicada**: aquí la fragilidad no es un coste que haya que tolerar, es la garantía que se
compra. Las aserciones granulares (`if`, número de `return`, ternario, literales) se
conservan **delante** del cierre para que el fallo diga *qué* se rompió, no sólo *que* se
rompió.

### Batería final — las tres vías, 10 vectores

```
VIA 1 · RAMA (`if` insertado)
  gate=VERDE test=ROJO  | V1 startsWith('borradores/')          [vector del revisor, ronda 2]
  gate=VERDE test=ROJO  | V3 carpeta FUERA de mi alfabeto
  gate=VERDE test=ROJO  | V6 base === 'notas.md'
  gate=VERDE test=ROJO  | V7 base.startsWith('z')
  gate=ROJO  test=ROJO  | V8 vuelve el literal de juego

VIA 2 · RETORNO (sin `if`)
  gate=VERDE test=ROJO  | V10 ternario por directorio
  gate=VERDE test=ROJO  | V11 AND negado por directorio

VIA 3 · NORMALIZACION  [la puerta que quedaba abierta]
  gate=VERDE test=ROJO  | V15 ternario en `base`               [vector del revisor, ronda 3]
  gate=VERDE test=ROJO  | V16 recorte por `replace` en `base`
  gate=VERDE test=ROJO  | V17 estrechar en `p` (linea 1 de normalizacion)

CONTROL
  gate=VERDE test=VERDE | V14 el predicado tal cual (debe quedar VERDE)
```

**10 de 10 caen, en las tres vías. El gate queda verde en 9 de esos 10**: la constatación
más útil de todo el WP es que **el gate no protege la curación** — sólo prohíbe el nombre
de juego. Quien confíe en `npm run gates` para que no se ablande el predicado, confía en
lo que no es.

**Coste declarado**: P4 fija el cuerpo entero, así que **cualquier** edición del predicado
—incluido un refactor equivalente— pone rojo. Es un falso positivo consciente y la razón
de existir del guardián: que nadie toque estas tres líneas sin volver a pasar esta
batería. El mensaje de fallo lo dice y remite a este apartado.

### La cuarta vía: no la persigo, la anoto

Como pedía el encargo, dejo anotado sin perseguirlo lo que P4 sigue sin cubrir, para que
nadie lo lea como «cerrado del todo»: **P4 sólo mira el cuerpo de `isCuratedSidecarPath`**.
Un ablandamiento podría venir de fuera de esa función —reasignando el export en
`index.mjs`, envolviendo el módulo, o cambiando `merge` para que consulte otra cosa— y
ninguna de las cuatro propiedades lo vería. Es ya un modelo de amenaza distinto
(contribuyente hostil, no regresión) y arreglarlo sería la carrera armamentística que el
encargo manda cortar. **No lo persigo; queda escrito.**

### Probe rojo del literal — ejecutado, no prometido

Replantado a mano `if (base === 'registro.md' || base === 'delta.md') return true;`:

```
=== GATE con el literal replantado ===
gates: FAIL (1 offender(s))
  [two-games] packages/engine/linea-kit/src/curation.mjs:79 — matched delta: if (base === 'registro.md' || base === 'delta.md') return true;
GATES_EXIT=1

=== TEST NUEVO (version antigua) con el literal replantado ===
not ok 1 - isCuratedSidecarPath · forma, no nombre (WP-U202-B2)
# tests 4 · pass 3 · fail 1
```

Queda probado que **el gate sigue viendo `curation.mjs`** — no se le cegó con ninguna
excepción. Revertido con `git checkout --`; tip limpio.

### Alcance del guardián «cero literales» (P4, última aserción)

Caza el literal de **una pieza** (`'registro.md'`). **No** caza la concatenación: con
`base === 'registro' + '.md'` el **gate queda VERDE y el test también** (medido) — porque
`registro` no es nombre de juego. Con el nombre de juego, `base === 'delta' + '.md'`, el
**gate sí cae** (`FAIL, 1 offender`, medido) aunque esa aserción no lo vea. Es decir: para
la concatenación la red es el gate, y sólo cuando el nombre es de juego. Se declara como
aviso temprano barato, no como barrera.

### Dónde corre esto de verdad — y dónde no

`@zeus/linea-kit` y `@zeus/volumes-ops` **NO están en la matriz de workspaces de CI**
(`ci.yml:44-75`, 25 entradas; ninguna es la de estos dos paquetes; `release.yml:83` repite
el bloque). Consecuencia honesta: **ni este fichero de test ni los 56/56 de `volumes-ops`
se ejecutan en CI**. La única barrera automática sobre este arreglo es `npm run gates` /
`npm run test:gates` del job `quality` — que cubre el offender (V8) pero **no** los diez
estrechamientos de la batería. Es preexistente y no lo arregla este WP, pero decirlo
importa: sin ello, §5 se leería como una garantía automática que no existe.

---

## 6. Suites — medidas ANTES y DESPUÉS

**Aviso de método, importante para leer estos números**: el worktree venía **sin
`node_modules`** (`ls node_modules` → no existe). La primera medida de las suites de
paquete era, por tanto, ruido de entorno, no deuda de código:

| suite | ANTES (worktree sin deps) | ANTES (con deps, base real) | DESPUÉS |
| --- | --- | --- | --- |
| `npm run test:gates` | 22 pass · **1 fail** | 22 pass · **1 fail** | **23 pass · 0 fail** |
| `npm test -w @zeus/linea-kit` | 9 pass · 5 fail (`Cannot find package 'ajv'`) | 36 pass · 0 fail | **43 pass · 0 fail** |
| `npm test -w @zeus/volumes-ops` | 0 pass · 7 fail | 56 pass · 0 fail | **56 pass · 0 fail** |
| `npm run test:release` | — | **6 pass · 0 fail** | **5 pass · 1 fail** ⚠️ |
| `npm run lint` | no ejecutable (eslint ausente) | — | **EXIT 0**, 0 errors |

### ⚠️ `test:release` queda en 5/6, a propósito — declarado, no escondido

**Esta fila faltaba en la primera entrega y su ausencia era el fallo**: §6 decía haber
medido las suites «ANTES y DESPUÉS» y §9 cerraba las CA sin ella. La obra no cambia; la
honestidad del reporte sí.

El fallo es `not ok 6 - version tree prepared: protocol CHANGELOG after changesets
consumed (WP-U105)`. Su aserto es `release-u53.test.mjs:127`:

```js
const pending = fs.readdirSync(path.join(root, '.changeset'))
  .filter((f) => f.endsWith('.md') && f !== 'README.md');
assert.equal(pending.length, 0, 'pending changesets should be consumed into version tree');
```

Causa **probada por aislamiento**: retirando mi changeset la suite vuelve a **6/6**;
devolviéndolo, **5/6**. Es exactamente y sólo mi fichero.

**No lo quito**, y la razón no es de comodidad: el predicado es API pública publicable y
el changeset es el artefacto que hace viajar el cambio (CA-7). Quitarlo para dejar una
suite verde sería colar el cambio de contrato, que es justo lo que CA-7 prohíbe.

**Es el ciclo normal de este repo**, verificado en la historia y no supuesto: el aserto ya
existía cuando `e873376` («release(p0): changesets publicación P0×4») **plantó**
`.changeset/d42-go-publish-p0x4.md` dejando esta misma suite roja, y `3b6eb2f`
(«chore(release): version packages») la **consumió** devolviéndola a verde borrando ese
fichero y escribiendo los CHANGELOG. Mismo patrón en `6262f1d` → `73ac818` (15 changesets).
Se cierra sola en el próximo `changeset version`; **no requiere acción de nadie**.

- El único fallo de `test:gates` era `not ok 1 - CA verde: npm run gates / runAllGates
  limpio en el repo actual` (`gates.test.mjs:34`) — exactamente el que este WP cierra.
  Los otros 22 pasaban ya. **Incógnita (1) del brief resuelta.**
- **Incógnita (2) del brief resuelta**: la suite de `linea-kit` **no** venía rota por otra
  causa. Los 5 ficheros que fallaban lo hacían por `ERR_MODULE_NOT_FOUND: ajv` — declarado
  en `linea-kit/package.json:30` pero no instalado. Con `npm install`: **36/36**. CA-5 no
  estaba bloqueada por deuda ajena. Los 4 tests nuevos llevan la suite a 40/40, y las
  **36 preexistentes siguen verdes contra el `src` nuevo** (medido por separado).
- `volumes-ops` **56/56 con 0 ediciones de sus tests**, incluida la CA-3 de
  `import-lineas-driver.test.mjs:261` (`registro.md`/`delta.md` jamás pisados). Verificado
  además por qué no podía romperse: el pack sintético contiene 5 ficheros de fixture
  (**ninguno `.md`**) más los 2 sidecars que crea `buildLineasPack:83-92`, ambos bajo
  `registros/` — así que la lista exacta que afirma `deepEqual` no cambia con el ensanche.

---

## 7. Corrección de ficha (CA-10) — la atribución **era falsa**

`BACKLOG.md:225` decía «introducidos por `ca698d0`/**U202**». **Falso para 2 de los 3.**

```
$ git show ca698d0 --stat
ca698d03621fd988d33ac6bac6e836ac7c10f3a0
wp(U202): volumes-ops — driver LINEAS (...)

 packages/engine/volumes-ops/src/driver-lineas.mjs  | 201 ++++++++++++
 packages/engine/volumes-ops/src/drivers.mjs        |  41 +++
 packages/engine/volumes-ops/src/import.mjs         | 105 ++++++-
 packages/engine/volumes-ops/src/index.mjs          |   2 +
 .../volumes-ops/test/import-lineas-driver.test.mjs | 346 +++++++++++++++++++++
 .../engine/volumes-ops/test/import-pack.test.mjs   |   3 +-
 6 files changed, 694 insertions(+), 4 deletions(-)
```

**Ninguno de los 6 ficheros es `curation.mjs`.** `ca698d03` no pudo introducir los
offenders 1 y 2. El blame los sitúa en su commit **padre**:

```
$ git blame -L 56,56 -- packages/engine/linea-kit/src/curation.mjs
b051991a (2026-07-31 19:16:27 +0200 56)  * `registro.md` / `delta.md` anywhere in a LINEAS volume, plus ANY `*.md`

$ git blame -L 68,68 -- packages/engine/linea-kit/src/curation.mjs
b051991a (2026-07-31 19:16:27 +0200 68)   if (base === 'registro.md' || base === 'delta.md') return true;

$ git blame -L 21,21 -- packages/engine/volumes-ops/src/driver-lineas.mjs
ca698d03 (2026-07-31 19:16:28 +0200 21)  * - curación intocable: `registro.md`/`delta.md` (and any `*.md` under

$ git log -1 --format=%H ca698d0^
b051991a13f31312daf3d958569c044ed63a33fb
```

**Reparto verdadero**: `b051991a` **2/3** (`curation.mjs:56`, `:68`) + `ca698d03` **1/3**
(`driver-lineas.mjs:21`). Mismo WP (U202), dos commits consecutivos con 1 segundo de
diferencia. El error venía arrastrado de `WP-U180-catalogo-ola1.md:327`.
`BACKLOG.md:225` queda corregida con esta evidencia y la fila cerrada ✅.

---

## 8. Alcance del diff (CA-8) y limpieza

Base fijada: **`87bd93f`**. `git diff --name-only 87bd93f..HEAD`:

```
.changeset/curated-sidecar-por-forma.md
packages/engine/linea-kit/src/curation.mjs
packages/engine/linea-kit/test/curation-sidecar.test.mjs
packages/engine/volumes-ops/src/driver-lineas.mjs
plan/BACKLOG.md
```

**5 ficheros, todos dentro del territorio.** Territorio prohibido con **0 ediciones**,
verificado por `git diff --name-only` acotado: `scripts/gates/` (scan.mjs **y**
exceptions.mjs), `volumes-ops/src/{drivers,import}.mjs` (U205), `linea-kit/src/index.mjs`
(la lista de exports no cambia), `test/gates/`, `volumes-ops/test/`. `git status` final:
**limpio**, sin residuo `packages/mesh/zz-pieza-fantasma-u233/`.

### Contrabando evitado — nota para el orquestador

`npm install` (necesario: el worktree venía sin `node_modules`) ensució **4 ficheros
rastreados** que no son de este WP. **Revertidos todos** antes de commitear:

- `packages/engine/{feed-kit/bin/jetstream-sync,linea-kit/bin/linea-kit,playbook-kit/bin/run-playbook}.mjs`
  — sin diff de contenido, sólo finales de línea reescritos al enlazar los bins.
- `package-lock.json` — **102 líneas**, y no son inocuas: `npm install` regeneró el lock y
  **de paso arregló el defecto que describe `U237-B3`** (`"license":"AIPLv1"` → `"SEE
  LICENSE IN LICENSE.md"`, más entradas de licencia que faltaban en los workspaces).
  Revertido: **no es de este WP y cerrarlo de tapadillo habría dejado a U237-B3 sin
  trazabilidad**. Dato útil gratis para quien lo tenga: el arreglo de U237-B3 parece ser
  literalmente `npm install` + commitear el lock, y el diff coincide con el defecto
  descrito en la ficha.

---

## 9. Estado de las CA

| CA | estado | evidencia |
| --- | --- | --- |
| CA-0 job `quality` | ✅ | lint EXIT 0 (0 errors) → gates EXIT 0 → test:gates 23/23, en ese orden |
| CA-1 stdout antes/después | ✅ | §1, literal, con EXIT |
| CA-2 `test:gates` 23/23 | ✅ | 22/23 → **23/23**; el que fallaba era `gates.test.mjs:34` |
| CA-3 grep `\bdelta\b` = 0 | ✅ | §1; sin concatenación ni escapes |
| CA-4 (guardia) volumes-ops | ✅ | 56/56, 0 ediciones de sus tests; CA-3 de `import-lineas-driver.test.mjs:261` en pass |
| CA-5 test nuevo | ✅ | §5, propiedades P1-P4 (P4 = cuerpo completo) sobre 26.096 rutas + batería final de 10 vectores en las TRES vías, todos en rojo; linea-kit 43/43 |
| — `test:release` | ⚠️ **declarada** | 6/6 → **5/6** por el changeset de CA-7; ciclo normal del repo, se consume en el próximo `changeset version` (§6) |
| CA-6 doc == código | ✅ | §3-§4; **estaba roja antes del WP** (fila `registros/r1/notas.md`) y queda cerrada |
| CA-7 contrato declarado | ✅ | tabla ANTES/DESPUÉS por ejecución + changeset SÍ, con ruta |
| CA-8 alcance del diff | ✅ | §8, base fijada `87bd93f`, 5 ficheros |
| CA-9 (sólo vía B) | n/a | no se tomó la vía B |
| CA-10 ficha verdadera | ⚠️ **parcial** | `BACKLOG.md:225` corregida con evidencia; **`:263` NO tocada** — ver abajo |

### Omisión declarada, no olvidada: `BACKLOG.md:263`

CA-10 pide alinear también la fila **U202** (`:263`), que describe el predicado con el
conjunto viejo («no pisa `registro.md`/`delta.md`»). **No la he tocado**, por dos razones
que prefiero declarar antes que resolver por mi cuenta:

1. El encargo acota `plan/BACKLOG.md` a **«SOLO la fila de U202-B2 … ni una línea más:
   ese fichero lo escriben varios»**. Ensanchar el diff en un fichero con escritores
   concurrentes, sin permiso explícito, es exactamente la clase de sobre-alcance que este
   swarm penaliza — y arriesga conflicto de merge con otro carril.
2. La fila `:263` es un **registro histórico ya aceptado** («Aceptado 2026-07-31»): dice
   lo que U202 entregó *entonces*, y entonces era cierto.

El conjunto nuevo queda documentado íntegro en la fila U202-B2 y en este reporte. **Si el
custodio quiere `:263` alineada, es una edición de una celda y la ejecuto en cuanto lo
diga.**

---

## 10. Lo que este WP deja dicho a los que vienen

- **`merge` no pisa nunca un fichero existente** (§3, probado sobre el driver real). El
  predicado de curación clasifica el reporte; no es el guardián de la escritura. Quien
  vaya a U205 (driver SSB) o a U242 (generalización de drivers) y herede esta forma
  conviene que lo sepa: la protección real vive en la estructura de `merge`, no en el
  predicado, y quien copie el patrón sin copiar esa estructura perderá la garantía
  creyendo que la lleva puesta.

  **Matiz obligado: lo que recomiendo heredar tiene un hueco, y hay que heredarlo sabiendo
  cuál.** La primera entrega decía «hereden la estructura de `merge`» a secas. Esa
  estructura **no lleva la guarda de ancestro bloqueante** que el driver FIREHOSE sí
  añadió tras su defecto D3. Vector reproducido con los dos drivers, base y tip:

  ```
  destino: `demo/raw` existe como FICHERO · pack trae `demo/raw/linea.md`
  BASE  (87bd93f) plan.moves = ["demo/raw/linea.md"] -> ejecucion LANZA EEXIST -> volumen a medias
  TIP   (u202b2)  plan.moves = ["demo/raw/linea.md"] -> ejecucion LANZA EEXIST -> volumen a medias
  ```

  **Idéntico en base y tip: no lo introduce este WP y no es suyo arreglarlo** — se deja
  escrito con vector para que el custodio lo enrute. FIREHOSE lo cubre con
  `blockingAncestor` (`driver-firehose.mjs:367-375`) y lo documenta en `:143-149`:
  «*sin esa guarda `importPack` LANZABA `EEXIST` a mitad de los renames, modo de fallo no
  declarado por el contrato y volumen a medias*». LINEAS devuelve el `move` sin
  comprobarlo. Quien generalice drivers en U242 debería subir esa guarda al contrato, no
  reimplementarla por familia.
- **`isCuratedSidecarPath` es API publicada** (`./curation`, v0.3.0, registry propio). No
  se pudo determinar si hay consumidores externos —no se consultó la red—; dentro del
  monorepo el único es `driver-lineas.mjs:37`. El changeset queda para que el cambio viaje
  declarado.
- **Sigue abierta la incógnita (3) del brief**: no se puede saber leyendo si el corpus
  vivo tiene markdown fuera de `registros/`; `linea-aleph` (~48 MB, 677 registros) no está
  en este repo (U207). Con la vía A-BIS esa incógnita **deja de ser un riesgo**: cualquier
  markdown que aparezca donde sea queda protegido. Era el otro motivo para no estrechar.

---

## 11. Qué frases cambiaron en la devolución, y por qué

**El código del arreglo no cambió ni una línea.** Lo que cayó fueron cuatro afirmaciones
del reporte y una del test: todas de la misma clase —**alcance declarado más ancho que la
evidencia**—, que es la que costó cuatro bloqueantes la ola pasada. Se dejan escritas por
su nombre porque el punto no es que estuvieran mal, sino **por qué se pudieron escribir**.

| # | frase que caía | por qué era más ancha que la evidencia | qué dice ahora |
| --- | --- | --- | --- |
| 1 | «se pondría rojo si alguien **estrechara el conjunto**» (§5, guardián de superconjunto) | Describía como **propiedad** lo que era **una lista de 9 rutas fijas**. Un estrechamiento que las esquive pasa: `startsWith('borradores/')` → gate y test **verdes**, 4 rutas desprotegidas | P1-P4 sobre 26.096 rutas + **P4 sin ramas**, con batería de 14 vectores y el alcance de cada propiedad escrito |
| 2 | «medí las suites ANTES y DESPUÉS» (§6) + tabla de CA sin la fila | Omitía una suite que **yo dejé en rojo**: `test:release` 6/6 → 5/6. La medida no era falsa; era **incompleta en la dirección que me favorecía** | fila propia, causa aislada, precedente histórico verificado y razón de no quitar el changeset |
| 3 | «resuelve los sidecars por forma (`loader.mjs:384`)» (§2) | Doble: cita **off-by-one** (es `:383`) y precedente presentado como **puro** cuando `loader.mjs:391,397` siguen hardcodeando `registro.md`. Sostiene «no hardcodees el **nombre de juego**», no «forma, nunca literal» | cita corregida y precedente acotado a lo que de verdad sostiene |
| 4 | «el literal se eliminó, no se disfrazó» (CA-3) | Grep acotado a los dos `src/`, mientras el mismo commit planta **6 ocurrencias** del nombre en el test nuevo. Exentas por categoría, pero el recorte del grep las tapaba | alcance explícito: desapareció **de `src/`**; en `test/` sigue, amparado por exención que no toqué |
| 5 | §10 «hereden la estructura de `merge`» | Recomendaba heredar justo la estructura **sin** la guarda de ancestro (D3) que FIREHOSE añadió. El consejo era bueno y el hueco iba de regalo | mismo consejo **con el hueco nombrado**, vector reproducido y ruta a `blockingAncestor` |

| 6 | «prohibir la rama **cierra las dos vías a la vez**» (§5, P4 de la 2ª vuelta) | Eran **tres**. P4 vigilaba rama y retorno, pero el predicado tiene **dos líneas de normalización antes** y ahí cabía el ablandamiento entero: `const base = p.startsWith('…/') ? '' : (…)` dejaba gate VERDE y suite **7/7** desprotegiendo rutas | P4 asevera el **cuerpo completo**; batería de 10 vectores sobre las **tres** vías, todos en rojo |

**El corolario que este WP mordió DOS veces.** La corrección hereda el vicio de lo
corregido, y aquí pasó en cadena:

1. Al reescribir el guardián escribí que P2 era «universal sobre la parte de directorio,
   no depende del alfabeto» — propiedad afirmada, no medida. La cacé yo atacando mi propio
   guardián: `inventadisimo-zzz/` y `base.startsWith('z')` la pasaban en verde. De ahí P4.
2. **Y al describir P4 volví a hacerlo**: escribí que «cierra las dos vías a la vez»
   cuando eran tres. Esa la cazó el custodio, con el mismo prefijo fuera de alfabeto
   **movido una línea más arriba**. La lección no es que se me escapara una vía: es que la
   frase «cierra la clase» se me escapó **dos veces seguidas**, incluso escribiéndola
   justo después de haber sido corregido por escribirla.

La regla operativa que queda, y que vale más que el arreglo: **un guardián no se describe,
se ataca; y quien lo escribe es quien tiene que atacarlo primero.** Con un corolario que
este WP demuestra empíricamente: **atacarlo una vez no basta si el ataque lo diseña quien
escribió la defensa** — mis dos baterías sólo cubrían las vías que yo ya había imaginado.
Por eso la anotación de la cuarta vía en §5 se deja **escrita y sin perseguir**: es la
forma honesta de parar una carrera armamentística sin fingir que se ganó.

Lo que **resistió** la devolución no se retocó: el superconjunto estricto (41 vectores
hostiles ajenos + 1024 rutas generadas, 0 pérdidas), la identidad de `moves` entre base y
tip, la afirmación fuerte sobre `merge`, la atribución corregida, la tabla de verdad y los
números del gate.
