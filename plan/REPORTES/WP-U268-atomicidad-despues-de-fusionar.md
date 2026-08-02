# WP-U268 · Qué hacer cuando el fallo sólo es conocible DESPUÉS de fusionar — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm Scriptorium (worktree `C:/S_LAB/wt/z-u268`) |
| fecha | 2026-08-02 |
| rama | `wp/u268-atomicidad-despues-de-fusionar` |
| commit(s) | `6c124e3`, `7cf0168`, + devolución (sobre `c005196`) |
| estado propuesto | devuelto-corregido (2 bloqueantes + 4 menores) |

## Devolución · qué cambió respecto de la primera entrega

**B1 era una regresión que destruía datos, y la contrarrevisión tenía razón en
todo.** Mi tesis («revertir sólo mientras el sello no esté puesto») no estaba
implementada: estaba SUPUESTA. `manifest.mjs:72-77` **escribe en (b) y hashea en
(d)**, así que entre las dos hay una subventana en la que el sello ya cambió; mi
`catch` revertía sin preguntar, el corpus volvía al staging, el `finally` lo
borraba, y el resultado decía `aterrizado:false, sellado:null` mientras el
manifiesto declaraba el import. Peor que la base, que al menos dejaba los
ficheros. Reproducido, corregido y con censo propio en §6.

**B2 también**: «un PAR sin nada en medio» era prosa. Entre el sello y el asiento
corrían tres cosas sin envolver. Corregido moviendo el parte de `sellar` detrás
del asiento y añadiendo una **red de última línea**; la frase está reescrita para
decir lo que el código hace. §7.

Los cuatro menores, cerrados (§8). Lo que la contrarrevisión dio por bueno
—re-apuntado de U253b, revert de E6 bajo su huella más fuerte, E4, las
recuperaciones de E1/E2/E3, el reorden— no se tocó salvo donde B1/B2 obligaban.

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
intencional y dicha**: se **revierte sólo cuando se PRUEBA que el sello no se ha
movido** —leyéndolo del disco, no suponiéndolo por la fase— y se **declara** en
todo lo demás. El argumento está abajo (§3), la corrección de la primera versión
en §6, y las dos cosas también en la cabecera de `src/import.mjs`.

Además de declarar, se corrigió la **causa de fondo, que era de ORDEN y no de
guardas**: entre `sealManifest` y `appendOpsLedger` corrían operaciones que
podían lanzar y dejar el manifiesto sellado sin asiento. Ahora **entre el sello y
el asiento no queda nada que pueda escaparse** (los contadores, NO-LINK y el
parte de `sellar` van detrás, y una red de última línea recoge lo que quede). Con
eso, cuatro de los seis dejan de dejar el root sin arrancar.

## Archivos tocados

| archivo | qué |
| --- | --- |
| `packages/engine/volumes-ops/src/import.mjs` | modificado — cabecera reescrita (la frontera y la decisión con su argumento); `limpiarStaging()` exportada; `finally` que no puede lanzar; envoltorio de SELLAR que **mide el sello antes de decidir si revierte** (B1); `construyeAsiento()` y `manifiestoVivo()` en un solo sitio; asiento inmediatamente tras el sello; partes de `fusionar`/`sellar` reubicados y **red de última línea** (B2); contadores y NO-LINK detrás del asiento y envueltos; `step:'post-fusion'` con `aterrizado`/`sellado`/`asiento`/`recuperacion`/`causa`; `staging` en toda salida posterior a STAGING |
| `packages/engine/volumes-ops/src/fusion-guard.mjs` | modificado — `applyFusion` devuelve además `movimientos` (aditivo); `deshacerFusion` documenta su segundo y último llamante, del mismo lado de la frontera |
| `packages/engine/volumes-ops/src/index.mjs` | modificado — exporta `limpiarStaging` (su promesa necesita prueba directa) |
| `packages/engine/volumes-ops/test/u268-atomicidad-post-fusion.test.mjs` | **creado** — 24 casos: el `finally`, las seis entradas como contrato, los dos vectores de B1 con su censo, el hueco de B2, la rama `sinDeshacer`, las cinco recuperaciones ejecutadas y el censo de mutación (8 amputaciones) |
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
`test/.medida-u268.mjs`, `test/.sonda-mutante.mjs`, y en la devolución
`test/.b1-u268.mjs` y `test/.dc-probe.mjs`). Root de usar y tirar en
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
| E6 | `sealManifest` sobre manifiesto no escribible (**el sello no llega a moverse**) | LANZA `EPERM`, corpus en destino sin entrada en el manifiesto | `sellar` / `sellar_interrumpido` **con revert**: huella del árbol **IGUAL** | sí, y el import **se puede repetir** |
| E7 | `sealManifest` lanzando **con el sello YA movido** (escritura completa) — §6 | LANZA `EIO`, corpus en destino, `ledger_ausente` | `post-fusion` / `sello_sin_confirmar`, **sin revertir**, sello medido del disco | no, y la recuperación (apendar el asiento) lo devuelve a `ok` |
| E8 | ídem con **escritura truncada** (disco lleno) — §6 | LANZA `ENOSPC`, corpus en destino, `manifiesto_ilegible` | `post-fusion` / `manifiesto_a_medias`, **sin revertir** | no; recuperación de operador (restaurar `volumes.json`) |

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
| `sellar_interrumpido` (sin `sinDeshacer`) | root ya devuelto a su estado previo → corregir la causa y **repetir el import** | `E6 …` → `ok:true` |
| `sellar_interrumpido` (con `sinDeshacer`) | `via:'operador'` con las `rutas` que no se pudieron deshacer, antes de repetir | `E6b …` |
| `sello_sin_confirmar` | `appendOpsLedger` con la entrada, `after` = **sello vivo del disco** | `B1 · escritura COMPLETA…` → `verifyRootIntegrity().ok === true` |
| `manifiesto_a_medias` | `via:'operador'`: restaurar `volumes.json`; el corpus **sigue en destino** y va enumerado | `B1 · escritura TRUNCADA…` |
| `post_sello_interrumpido` (red) | según haya asiento o no; si no, la entrada viaja igual | `B2 · un fallo en el hueco…` |
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
guardián y compruebas que enrojece*. **Una amputación por prueba**, salvo la #4,
que necesita dos y lo dice. Cada amputación asevera cuántos sitios debía tocar;
si deja de casar, la prueba enrojece por no encontrar qué amputar.

| # | guardián desactivado | cómo | qué se exige al enrojecer | resultado |
| - | -------------------- | ---- | ------------------------- | --------- |
| 1 | envoltorio del asiento | `throw err;` al frente del `catch` | **pierde su código y su nota**: cae en la red como `post_sello_interrumpido` | ✅ |
| 2 | envoltorio de contadores | ídem | ídem | ✅ |
| 3 | envoltorio de NO-LINK | ídem | ídem | ✅ |
| 4 | **la RED + el envoltorio del asiento** (las dos: la promesa la sostienen entre ambas, con una sola la otra tapa — declarado) | ídem ×2 | la excepción **vuelve a ESCAPARSE** con el root sellado y sin asiento: conducta de la base | ✅ |
| 5 | **la pregunta por el sello** (B1) | `selloIntacto` → `true` (la suposición de la 1ª entrega) | vuelve `sellar_interrumpido` con `aterrizado:false` y **BORRA el corpus** (`volumen_ausente`) | ✅ |
| 6 | **el ORDEN** (contadores antes del asiento) | se reinserta la llamada donde estaba en la base, sin envolver | manifiesto sellado, **cero asiento**, `verifyRootIntegrity` → `ledger_ausente` | ✅ |
| 7 | el deshacer de SELLAR | `deshacerFusion(...)` → `{deshechos:[],sinDeshacer:[]}` | el root queda tocado, el corpus en destino, y la **segunda pasada da `slot_ocupado`** | ✅ |
| 8 | `limpiarStaging` | se restaura el `rmSync` desnudo | el import COMPLETO (con asiento) vuelve a morir por el conserje y **no hay `return`** | ✅ |
| 9 | la declaración del ancla | `trasFusion(...)` → `fail('no-link', ...)` | vuelve a `step:'no-link'` y **deja de decir** `aterrizado`/`sellado` | ✅ |

La #6 aísla el **reorden** de los envoltorios: si el orden no fuera portante, ese
caso seguiría dando asiento y root arrancable. No lo da. La #5 es la que la
contrarrevisión hizo falta para que existiera.

**Cambio respecto de la primera entrega**: 1–3 exigían «vuelve a LANZAR». Con la
red de última línea eso dejó de ser cierto —y es una mejora, no una pérdida—, así
que ahora exigen lo que el envoltorio realmente compra (su código y su nota) y el
«vuelve a lanzar» se mide en la #4, donde corresponde.

**Y un enrojecimiento que no era mío pero lo provocó este WP**: el censo de
U253b exigía «sin la guarda DEBE volver a lanzar». U268 elimina esa conducta a
propósito, así que la prueba se cayó. **No se relajó: se re-apuntó a lo que la
guarda de U253b protege** —que el root NO se toque— y se comprobó que sin ella el
root **sigue mutando** (los nueve casos → `post-fusion/asiento_no_escribible` con
el volumen a medias). Es decir: **U268 no vuelve redundantes las precondiciones
de U253b**; lo que compra cada una es distinto y ahora está escrito en el
fichero.

## §6 · B1 · el revert se estrecha al tramo que la tesis sí argumenta

### El defecto

`sealManifest` (`manifest.mjs:72-77`): `(a) readManifestRaw → (b) writeFileSync
→ (c) resetVolumesCache → (d) hashManifest`. **El sello se pone en (b)**, no
cuando la función devuelve. Mi `catch` envolvía las cuatro y revertía
incondicionalmente, con `sellado: null` y `aterrizado` como constantes derivadas
en vez de medidas.

### Cómo se reprodujo

No hay vector portable para un disco lleno, así que se sustituye **sólo
`manifest.mjs`** por un módulo que re-exporta todo y cuyo `sealManifest`
reproduce el ESTADO EN DISCO de los dos fallos. `import.mjs` queda **byte a byte
el que se entrega** — lo único redirigido es el especificador del `import`:

- `trunca` → escribe un `volumes.json` truncado (que es lo que hace
  `writeFileSync` con `ENOSPC`: trunca al abrir) y lanza `ENOSPC`;
- `completa` → llama al sellador REAL (bytes exactos) y lanza después, donde
  está el hash.

```
$ node test/.b1-u268.mjs
```

### Antes / primera entrega / ahora

| | base `c005196` | 1ª entrega U268 | ahora |
| --- | --- | --- | --- |
| **`completa`** · lanza | `EIO` (escapa) | no | no |
| · devuelve | — | `sellar/sellar_interrumpido` | `post-fusion/sello_sin_confirmar` |
| · `aterrizado` | — | **`false`** (falso) | `true` |
| · `sellado` | — | **`null`** (falso) | `{before, after}` **medido del disco** |
| · corpus en destino | **sí** | **NO — BORRADO** | **sí** |
| · `verifyRoot` | `ledger_ausente` | `ledger_ausente` + `volumen_ausente` | `ledger_ausente` |
| · recuperación | (ninguna) | *«volvió a su estado previo»* → `noop` | `appendOpsLedger` con la entrada, `after` = sello vivo → `verifyRoot.ok` |
| **`trunca`** · lanza | `ENOSPC` (escapa) | no | no |
| · devuelve | — | `sellar/sellar_interrumpido` (`aterrizado:false`) | `post-fusion/manifiesto_a_medias` (`aterrizado:true`) |
| · corpus en destino | **sí** | **NO — BORRADO** | **sí** |
| · `verifyRoot` | `manifiesto_ilegible` | `manifiesto_ilegible` | `manifiesto_ilegible` |

En los dos vectores el resultado de ahora **iguala o mejora a la base y ya no
destruye nada**.

### La regla, y por qué se enuncia así

> **se revierte SÓLO si se PRUEBA que el sello no se movió.**

No por fases («antes de SELLAR»), que es lo que falló: la fase no es un instante.
Se lee el manifiesto vivo y se compara con `sealBefore.sha256`. **«No se puede
leer» no es prueba** y cae del lado de no revertir — el lado que no destruye. Con
el sello movido se distingue si el manifiesto **dice** lo que este import quería
sellar (parsea y declara el `packHash` de todos los volúmenes: `sello_sin_confirmar`,
misma cura que E1) o no (`manifiesto_a_medias`, recuperación de operador con los
volúmenes en destino enumerados). Se le pregunta al artefacto, no se re-serializa
para compararlo: eso habría duplicado el formato del escritor.

**E6 sigue revirtiendo** (`attrib +R` → el sello no llega a moverse), con la misma
huella de árbol idéntica. La condición no se ha aflojado, se ha estrechado.

### Censo de B1

`const selloIntacto = vivo !== null && …` → `const selloIntacto = true;`
(la suposición de la 1ª entrega). Resultado exigido: vuelve `sellar_interrumpido`
con `aterrizado:false`, **el corpus desaparece** y `verifyRoot` añade
`volumen_ausente`. Verde.

## §7 · B2 · la frase, ajustada a lo que el código hace

Entre `sealManifest` y `appendOpsLedger` corrían sin envolver el `steps.push` de
`sellar` (con sus `.map`/`.filter`), la asignación de `trasFusion` y el literal
del asiento. Y el `steps.push` de `fusionar` también estaba desnudo, ya en zona
posterior a la fusión.

Lo hecho:
1. el parte de `fusionar` pasa **dentro** del envoltorio de SELLAR (ahí el revert
   aún es legítimo);
2. el parte de `sellar` pasa **detrás del asiento** — es contabilidad y nadie
   depende de él. **El orden del array `steps` no cambia**, y hay aserción que lo
   fija (`['verificar','familia','staging','validar','fusionar','sellar','no-link']`);
3. todo lo que queda tras el sello vive dentro de una **red de última línea** que
   devuelve `post-fusion/post_sello_interrumpido` con `causa` y con si hay asiento.

**La frase, reescrita** (cabecera del módulo): ya no dice «un par sin nada en
medio» —eso era prosa— sino **«entre el sello y el asiento no queda nada que
pueda ESCAPARSE»**, con el paréntesis explícito: *no es que no corra nada en
medio; es que nada de lo que corre puede salirse.*

Prueba del hueco exacto que señaló la contrarrevisión: se inyecta un fallo en el
`steps.push` de `sellar` y se exige `post_sello_interrumpido` con el asiento ya
escrito y el root arrancando. Y el censo correspondiente: **amputadas la red Y el
envoltorio** (las dos, porque la promesa la sostienen entre ambas, y con una sola
la otra tapa), la excepción vuelve a escaparse con el root sellado y sin asiento.

Efecto sobre el censo anterior: amputar un envoltorio con nombre ya no produce
una excepción —la red lo recoge—, así que esos tres casos ahora exigen lo que el
envoltorio realmente compra: **que su código y su nota propios desaparezcan**.

## §8 · Los cuatro menores

| menor | qué se hizo |
| --- | --- |
| la rama `sinDeshacer > 0` sin guardián | **cubierta** (`E6b`): sustituto de `fusion-guard.mjs` cuyo `deshacerFusion` deja el primer movimiento sin deshacer y lo declara — la forma exacta que produce el módulo real, cuya conducta con un fallo REAL ya prueba `fusion-guard.test.mjs:721-723`. Se exige `aterrizado:true`, `sinDeshacer.length===1`, `via:'operador'` con sus `rutas`, y que **el disco confirme el parte** (lo no deshecho sigue en destino). Los dos mutantes que sobrevivían ahora mueren |
| `entradaAsiento.volumes` sin fijar | fijado en tres sitios: el asiento del import feliz, la entrada de recuperación de E1 y la de B1·`completa` (`deepEqual ['demo']`), más `role`, `packHash` y `manifestSha256.before` |
| «las cinco recuperaciones se ejecutan» era 4 + 1 observada | **`symlink_en_resultado` ahora se ejecuta**: se retiran las anclas que la respuesta enumera y se exige que el cerco deje de verlas y `verifyRootIntegrity().ok === true`. Son cinco ejecutadas |
| CA-5 re-apuntado aceptaba `lanzo \|\| post-fusion` | **estrechado a lo medido**: se exige `lanzo === null` y `step === 'post-fusion'` para los nueve, más `aterrizado === true` |

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
ok 9 - B1 · escritura COMPLETA y fallo después → NO se revierte, y el corpus SIGUE en destino
ok 10 - B1 · escritura TRUNCADA (disco lleno) → manifiesto_a_medias, y tampoco se borran los datos
ok 11 - B1 censo · sin la pregunta por el sello, el revert vuelve y BORRA el corpus
ok 12 - E6b · revert que NO consigue deshacerlo todo → aterrizado:true y recuperación de operador
ok 13 - CA-2 · recuperación del asiento: apendar la entrada devuelta hace arrancar el root
ok 14 - CA-2 · recuperación del estado vivo: re-medir escribe lo que faltaba
ok 15 - CA-2 · recuperación de la inspección: recuperado el permiso, la pregunta se vuelve a hacer
ok 16 - CENSO · sin el envoltorio del asiento, se pierde el código y la nota propios
ok 17 - CENSO · sin el envoltorio de los contadores, se pierde su código
ok 18 - CENSO · sin el envoltorio de NO-LINK, se pierde su código
ok 19 - CENSO · sin la RED y sin el envoltorio, la excepción vuelve a ESCAPARSE (conducta de la base)
ok 20 - B2 · un fallo en el hueco sello↔asiento sale por la RED, no como excepción
ok 21 - CENSO · restaurado el ORDEN de la base (contadores antes del asiento), el root deja de arrancar
ok 22 - CENSO · sin el deshacer de SELLAR, el root queda a medias y el import NO se puede repetir
ok 23 - CENSO · con el `finally` desnudo, el import COMPLETO vuelve a morir por el conserje
ok 24 - CENSO · sin la declaración del ancla, `symlink_en_resultado` vuelve a callar que aterrizó
# tests 24
# pass 24
# fail 0
# skipped 0
```

```
$ node --test test/*.test.mjs        # paquete entero
# tests 264
# pass 262
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
5. **`sellar_interrumpido` por el CÓMPUTO del sello.** El vector natural medido
   es `volumes.json` no escribible (`EPERM` en la escritura). El envoltorio cubre
   **también** el cómputo (`sha256File` de lo aterrizado, `snapshotOf`,
   `measurePath`) porque la frase «ninguna excepción escapa de la zona posterior
   a FUSIONAR» sólo es cierta si cubre la región entera; pero **no tengo vector
   natural** para hacer lanzar ese cómputo, y por eso hay **un solo código** en
   vez de una taxonomía inventada: la `causa` lleva el syscall real. Dicho como
   límite, no como cobertura.
6. **Tres fallos se ejercitan por INYECCIÓN, no por vector natural**, y en los
   tres se sustituye una pieza vecina dejando `import.mjs` **byte a byte el que
   se entrega** (se redirige el especificador del `import`, no la lógica):
   - los dos de §6 (**disco lleno** y **fallo tras la escritura**) sustituyen
     `manifest.mjs`. No hay forma portable de llenar un disco ni de hacer fallar
     el `readFileSync` de (d) habiendo pasado el de (a);
   - la rama `sinDeshacer > 0` sustituye `fusion-guard.mjs`. **No conseguí
     plantar un rename de vuelta fallido desde dentro de `importPack`**: probé
     denegar `DC` en el directorio destino (no bloquea, medido en
     `test/.dc-probe.mjs`), handles abiertos (no bloquean) y cwd (sí bloquea un
     rename, pero el directorio no existe hasta después de fusionar). Lo que sí
     está probado con un fallo REAL es que `deshacerFusion` produce ese
     inventario (`fusion-guard.test.mjs:721-723`); lo inyectado es sólo su
     traducción al contrato;
   - el fallo del hueco de B2, porque un `.map` sobre un array construido por
     nosotros no revienta solo.
   En los tres casos el estado en disco que ve el código bajo prueba es el REAL.
7. **El entorno superusuario.** Como root los modos POSIX no bloquean nada.
   Cada vector se **autoverifica** sobre un directorio de usar y tirar antes de
   que ninguna prueba se apoye en él; si no bloquea, el caso se **abstiene con
   `skip`**. En un CI que corra como root, esos casos no se ejecutan y hay que
   saberlo: no serían verdes, serían omitidos. (En esta máquina, `win32`, los 24
   corren; en `ubuntu-latest` como usuario normal deberían correr todos también,
   pero **no lo he verificado** — no hice push.)
8. **El resto del contrato de import.** Este WP no toca VERIFICAR, STAGING,
   VALIDAR, el gate NO-OP ni los cuatro drivers; su cobertura es la de sus
   propios WP.
9. **CI.** No se hizo push, así que no hay run que enseñar. Verde local ≠ gate
   CI, y el brief prohíbe el push.

## Demolición

- Se retiró de la cabecera de `import.mjs` el bloque «LO QUE ESTE WP **NO**
  CIERRA» de U253b: sus seis puntos ya no están abiertos, y dejarlo habría sido
  la frase mintiendo por defecto.
- Se corrigió la frase que este WP tenía por encargo juzgar. «Every failure
  leaves the root intact … Nothing lands halfway» era falsa para esta familia.
  Ahora la cabecera dice **dónde está la frontera**: garantía hasta FUSIONAR;
  desde ahí, cuatro promesas comprobables (ninguna excepción escapa, el
  medio-aterrizaje se nombra con recuperación, nada entre sello y asiento puede
  escaparse, la limpieza no cambia el desenlace).
- **Se demolió una frase mía de la primera entrega**, y es la lección de esta
  devolución: «revertir mientras el sello no esté puesto» describía una FASE, y
  la fase no es un instante — `sealManifest` escribe a la mitad. Enunciar la
  condición por fases dejaba el código creyendo algo que no había mirado.
  Sustituida por una condición **que se comprueba**: se revierte si y sólo si el
  sello leído del disco coincide con el previo.
- **Se demolió la otra**: «un par sin nada en medio» no describía el código sino
  el propósito. Ahora se promete lo que se puede sostener —que nada de lo que
  corre en medio puede escaparse— y hay red y prueba para ello.
- No se añadió ninguna sonda de escribibilidad. La CA la prohíbe y no hacía
  falta: el arreglo era de orden, de envoltorio y de preguntar en vez de suponer.
