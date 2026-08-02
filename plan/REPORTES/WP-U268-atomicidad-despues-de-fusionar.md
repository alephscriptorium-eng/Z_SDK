# WP-U268 · Qué hacer cuando el fallo sólo es conocible DESPUÉS de fusionar — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm Scriptorium (worktree `C:/S_LAB/wt/z-u268`) |
| fecha | 2026-08-02 |
| rama | `wp/u268-atomicidad-despues-de-fusionar` |
| commit(s) | `6c124e3` (sobre `c005196`) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se volvieron a medir sobre la base las **seis** entradas que `import.mjs` dejó
declaradas como aplazadas a este WP (las cuatro de la ficha, la quinta sin
excepción y la de `sealManifest`), con huella del árbol entero antes/después. La
medida cambió el planteamiento: los cinco puntos posteriores al sello dan
exactamente lo mismo —**corpus aterrizado, manifiesto re-sellado, cero
asiento**— y ese estado **deja el root sin arrancar** (`verify.mjs` §2 →
`ledger_ausente`) **de forma permanente**, porque re-importar responde
`noop:true` y no escribe asiento.

La decisión es **(b) declarar el medio-aterrizaje**, con **una mezcla
intencional y dicha**: se **revierte** en el único tramo donde revertir es
honesto —SELLAR lanzando, con la fusión aplicada y el manifiesto todavía
intacto—, y se **declara** en todo lo que ocurre con el sello ya puesto. El
argumento está abajo (§3) y también en la cabecera de `src/import.mjs`.

Además de declarar, se corrigió la **causa de fondo, que era de ORDEN y no de
guardas**: entre `sealManifest` y `appendOpsLedger` corrían dos operaciones que
podían lanzar. Ahora el sello y el asiento son un par sin nada en medio, y los
contadores y NO-LINK van detrás. Con eso, cuatro de los seis dejan de dejar el
root sin arrancar.

## Archivos tocados

| archivo | qué |
| --- | --- |
| `packages/engine/volumes-ops/src/import.mjs` | modificado — cabecera reescrita (la frontera y la decisión con su argumento); `limpiarStaging()` exportada; `finally` que no puede lanzar; envoltorio de SELLAR con revert; asiento movido justo detrás del sello; contadores y NO-LINK detrás del asiento y envueltos; `step:'post-fusion'` con `aterrizado`/`sellado`/`asiento`/`recuperacion`/`causa`; `staging` en toda salida posterior a STAGING |
| `packages/engine/volumes-ops/src/fusion-guard.mjs` | modificado — `applyFusion` devuelve además `movimientos` (aditivo); `deshacerFusion` documenta su segundo y último llamante, del mismo lado de la frontera |
| `packages/engine/volumes-ops/src/index.mjs` | modificado — exporta `limpiarStaging` (su promesa necesita prueba directa) |
| `packages/engine/volumes-ops/test/u268-atomicidad-post-fusion.test.mjs` | **creado** — 18 casos: el `finally`, las seis entradas como contrato, las recuperaciones ejecutadas y el censo de mutación (7 amputaciones, una por prueba) |
| `packages/engine/volumes-ops/test/u253b-import-atomico.test.mjs` | modificado — su censo exigía «vuelve a LANZAR», conducta que U268 elimina a propósito; ahora exige lo que su guarda protege (deja de salir por su paso **y el root muta**). El porqué, escrito en el propio fichero |

**No se tocó** `src/ledger-cerco.mjs` ni `src/ledger.mjs` (U253a, aceptado), ni
`VOLUMES/**`, ni `package.json` raíz, ni el lockfile.

## Nota de lecturas: las líneas de la ficha están desplazadas

La ficha cita `import.mjs:828` (`syncVolumeCounters`), `:853` (walk de NO-LINK),
`:856` (`{ok:false, step:'no-link'}`), `:897` (`rmSync` del `finally`),
`:250-263` (lectura del ledger) y `:35-58` (la frase). Son de una revisión
anterior al merge de U253b: en `c005196` estaban en `:885`, `:910`, `:913`,
`:957`, `:289-309` y `:29-31`+`:33-57`. Mismos sitios, +57/+60 líneas.

## §1 · Cómo se midió

Arnés propio, temporal, borrado al terminar (`test/.sonda-u268.mjs`,
`test/.medida-u268.mjs`, `test/.sonda-mutante.mjs`). Root de usar y tirar en
`os.tmpdir()` con `ZEUS_VOLUMES_ROOT`, pack sintético de dos corpus.

**Huella del árbol entero** (CA-5), no inspección: por cada entrada del root, en
orden, tipo + modo + destino si es enlace + sha256 de los bytes si es fichero;
sha256 de todo ello. Un directorio ilegible se anota como tal en vez de hacer
reventar la medida — porque uno de los vectores es exactamente ése.

Orden exacto:

```
$ node test/.sonda-u268.mjs        # ¿qué vectores existen en esta máquina?
$ node test/.medida-u268.mjs       # las seis entradas, sobre la BASE
$ ...implementación...
$ node test/.medida-u268.mjs       # las seis entradas, sobre lo entregado
```

### Vectores disponibles, medidos primero (salida literal)

```
A.icacls: Se procesaron correctamente 1 archivos; error al procesar 0 archivos
A.readdir: LANZA EPERM scandir
A.rmSync: LANZA EPERM
B.rmSync: NO LANZA
C.rmSync: LANZA EBUSY rmdir C:\...\cwd\sub
D.append: LANZA EPERM open
D.read: NO LANZA
D.rmSync: NO LANZA (libuv limpia el atributo)
E.rmSync: NO LANZA
F.write: LANZA EPERM open
platform: win32
```

Lo que esto decidió: un handle abierto en el MISMO proceso no bloquea el borrado
(B), y un fichero de sólo lectura tampoco (D, libuv limpia el atributo). Los
vectores plantables son el atributo/modo de escritura, la ACL de listado y el
cwd dentro del directorio.

## §2 · Las seis entradas, antes y después (salida literal)

### Antes (base `c005196`)

```
=== M1 · .ops-ledger.jsonl de sólo lectura (ruta por defecto) ===
  lanza          : Error EPERM open
  corpus aterriza: true
  manifiesto     : RE-SELLADO
  asiento import : false
  huella árbol   : DISTINTA  (b6b584aba562 → 55270987cd45)
  verifyRoot     : ok=false findings=["ledger_ausente"]
  re-ejecución   : {"ok":true,"noop":true}
  asiento tras 2ª: false
  verifyRoot 2ª  : ok=false findings=["ledger_ausente"]

=== M2 · volumes.state.json de sólo lectura (syncVolumeCounters) ===
  lanza          : Error EPERM open
  corpus aterriza: true   manifiesto: RE-SELLADO   asiento: false
  huella árbol   : DISTINTA  (5c555a45e2f4 → 48b7de557e5a)

=== M3 · NO-LINK: subdirectorio sin permiso de listado ===
  lanza          : Error EPERM scandir
  corpus aterriza: true   manifiesto: RE-SELLADO   asiento: false
  huella árbol   : DISTINTA  (65670e254e72 → 4dc1dfd7d5e2)

=== M4 · finally rmSync EBUSY sobre un import COMPLETADO ===
  lanza          : Error EBUSY rmdir
  corpus aterriza: true   manifiesto: RE-SELLADO   asiento: TRUE
  huella árbol   : DISTINTA  (e3c491bcef8f → 840c72de958f)
  staging vive   : true
  ¿hubo return?  : NO — el finally lo sustituyó

=== M5 · no-link {ok:false} tras fusionar y sellar (sin excepción) ===
  lanza          : no
  devuelve       : {"ok":false,"step":"no-link","error":"symlink_en_resultado"}
  corpus aterriza: true   manifiesto: RE-SELLADO   asiento: false
  huella árbol   : DISTINTA  (c13114a35840 → bfc9df3afc75)

=== M6 · sealManifest sobre volumes.json de sólo lectura ===
  lanza          : Error EPERM open
  corpus aterriza: true   manifiesto: INTACTO   asiento: false
  huella árbol   : DISTINTA  (20bff49f08ab → f9bdd7b86eaf)
```

### Después (lo entregado, mismo arnés, mismos vectores)

```
=== M1 ===  lanza: no  → {"ok":false,"step":"post-fusion","error":"asiento_no_escribible"}
            aterriza:true  RE-SELLADO  asiento:false   verifyRoot: ok=false ["ledger_ausente"]
=== M2 ===  lanza: no  → {"ok":false,"step":"post-fusion","error":"estado_no_escribible"}
            aterriza:true  RE-SELLADO  asiento:TRUE
=== M3 ===  lanza: no  → {"ok":false,"step":"post-fusion","error":"resultado_no_inspeccionable"}
            aterriza:true  RE-SELLADO  asiento:TRUE
=== M4 ===  lanza: no  → {"ok":true,"noop":false}
            aterriza:true  RE-SELLADO  asiento:TRUE  staging vive:true  ¿hubo return?: sí
=== M5 ===  lanza: no  → {"ok":false,"step":"post-fusion","error":"symlink_en_resultado"}
            aterriza:true  RE-SELLADO  asiento:TRUE
=== M6 ===  lanza: no  → {"ok":false,"step":"sellar","error":"sellar_interrumpido"}
            aterriza:FALSE  manifiesto:INTACTO  asiento:false
            huella árbol: IGUAL (20bff49f08ab → 20bff49f08ab)
```

### La tabla

| # | entrada | antes | después | ¿arranca el root? |
| - | ------- | ----- | ------- | ----------------- |
| E1 | ledger de sólo lectura en la ruta POR DEFECTO | LANZA `EPERM`, root mutado, sin asiento | `post-fusion` / `asiento_no_escribible`, con `aterrizado`, `sellado` y **recuperación ejecutable** | **no** (declarado; la recuperación lo devuelve a `ok`) |
| E2 | `syncVolumeCounters` con estado no escribible | LANZA `EPERM`, sin asiento | `post-fusion` / `estado_no_escribible`, **con asiento** | **sí** (era «no» antes) |
| E3 | walk de NO-LINK con subdirectorio sin listado | LANZA `EPERM scandir`, sin asiento | `post-fusion` / `resultado_no_inspeccionable`, **con asiento** | **sí** (era «no») |
| E4 | `rmSync` del `finally` sobre import COMPLETO | LANZA `EBUSY`, **sustituye al `return` de éxito** | `ok:true` + `staging:{eliminado:false, causa}` | sí |
| E5 | `symlink_en_resultado` tras fusionar y sellar | `{ok:false, step:'no-link'}` **callando que aterrizó** | `post-fusion` / `symlink_en_resultado` + `aterrizado`, `sellado`, `asiento` | **sí** (era «no»); el cerco sigue viendo `enlace_vivo` |
| E6 | `sealManifest` sobre manifiesto no escribible | LANZA `EPERM`, corpus en destino sin entrada en el manifiesto | `sellar` / `sellar_interrumpido` **con revert**: huella del árbol **IGUAL** | sí, y el import **se puede repetir** |

## §3 · La decisión, con su argumento

**Elegida: (b) declarar.** Con una excepción declarada: **(a) revertir mientras
el sello no esté puesto** (E6). Mezclar está permitido si se dice; se dice aquí y
en la cabecera del módulo.

**Por qué (b) y no (a), en hechos medidos:**

1. **Revertir después del sello exige ESCRIBIR, y la clase entera de fallos es
   «no se puede escribir en el root».** Deshacer E1 o E2 obligaría a reescribir
   `volumes.json` con los bytes previos; en un root donde el manifiesto también
   fuera de sólo lectura (E6 lo demuestra plantable) el rollback falla **por la
   misma causa**. Un rollback que puede fallar exige declarar el
   medio-aterrizaje igualmente: **(a) no ahorra (b), le añade un paso frágil.**
2. **`deshacerFusion` declara en su propio contrato que no vale después de
   SELLAR** («a partir de ahí los datos son la verdad y deshacerlos dejaría el
   manifiesto mintiendo»). Estirarlo hasta aquí sería ensanchar una frase por
   encima de su evidencia — el defecto que este carril lleva 53
   contrarrevisiones cazando.
3. **En dos de los cinco no hay nada que revertir.** E4 cae sobre un import
   **completado, con asiento escrito** (medido): revertirlo destruiría un
   resultado correcto por no haber podido borrar un directorio temporal. E5
   describe un **ancla viva que ya estaba en el destino** (VERIFICAR rechaza las
   del pack): deshacer borraría datos correctos y dejaría el ancla.
4. **Y (b) sin más no bastaba para E6**, que es por lo que ahí sí se revierte:
   sin deshacer, el corpus queda en destino sin entrada en el manifiesto y **el
   import ni siquiera se puede repetir** — la segunda pasada muere con
   `slot_ocupado`. Medido en el censo (§5, amputación 5). Con el deshacer, la
   huella del árbol vuelve idéntica y repetir da `ok:true`.

**Lo que la declaración dice, y que antes no decía nadie:** `step:'post-fusion'`
+ `aterrizado:true` + `sellado:{before,after}` + `asiento` (falso o el asiento
escrito) + `causa` entera (código, syscall, ruta) + `recuperacion`.

**Y la corrección de fondo, que es de ORDEN.** Desde que `sealManifest` escribe,
el manifiesto declara `source.imported` y `verify.mjs` §2 EXIGE un asiento que lo
respalde. Entre el sello y el asiento corrían `syncVolumeCounters` y el walk de
NO-LINK: cualquiera de los dos lanzando dejaba el root **sin arrancar y sin
reparación por re-import**. Ahora son un par sin nada en medio. Esto no es «más
precondiciones» —la CA las prohíbe con razón, tocarían el root antes de
VERIFICAR—: es poner cada operación irreversible en su sitio. Ninguna sonda de
escribibilidad se ha añadido.

### La recuperación, ejecutada (no descrita)

| código | recuperación | probado en |
| --- | --- | --- |
| `asiento_no_escribible` | `appendOpsLedger(res.recuperacion.entrada, {ledgerPath})` — **la entrada exacta viaja en la respuesta**, porque repetir el import NO repara (`noop:true`, medido) | `CA-2 · recuperación del asiento…` → `verifyRootIntegrity().ok === true` |
| `estado_no_escribible` | `syncVolumeCounters(volId)` — el estado es regenerable midiendo | `CA-2 · recuperación del estado vivo…` |
| `resultado_no_inspeccionable` | `assertVolumesRootBootable` / `scanRootCerco` vuelven a hacer la pregunta sobre el root entero | `CA-2 · recuperación de la inspección…` |
| `symlink_en_resultado` | retirada manual del ancla; el cerco de arranque la sigue viendo | `E5 …` (se comprueba el `enlace_vivo`) |
| `sellar_interrumpido` | root ya devuelto a su estado previo → corregir la causa y **repetir el import** | `E6 …` → `ok:true` |
| `staging.eliminado:false` | el staging sobrevive dentro del root y lo ve el cerco; `causa` con syscall y ruta | `CA-3 …` |

## §4 · CA-3 · el `finally`, distinguible del éxito SIEMPRE

Era el peor y no por probable: una excepción en un `finally` **sustituye al
`return`**. Medido: un import con corpus aterrizado, manifiesto re-sellado y
**asiento escrito** salía como `EBUSY` indistinguible de un fallo real.

Lo entregado: `limpiarStaging()` no lanza nunca y devuelve `{dir, eliminado,
causa}`; el `finally` rellena **por referencia** un objeto que ya viaja en el
resultado, así que el desenlace nunca cambia. `maxRetries:3` porque el bloqueo
típico es transitorio y el contrato §1 dice que el staging nunca sobrevive;
cuesta ≤ ~0,3 s y sólo en el camino que ya iba a fallar — **no convierte en éxito
un bloqueo persistente**, y hay control que lo comprueba.

Vector plantable y determinista: se congela `Date.now` para hacer predecible el
nombre del staging (`.import-staging-<pack>-<pid>-<now>`), se planta un
subdirectorio bloqueado dentro y se corre el import. Sin congelar el reloj no hay
forma de bloquear el staging antes de que `importPack` lo use, y el vector no se
ejercitaría de verdad. El bloqueo es el cwd (Windows, `EBUSY` medido) o el modo
0500 del directorio (POSIX, `EACCES`).

Hay además **prueba directa de la pieza**: `limpiarStaging` a solas sobre un
directorio bloqueado, sobre uno normal y sobre uno inexistente.

## §5 · Censo de mutación (CA-6)

Regla aplicada al pie: *un negativo no está verificado hasta que desactivas su
guardián y compruebas que enrojece*. **Una amputación por prueba, no todas a la
vez**: con las amputaciones mezcladas no se sabría cuál sostiene cuál. Cada
amputación asevera cuántos sitios debía tocar; si deja de casar, la prueba
enrojece por no encontrar qué amputar.

| # | guardián desactivado | cómo | qué se exige al enrojecer | resultado |
| - | -------------------- | ---- | ------------------------- | --------- |
| 1 | envoltorio del asiento | `throw err;` al frente del `catch` | vuelve a LANZAR `EPERM` con el root ya sellado y sin asiento | ✅ |
| 2 | envoltorio de contadores | ídem | vuelve a LANZAR `EPERM` | ✅ |
| 3 | envoltorio de NO-LINK | ídem | vuelve a LANZAR `scandir` | ✅ |
| 4 | **el ORDEN** (contadores antes del asiento) | se reinserta la llamada donde estaba en la base, sin envolver | manifiesto sellado, **cero asiento**, `verifyRootIntegrity` → `ledger_ausente`: **el root deja de arrancar** | ✅ |
| 5 | el deshacer de SELLAR | `deshacerFusion(...)` → `{deshechos:[],sinDeshacer:[]}` | el root queda tocado, el corpus en destino, y la **segunda pasada da `slot_ocupado`** | ✅ |
| 6 | `limpiarStaging` | se restaura el `rmSync` desnudo | el import COMPLETO (con asiento) vuelve a morir por el conserje y **no hay `return`** | ✅ |
| 7 | la declaración del ancla | `trasFusion(...)` → `fail('no-link', ...)` | vuelve a `step:'no-link'` y **deja de decir** `aterrizado`/`sellado` | ✅ |

La amputación 4 es la que aísla el **reorden** de los envoltorios: si el orden no
fuera portante, ese caso seguiría dando asiento y root arrancable. No lo da.

**Y un enrojecimiento que no era mío pero lo provocó este WP**: el censo de
U253b exigía «sin la guarda DEBE volver a lanzar». U268 elimina esa conducta a
propósito, así que la prueba se cayó. **No se relajó: se re-apuntó a lo que la
guarda de U253b protege** —que el root NO se toque— y se comprobó que sin ella el
root **sigue mutando** (los nueve casos → `post-fusion/asiento_no_escribible` con
el volumen a medias). Es decir: **U268 no vuelve redundantes las precondiciones
de U253b**; lo que compra cada una es distinto y ahora está escrito en el
fichero.

## Evidencia

### Gates (obligatorio)

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Tests

```
$ node --test test/u268-atomicidad-post-fusion.test.mjs
ok 1 - CA-3 · un import COMPLETO cuyo staging no se puede retirar sigue siendo ok:true y lo DICE
ok 2 - CA-3 control · sin bloqueo, el staging se retira y el resultado lo dice
ok 3 - CA-3 · `limpiarStaging` a solas: devuelve el fallo, no lo lanza
ok 4 - E1 · asiento no escribible → post-fusion/asiento_no_escribible, con el sello puesto
ok 5 - E2 · estado vivo no escribible → post-fusion/estado_no_escribible, y el root SÍ arranca
ok 6 - E3 · árbol resultante ilegible → post-fusion/resultado_no_inspeccionable
ok 7 - E5 · ancla viva en el resultado → post-fusion/symlink_en_resultado, diciendo que aterrizó
ok 8 - E6 · SELLAR lanzando → se REVIERTE: el root vuelve byte a byte y el import se puede repetir
ok 9 - CA-2 · recuperación del asiento: apendar la entrada devuelta hace arrancar el root
ok 10 - CA-2 · recuperación del estado vivo: re-medir escribe lo que faltaba
ok 11 - CA-2 · recuperación de la inspección: recuperado el permiso, la pregunta se vuelve a hacer
ok 12 - CENSO · sin el envoltorio del asiento, vuelve a LANZAR con el root ya sellado
ok 13 - CENSO · sin el envoltorio de los contadores, vuelve a LANZAR
ok 14 - CENSO · sin el envoltorio de NO-LINK, vuelve a LANZAR
ok 15 - CENSO · restaurado el ORDEN de la base (contadores antes del asiento), el root deja de arrancar
ok 16 - CENSO · sin el deshacer de SELLAR, el root queda a medias y el import NO se puede repetir
ok 17 - CENSO · con el `finally` desnudo, el import COMPLETO vuelve a morir por el conserje
ok 18 - CENSO · sin la declaración del ancla, `symlink_en_resultado` vuelve a callar que aterrizó
# tests 18
# pass 18
# fail 0
# skipped 0
```

```
$ node --test test/*.test.mjs        # paquete entero
# tests 258
# pass 256
# fail 0
# skipped 2
```

Los 2 omitidos son los preexistentes del paquete (vectores de caja de FS que este
sistema no distingue); no los introduce este WP.

### Lint

```
$ npx --no-install eslint packages/engine/volumes-ops

packages/engine/volumes-ops/test/u253-escritura-sobre-manifiesto.test.mjs
  219:11  warning  'root' is assigned a value but never used  no-unused-vars
  729:11  warning  'root' is assigned a value but never used  no-unused-vars

✖ 2 problems (0 errors, 2 warnings)
```

Los 2 avisos son preexistentes y están en un fichero que este WP no toca.

### Formato

`prettier --check` marca los ficheros del paquete **también en la base**: el
árbol de trabajo está en CRLF y `endOfLine` por defecto es `lf`. Comprobado
neutralizando el final de línea, los deltas de `import.mjs`, `fusion-guard.mjs`,
`index.mjs` y `u253b-…test.mjs` son **exactamente los mismos que en `HEAD`** —
este WP no introduce ninguno. El fichero nuevo sí se dejó limpio:

```
$ npx --no-install prettier --end-of-line lf --check test/u268-atomicidad-post-fusion.test.mjs
Checking formatting...
All matched files use Prettier code style!
```

CI corre `npm run lint`, no `prettier --check`.

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u268-atomicidad-despues-de-fusionar` |
| run_id | ⏳ sin verificar |
| workflow | CI |
| conclusion | ⏳ sin verificar — **no se hizo `git push`** (prohibido por el brief) |

## Qué NO cubro

Dicho aquí y también en la cabecera del fichero de prueba.

1. **Flujos de datos alternos de NTFS.** `fs.readdir` no los enumera: un
   `fichero:flujo` escrito dentro de una entrada existente **no mueve la
   huella**. Misma ceguera que declara `ledger-cerco.mjs` y por el mismo motivo
   (el API de ficheros de Node no los expone). No es hipotético: el cerco de
   U253a existe porque ese canal escribe DENTRO del manifiesto.
2. **Marcas de tiempo y atributos.** `mtime`/`atime` quedan fuera a propósito —
   los mueve cualquier lectura. Consecuencia concreta y honesta: el «byte a
   byte» del revert de E6 se afirma sobre **contenido, tipo, modo y estructura**;
   los `mtime` de los directorios que la fusión tocó **no vuelven**, y
   `deshacerFusion` ya lo declaraba en su alcance.
3. **Rutas fuera del root.** Un residuo en `os.tmpdir()` o en otro volumen no
   entra en la huella.
4. **Concurrencia real.** Los bloqueos se plantan desde el mismo proceso
   (atributo, modo, ACL, cwd). El `EBUSY` clásico de Windows —handle abierto por
   **otro** proceso— no se reproduce; se ejercita el mismo código de error por
   una vía plantable. Y no se cubre ninguna carrera entre dos `importPack`
   simultáneos: sigue fuera del contrato, como antes de este WP.
5. **`sellar_interrumpido` por el CÓMPUTO del sello.** El vector medido es
   `volumes.json` no escribible (`EPERM` en la escritura). El envoltorio cubre
   **también** el cómputo (`sha256File` de lo aterrizado, `snapshotOf`,
   `measurePath`) porque la frase «ninguna excepción escapa de la zona posterior
   a FUSIONAR» sólo es cierta si cubre la región entera; pero **no tengo vector
   natural** para hacer lanzar ese cómputo, y por eso hay **un solo código** en
   vez de una taxonomía inventada: la `causa` lleva el syscall real. Dicho como
   límite, no como cobertura.
6. **El entorno superusuario.** Como root los modos POSIX no bloquean nada.
   Cada vector se **autoverifica** sobre un directorio de usar y tirar antes de
   que ninguna prueba se apoye en él; si no bloquea, el caso se **abstiene con
   `skip`**. En un CI que corra como root, esos casos no se ejecutan y hay que
   saberlo: no serían verdes, serían omitidos. (En esta máquina, `win32`, los 18
   corren.)
7. **El resto del contrato de import.** Este WP no toca VERIFICAR, STAGING,
   VALIDAR, el gate NO-OP ni los cuatro drivers; su cobertura es la de sus
   propios WP.
8. **CI.** No se hizo push, así que no hay run que enseñar. Verde local ≠ gate
   CI, y el brief prohíbe el push.

## Demolición

- Se retiró de la cabecera de `import.mjs` el bloque «LO QUE ESTE WP **NO**
  CIERRA» de U253b: sus seis puntos ya no están abiertos, y dejarlo habría sido
  la frase mintiendo por defecto.
- Se corrigió la frase que este WP tenía por encargo juzgar. «Every failure
  leaves the root intact … Nothing lands halfway» era falsa para esta familia.
  Ahora la cabecera dice **dónde está la frontera**: garantía hasta FUSIONAR;
  desde SELLAR, tres promesas comprobables (ninguna excepción escapa, el
  medio-aterrizaje se nombra con recuperación, la limpieza no cambia el
  desenlace).
- No se añadió ninguna sonda de escribibilidad. La CA la prohíbe y no hacía
  falta: el arreglo era de orden y de envoltorio.
