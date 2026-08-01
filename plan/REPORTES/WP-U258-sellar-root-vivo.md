# WP-U258 · El root vivo deja de pasar de largo por la guarda — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U258) |
| fecha | 2026-08-01 |
| rama | `wp/u258-sellar-root-vivo` · base `822e13e` |
| commit | `1a025b8` (obra) |
| alcance tocado | `VOLUMES/volumes.json` · `VOLUMES/.ops-ledger.jsonl` (alta) · `packages/engine/volumes-ops/src/{import,verify}.mjs` · `packages/engine/volumes-ops/test/{verify-integrity,import-lineas-driver}.test.mjs` + `sello-root-referencia.test.mjs` (alta) · `scripts/sello-root.mjs` (alta) · `.github/workflows/ci.yml` · `.gitignore` · `.gitattributes` (alta) · este reporte · fila U258 de `BACKLOG.md` |
| **fuera de ALCANCE_DIFF y lo declaro** | `.gitignore` y `.gitattributes` — §6. Sin los dos, la obra **no arranca en un clon limpio**; están medidos, no supuestos |
| `packages/mesh/**` · `package.json` · lockfile · `packages/engine/presets-sdk/**` | **ninguno** |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge · sin `git stash` · sin `npx` · `npm ci` (no `install`) |

**[banco]** = medido en este worktree Windows.
**[clon]** = medido sobre `git archive HEAD | tar -x`, o sea **los bytes exactos que
recibe un checkout de CI**, no el árbol de trabajo. Nada mezclado.

---

## CA de cierre, término a término

| lo pedido | cómo queda |
| --- | --- |
| root de referencia sellado | **sí** · 13 ficheros, 2 volúmenes, **0 datos movidos** (§3). `firehose` y `ssb` **no** se sellan y §5 dice por qué, con la medida del precio de hacerlo |
| la sonda de tres vectores en ROJO sobre él | **sí, y ampliada a seis vectores de dato** para no elegir yo el fichero cómodo: **13/13 ficheros sellados** niegan el arranque al alterarlos (§2) |
| `npm run start:*` sigue arrancando | **3 de 4 arrancan; el 4.º falla IGUAL antes y después** y no por la guarda — `linea-system` pide la línea `espana`, que el `.gitignore` prohíbe que llegue a git. Medido en las dos direcciones (§4) |
| el precio de la vía descartada | §7 |
| quién puede escribir el manifiesto | §8 — censo del repo entero: **6 ficheros marcados, 1 escritor legítimo**, y comprobado por EFECTO sobre este mismo root que medir y sincronizar no lo tocan |
| qué queda sin sellar | §5 |
| vigilancia en CI con su vector rojo | §9 — un test que corre en la matriz + un job que comprueba lo único que solo un checkout demuestra |

---

## 1 · El diagnóstico, reproducido antes de tocar nada

Sonda propia, por el **camino del producto** (`assertVolumesRootBootable` con los
mismos `volumeIds` que cablea cada punto de arranque), sobre **copias** del root
de referencia. Los cuatro puntos, verificados abriendo el fichero:

| servicio | `volumeIds` | llamada |
| --- | --- | --- |
| `forces-system` | `['forces']` | `packages/mesh/force-system/src/start.mjs:19` |
| `linea-system` | `['lineas']` | `packages/mesh/linea-system/src/start.mjs:35` |
| `firehose-browser` | `['firehose']` | `packages/mesh/firehose-browser/src/server.mjs:68` |
| `ssb-system` | `['ssb']` | `packages/mesh/ssb-system/src/start.mjs:17` |

**ANTES** [banco] — base `822e13e`, root sin sellar:

```
vector                                        forces   linea    firehose  ssb
CONTROL root sano                             ARRANCA  ARRANCA  ARRANCA   ARRANCA
dato alterado · FORCES think.md               ARRANCA  ARRANCA  ARRANCA   ARRANCA
dato alterado · FORCES force.json             ARRANCA  ARRANCA  ARRANCA   ARRANCA
dato alterado · FORCES registry.json          ARRANCA  ARRANCA  ARRANCA   ARRANCA
dato alterado · LINEAS nodo-sections.json     ARRANCA  ARRANCA  ARRANCA   ARRANCA
dato alterado · LINEAS registry.yaml          ARRANCA  ARRANCA  ARRANCA   ARRANCA
manifiesto editado a mano                     ARRANCA  ARRANCA  ARRANCA   ARRANCA
manifiesto AUSENTE                            SE NIEGA SE NIEGA SE NIEGA  SE NIEGA
```

Confirmado término a término lo que midió el orquestador, y confirmado además que
la única negativa (`manifiesto: manifiesto_ausente`) es **el fail-closed viejo de
U199**, no la guarda de U206.

Las cuatro alteraciones de datos «que siguen siendo válidas» son deliberadas: cambian
un valor sin romper ningún schema, así que el leg `familia` —la única cobertura que
había para LINEAS y para los dos índices— las deja pasar por diseño.

---

## 2 · DESPUÉS — la sonda en rojo

**[clon]** — extraído con `git archive HEAD | tar -x`, es decir los bytes del commit,
que es lo que recibe CI:

```
vector                                        forces   linea    firehose  ssb
CONTROL root sano                             ARRANCA  ARRANCA  ARRANCA   ARRANCA
dato alterado · FORCES think.md               SE NIEGA ARRANCA  ARRANCA   ARRANCA
dato alterado · FORCES force.json             SE NIEGA ARRANCA  ARRANCA   ARRANCA
dato alterado · FORCES registry.json          SE NIEGA ARRANCA  ARRANCA   ARRANCA
dato alterado · LINEAS nodo-sections.json     ARRANCA  SE NIEGA ARRANCA   ARRANCA
dato alterado · LINEAS registry.yaml          ARRANCA  SE NIEGA ARRANCA   ARRANCA
manifiesto editado a mano                     SE NIEGA SE NIEGA SE NIEGA  SE NIEGA
manifiesto AUSENTE                            SE NIEGA SE NIEGA SE NIEGA  SE NIEGA
ledger AUSENTE                                SE NIEGA SE NIEGA SE NIEGA  SE NIEGA
```

Motivos, literales:

```
[FORCES think.md]        ficheros[forces]: fichero_corrupto · snapshot[forces]: unidad_corrupta
[FORCES force.json]      ficheros[forces]: fichero_corrupto · snapshot[forces]: unidad_corrupta
[FORCES registry.json]   ficheros[forces]: fichero_corrupto
[LINEAS nodo-sections]   ficheros[lineas]: fichero_corrupto
[LINEAS registry.yaml]   ficheros[lineas]: fichero_corrupto
[manifiesto a mano]      sello_vs_ledger: sello_roto
[ledger ausente]         sello_vs_ledger: ledger_ausente
```

**La diagonal no es un hueco, es el diseño que ya estaba**: la guarda se acota por
`volumeIds` en cada punto de arranque (`boot.mjs:58-67`), así que corromper FORCES
tumba a `forces-system` y **no** a `ssb-system`. Cambiar eso es tocar el cableado de
`packages/mesh/**`, que este WP tiene prohibido — y además sería peor: un servicio
no debe caerse por un volumen que no usa.

**Lo que sí cubre a los cuatro** es el sello del root: editar el manifiesto a mano
—o perder el ledger— niega el arranque **también** a `firehose-browser` y a
`ssb-system`, cuyos volúmenes no tienen árbol y por tanto no se sellan. Antes de
este WP esos dos servicios no tenían **ninguna** cobertura salvo la ausencia del
manifiesto.

La vigilancia no se queda en estos seis ficheros elegidos por mí: recorre **los 13
sellados, uno a uno** (§9).

---

## 3 · La vía elegida: sellar por la vía legítima, y qué se sella exactamente

`scripts/sello-root.mjs` construye un pack v1 del árbol vivo (`buildPackFromStartpack`,
que trata la fuente como **solo lectura**) y lo importa sobre el propio root.
**No escribe nada por su cuenta**: el manifiesto lo reescribe `sealManifest`, único
escritor legítimo desde U199/U201.

```
$ ZEUS_VOLUMES_ROOT=./VOLUMES node scripts/sello-root.mjs
  · firehose: NO se sella — directorio_ausente (DISK_01/FIREHOSE)
  · ssb: NO se sella — directorio_ausente (DISK_04/SSB)
pack construido: 13 fichero(s), 2 volumen(es)
  · descartado del pack: README.md (manifiesto_de_root)
  · descartado del pack: volumes.json (manifiesto_de_root)
FUSIONAR: 0 fichero(s) movido(s) — un sello no mueve datos, anota
SELLAR:   a4a4b183b909… → 70c036e00d59…
  · lineas: 5 hash(es) sellado(s)
  · forces: 8 hash(es) sellado(s)
ledger: asiento #1
```

**`moved: 0`** importa: el sellado del root es una anotación, no una migración de
datos. Y es **idempotente** — volver a correrlo cae en el NO-OP del contrato
(`import.mjs` §6) y no reescribe ni manifiesto ni ledger (medido).

### 3.1 · Qué se sella (la pregunta del WP, contestada)

La vía 1 «a secas» **no habría bastado**, y está medido: el import solo aporta
`source.imported.snapshot` en FORCES (el driver de LINEAS no sella nada,
`driver-lineas.mjs:193`). Con eso, de los seis vectores de dato **tres seguirían
verdes**: `FORCES/registry.json` (fuera de toda unidad) y los dos de LINEAS. Cerrar
el WP dejando el 50 % de los vectores en verde no es cerrarlo.

Así que el paso SELLAR ancla también **contenido**, no solo procedencia:

```
source.imported.hashes = { "<rutaPosix>": "<sha256 de lo que ATERRIZÓ>" }
```

- **Recomputado del DESTINO tras FUSIONAR, jamás copiado de `pack.hashes`.** La
  familia LINEAS conserva el fichero del destino cuando diverge
  (`driver-lineas.mjs:184`) y **nunca** pisa un `.md` curado (`:169`). Sellar el hash
  del pack sería sellar una mentira: el manifiesto anotaría un contenido que su
  propio árbol no tiene, y el root dejaría de arrancar **por haber importado bien**.
  Dos tests nuevos lo fijan (`import-lineas-driver.test.mjs`), uno por regla.
- **Verificado con la MISMA primitiva** que lo selló: `sha256File` se exporta de
  `import.mjs` y `verify.mjs` la importa. Mismo patrón que `IDENTITY_DENYLIST` y
  `hashUnitTree` en U206: una segunda copia de la línea es una juntura por la que se
  cuela cualquier divergencia futura.
- Leg nuevo `ficheros` en `verify.mjs` (entre `volumen` y `snapshot`); errores
  `fichero_corrupto` y `fichero_ausente`. **Sin sello, omitido honesto con motivo**
  (`sin_hashes_sellados`) — un root sellado por una versión anterior no obtiene un
  verde inventado.

Reporte del root real, leg a leg:

```
ok=true
  VERDE manifiesto · sello_vs_ledger · sello_vs_estado
  VERDE volumen[lineas] · ficheros[lineas] files=5 · familia[lineas]
  VERDE volumen[forces] · ficheros[forces] files=8 · snapshot[forces] units=2 · familia[forces]
  omitido volumen[firehose] — sin_procedencia_de_import
  omitido volumen[ssb]      — sin_procedencia_de_import
  omitido snapshot[lineas]  — sin_snapshot_sellado
  omitido corpora[lineas]   — sin_corpora_sellados
  omitido corpora[forces]   — sin_corpora_sellados
```

### 3.2 · El verificador no se ablandó — se le añadió un leg

Cero cambios que hagan pasar algo que antes se rechazaba. El diff de `verify.mjs`
es: un leg nuevo que **añade** hallazgos, un `import`, y cabecera. El CA de U206
(`e2e/local-first-ca.mjs`) sigue **7/7 verde con 13 vectores rojos**, y sus tres
casos rojos ahora citan un hallazgo más:

```
ROJO · a · un byte de think.md → fichero_corrupto,unidad_corrupta,corpus_desviado
ROJO · b · registry.json roto  → fichero_corrupto,familia_invalida
ROJO · c · volumes.json a mano → sello_roto,estado_desfasado
```

---

## 4 · Que el producto siga arrancando

Arranque **real** (no la guarda: `startAll()` / `createFirehoseServer()`, con cierre
de handles), contra el root sellado y contra un root **sin sellar**, mismo árbol de
código:

| servicio | root SIN sellar | root SELLADO |
| --- | --- | --- |
| `force-system` | ARRANCA (`:4113`) | **ARRANCA** (`:4113`) |
| `ssb-system` | ARRANCA (`:4114`) | **ARRANCA** (`:4114`) |
| `firehose-browser` | ARRANCA | **ARRANCA** |
| `linea-system` | **NO ARRANCA** — `Line data not found for "espana"` | **NO ARRANCA** — `Line data not found for "espana"` |

`linea-system` **no arranca ni antes ni después, y no por la guarda**: la guarda pasa
(`assertVolumesRootBootable` no lanza) y el fallo llega después, en `loadLineaData`,
porque `src/lineas.mjs:15,22` exige `lineaId: 'espana'` y el candado de whitelist
`.gitignore:26-32` solo deja entrar `registry.yaml` y `demo/**`. Es exactamente lo
que WP-U261 documentó y **no lo introduce este WP**. La equivalencia está demostrada
corriendo los dos roots, no afirmada.

Suites, con `ZEUS_VOLUMES_ROOT` apuntando al root real [banco]:

```
@zeus/volumes-ops   148 tests · 146 pass · 0 fail · 2 skipped   (eran 139/137; +9 casos)
@zeus/linea-kit      43 ·  43 · 0     @zeus/ssb-system    27 · 27 · 0
@zeus/presets-sdk    55 ·  55 · 0     @zeus/feed-kit      10 · 10 · 0
@zeus/firehose-core  12 ·  12 · 0     @zeus/force-system   2 ·  2 · 0
@zeus/linea-system    3 ·   1 · 0 · 2 skipped (los de U261, sin cambio)
lint exit 0 (0 errores, 18 warnings preexistentes) · gates: OK (0 offenders) · test:gates 58/58
e2e/local-first-ca.mjs (con ZEUS_GAMES_LIBRARY) → 7/7 pasos verdes, 13 vectores rojos, exit 0
```

Los 2 omitidos de `volumes-ops` son los `t.skip` de Windows preexistentes
(`import-ssb-driver.test.mjs:759,786`).

**Higiene comprobada antes de acusar**: tras `npm ci` aparecían 3 ficheros `bin/`
como modificados; `git diff --numstat` sobre ellos da **vacío** (re-estampado de
`npm ci`), y se restauraron. Ninguna suite ensucia el árbol rastreado: `git status`
después de correrlas todas solo lista mi diff.

---

## 5 · Qué queda SIN sellar, y qué implica

**`firehose` (DISK_01) y `ssb` (DISK_04): 0 ficheros rastreados, directorio
inexistente.** No se sellan, y no es pereza: **sellar un volumen sin árbol lo mata**.
Medido — manifiesto con `source.imported` en `firehose` y ledger re-anclado:

```
firehose sellado con árbol AUSENTE → firehose-browser: SE NIEGA (volumen[firehose]: volumen_ausente)
```

O sea: el «sello vacío» no es más seguridad, es un servicio caído. Su cobertura real
pasa a ser el sello del root (legs `manifiesto` + `sello_vs_ledger`), que sí los
protege del manifiesto editado a mano — cobertura que **no tenían**.

**Lo que el leg `ficheros` NO cubre, escrito:**

- **Altas.** Comprueba pertenencia de lo sellado, no igualdad de conjunto. Un fichero
  nuevo dentro del volumen no es hallazgo de este leg. Es deliberado y medido: el
  candado `.gitignore:10-12` **permite a propósito** copias locales no rastreadas
  (`LINEAS/espana`, `forces/force-a..g`). Exigir igualdad de conjunto pondría a esos
  operadores sin arranque por material que el repo declara no controlar:

  ```
  copia local en DISK_03/FORCES/forces/ → forces-system: ARRANCA
  copia local en DISK_02/LINEAS/        → linea-system:  ARRANCA
  ```

  Por la misma razón **no** sembré `corpora.files/bytes` en el pack: el leg `corpora`
  mide el directorio entero y habría convertido esa misma copia local en
  `corpus_desviado`. Queda `omitido: sin_corpora_sellados`, declarado. Las altas
  **dentro de una unidad sellada** sí se cazan, por el snapshot de FORCES.
- **LINEAS sigue sin snapshot de unidad** (U259). El leg `ficheros` tapa el efecto
  para los 5 ficheros que el import trajo, no la causa.
- **Coste del sello**: el manifiesto crece una línea por fichero sellado (13 aquí,
  65 → 100 líneas). Es la misma escala que el `hashes` del manifiesto de pack, que ya
  enumera fichero a fichero; no se introduce un orden de magnitud nuevo. Para un
  volumen de miles de ficheros el coste es real y queda declarado en `import.mjs`.
- **El ledger es append-only por convención**, no a prueba de manipulación. Frontera
  heredada de U206, sin cambios.

---

## 6 · Dos ficheros fuera de ALCANCE_DIFF, y por qué la obra no existe sin ellos

### 6.1 · `.gitignore` — el ledger tiene que viajar RASTREADO

`verify.mjs` contrasta el sello vivo contra el asiento `import_pack` del ledger, y
en un root cuyo manifiesto declara volúmenes importados **la ausencia del ledger es
en sí misma hallazgo** (`ledger_ausente`, U206·m6). El ledger vive en
`VOLUMES/.ops-ledger.jsonl`, que `.gitignore:14` (`VOLUMES/*`) excluía.

Medido: con el root sellado y el ledger fuera de git, **los cuatro servicios se
niegan a arrancar en un clon limpio** (fila `ledger AUSENTE` de §2). No es una
preferencia: sin la línea de whitelist, este WP entrega un monorepo que no arranca.
`volumes.state.json` sigue ignorado — eso es estado regenerable al medir (D-45),
esto es evidencia.

### 6.2 · `.gitattributes` — un sello por sha256 no sobrevive a la traducción de finales de línea

**El fallo más caro que encontré, y lo encontré porque miré los bytes en vez de
suponerlos.** El repo no tenía `.gitattributes` y el clon corre con
`core.autocrlf=true`: el árbol de trabajo de Windows llegaba en **CRLF** mientras el
blob guardaba **LF**.

```
VOLUMES/DISK_03/FORCES/registry.json
  blob de git (lo que recibe un checkout de Linux/CI)  824 bytes  3512695882b5…
  árbol de trabajo en Windows                          864 bytes  9e3d8a5a358b…
```

El primer sello que tomé fue el de 864 bytes. En CI habría dado
**`fichero_corrupto` en los 13 ficheros** y los cuatro servicios abajo — un WP que
cierra un hueco y rompe el arranque. Cerrado con `VOLUMES/** -text` (alcance
deliberadamente estrecho: solo el árbol sellado; cambiar la política del monorepo
entero es otra decisión con otro dueño), renormalizando el árbol y **re-sellando
desde los bytes LF**.

Comprobado, no prometido: los **13/13** hashes sellados coinciden con los bytes que
entrega git, y un checkout extraído del commit arranca verde y se niega en los nueve
vectores (§2, **[clon]**). Hay un test que lo vigila **por efecto** (compara contra
el blob del índice), no leyendo el fichero de configuración: si alguien quita el
candado o commitea CRLF, se pone rojo antes de que lo haga CI.

---

## 7 · El precio de la vía descartada

**Vía 2 — «un root sin sello no es arrancable», por contrato.**

Primero, lo que la vía 2 **no** es: no es una alternativa al sellado, es un añadido.
Declarar «sin sello no se arranca» no detecta ni una corrupción por sí sola; hay que
sellar igual. O sea vía 2 = vía 1 **+** un hallazgo nuevo en `verify.mjs` que
convierta el omitido honesto `sin_procedencia_de_import` en fatal.

El precio de ese «+», medido:

1. **Rompe todo root externo que hoy funciona.** `.env.example:71-74` y la propia
   `note` del manifiesto le dicen al operador que los datos vivos van a un
   `ZEUS_VOLUMES_ROOT` **fuera** del monorepo, o a un `@zeus/startpack-*`. Ninguno de
   esos roots está sellado. Medido sobre un root de referencia sin sellar, que es la
   forma exacta que tienen: hoy los cuatro servicios **ARRANCAN**; con la vía 2, los
   cuatro se niegan hasta que alguien corra el sellador sobre cada uno.
2. **Rompe `firehose` y `ssb` en el propio monorepo**, que por §5 no pueden sellarse
   sin dejar de arrancar. La vía 2 los deja sin salida: sin sello no arrancan, con
   sello vacío tampoco (`volumen_ausente`).
3. **Contradice una frontera que U206 declaró y midió**: «no se puede verificar
   integridad contra un sello que no existe». Convertir esa omisión en fatal no
   añade capacidad de detección; añade una negativa.

Y el precio de **no** haberla elegido, que también hay: un root que alguien
des-selle vuelve al comportamiento de §1 sin que nada chille **en tiempo de
arranque**. Eso es exactamente lo que compensa la vigilancia de §9, que se pone roja
si el leg `ficheros` deja de salir verde sobre el root de referencia. La protección
se mueve del arranque al commit, y queda escrito.

**Tercera vía considerada y descartada:** sellar un hash del árbol completo por
volumen (una línea por volumen en vez de 13). Más barato en tamaño, pero rompe con
cualquier fichero lateral no rastreado (§5) y, cuando falla, solo puede decir «algo
cambió» — no qué. El sello por fichero nombra la ruta.

---

## 8 · Quién puede escribir el manifiesto, y por qué vías

La pregunta importa porque **si una medición o un sync re-anota el sello, el sello no
vale nada**. El repo ya cerró ese defecto (U199 demolió el reescritor de contadores,
U204 el `ensureFirehoseVolumeLayout` de feed-kit); comprobado que **sigue cerrado**,
por tres caminos independientes:

**(a) Censo estático del repo entero.** La CA-5c de `ssb-system` barre
`packages/`, `scripts/` y `e2e/` marcando co-ocurrencia de una primitiva de escritura
con el token del manifiesto, y exige que **cada marcado esté en una allowlist
razonada**. Corre verde (27/27) y su lista es de **seis** ficheros: `manifest.mjs`
(el escritor legítimo), `materialize-pack.mjs` (escribe el manifiesto **de un pack**,
no de un root vivo), `smoke-env.mjs` y `e2e/local-first-ca.mjs` (siembran roots
temporales), y dos falsos positivos por prosa (`jetstream-sync.mjs`,
`ssb-system/src/export.mjs`). **`scripts/sello-root.mjs` no entra en la lista**: no
escribe el manifiesto, llama a `importPack`.

**(b) Probe dinámico por ruta resuelta** (CA-5a): instrumenta las seis primitivas de
`fs` y asevera **cero** escrituras contra `<root>/volumes.json` durante un export
completo. Verde.

**(c) Medición directa sobre ESTE root, ya sellado** — copias del root de
referencia:

```
M1  syncVolumeCounters('forces') + ('lineas')     → manifiesto INTACTO byte a byte · arranque ARRANCA
M2  recordVolumeSync('forces', {syncedAt})        → manifiesto INTACTO byte a byte · arranque ARRANCA
```

Es la comprobación que faltaba: no basta con que nadie escriba el manifiesto en
general, hace falta que **medir el root recién sellado** no lo mueva. No lo mueve; lo
que se mueve es `volumes.state.json`, que está ignorado y no entra en el hash.

**Conclusión:** un único escritor, `sealManifest()`, usado exclusivamente por
`importPack`. Y el leg `sello_vs_ledger` está anclado al ledger **precisamente**
porque el estado sí se re-anota al medir (`counters.mjs:39-40 → state.mjs:128-130`).

---

## 9 · La vigilancia añadida, y su vector rojo

Dos piezas, con alcances distintos y declarados.

### 9.1 · `packages/engine/volumes-ops/test/sello-root-referencia.test.mjs` — 9 casos

Resuelve `VOLUMES/` **desde `import.meta.url`, no desde `ZEUS_VOLUMES_ROOT`**: vigila
el fichero rastreado del repo, no el root que alguien tenga configurado. Si el árbol
no está, **FALLA**; no se auto-omite (el defecto que cerró U256 no se reintroduce).

| caso | qué asevera |
| --- | --- |
| evidencia presente | `volumes.json` **y** el ledger existen |
| VERDE | los cuatro puntos cableados arrancan sobre el root |
| cableado | los cuatro ficheros siguen llamando a la guarda con sus `volumeIds` — una vigilancia que cita un cableado movido no vigila, recita |
| **NO VACUO** | los legs `manifiesto`, `sello_vs_ledger` y `ficheros` salen **VERDES**, no omitidos |
| cobertura | todo volumen **con** árbol está sellado; todo volumen **sin** árbol **no** lo está |
| **PORTABILIDAD** | cada hash sellado == sha256 del **blob del índice de git** (§6.2) |
| ROJO ×13 | alterar **cada uno** de los 13 ficheros sellados niega el arranque |
| ROJO ×4 | manifiesto editado a mano → los cuatro se niegan, con `sello_roto` |
| ROJO ×4 | ledger borrado → los cuatro se niegan, con `ledger_ausente` |

**No puede saltarse a sí misma**, y está medido: sobre una copia **sin sellar** del
root, el caso NO VACUO se pone rojo y los 8 vectores rojos que sí llegan a correr
denuncian «ROJO esperado y NO llegó» — 13 fallos, exit 1. Sobre el root sellado,
9/9 verde. Corre ya en la matriz de CI: `@zeus/volumes-ops` está en `ci.yml:79`.

### 9.2 · Job `sello-root` en `.github/workflows/ci.yml`

Existe para lo que **ningún test local puede** comprobar: que los ficheros que
sostienen el sello estén **TRACKEADOS**. En el disco del operador existen aunque
`.gitignore` los excluya, así que un candado mal puesto se ve verde en local y rompe
el clon. El paso pregunta al índice de git, no al sistema de ficheros:

```yaml
git ls-files --error-unmatch VOLUMES/volumes.json
git ls-files --error-unmatch VOLUMES/.ops-ledger.jsonl
grep -q '"imported"' VOLUMES/volumes.json
```

Y re-ejecuta el fichero de §9.1 **fuera de la matriz**, para que sacar
`@zeus/volumes-ops` de ella no apague la vigilancia. El job no depende de ningún
valor derivado de sí mismo: es un job propio, sin `if`, sin `matrix`.

---

## 10 · Lo que NO afirmo

- **No afirmo CI verde.** La rama no se empuja (regla del swarm); el cierre real es
  su run. Lo que sí está leído con `gh`, no supuesto: la base `822e13e` tiene CI en
  **success** (`gh run list --branch main` → run `30711640317`), así que el rojo, si
  aparece, será mío. El fallo del workflow `Release` en `main` es preexistente y de
  otro workflow.
- **No afirmo que el sello detecte altas.** §5.
- **No afirmo que `linea-system` arranque.** No arranca, ni antes ni después, y §4
  dice por qué y con qué medida.
- **No afirmo haber cerrado U259.** El leg `ficheros` tapa el efecto para lo que el
  import trajo; LINEAS y FIREHOSE siguen sin snapshot de unidad verificable.
- El precio de la vía 2 sobre roots externos está medido **sobre un root de
  referencia sin sellar**, que tiene la misma forma; no sobre un root vivo de
  operador, que no tengo.

---

## 11 · Enrutables (declarados, no ejecutados)

1. **`hashTree` de `import.mjs:111-118` y `hashUnitTree` de `driver-forces.mjs:72-78`
   son la misma fórmula en dos copias.** Preexistente, no lo empeoré (el leg nuevo usa
   la primitiva exportada, no una tercera copia). Difieren en el recorrido —`lstat`
   contra `Dirent`— así que unificarlas exige medir el caso de los enlaces. **P2.**
2. **El resto del monorepo sigue sin política de finales de línea.** `.gitattributes`
   solo cubre `VOLUMES/**`. Cualquier otro artefacto que se selle por contenido
   tropezará con lo mismo. **P2, con dueño de repo.**
3. **U259 sigue abierto** y este WP le da un dato nuevo: el sello por fichero es una
   red de seguridad transversal, pero no sustituye al snapshot de unidad, que es lo
   único que caza altas dentro de una unidad.
