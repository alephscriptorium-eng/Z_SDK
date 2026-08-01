# WP-U206 · CA local-first + réplica A→B

**Rama** `wp/u206-ca-local-first` · **base** `28397b8` · 8.º y último eslabón del carril D.

**Entregable:** `node e2e/local-first-ca.mjs` → **7/7 pasos verdes, exit 0, 13 vectores
rojos comprobados**. Raíces temporales (`mkdtempSync`), sin estado previo,
re-ejecutable por un tercero (ejecutado dos veces seguidas: exit 0 las dos, cero
temporales huérfanos).

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

- **`packages/mesh/force-system` no llama a `assertRootIntegrity()`.** El gate existe
  y está probado, pero **no está cableado en el arranque del producto**: `mesh/` no
  está en mi ALCANCE_DIFF. Lo demuestro desde el runner. **Es el primer encargo del
  siguiente.**
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

1. **Cablear `assertRootIntegrity()` en el arranque real** (`force-system`, y el resto
   de servicios que montan sobre un volumes root). Hoy el gate existe y nadie lo
   llama: el CA lo demuestra, el producto aún no lo usa. **Es lo más importante.**
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
