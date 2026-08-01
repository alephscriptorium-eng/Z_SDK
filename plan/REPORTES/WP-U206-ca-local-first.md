# WP-U206 · CA local-first + réplica A→B

**Rama** `wp/u206-ca-local-first` · **base** `28397b8` · 8.º y último eslabón del carril D.
**Ronda 2** (devolución + ampliación de alcance por decisión ⑩ del custodio): los dos
gates quedan **cableados al camino del producto**, y se corrigen los dos bloqueantes y
los cuatro menores. Detalle en §8.

**Entregable:** `node e2e/local-first-ca.mjs` → **7/7 pasos verdes, exit 0, 13 vectores
rojos comprobados**. Raíces temporales (`mkdtempSync`), sin estado previo,
re-ejecutable por un tercero (ejecutado dos veces seguidas: exit 0 las dos, cero
temporales huérfanos).

> **REGLA DE MÉTODO (sale de este WP, va al método del swarm):**
> **Un verificador que nadie llama no es una protección: es una biblioteca.**
> Cuando un criterio diga «X falla», tiene que ejercitar **el camino del producto**,
> no una demostración paralela desde el arnés.

```
ZEUS_GAMES_LIBRARY=C:/S_LAB/g-sdk node e2e/local-first-ca.mjs   → exit 0
ZEUS_GAMES_LIBRARY=C:/S_LAB/g-sdk node e2e/local-first-ca.mjs --legado → exit 1
env -u ZEUS_GAMES_LIBRARY node e2e/local-first-ca.mjs           → exit 1 (fallo ruidoso)
```

---

## 0 · La shape del CA: dos volúmenes, y por qué

| volumen | material | pasos |
|---|---|---|
| `forces` | los **8 ficheros del startpack del mundo hermano**, familia FORCES | 1-4, 6, 7 |
| `lineas` | fixture canónica de linea-kit + sidecars sintéticos, familia LINEAS | 5 |

El paso 5 **no puede** montarse sobre FORCES: la familia es RO-inmutable y una
unidad que difiere da `colision_force`, que **aborta** (`driver-forces.mjs:200-207`).
Pedirle «divergencia reportada» sería pedir lo que la familia se niega a hacer.

**Elijo LINEAS y no FIREHOSE** porque LINEAS da **las dos** conductas del paso 5 en
un solo volumen —divergencia reportada (`contenido_distinto`, `driver-lineas.mjs:185-190`)
y curación intocable (`curacion_protegida`, `:166-173`, predicado real
`isCuratedSidecarPath`, `curation.mjs:76-80`)— y su fixture es canónica y vive en
este árbol. FIREHOSE sólo aporta la primera. **`ssb` no entra** (decisión ⑧-bis.3).

**Réplica A→B = LOCAL** (decisión ⑨): dos raíces en directorios temporales de la
misma máquina. Cero host remoto, cero Docker, cero imágenes.

**Procedencia del cerco:** el «§10.8» numerado **no está en este árbol**
(`plan/DECISIONES.md:694-695` lo remite a `scriptorium-cuadernos`). Cito la **copia
local** `sincronia/notas/NOTA-Z-2026-07-26-H01-volumes-concepto.md`, cuyo §⑦
(líneas 190-208) trae el `CA-LOCAL-FIRST-v0` de siete pasos que este runner ejecuta,
y cuya línea 71 enuncia el ancla viva prohibida. **Declaro que es la copia**, no el §.

---

## 1 · Los dos predicados, escritos

### «Sin red» (paso 2) — `e2e/net-trap.mjs`

> **Sin red = cero conexiones salientes a destino NO-LOOPBACK.**

**No es «cero sockets»**: los servicios bindean loopback al arrancar, y esa lectura
haría el paso imposible en vez de falsable. Bindear no es salir; conectar sí.

Se instrumentan tres puertas: `net.Socket.prototype.connect` (la de abajo — `http`,
`https`, `tls` y el conector de `undici` acaban todos ahí), `dns.lookup` +
`dns.promises.lookup` (resolver un nombre no-loopback ya es intención de red), y
`globalThis.fetch` (para nombrar la URL entera).

**Loopback** = `localhost`, `127.0.0.0/8`, `::1`, `0.0.0.0`, `::`, o host omitido.
Un socket IPC (`options.path`) no es red y se permite, **declarado**.

**Orden obligatorio, y es parte del predicado:** se ARMA antes de importar el código
bajo prueba. Un módulo que ya hizo `import { lookup } from 'node:dns'` se quedó con
la referencia vieja. Por eso el runner arma y **después** hace `await import()`.

`ZEUS_HOST` no-loopback (`presets-sdk/src/env/index.mjs:180-183`): cambia a qué host
se anuncian/atan los servicios, no introduce por sí solo una salida; si algo del
arranque conectara ahí, la trampa lo cazaría. Aseverado que el predicado clasifica
`10.0.0.7` como violación → **sigue siendo falsable**.

### «0 URLs vivas» (paso 7) — `packages/engine/volumes-ops/src/cerco.mjs`

> **URL viva = literal `http://`/`https://` en un fichero escaneado, EXCEPTO
> (a) autoridad `${VAR}` y (b) `volumes.<id>.source.imported.origin` dentro de
> `volumes.json`.**

(b) es **aplicar el contrato**, no abrir un boquete: la URL de origen viaja «solo
como metadato inerte» (`plan/CONTRATO-IMPORT-PACK-v1.md:86-87`, comentario de
`import.mjs:522`). La exención es **por ruta de clave exacta**: la misma URL en otro
campo del propio `volumes.json`, o en cualquier otro fichero, **es URL viva**
(aseverado en las dos caras, `cerco-root.test.mjs`).

**Corrección a la premisa del brief.** El brief fundaba el predicado en
`VOLUMES/volumes.json:13` (`"remotePath": "${ZEUS_FIREHOSE_REMOTE_PATH}"`) y `:59`
(`"pubUrl": "${ZEUS_SSB_PUB_URL}"`) — abrí el fichero y **las dos líneas son
correctas tal como el brief corregido las da**. Pero esos placeholders **no llevan
esquema**, así que ni siquiera casan con el patrón: la cláusula (a) no los cubre,
los cubre de más arriba. (a) es para la forma `https://${VAR}/…`, que sí casa.
Lo declaro para que nadie herede la idea de que (a) existe por esas dos líneas.

Alcance del barrido: **todo** lo que cuelga del root, `.ops-ledger.jsonl`
(`ledger.mjs:10,19`) y `volumes.state.json` **incluidos** — viven dentro del root y
viajan en la copia A→B. Binarios (byte NUL en los primeros 8 kB) **no** se escanean
y se declaran en `binaries[]`.

---

## 2 · Los siete pasos, uno a uno

Comando único: `ZEUS_GAMES_LIBRARY=C:/S_LAB/g-sdk node e2e/local-first-ca.mjs`.

### Paso 1 · IMPORT — **construido** (adaptador) + verificado

```
verde · adaptador: 8 ficheros hasheados, manifiesto v1 emitido
verde · el 9.º fichero (volumes/volumes.json del startpack) se descarta CON REPORTE
verde · origen intacto byte a byte (16 ficheros rehasheados)
verde · importPack ok:true noop:false · 7 pasos en steps[] · familia detectada = forces
verde · los 8 ficheros aterrizan bajo DISK_03/FORCES del root A
ROJO  · A · byte alterado en el pack → hash_no_coincide, sello del destino intacto
ROJO  · B · manifest.json original del pozo (zeus.startpack/v0) → pack_manifest_incompleto
ROJO  · C · fichero omitido de hashes → fichero_sin_enumerar
ROJO  · D · outDir dentro del startpack → destino_dentro_de_origen (cero escritura)
ROJO  · E · fichero fuera de todo volumen declarado → fichero_fuera_de_volumen
```

Verifiqué de primera mano lo que el brief daba por bueno: el startpack está en
`<gamesRoot>/packages/startpack-pozo` (**no** en `packages/pozo`, que es lo que
devuelve `gamesPaths().pozoRoot` — el runner construye la ruta desde
`resolveGamesLibraryRoot()`); su `manifest.json:2` es `zeus.startpack/v0` sin `name`
ni `hashes`; su `volumes/` tiene **9** ficheros (8 de datos + `volumes.json`); y
recalculé los 8 sha256: **coinciden byte a byte** con
`packages/engine/linea-kit/test/fixtures/forces` (prefijos: `registry.json`
`9e3d8a5a358bcb74`, `force.json` `efcc127be2da28fb`, `cota.json` `5c88eda7017acdcb`,
`cotas/sima/manifest.json` `217b33024656dedd`, `output.md` `899e50c13d823fc7`,
`prompt.md` `9f7f4f24c540e013`, `think.md` `8e91eff14ce969a6`,
`force-sample/manifest.json` `592cd38ae1d00a16`).

La **frontera dura** está aseverada, no prometida: el runner rehashea los 16 ficheros
del startpack antes y después y exige igualdad; el ROJO D comprueba además que el
adaptador **se niega** a escribir dentro y que no deja directorio.

### Paso 2 · ARRANQUE SIN RED — **construido íntegro**

```
verde · arranque real de @zeus/force-system sobre el root A con la trampa armada:
        0 violaciones · force_count=1 · cota_count=1
verde · predicado loopback: localhost/127.x/::1/omitido = permitido · 10.0.0.7 = violación
ROJO  · 1 · salida plantada → registrada por dns.lookup nombrando «ejemplo-no-loopback.invalid»
```

Los **dos** rojos que pedía el brief corregido:
- **ROJO 1** (auto-prueba): salida plantada → registrada y nombrada. Sólo demuestra
  que el instrumento dispara.
- **ROJO 2 / probe simétrica** (la que faltaba): trampa armada, **nada plantado**,
  arranque **real** de `@zeus/force-system` (`loadForcesData()` +
  `buildForcesRegistryView()`, que es lo que `start.mjs:16` hace) sobre el root A.
  Si tocara la red, el runner sale ≠0 nombrando el módulo. Salió **0 violaciones**.

### Paso 3 · NO-OP — **verificado** (etiquetado no-regresión)

```
verde · [no-regresión] noop:true · sello idéntico · bytes del manifiesto idénticos
verde · [no-regresión] cero ficheros nuevos (11 antes y después)
verde · [no-regresión] cero .import-staging* en el root
ROJO  · predicado de staging: se planta .import-staging-u206 y noStagingLeft debe cazarlo
```

Acaté la corrección: el «vector rojo» heredado (cambiar `version` manteniendo bytes)
**es tautología** de `import.mjs:109-116` + `:279-285` y pasa hoy; **retirado**. Las
tres aserciones quedan como **no-regresión, etiquetadas como tal**. El rojo genuino
que aporto es sobre el **predicado**: se planta un `.import-staging-*` y se exige que
`noStagingLeft` lo cace — un predicado que no puede fallar no prueba nada.

### Paso 4 · RÉPLICA A→B — **verificado**

```
verde · réplica por copia de bytes: 11 ficheros en B
verde · (a) hashManifest() idéntico en A y B: a852ac3e9c05754f…
verde · campos de ruta DIVERGEN por diseño y quedan fuera de la comparación:
        volumesRoot (measure.mjs:140) y absPath (measure.mjs:85)
verde · (b) measureAllVolumes() coincide en contenido: 8 ficheros · 2650 bytes ·
        corpora ["forces=5/1006","cotas=2/780"]
verde · (c) source.imported.snapshot casa con el árbol vivo en A y en B (2 unidades)
verde · el .ops-ledger.jsonl viaja en la réplica: 1 asiento de import en B
ROJO  · pathOverride inyectado en B → se resuelve contra MONOREPO_ROOT y la medida diverge
```

**Qué se compara, declarado:** por volumen `disk`, `label`, `files`, `bytes`,
`missing`; por corpus `id`, `path`, `label`, `files`, `bytes`, `missing`; y los
totales. **Qué NO:** `volumesRoot` (`measure.mjs:140`) y `absPath` (`measure.mjs:85`),
que divergen **por diseño**. Un `deepEqual` fallaría siempre. Y para que conste que
la comparación **no es trivial**, se asevera que esos dos campos **sí** difieren.

`resetVolumesCache()` entre A y B es obligatorio (`resolve.mjs:5,50` cachea) y está
centralizado en `useRoot()`.

**El vector rojo lo FABRICA el runner**: `pathOverride` no lo escribe nadie en todo
el árbol; el schema lo admite por `additionalProperties`. Se inyecta a mano, se
asevera que la ruta resultante (i) queda anclada a `MONOREPO_ROOT`
(`resolve.mjs:109-110`), (ii) queda **fuera** de B, y (iii) la medida diverge; y se
restauran los bytes exactos del manifiesto de B.

### Paso 5 · DIVERGENCIA — **verificado**, con el contraste obligatorio

```
verde · root C: pack LINEAS importado, familia detectada por firma (registry.yaml)
verde · LINEAS · divergencia reportada {path:demo/nodos/N01/meta.json,
        kind:contenido_distinto} y destino INTACTO
verde · LINEAS · curación protegida {path:…/registro.md, kind:curacion_protegida}
        y bytes intactos
verde · CONTRASTE FORCES · el MISMO escenario da colision_force que aborta en el pase
        dry (unidad forces/force-sample) — cero divergencia, root intacto
ROJO  · sin tocar el destino, divergencias = 0 (el reporte de divergencia no es un adorno)
```

Las dos conductas aseveradas: **la diferencia ES la regla de familia**.

### Paso 6 · CORRUPCIÓN — **construido íntegro**

```
verde · root íntegro → verifyRootIntegrity ok:true (8 checks, 0 omitidos declarados)
verde · contraste: ante la MISMA corrupción, validateVolumesTree() devuelve ok:true
        (valida schemas, no hashes) — el paso 6 no era verificación, era construcción
ROJO  · a · un byte de think.md → unidad_corrupta,corpus_desviado · arranque abortado
ROJO  · b · registry.json roto contra su schema → familia_invalida · arranque abortado
ROJO  · c · volumes.json editado a mano → sello_roto,estado_desfasado · arranque abortado
```

**Vive en `packages/engine/volumes-ops/src/verify.mjs`**, no en `e2e/` (decisión
⑧-bis.2): en el runner el CA pasaría y el producto seguiría desprotegido.

En los tres casos **el root no arranca a medias**: `assertRootIntegrity()` lanza.

**La medida de qué se construyó:** `node e2e/local-first-ca.mjs --legado` exige a la
maquinaria anterior lo mismo y **sale exit 1** con el mensaje
`validateVolumesTree() da ok:true ante una escena .md corrompida — valida contra
SCHEMAS, no contra hashes (linea-kit/src/validate.mjs:187-213)`.

El leg fuerte del caso (c) es **`sello_vs_ledger`**, no el estado: el sello anotado en
`volumes.state.json` **se re-anota en silencio** al medir (`counters.mjs:39-40` →
`state.mjs:128-130`) y al sincronizar (`state.mjs:99` + `:106`) — **las dos vías**.
El test `verify-integrity.test.mjs` lo asevera: tras `syncVolumeCounters()` el leg de
estado se pone verde y **el de ledger sigue rojo**.

### Paso 7 · CERCO — **construido** (lado root; el lado pack ya existía)

```
verde · root A: 11 ficheros barridos · symlinks=0 · node_modules=0 · identidad=0 ·
        urlsVivas=0 · binarios no escaneados=0
verde · root B: ídem
verde · .ops-ledger.jsonl y volumes.state.json entran en el barrido
verde · exención por contrato: source.imported.origin está en volumes.json y NO se marca
verde · tras el vector rojo, el cerco de B vuelve a 0 hallazgos
ROJO  · B con secret.txt + enlace + URL viva → los tres salen NOMBRADOS y el gate aborta
```

La denylist de identidad **se importa** de `import.mjs` (`IDENTITY_DENYLIST`, ahora
exportada sin cambiar un carácter) en vez de copiarse: una segunda copia es una
juntura por la que se cuela lo que se añada en la otra.

---

## 3 · Qué construí y qué sólo verifiqué

| pieza | |
|---|---|
| `src/pack-adapter.mjs` | **construido** — startpack → pack v1, fuente solo lectura |
| `src/verify.mjs` | **construido** — verificador de integridad (paso 6) |
| `src/cerco.mjs` | **construido** — cerco del root (paso 7) |
| `e2e/net-trap.mjs` | **construido** — trampa de red (paso 2) |
| `e2e/local-first-ca.mjs` | **construido** — el arnés de los 7 pasos |
| `src/boot.mjs` (ronda 2) | **construido** — guardián de arranque: punto ÚNICO por el que los servicios llaman a los dos verificadores |
| 4 puntos de `mesh/**` (ronda 2) | **cableados** al guardián · 1 enrutado con motivo (§8.1) |
| `import.mjs` · `driver-forces.mjs` | **sólo export añadido**, cero cambio de cuerpo |
| pasos 1, 3, 4, 5 | **verificados** sobre maquinaria existente |

Dos exports aditivos, con motivo escrito en el propio código: `IDENTITY_DENYLIST`
(`import.mjs`) y `hashUnitTree` (`driver-forces.mjs`, antes `hashTree` privada; el
cuerpo no cambió, se conserva el alias interno). Ambos existen para **no duplicar** un
criterio entre dos módulos.

---

## 4 · Hallazgos (el defecto vive en la juntura)

**H1 · Pérdida silenciosa de datos en `importPack`.** Un fichero del pack que no cae
bajo el `path` de ningún volumen declarado se copia al staging, **pasa** la
verificación de hash (`import.mjs:191-204`), **no lo cubre ningún plan de fusión**
(`volumeFilesById` sólo recoge lo que empieza por `vol.path/`, `:243-247`) y
**desaparece** al borrarse el staging en el `finally` (`:593`) — con `importPack`
devolviendo **`ok:true`**. Reproducible: pack con `volumes/DISK_09/huerfano.json` y
sólo `forces` declarado.
**Qué hice:** guarda fail-closed en el adaptador (`fichero_fuera_de_volumen`, ROJO E).
**Qué NO hice:** parchear `import.mjs`. Cerraría el agujero en la raíz, pero cambia
el contrato observable de U201 (aceptado) y no es mi WP. **Propuesta con dueño: WP
nuevo** — añadir la misma guarda tras `:275`, es una comprobación de conjuntos.

**H2 · El no-op es ciego a la corrupción del destino.** La puerta de no-op se decide
por el **sello del manifiesto** (`import.mjs:279-285`), no por el estado del árbol.
Con un fichero del destino ya corrompido, reimportar el **mismo** pack devuelve
`noop:true` y no mira nada. Queda registrado como evidencia en el paso 5
(`noopCiegoALaCorrupcion`) y **es exactamente lo que justifica el paso 6**: sin el
verificador, la única señal que un operador tiene es un `noop:true` tranquilizador.
No lo asevero como bug (asevero la mitigación: el verificador lo caza), para que
arreglarlo no ponga el CA en rojo.

**H3 · Un gate que barre una ruta inexistente concedía en verde.** Lo cacé ejecutando
el runner **sin** `ZEUS_GAMES_LIBRARY`: los roots quedaban nulos y `scanRootCerco`
devolvía `ok:true` con 0 hallazgos sobre la nada. Arreglado en `src/cerco.mjs`
(`root_no_encontrado`) y en el runner (`useRoot()` rechaza root no-cadena; el paso 1
en rojo aborta la cascada). Es el modo de fallo más caro de un gate.

**H4 · Mi propia exención era más ancha que su enunciado.** La primera versión del
cerco exentaba la URL de origen **por valor**, no por ruta de clave: la misma cadena
bajo cualquier otra clave quedaba exenta de rebote. Lo cazó el test que escribí para
el límite de la exención. Reimplementado recorriendo el JSON por ruta de clave
(`scanManifestUrls`). Es literalmente el defecto que el brief avisaba: *afirmación de
alcance más ancha que la evidencia*, esta vez mía.

**H5 · Un root LINEAS no pasa hoy el predicado «0 URLs vivas».** La fixture canónica
lleva `"urls": { "revision": "https://example.test/w/index.php?oldid=2" }` en
`packages/engine/linea-kit/test/fixtures/lineas/demo/wp/historia/manifest.json:27` y
`:40`. Son **URLs de procedencia registrada**, no anclas de arranque, y el predicado
tal como está escrito **no las distingue**. Fuera del alcance del paso 7 (que es A y
B, shape declarada), pero **el runner las barre e informa**. Para el siguiente: o el
contrato declara `urls.revision` procedencia inerte —como ya hace con
`source.imported.origin`— o un root LINEAS nunca pasará el cerco.

---

## 5 · Lo que NO cubrí, y por qué

### 5.0 · Los dos pasos que están medidos sobre TERRENO ELEGIDO

Con todas las letras, porque es la frontera real de este WP:

- **El criterio «cerco limpio» sólo está demostrado para UNA familia.** El runner
  itera **sólo los dos roots FORCES** (A y B); el root LINEAS se barre **sin
  aserción**, como nota informativa. Está declarado tres veces y con fichero y clave,
  así que es honesto — pero no debe leerse como «el cerco está probado». No lo está
  para LINEAS ni para FIREHOSE.
- **El paso 6 sólo demuestra DETECCIÓN en FORCES.** LINEAS no sella snapshot y
  FIREHOSE sella otra forma, así que una corrupción equivalente en esas familias pasa
  los tres legs sin una queja. Está declarado en el código (`SNAPSHOT_VERIFIERS`,
  leg `omitido` con motivo), pero sube aquí porque **es la mitad del parque**: de las
  cuatro familias registradas, el verificador de corrupción cubre una.
- **Snapshot verificable sólo en FORCES.** FIREHOSE sella otra forma
  (`{unit:'at-uri', units, unitsSha256}`, `driver-firehose.mjs:660-663`) y LINEAS no
  sella nada. Familia sin verificador → leg `omitido` **con motivo**; nunca adivino el
  algoritmo. `strictSnapshot:true` lo convierte en hallazgo.
- **`registry.json` editado de forma schema-válida no se detecta.** No está bajo
  ninguna unidad del snapshot ni bajo ningún corpus; sólo lo cubre el validador de
  familia, o sea el schema.
- **El ledger es append-only por convención**, no a prueba de manipulación: protege
  contra deriva y corrupción accidental, no contra escritura adversaria en el root.
- **Volumen `ssb`**: no entra (decisión ⑧-bis.3). Con U205 el registro tiene **cuatro**
  drivers (`drivers.mjs:20-25`, el brief decía tres); comprobé que no reclasifica: el
  volumen del startpack lleva `registry.json`, y FORCES se consulta antes que FIREHOSE
  y SSB en el orden de inserción.
- **No toqué** `resolve.mjs`, `curation.mjs`, `driver-lineas.mjs`, `VOLUMES/**`,
  `package.json` de la raíz ni `.github/workflows/`.
- **Sin medidas de tiempo ni cota** del runner más allá de que corre en segundos.

---

## 6 · Suites y gates

| suite | resultado |
|---|---|
| `@zeus/volumes-ops` (`node --test test/*.test.mjs`) | **125 tests · 123 pass · 0 fail · 2 skipped** (base: 104 · 102 · 0 · 2 → **+21 nuevos, todos verdes**) |
| `@zeus/linea-kit` | 43 · 43 pass · 0 fail |
| `@zeus/presets-sdk` | 55 · 55 pass · 0 fail |
| `@zeus/force-system` | 2 · 2 pass · 0 fail **con `ZEUS_VOLUMES_ROOT` puesto** |
| `npm run lint` | **0 errores**, 18 warnings — todos preexistentes y fuera de mi diff |
| `node scripts/gates/run.mjs` | **OK (0 offenders)** · exit 0 |
| `node e2e/local-first-ca.mjs` | **7/7 verdes, 13 rojos, exit 0** |

Los 2 skipped de volumes-ops son los mismos de la base.

**`@zeus/force-system` sin `ZEUS_VOLUMES_ROOT` falla** con
`VOLUMES root required (ZEUS_VOLUMES_ROOT or repo VOLUMES/)` — es **precondición de
entorno, preexistente**, no regresión: no toco `mesh/` y con la variable puesta pasa.

**CA-9 · `two-games`.** El gate sale **0 offenders**. Los tres offenders heredados
(`curation.mjs:56`, `:68`, `driver-lineas.mjs:21`) **ya estaban cerrados en la base
`28397b8`** — verificado: cero coincidencias de `GAME_EXCLUSIVE_RE` en esos ficheros
y `git diff 28397b8` vacío para ambos. **U202-B2 no lo cerré yo.**
Sí cacé y cerré **un offender nuevo mío**: `pack-adapter.mjs:5` nombraba el juego en
su docstring. Reescrito en agnóstico —que es lo correcto: el adaptador **es** genérico,
recibe la raíz y la declaración de volúmenes y no sabe de qué juego viene—; el caso
concreto vive en `e2e/` (exento por `scan.mjs:302`) y aquí.

**Higiene.** `packages/engine/{feed-kit,linea-kit,playbook-kit}/bin/*.mjs` aparecen
como `M` en `git status`: blob y modo **idénticos** (`git status --porcelain=v2`
muestra el mismo hash y `100644` a los dos lados). Es la caché de `stat` invalidada
por `npm ci`, **no una edición**. No van al commit.

---

## 7 · Lo que le dejo al siguiente

1. ~~**Cablear `assertRootIntegrity()` en el arranque real.**~~ **HECHO en la ronda 2**
   (decisión ⑩), y con él `assertRootCerco`, que estaba igual de suelto y la ronda 1
   **no declaró** — ver §8.1. Cuatro puntos cableados, uno enrutado con motivo.
   Lo que queda vivo aquí es el **estatuto del cerco**: reporta, no manda, hasta que
   se decida H5.
2. **Cerrar H1 en `import.mjs`** (pérdida silenciosa de ficheros fuera de volumen).
   Guarda de conjuntos tras `:275`; mi adaptador sólo tapa la vía que yo abro.
3. **Decidir sobre H5**: declarar `urls.revision` procedencia inerte en el contrato, o
   asumir que un root LINEAS no pasa el cerco.
4. **Generalizar el verificador de snapshot por familia** (hoy sólo FORCES) — encaja
   con la generalización de drivers; `SNAPSHOT_VERIFIERS` en `verify.mjs` es el punto
   de extensión y ya falla-cerrado ante formas que no conoce.
5. **Promover el runner a gate de CI**: yo entrego `node e2e/local-first-ca.mjs`
   (exit 0/≠0, sin estado previo); el workflow es de otro dueño. **Propongo** además
   un script `"e2e:local-first": "node e2e/local-first-ca.mjs"` en el `package.json`
   de la raíz — **no lo añado, no soy su owner**.
6. **Reconciliación de productores de descriptor**: si el mundo hermano entrega el
   suyo, habrá **dos** (el suyo y este adaptador). Está anotado en `DECISIONES.md`
   como reencuadre; que no parezca un accidente ese día.
7. **`e2e/feed-families-demo.mjs` sigue rojo, pero NO por donde el backlog dice.** El
   backlog lo describe como «arreglo conocido de una línea de semilla» en `:65`. Lo
   ejecuté: en Windows **nunca llega a la línea 65**. Muere en **`:26`**,
   `await import(gamesPaths().pozoDomain)`, con
   `ERR_UNSUPPORTED_ESM_URL_SCHEME: … Received protocol 'c:'` — el loader ESM exige
   `file://` para rutas absolutas de Windows y ahí se le pasa una ruta cruda; falta un
   `pathToFileURL()`. El arreglo de la semilla puede ser cierto **además**, pero no es
   lo que lo tiene rojo hoy en esta plataforma. **No lo toqué**: es un fichero
   **existente** y mi ALCANCE_DIFF sólo me da ficheros **nuevos** en `e2e/`. Queda con
   el mismo dueño, con el diagnóstico corregido.

---

## 8 · RONDA 2 · cableado, dos bloqueantes y cuatro menores

### 8.1 · CABLEADO (decisión ⑩) — los gates entran al camino del producto

Antes de esta ronda, **`verifyRootIntegrity` y `scanRootCerco` tenían CERO llamadas de
producción**. Mi reporte de la ronda 1 declaraba sólo la primera mitad («nadie llama a
`assertRootIntegrity()`»); **`assertRootCerco` estaba igual de suelto y no lo dije**
(m5). Era alcance declarado más estrecho que el problema — el mismo pecado que este WP
persigue, por el otro lado. Queda dicho.

**Un punto único, no cinco copias:** `packages/engine/volumes-ops/src/boot.mjs` ·
`assertVolumesRootBootable()`. Los servicios **llaman**; no se replica el verificador.

| punto | qué se hizo |
|---|---|
| `mesh/force-system/src/start.mjs:17` | **CABLEADO**, antes de `loadForcesData` |
| `mesh/ssb-system/src/start.mjs:16` | **CABLEADO**, antes de resolver y leer |
| `mesh/linea-system/src/start.mjs:28` | **CABLEADO**, con limitación declarada (abajo) |
| `mesh/firehose-browser/src/server.mjs:64` | **CABLEADO** dentro de `createFirehoseServer`, **antes del `listen`** de `:180` — la comprobación que había (`resolveVolume` tras el listen) miraba el volumen con el servidor **ya sirviendo** |
| `mesh/cache-browser/src/server.mjs:66` | **ENRUTADO, no cableado** |

**Por qué cache-browser se enruta y no se cabla** (verificado, no supuesto): **no
consume un volumes root**. `grep -rn "resolveVolume|ZEUS_VOLUMES_ROOT|volumes"
packages/mesh/cache-browser/src/*.mjs` → **cero coincidencias**. Su `resolveBasePath`
sale de `@zeus/app-shell` vía `createAppConfig` (`cache-browser/src/config.mjs:10,14`),
que es configuración de app, no el resolvedor canónico. Meter ahí un guardián de
volumes root sería teatro. **Para su dueño: si cache-browser debe consumir un volumes
root, el punto es `server.mjs:66` y le falta antes la dependencia.**

**Limitación declarada, no forzada — linea-system.** `linea-system/src/loader.mjs:28`
(`export const DEFAULT_BASE_PATH = resolveLineasBasePath()`) resuelve **en tiempo de
import de módulo**, o sea antes que cualquier guarda de arranque. Consecuencia exacta:
para un root **ausente o no resoluble**, la guarda **llega tarde** — el import ya habrá
lanzado. Lo que sí protege, que es lo que persigue este WP, es el root **presente pero
corrupto**, porque la lectura de datos ocurre en `startAll` (`:28`), después.

**Estatuto de cada mitad, con la medición que lo justifica.** No son iguales, y
fingir que sí lo son habría sido el teatro contrario:

- **Integridad = FATAL.** Medida contra el root de referencia del monorepo
  (`VOLUMES/`): **`ok:true`** (todos los legs de volumen en `omitido` honesto porque
  nada fue importado). Cablearla como fatal no rompe nada y ataja lo que importa.
- **Cerco = SE EJECUTA Y SE REPORTA SIEMPRE; aborta sólo con
  `ZEUS_VOLUMES_CERCO=strict`.** Medido contra el MISMO root de referencia:
  **`ok:false`, 3 hallazgos** — `DISK_02/LINEAS/demo/wp/historia/manifest.json:27` y
  `:40` (`urls.revision`) y **`VOLUMES/README.md:5`** (URL de repositorio en la
  documentación del root). **Ninguno es un ancla de arranque.** Hacerlo fatal hoy
  **negaría el arranque a todos los servicios del monorepo**: sería un gate que no
  protege, sino que impide. El interruptor queda puesto y documentado para el día que
  el contrato decida sobre `urls.revision` (H5).

**El paso 6 ya no se conforma con que lance una función.** Ahora invoca
`startAll()` de `@zeus/force-system` —el mismo camino que `npm run start:forces`— y
exige que **el servicio real se niegue a arrancar** en los tres casos de corrupción, y
que **arranque** con el root sano (servidor MCP levantado en puerto efímero y cerrado).

### 8.2 · BLOQUEANTE 1 — la trampa de red no veía la vía más común

Reproducido con las mediciones del coordinador antes de tocar nada. La premisa del
comentario («`http`, `https`, `tls` y undici acaban en `Socket.prototype.connect`») era
**cierta**; la conclusión, **falsa**: `net.connect()/createConnection()` normalizan y
llaman `connect([options, cb])` con un **Array**. Como `typeof [] === 'object'`, el
parche leía `.host` de un Array → `undefined` → «host omitido → localhost» →
**anotado como PERMITIDO**.

| vía (destino 203.0.113.7) | antes | ahora |
|---|---|---|
| `new net.Socket().connect({host,port})` | cazado | cazado |
| `net.createConnection({host,port})` | **EVADÍA** | cazado |
| `http.request({host: IP})` | **EVADÍA** | cazado |
| `https.request({host: IP})` | cazado | cazado |
| `dns.resolve4` | **EVADÍA** | cazado |
| `new dns.Resolver().resolve4` | **EVADÍA** | cazado |
| `dns.lookup` | cazado | cazado |

**El eslabón que lo explica, y la lección:** el ROJO 1 sólo ejercitaba `dns.lookup`.
**La puerta `connect` no se probaba en rojo jamás**, así que el verde «0 violaciones»
no podía distinguir «no salió» de «salió por http y no lo vi». Ahora el ROJO 1
**ejercita las seis vías, una a una**, y cada una debe registrarse por su puerta.

Arreglos: normalización del Array antes de leer `typeof`; instrumentación de toda la
familia `resolve*`/`reverse` en `dns`, `dns.promises`, `dns.Resolver.prototype` y
`dns.promises.Resolver.prototype`.

**Re-medido el arranque real con el instrumento arreglado** (el 0 anterior no estaba
probado): `startAll()` de force-system, servidor MCP levantado y cerrado →
**0 violaciones**. Ese 0 ya significa algo.

### 8.3 · BLOQUEANTE 2 — el cerco concedía sobre lo que no era un root

Mi H3 cerró la **inexistencia**; la **vacuidad** seguía abierta: un directorio vacío —o
uno cualquiera sin manifiesto— daba `ok:true · files:0 · findings:0` y `assertRootCerco`
no lanzaba. Y el paso 7 usa el **root explícito**, que es justo la vía que esquiva el
resolvedor canónico. Es exactamente la clase que yo mismo nombro como «el modo de fallo
más caro de un gate».

Arreglado: `root_sin_manifiesto`. El manifiesto es la **firma de identidad** de un root
(U199: sin él, el root no es operable), así que es el predicado correcto — no un
chequeo inventado para el caso.

### 8.4 · Menores

- **m3** · `URL_LITERAL_RE` ahora es **insensible a mayúsculas**: `HTTPS://EJEMPLO.TEST`
  se detecta. El módulo aplicaba dos varas (la denylist de identidad sí era insensible).
- **m4** · **los binarios ya no tienen salvoconducto**: se escanean como `latin1`, así
  que una URL viva tras un byte NUL **produce hallazgo**. `binaries[]` queda como
  clasificación informativa, no como exención. Declarar no es proteger.
- **m5** · dicho arriba (§8.1) y corregido en §5/§7.
- **m6** · **borrar el ledger ya no apaga la comprobación**. Antes, sin fichero de
  asientos el leg pasaba a `omitido` — o sea que **borrar el ledger degradaba el caso
  (c) del paso 6 de rojo a verde**. Ahora, si el manifiesto declara volúmenes
  importados y no hay asiento, es hallazgo `ledger_ausente`. Un root nunca importado
  sigue omitiendo, sin falso positivo (las dos caras, con test).

### 8.5 · Hallazgo nuevo de esta ronda

Correr las suites de `mesh/` destapó que **dos ficheros míos de la ronda 1 rompían un
gate de otro paquete** que yo no había ejecutado: `ssb-system/test/export.test.mjs:422`
mantiene una ALLOWLIST de escritores de manifiesto, razonada uno a uno. El reparto
honesto, tras abrir los dos ficheros:

- `volumes-ops/src/pack-adapter.mjs` — **falso positivo por prosa**: el único disparo
  era el nombre del manifiesto entrecomillado en un comentario; sus escrituras van a
  `<packRoot>/manifest.json` y a copias de datos, **nunca a un manifiesto de root**.
  Arreglado **en el origen** (reescrito el comentario), sin tocar la allowlist ajena.
- `e2e/local-first-ca.mjs` — **escritor real y legítimo**: siembra roots temporales y
  edita manifiestos a mano en sus vectores rojos. Añadido a la ALLOWLIST **con su
  razón**, que es el flujo que el propio test define. Relajar el probe habría sido el
  arreglo equivocado, y el test lo dice por escrito.

### 8.6 · Suites de la ronda 2

| suite | resultado |
|---|---|
| `@zeus/volumes-ops` | **133 · 131 pass · 0 fail · 2 skip** (ronda 1: 125/123; **+8 nuevos**) |
| `@zeus/ssb-system` | 27 · 27 pass · 0 fail (con la entrada de allowlist) |
| `@zeus/force-system` | 2 · 2 pass |
| `@zeus/linea-system` | 2 · 0 pass · **2 skip preexistentes y autodeclarados** (`VOLUMES/DISK_02/LINEAS` id:espana no está en el repo) |
| `@zeus/firehose-browser` | 5 · 5 pass (también **sin** `ZEUS_VOLUMES_ROOT`: no empeoré su arranque) |
| `@zeus/cache-browser` | 4 · 4 pass |
| `@zeus/linea-kit` · `@zeus/presets-sdk` | 43/43 · 55/55 |
| `npm run lint` | 0 errores, 18 warnings preexistentes |
| `node scripts/gates/run.mjs` | **OK (0 offenders)** |
| runner | **7/7 verdes, exit 0** · `--legado` exit 1 |

**Lock:** `npm install --package-lock-only` tras declarar `@zeus/volumes-ops` en los
cuatro paquetes cableados → **diff de exactamente 4 inserciones, las cuatro
declaraciones. CERO movimientos de versión.**

### 8.7 · Lo que sigue abierto tras esta ronda

1. **Decidir sobre H5** (`urls.revision` = procedencia inerte, ¿sí o no?). De eso
   depende poder poner `ZEUS_VOLUMES_CERCO=strict` por defecto. Mientras no se decida,
   el cerco reporta pero no manda.
2. **Verificador de snapshot para LINEAS y FIREHOSE** — hoy el paso 6 cubre una de
   cuatro familias.
3. **`cache-browser`**: decidir si debe consumir un volumes root (`server.mjs:66`).
4. Siguen vivos H1 (pérdida silenciosa en `importPack`) y los puntos 5-7 de §7.
