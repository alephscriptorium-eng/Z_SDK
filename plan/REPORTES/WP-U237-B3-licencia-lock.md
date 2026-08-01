# WP-U237-B3 · licencia-lock — reporte

| dato | valor |
| ---- | ----- |
| agente | worker U237-B3 |
| fecha | 2026-08-01 |
| rama | `wp/u237b3-licencia-lock` |
| commit(s) | _(ver `git log` de la rama; base `87bd93f`)_ |
| estado propuesto | listo para revisión |

## LO PRIMERO: la divergencia NO era intencional

La pregunta que podía dar la vuelta al WP se contesta con el documento que define
el composite, `LICENSE.md:8`, citado literal (fichero abierto, no de memoria):

> **AIPLv1** is the historical short name of this composite: **AIPLv1 =
> GPL-3.0-or-later + Animus Iocandi** (custodian decision, 2026-07-31). **All
> packages of this workspace receive the identical license treatment.**

«Composite» califica al **contenido** de la licencia (dos capas: base copyleft +
capa Animus Iocandi), **no** a una composición de licencias distintas por
paquete. `LICENSE.md:13` lo cierra por el lado del vehículo: «Every
`package.json` in this workspace (root, all workspace members, and the nested
Angular library) declares: `"license": "SEE LICENSE IN LICENSE.md"`», porque npm
rechaza `LicenseRef-`. Y `LICENSE.md:12` fija la lectura SPDX autoritativa:
`(GPL-3.0-or-later AND LicenseRef-Animus-Iocandi)`.

**Conclusión: uniformar aquí no es un daño legal, es lo que el documento manda.**
El WP no reencuadra: el trabajo es que el lock refleje fielmente la composición
única declarada, y dejar un gate que detecte la deriva. Corolario de diseño: el
gate es **estricto sin excepciones por paquete** — si algún día un paquete
necesitara otra licencia, eso es una decisión del custodio sobre `LICENSE.md`,
no un waiver de lint (por eso este gate **no** se cablea a `exceptions.mjs`).

## 2ª entrega — qué frases corregí y por qué

La devolución no encontró ningún defecto en el lock ni en la aritmética. **Los
dos bloqueantes estaban en el gate nuevo**, y el defecto de fondo no era de
lógica: eran **dos frases que prometían más de lo que el código sostenía**. Las
enumero antes que nada, porque es la clase de error que costó cuatro bloqueantes
la ola pasada.

**Frase 1 — `:274` (diseño): «todo lo demás queda fuera por construcción, sin
listas negras que envejezcan».** Falsa. El universo era «claves del lock **+ una
ruta escrita a mano**», así que todo `package.json` que no fuese ninguna de las
dos estaba exento **en silencio**, y esa lista solo fallaba cerrada **al borrar**,
nunca **al añadir**. Mi propia auto-revisión (`:442-445`) describía la lista
hardcodeada 170 líneas más abajo: el reporte se contradecía consigo mismo.
Elegí la salida **(b)**: enumerar manifiestos y exigir que cada uno esté
clasificado. Y reescribí la frase con su alcance real, incluida la vía de escape
que queda (exenciones por clase de ruta), en vez de escribir «ahora sí es por
construcción» — que sería heredar el vicio de lo corregido.

**Frase 2 — `:301-307` (fail-closed): «tres formas de silenciar un gate […] están
cerradas».** El número era correcto y la implicación no: sugería cobertura. La
contrarrevisión encontró **una cuarta más barata que las tres**. Ahora la sección
lista **once** guardas, cada una con vector rojo propio, **y dice explícitamente
que no afirmo que la lista sea exhaustiva**.

**Por qué el bloqueante 1 era grave y no cosmético**: `lock.packages ?? {}` no
validaba nada, y el universo salía de ahí — universo vacío ⇒ cero offenders ⇒
verde. De los cinco vectores, `npm ci` tapaba cuatro pero **no** el lock en forma
npm 6 (`lockfileVersion: 1`), que pasa con exit 0 y un warning. Existía por tanto
un estado alcanzable en el que **la licencia deja de viajar del todo** —
literalmente lo que este WP vigila — con mi gate y `npm ci` los dos en verde.

**Corrección adicional que me devolvió la propia devolución**: mi contraprueba
original contra el glob («daría dos falsos rojos con `examples/external-consumer`
y `examples/ts-registry-consumer`») **no aplicaba**. El glob enumera
*manifiestos*, y esos directorios no tienen ninguno. Era un argumento que sonaba
a evidencia y no lo era; por eso la salida (b) no costó nada.

## Qué se hizo

1. Se regeneró `package-lock.json` con un comando limpio y reproducible. El
   diff resultó ser **de licencias, no de versiones**: 3091 claves antes y
   después, cero altas, cero bajas, cero cambios de `version`/`resolved`/
   `integrity`.
2. Se dio de alta el gate que **no existía**: regla `licencia` en
   `scripts/gates/scan.mjs`, que lee **las dos fuentes** (manifiesto y lock) por
   el campo `license` parseado, no por coincidencia de texto.
3. Se creó `test/gates/licencia.test.mjs` (fichero nuevo recogido por el glob de
   `package.json:83`), con las **dos caras** del vector rojo.
4. Se corrigió la fila `plan/BACKLOG.md:224` con las cifras medidas.
5. **2ª entrega**: se cerraron los dos bloqueantes del gate y los menores m1–m3,
   y se corrigieron las dos frases del reporte que prometían más de lo que el
   código sostenía (ver la sección anterior). El lock y la aritmética **no se
   tocaron**: la contrarrevisión los verificó enteros con parser propio.

**No se tocó ningún `package.json`**: el `ALCANCE_DIFF` lo permitía, pero el
análisis no lo justificaba — los 52 manifiestos ya declaraban el puntero desde
`bab559e`. El desajuste estaba **solo** en el lock.

## Archivos tocados

- `package-lock.json` — **modificado**: 51 entradas de workspace pasan a declarar
  el puntero.
- `scripts/gates/scan.mjs` — **modificado**: alta del scanner `scanLicenseCoherence`
  + la regla en las dos listas de registro + la séptima alternativa del typedef
  `GateRule`. **2ª entrega**: validación de la forma de `lock.packages` y de la
  presencia de la raíz (B1), enumeración de manifiestos con `collectManifests` +
  `isManifestLicenseExempt` (B2), guarda de entrada no-objeto (m1), validación
  real de `LICENSE.md` con `checkLicenseFile` (m2) y eliminación del `return`
  temprano (m3). No se reescribió ningún scanner ajeno.
- `test/gates/licencia.test.mjs` — **creado**: 12 casos en la 1ª entrega, **27**
  tras la 2ª.
- `plan/BACKLOG.md` — **modificado**: solo la fila `U237-B3`.
- `plan/REPORTES/WP-U237-B3-licencia-lock.md` — **creado**: este reporte.

## Aritmética: las cifras REALES, medidas, no repetidas

El BACKLOG decía «50 entradas frente a 48 manifiestos». **Las dos cifras existen,
pero no son comparables entre sí**: cuentan universos distintos. Recuento propio.

### Universo del lock (medido)

```
$ node -e "const p=JSON.parse(require('fs').readFileSync('package-lock.json','utf8')).packages;
  const k=Object.keys(p).filter(x=>x===''||!x.includes('node_modules'));
  console.log('total keys',Object.keys(p).length,'| dir keys',k.length);"
total keys 3091 | dir keys 51
```

- **3091** entradas totales en `.packages`.
- **51** = clave raíz `""` + **50** directorios de workspace (48 bajo
  `packages/*/*` + 2 bajo `examples/*`). Verificado: `ls -d packages/*/*/ | wc -l`
  → `48`; las 2 claves de `examples` son `examples/game-demos` y
  `examples/ping-pong-bots`.
- **50** entradas `link:true`, todas resuelven a un directorio existente
  (`unresolved 0`): **no hay paquetes fantasma ni entradas de más**.

### Estado de esas 51 en la base `87bd93f` (medido sobre el lock de partida)

| valor del campo `license` | nº | quiénes |
| ------------------------- | -- | ------- |
| `"AIPLv1"` | 49 | la raíz `""` + los 48 de `packages/*/*` |
| **campo ausente** | 2 | `examples/game-demos`, `examples/ping-pong-bots` |
| `"SEE LICENSE IN LICENSE.md"` | **0** | — |

**Las 51 estaban mal, no 50.** Y el matiz que el BACKLOG perdía: 2 de ellas no
mentían con otro valor — **no declaraban nada**.

### De dónde salía el «50» del BACKLOG

`grep -c '"license": "AIPLv1"' package-lock.json` sobre la base → **50**. Pero
esas 50 líneas son **49 de workspace + 1 de un paquete de registry**:
`node_modules/@alephscript/mcp-core-sdk` (clave en lock:62, `license` en lock:66
del árbol base), resuelto desde `https://npm.scriptorium.escrivivir.co`. Ese
paquete se publica **fuera de z-sdk** y su licencia no la gobierna este repo.
Contar esa línea junto a las de workspace es lo que producía el «50».

### Universo de manifiestos (medido)

```
$ git ls-files | grep -E '(^|/)package\.json$' | wc -l
53
```

**53** `package.json` reales rastreados (el `54` que sale con el glob `*package.json`
incluye `packages/mesh/operator-ui/projects/threejs-ui-lib/ng-package.json`, que no
es un manifiesto npm). Agrupados por valor de `license`:

| valor | nº | quiénes |
| ----- | -- | ------- |
| `"SEE LICENSE IN LICENSE.md"` | **52** | raíz + 50 miembros + la anidada `threejs-ui-lib` |
| campo ausente | 1 | `packages/engine/protocol/test/fixtures/ts-subpath-smoke/package.json` (fixture de test, `private:true`) |

**Los 52 manifiestos ya estaban bien en la base.** Confirmado también contra el
commit: `git grep -c 'SEE LICENSE IN LICENSE.md' 87bd93f -- '*package.json'` → 52
ficheros.

### Los tres «denominadores» que hay que desambiguar

Hay varios «51» incompatibles circulando. Este WP usa el segundo y lo dice:

| censo | valor | definición |
| ----- | ----- | ---------- |
| canónico del mundo (`plan/MATRIZ-RUNTIME-51.md`) | 51 | 50 miembros + 1 anidada, **sin la raíz** |
| **de este WP** | **51** | **raíz + 50 directorios de lock, sin la anidada** |
| manifiestos con puntero | 52 | raíz + 50 miembros + anidada |
| `package.json` reales rastreados | 53 | los 52 + la fixture `ts-subpath-smoke` |

Además, `examples/` tiene **4** directorios pero solo **2** con manifiesto:
`external-consumer` y `ts-registry-consumer` no tienen `package.json`, así que
no son miembros de workspace ni tienen clave de lock.

## La causa del desajuste

**Manifiestos cambiados sin regenerar el lock.** No es un lock desactualizado por
deriva de dependencias, ni entradas de paquetes que ya no existen. Evidencia
directa, en este worktree:

```
$ git log -1 --format='%h %ad %s' --date=iso -- package-lock.json
a4d5374 2026-07-25 13:02:05 +0200 build(deps): skills-scriptorium 0.10.0 -> 0.11.0 …

$ git show --stat bab559e | tail -1
 52 files changed, 52 insertions(+), 50 deletions(-)

$ git show --name-only --format='' bab559e | grep -c 'package-lock.json'
0
```

`bab559e` (2026-07-31 18:00) tocó los 52 manifiestos y **no tocó el lock**. El
último commit que tocó el lock es `a4d5374`, **seis días antes** y por un bump
ajeno. La forma del stat lo confirma: 52 inserciones frente a 50 borrados — dos
manifiestos (los dos `examples/*`) **ganaron** una línea `license` que no tenían,
que es exactamente el par de entradas que en el lock aparecía sin campo.

Descartado explícitamente: **cero** paquetes fantasma (las 50 entradas `link:true`
resuelven todas), y **cero** claves de directorio sin manifiesto en disco.

## El comando exacto de regeneración

```
$ npm install --package-lock-only --no-audit --no-fund
up to date in 16s
```

Ejecutado en `C:/S_LAB/wt/z-u237b3` con `npm 10.9.4` / `node v22.21.1`, **sin
`node_modules` presente** en el worktree. Los dos registries de `.npmrc`
(`@alephscript` y `@zeus` → `https://npm.scriptorium.escrivivir.co`) resultaron
alcanzables — se comprobó antes de regenerar (`npm view @alephscript/mcp-core-sdk
version` → `1.5.0`). Se dejó copia del lock de partida antes de ejecutar para
poder hacer el diff semántico de abajo.

`--package-lock-only` no instala nada: no se creó `node_modules` ni se movió el
árbol de dependencias.

## NINGUNA VERSIÓN DE DEPENDENCIA SE MOVIÓ — la prueba

Diff semántico entre el lock de partida y el regenerado, campo a campo:

```
lockfileVersion 3 -> 3
keys 3091 -> 3091
keys added 0 removed 0
NON-LICENSE FIELD DRIFT entries: 2
    node_modules/@clack/prompts/node_modules/is-unicode-supported [dev] undefined -> true
    node_modules/@clack/prompts/node_modules/is-unicode-supported [extraneous] true -> undefined
LICENSE CHANGES: 51
  any change outside workspace keys? 0
```

(comparación sobre `version`, `resolved`, `integrity`, `link`, `dev`, `optional`,
`peer`, `extraneous`, `inBundle`, `hasInstallScript`, `engines`, `dependencies`,
`devDependencies`, `peerDependencies`, `optionalDependencies`, `bin`, `os`,
`cpu`, `funding`, `deprecated`, `bundleDependencies`, `workspaces`, `name`.)

Y el diff textual completo, **con toda línea `+`/`-` que no sea un campo
`license`**, listada una a una tal como exige la CA:

```
$ git diff --stat -- package-lock.json
 package-lock.json | 102 ++++++++++++++++++++++++++++--------------------------
 1 file changed, 52 insertions(+), 50 deletions(-)

$ git diff --unified=0 -- package-lock.json | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | grep -v '"license"'
-      "extraneous": true,
+      "dev": true,
```

**Una sola línea no-licencia en todo el diff**, y va en par. Justificación:
pertenece a `node_modules/@clack/prompts/node_modules/is-unicode-supported`
(clave en `package-lock.json:5021`), un paquete **bundled** (`"inBundle": true`)
que llega vía `@changesets/cli`, una `devDependency` de la raíz. npm lo tenía
marcado `extraneous` (= no alcanzable desde el grafo) y al regenerar lo
reclasificó a `dev` (= alcanzable como dependencia de desarrollo). Es una
**corrección de metadato de clasificación preexistente**: su `version` sigue
siendo `1.3.0`, no tiene `resolved` ni `integrity` (es bundled) y ninguno de esos
campos cambió. No es un movimiento de dependencia: no cambia qué se instala.

Recuento de las líneas de licencia: **51 `+` y 49 `-`** — 49 entradas pasan de
`"AIPLv1"` al puntero y 2 (`examples/game-demos`, `examples/ping-pong-bots`)
**ganan** el campo que no tenían. 51 − 49 = 2, cuadra con el stat.

**Cero cambios de licencia fuera de claves de workspace** (`any change outside
workspace keys? 0`): la entrada de registry sigue intacta, ver T1 abajo.

## El gate

`scripts/gates/scan.mjs` — nueva regla `licencia`, función `scanLicenseCoherence`.

**No existía ninguna comprobación de licencias en CI.** Verificado en este árbol
antes de escribir nada: cero coincidencias de `licen` en los 4 workflows de
`.github/workflows/` y cero en `scripts/gates/*.mjs`. La única mención en
`scripts/` era `release-dry.mjs:99-100`, y es una exclusión del listado del
tarball, no una comprobación. Construir el gate era, en efecto, la mitad del WP.

### Registro (las dos listas, más el typedef)

- `runAllGates`: `...scanLicenseCoherence(opts)` agregado al array de scanners.
- `byRule`: clave `licencia: []` añadida al mapa. **Esto no es cosmético**: la
  línea `byRule[o.rule].push(o)` lanza `TypeError` si la clave falta, así que sin
  ella el gate ni siquiera podría emitir un offender.
- `GateRule` (typedef de `scan.mjs:32`): séptima alternativa `'licencia'`.

Comprobado: `Object.keys(runAllGates().byRule)` →
`ports,transition,arg-import,two-games,google-stun,tracking-id,licencia`.

**No se tocó `scripts/gates/exceptions.mjs`** — está fuera del `ALCANCE_DIFF` que
me dieron, y además el gate no lo necesita: no cablea `isExcepted`, por la razón
legal explicada arriba (`LICENSE.md:8` prohíbe el trato diferenciado). Es una
divergencia consciente respecto del brief, que lo incluía en el territorio.

### Diseño: qué garantiza el gate, y con qué alcance exacto

> **Frase corregida en la 2ª entrega.** La primera versión decía «el gate no
> enumera por glob ni recorre el repo […] todo lo demás queda fuera **por
> construcción**, sin listas negras que envejezcan». Era **más ancha que el
> código**: el universo real era «claves del lock **+ una ruta escrita a mano**»,
> y todo `package.json` que no fuese ninguna de las dos quedaba exento **en
> silencio**. Se corrige la frase **y el código** (ver «Bloqueante 2»).

El gate cruza **tres** fuentes, y ninguna sola manda:

- **Lado lock** — universo: `workspaceLockKeys()` = clave `""` + toda clave
  **ninguno de cuyos segmentos** sea `node_modules` (partido por `/`, no
  `includes()`: un directorio `node_modulesish` no debe caer por accidente; hay
  test). Es la ruta real por la que la licencia viaja a una instalación.
- **Lado manifiesto** — esas mismas rutas + la raíz + la ruta explícita de la lib
  anidada (`EXTRA_LICENSED_MANIFESTS`), que `LICENSE.md:13` incluye pero que no
  tiene entrada de lock.
- **Enumeración** — **todos** los manifiestos que git rastrea. El que no sea
  clave de lock, ni esté en la lista, ni caiga en una clase eximida **por regla
  escrita**, es offender: «manifiesto sin clasificar».

La comparación es siempre sobre el **campo `license` parseado de JSON**, nunca
sobre la cadena `"AIPLv1"` ni sobre un grep del fichero.

**Alcance honesto de la garantía** (esto NO es «por construcción»): quedan
eximidas dos clases de ruta, y son una vía de escape con nombre —

1. cualquier segmento que empiece por `.` (utillaje: `.claude/`, `.changeset/`);
2. cualquier segmento `test` / `tests` / `fixtures` / `__fixtures__`.

Un manifiesto plantado bajo `…/test/` queda exento sin avisar. La diferencia con
la primera entrega es de tamaño y de visibilidad: antes estaba exento **todo**
manifiesto que no fuese clave de lock, y en silencio; ahora solo esa clase, y
está escrita, con test que fija sus bordes. Cerrarla del todo exige decidir si
una fixture debe declarar licencia — decisión del custodio sobre `LICENSE.md`,
no de este gate.

Las cuatro trampas conocidas, una a una, verificadas con el repo real
(`byRule.licencia` = `[]`):

- **T1 — entrada de registry con AIPLv1.** `node_modules/@alephscript/mcp-core-sdk`
  sigue diciendo `"license": "AIPLv1"` (hoy en `package-lock.json:68`; estaba en
  `:66` antes de regenerar — la línea se desplazó 2 porque los dos `examples/*`
  ganaron una línea `license` más arriba). Tiene segmento `node_modules` → fuera
  del universo. `grep -c '"license": "AIPLv1"' package-lock.json` → **1** (era 50).
- **T2 — manifiesto sin entrada de lock.**
  `packages/mesh/operator-ui/projects/threejs-ui-lib/package.json` no lo alcanza
  ningún glob de `workspaces` y `threejs` no aparece en el lock. Se verifica
  **contra el manifiesto**, nunca contra el lock. Contraprueba obligatoria
  cumplida: mutarle la licencia **sí** produce offender (test 7).
- **T3 — fixture del skill de swarm.** Corrección al brief medida aquí:
  `.claude/` está en `.gitignore:59` y **no existe en un checkout limpio** (ni en
  este worktree ni en CI), así que la trampa solo muerde en entornos locales con
  los skills instalados. Doblemente fuera: git no la rastrea, y además cae en la
  clase eximida de segmento con punto. Cubierta con equivalente sintético.
- **T4 — fixture de test.** `packages/engine/protocol/test/fixtures/ts-subpath-smoke/package.json`,
  `private:true`, sin campo `license`. **Sí está rastreada**, así que la
  enumeración la ve; queda exenta por la clase `test`/`fixtures`, no por silencio.
  Es el **único** manifiesto rastreado que necesita exención hoy — lo fija un test.
- **Falsos negativos por glob.** `examples/external-consumer` y
  `examples/ts-registry-consumer` matchean `examples/*` y **no tienen manifiesto**.
  Nota de la 2ª entrega: mi contraprueba original —«un glob daría dos falsos
  rojos»— **no aplicaba**, y la contrarrevisión tenía razón. El glob enumera
  *manifiestos*, y esos directorios no tienen ninguno: nunca aparecen. Por eso se
  pudo adoptar la enumeración sin coste.

### Fail-closed — once guardas, enumeradas

La primera entrega decía «**tres** formas de silenciar un gate […] están
cerradas». Eran tres, y la contrarrevisión encontró una cuarta más barata que las
tres. La lista real, cada una con test:

| # | vía de silenciamiento | guarda |
| - | --------------------- | ------ |
| 1 | `package-lock.json` ausente | offender |
| 2 | lock con JSON ilegible | offender |
| 3 | `lock.packages` ausente, `null` o array (incluye la forma npm 6) | offender |
| 4 | `packages` sin la clave raíz `""` (universo amputado) | offender |
| 5 | entrada de lock que no es objeto | offender (y no lanza) |
| 6 | `LICENSE.md` ausente | offender |
| 7 | `LICENSE.md` que no es fichero regular | offender |
| 8 | `LICENSE.md` vacío | offender |
| 9 | `LICENSE.md` con el texto de otra licencia | offender |
| 10 | manifiesto de `EXTRA_LICENSED_MANIFESTS` que desaparece | offender |
| 11 | manifiesto nuevo que no es miembro de workspace | offender |

**No afirmo que la lista sea exhaustiva.** Es la lista de las que hoy tienen
vector rojo en `test/gates/licencia.test.mjs`; la primera entrega ya demostró que
una docena de vectores ajenos encuentra lo que el autor no busca.

### El vector rojo — las DOS caras

Se mide sobre `byRule['licencia']` y sobre **árboles temporales**, nunca por exit
code (ver «línea base» abajo) ni mutando el lock de 1,5 MB del árbol de trabajo.

| cara | mutación | offender esperado | test |
| ---- | -------- | ----------------- | ---- |
| **A** | manifiesto de workspace → `"AIPLv1"` | `path` = ese `package.json`, con `line` | 4 |
| **B** | entrada raíz del lock → `"AIPLv1"` | `path` = `package-lock.json`, detalle `<raíz>` + «regenera el lock» | 5 |
| **B'** | entrada de miembro del lock rancia frente a su manifiesto | 2 offenders: el lock por su ruta **y** la discrepancia señalada en el manifiesto | 6 |
| limpio | ninguna | `[]` | 3 |

La cara A es literalmente el caso que produjo este WP: **alguien cambia una
licencia y no regenera el lock**.

## Evidencia

### Línea base ANTES de empezar (obligatorio declararla)

`npm run gates` **ya salía 1** en la base `87bd93f`, por 3 offenders `two-games`
ajenos en `packages/engine/linea-kit/` y `packages/engine/volumes-ops/` —
territorio del carril D (`U202-B2`), **prohibido para este WP**. Medido antes de
tocar nada:

```
ok= false total offenders= 3
   ports 0 | transition 0 | arg-import 0 | two-games 3 | google-stun 0 | tracking-id 0
   two-games: packages/engine/linea-kit/src/curation.mjs:56
              packages/engine/linea-kit/src/curation.mjs:68
              packages/engine/volumes-ops/src/driver-lineas.mjs:21
```

Por eso **ninguna CA de este WP se expresa como exit code de `npm run gates`**.

### Gates (obligatorio)

```
$ npm run gates
> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: FAIL (3 offender(s))
  [two-games] packages/engine/linea-kit/src/curation.mjs:56 — matched delta: * `registro.md` / `delta.md` anywhere in a LINEAS volume, plus ANY `*.md`
  [two-games] packages/engine/linea-kit/src/curation.mjs:68 — matched delta: if (base === 'registro.md' || base === 'delta.md') return true;
  [two-games] packages/engine/volumes-ops/src/driver-lineas.mjs:21 — matched delta: * - curación intocable: `registro.md`/`delta.md` (and any `*.md` under
(exit 1)
```

**Idéntico a la línea base: los mismos 3 offenders, los mismos ficheros, las
mismas líneas.** `two-games` = 3 antes y 3 después. Este WP **no arregla ni
empeora `U202-B2`**, y `byRule.licencia` = `[]`.

### Desglose por regla después del WP

```
ok= false total= 3
   ports 0 | transition 0 | arg-import 0 | two-games 3 | google-stun 0 | tracking-id 0 | licencia 0
   byRule keys: ports,transition,arg-import,two-games,google-stun,tracking-id,licencia
```

### `test/gates/licencia.test.mjs`

```
$ node --test test/gates/licencia.test.mjs
ok 1 - CA verde: el repo commiteado no tiene offenders de licencia
ok 2 - CA verde: la regla queda registrada en byRule
ok 3 - CA verde: árbol sintético limpio, con las cuatro trampas presentes
ok 4 - cara A (rojo): manifiesto de workspace mutado a AIPLv1 sin regenerar el lock
ok 5 - cara B (rojo): entrada raíz del lock mutada a AIPLv1
ok 6 - cara B (rojo): entrada de miembro del lock rancia frente a su manifiesto
ok 7 - contraprueba T2: la lib anidada SÍ se vigila, contra el manifiesto
ok 8 - fail-closed: la lib anidada declarada pero ausente es offender
ok 9 - fail-closed: puntero que apunta a un LICENSE.md inexistente
ok 10 - m2 fail-closed: LICENSE.md vacío
ok 11 - m2 fail-closed: LICENSE.md con el texto de otra licencia
ok 12 - m2 fail-closed: LICENSE.md siendo un directorio
ok 13 - m3: sin package-lock.json la lista extra SIGUE revisándose
ok 14 - B1 el gate NO se silencia con lock `{}`
ok 15 - B1 el gate NO se silencia con `packages` vacío
ok 16 - B1 el gate NO se silencia con `packages` como array
ok 17 - B1 el gate NO se silencia con `packages` null
ok 18 - B1 el gate NO se silencia con forma npm 6 (lockfileVersion 1, sin `packages`)
ok 19 - m1: una entrada de lock null es offender, no TypeError que tumbe el arnés
ok 20 - B2 manifiesto nuevo que no es miembro de workspace = offender
ok 21 - B2 el mismo manifiesto tampoco pasa sin campo `license`
ok 22 - B2 la exención es por clase de ruta, con nombre, y solo esas clases
ok 23 - B2 la enumeración sale del índice de git: nada no rastreado la altera
ok 24 - B2 sin git (árbol temporal) la reserva recorre el disco y ve MÁS, no menos
ok 25 - B2 el repo commiteado: todo manifiesto está clasificado o eximido por regla escrita
ok 26 - T1: el universo excluye toda clave con segmento node_modules
ok 27 - el universo commiteado es la raíz más los directorios de workspace
# tests 27
# pass 27
# fail 0
```

### Suite completa de gates — **cinco ejecuciones seguidas**

```
$ for i in 1..5; do npm run test:gates; done
# tests 50 # pass 49 # fail 1
# tests 50 # pass 49 # fail 1
# tests 50 # pass 49 # fail 1
# tests 50 # pass 49 # fail 1
# tests 50 # pass 49 # fail 1

$ npm run test:gates | grep '^not ok'
not ok 1 - CA verde: npm run gates / runAllGates limpio en el repo actual
```

El único fallo es el de `test/gates/gates.test.mjs:34`, **el preexistente de
`two-games`**. La suite pasa de 23 a 50 casos (23 + 27 nuevos) y el número de
fallos sigue siendo **1**, el mismo. Se ejecutó **cinco veces** a propósito: ver
el hallazgo fuera de alcance nº 5 sobre por qué las aserciones de este WP se
hacen contra el estado **commiteado** y no contra el disco vivo.

### Verificación de las CA

```
$ node -e "…dir keys, cuántas ≠ puntero…"
51 0 []                                    ← CA-1: cobertura 51/51 (era 51 51)

$ grep -c '"license": "AIPLv1"' package-lock.json
1                                          ← CA-2: era 50; el único es mcp-core-sdk

$ node -e "…examples…"
"SEE LICENSE IN LICENSE.md" "SEE LICENSE IN LICENSE.md"   ← CA-3: eran undefined
```

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u237b3-licencia-lock` |
| run_id | ⏳ sin verificar |
| workflow | CI |
| conclusion | ⏳ sin verificar — no se hizo push (el WP prohíbe merge y push) |

`.github/workflows/**` **no se tocó**: el scanner corre bajo el `npm run gates`
existente (`ci.yml:39-40`) y el test nuevo bajo `npm run test:gates`
(`ci.yml:41-42`), que lo recoge por el glob de `package.json:83`. Nota honesta:
cuando este WP llegue a CI, el job `quality` seguirá **rojo** por los 3 offenders
`two-games` de `U202-B2`, igual que ya lo estaba.

## Demolición

No hubo demolición: no se borró ningún símbolo ni paquete. La única «retirada» es
la cadena `AIPLv1` de las entradas de workspace del lock, y el grep que lo
demuestra está arriba (50 → 1, y el 1 que queda es de un paquete ajeno con
justificación escrita).

## Auto-revisión (PRACTICAS.md §3)

- **Puertos/URLs/rutas hardcodeados**: una ruta hardcodeada, deliberada y
  documentada: `EXTRA_LICENSED_MANIFESTS`. No es evitable (la lib anidada no tiene
  clave de lock) y es **fail-closed**: si se mueve, el gate se pone rojo. En la
  1ª entrega esta línea **contradecía** a la de diseño, que decía «por
  construcción, sin listas negras»: la lista existía y estaba descrita aquí, 170
  líneas más abajo. Las dos frases dicen ahora lo mismo.
- **Cadenas if/switch que debieron ser tabla**: el universo se deriva de dos
  funciones (`workspaceLockKeys`, `collectManifests`) y una regla de clase
  (`isManifestLicenseExempt`), no de una lista de instancias.
- **Duplicación con otros paquetes**: busqué antes — no había *ninguna*
  comprobación de licencia en el repo (grep de `licen` en workflows y gates → 0).
- **console.log / código comentado / TODO**: ninguno.
- **Nombres fuera de glosario**: la regla se llama `licencia`, en la misma lengua
  que el resto del arnés.
- **Tests prueban comportamiento, no «no explota»**: los 27 casos afirman sobre
  `path` y `detail` del offender concreto, no sobre longitudes sueltas.
- **Defectos menores declarados y NO corregidos** (por indicación del
  orquestador): **m4** — el `detail` no escapa espacios no separables, así que un
  offender causado por un NBSP dentro del valor imprime dos cadenas visualmente
  idénticas; es cosmético pero afecta justo al vector que más cuesta leer.
  **m5** — `findLockKeyLine` casa la primera línea que abre esa clave, así que
  con claves cortas en un lock escrito a mano puede señalar otro contexto: **la
  línea es orientativa**, el offender se identifica por `path` + `detail`. Ambos
  quedan anotados en el código, en el JSDoc de la función afectada.
- **Arranque real verificado**: N/A (gate, no servicio). Sí se ejecutaron gates y
  suite completa, con salida literal arriba.
- **El diff contiene solo el alcance del WP**: `git status` tras ejecutar todo →
  exactamente 3 ficheros de obra (`package-lock.json`, `scan.mjs`,
  `licencia.test.mjs`) + reporte + fila de BACKLOG. Correr las suites **no**
  ensució ningún fichero rastreado (comprobado, no supuesto).
- **No invasión del carril D**: `git diff --name-only` no contiene ningún path
  bajo `packages/engine/linea-kit/` ni `packages/engine/volumes-ops/`.

## Hallazgos fuera de alcance

1. **`GateRule` desincronizado** entre `scan.mjs` y `exceptions.mjs` —
   **ya enrutado por el orquestador (m6)**, no es mío. Se deja la nota por
   trazabilidad: `scan.mjs` declara 7 alternativas y `exceptions.mjs` sigue en 6;
   hoy es inocuo porque no hay `tsconfig` en la raíz ni job de typecheck en CI.
2. **`node_modules/@alephscript/mcp-core-sdk` publica `"license": "AIPLv1"`** a
   un registry vivo. `.npmrc` mapea `@alephscript` **y** `@zeus` al **mismo**
   registry privado, así que llamarlo «tercero» no lo sostiene la evidencia; es
   «fuera del alcance de z-sdk». Si ese paquete pertenece a otro mundo del swarm,
   el arreglo aguas arriba es un item aparte — aquí se dejó intacto a propósito,
   no se blindó con un permiso permanente.
3. **La fixture `ts-subpath-smoke` no declara licencia.** Es `private:true` y
   nunca se publica, así que no es un defecto legal; queda anotado por si el
   custodio quiere uniformidad total.
4. **`plan/GOBIERNO-EJECUCION-F2.md:525-528` tiene citas rancias**: dice
   `package.json:157` para un `"license": "AIPLv1"` que hoy no existe, y afirma
   «48/48 con `"license": "AIPLv1"`, medido por grep» — **hoy falso**: cero
   manifiestos dicen AIPLv1. Además llama «inconsistencia confirmada» a lo que
   `LICENSE.md:8` ya resolvió como composite intencional. **No lo corregí**: ese
   fichero no está en mi `ALCANCE_DIFF`. Lo dejo como item para el orquestador.
5. **(NUEVO, hallado en la 2ª entrega — candidato a P1)
   `test/gates/matriz-51.test.mjs` muta el repo real durante los tests**, y
   `node --test` corre los ficheros **en paralelo**. Dos mutaciones:
   - `:98-112` crea `packages/mesh/zz-pieza-fantasma-u233/package.json` (lo borra
     en `:130`);
   - `:137-153` **renombra fuera de sitio** un manifiesto rastreado y real,
     `packages/mesh/blob-sync-harness/package.json`, y lo devuelve después.

   Consecuencia: **cualquier test que lea el árbol de trabajo mientras esa suite
   corre está midiendo una carrera, no un hecho.** Lo detecté porque mi primera
   versión afirmaba sobre el disco vivo y fallaba de forma intermitente con dos
   síntomas distintos («manifiesto sin clasificar» por la pieza fantasma, y
   «manifiesto ausente» por el renombrado). **No lo arreglé** —`matriz-51.test.mjs`
   no está en mi `ALCANCE_DIFF`, que me pedía crear un fichero nuevo y no tocar
   el existente— y en su lugar hice inmunes mis propias aserciones: se ejecutan
   contra el estado **commiteado** (`git cat-file --batch` de HEAD a un árbol
   temporal, un solo proceso, 167 ms), que además es lo que viaja. La cobertura
   del árbol de trabajo la sigue dando `npm run gates`, que en CI corre **solo y
   antes** de los tests (`ci.yml:39-42`).

   Riesgo residual que NO me corresponde cerrar: si esa suite se interrumpe entre
   el renombrado y su reversión, deja el repo con un manifiesto de workspace
   **ausente**. Con este WP en el árbol, `npm run gates` lo detectaría —que es lo
   correcto—, pero la causa estaría en el arnés de tests, no en el gate.

## Dudas / bloqueos

Ninguno. Tres divergencias conscientes, todas por respetar el `ALCANCE_DIFF` que
me dieron y todas declaradas arriba: no se tocó `scripts/gates/exceptions.mjs`,
ni `plan/GOBIERNO-EJECUCION-F2.md`, ni `test/gates/matriz-51.test.mjs`.

Dos preguntas concretas:
1. El punto 4 (citas rancias en GOBIERNO) es trabajo de una sola pasada — ¿fila
   propia o lo asume la ola?
2. El punto 5 (la suite que muta el repo real en paralelo) es una trampa para
   **cualquier WP futuro** que quiera afirmar sobre el árbol de trabajo. ¿Se abre
   como fila, o se acepta la convención de que las aserciones de repo se hagan
   contra HEAD?

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
