# WP-U253b · una importación deja de poder morir después de haber tocado el catálogo

Rama `wp/u253b-import-atomico`, base `0a441d1`. Todo lo que sigue lleva orden y
salida literal, o dice «no medido».

| dato | valor |
| ---- | ----- |
| Contrato que se incumplía | `plan/CONTRATO-IMPORT-PACK-v1.md` §1 cabecera («Todo fallo: `{ok:false, step, error}`») y la cabecera de `import.mjs:29-31` («Every failure leaves the root intact … Nothing lands halfway») |
| Obra | `packages/engine/volumes-ops/src/import.mjs` |
| Vigilancia | `packages/engine/volumes-ops/test/u253b-import-atomico.test.mjs` (16 casos, nuevo) · `test/u253-escritura-sobre-manifiesto.test.mjs` (el caso que U253a dejó enrutado aquí, invertido) |
| Suite `volumes-ops` | 216 (214 pass, 0 fail, 2 skip) → **232 (230 pass, 0 fail, 2 skip)** |
| Rojos que la base NO pasa | **10 de 16** del fichero nuevo, medido restaurando `src/import.mjs` a HEAD |
| NO tocado | `src/ledger-cerco.mjs` y `src/ledger.mjs` — ni un carácter. El arreglo no era de rutas |

---

## 1 · Se re-midió la tabla del enunciado antes de tocar nada, y era cierta

Arnés: root temporal con manifiesto sellado y `volumes: {}`, pack sintético de un
volumen genérico (`DISK_07/DEMO`, corpora `raw` + `curated`, 2 ficheros),
`importPack({packRoot, role:'operator', actorId:'op-1', ledger})`. La huella del
root es el **sha256 del árbol entero** (tipo de cada entrada + sha256 de los
bytes de cada fichero), no una inspección de rutas: cualquier cambio en
manifiesto, estado, corpus, ledger o staging la mueve.

Orden (con el guion de medición, borrado al terminar; copia en el scratchpad de
la sesión):

```
cd packages/engine/volumes-ops && node _medicion-u253b.mjs
```

Salida literal, resumida a las columnas que decide la CA (el JSON completo trae
además `hashAntes`/`hashDespues` y el listado de altas):

```
R1 · <root>/volumes.json
   lanzo   : LedgerPathDenegada / ledger_path_artefacto_sellado
   devolvio: null
   arbolIgual: False | corpus: True | resellado: True | asiento: False
   nuevos en el root: 8 entradas
R2 · <root>/nota.txt
   lanzo   : LedgerPathDenegada / ledger_path_extension_no_jsonl
   devolvio: null
   arbolIgual: False | corpus: True | resellado: True | asiento: False
R3 · <tmp>/ops-fuera.jsonl
   lanzo   : LedgerPathDenegada / ledger_path_fuera_del_cerco
   devolvio: null
   arbolIgual: False | corpus: True | resellado: True | asiento: False
R4 · ledgerPath no-cadena (42)
   lanzo   : LedgerPathDenegada / ledger_path_no_es_cadena
   devolvio: null
   arbolIgual: False | corpus: True | resellado: True | asiento: False
R5 · <root> (directorio)
   lanzo   : LedgerPathDenegada / ledger_path_fuera_del_cerco
   devolvio: null
   arbolIgual: False | corpus: True | resellado: True | asiento: False
R6 · flujo alterno volumes.json:x.jsonl
   lanzo   : LedgerPathDenegada / ledger_path_artefacto_sellado
   devolvio: null
   arbolIgual: False | corpus: True | resellado: True | asiento: False
```

Las altas del root son las mismas en las seis (ejemplo de R1, verbatim):

```
"nuevosEnRoot": [
  "D DISK_07",
  "D DISK_07/DEMO",
  "D DISK_07/DEMO/curated",
  "F DISK_07/DEMO/curated/keep.md:fa4f5a55…",
  "D DISK_07/DEMO/raw",
  "F DISK_07/DEMO/raw/a.json:d3b6bf8e…",
  "F volumes.json:223d0248…",
  "F volumes.state.json:338d09f1…"
]
```

**Correcciones a la tabla del enunciado**, hechas al medir:

- El enunciado decía «cuatro filas» y enumeraba **tres**. Se midieron las tres y
  se completaron hasta **seis**, que son todas las clases de denegación que
  `ledger-cerco.mjs` sabe emitir (`no_es_cadena`, `fuera_del_cerco`,
  `artefacto_sellado`, `extension_no_jsonl`, `es_directorio`, `flujo_alterno`).
- `ledgerPath = <root>` **no** sale por `ledger_path_es_directorio` sino por
  `ledger_path_fuera_del_cerco`: la comprobación léxica (`rel === ''`) dispara
  antes que la de tipo. El código de `es_directorio` sí se alcanza, pero por otro
  vector — ver §4, C1.
- El enunciado decía que las filas 2 y 3 «funcionaban antes de U253a». **No se ha
  verificado**: exigiría revertir `ledger-cerco.mjs`, que este WP tiene prohibido
  tocar. Lo que sí se midió es que hoy las seis mutan y lanzan.

---

## 2 · Antes y después, con la huella del árbol como testigo

Después: mismo guion, mismo arnés, `src/import.mjs` con la precondición.

| entrada `ledger` | antes: ¿lanzó? | antes: árbol | después: devuelve | después: árbol |
| --- | --- | --- | --- | --- |
| `{ledgerPath:'<root>/volumes.json'}` | `LedgerPathDenegada` | **cambiado** | `{ok:false, step:'precondicion-ledger', error:'ledger_path_artefacto_sellado'}` | **idéntico** |
| `{ledgerPath:'<root>/nota.txt'}` | `LedgerPathDenegada` | **cambiado** | `…error:'ledger_path_extension_no_jsonl'` | **idéntico** |
| `{ledgerPath:'<tmp>/ops-fuera.jsonl'}` | `LedgerPathDenegada` | **cambiado** | `…error:'ledger_path_fuera_del_cerco'` | **idéntico** |
| `{ledgerPath:42}` | `LedgerPathDenegada` | **cambiado** | `…error:'ledger_path_no_es_cadena'` | **idéntico** |
| `{ledgerPath:'<root>'}` | `LedgerPathDenegada` | **cambiado** | `…error:'ledger_path_fuera_del_cerco'` | **idéntico** |
| `{ledgerPath:'<root>/volumes.json:oculto.jsonl'}` (win32) | `LedgerPathDenegada` | **cambiado** | `…error:'ledger_path_artefacto_sellado'` | **idéntico** |

«Idéntico» = mismo sha256 del árbol entero antes y después, y además, medido una
a una: `corpusAterrizado:false`, `volumes` del manifiesto sigue en `{}`, no hay
`.ops-ledger.jsonl`, no hay `.import-staging*` residual, y `steps` sale **vacío**
(la precondición corre antes del primer paso del contrato).

**CA-4 · hostil-omite** — las cuatro formas de ausencia siguen verdes, con
asiento, antes y después (`arbolIgual:False` es aquí lo correcto: el import hizo
su trabajo):

| entrada | antes | después |
| --- | --- | --- |
| `ledger` omitido | `ok:true`, asiento `seq:1` | `ok:true`, asiento `seq:1` |
| `ledger: null` | `ok:true`, asiento | `ok:true`, asiento |
| `ledger: {}` | `ok:true`, asiento | `ok:true`, asiento |
| `ledger: {ledgerPath: undefined}` | `ok:true`, asiento | `ok:true`, asiento |

---

## 3 · Qué se cambió, y por qué es de ORDEN y no de rutas

`import.mjs:228-263` — **precondición del asiento, antes de VERIFICAR**. La ruta
del ledger se resuelve por el mismo cerco de U253a, en el punto del programa en
el que todavía no se ha creado ni el directorio de staging. Una denegación sale
por el contrato como `precondicion-ledger` con el `code` del cerco intacto.

Dos decisiones que conviene leer explícitas:

- **Sólo se convierte en `{ok:false}` la denegación DEL CERCO**
  (`instanceof LedgerPathDenegada`). Un fallo de otra clase —típicamente
  `resolveVolumesRoot()` sin `ZEUS_VOLUMES_ROOT`, U200— se deja pasar para que lo
  diagnostique VERIFICAR, que es su paso. Sin esa distinción, un root sin
  resolver habría cambiado de `step` («verificar» → «precondicion-ledger») como
  efecto secundario de este WP.
- **El rol se sigue juzgando primero.** Hay caso: `precondicion-rol` gana a
  `precondicion-ledger` (test 8 del fichero nuevo).

`import.mjs:643-695` — **guarda sobre el plan de fusión**
(`ledger_en_ruta_de_fusion`), por el residuo C1 de §4. Se compara la ruta del
ledger contra los **ficheros que van a aterrizar**, no contra los `to` del plan:
un volumen nuevo viaja como UN solo movimiento de directorio y mirar los `to` no
ve las hojas — medido, la primera versión de esta guarda dejaba escapar C1
entero. Se deniegan dos formas y ninguna más: que un fichero aterrice **en** la
ruta del ledger, o **debajo** de ella. Un ledger que viva dentro de un volumen
que el pack trae (`<root>/DISK_07/DEMO/ops.jsonl`) **sigue verde**, y hay control
que lo vigila (test 15): estrechar eso habría convertido en rojo un caso que hoy
funciona, que es justo lo que este WP existe para no hacer.

`import.mjs:250-263` — **`ledger_ilegible`**, por el residuo C3 de §4.

No se añadió ninguna envoltura general alrededor de `appendOpsLedger` ni de la
zona posterior a FUSIONAR. Convertir en `{ok:false}` un fallo que ya dejó el root
a medias cumple la letra del contrato y no su intención; lo que queda abierto
está censado abajo en vez de tapado.

---

## 4 · Censo (CA-3): ¿es `appendOpsLedger` el único punto que lanza tras mutar?

**No.** Lista, no «creo que sí». La mutación del root empieza en
`applyFusion(moves, …)` (`import.mjs:702`); todo lo que sigue corre con ficheros
ya renombrados al destino. Lo anterior a esa línea también escribe —el staging
vive DENTRO del root— pero el `finally` de `:897` lo borra, así que no deja
huella salvo que el propio `rmSync` falle (último punto de la lista).

| # | punto | línea | ¿puede lanzar? | ¿medido? | estado |
| --- | --- | --- | --- | --- | --- |
| 1 | `appendOpsLedger(...)` — cerco de la ruta | `:861` | sí, 6 clases | **sí**, §1 y §2 | **cerrado** (precondición `:228`) |
| 2 | `appendOpsLedger(...)` — la ruta la sepulta la propia fusión | `:861` | sí, `ledger_path_es_directorio` | **sí**, C1 abajo | **cerrado** (guarda `:643`) |
| 3 | `appendOpsLedger(...)` → `readOpsLedger` → `JSON.parse` de un ledger corrupto | `ledger.mjs:77` desde `:861` | sí, `SyntaxError` | **sí**, C3 abajo | **cerrado** (`ledger_ilegible`, `:250`) |
| 4 | `sealManifest(sealed)` → `writeFileSync` | `:825` | sí, `EPERM`/`EACCES`/`ENOSPC` | **sí**, C2 abajo | **abierto** |
| 5 | `sha256File(abs)` del sello por fichero (U258) | `:757` | sí, `EISDIR`/`EACCES` — `existsSync` no distingue directorio | no medido | **abierto** |
| 6 | `famDriver.snapshotOf(destino)` (U259) | `:764` | sí, lee el árbol del destino sin envolver | no medido | **abierto** |
| 7 | `measurePath(corpusAbs)` | `:771` | sí, `statSync` en `measure.mjs:51` tras `existsSync` (carrera) | no medido | **abierto** |
| 8 | `syncVolumeCounters(volId)` | `:828` | sí: `hashManifest()` si el manifiesto desaparece, `Unknown volume id`, y la escritura del estado | no medido | **abierto** |
| 9 | `walkTree(...)` de NO-LINK | `:853` | sí, `readdirSync`/`lstatSync` sin envolver | no medido | **abierto** |
| 10 | `rmSync(stagingDir, …)` del `finally` | `:897` | sí, `force` ignora `ENOENT` pero no `EPERM`/`EBUSY`; y un throw en `finally` **sustituye al `return`** | no medido | **abierto** |

Los tres que sí se midieron, con su orden:

```
cd packages/engine/volumes-ops && node _censo-u253b.mjs
```

**C1 · ruta de ledger admisible al entrar que la fusión convierte en directorio.**
El pack trae `DISK_07/DEMO/raw/a.jsonl/dentro.txt`; la propuesta es
`<root>/DISK_07/DEMO/raw/a.jsonl`, que al empezar no existe y el cerco admite.

```
antes:   lanzo LedgerPathDenegada / ledger_path_es_directorio
         arbolIgual False | corpus True | resellado True | asiento False
después: devolvio {ok:False, step:'fusionar', error:'ledger_en_ruta_de_fusion'}
         arbolIgual True  | corpus False | resellado False | asiento False
```

**C2 · `volumes.json` de sólo lectura (`attrib +R`): SELLAR lanza tras FUSIONAR.**

```
antes:   lanzo Error / EPERM: operation not permitted, open '<root>\volumes.json'
         arbolIgual False | corpus True | resellado False | asiento False
         nuevos en el root: DISK_07/, DISK_07/DEMO/, DISK_07/DEMO/raw/, raw/a.json
después: IDÉNTICO — este WP no lo cierra
```

Es la fila 4 del censo y **sigue abierta**: el corpus aterriza, el manifiesto no
se resella, `importPack` lanza `EPERM` y nadie lo declara. No se cierra aquí
porque no es una entrada denegada sino un fallo del entorno en la escritura del
propio sello, y su arreglo honesto es deshacer la fusión —`deshacerFusion` de
U255 sigue siendo legítimo en ese punto exacto, porque el manifiesto aún no se
ha reescrito— o declarar el medio-aterrizaje. Es una decisión de contrato, no una
línea, y ensancharla desde aquí sería escribir más de lo que este WP midió.

**C3 · ledger existente con una línea ilegible, en la ruta POR DEFECTO.** Ocurre
sin que nadie proponga ruta: `appendOpsLedger` relee el JSONL entero para numerar
el asiento.

```
antes:   lanzo SyntaxError / Unexpected token 'e', "esto-no-es-json" is not valid JSON
         arbolIgual False | corpus True | resellado True | asiento (el corrupto sembrado)
después: devolvio {ok:False, step:'precondicion-ledger', error:'ledger_ilegible'}
         arbolIgual True  | corpus False | resellado False
```

---

## 5 · Censo de mutación (CA-5): sin la guarda, los casos enrojecen

Dos medidas, porque prueban cosas distintas.

**(a) El fichero nuevo contra la BASE.** Se restauró `src/import.mjs` a HEAD
(`git checkout -- packages/engine/volumes-ops/src/import.mjs`) y se corrió el
fichero de pruebas nuevo tal cual:

```
not ok 1 - CA-1/CA-2 · artefacto sellado del root: contrato `{ok:false}` y árbol del root idéntico
not ok 2 - CA-1/CA-2 · extensión que no es .jsonl: contrato `{ok:false}` y árbol del root idéntico
not ok 3 - CA-1/CA-2 · fuera del cerco del root: contrato `{ok:false}` y árbol del root idéntico
not ok 4 - CA-1/CA-2 · presente pero no es cadena: contrato `{ok:false}` y árbol del root idéntico
not ok 5 - CA-1/CA-2 · el propio root: contrato `{ok:false}` y árbol del root idéntico
not ok 6 - CA-1/CA-2 · flujo de datos alterno (NTFS): contrato `{ok:false}` y árbol del root idéntico
not ok 7 - CA-1 · la denegación llega ANTES de VERIFICAR: ni un paso se registró
ok 8 - CA-1 · el rol se sigue juzgando PRIMERO: un ledger malo no tapa un rol denegado
ok 9 - CA-4 · `ledger` omitido: aterriza, sella y deja asiento en la ruta por defecto
ok 10 - CA-4 · `ledger` null: aterriza, sella y deja asiento en la ruta por defecto
ok 11 - CA-4 · `ledger` objeto vacío: aterriza, sella y deja asiento en la ruta por defecto
ok 12 - CA-4 · `ledgerPath` undefined: aterriza, sella y deja asiento en la ruta por defecto
not ok 13 - CA-2 · ledger existente ILEGIBLE: se caza en la precondición, sin tocar el root
not ok 14 - CA-2 · ruta admisible al entrar que la PROPIA fusión sepulta: cero renames
ok 15 - CA-2 control · un ledger DENTRO de un volumen que el pack trae sigue verde
not ok 16 - CA-5 · amputadas las guardas, TODOS los casos vuelven a lanzar tras mutar el root
# tests 16
# pass 6
# fail 10
```

Los seis que quedan verdes sobre la base son los que **no deben** depender de la
guarda: los cuatro de hostil-omite, el de precedencia del rol y el control de la
ruta legítima. Si alguno de ésos hubiera enrojecido, la guarda estaría
estrechando algo que funcionaba.

**(b) El censo vive DENTRO de la suite** (test 16), a la manera de
`u253-escritura-sobre-manifiesto.test.mjs` §4: se escribe a disco un `import.mjs`
**mutante** —el mismo fichero con los tres `return` de las guardas amputados, los
relativos reescritos a URL absoluta de `src/` para que use los MISMOS módulos— se
importa de verdad y se exige que los ocho casos **vuelvan a lanzar Y a mutar el
root** (volumen aterrizado, cero asiento). La amputación se cuenta y se asevera
(`amputados === 3`): si el regex dejara de casar, el «mutante» sería el original
y el censo pasaría en verde sin haber amputado nada.

Comprobación cruzada, ejecutada a mano sobre `src/` real (amputando los tres
`return` en el fichero de producción y restaurándolo después): **10 fail / 6
pass**, la misma partición.

---

## 6 · Lo que este WP NO cubre

- **Las filas 4 a 10 del censo de §4.** Cuatro está medida (C2) y sigue abierta;
  cinco a diez están identificadas **por lectura, no por medida**, y así están
  marcadas. Ninguna se ha cerrado.
- **La afirmación «las filas 2 y 3 funcionaban antes de U253a»** del enunciado.
  No se verificó: exigía revertir `ledger-cerco.mjs`.
- **TOCTOU entre la precondición y el asiento por un tercero.** La precondición
  juzga el root tal como está al entrar; la guarda de fusión cubre lo que el
  propio import va a hacerle. Un operador concurrente que cree un directorio o un
  enlace duro en esa ruta mientras el import corre sigue pudiendo hacer lanzar a
  `appendOpsLedger`. No es cerrable desde aquí sin bloqueo del root.
- **`e2e/local-first-ca.mjs`** no se pudo correr en esta máquina: aborta en el
  paso 1 por `ZEUS_GAMES_LIBRARY no está definida`, que es del entorno y no del
  cambio. No es evidencia a favor ni en contra.
- **Otras plataformas.** Todo se midió en win32/NTFS. El caso del flujo de datos
  alterno se salta explícitamente fuera de win32 (en POSIX esa misma cadena
  nombra un fichero legítimo y exigir la denegación allí sería exigir un falso
  positivo).

---

## 7 · Órdenes y salidas

```
# base
cd packages/engine/volumes-ops && node --test test/*.test.mjs
# tests 216 · pass 214 · fail 0 · skipped 2

# después
cd packages/engine/volumes-ops && node --test test/*.test.mjs
# tests 232 · pass 230 · fail 0 · skipped 2

# el fichero nuevo, solo
cd packages/engine/volumes-ops && node --test test/u253b-import-atomico.test.mjs
# tests 16 · pass 16 · fail 0

# el censo estático de escritores del manifiesto (U205) no cambia de color:
# `src/import.mjs` NO pasa a estar marcado
node --test packages/mesh/ssb-system/test/export.test.mjs
# tests 26 · pass 26 · fail 0

# lint de lo tocado (eslint local del repo, sin descarga)
npx --no-install eslint packages/engine/volumes-ops/src/import.mjs \
  packages/engine/volumes-ops/test/u253b-import-atomico.test.mjs \
  packages/engine/volumes-ops/test/u253-escritura-sobre-manifiesto.test.mjs
# 0 errors · 2 warnings, ambos preexistentes (u253-…:219 y :729, fuera del diff)
```

**Dependencias**: el worktree no traía `node_modules`; se instaló con
`npm ci --ignore-scripts --no-audit --no-fund`, que **no** reescribe
`package-lock.json` ni `package.json`. Tras la instalación, `git status` sólo
mostraba cambios de modo en tres `bin/*.mjs` (bit de ejecución que pone npm);
se revirtieron con `git checkout --` antes de empezar.

## 8 · El caso que U253a dejó enrutado aquí

`test/u253-escritura-sobre-manifiesto.test.mjs:401` se llamaba
«…denegado, pero el manifiesto YA está resellado (→ U253b)» y aseveraba
`r.mutado === true`, «el volumen quedó declarado» y «el corpus ya aterrizó»,
con la nota de que la atomicidad quedaba fuera de su ALCANCE_DIFF. Cerrada aquí,
las tres asersiones se invierten y el título deja de anunciar deuda. Es el único
cambio en ese fichero; el cerco que prueba no se tocó.
