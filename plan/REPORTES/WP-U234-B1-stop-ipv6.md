# WP-U234-B1 · El barrido de puertos del orquestador es ciego a IPv6 — reporte

- **Rama**: `wp/u234b1-stop-ipv6` · base `87bd93f`
- **Worktree**: `C:\S_LAB\wt\z-u234b1`
- **Mandato**: `plan/BACKLOG.md:223` · defecto levantado como B1 en `plan/REPORTES/WP-U180-catalogo-ola1.md:17` y `:264-296`
- **Máquina**: Windows 11 Pro 10.0.26200 · node v22.21.1 · `dns.getDefaultResultOrder()` = `verbatim` · netstat con cabeceras en español y estado `LISTENING` en inglés
- **Fecha**: 2026-08-01

---

## 0 · Resultado en una línea

El orquestador tenía **dos** lectores de puerto y los dos eran medio ciegos, en
direcciones complementarias: la enumeración (`netstat -ano -p tcp`) sólo veía
IPv4, y la sonda de re-bind (`portFree(_, 'localhost')`) sólo veía la familia a
la que resuelve el host declarado — que en el catálogo real es siempre `::1`.
Ambos quedan cubiertos por un único punto de enumeración y un oráculo de
ocupación de doble lector. **Suite: 21→26 tests, 0 fallos**, con cinco vectores
que hoy fallaban sobre la base sin tocar.

---

## 1 · La superficie completa que se mapeó

Todo punto del repo que mira si un puerto está ocupado. La columna «tocado»
dice si este WP lo cambió.

| # | punto | fichero:línea | qué mira | familia antes | tocado |
| --- | --- | --- | --- | --- | --- |
| 1 | `listenerPids` | `packages/mesh/mcp-launcher/src/orchestrator.mjs:228` (base) → `:259` (tip) | `spawnSync('netstat', ['-ano','-p','tcp'])` | **IPv4 sólo** | **SÍ** |
| 2 | `listenerPids` rama POSIX | mismo fichero, `:274` (tip) | `lsof -ti tcp:<port> -sTCP:LISTEN` | ambas ya | no — ver §7 |
| 3 | `portFree` | `:298` (base) → `:345` (tip) | `net.listen({port, host, exclusive:true})` | **la del host, una sola** | no (semántica intacta) |
| 4 | `waitPortFree` → `waitPortReleased` | `:308` (base) → `:369` (tip) | envolvía (3) con deadline | heredaba el agujero de (3) | **SÍ** |
| 5 | `runStart`, guardia `puerto_ocupado_sin_health` | `:401` (base) → `:462` (tip) | consume (1) | heredaba (1) | hereda el arreglo |
| 6 | `rollbackStarted` | `:465` → `:526` | consume (1) | heredaba (1) | hereda el arreglo |
| 7 | `runStop`, a quién matar | `:493` → `:554` | consume (1) | heredaba (1) | hereda el arreglo |
| 8 | `runStop`, `residualPids` | `:514` → `:575` | consume (1) | heredaba (1) | hereda el arreglo |
| 9 | `runStop`, veredicto `free` | `:509` → `:570` | consume (4) | heredaba (3) | hereda el arreglo |
| 10 | `runStatus`, `listening`/`pids` | `:548` → `:609` | consume (1) | heredaba (1) | hereda el arreglo |

**Puntos que NO son de este WP, verificados uno a uno:**

- `packages/mesh/mcp-launcher/src/process-manager.mjs` — no tiene parseo propio
  de puertos: sólo arrastra `port: entry.port` (`:251`) y `port: e.port`
  (`:277`) como dato. No mira ocupación. Intacto.
- `scripts/stop-ports.sh:7` — `netstat -ano | grep -E ":$p .*LISTENING"`, **sin**
  `-p`, o sea ya era family-complete. Es el escape del operador y el oráculo de
  contraste que hizo visible el defecto. Prohibido y no tocado.
- `scripts/stop-services.mjs` — territorio prohibido, no tocado. Los scripts
  `stop:*` del `package.json` raíz (`:89-91`) van por ahí, **no** por el
  orquestador: `stop:services`, `stop:v1-zeus`, `stop:ports`. Sólo los
  `start:*` (`package.json:33-35`) invocan el CLI del orquestador.
- `packages/engine/presets-sdk/src/mcp/stateless-route.mjs:79` y
  `packages/mesh/socket-server/src/create-server.mjs:47` — manejan `EADDRINUSE`
  del propio bind del servicio. Es el lado de *quién escucha*, no de *quién
  mira*. Territorio ajeno, prohibido, no tocado.
- `packages/engine/presets-sdk/src/env/index.mjs` — la tentación explícita del
  brief («cambiar el host por defecto del bind»). **No se tocó.** Este WP
  arregla quién mira, no dónde escucha. Ningún servicio cambia de bind.
- `packages/mesh/mcp-launcher/src/catalog.mjs` y `PROFILES`
  (`orchestrator.mjs:75-79` base) — owner ajeno y activo (U180/U181). No
  tocados. Los tests nuevos **no** registran perfiles: pasan el id de catálogo
  como perfil, que `expandProfile` ya acepta (`:116`), así que no mutan
  `PROFILES` y no colisionan con el test de `expandProfile`/`PROFILES`
  (`test/orchestrator.test.mjs:61-75` base).
- `plan/BACKLOG.md` — no tocado; el cierre de fila lo hace el orquestador.

**Radio de consumo del módulo**: `orchestrator.mjs` **no está en el `exports`
de `package.json`** (`packages/mesh/mcp-launcher/package.json:7-12`: sólo `.`,
`./catalog`, `./capability-map`, `./wake-bridge`). No es importable por
especificador de paquete. Un `grep` de todo el repo (fuera de `node_modules`)
por `orchestrator.mjs` / `listenerPids` / `portFree` sólo da: su propio test, su
propio fuente, el `package.json` raíz (scripts `start:*`) y tres documentos de
`plan/`. Blast radius real: el CLI y su test.

---

## 2 · El hecho primitivo, reproducido de primera mano

No heredado del brief: medido en esta máquina, en este worktree.

### 2.1 La ceguera de la enumeración

Con un listener vivo en `::1:19881` (pid 31812):

```
netstat -ano -p tcp    | (filas con :19881 y LISTENING) → []            ← ciego
netstat -ano -p tcpv6  | ...  → ["TCP [::1]:19881  [::]:0  LISTENING  31812"]
netstat -ano           | ...  → ["TCP [::1]:19881  [::]:0  LISTENING  31812"]
```

Aplicando **el parseo literal de `:233-239`** (sin cambiarlo) a cada salida:

```
parse(netstat -ano -p tcp) → []        ← el defecto
parse(netstat -ano)        → [31812]   ← el mismo parseo, sin tocar una coma
```

**El parseo no era el culpable; los argumentos sí.** Un regex «más estricto»
para direcciones IPv4 habría empeorado el defecto.

### 2.2 Coste (mediana de 7 ejecuciones, esta máquina)

| variante | mediana |
| --- | --- |
| `netstat -ano -p tcp` (lo de antes) | 73 ms |
| `netstat -ano` (elegida) | **40 ms** |
| dos pasadas `-p tcp` + `-p tcpv6` | 140 ms |

La opción elegida es además la más barata de las tres. `Get-NetTCPConnection`
no se midió aquí (ver §7).

### 2.3 La ceguera de la sonda — medida contra el módulo SIN TOCAR

Importando `listenerPids`/`portFree` del `orchestrator.mjs` de la base, con un
ocupante real de cada forma:

| ocupante | `listenerPids` | `portFree(_,'localhost')` | `portFree(_,'127.0.0.1')` |
| --- | --- | --- | --- |
| `::1` — socket-server, cache-browser, firehose-browser | **`[]` ciego** | `false` acierta | **`true` miente** |
| `::` comodín — todo MCP de presets-sdk | `[pid]` | **`true` miente** | **`true` miente** |
| `127.0.0.1` llano | `[pid]` | **`true` miente** | `false` acierta |

**Esto es lo que el brief no llegaba a enunciar y es la mitad que faltaba.** La
sonda de `runStop:509` siempre se llama con `e.host || 'localhost'`, y *todas*
las entradas del catálogo traen `host:'localhost'`. Luego la «prueba real de
re-bind» sólo probaba `::1`: un residuo en `127.0.0.1` o en `0.0.0.0` salía
declarado **libre**. No es una hipótesis condicional (`ZEUS_HOST=127.0.0.1`);
es la configuración de hoy, con el ocupante comodín que atan todos los MCP.

Los dos lectores eran, por tanto, **ciegos en direcciones complementarias**: la
enumeración no veía IPv6, y la sonda no veía nada que no fuese IPv6.

---

## 3 · La vía elegida y su precio

**Elegida: `netstat -ano` en una sola pasada, más un oráculo de ocupación de
doble lector.** Las otras dos vías del brief se descartan así:

| vía | por qué no |
| --- | --- |
| dos pasadas `-p tcp` + `-p tcpv6` | 140 ms frente a 40 ms, dos procesos en vez de uno, y **dos puntos de invocación** — justo el patrón que CA-6 vigila. Cero ganancia de fiabilidad. |
| `Get-NetTCPConnection` | Es la única vía inmune a la localización de la salida de `netstat` (ver §7), pero cuesta ~1.2 s por llamada según la medida del contrarrevisor; `status all` (15 entradas) lo pagaría por entrada. Prohibitivo. Además ata el runtime a PowerShell/Windows, cuando la función ya tiene rama POSIX. |
| resolver desde Node | No existe API en Node para enumerar los listeners de otros procesos. No es una vía. |

### Precio declarado de la elección

1. **Portabilidad**: ninguno nuevo. La rama win32 sigue siendo win32 y la rama
   POSIX no se toca. `lsof -i tcp:<port>` ya casa ambas familias por defecto
   (restringir exigiría `-i 4tcp:`/`-i 6tcp:`). **Pero esto no lo pude
   verificar**: esta máquina es Windows y no ejecuté la rama POSIX (§7).
2. **Localización**: `netstat -ano` sigue dependiendo de que el estado se
   imprima `LISTENING`. En esta máquina las cabeceras salen en español y el
   estado en inglés, y el guard `/LISTENING/i` funciona. En un locale que
   traduzca el estado, el parseo caería en silencio — **igual que antes, para
   las dos familias**. Este WP no mejora ni empeora ese riesgo; lo deja escrito
   en la cabecera de `listenerPids` para el siguiente.
3. **Ruido de `-ano` sin `-p`**: la salida incluye ahora filas UDP. No
   contaminan: carecen de columna de estado y el guard `/LISTENING/i` las cae.
   Verificado — el parseo devuelve exactamente el pid esperado, sin extras.
4. **`stop` es ahora más estricto**: puede firmar exit 1 donde antes firmaba 0,
   si de verdad sobrevive un residuo que antes no miraba. La **forma** del JSON
   no cambia (mismas claves, mismos tipos, mismos códigos), sólo su veracidad.
   Declarado en la cabecera para V34/O22. En sentido contrario, desaparece el
   exit 1 espurio de U180 (`free:false` con `residualPids:[]`), que era el
   síntoma de campo.
5. **Coste del oráculo en `waitPortReleased`**: un `netstat` (40 ms) por sondeo
   cuando el puerto ya re-bindea. Se ordenó `portFree` primero por ser la mitad
   barata, así que el caso «ocupado» corta sin pagar netstat. En el camino feliz
   se paga una vez.

### Efecto colateral declarado (mejora, no regresión)

La guardia `puerto_ocupado_sin_health` de `runStart` **estaba dormida** frente a
un ocupante `::1`: `listenerPids` devolvía `[]`, `occupied` salía vacío y
`start` spawneaba encima de un puerto ya tomado. Ahora despierta. Medido:

```json
{ "ok": false, "exitCode": 1, "error": "puerto_ocupado_sin_health",
  "occupied": [ { "id": "colateral", "port": 19891, "pids": [3524] } ] }
```

No se deja como prosa: es **CA-5**, con aserto.

---

## 4 · El vector rojo antes, verde después

### 4.1 Línea base registrada ANTES de tocar nada (CA-6 de no-regresión)

`npm test -w @zeus/mcp-launcher` (`package.json:15` → `node --test test/*.mjs`)
sobre `87bd93f`, árbol limpio:

```
# tests 21 · # pass 20 · # fail 0 · # skipped 1 · # duration_ms 6365
```

El único `skip` es preexistente (`eje I: launch linea-espana` — no hay volumen
`LINEAS/espana` vivo).

> **Nota de higiene, para que no se lea como contrabando**: `npm ci` (necesario,
> el worktree venía sin `node_modules`) dejó `M` tres ficheros de workspace
> ajenos — `packages/engine/{feed-kit/bin/jetstream-sync.mjs,
> linea-kit/bin/linea-kit.mjs, playbook-kit/bin/run-playbook.mjs}` — por
> normalización de fin de línea (`git diff` vacío: contenido idéntico bajo
> `core.autocrlf=true`). Restaurados con `git checkout --` antes de la línea
> base. **La suite en sí no ensucia ningún fichero rastreado**: comprobado
> ejecutándola sobre árbol limpio y volviendo a mirar `git status`.

### 4.2 Los cinco vectores contra el `src` SIN TOCAR

Tests añadidos primero, `src` intacto — `node --test test/orchestrator.test.mjs`:

```
ok   1..4  (los cuatro tests preexistentes)
not ok 5 - CA-1  listenerPids enumera un listener atado sólo a ::1
not ok 6 - CA-2  status no miente sobre un listener ::1
not ok 7 - CA-3  stop mata un ::1 que el orquestador NO arrancó
# tests 7 · # pass 4 · # fail 3
```

Rojo literal de CA-3, que es el síntoma de campo de U180 palabra por palabra:

```json
{"ok":false,"cmd":"stop","exitCode":1,
 "before":[{"id":"fixture-v6-orphan","port":19863,"pids":[]}],
 "killed":[],
 "ports":[{"port":19863,"free":false,"residualPids":[]}],
 "residues":[{"port":19863,"free":false,"residualPids":[]}]}
```

Rojo de CA-2 — `status` mintiendo con el proceso vivo y sano:

```json
{"id":"fixture-v6-status","port":19862,"healthy":true,"listening":false,"pids":[]}
```

CA-4 y CA-5 se midieron aparte contra el módulo sin tocar (tabla de §2.3 y
§3), porque expresan el defecto sobre símbolos que la base no exportaba.

### 4.3 Matriz de falsación: ninguna CA es de polizón

Para probar que cada mitad del arreglo es portante y que ninguna CA viaja
gratis, se revirtió **cada mitad por separado** y se volvió a correr:

| experimento | CA-1 | CA-2 | CA-3 | CA-4 | CA-5 | e2e IPv4 |
| --- | --- | --- | --- | --- | --- | --- |
| base sin tocar (§4.2) | ROJO | ROJO | ROJO | rojo (§2.3) | rojo (§3) | verde |
| **A** — sólo se revierte `netstat` a `['-ano','-p','tcp']`, oráculo intacto | **ROJO** | **ROJO** | **ROJO** | verde | **ROJO** | verde |
| **B** — `netstat` arreglado, oráculo degradado a `portFree` a secas | verde | verde | verde | **ROJO** | verde | verde |
| tip (ambas mitades) | verde | verde | verde | verde | verde | verde |

Lectura: A ancla CA-1/2/3/5 a la **enumeración**; B ancla CA-4, y sólo CA-4, a
la **sonda**. Es decir: **CA-4 no es un pasajero del arreglo de `listenerPids`**
— si se hubiese arreglado sólo la enumeración (el «arreglo parcial» que este WP
tenía que evitar), CA-4 seguiría roja y el agujero de la sonda seguiría vivo.

### 4.4 Verde final

`npm test -w @zeus/mcp-launcher` sobre el tip:

```
# tests 26 · # pass 25 · # fail 0 · # skipped 1 · # duration_ms 6259
```

21→26 (+5 CA nuevas), 0 fallos, mismo `skip` preexistente.

**El e2e IPv4 (`test/orchestrator.test.mjs:96-144` en la base, `:105-153` en el
tip) sigue verde sin editar ni uno de sus asertos.** No es una afirmación de
lectura: `git diff -U0` del fichero de test tiene **exactamente dos líneas
borradas** en todo el fichero, y ninguna es un aserto —

```
- * Windows tree-kill, port re-bind proof).     ← la cabecera :4 (§5)
-   portFree                                    ← la línea del import, ampliada
```

Los asertos del e2e (`:142`, `:143`, `:144`, `:147-148`, `:149-150`, `:152` en
el tip; `:134`, `:138-139`, `:140-141` en la base) están intactos byte a byte.
`eslint` sobre el paquete: 0 errores (1 warning preexistente en
`test/catalog.test.mjs:9`, ajeno).

---

## 5 · Promesa ↔ aserto (CA-7: promesa sin aserto = promesa borrada)

Las **dos** cabeceras repetían la promesa de «prueba real de re-bind». Ambas
reescritas: `src/orchestrator.mjs:20-29`, `:37-42` y `:47-48`, y
`test/orchestrator.test.mjs:1-10`. Cada promesa que queda, con su aserto:

| promesa (tip) | dónde | aserto que la sostiene |
| --- | --- | --- |
| «taskkill /T /F del pid grabado (win32) o kill de process-group (POSIX)» | src `:20-21` | e2e IPv4, `stopped.ok===true` tras `runStart` (ruta con pid en estado) |
| «barrido de listeners residuales por puerto de catálogo — IPv4 e **IPv6**» | src `:22-23` | **CA-1**: `listenerPids(19861)` = `[pid]` con ocupante `::1` |
| «incluido el grupo adoptado que no dejó pid en el estado» | src `:23-24` | **CA-3**: se asevera `existsSync(state-*.json)===false` antes de `stop`; luego `killed` contiene el pid y `connect [::1]` → `ECONNREFUSED` |
| «veredicto de puerto liberado por doble lector: re-bind del host declarado **Y** enumeración sin listeners» | src `:24-26` | **CA-4**: `portReleased` = `false` donde `portFree` = `true`, para ocupante `::` y `127.0.0.1`; y `true` en un puerto realmente libre |
| «`listening`/`pids` cubren IPv4 e IPv6» | src `:27-29` | **CA-2**: `row.listening===true` y `row.pids===[pid]` con ocupante `::1` |
| «`start` puede abortar con `puerto_ocupado_sin_health` donde antes spawneaba a ciegas» | src `:37-42` | **CA-5**: `started.error==='puerto_ocupado_sin_health'` y `occupied[0].pids===[pid]` |
| «Fuente única: catalog.mjs — aquí no hay puertos escritos a mano» | src `:44-48` | preexistente (CA-3 de U234); este WP no añade ninguna cifra al `src` |
| «IPv4 re-bind proof» (era «port re-bind proof») | test `:4` | acotada a IPv4 a propósito: es lo que el e2e de `dual-peer` prueba y sólo eso |

Ninguna promesa quedó sin aserto. La única que se **estrechó** en vez de
respaldarse es la del test `:4`: decía «port re-bind proof» y probaba
únicamente IPv4 — que es exactamente el defecto de fondo de este WP (demostrar
sobre el caso que no falla). Ahora dice «IPv4 re-bind proof» y el bloque nuevo
cubre la otra familia.

---

## 6 · Qué se tocó, exactamente

**3 ficheros. Ninguno de territorio prohibido.**

### 6.1 `packages/mesh/mcp-launcher/src/orchestrator.mjs`

| línea (tip) | cambio |
| --- | --- |
| `:20-29` | cabecera de `stop` y `status` reescritas (§5) |
| `:37-42` | nota de contrato para V34/O22: la forma del JSON no cambia, su veracidad sí |
| `:47-48` | «primitivas del SO … (taskkill/netstat **sin filtro de familia, ver listenerPids**)» |
| `:236-256` | doc de `listenerPids`: por qué **no** volver a poner `-p tcp`, con la medida; por qué el parseo es family-agnostic y por qué las filas UDP no contaminan; por qué POSIX no cambia |
| **`:259`** | **`['-ano','-p','tcp']` → `['-ano']`.** El arreglo del defecto 1, una sola línea |
| `:328-344` | doc de `portFree`: tabla medida de su ceguera y aviso de que **no** es oráculo de ocupación |
| `:355-367` | **`portReleased(port, host)` nuevo y exportado** — el oráculo de doble lector |
| `:369-376` | `waitPortFree` → `waitPortReleased`, sobre `portReleased` |
| `:570` | `runStop` consume `waitPortReleased` |

El parseo de `:263-272` **no se tocó** (ni una coma), tal como exigía el brief.
`portFree` conserva firma y semántica: sigue exportada y el e2e IPv4 sigue
aseverando el re-bind crudo con ella.

### 6.2 `packages/mesh/mcp-launcher/fixtures/ipv6-peer.mjs` (NUEVO)

Peer de un solo puerto atado a **`::1` y sólo `::1`**. `dual-peer.mjs` queda
**intacto**: se creó fixture nuevo en vez de parametrizar el existente
justamente porque otros lo usan y heredarían el cambio. Emite error ruidoso y
`exit 1` si no puede atar `[::1]` — en una máquina sin loopback IPv6 el test
falla, no cuelga.

### 6.3 `packages/mesh/mcp-launcher/test/orchestrator.test.mjs`

Cabecera `:1-10` reescrita; `net` y `spawn` añadidos al bloque de imports;
`portReleased` y `killTree` añadidos al import del módulo. **Los cuatro tests
preexistentes no se reordenaron ni se editaron**; el bloque U234-B1 se añade
íntegro al final. Puertos nuevos y propios: `19861-19866` (los existentes
19131/19132 no se tocan).

El `host` de las entradas de prueba se queda en **`'localhost'`**, no `'::1'`:
`catalog.mjs:343-344` construye `http://${host}:${port}` **sin corchetes**, y
`fetch('http://::1:PORT/…')` da `ERR_INVALID_URL`. Comprobado en esta máquina:
con el fixture atado a `::1`, `http://localhost:PORT/mcp/health` → 200,
`http://[::1]:PORT/…` → 200, `http://127.0.0.1:PORT/…` → `ECONNREFUSED`. Ésa es
exactamente la forma de campo: sano por la URL del catálogo, invisible para el
barrido. **No se inventaron corchetes en `catalog.mjs`** — territorio ajeno.

**La prueba de muerte de CA-3 no es el veredicto del propio orquestador**: es un
`net.connect` crudo a `[::1]:port` que debe dar `ECONNREFUSED`, más el evento
`exit` del proceso hijo observado por el test.

---

## 7 · Qué NO se cubrió, y por qué

1. **La rama POSIX de `listenerPids` no se ejecutó.** El argumento de que
   `lsof -i tcp:<port>` ya casa ambas familias es de semántica documentada de
   `lsof` (restringir exigiría `-i 4tcp:`/`-i 6tcp:`), **no una medida mía**:
   esta máquina es Windows. Si alguien corre este orquestador en Linux/macOS,
   ese extremo sigue sin comprobar de primera mano.
2. **La localización de `netstat` sigue sin comprobar.** En esta máquina el
   estado se imprime `LISTENING` en inglés bajo cabeceras en español y el guard
   funciona. En un locale que traduzca el estado, el parseo caería en silencio
   para **las dos** familias. Es el único argumento fuerte a favor de
   `Get-NetTCPConnection` y se descartó por coste (§3). Riesgo preexistente, ni
   introducido ni resuelto aquí; queda escrito en la cabecera de `listenerPids`.
3. **`Get-NetTCPConnection` no se midió en esta sesión.** Las cifras que motivan
   su descarte (~1.2 s por llamada) son del contrarrevisor, no mías.
4. **No se arrancó ningún servicio real** (socket-server, cache-browser,
   firehose-browser). La cadena de campo end-to-end sigue sin reproducirse con
   el binario real: lo que sí está reproducido de primera mano es **cada
   primitiva que la explica** (§2) y el defecto entero sobre un fixture que ata
   la misma forma. El perfil `minimo` (`launcher` + `solar-sun`) **no sirve**
   para verificar esto: sus procesos atan comodín vía
   `packages/engine/presets-sdk/src/mcp/stateless-route.mjs:78`
   (`app.listen(port, …)`, sin host), así que nunca cayeron en el punto ciego.
   Verificar sobre `minimo` sería conceder en falso.
5. **`portFree` conserva su ceguera de familia única**, a propósito. No se
   «arregló» porque una sonda de bind **no puede** ser un oráculo general: con
   ocupante en `127.0.0.1`, sondear `0.0.0.0` da libre (medido). La ocupación
   sólo la puede dictar la enumeración. Por eso el oráculo es la conjunción de
   las dos, y no una sonda «mejor».
6. **No se tocó el bind de ningún servicio.** Ni `env/index.mjs`, ni
   `socket-server/config.mjs`, ni `{socket-server,cache-browser,
   firehose-browser}`. Atar a `127.0.0.1` «para que netstat lo vea» habría sido
   arreglar el síntoma en el sitio equivocado y cambiar el contrato de red de
   varios servicios.
7. **No se tocó `catalog.mjs` ni `PROFILES`**, ni se registró ningún perfil
   nuevo desde los tests: owner ajeno y activo (U180/U181).
8. **No se midió `netstat -ano` en una máquina cargada.** Los 40 ms son de una
   máquina en reposo.
9. **No se corrió la suite completa del monorepo**, sólo la del paquete. Se
   justificó por radio: `orchestrator.mjs` no está en el `exports` del paquete
   y ningún otro fichero del repo lo importa (§1).

---

## 8 · Higiene (CA-8)

- **Cero listeners** en los puertos tocados, con `netstat -ano` **sin `-p`** —
  la única forma que ve las dos familias: 19131, 19132, 19861-19866, 19871-19873,
  19881-19883, 19891 → ninguna fila `LISTENING`.
- `data/orchestrator/` no existe: cero estado residual. Los tests usan
  `mkdtempSync` en `os.tmpdir()` y lo borran en su `t.after`.
- `git status` limpio salvo los tres ficheros de este WP (dos `M`, uno `??`).
  Los tres ficheros ensuciados por `npm ci` fueron restaurados (§4.1).
- Ni `git stash` (la pila es del repositorio y hay más worktrees vivos) ni
  `npx` de binario no declarado: el único `npx` usado es
  `npx --no-install eslint`, y `eslint` está declarado en `package.json:147`.
- Nada escrito fuera de `C:\S_LAB\wt\z-u234b1`; los scripts de sonda viven en
  el scratchpad de sesión.
