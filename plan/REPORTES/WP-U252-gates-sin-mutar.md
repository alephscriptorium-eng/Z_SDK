# WP-U252 · la suite de gates deja de mutar el árbol — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U252) |
| fecha | 2026-08-01 |
| rama | `wp/u252-gates-sin-mutar` · base `28397b8` |
| commit(s) | `1fdd3da` fix(U252) — obra; este reporte + fila de BACKLOG en el siguiente |
| estado propuesto | listo para revisión |
| push | no intentado · sin merge |

## CA de cierre

**`npm run test:gates` verde SIN `--test-concurrency=1`.** Cumplida. El parche
está retirado de `package.json:83`.

---

## 1 · La salida real, antes y después

Ambas medidas con el flag YA retirado (`node --test test/gates/*.test.mjs`), que
es la única forma de medir el defecto: con `--test-concurrency=1` el rojo no
aparece porque no hay paralelismo.

### Antes (código sin arreglar, flag retirado) — ROJO

```
not ok 1 - CA verde: npm run gates / runAllGates limpio en el repo actual
  location: 'test/gates/gates.test.mjs:34:1'
  error: |-
    gates: FAIL (1 offender(s))
      [licencia] packages/mesh/blob-sync-harness/package.json — manifiesto ausente
                 para una ruta que el gate vigila
    false !== true
# tests 50
# pass 49
# fail 1
# duration_ms 2556.7636
```

Exit 1. Reproduce exactamente el `49/1` del diagnóstico del orquestador. El
ofensor **no está en el fichero que falla**: `gates.test.mjs:34` lee el árbol
vivo y lo lee mientras `matriz-51.test.mjs` tiene el manifiesto renombrado fuera
de sitio. La víctima denuncia; el culpable es otro fichero.

### Después (obra aplicada, flag retirado) — VERDE

```
# tests 57
# suites 0
# pass 57
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 4807.0327
```

Exit 0. **Tres corridas consecutivas**: `57/57` las tres, exit 0 las tres, y
`git status --porcelain` con **0 líneas** después de cada una. Los 7 tests
nuevos son 5 del guardián + 2 controles del árbol commiteado (§3).

Reparto por fichero: `gates.test.mjs` 10 · `licencia.test.mjs` 26 ·
`matriz-51.test.mjs` 16 · `arbol-inmutable.test.mjs` 5.

### Qué se cambió

`test/gates/matriz-51.test.mjs` — las fail-probes (a) y (b) ya no tocan el repo:

- `materializarCommiteado()` (`:114`) vuelca en un temporal el conjunto **exacto**
  de rutas que el gate lee, enumeradas desde el **índice** (`git ls-files`) y
  volcadas desde el **estado commiteado** (`git cat-file HEAD:`), con un solo
  `cat-file --batch`. Cuatro clases, todas derivadas, ninguna transcrita a mano:
  todo `package.json` rastreado · los `src/{server,mcp-server,start}.mjs`
  rastreados (los usa `mcpFileSignal`, `scripts/gates/matriz-51.mjs:428-436`,
  para decidir el tipo MCP) · cinco lecturas fijas (`LECTURAS_FIJAS`, `:68`) · y
  el **esqueleto de directorios de nivel 1** bajo cada glob de `workspaces`.
- El propio gate se copia dentro del temporal. Como su `REPO_ROOT` es
  `path.resolve(__dirname, '../..')` (`scripts/gates/matriz-51.mjs:52`), al vivir
  en `<tmp>/scripts/gates/matriz-51.mjs` apunta al temporal: el CLI se ejercita
  **de verdad, exit code incluido** (`runCliEn`, `:181`) sin tocar el repo. No
  hizo falta modificar el gate, que está fuera de mi ALCANCE_DIFF.
- `conArbolCommiteado()` (`:170`) da a **cada probe un árbol recién materializado**
  y lo borra. No hay estado compartido que revertir: la corrección de la probe ya
  no depende de que su `finally` acierte, que es justo lo que falló aquí.
- La probe (b) sigue **renombrando** (no borrando) el manifiesto: además de
  ocultar la pieza deja un vecino de nombre parecido que el walk no debe
  confundir con un manifiesto.

`package.json:83` — `--test-concurrency=1` retirado. Ni una clave más, ni una
dependencia.

**El esqueleto de directorios no es cosmético.** Sin él, dos directorios
rastreados que matchean `examples/*` **sin** `package.json`
(`examples/external-consumer`, `examples/ts-registry-consumer`) desaparecían del
árbol materializado, y con ellos sus dos entradas de «excluidos con motivo»: el
gate pasaba de 3 excluidos a 1 **sin fallar**. Un estrechamiento silencioso de la
vigilancia. Medido antes de añadirlo, no supuesto.

---

## 2 · Censo: ¿es matriz-51 la única que muta el árbol?

**No.** Barrido por la **operación** (escribir · renombrar · borrar · crear ·
chmod · `process.chdir` · shell-out que escribe) sobre rutas del repo, no por el
nombre de una función, y clasificando cada destino en *temporal de SO* vs
*dentro del repo*. Cubiertos los 4 ficheros de `test/**` en su totalidad y los
144 `*.test.mjs`/`*.spec.mjs` de `packages/**` y `examples/**`. Cada ofensor de
abajo lo he abierto y confirmado en su línea.

| # | fichero:línea | operación | destino | ¿rastreado? | ¿arreglado? |
| - | ------------- | --------- | ------- | ----------- | ----------- |
| 1 | `test/gates/matriz-51.test.mjs:137-153` (histórico) | `renameSync` ida y vuelta | `packages/mesh/blob-sync-harness/package.json` | **sí** | **sí** |
| 2 | `test/gates/matriz-51.test.mjs:98-112` (histórico) | `mkdirSync`+`writeFileSync`+`rmSync` | `packages/mesh/zz-pieza-fantasma-u233/` | no, pero **ni ignorado** | **sí** |
| 3 | `test/release/release-u53.test.mjs:27,29,46,51,53,77` | `mkdtempSync` **con prefijo en la raíz del repo** + write + `rmSync` | `<repo>/.release-dry-test-*/` | no, ni ignorado | **no** — fuera de ALCANCE_DIFF |
| 4 | `packages/engine/http-contract/test/core.test.mjs:101-112` | `writeFileSync`+`unlinkSync` | `packages/engine/http-contract/test/.tmp-spec.yaml` | no, ni ignorado | **no** — `packages/**` prohibido |
| 5 | `packages/engine/parte-kit/test/determinismo.test.mjs:22-24` | `writeFileSync` condicionado a `!existsSync` | `test/snapshots/parte-50.json` | **sí** | **no** — `packages/**` prohibido |
| 6 | `packages/engine/parte-kit/test/consumidores.test.mjs:23-25` | íd. | `test/snapshots/prosa-golden.md` | **sí** | **no** — `packages/**` prohibido |
| 7 | `packages/engine/linea-kit/test/validate-loader.test.mjs:136,141,183` | `process.chdir` a un dir del repo | — (estado de proceso) | — | **no** — no escribe |

Notas que cambian la lectura del censo, no sólo su longitud:

- **#3 es la trampa más instructiva del repo**: `fs.mkdtempSync(path.join(root,
  '.release-dry-test-'))` *parece* seguro porque dice `mkdtemp`, pero `root` es
  `path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')`
  (`release-u53.test.mjs:15`) — **la raíz del repo**. No es `os.tmpdir()`. Hoy no
  provoca carrera porque `test:release` es un script y un proceso aparte
  (`package.json:127`), distinto de `test:gates`; pero es el mismo error de
  clase, y el guardián estático de §4 lo caza como vector.
- **#5 y #6 son las únicas que escriben sobre ficheros RASTREADOS** además de la
  arreglada. Son golden self-healing: mientras el snapshot exista son no-op,
  pero si alguna vez falta **reescriben en silencio un fichero rastreado en vez
  de ponerse rojo**. No corren en `test:gates`.
- **Limpios y verificados**: `test/gates/gates.test.mjs` y
  `test/gates/licencia.test.mjs` (todo pasa por `mkdtempSync(os.tmpdir(), …)`);
  las 16 suites de `volumes-ops`/`linea-kit`/`ssb-system`/`mcp-launcher`/… que
  parecían candidatas resultaron todas temp-rooted; los dos `npm install` del
  corpus corren con `cwd: tmp`; **no hay** en todo el corpus de tests un
  `git checkout/apply/add/rm/mv/stash/reset`, ni un `execSync`, ni un `tar -x`.
  Las dos suites de `examples/**` tienen cero operaciones de escritura.
- Efecto secundario menor, no ofensor: `licencia.test.mjs:124` nunca borra su
  temporal `committedRepo()` — filtra un directorio en `os.tmpdir()` por
  proceso. Lo mismo NO ocurre en mi `conArbolCommiteado`, que borra en `finally`.

---

## 3 · Qué se pierde al aseverar contra el índice en vez del disco

Respuesta corta: **en esta obra, nada medible — porque no sustituí las
aserciones vivas, añadí las commiteadas.**

Es la diferencia con el precedente y conviene decirla clara. `licencia.test.mjs`
tuvo que mudar **todas** sus aserciones al árbol commiteado porque el mutador
seguía vivo y cualquier lectura del disco era una carrera. Aquí el mutador
**desaparece**, así que leer el árbol vivo vuelve a ser seguro: los tres CA
verdes originales sobre `REPO_ROOT` (`:189`, `:200`, `:221`) **siguen intactos**.
Sólo las dos probes destructivas se mudaron. La cobertura del árbol vivo no se
estrecha; se le añade la del árbol que viaja.

### La medida

Con el conjunto de lectura del gate limpio, el JSON de
`buildJson(runMatriz51(...))` sobre el árbol materializado es **byte-idéntico** al
del árbol vivo — 51 filas, mismo contraste, mismos 3 excluidos, mismas 10
declaradas-sin-pieza, mismos 0 fallos. No es una impresión: está aseverado como
test permanente (`equivalencia árbol vivo ↔ árbol commiteado`, `:278`) y ese test
corrió en verde en la CA (`# skipped 0`).

### El estrechamiento real, nombrado

El índice no ve **lo que no está en el índice**. Concretamente:

1. **Ficheros sin rastrear.** Una pieza nueva con `package.json` sin `git add`
   existe para el árbol vivo (52 ≠ 51 → rojo) y no existe para el commiteado (51
   → verde). Aquí no se pierde nada **porque los CA vivos siguen puestos**: el
   rojo lo da `:189`. Si un WP futuro muda esos CA al árbol commiteado, pierde
   esta detección — queda escrito para que no se haga por inercia.
2. **Modificaciones sin commitear** de cualquier ruta del conjunto de lectura.
3. **Staged-sin-commitear**: `git ls-files` lista desde el índice pero el volcado
   es de `HEAD:`. Si una ruta está `git add`-eada y no commiteada, `cat-file` la
   da `missing`. No degrada en silencio: `materializarCommiteado` lo **asevera**
   (`:135`) y el arnés para en seco nombrando la ruta. Fail-closed, y es el mismo
   comportamiento del precedente.

Para no confundir «materialización incompleta» con «el desarrollador tiene
trabajo encima» —que son bugs distintos y uno de los dos no es un bug—, el test
de equivalencia consulta primero `lecturasDivergentes()` (`:262`,
`git status --porcelain --untracked-files=all` restringido por pathspec al
conjunto de lectura). Si hay divergencia **se declara omitido nombrando las
rutas**; si no la hay, asevera identidad byte a byte. En CI el checkout está
limpio, así que allí **siempre** corre. Verificado en ambos sentidos: con
`package.json` modificado se omitió nombrando la ruta; con el árbol limpio corrió
y pasó.

Cobertura complementaria del árbol vivo, para tenerlo asentado: `npm run gates`
(`ci.yml:40`) **no incluye matriz-51** — `scripts/gates/run.mjs` sólo corre
`runAllGates` de `scan.mjs`. El único ejercicio de matriz-51 es su test. Razón de
más para haber conservado sus CA sobre `REPO_ROOT`.

---

## 4 · El guardián, y el intento de burlarlo

`test/gates/arbol-inmutable.test.mjs` — 5 tests. Dos mitades con **alcances
distintos y declarados**, porque ninguna de las dos basta sola.

### 4.1 Guardián estático (`:310`)

Lee el fuente de cada `test/gates/*.test.mjs` y busca la **operación** sobre una
ruta anclada al repo. No es un `grep`: propaga *taint* por asignaciones hasta
punto fijo (`identificadoresAnclados`, `:204`), porque el defecto original
escribía `const manifest = path.join(REPO_ROOT, …)` y **mutaba la variable** —
un scan del texto de la llamada se lo traga entero. Mira sólo los argumentos que
**son rutas** (`:59` distingue las ops de dos rutas), reconoce el import con
nombre además de `fs.X`, y cubre la escritura delegada (`git mv`, `npm install`).

**Prueba con el defecto real, no con un sintético** (`:332`): corre contra
`git show 28397b8:test/gates/matriz-51.test.mjs` y exige cazar el `renameSync`,
el `mkdirSync` **y** que al menos una ofensa venga por «identificador anclado» —
es decir, que la indirección por variable no le pase por encima. Verde.

### 4.2 Guardián dinámico (`:411`)

Corre el resto de la suite en un hijo (`node --test`, ventana acotada y conocida)
y censa mientras tanto el conjunto de lectura: tamaño y `mtime` de cada
manifiesto rastreado, más el contenido de los directorios de nivel 1 bajo los
globs de `workspaces` (para ver **aparecer** una pieza fantasma). Caza por
**efecto**, así que ninguna indirección de código lo rodea.

Declara su propia resolución en vez de afirmar que vigiló «siempre»: asevera
ventana mínima (≥10 muestras y ≥500 ms) y resolución (≤400 ms/muestra). Es un
muestreo: **una mutación más breve que su intervalo puede escapársele**. La que
motivó el WP duraba ~1,3 s.

### 4.3 El intento de burlarlo

Lo hice antes de entregar, y encontró tres defectos **en mi propio guardián**:

**(a) Falso verde silencioso — el más grave.** El hijo salía `0` en ~96 ms **sin
ejecutar nada**: heredaba `NODE_TEST_CONTEXT` del runner padre y se creía un
worker suyo. El guardián habría pasado en verde para siempre sin mirar nada.
Lo delató la aserción de ventana mínima, que estaba puesta precisamente por si
esto pasaba. Arreglado borrando la variable del entorno del hijo (`:427`).
Medido: `sin NODE_TEST_CONTEXT` 1709 ms / 6867 b de salida; `con` 96 ms / 0 b.

**(b) 11 falsos positivos sobre arnés correcto.** El taint por nombre es global
al fichero y no respeta ámbitos: `collectManifests(REPO_ROOT)` →
`for (const rel of enumerated)` → y ese `rel` colisionaba con el `rel` que es
**parámetro** de otra función, contagiando `abs` → `root` → `lock` → media
`licencia.test.mjs`, marcando 11 escrituras legítimas sobre temporales. Un
guardián que pinta de rojo el arnés correcto obliga a desactivarlo, que es peor
que no tenerlo. Arreglado con `fragmentosDeRuta` (`:187`): el ancla sólo se
propaga donde se **construye una ruta** (`path.*`, `fileURLToPath`, alias
directo, plantilla, concatenación), no por una llamada cualquiera.

**(c) Números de línea mentirosos.** El borrado de comentarios de bloque no
preservaba los saltos de línea, así que el informe apuntaba a `licencia.test.mjs:88`
cuando la línea era la 133. Arreglado (`:88`).

**El ataque final, contra el guardián ya arreglado.** Planté en `test/gates/` un
fichero que renombra `packages/mesh/blob-sync-harness/package.json` del árbol
vivo con **acceso computado a la API** —`fs['rename' + 'Sync'](m, o)`—, que es
un vector **declarado como fuga** del guardián estático, con una ventana de 900 ms:

```
ok 1 - guardián estático: ningún test de gates escribe...      ← VERDE (fuga declarada, se confirma)
ok 4 - LÍMITES declarados del guardián estático...
not ok 5 - guardián dinámico: el árbol no se mueve...
    el árbol de trabajo se movió durante la suite (130 muestras / 17047 ms):
    esperado `packages/mesh/blob-sync-harness/package.json:580:1785584145793.621`
    observado `packages/mesh/blob-sync-harness/package.json:AUSENTE`
```

Exactamente el reparto de trabajo que se pretendía: el estático no lo ve **y lo
dice**, el dinámico lo caza nombrando ruta y transición. Fichero de ataque
borrado tras medir; árbol verificado limpio.

**Los cuatro vectores que se le escapan al estático** están aseverados **como
fuga** en `test/gates/fixtures/vectores-mutacion-u252.mjs` (`FUGAS`): acceso
computado a la API · ruta cruzando frontera de módulo · `chdir` + ruta relativa
sin forma de repo · ruta reconstruida en caliente. Si alguien cierra uno, su test
se pone rojo y le señala este párrafo. La afirmación del guardián no es más ancha
que su evidencia: los 11 vectores que **sí** caza y los 6 de arnés legítimo que
**no** debe marcar están en el mismo fichero, como datos, fuera de
`*.test.mjs` para que el guardián no se denuncie a sí mismo.

---

## 5 · Archivos tocados

- modificado `test/gates/matriz-51.test.mjs` — probes (a)/(b) sobre árbol
  commiteado; `materializarCommiteado`/`conArbolCommiteado`/`runCliEn`; dos CA
  nuevos (control commiteado + equivalencia)
- creado `test/gates/arbol-inmutable.test.mjs` — guardián estático + dinámico
- creado `test/gates/fixtures/vectores-mutacion-u252.mjs` — vectores como datos
  (`CAZADOS` / `LIMPIOS` / `FUGAS`); no es suite, `test:gates` glob-ea
  `test/gates/*.test.mjs` sin recursión
- modificado `package.json` — **sólo** `test:gates`: fuera `--test-concurrency=1`
- creado `plan/REPORTES/WP-U252-gates-sin-mutar.md` — este reporte
- modificado `plan/BACKLOG.md` — sólo la fila U252

Sin tocar: `scripts/gates/**` · `package-lock.json` · `packages/**` ·
`.github/workflows/**`. Cero dependencias nuevas. `npx eslint test/gates/`
limpio (exit 0). Sin `git stash`.

## 6 · Lo que dejo enrutado

1. **`test/release/release-u53.test.mjs:15,27,51`** — `mkdtempSync` con prefijo
   en la raíz del repo. No corre en `test:gates`, así que no rompe hoy; misma
   clase de error. Fuera de mi ALCANCE_DIFF.
2. **`packages/engine/parte-kit/test/{determinismo,consumidores}.test.mjs`** —
   goldens self-healing que reescriben un fichero **rastreado** en vez de
   ponerse rojo si el snapshot falta.
3. **`packages/engine/http-contract/test/core.test.mjs:101-112`** —
   `.tmp-spec.yaml` dentro del árbol, ni rastreado ni ignorado.
4. **El guardián sólo vigila `test/gates/**`**, que es lo que `test:gates`
   ejecuta en paralelo. Ampliarlo a `packages/**` lo pondría rojo el primer día
   por (2) y (3): esa ampliación es un WP con arreglo, no un cambio de glob.
