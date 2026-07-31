# WP-U180 · Catálogo ola 1 (`socket-server` + `ciudad-lifecycle`) — reporte

- **Rama**: `wp/u180-catalogo-ola1` · base `dc70cec` · tip **`b80741b`**
- **Worktree**: `C:\S_LAB\wt\z-u180` (canónico `C:\S_LAB\z-sdk` no tocado)
- **Mandato**: `plan/BACKLOG.md:222` (U180) · DoD `plan/GOBIERNO-EJECUCION-F2.md:745-785` (§7)
- **Fecha de ejecución**: 2026-08-01

---

## 0 · Resultado en una línea

Las dos entradas están de alta en el catálogo de runtime con el puerto
resuelto por `presets-sdk/env` y **health de facto ejecutada y verde en las
dos** (200 en ambas). El gate `matriz-51` sigue verde (EXIT=0) y las
comprobaciones de U234 siguen verdes con el catálogo ampliado, **con una
excepción que no introduce este WP y que se reporta como bloqueo B1**:
`stop socket-server` deja huérfano el proceso (defecto de `listenerPids` en
`orchestrator.mjs:228`, IPv4-only, reproducido también sobre la base `dc70cec`
sin mis cambios).

---

## 1 · Qué se tocó (ruta:línea)

**Diff total: 4 ficheros, +77 / −13.** Ningún fichero de territorio prohibido,
ningún fichero caliente ajeno de `plan/GOBIERNO-EJECUCION-F2.md:562-591`.

### 1.1 `packages/mesh/mcp-launcher/src/catalog.mjs` (owner de ola: U180)

| línea | cambio |
| --- | --- |
| `:232-244` | **entrada nueva `ciudad-lifecycle`** — `workspace: '@zeus/ciudad-lifecycle'`, `spawnGroup: 'ciudad-lifecycle'`, `deps: []`, `capabilities: ['fleet.ciudadLifecycle','city.lifecycle']`, `healthPath: '/mcp/health'`, `mcpPath: '/mcp'`. Sin `kind` ⇒ MCP (entra en el `mcp.json` de VS Code, a diferencia de los `kind:'service'`). |
| `:307` | `portsById`: `'ciudad-lifecycle': mcp.ciudadLifecycle?.disk ?? FALLBACK_MCP_PORTS.ciudadLifecycle.disk` |
| `:294` | `'linea-editor': mcp.lineaEditor?.disk ?? FALLBACK_MCP_PORTS.lineaEditor.disk` (antes `?? 4115`) |
| `:436-437` | `buildPortTable`: mismo saneo de `lineaEditor` + fila nueva `ciudadLifecycle` |

`FALLBACK_MCP_PORTS` es `structuredClone(DEFAULT_ZEUS_MCP)` (`catalog.mjs:42`),
o sea sigue siendo `presets-sdk/env`: **no se introduce ninguna cifra nueva**.

**`socket-server` NO se duplicó**: ya estaba dado de alta por U234
(`catalog.mjs:246-256`, `kind:'service'`, `uiPort:'scriptorium'`). Este WP la
**verifica** (health de facto + test) en lugar de crear una entrada gemela.
Se deja constancia porque el encargo pedía «dar de alta las dos»: una de las
dos ya existía en el árbol al abrir el WP.

### 1.2 `packages/mesh/ciudad-lifecycle/src/server.mjs`

| línea | cambio |
| --- | --- |
| `:6` | `import { DEFAULT_ZEUS_MCP, resolveZeusMcpPorts } from '@zeus/presets-sdk/env'` |
| `:21` | `export const DEFAULT_PORT = DEFAULT_ZEUS_MCP.ciudadLifecycle.disk` (antes: literal `3051`) |
| `:23-25` | `resolveLifecyclePort()` = `resolveZeusMcpPorts().ciudadLifecycle.disk` (antes: lectura cruda de `process.env.ZEUS_MCP_CIUDAD_LIFECYCLE` + literal) |

Motivo (no es cosmético): el catálogo resuelve el puerto con
`resolveZeusMcpPorts()`, que **carga el `.env` de raíz** (`presets-sdk/src/env/index.mjs:169-175`,
`readEnvPort` → `loadZeusEnv`). La lectura cruda anterior **no** lo hacía: un
operador que pusiera `ZEUS_MCP_CIUDAD_LIFECYCLE` sólo en el `.env` habría
tenido el catálogo apuntando a un puerto y el bind a otro. Con este cambio
catálogo y bind no pueden divergir. Fichero **no caliente** en §2.

### 1.3 `packages/mesh/mcp-launcher/src/orchestrator.mjs` — **sólo cabecera**

`:42-48`: la nota decía «el puerto de ciudad-lifecycle se resuelve localmente
… por eso ciudad-lifecycle NO tiene aún entrada de catálogo ni perfil aquí».
Quedaría mintiendo tras esta alta. Se sustituye por el estado real y se deja
declarado que **`minimo` y `v1-zeus` NO cambian** (los fija U234); la entrada
sólo entra en `all` porque `all` = toda entrada lanzable
(`orchestrator.mjs:113`). **Cero líneas de lógica tocadas** en este fichero.

### 1.4 `packages/mesh/mcp-launcher/test/catalog.test.mjs`

- `:85` `U180: ola 1 (socket-server + ciudad-lifecycle) toma el puerto de presets-sdk/env`
- `:104` `U180: mover el puerto en la fuente única mueve la entrada (cero literales)`
- `:126` assert añadido: `ciudad-lifecycle` **sí** entra en el `mcp.json` de VS Code

---

## 2 · Resolución de puerto elegida y por qué

| entrada | fuente del puerto | valor por defecto | override |
| --- | --- | --- | --- |
| `ciudad-lifecycle` | `DEFAULT_ZEUS_MCP.ciudadLifecycle.disk` (`presets-sdk/src/env/index.mjs:44`) vía `portsById` | 3051 | `ZEUS_MCP_CIUDAD_LIFECYCLE` (`presets-sdk/src/env/index.mjs:63`) |
| `socket-server` | `resolveZeusUiPorts().scriptorium.port` vía `uiPort:'scriptorium'` (`catalog.mjs:255`, `presets-sdk/src/env/index.mjs:89`) | 3017 | `ZEUS_PORT_SCRIPTORIUM` (`presets-sdk/src/env/index.mjs:106`) |

Por qué así y no de otra forma:

1. **`ciudad-lifecycle` va al bloque MCP, no al UI mesh.** El slot ya existía
   en la fuente única — lo abrió U227 (`plan/BACKLOG.md:306`, «Slot
   ciudad-lifecycle añadido a la fuente única»), cerrando el hallazgo de U179.
   Este WP **no edita `presets-sdk/src/env/index.mjs`**: es fichero caliente
   con owner único U227 (§2, `GOBIERNO-EJECUCION-F2.md:581`). Sólo lo consume.
2. **`socket-server` va al UI mesh** (`ui.scriptorium`) porque su bind ya sale
   de ahí: `packages/mesh/socket-server/src/config.mjs:27` usa
   `DEFAULT_ZEUS_UI_MESH.scriptorium`. Cambiar de bloque habría movido el
   puerto de un servicio vivo sin mandato.
3. **Sin literal de reserva propio**: donde hacía falta un fallback defensivo
   (objeto `mcp` parcial pasado por un test) se usa `FALLBACK_MCP_PORTS`, que
   es la copia del mismo `DEFAULT_ZEUS_MCP`. Cero cifras nuevas.

---

## 3 · CA uno a uno

### CA-1 · `health` **de facto** por entrada — ✅ las dos, ejecutada

No declarada en un README: ejecutada con el orquestador de U234, que sondea
el `healthUrl` derivado del catálogo (`health.mjs:probeHealth`).

**`ciudad-lifecycle`** — `node packages/mesh/mcp-launcher/src/orchestrator.mjs start ciudad-lifecycle` → `EXIT=0`

```
[orq] ciudad-lifecycle: spawn npm.cmd run start -w @zeus/ciudad-lifecycle
[orq] ciudad-lifecycle: sano (pid 17576)
"health": [{ "id": "ciudad-lifecycle", "port": 3051,
             "healthUrl": "http://localhost:3051/mcp/health",
             "ok": true, "statusCode": 200,
             "body": { "status":"ok", "server":"ciudad-lifecycle",
                       "version":"0.1.0",
                       "capabilities": {"tools":10,"resources":2,"prompts":1},
                       "role":"behavior",
                       "barrios":["state-machine","prolog-editor","aaia-gallery"],
                       "ledgerSize":0 } }]
```

`health ciudad-lifecycle` → `EXIT=0`, 1/1 fila `ok:true` (200).
`status ciudad-lifecycle` → `EXIT=0`, `{"total":1,"running":1,"stopped":0,"unhealthy":0}`,
`healthy:true · listening:true · pids:[33300] · managedPid:17576`.
`stop ciudad-lifecycle` → `EXIT=0`, `residues: []`, `port 3051 free:true`.

**`socket-server`** — `start socket-server` → `EXIT=0`

```
[orq] socket-server: spawn npm.cmd run start -w @zeus/socket-server
[orq] socket-server: sano (pid 29952)
"health": [{ "id":"socket-server", "port":3017,
             "healthUrl":"http://localhost:3017/health",
             "ok":true, "statusCode":200,
             "body": {"ok":true,"bridge":"local","namespace":"/runtime"} }]
```

`health socket-server` → `EXIT=0`, 1/1 fila `ok:true` (200).
`status socket-server` → `EXIT=0`, `running` (pero `listening:false` — ver **B1**).
`stop socket-server` → **`EXIT=1`, 1 residuo** — ver **B1**.

Nada queda con `⏳`: las dos entradas responden hoy. El `⏳` habría sido para
la que no pudiera responder; no hay ninguna.

### CA-2 · Cero literales de puerto — ✅ (con la salida `0` pedida)

**G1 · patrón exacto** (número de 4–5 dígitos = puerto), sobre los **tres**
ficheros que resuelven el puerto de las dos entradas:

```
grep -rnE '\b(6[0-9]{4}|[1-9][0-9]{3,4})\b' \
  packages/mesh/mcp-launcher/src/catalog.mjs \
  packages/mesh/ciudad-lifecycle/src/server.mjs \
  packages/mesh/socket-server/src/config.mjs
```
**salida: `0` líneas.** (Antes de este WP la misma orden devolvía 3: `?? 4115`
×2 en `catalog.mjs` y `= 3051` en `server.mjs`.)

**G3 · patrón `\b3051\b`** en todo el árbol de código fuera de `presets-sdk/`:

```
grep -rnE '\b3051\b' --include=*.mjs --include=*.js --include=*.ts \
  --include=*.json --include=*.example \
  packages/ scripts/ examples/ e2e/ test/ .env.example | grep -v 'presets-sdk/'
```
**salida: 1 línea** — `.env.example:36:# ZEUS_MCP_CIUDAD_LIFECYCLE=3051  # ciudadLifecycle.disk`.
Honestidad: **no es 0**, pero **no es un literal de código**: `.env.example` es
la **salida generada** por el generador de U227 desde la fuente única
(`plan/BACKLOG.md:306`, cabecera «no editar a mano»), y la línea está
comentada. Limitando el patrón a código (`--include=*.mjs/js/ts`): **`0`**.

**G4 · gate de puertos del propio mundo** (regla (a) de `scripts/gates`, la
vara que el mundo ya se dio en WP-U00):

```
node -e "import('./scripts/gates/scan.mjs').then(m=>console.log(m.scanHardcodedPorts().length))"
```
**salida: `0` offenders.**

**G2 · `\b3017\b` en fuente de producción** (excluidos tests/e2e y
`presets-sdk/src/env/`): **16 líneas, ninguna nueva y ninguna del bind**. Son
fallbacks de *cliente* que apuntan al scriptorium (`rooms/src/config.mjs:22,28`,
`room-client-browser/*`, `console-monitor/src/config.mjs:40`,
`examples/ping-pong-bots/launch.mjs:24`) más los espejos del propio gate
(`scripts/gates/scan.mjs:16`, `scripts/gates/exceptions.mjs`). **Todas están ya
registradas como excepción pre-U00 en `scripts/gates/exceptions.mjs:56-113`** y
ninguna está en el camino del puerto de la entrada `socket-server`. Se anotan
como observación (O3), no se tocan: `rooms/src/config.mjs` y
`console-monitor` son ajenos a este WP.

### CA-3 · U234 sigue verde con el catálogo ampliado — ✅ salvo B1 (preexistente)

Re-ejecución completa de sus comprobaciones, con números:

| comprobación | antes (implícito) | ahora | exit |
| --- | --- | --- | --- |
| `npm test -w @zeus/mcp-launcher` | 18 pass + 1 skip (acta U234, `BACKLOG:322`) | **20 pass · 0 fail · 1 skip** (21 tests; +2 son de U180) | **0** |
| `status all` — filas | 14 | **15** (`+ciudad-lifecycle@3051`) | **0** |
| `status all` — orden topológico de grupos | — | `linea-system > solar-system > force-system > linea-editor > ssb-system > linea-firehose > console-monitor > mcp-launcher > ciudad-lifecycle > socket-server > cache-browser > firehose-browser` (posición estable = orden de catálogo) | **0** |
| `health all` (todo parado) | — | 15 filas, 0 `ok`, `ok:false` | **1** (correcto) |
| salida JSON: **un** documento por stdout | — | `status all 2>/dev/null` → `JSON.parse` OK; progreso sólo por stderr | **0** |
| `start minimo` | — | 2 grupos, **4 entradas health 200** (`solar-sun/moon/earth` + `launcher`) | **0** |
| `health minimo` | — | 4/4 `ok:true` (200) | **0** |
| `status minimo` | — | `{"total":4,"running":4,"stopped":0,"unhealthy":0}` | **0** |
| `stop minimo` | — | `residues: 0`; 3050/4101/4102/4103 `free:true`; netstat sin listeners | **0** |
| `npm test -w @zeus/ciudad-lifecycle` | — | **15 pass · 0 fail** | **0** |
| `eslint` sobre los 4 ficheros tocados | — | 0 errores · 1 warning preexistente (`getCatalogEntry` sin usar, `catalog.test.mjs:9`) | **0** |

**Prueba adicional (la más dura para CA-2 + CA-1 a la vez)**: mover el puerto
en la fuente única mueve **el catálogo y el bind**:

```
ZEUS_MCP_CIUDAD_LIFECYCLE=13951 node .../orchestrator.mjs start ciudad-lifecycle
→ ok true · puerto de catálogo: 13951 · healthUrl http://localhost:13951/mcp/health · 200
curl http://localhost:13951/mcp/health → {"status":"ok","server":"ciudad-lifecycle",...}
curl http://localhost:3051/mcp/health  → sin respuesta (el bind se movió con la fuente)
stop → ok true · residues 0 · 13951 free:true
```

### CA-4 · Gate `matriz-51` verde — ✅

```
node scripts/gates/matriz-51.mjs
matriz-51: OK — 51/51 filas derivadas · 10 declaradas-sin-pieza visibles · 0 fallos
EXIT=0
```
Efecto visible del alta: la fila `@zeus/ciudad-lifecycle` pasa de
`health: sin entrada de catálogo` a `health: /mcp/health vía catálogo` y suma
`catálogo mcp-launcher (id ciudad-lifecycle)` como consumidor. Denominador
intacto (51), `declaradasSinPieza` intacto (10), 0 fallos.

`npm run test:gates` (autoprueba de U233): **22 pass · 1 fail** — el fallo es
`gates.test.mjs:34` («runAllGates limpio») por 3 offenders `two-games`
**preexistentes y ajenos** (ver B2), no por `matriz-51`.

### CA-5 · Cero contrabando — ✅ con una desviación declarada

Alcance tocado = 4 ficheros, todos dentro del WP. La **única desviación** que
no era estrictamente «dar de alta»: retirar los dos `?? 4115` de
`catalog.mjs:294,436`. Razón: sin eso, la salida exigida por CA-2 sobre el
fichero que doy de alta **no podía ser `0`** y el reporte habría afirmado más
de lo que prueba. Es equivalencia exacta
(`DEFAULT_ZEUS_MCP.lineaEditor.disk === 4115`, `presets-sdk/src/env/index.mjs:41`),
misma fuente, sin cambio de comportamiento (21 tests verdes).

**No se tocó** (y se pudo haber tocado): `presets-sdk/src/env/index.mjs` (owner
U227), `ciudad-lifecycle/src/catalog-extend.mjs` (owner U216/U217),
`socket-server/src/config.mjs` (owner U192/U194/U187), `orchestrator.mjs` en
lógica (owner U234), `PROFILES`, `capability-map.mjs`, `plan/BACKLOG.md`,
`package.json`, `scripts/gates/*`. Nada de territorio prohibido de carril D.

---

## 4 · Bloqueos

### B1 (bloqueo) · `stop socket-server` deja huérfano el proceso — **preexistente, owner U234**

**Síntoma.** Con `socket-server` sano (200):

```
status socket-server → {"healthy":true,"listening":false,"pids":[],"status":"running"}
stop   socket-server → EXIT=1 · residues:[{"port":3017,"free":false,"residualPids":[]}]
curl http://localhost:3017/health → {"ok":true,...}   ← sigue vivo tras el stop
```
Salida contradictoria e indepurable: dice que hay residuo y a la vez que no hay
pid residual.

**Causa raíz (ruta:línea).** `packages/mesh/mcp-launcher/src/orchestrator.mjs:228`
usa `netstat -ano -p tcp`, que en Windows es **sólo IPv4**. `socket-server`
escucha en `[::1]:3017` (su host sale de `DEFAULT_ZEUS_UI_MESH.scriptorium.host`
= `'localhost'`, que Node resuelve a `::1`). Evidencia literal, con el servidor
arriba:

```
netstat -ano -p tcp   | grep ":3017"          → (vacío)
netstat -ano -p tcpv6 | grep "3017.*LISTENING" → TCP [::1]:3017  [::]:0  LISTENING  10920
```

Consecuencia en cadena: `listenerPids()` devuelve `[]` ⇒ `status.listening=false`
aunque esté vivo (`:548`), el barrido por puerto de `stop` no tiene a quién
matar (`:493-501`), y `residualPids` sale vacío mientras `portFree` dice
ocupado (`:512`). Afecta a **todo `kind:'service'` que escuche en IPv6**, no
sólo a esta entrada.

**No lo introduce U180.** Reproducido sobre la base `dc70cec` **sin mis
cambios** (working tree en base): mismo `listening:false`, mismo
`residues:[{"port":3017,"free":false,"residualPids":[]}]`. Además
`git diff dc70cec HEAD` = 4 ficheros, ninguno es `orchestrator.mjs` en lógica
ni la entrada `socket-server`.

**Escape del operador (sí funciona).** `npm run stop:services -- "…" socket-server`
mata el proceso: `killing :3017 -> PID 10920`, EXIT=0, 3017 deja de responder.
Su primitiva es `scripts/stop-ports.sh:7`, `netstat -ano` **sin** `-p tcp` —
es decir, la corrección es de una línea.

**Por qué no lo arreglo yo.** El encargo dice «si tu alta rompe algo suyo, lo
arreglas tú **o** lo reportas como bloqueo». Mi alta no lo rompe: el defecto es
de U234 sobre una entrada que U234 ya tenía en su perfil `v1-zeus`. Tocar la
lógica de `orchestrator.mjs` sería contrabando en territorio de otro WP ya
aceptado. **Corrección propuesta (para su owner)**: en `orchestrator.mjs:228`,
sustituir `['-ano','-p','tcp']` por `['-ano']` (o hacer dos pasadas, `tcp` y
`tcpv6`), y añadir a `orchestrator.test.mjs` una fixture que escuche en `::1`
como probe permanente — hoy la fixture `dual-peer.mjs` escucha en IPv4, que es
justo el caso que no falla. Nota para la aceptación de U234: su CA «stop sin
residuos ✓ (re-bind ×4)» se demostró sobre esa fixture IPv4, no sobre
`socket-server`.

**Higiene.** Los huérfanos generados durante la verificación fueron matados
(`taskkill /pid … /T /F` + `npm run stop:services`); comprobación final:
ningún listener en 3017/3051/3050/4101-4103/13951, `data/orchestrator/`
borrado, `git status` limpio.

### B2 (bloqueo de gate, ajeno) · `npm run gates` en rojo desde antes de este WP

```
node scripts/gates/run.mjs → EXIT=1
  [two-games] packages/engine/linea-kit/src/curation.mjs:56
  [two-games] packages/engine/linea-kit/src/curation.mjs:68
  [two-games] packages/engine/volumes-ops/src/driver-lineas.mjs:21
```
Los tres por el token `\bdelta\b` del gate D-8 chocando con el léxico
`registro.md`/`delta.md` de la curación. Ambos ficheros son **territorio
prohibido** para este WP (carril D) y están **intactos** entre `dc70cec` y mi
tip (`git diff dc70cec HEAD -- …` = 0 líneas). Introducidos por `ca698d0`
(wp U202). Arreglo natural: una excepción de clase en
`scripts/gates/exceptions.mjs` como la que ya existe para `parte-kit`
(`exceptions.mjs:250-255`), decisión del owner de carril D / del gate. Este
rojo arrastra también `npm run test:gates` (1 de 23).

---

## 5 · Incidente de proceso (importante para el orquestador)

**La pila de `git stash` es compartida entre todos los worktrees del mismo
repositorio.** Durante la verificación hice `git stash push` para reproducir
B1 sobre la base. En esa ventana:

- mi stash `610c787f` («On wp/u180-catalogo-ola1: u180-wip») fue **consumido
  por el worker de `wp/u194-allowlist-contrato`** (worktree `C:/S_LAB/wt/z-u194`);
- mi `git stash pop` recibió a cambio **el stash de U194** `2fbe966a` («On
  wp/u194-allowlist-contrato: u194-tmp», hecho con `-u`), que apareció en mi
  worktree como `socket-server/src/{config,index}.mjs`,
  `socket-server/types/index.d.ts` + los no rastreados
  `socket-server/src/relay-contract.mjs` y `socket-server/test/relay-contract.test.mjs`.

**Acciones tomadas (todas dentro de mi worktree):**

1. Copia de seguridad del material de U194 en el scratchpad de sesión
   (`u194-tracked.patch` + los 2 ficheros nuevos).
2. Mi worktree devuelto a limpio de material ajeno (`git checkout --` de los 3
   rastreados, borrado de los 2 no rastreados).
3. **Stash de U194 devuelto a la pila compartida**: `git stash store 2fbe966a…`
   → hoy es `stash@{0}` con mensaje
   «On wp/u194-allowlist-contrato: u194-tmp (restaurado por worker U180 tras
   colisión de pila de stash compartida entre worktrees)».
4. Mi obra recuperada del commit colgante `610c787f` y **commiteada de
   inmediato** (`b80741b`); `package-lock.json` (que `npm install` había tocado)
   quedó deliberadamente fuera del commit.

**Riesgo abierto que NO puedo cerrar desde aquí**: el worktree
`C:/S_LAB/wt/z-u194` probablemente contiene **mis** cambios de U180
(`catalog.mjs`, `ciudad-lifecycle/src/server.mjs`, `orchestrator.mjs`,
`catalog.test.mjs`) aplicados sobre su rama. Su worker debe descartarlos antes
de commitear. Shas para la trazabilidad: **mío `610c787f`**, **suyo
`2fbe966a`** (ambos siguen existiendo como objetos colgantes).

**Regla que este mundo debería asentar**: en swarm multi-worktree,
`git stash` está prohibido (la pila es del repositorio, no del worktree). Para
aparcar obra: rama temporal, `git worktree` propio o copia fuera del árbol.

---

## 6 · Observaciones (visto mal fuera del alcance, no tocado)

- **O1 · `matriz-51` miente en la celda `health` de las entradas
  `kind:'service'`.** `scripts/gates/matriz-51.mjs:578` escribe siempre
  `'/mcp/health' vía catálogo`, ignorando `entry.healthPath`. Para
  `@zeus/socket-server` (y `cache-browser`, `firehose-browser`) el health real
  es `/health` (`socket-server/src/http-app.mjs:20`). No falla el gate, pero la
  matriz publica un dato falso. Owner: U233.
- **O2 · `DEFAULT_CAPABILITY_MAP` se quedó atrás.** `capability-map.mjs:12-26`
  no mapea `fleet.launcher` (U234) ni las de las entradas `kind:'service'`, ni
  las nuevas `fleet.ciudadLifecycle` / `city.lifecycle`. `resolveCapability`
  responde «Unknown capability» para todas. No lo añado por simetría con U234
  (que tampoco lo hizo) y para no ampliar alcance. Owner natural: U184/U217.
- **O3 · `socket-server/src/config.mjs:29-34` no llama a `loadZeusEnv()`.** Lee
  `process.env.ZEUS_PORT_SCRIPTORIUM` en crudo, mientras el catálogo resuelve
  con `resolveZeusUiPorts()` (que sí carga el `.env` de raíz). Un override
  puesto sólo en el `.env` haría divergir catálogo y bind — exactamente el
  defecto que este WP corrigió en `ciudad-lifecycle`. **No lo toco: fichero
  caliente de §2** (U192 · U194 · U187). Owner: U194.
- **O4 · `ZEUS_STOP_SERVICES` (`presets-sdk/src/env/index.mjs:456-475`) no
  incluye `ciudad-lifecycle` ni `mcp-launcher`.** El escape de parada del
  operador no cubre las dos entradas MCP más nuevas. Fichero caliente con owner
  U227; se cita, no se prescribe.
- **O5 · literales de puerto en `ciudad-lifecycle/src/catalog-extend.mjs`**
  (`portHint` 3004/5001/8000/3006/3007/8007, líneas :113 :130 :147 :164 :181
  :198 y su espejo en `ARBOL_F1`). Son hojas de ciudad externas sin slot en
  `presets-sdk/env`. Fichero caliente U216/U217; se anota.
- **O6 · `npm audit`**: la instalación reportó paquetes deprecados con CVE
  conocidos (`next@14.2.26`, `tar@6.2.1`, `glob@10.5.0`…). Cola de U239.

---

## 7 · Lo que NO hice y por qué

| no hecho | por qué |
| --- | --- |
| Añadir `ciudad-lifecycle` a los perfiles `minimo` / `v1-zeus` | La composición de perfiles la fija U234 con desvío razonado ya aceptado. El encargo es catálogo, no perfiles. Entra en `all` por construcción, y así queda declarado en la cabecera. |
| Declarar `deps` reales de `ciudad-lifecycle` | Es el objeto de **U184** (`GOBIERNO-EJECUCION-F2.md:71-76`). Se deja `deps: []` como el resto del seed, anotado en el `notes` de la entrada. |
| Editar `presets-sdk/src/env/index.mjs` | Fichero caliente, owner de edición **U227** (§2). El slot que necesitaba ya estaba. |
| Editar `ciudad-lifecycle/src/catalog-extend.mjs` | Fichero caliente, owner **U216→U217** (§2). |
| Editar `socket-server/src/config.mjs` (defecto O3) | Fichero caliente, owner **U192/U194/U187** (§2). |
| Arreglar B1 en `orchestrator.mjs` | Defecto preexistente de U234, no causado por esta alta; arreglarlo sería contrabando en obra ajena ya aceptada. Diagnóstico + parche de una línea entregados arriba. |
| Arreglar B2 (`two-games` en carril D) | Territorio **prohibido** por el encargo. |
| `plan/BACKLOG.md`, estados, merge, push | El worker no marca estados ni replanifica (§6). Sin merge a `main`, sin push, sin reescritura de historia. |
| Añadir `ciudad-lifecycle` a `DEFAULT_CAPABILITY_MAP` | Ver O2: fuera de alcance y sin precedente en U234. |

---

## 8 · Reproducción (orden exacto)

```bash
cd C:/S_LAB/wt/z-u180
npm install --prefer-offline --no-audit --no-fund      # 2698 paquetes, 7m, exit 0

npm test -w @zeus/mcp-launcher                          # 20 pass · 0 fail · 1 skip
npm test -w @zeus/ciudad-lifecycle                      # 15 pass · 0 fail
node scripts/gates/matriz-51.mjs                        # 51/51 · 0 fallos · EXIT 0
node -e "import('./scripts/gates/scan.mjs').then(m=>console.log(m.scanHardcodedPorts().length))"   # 0

node packages/mesh/mcp-launcher/src/orchestrator.mjs start  ciudad-lifecycle   # 200 · EXIT 0
node packages/mesh/mcp-launcher/src/orchestrator.mjs health ciudad-lifecycle   # EXIT 0
node packages/mesh/mcp-launcher/src/orchestrator.mjs status ciudad-lifecycle   # running
node packages/mesh/mcp-launcher/src/orchestrator.mjs stop   ciudad-lifecycle   # residues 0

node packages/mesh/mcp-launcher/src/orchestrator.mjs start  socket-server      # 200 · EXIT 0
node packages/mesh/mcp-launcher/src/orchestrator.mjs stop   socket-server      # EXIT 1 · ver B1
npm run stop:services -- "limpieza" socket-server                              # sí lo mata

node packages/mesh/mcp-launcher/src/orchestrator.mjs start minimo && \
node packages/mesh/mcp-launcher/src/orchestrator.mjs stop  minimo              # 4/4 · residues 0
```
