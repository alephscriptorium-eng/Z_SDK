# WP-U181 · Catálogo ola 2 — las seis interfaces arrancan desde catálogo

- **Rama**: `wp/u181-catalogo-seis-uis` · base **`b45e7fe`**
- **Worktree**: `C:\S_LAB\wt\z-u181` (canónico `C:\S_LAB\v-sdk` no tocado)
- **Alcance**: `packages/mesh/mcp-launcher/**` + lectura (no edición) del env de las seis UIs
- **Fecha de ejecución**: 2026-08-02

---

## 0 · Resultado en una línea

Las seis interfaces arrancan hoy desde el catálogo con el puerto resuelto por
`presets-sdk/env`: **cuatro altas nuevas** (`editor-ui`, `player-ui`,
`player-3d-ui`, `3d-monitor`) y **dos verificadas sin duplicar**
(`cache-browser`, `firehose-browser`). Las seis dan **health 200 de facto**,
**cero `⏳`**. La prueba de punta a punta pasa en las seis: mover el puerto en
la fuente única mueve **catálogo y bind a la vez** (con un valor bien formado —
acotación medida en **O8**). **La trampa de U180 no existe en ninguna de las
seis** — y eso está medido, no supuesto. Gates verdes: `npm run gates` EXIT=0
(0 offenders), escáner de puertos **0 offenders**, `matriz-51` EXIT=0 (51/51).

⚠ **Pero el alta causa una regresión documental que hay que leer antes de
aceptar: `matriz-51` pasa a publicar `tipo: MCP` para cuatro UIs sin superficie
MCP (filas MCP 12 → 16), y ningún gate lo ve.** Está en **§4 · R1**, con la
medida contra la base y enrutada a U233. Un documento versionado
(`plan/MATRIZ-RUNTIME-51.md`) queda además contradiciendo al árbol: **O1**.

---

## 1 · Contraste de la tabla del orquestador — **su medida era correcta**

Medido **antes de tocar nada**, sobre el árbol en base `b45e7fe`:

```
node -e "import('./packages/mesh/mcp-launcher/src/catalog.mjs').then(m=>{
  const c=m.resolveCatalog();
  for (const id of ['editor-ui','player-ui','player-3d-ui','3d-monitor','cache-browser','firehose-browser'])
    console.log(id.padEnd(20), c.some(e=>e.id===id)?'SI':'NO');})"
```
```
editor-ui            NO
player-ui            NO
player-3d-ui         NO
3d-monitor           NO
cache-browser        SI
firehose-browser     SI
```

Catálogo base: **19 entradas** (`total: 19`), como decía el encargo. O sea:
**cuatro altas, no seis**. La tabla del orquestador se confirma **entera, sin
correcciones**.

### 1.1 Una corrección que sí hay que hacer: el nombre de la variable

El encargo dice «fijar `ZEUS_MCP_<UI>=<puerto raro>`». **Para estas seis la
variable no es `ZEUS_MCP_*` sino `ZEUS_PORT_*`**: las seis viven en el bloque
**UI mesh** (`DEFAULT_ZEUS_UI_MESH`, `presets-sdk/src/env/index.mjs:72-92`), no
en el bloque MCP. Sus overrides son `UI_PORT_ENV`
(`presets-sdk/src/env/index.mjs:95-109`) y están documentados en
`.env.example:11-16`. `ZEUS_MCP_*` sí era lo correcto para `ciudad-lifecycle`
(U180), que es MCP. La prueba de CA-2 se ejecutó con el nombre real.

| UI | id de catálogo | slot UI mesh | variable | defecto |
| --- | --- | --- | --- | --- |
| `editor-ui` | `editor-ui` | `editor` | `ZEUS_PORT_EDITOR` | 3012 |
| `player-ui` | `player-ui` | `player` | `ZEUS_PORT_PLAYER` | 3013 |
| `player-3d-ui` | `player-3d-ui` | `player3d` | `ZEUS_PORT_PLAYER_3D` | 3018 |
| `3d-monitor` | `3d-monitor` | `debug3d` | `ZEUS_PORT_DEBUG_3D` | 3019 |
| `cache-browser` | `cache-browser` | `view` | `ZEUS_PORT_VIEW` | 3015 |
| `firehose-browser` | `firehose-browser` | `firehose` | `ZEUS_PORT_FIREHOSE` | 3016 |

---

## 2 · Qué se tocó (ruta:línea)

**Diff total: 3 ficheros, +161 / −2** (contra la base `b45e7fe`). Ningún fichero fuera de
`packages/mesh/mcp-launcher/**`. Lockfile intacto. `VOLUMES/**` intacto.
`packages/engine/volumes-ops/**` y `packages/engine/linea-kit/**` intactos.

### 2.1 `packages/mesh/mcp-launcher/src/catalog.mjs`

| líneas | cambio |
| --- | --- |
| `:284-343` | **cuatro entradas nuevas** en `CATALOG_SEED`, todas con `kind:'service'`, `healthPath:'/health'`, `mcpPath:'/'`, `deps: []` y `uiPort` apuntando a su slot del UI mesh. Patrón idéntico al que U234 usó para `cache-browser`/`firehose-browser` y al que U180 siguió para `ciudad-lifecycle`. |
| `:493-499` | `buildPortTable`: filas `playerUi`, `player3dUi`, `monitor3dUi`, `cacheBrowserUi`, `firehoseBrowserUi` (`editorUi` ya estaba). |

**No hay `portsById` que tocar**: las entradas con `uiPort` resuelven por
`ui[entry.uiPort].port` en `resolveCatalog` (`catalog.mjs:395`), no por
`portsById`. Por eso el alta es puramente declarativa y **no introduce ninguna
cifra**.

**Desviación declarada** (una, y la digo): además de las 4 filas que el encargo
pide en `buildPortTable`, añadí las **2 de las UIs que ya estaban de alta**
(`cacheBrowserUi`, `firehoseBrowserUi`).

**Motivo — corregido.** En la entrega anterior justifiqué esto diciendo que sin
`view`/`firehose` la tabla «no puede ver una colisión». **Ese argumento era
falso** y lo retiro: `buildPortTable`/`PORT_TABLE` **no detectan colisiones en
ningún punto del repo** (ver **O4**). El motivo verdadero es más modesto y es el
que vale: la tabla es la **superficie documental** que el launcher publica como
recurso MCP `launcher://ports` (`launcher-server.mjs:63-66`), y publicaba 1 de las
6 UIs del mesh. Con las 6 el documento deja de estar sesgado. Son dos líneas, de
la misma fuente única, sin cifra nueva, y **no duplican la entrada de catálogo**
—la entrada sigue siendo una sola—. `scriptorium` (3017, de `socket-server`)
sigue **fuera**: es entrada de U180, no de mis seis.

### 2.2 `packages/mesh/mcp-launcher/test/catalog.test.mjs`

Tres tests nuevos (+ 4 asserts en el test de `mcp.json` de U234):

- `:137` `U181: las seis UIs arrancan desde catálogo con puerto de presets-sdk/env`
- `:155` `U181: mover el puerto en la fuente única mueve las seis (cero literales)`
- `:176` `U181: las seis UIs no colisionan de puerto entre sí ni con el resto`
- `:215-218` las cuatro nuevas son `kind:'service'` ⇒ **no** entran en el `mcp.json` de VS Code

**El assert `notEqual(table.firehose, table.firehoseBrowserUi)` (`:203`) no es
adorno — cierra una confusión que muerde.** `ZEUS_MCP_FIREHOSE` **existe**
(`presets-sdk/src/env/index.mjs:61`) y mueve el **MCP firehose (3008)**, que es
otra pieza; la UI `firehose-browser` (3016) se mueve con `ZEUS_PORT_FIREHOSE`.
Es decir: seguir el enunciado del encargo al pie de la letra (`ZEUS_MCP_<UI>`)
no habría fallado con un error claro — **habría movido otro servicio**. Por eso
el test fija que los dos puertos son distintos y el comentario nombra las dos
variables.

**Corregida una fragilidad de mis propios tests**: comparaban contra el
**defecto crudo** (`DEFAULT_ZEUS_UI_MESH[…].port`) en vez de contra la
**resolución**. Eso los ponía rojos en cualquier máquina con un `ZEUS_PORT_*`
puesto — es decir, **siguiendo mis propias instrucciones de reproducción del
§8**. Ahora usan `resolveZeusUiPorts()`, y el test de tabla usa
`buildPortTable()` en vez de la instantánea congelada `PORT_TABLE` (ver **O9**).
Verificado en los dos estados:

```
$ node --test .../catalog.test.mjs                              # 13 tests · 13 pass · 0 fail
$ ZEUS_PORT_EDITOR=14012 ZEUS_PORT_PLAYER=14013 \
  ZEUS_PORT_DEBUG_3D=14019 node --test .../catalog.test.mjs     # mis 3 en verde
```

Bajo override queda **una** roja, y **no es mía ni la empeoro**: la preexistente
`port table documents firehose 3008 vs editor 3012` (`:36-41`), que asserta
`PORT_TABLE.editorUi === 3012` a mano. Comprobado que **ya fallaba igual en la
base** `b45e7fe` con el mismo override (`10 tests · 9 pass · 1 fail`). No la
toco: es de otro WP y arreglarla sería contrabando.

### 2.3 `packages/mesh/mcp-launcher/src/launcher-server.mjs`

`:63-66` — la `description` del recurso `launcher://ports` decía *«Final port table
including firehose 3008 and editor-ui 3012»*: dos cifras escritas a mano y una
enumeración que se quedó corta en cuanto el payload pasó a llevar 5 filas UI
más. Se sustituye por una descripción **sin cifras**, que nombra las seis UIs
del mesh y remite a `resolveZeus*Ports()` como valor vigente. Una cadena; cero
lógica.

---

## 3 · CA uno a uno

### CA-1 · Las seis arrancan desde catálogo — ✅ (4 altas + 2 verificadas)

Después del alta:

```
node -e "import('./packages/mesh/mcp-launcher/src/catalog.mjs').then(m=>{const c=m.resolveCatalog();...})"
```
```
total: 23
editor-ui          3012   service http://localhost:3012/health
player-ui          3013   service http://localhost:3013/health
player-3d-ui       3018   service http://localhost:3018/health
3d-monitor         3019   service http://localhost:3019/health
cache-browser      3015   service http://localhost:3015/health
firehose-browser   3016   service http://localhost:3016/health
```

19 → **23 entradas**. `status all` pasa de **15 a 19 filas** lanzables
(`{"total":19,"running":0,"stopped":19,"unhealthy":0}`); las 4 restantes del
catálogo siguen sin `workspace` (los player-MCP externos), como antes.

**Las dos existentes NO se duplicaron.** `cache-browser` y `firehose-browser`
conservan la entrada que les puso U234 (`catalog.mjs:258-283`); este WP sólo
las **verifica** (health de facto + tests + prueba de puerto), igual que U180
hizo con `socket-server`.

### CA-2 · Puerto por variable de entorno, cero literales — ✅ punta a punta en las seis

**Cero literales en el fichero que doy de alta:**

```
grep -rcE '\b(6[0-9]{4}|[1-9][0-9]{3,4})\b' packages/mesh/mcp-launcher/src/catalog.mjs
```
**salida: `0`.**

**Prueba de punta a punta** (la que pide el encargo). Para cada UI: puerto raro
por variable → se comprueba que **el catálogo apunta ahí Y el bind está ahí**, y
que **el puerto por defecto queda libre** (si sólo se moviera uno de los dos, el
defecto seguiría respondiendo).

Catálogo, con las seis variables a la vez:

```
ZEUS_PORT_EDITOR=14012 ZEUS_PORT_PLAYER=14013 ZEUS_PORT_VIEW=14015 \
ZEUS_PORT_FIREHOSE=14016 ZEUS_PORT_PLAYER_3D=14018 ZEUS_PORT_DEBUG_3D=14019 \
node -e "…resolveCatalog()…"
```
```
editor-ui          http://localhost:14012/health
player-ui          http://localhost:14013/health
player-3d-ui       http://localhost:14018/health
3d-monitor         http://localhost:14019/health
cache-browser      http://localhost:14015/health
firehose-browser   http://localhost:14016/health
```

Bind, entrada por entrada, vía el orquestador de U234
(`node packages/mesh/mcp-launcher/src/orchestrator.mjs start <id>`):

| UI | puerto raro | catálogo | health | `curl` raro | `curl` defecto | `stop` |
| --- | --- | --- | --- | --- | --- | --- |
| `editor-ui` | 14012 | 14012 | **200** | `{"status":"ok","service":"editor-ui",…}` | exit 7 (libre) | `residues: []` |
| `player-ui` | 14013 | 14013 | **200** | `{"status":"ok","service":"player-ui","role":"dj","room":"ARG_DELTA",…}` | exit 7 (libre) | `residues: []` |
| `player-3d-ui` | 14018 | 14018 | **200** | `{"status":"ok","service":"player-3d-ui","three":true,…}` | exit 7 (libre) | `residues: []` |
| `3d-monitor` | 14019 | 14019 | **200** | `{"status":"ok","service":"3d-monitor","three":true,"views":[…],…}` | exit 7 (libre) | `residues: []` |
| `cache-browser` | 14015 | 14015 | **200** | `{"status":"ok","service":"cache-browser",…}` | exit 7 (libre) | `residues: []` |
| `firehose-browser` | 14016 | 14016 | **200** | `{"status":"ok","service":"firehose-browser",…}` | exit 7 (libre) | `residues: []` |

Salida literal del caso `editor-ui`, con `netstat` como testigo del bind real:

```
$ ZEUS_PORT_EDITOR=14012 node .../orchestrator.mjs start editor-ui
      "ports": [ 14012 ],
      "health": [ { "id": "editor-ui", "port": 14012,
                    "healthUrl": "http://localhost:14012/health",
                    "ok": true, "statusCode": 200,
                    "body": { "status": "ok", "service": "editor-ui", … } } ]
EXIT=0

$ curl -s http://localhost:14012/health
{"status":"ok","service":"editor-ui","timestamp":"2026-08-02T00:54:03.142Z"}
$ curl -s http://localhost:3012/health
(curl exit=7)                       ← el defecto ya no responde: el bind se movió

$ netstat -ano | grep -E ":(14012|3012)\s"
  TCP    [::1]:14012            [::]:0                 LISTENING       34596
                                    ← nada en 3012
```

**Ninguna de las seis mueve sólo el catálogo: las seis mueven los dos —
mientras el valor sea un puerto bien formado.** La acotación no es retórica:
sólo se probó con valores válidos, y fuera de ese rango la afirmación es falsa.
Ver **O8**, donde está medido el contraejemplo (`ZEUS_PORT_EDITOR=0`) y la
precedencia `.env` vs proceso.

### CA-3 · La trampa de U180 (leer el puerto sin cargar el `.env` de raíz) — ✅ medida en las seis, **no existe en ninguna**

**Por qué no existe (mecanismo, ruta:línea).** Las seis resuelven su puerto por
el mismo camino: `src/config.mjs` → `createAppConfig({ appId, defaultPort })`
(`packages/engine/app-shell/src/create-app-config.mjs:237`) →
`resolveRuntimeConfig` (`:175`), que en `:176` llama **`loadZeusEnv()`** y en
`:184` `resolveAppPort(appId, …)`. `resolveAppPort`
(`presets-sdk/src/env/index.mjs:259`) busca en `APP_PORT_ENV` (= `UI_PORT_ENV` +
`debug`, `:112`) y termina en `readEnvPort`, que **vuelve a cargar el `.env` de
raíz** (`:169-175`). Los seis `appId` (`editor`, `player`, `player3d`,
`debug3d`, `view`, `firehose`) son claves de `UI_PORT_ENV`. Es exactamente lo
que le faltaba a `ciudad-lifecycle` antes de U180.

**Pero el encargo pide medirlo, no leerlo.** Medición: se escribió un `.env` en
la raíz del worktree (`.env` está en `.gitignore:74`, no ensucia el diff) con
los seis overrides, y se arrancó cada UI **sin pasar ninguna variable por el
proceso**. Si alguna leyera su puerto sin cargar el `.env`, su bind se quedaría
en el defecto mientras el catálogo apunta al raro — la discrepancia silenciosa.

```
$ node -e "import('@zeus/presets-sdk/env').then(m=>console.log(m.MONOREPO_ROOT))"
C:\S_LAB\wt\z-u181                       ← el .env que se carga es el de este worktree

$ node .../orchestrator.mjs start <id>   # sin ninguna variable en la línea
```

| UI | catálogo (sólo `.env`) | bind real | defecto | ¿discrepancia? |
| --- | --- | --- | --- | --- |
| `editor-ui` | 14012 | 200 en 14012 | libre | **no** |
| `player-ui` | 14013 | 200 en 14013 | libre | **no** |
| `player-3d-ui` | 14018 | 200 en 14018 | libre | **no** |
| `3d-monitor` | 14019 | 200 en 14019 | libre | **no** |
| `cache-browser` | 14015 | 200 en 14015 | libre | **no** |
| `firehose-browser` | 14016 | 200 en 14016 | libre | **no** |

Salida literal (extracto, las seis en la misma pasada):

```
######## editor-ui — solo .env de raiz (nada por proceso) ########
          "port": 14012,
          "healthUrl": "http://localhost:14012/health",
          "statusCode": 200,
bind real -> {"status":"ok","service":"editor-ui","timestamp":"2026-08-02T00:58:41.850Z"}
defecto 3012 -> libre (ok)
  "residues": []
…
######## firehose-browser — solo .env de raiz (nada por proceso) ########
          "port": 14016,
          "healthUrl": "http://localhost:14016/health",
          "statusCode": 200,
bind real -> {"status":"ok","service":"firehose-browser","timestamp":"2026-08-02T00:59:35.446Z"}
defecto 3016 -> libre (ok)
  "residues": []
```

El `.env` temporal se borró al terminar (`rm -f .env`), y se comprobó que no
quedaba ningún listener en los doce puertos implicados.

**Conclusión honesta**: aquí no había nada que arreglar. El defecto que U180
encontró en `ciudad-lifecycle` (lectura cruda de `process.env`) **no se repite**
en ninguna de las seis porque todas pasan por `createAppConfig`. Lo que sí
sigue teniéndolo es `socket-server` — **O3 de U180, sigue abierto**, ver **O3**
abajo.

### CA-4 · `health` de facto por entrada — ✅ las seis, **cero `⏳`**

Las seis exponen `GET /health` y **las seis respondieron 200 ejecutadas**, no
declaradas. Cuerpos literales (del arranque en puerto por defecto y en puerto
raro, idénticos salvo timestamp):

```
editor-ui         {"status":"ok","service":"editor-ui","timestamp":"…"}
player-ui         {"status":"ok","service":"player-ui","role":"dj","room":"ARG_DELTA","timestamp":"…"}
player-3d-ui      {"status":"ok","service":"player-3d-ui","three":true,"timestamp":"…"}
3d-monitor        {"status":"ok","service":"3d-monitor","three":true,"views":["default","ecosystem","flux","gamemap","bots-log"],"timestamp":"…"}
cache-browser     {"status":"ok","service":"cache-browser","timestamp":"…"}
firehose-browser  {"status":"ok","service":"firehose-browser","timestamp":"…"}
```

Ruta del handler en cada paquete: `editor-ui/src/server.mjs:92`,
`player-ui/src/server.mjs:601`, `player-3d-ui/src/server.mjs:98`,
`3d-monitor/src/server.mjs:96`, `cache-browser/src/server.mjs:101`,
`firehose-browser/src/server.mjs:99`.

**Nada queda en `⏳`.** Pero dos de las seis **no arrancan solas**, y eso se dice
con nombre y ruta (es lo que el encargo pide que no quede en silencio):

**(a) `player-ui` exige el runtime scriptorium arriba — dependencia real no
declarada.** Con `socket-server` parado, `start player-ui` **falla**:

```
$ ZEUS_PORT_PLAYER=14013 node .../orchestrator.mjs start player-ui
  "ok": false,
  "error": "health_fallida_tras_spawn",
        "id": "player-ui", "port": 14013, "ok": false, "error": "fetch failed"
    "Error: [player-ui-dj-default] connect timeout after 10000ms",
    "npm error path C:\\S_LAB\\wt\\z-u181\\packages\\mesh\\player-ui"
```

Causa exacta: `packages/mesh/player-ui/src/server.mjs:760` hace
`await createDjTransport(...)` **antes** del `httpServer.listen(port, host, …)`
de `:793`. El transporte DJ se une a la room del runtime
(`player-ui/src/dj-transport.mjs:42`, `createClient(user, { room, url: cfg.url })`)
y el timeout sale de `packages/engine/rooms/src/index.mjs:87`. Si el runtime no
está, el proceso muere **sin llegar a bindear**. Con `socket-server` arriba,
arranca y da 200 (fila de CA-2). **No es un problema de puerto ni lo introduce
este WP**: es una `deps` que hoy está vacía. Los `deps` reales son objeto de
**U184** (igual que U180 dejó `deps: []` en `ciudad-lifecycle`), así que aquí
queda declarado, no inventado: **`player-ui` debería declarar
`deps: ['socket-server']`**.

**(b) `firehose-browser` exige `ZEUS_VOLUMES_ROOT`.** Corta antes del `listen`
en `packages/mesh/firehose-browser/src/server.mjs:68`
(`assertVolumesRootBootable({ service: 'firehose-browser', volumeIds: ['firehose'] })`,
política U200 ◆5, `presets-sdk/src/volumes/resolve.mjs:31-34`). Es la conducta
querida, no un defecto. En este worktree se midió con
`ZEUS_VOLUMES_ROOT=./VOLUMES` (el valor documentado en `.env.example:74`); el
directorio `VOLUMES/` **no se tocó**.

### CA-5 · Gates del repo verdes — ✅

```
$ node -e "import('./scripts/gates/scan.mjs').then(m=>console.log('offenders:', m.scanHardcodedPorts().length))"
offenders: 0

$ npm run gates
gates: OK (0 offenders)
EXIT=0

$ node scripts/gates/matriz-51.mjs
matriz-51: OK — 51/51 filas derivadas · 10 declaradas-sin-pieza visibles · 0 fallos
EXIT=0
```

**Nota sobre B2 de U180**: aquel WP dejó `npm run gates` en rojo por 3 offenders
`two-games` en `linea-kit`/`volumes-ops`. **Hoy ya no ocurre**: `gates` da
EXIT=0 con 0 offenders. Lo arregló obra ajena entre `dc70cec` y `b45e7fe`; se
constata, no se atribuye.

Tests:

| comprobación | resultado | exit |
| --- | --- | --- |
| `npm test -w @zeus/mcp-launcher` | **31 tests · 30 pass · 0 fail · 1 skip** | **0** |
| `npm run test:gates` | **84 tests · 84 pass · 0 fail** | **0** |
| `eslint` sobre los 3 ficheros tocados | 0 errores · 1 warning preexistente (`getCatalogEntry` sin usar, `catalog.test.mjs:9`, ya anotado por U180) | **0** |

Efecto visible del alta en `matriz-51`: las cuatro nuevas pasan de *sin entrada
de catálogo* a `vía catálogo` (denominador intacto, 51/51, 0 fallos):

```
@zeus/editor-ui            tipo= MCP | health= /mcp/health vía catálogo
@zeus/player-ui            tipo= MCP | health= /mcp/health vía catálogo
@zeus/player-3d-ui         tipo= MCP | health= /mcp/health vía catálogo
@zeus/3d-monitor           tipo= MCP | health= /mcp/health vía catálogo
@zeus/cache-browser        tipo= MCP | health= /mcp/health vía catálogo
@zeus/firehose-browser     tipo= MCP | health= /mcp/health vía catálogo
```

⚠ **Esa fila miente en las dos columnas**: ni el `tipo` es `MCP` (son
`kind:'service'`, sin superficie MCP) ni el health es `/mcp/health` (es
`/health`). La segunda columna es defecto heredado; **la primera la causo yo**.
Ver **§4 · R1** — es lo primero que hay que leer de este reporte.

---

## 4 · Regresión declarada

### R1 · Mi alta hace que `matriz-51` publique `tipo: MCP` para cuatro UIs sin superficie MCP

**Esto es una regresión que causé yo, no una observación heredada.** En la
entrega anterior declaré sólo la mitad del defecto (la columna `health`, O1 de
U180) y afirmé que el repo quedaba peor «en una columna». **Es en dos.**

**Mecanismo (ruta:línea).** `scripts/gates/matriz-51.mjs:472-474`:

```js
if (entrada) { tipo = { valor: 'MCP', evidencia: … }; }
```

La presencia en catálogo tiene **precedencia máxima** sobre la rama `UI` de
`:478` (el comentario de `:469` lo dice: *«tipo — precedencia: catálogo(MCP) >
desc/file MCP > UI > …»*). Es el **mismo `if`** cuya otra mitad —el `health` de
`:578`— sí vi. Di el defecto por conocido y no leí la condición entera.

**Medido**, restaurando el `catalog.mjs` de la base `b45e7fe` en el árbol y
volviendo a correr el gate:

| | base `b45e7fe` | con mi alta | Δ |
| --- | --- | --- | --- |
| filas `tipo: MCP` | **12** | **16** | **+4** |
| filas `/mcp/health` | **12** | **16** | **+4** |
| `@zeus/editor-ui` | `tipo: UI` | **`tipo: MCP`** | ✗ |
| `@zeus/player-ui` | `tipo: UI` | **`tipo: MCP`** | ✗ |
| `@zeus/player-3d-ui` | `tipo: UI` | **`tipo: MCP`** | ✗ |
| `@zeus/3d-monitor` | `tipo: UI` | **`tipo: MCP`** | ✗ |

**El gate es ciego a esto**: `matriz-51` da `OK — 51/51 · 0 fallos` **en los dos
estados**. No hay nada rojo que avise.

**Es contradicción interna de este propio WP**: `catalog.test.mjs:215-218`
afirma —y verifica— que las cuatro **no** entran en el `mcp.json` de VS Code
*precisamente porque no tienen superficie MCP* (`kind:'service'`,
`vscode-config.mjs:12`). La matriz dice lo contrario de lo que dice mi test.

**No lo arreglo, y la razón es técnica, no de alcance.** El `health` sería una
línea, pero el `tipo` no: exigiría que `parseSeedEntries`
(`scripts/gates/matriz-51.mjs:233`) **leyera `kind`**, que hoy ni siquiera
parsea. Parchear el síntoma desde fuera del gate sería carrera armamentística
contra su dueño.

**Enrutado a U233 como un único ítem** (no como dos observaciones sueltas):
> derivar **`tipo` y `healthPath` de `kind`** en `matriz-51`. Hoy `kind` no se
> parsea (`:233`), así que toda entrada de catálogo se publica como `MCP` con
> `/mcp/health`, sea o no un servicio HTTP sin superficie MCP. Afecta a las **7**
> entradas `kind:'service'` del catálogo (`socket-server` + las seis UIs).

Esto **subsume la O1 que declaré antes**; ya no se cuenta aparte.

---

## 5 · Bloqueos

**Ninguno.** Nada de este WP quedó a medias y ningún gate quedó en rojo. La
regresión R1 no rompe ningún gate — ese es justamente el problema.

---

## 6 · Observaciones (visto mal, no tocado)

- **O1 · un documento versionado pasa a contradecir al árbol por culpa de mi
  alta.** `plan/MATRIZ-RUNTIME-51.md` afirma, en las cuatro filas de las UIs que
  doy de alta, que **no** están en el catálogo, citando un grep como prueba:
  - `:91` `@zeus/editor-ui` — «no · grep `editor-ui` en catalog.mjs → 0»
  - `:97` `@zeus/3d-monitor` — «no · grep `3d-monitor` en catalog.mjs → 0»
  - `:112` `@zeus/player-3d-ui` — «no · grep → 0»
  - `:113` `@zeus/player-ui` — «no · grep → 0»

  **Re-medido al anotarlo** (no copiado del documento), base contra tip:

  ```
  for n in editor-ui player-ui player-3d-ui 3d-monitor; do
    grep -c "$n" packages/mesh/mcp-launcher/src/catalog.mjs; done
  ```
  | | base `b45e7fe` | con mi alta |
  | --- | --- | --- |
  | `editor-ui` | 0 | **4** |
  | `player-ui` | 0 | **4** |
  | `player-3d-ui` | 0 | **4** |
  | `3d-monitor` | 0 | **4** |

  (4 *líneas* por nombre = **1 entrada** de catálogo cada uno: `id`, `name`,
  `workspace`, `spawnGroup`. La afirmación honesta es «1 entrada», no «4».)

  **Ningún gate ve la caducidad**: `parseContraste`
  (`scripts/gates/matriz-51.mjs:355-386`) sólo extrae **nombres de pieza** para
  cuadrar el denominador 51/51; no lee la celda `catálogo`. Por eso el gate sigue
  verde con el documento diciendo lo contrario del árbol.

  **Declaro, no corrijo**: `plan/MATRIZ-RUNTIME-51.md` está fuera de mi
  `ALCANCE_DIFF` (que es `packages/mesh/mcp-launcher/**` + reporte en
  `plan/REPORTES/`). Va al **mismo dueño que R1, U233**, por ser el documento de
  contraste de su gate. Regla que esto ilustra: *una cita medida por grep
  caduca; o se re-mide al citarla, o se cita el gate que la sostiene.*
- **O2 · `player-ui` necesita `deps: ['socket-server']`.** Medido y reproducido
  (CA-4a). Se deja `deps: []` por simetría con todo el seed y porque los `deps`
  son objeto de **U184**. Es la única de las seis con dependencia dura de
  arranque; `player-3d-ui` y `3d-monitor`, pese a ser también clientes del
  runtime, **sí arrancan solos** (medido: 200 con `socket-server` parado) porque
  su conexión no bloquea el `listen`.
- **O3 · `socket-server/src/config.mjs` sigue sin llamar a `loadZeusEnv()`** —
  O3 de U180, **sigue abierto** (owner U194). Es la única pieza del entorno de
  estas seis donde la trampa del `.env` **sí** puede darse. No la toco: fichero
  caliente y entrada ajena.
- **O4 · `buildPortTable` no detecta colisiones en ningún sitio — y por tanto la
  justificación que di de mi desviación era falsa.** Ver §2.1: dije que sin
  `view`/`firehose` la tabla «no puede ver una colisión». **No es cierto**: se
  verificó que ni `buildPortTable` ni `PORT_TABLE` se consultan para detectar
  colisiones en **ningún** punto del repo — sus únicos consumidores son el
  recurso MCP `launcher://ports` (`launcher-server.mjs:63-66`) y el test
  `catalog.test.mjs:36-41`. Quien caza colisiones de verdad es el **barrido del
  catálogo** de mi test `:166`, que **no lee la tabla**. La tabla es documentación.
  Las dos filas siguen puestas (son inocuas, de la misma fuente, sin cifra
  nueva), pero con el argumento correcto. Y sigue faltando `scriptorium` (3017),
  que es entrada de U180 y no toco.
- **O5 · `DEFAULT_CAPABILITY_MAP` se queda cada vez más atrás.**
  `capability-map.mjs:12-26` no mapea ninguna de las capacidades de entradas
  `kind:'service'`, ni las cuatro que añado (`fleet.editorUi`, `fleet.playerUi`,
  `fleet.player3dUi`, `fleet.monitor3d`). `resolveCapability` responde «Unknown
  capability» para todas. Mismo criterio que U234 y U180: no se amplía. Owner
  natural U184/U217.
- **O6 · el intermitente tiene nombre y mecanismo determinista** (en la entrega
  anterior sólo pude decir «1 de 5 pasadas, no capturé el nombre»; queda
  cerrado). Fichero: `packages/mesh/mcp-launcher/test/intentional-stops-read.test.mjs`.
  Causa: **puertos fijos** `PORT_A = 19121` / `PORT_B = 19122` (`:16-17`) con
  `healthTimeoutMs: 10_000`; si algo ocupa el puerto, el test agota el health y
  cae. **Reproducido de forma determinista** ocupando `127.0.0.1:19121`:

  ```
  === suite con 19121 ocupado ===
  not ok 1 - intentionalStops: stop marks, launch clears, health tells truth
  not ok 2 - intentionalStops: crash without stop ≠ intentional
  # tests 2 · # pass 0 · # fail 2

  === suite con el puerto libre ===
  # tests 2 · # pass 2 · # fail 0
  ```

  (Con el puerto ocupado caen **las dos** pruebas del fichero, no sólo la
  segunda.) **Preexistente, no lo introduce este WP**: los puertos fijos están
  en la base. Mi hipótesis anterior —«sensible al tiempo, no a datos de
  catálogo»— era correcta, pero era hipótesis; esto es medida. **Arreglo**:
  `port: 0` + `server.address().port`, como ya hacen los paquetes hermanos.
  Dueño: el de la suite de `mcp-launcher` (**U234**).
- **O8 · `readEnvPort` acepta puertos que no son puertos — y ahí sí se rompe la
  promesa «catálogo y bind a la vez».** Es el contraejemplo que acota CA-2.
  `presets-sdk/src/env/index.mjs:169-175` sólo rechaza `''` y `NaN`; todo lo
  demás pasa:

  | valor | `readEnvPort` devuelve |
  | --- | --- |
  | `"0"` | `0` |
  | `"-1"` | `-1` |
  | `"65536"` | `65536` |
  | `"3.5"` | `3.5` |
  | `"0x10"` | `16` |
  | `"  "` (espacios) | `0` |
  | `"03012"` | `3012` |
  | `""` / `"abc"` | defecto (3012) |

  Vector medido de punta a punta con `ZEUS_PORT_EDITOR=0`:

  ```
  catálogo anuncia   -> port = 0 | healthUrl = http://localhost:0/health
  arranque real      -> "ok": false, "error": "health_fallida_tras_spawn", "fetch failed"
  bind real (directo)-> puerto real del bind = 56206 | catálogo anunciaba = 0
                        health en el real = 200
  ```

  Es exactamente «catálogo que anuncia un puerto donde no hay nadie». **Es
  MENOR** por dos razones medidas: la causa raíz es `readEnvPort`
  (**preexistente, dueño U227**), no mi alta; y **falla ruidosamente** — el
  orquestador devuelve `ok:false` y no deja residuo. Dos comportamientos más que
  quedaron contestados y no estaban escritos en ningún sitio:
  - **con `.env` y proceso a la vez gana el proceso** (`dotenv.config()` sin
    `override`): `.env=14012` + `ZEUS_PORT_EDITOR=15012` → catálogo **15012**.
  - **ceros a la izquierda y espacios cuelan**: `"03012"` → 3012, `"  "` → 0.
- **O9 · `PORT_TABLE` es una instantánea congelada, y mi alta la multiplica.**
  `catalog.mjs:514` hace `export const PORT_TABLE = buildPortTable()` **en el
  import**: no reacciona a cambios posteriores de entorno. Antes tenía 1 fila UI
  rancia (`editorUi`); ahora tiene **6**. Ya está marcada `@deprecated` en favor
  de `buildPortTable()`, y por eso mis tests llaman a la función y no a la
  constante. Preexistente; sólo se declara.
- **O7 · `npm install` marca tres ficheros como modificados sin cambio real.**
  Tras instalar, `git status` lista `packages/engine/feed-kit/bin/jetstream-sync.mjs`,
  `packages/engine/linea-kit/bin/linea-kit.mjs` y
  `packages/engine/playbook-kit/bin/run-playbook.mjs`. **No hay cambio de
  contenido**: `git hash-object` == `git ls-files -s` (p. ej.
  `ca6ad847fc45bd84a133e6adaf05ccbb527d8d95` para `linea-kit.mjs`) y
  `git diff --quiet` sale limpio en los tres. Es el `mtime` que toca npm más el
  aviso LF→CRLF. **No se commitean** (y `linea-kit` es además territorio
  prohibido: queda intacto). Conviene saberlo para no confundirlo con
  contrabando.

---

## 7 · Lo que NO hice y por qué

| no hecho | por qué |
| --- | --- |
| Duplicar `cache-browser` / `firehose-browser` | Ya estaban de alta por U234. Se **verifican** (health de facto, tests, prueba de puerto), como U180 hizo con `socket-server`. |
| Declarar `deps: ['socket-server']` en `player-ui` | Los `deps` son objeto de **U184**; U180 sentó el precedente de dejar `deps: []`. Medido y declarado en O2. |
| Añadir las cuatro a los perfiles `minimo` / `v1-zeus` | La composición de perfiles la fija **U234**. Entran en `all` por construcción (toda entrada con `workspace`). |
| Editar `presets-sdk/src/env/index.mjs` | Fichero caliente, owner **U227**. Los seis slots y sus seis variables **ya existían**: este WP sólo los consume. |
| **Arreglar R1** (`tipo: MCP` en `matriz-51`) | Razón **técnica**, no sólo de alcance: el `health` sería una línea, pero el `tipo` exige que `parseSeedEntries` (`matriz-51.mjs:233`) lea `kind`, que hoy no parsea. Parchearlo desde fuera sería carrera armamentística contra su dueño. Enrutado a **U233** como un solo ítem (`tipo` + `healthPath` derivados de `kind`). |
| **Corregir O1** (`plan/MATRIZ-RUNTIME-51.md` caducado en 4 filas) | Fuera de `ALCANCE_DIFF`. Re-medido al anotarlo (0 → 4 líneas) y enrutado al mismo dueño, **U233**, por ser el documento de contraste de su gate. |
| Arreglar O8 (`readEnvPort` acepta `0`, `-1`, `65536`, `3.5`, `"  "`) | Causa raíz preexistente en `presets-sdk/src/env/index.mjs:169-175`, fichero caliente con owner **U227**. Falla ruidosamente, no en silencio. |
| Arreglar O6 (puertos fijos 19121/19122 en la fixture) | Suite de otro WP (**U234**). Reproducido de forma determinista y entregado el arreglo (`port: 0` + `server.address().port`). |
| Arreglar la roja preexistente `catalog.test.mjs:36-41` bajo override | Es de otro WP y ya fallaba igual en la base. Tocarla sería contrabando. |
| Arreglar O3 en `socket-server/src/config.mjs` | Fichero caliente, owner U194; entrada ajena (U180). |
| Tocar `packages/engine/volumes-ops/**`, `packages/engine/linea-kit/**`, `VOLUMES/**`, lockfile | Territorio prohibido. Verificado intacto. |
| `git push`, `plan/BACKLOG.md`, replanificar, `git stash` | Prohibido por el encargo. (`git stash` además es pila compartida entre worktrees — incidente de U180 §5.) |

---

## 8 · Reproducción (orden exacto)

```bash
cd C:/S_LAB/wt/z-u181
npm install --prefer-offline --no-audit --no-fund

# 1 · contraste de la tabla (antes de tocar nada)
node -e "import('./packages/mesh/mcp-launcher/src/catalog.mjs').then(m=>{const c=m.resolveCatalog();
  console.log('total:',c.length);
  for (const id of ['editor-ui','player-ui','player-3d-ui','3d-monitor','cache-browser','firehose-browser'])
    console.log(id.padEnd(20), c.some(e=>e.id===id)?'SI':'NO');})"

# 2 · tests y gates
npm test -w @zeus/mcp-launcher            # 31 tests · 30 pass · 0 fail · 1 skip
npm run test:gates                        # 84 tests · 84 pass · 0 fail
npm run gates                             # gates: OK (0 offenders) · EXIT 0
node -e "import('./scripts/gates/scan.mjs').then(m=>console.log(m.scanHardcodedPorts().length))"   # 0
node scripts/gates/matriz-51.mjs          # 51/51 · 0 fallos · EXIT 0
grep -rcE '\b(6[0-9]{4}|[1-9][0-9]{3,4})\b' packages/mesh/mcp-launcher/src/catalog.mjs             # 0

# 3 · punta a punta, por UI (CA-2). player-ui exige socket-server arriba;
#     firehose-browser exige ZEUS_VOLUMES_ROOT.
export ZEUS_VOLUMES_ROOT=./VOLUMES
node packages/mesh/mcp-launcher/src/orchestrator.mjs start socket-server

ZEUS_PORT_EDITOR=14012    node packages/mesh/mcp-launcher/src/orchestrator.mjs start editor-ui
curl -s http://localhost:14012/health     # 200
curl -s http://localhost:3012/health      # exit 7 — el defecto quedó libre
ZEUS_PORT_EDITOR=14012    node packages/mesh/mcp-launcher/src/orchestrator.mjs stop  editor-ui
#   … ídem: ZEUS_PORT_PLAYER=14013 player-ui · ZEUS_PORT_PLAYER_3D=14018 player-3d-ui
#           ZEUS_PORT_DEBUG_3D=14019 3d-monitor · ZEUS_PORT_VIEW=14015 cache-browser
#           ZEUS_PORT_FIREHOSE=14016 firehose-browser

# 4 · la trampa del .env de raíz (CA-3): override SOLO en fichero, nada por proceso
cat > .env <<'EOF'
ZEUS_VOLUMES_ROOT=./VOLUMES
ZEUS_PORT_EDITOR=14012
ZEUS_PORT_PLAYER=14013
ZEUS_PORT_VIEW=14015
ZEUS_PORT_FIREHOSE=14016
ZEUS_PORT_PLAYER_3D=14018
ZEUS_PORT_DEBUG_3D=14019
EOF
node packages/mesh/mcp-launcher/src/orchestrator.mjs start editor-ui   # bind en 14012, 3012 libre
#   … las seis; después:
node packages/mesh/mcp-launcher/src/orchestrator.mjs stop socket-server
rm -f .env && rm -rf data/orchestrator
netstat -ano | grep -E ":(3012|3013|3015|3016|3017|3018|3019|1401[2356]|14018|14019)\s" | grep LISTENING   # ninguno

# 5 · R1 · la regresión de `tipo` en matriz-51, medida contra la base
git checkout b45e7fe -- packages/mesh/mcp-launcher/src/catalog.mjs
node scripts/gates/matriz-51.mjs --json | node -e "…contar tipo==='MCP'…"   # 12 · las cuatro = UI
node scripts/gates/matriz-51.mjs                                            # OK 51/51 · EXIT 0 (ciego)
git checkout HEAD -- packages/mesh/mcp-launcher/src/catalog.mjs
node scripts/gates/matriz-51.mjs --json | node -e "…contar tipo==='MCP'…"   # 16 · las cuatro = MCP

# 6 · O1 · la caducidad del documento de contraste, re-medida
for n in editor-ui player-ui player-3d-ui 3d-monitor; do
  grep -c "$n" packages/mesh/mcp-launcher/src/catalog.mjs; done   # 4 4 4 4 (en la base: 0 0 0 0)

# 7 · O8 · lo que readEnvPort acepta, y el vector de puerto 0
node -e "import('@zeus/presets-sdk/env').then(m=>{for (const v of ['0','-1','65536','3.5','0x10','  ','03012','','abc']){process.env.ZEUS_PORT_EDITOR=v;console.log(JSON.stringify(v),'->',m.readEnvPort('ZEUS_PORT_EDITOR',3012));}})"
ZEUS_PORT_EDITOR=0 node packages/mesh/mcp-launcher/src/orchestrator.mjs start editor-ui   # ok:false, fetch failed
#   precedencia: .env=14012 + ZEUS_PORT_EDITOR=15012 -> catálogo 15012 (gana el proceso)

# 8 · O6 · el intermitente, reproducido de forma determinista
node -e "require('net').createServer(()=>{}).listen(19121,'127.0.0.1')" &
node --test packages/mesh/mcp-launcher/test/intentional-stops-read.test.mjs   # 2 fail
#   con el puerto libre: 2 pass

# 9 · D4 · los tests ya no dependen del defecto crudo
ZEUS_PORT_EDITOR=14012 ZEUS_PORT_PLAYER=14013 node --test packages/mesh/mcp-launcher/test/catalog.test.mjs
#   mis 3 en verde; la única roja es la preexistente :36-41 (igual en la base)
```

**Higiene final**: sin listeners residuales en los doce puertos, `data/orchestrator`
borrado, `.env` temporal borrado, `git status` con **sólo los 3 ficheros del WP**
(más los 3 de O7, sin cambio de contenido y no commiteados).
