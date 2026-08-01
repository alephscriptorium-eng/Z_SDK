# WP-U263 · el flujo que publica deja de llevar su propia copia — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U263) |
| fecha | 2026-08-02 |
| rama | `wp/u263-paridad-publicacion` · base `c241c22` |
| commit(s) | `518f937` — obra completa |
| alcance tocado | `.github/workflows/release.yml` · `.github/workflows/ci.yml` · `scripts/verificacion-paridad.mjs` (nuevo) · `test/gates/paridad-publicacion.test.mjs` (nuevo) · `test/release/release-u53.test.mjs` (una aserción, §8) · este reporte · fila U263 de `BACKLOG.md` |
| `packages/**` · `package.json` · lockfile · `scripts/gates/**` · `VOLUMES/**` | **ninguno** |
| `C:/S_LAB/v-sdk` (mundo ajeno) | **sólo leído**, nunca escrito |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge |

**Marcas de procedencia.** **[runner]** = leído de GitHub Actions con `gh run
view/list`. **[parser]** = medido con el paquete `yaml` de `node_modules`, un
parser YAML estricto, usado **sólo como banco de pruebas local** (no está
declarado en `package.json` y por eso **no** entra en el instrumento entregado).
**[banco]** = medido en este worktree. **[git]** = leído del objeto commiteado
con `git cat-file`, no del árbol de trabajo.

---

## 0 · CA de cierre, una por una

**«El flujo de publicación queda VERDE, verificado por su propio run.»**
**No puedo afirmarlo, y no lo afirmo.** No debo empujar la rama, y `Release`
sólo dispara sobre `main`. Lo que sí está medido: la causa del rojo está
identificada término a término **[runner]** (§1), el arreglo la ataca en su
sitio, y el par de flujos resultante **parsea como YAML válido [parser]** y pasa
el gate de paridad **[banco]**. Lo declaro como **causa cerrada y reproducida**,
no como CI verde. La distinción es la que este WP existe para no difuminar.

**«Una divergencia futura pone rojo, con vector.»** Hecho: §5, siete vectores
de divergencia, cada uno con su rojo y su mensaje.

**«No cerrar de más: inclusión y orden, no igualdad.»** Hecho y aseverado con su
propio caso (§5.6): una publicación con pasos propios sigue en verde.

**«Que tu obra no despierte ni desafile la guarda existente.»** La despertó, la
investigué hasta el mecanismo y la rodeé **cambiando mi idioma, no la regla**
(§7). Y demuestro que sigue afilada sobre mi propio fichero.

---

## 1 · El estado medido ANTES

### 1.1 · El rojo, en el runner

`Release` sobre `main` llevaba **8 de los 8 últimos runs en fallo** **[runner]**.
El más reciente al abrir el WP, `30722124096` (`aceptacion(U255)…`), falla en un
solo job, `test @zeus/linea-system`, y el mensaje es literal:

```
Error: ZEUS_VOLUMES_ROOT is not set — volumes root is not operable;
set it explicitly (environment or .env). No default and no cwd walk (U200 · ◆5).
npm error command sh -c node --test test/*.mjs
```

Es **el mismo fallo que U261 cerró en `ci.yml`**, en un workspace que **ya
estaba** en las dos matrices. Lo que no llegó a `release.yml` fue la palanca.

### 1.2 · La divergencia, contada

Confirmado el dato del brief **[banco]**: `needs_volumes_root` aparece **8 veces
en `ci.yml` y 0 en `release.yml`**.

Medido con el instrumento nuevo sobre **el par commiteado en `HEAD`** **[git]**
(`node scripts/verificacion-paridad.mjs <ci@HEAD> <release@HEAD>` → **exit 1**):

| lo que `ci.yml` exigía y `release.yml` no hacía | dónde |
| --- | --- |
| guarda del carril de datos (U256) | `ci.yml:123` |
| guarda de `linea-system` (U261) | `ci.yml:149` |
| sello rastreado del root (U258) | `ci.yml:191` |
| vigilancia del sello (U258) | `ci.yml:203` |
| smoke TS contra el registry (U158) | `ci.yml:216` |

**5 pasos ausentes**, y además **5 entradas de matriz**: los workspaces
`@zeus/linea-kit` y `@zeus/volumes-ops` (que U256 añadió) y las **tres** filas
del `include`. Y sólo **«test», «quality»** bloqueaban la publicación: los jobs
`sello-root` y `smoke-ts-registry` **ni existían** en el flujo que entrega.

Censo con parser estricto **[parser]**, `ci.yml@HEAD` vs `release.yml@HEAD`:
pasos con `run:` por job `quality:4 test:4 sello-root:3 smoke-ts-registry:1`
frente a `quality:4 test:2 release:4`; matriz `27 + include 3` frente a `25 + 0`.

### 1.3 · Hallazgo no buscado: `release.yml` **no era YAML válido**

Al cotejar mi escáner contra un parser de verdad **[parser]**, `release.yml@HEAD`
**no parsea**:

```
Unexpected scalar at node end at line 73, column 35:
          - '@zeus/ping-pong-bots'
```

En el **objeto commiteado** **[git]** (`cb8b017…`) los bytes son
`'@zeus/ping-pong-bots'` seguido de **`\r\r\r\r\n`**: 3 bytes `CR` sueltos. Es
**exactamente** el defecto que el reporte de U256 dice haber limpiado en
`ci.yml` («3 bytes `CR` sueltos tras `ping-pong-bots`, `UNEXPECTED_TOKEN`») —
y que **nunca se propagó a `release.yml`**. `ci.yml@HEAD`: 0 dobles-CR, parsea.
`release.yml@HEAD`: 2 dobles-CR, no parsea.

**Es la tesis del WP en su forma más literal**: la misma pudrición, en el mismo
sitio del mismo par de ficheros, arreglada en la copia que alguien miró y
dejada en la que nadie miró. GitHub Actions la tolera; un parser estricto no.
El fichero reescrito **parsea limpio** y el blob que se commitea tiene **0
dobles-CR** (verificado sobre `git cat-file` del índice, no sobre el árbol).

---

## 2 · La vía elegida, y el precio de la descartada

### 2.1 · Elegida: portar la guarda de paridad, adaptada

`scripts/verificacion-paridad.mjs`, portado del mundo hermano
`C:/S_LAB/v-sdk/scripts/verificacion-paridad.mjs` (**leído, jamás escrito**) y
**adaptado**, porque copiarlo tal cual habría producido un instrumento que
miente en este repo. Las tres reglas y por qué:

1. **Cobertura de pasos.** Todo `run:` de cualquier job de `ci.yml` tiene que
   estar en `release.yml`. La huella es **comando + `if:`**, no sólo el comando:
   copiar la guarda y apagarla con `if: false` satisface un cotejo de texto y
   deja el verde mudo que este WP viene a cerrar (vector §5.3).

2. **Orden sobre el GRAFO DE `needs`, no sobre el número de línea.** Ésta es la
   adaptación que obliga la forma de este repo y la razón por la que el original
   no servía sin tocar. Allí `release.yml` era **un job** y comparar líneas
   bastaba. Aquí son **cinco**, y quien publica es `release`, que se apoya en
   `needs`. Un cotejo por línea daría **falso verde** (un paso escrito más
   arriba pero en un job fuera del `needs` corre **en paralelo** con la
   publicación: no la bloquea) y **falso rojo** (mover el job `release` al
   principio del fichero no cambia nada de lo que ocurre). Los dos casos están
   aseverados: §5.4 y §5.5.

3. **Cobertura de matriz.** Sin ella el instrumento habría sido **ciego al
   defecto que vino a cerrar**: el comando es idéntico en los dos flujos
   —`npm test -w "${{ matrix.workspace }}"`— y toda la divergencia vivía en la
   **lista**, que no es un `run:`. Quitar `@zeus/linea-kit` de la matriz de
   publicación deja sus tests sin correr con la regla (1) en verde (vector §5.7).

Las tres **fallan cerrado** (exit 2: fichero ilegible, flujo sin paso de
publicación, cero pasos, `needs` a un job inexistente). `EXCLUIDOS` queda
**vacía**, y que lo esté es resultado del WP: en vez de perdonarle a la
publicación los jobs `sello-root` y `smoke-ts-registry`, **se le añadieron**.

**Mejora sobre el original**: allí el instrumento corría sólo en el flujo de
publicación y su cabecera declaraba la consecuencia («la deriva se caza al
PUBLICAR, no al empujar»). Aquí corre en **los dos** (`ci.yml:38`,
`release.yml:43`), así que la deriva se caza **al empujar**. El paso se exige a
sí mismo: es un `run:` de `ci.yml`, luego la regla (1) obliga a que esté en
`release.yml`.

### 2.2 · Descartada: unificar en un flujo reutilizable (`workflow_call`)

**Es más limpia y lo digo sin rebajarla**: con un solo fichero de verificación
llamado por los dos no hay dos listas que comparar, y todo este instrumento
sobra. Su precio, **medido, no supuesto**:

| coste | medida |
| --- | --- |
| **Fichero fuera de ALCANCE_DIFF** | exige un **tercer** fichero en `.github/workflows/`. Mi alcance nombra `release.yml` y `ci.yml` como míos, y `scripts/` para la guarda; un flujo nuevo no está. Es el coste **decisivo**, y es de proceso, no técnico. |
| **Nombres de check** | los jobs pasan a llamarse `verificacion / test @zeus/…`. **Comprobado que HOY no rompe nada**: `main` **no está protegida** (`gh api …/branches/main/protection` → **404 «Branch not protected»**), así que no hay required checks que renombrar. **No lo uso como argumento**: sería inventar un coste. |
| **`paths` y `concurrency` divergen** | `ci.yml` filtra `paths-ignore: plan/**, **.md` y `cancel-in-progress: true`; `release.yml` filtra `paths: .changeset/**, packages/**` y `cancel-in-progress: false`. Eso **no** se puede meter en el flujo llamado: `on:` y `concurrency` son del llamador. La unificación resuelve la matriz y los pasos, **no** los disparadores. |
| **Lo que NO puedo medir** | no puedo ejecutar un `workflow_call` sin empujar. Declarar que «funciona» sería una afirmación más ancha que la evidencia. |

**Sigue siendo la vía correcta a medio plazo** y la recomiendo como WP propio:
con ella, `verificacion-paridad.mjs` se borra. Lo que este WP entrega es la vía
que **cabe en su alcance y se puede demostrar hoy**.

---

## 3 · La obra

`release.yml` recibe, todo espejo exacto de `ci.yml`:

- matriz **25 → 27** (`:60-93`) e `include` de **3 filas** (`:94-103`);
- las **dos guardas** de root de VOLUMES (`:113`, `:127`), cada una con su `env`;
- el `env` del paso `Test workspace` — sin él, `linea-system` seguía roto;
- los jobs **`sello-root`** (`:153`) y **`smoke-ts-registry`** (`:177`);
- `needs: [quality, test, sello-root, smoke-ts-registry]` (`:196`) — los cuatro,
  porque un job de verificación fuera del `needs` **corre en paralelo con la
  publicación y no la bloquea**;
- el paso de paridad (`:43`), gemelo del de `ci.yml:38`.

Estado final **[banco]**:

```
publica                  : job «release» en .github/workflows/release.yml:248
corren antes de publicar : «smoke-ts-registry», «sello-root», «test», «quality»
paridad OK · 13 paso(s) … y todos bloqueando la publicación
matriz OK  · test: workspace×27 include×3
```

**No es igualdad**: `release.yml` conserva sus 4 pasos propios (credenciales,
`.npmrc`, changesets, skip sin secretos) y `ci.yml` no los tiene ni debe.

---

## 4 · El escáner, cotejado contra un parser de verdad

No hay parser YAML declarado en `package.json` y añadir dependencia está fuera
de alcance, así que el instrumento es un **lector de subconjunto**. Para que eso
no sea un acto de fe, lo **coteje contra el paquete `yaml`** **[parser]**:

| medida | parser estricto | mi escáner |
| --- | --- | --- |
| pasos `run:` en `ci.yml` | 5+4+3+1 = **13** | **13 exigidos** |
| `matrix.workspace` | **27** | **27** |
| `matrix.include` | **3** | **3** |
| `release.needs` | `[quality, test, sello-root, smoke-ts-registry]` | mismos 4 |

Coinciden. Los límites que **no** cierro están escritos en la cabecera del
fichero: no compara `env:`, no vigila `uses:`, no juzga si un comando verifica
algo, y anclas YAML o `run: >` plegado lo despistarían — por eso muere si no ve
ningún `run:` en vez de aplaudir.

---

## 5 · Vectores de divergencia — `test/gates/paridad-publicacion.test.mjs`

**15 casos, 15 en verde** **[banco]**. Corre con `npm run test:gates`, que ya
estaba cableado en **los dos** flujos (no hizo falta tocar `package.json`).

| # | vector | resultado |
| --- | --- | --- |
| 5.1 | el par real del repo | **exit 0** |
| 5.2 | **quitar un paso** de `release.yml` (vigilancia del sello) | **exit 1** · `PARIDAD ROTA`, lo nombra |
| 5.3 | paso **nuevo** en `ci.yml` que nadie trae | **exit 1** · `PARIDAD ROTA` |
| 5.4 | **marca blanda**: guarda copiada pero `if: false` | **exit 1** · `PARIDAD ROTA` |
| 5.5 | job de verificación **fuera del `needs`** | **exit 1** · `ORDEN ROTO`, y **no** `PARIDAD ROTA` |
| 5.6 | **mover el job que publica al principio** del fichero | **exit 0** — un cotejo por línea daría falso rojo aquí |
| 5.7 | quitar `@zeus/linea-kit` de la matriz | **exit 1** · `MATRIZ ROTA` |
| 5.8 | borrar la fila `include` de `linea-system` (**el defecto original**) | **exit 1** · `MATRIZ ROTA` |
| 5.9 | **publicación legítima**: pasos propios añadidos a `release.yml` | **exit 0** |
| 5.10 | CRLF ≡ LF (verde y rojo idénticos en los dos finales de línea) | **exit 0 / exit 1** |
| 5.11-14 | fail-closed: sin paso que publique · cero `run:` · `needs` fantasma · fichero ilegible | **exit 2** los cuatro |

**Sobre 5.9 y «no cerrar de más»**: la regla es de **inclusión**. Si exigiera
igualdad, los pasos de credenciales/`.npmrc`/changesets —que `ci.yml` no tiene
ni debe tener— bloquearían **toda** publicación. 5.9 lo asevera añadiendo además
un paso nuevo sólo-publicación y comprobando que sigue en verde.

**Sobre 5.10**: este repo tiene `core.autocrlf=true`, así que el operador ve
CRLF y el runner LF. Un instrumento que sólo entienda uno daría veredictos
distintos en cada sitio — el defecto de este WP, un escalón arriba.

---

## 6 · Higiene: comprobado antes de acusar

`git status` muestra 3 rastreados modificados bajo `packages/engine/*/bin/`.
**No son míos y no van en el commit**: `git diff -- packages/` da **0
inserciones y 0 borrados** (artefacto de `npm ci`, exactamente el que el reporte
de U256 ya documentó para estos mismos tres ficheros). Instalé con **`npm ci`**,
nunca `npm install`; **sin `git stash`**; **sin `npx`** de binario no declarado
(el `yaml` del cotejo se invocó por ruta desde `node_modules` y **sólo en el
banco**, no entra en la obra).

`npm run lint` → **0 errores** (18 avisos preexistentes, **ninguno en mis dos
ficheros nuevos**). `npm run gates` → **`OK (0 offenders)`**.
`npm run test:gates` → **84/84**.

---

## 7 · La guarda que ya existía: la desperté, y **no** la desafilé

`test/gates/arbol-inmutable.test.mjs` barre **todo `.mjs` de `test/gates/`**
buscando escrituras sobre el árbol de trabajo. Mi test nuevo cae en ese barrido
y **lo puso rojo**:

```
test/gates/paridad-publicacion.test.mjs:52 · writeFileSync · identificador anclado `rutaCi`
test/gates/paridad-publicacion.test.mjs:53 · writeFileSync · identificador anclado `rutaRelease`
```

**No lo di por supuesto: lo bisecté** hasta el mecanismo, llamando a su propia
función exportada `ofensasDeFuente`. Es un **falso positivo suyo**, y la cadena
es ésta: el guardián propaga el ancla **por nombre y sin ámbito**; mi
`const ci = mutar(CI_REAL, …)` quedaba anclado por su regla de «concatenación de
cadenas» (empuja el RHS entero, que menciona `CI_REAL`); y entonces el literal
`'ci.yml'` de `path.join(dir, 'ci.yml')` **contiene** `ci` entre `'` y `.`, que
para su regexp es una aparición delimitada. Escribir en un temporal se leía como
escribir en el repo.

**Rodeado cambiando mi idioma** (`ci`/`release` → `diario`/`publicacion`,
`rutaCi`/`rutaRelease` → `fCi`/`fRelease`), que es lo que hizo U260 ante este
mismo guardián — **sin tocar `MUTADORES`, sin añadirle excepciones y sin entrar
en `scripts/gates/**`**. El porqué queda escrito en la cabecera de mi test para
que nadie lo «arregle» desafilando la regla.

**Y compruebo que sigue afilada sobre mi fichero**, que es lo que de verdad
importa: no basta con que esté verde, tiene que seguir pudiendo ponerse rojo.
Sobre el fuente entregado, mutado **[banco]**:

| mutación | ofensas |
| --- | --- |
| tal cual se entrega | **0** |
| el temporal pasa a ser el propio repo | **3** (`fCi`, `fRelease`, `dir`) |
| escritura a ruta literal `.github/workflows/ci.yml` | **1** |
| escritura anclada por `import.meta.url` | **1** |

Es decir: mi fichero **no** se volvió invisible al guardián. Si algún día
escribe de verdad sobre el árbol, lo caza.

---

## 8 · Lo que toqué fuera de la lista del brief, y por qué

`test/release/release-u53.test.mjs`, **una aserción**. Decía
`assert.match(yml, /needs:\s*\[quality,\s*test\]/)` — con el corchete de cierre
pegado a `test`, lo que **prohibía añadir gates**. Mi cambio mete dos más en el
`needs`, así que la aserción pasaba a ser falsa.

Las alternativas eran peores: dejar un test rojo a sabiendas, o **debilitar el
`needs` para que cupiera una regexp**, que es literalmente desafilar la regla
para que quepa el arnés. La cambié por una que **conserva la intención y es más
robusta**: exige que `quality` y `test` estén en el `needs`, sin pinchar cuántos
gates hay. **Lo declaro aquí porque `test/release/` no está en mi ALCANCE_DIFF**
(tampoco en la lista de prohibidos) y es del orquestador juzgarlo.

`npm run test:release` queda **5/6**. El que falla, `version tree prepared…`,
**no es mío y no lo toco**: cuenta changesets pendientes y falla por
`.changeset/curated-sidecar-por-forma.md`, que está commiteado en `HEAD` y que
no he tocado (`git status` lo confirma). Falla igual sin mi rama. **Nota
enrutable**: `test:release` **no lo ejecuta ningún flujo** —ni `ci.yml` ni
`release.yml`—, así que llevaba rojo sin que nadie lo viera. Es la misma clase
de defecto que este WP, en otro sitio.

---

## 9 · Lo que queda sin cubrir — dicho, no disimulado

1. **`Release` verde de verdad.** Sólo se comprueba tras merge a `main`. Lo
   entregado cierra la causa; no puedo entregar el run.
2. **La guarda no compara `env:`.** Deliberado y con instrumento en su sitio:
   de que `ZEUS_VOLUMES_ROOT` llegue y apunte a un root completo responden las
   **dos guardas en runtime**. Pero un `env` divergente que no sea ése no se
   caza.
3. **No vigila `uses:`.** Un `actions/checkout` con `fetch-depth` distinto en
   cada flujo cruza el gate. Es justo el defecto de U260, en su otra cara.
4. **No juzga si un comando verifica algo.** Cambiar `npm test` por `echo ok` en
   los dos ficheros pasa. De eso responden `gates` y `test/gates/`.
5. **`smoke-ts-registry` en la publicación mide el registry ANTES de publicar**,
   así que valida la versión anterior. Es lo mismo que hace en `ci.yml`; no es
   una regresión, pero no es una comprobación de lo que se está publicando.
6. **La unificación (§2.2) sigue pendiente** y es la vía que hace innecesario
   todo esto. WP propio.
7. **El escáner no es un parser.** Cotejado hoy (§4); si alguien escribe los
   flujos con anclas o `run: >` plegado, el cotejo habría que rehacerlo. Muere
   en vez de aplaudir, pero morir en CI también cuesta.
