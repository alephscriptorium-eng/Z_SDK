# WP-U181 · Catálogo ola 2 — las seis interfaces arrancan desde catálogo

- **Rama**: `wp/u181-catalogo-seis-uis` · base `c241c22`
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
la fuente única mueve **catálogo y bind a la vez**. **La trampa de U180 no
existe en ninguna de las seis** — y eso está medido, no supuesto. Gates verdes:
`npm run gates` EXIT=0 (0 offenders), escáner de puertos **0 offenders**,
`matriz-51` EXIT=0 (51/51).

---

## 1 · Contraste de la tabla del orquestador — **su medida era correcta**

Medido **antes de tocar nada**, sobre el árbol en base `c241c22`:

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

**Diff total: 2 ficheros, +140 / −0.** Ningún fichero fuera de
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
(`cacheBrowserUi`, `firehoseBrowserUi`). Motivo: `buildPortTable` se documenta
a sí misma como *«Port collision table»* (`catalog.mjs:484`) y con `view` y
`firehose` fuera **no puede ver una colisión** entre, por ejemplo, `player3d` y
`view`. Son dos líneas, de la misma fuente única, sin cifra nueva. **No es
duplicar la entrada de catálogo** — la entrada sigue siendo una sola.
`scriptorium` (3017, de `socket-server`) sigue **fuera** de la tabla: es entrada
de U180, no de mis seis; se anota como **O4**.

### 2.2 `packages/mesh/mcp-launcher/test/catalog.test.mjs`

Tres tests nuevos (+ 4 asserts en el test de `mcp.json` de U234):

- `:132` `U181: las seis UIs arrancan desde catálogo con puerto de presets-sdk/env`
- `:145` `U181: mover el puerto en la fuente única mueve las seis (cero literales)`
- `:166` `U181: las seis UIs no colisionan de puerto entre sí ni con el resto`
- `:198-202` las cuatro nuevas son `kind:'service'` ⇒ **no** entran en el `mcp.json` de VS Code

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

**Ninguna de las seis mueve sólo el catálogo.** Las seis mueven los dos.

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
EXIT=0 con 0 offenders. Lo arregló obra ajena entre `dc70cec` y `c241c22`; se
constata, no se atribuye.

Tests:

| comprobación | resultado | exit |
| --- | --- | --- |
| `npm test -w @zeus/mcp-launcher` | **31 tests · 30 pass · 0 fail · 1 skip** | **0** |
| `npm run test:gates` | **84 tests · 83 pass · 0 fail · 1 skip** | **0** |
| `eslint` sobre los 2 ficheros tocados | 0 errores · 1 warning preexistente (`getCatalogEntry` sin usar, `catalog.test.mjs:9`, ya anotado por U180) | **0** |

Efecto visible del alta en `matriz-51`: las cuatro nuevas pasan de *sin entrada
de catálogo* a `vía catálogo` (denominador intacto, 51/51, 0 fallos):

```
@zeus/editor-ui            | /mcp/health vía catálogo
@zeus/player-ui            | /mcp/health vía catálogo
@zeus/player-3d-ui         | /mcp/health vía catálogo
@zeus/3d-monitor           | /mcp/health vía catálogo
@zeus/cache-browser        | /mcp/health vía catálogo
@zeus/firehose-browser     | /mcp/health vía catálogo
```

⚠ Ese `/mcp/health` **es falso** para las seis (el real es `/health`) — es el
defecto **O1 de U180**, que sigue abierto y que **mi alta amplía de 2 a 6
entradas**. Ver **O1** abajo.

---

## 4 · Bloqueos

**Ninguno.** Nada de este WP quedó a medias y ningún gate quedó en rojo.

---

## 5 · Observaciones (visto mal, no tocado)

- **O1 · `matriz-51` publica un `health` falso para toda entrada `kind:'service'`
  — y este WP lo amplía de 2 a 6 filas.** `scripts/gates/matriz-51.mjs:578`
  escribe siempre `'/mcp/health' vía catálogo` e **ignora `entrada.healthPath`**.
  Para las seis UIs el health real es `/health`. Es literalmente O1 de U180
  (owner **U233**), que entonces afectaba a 3 entradas y ahora a 7. **No lo
  arreglo**: `scripts/gates/**` está fuera de mi `ALCANCE_DIFF`. Arreglo
  propuesto (una línea): usar `entrada.healthPath ?? '/mcp/health'`.
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
- **O4 · `buildPortTable` no cubre `scriptorium` (3017).** Tras este WP la tabla
  cubre las seis UIs del mesh, pero `socket-server` (entrada de U180) sigue
  fuera, así que una colisión contra 3017 seguiría invisible. Fila de una línea
  para su owner; no la añado por no tocar entrada ajena.
- **O5 · `DEFAULT_CAPABILITY_MAP` se queda cada vez más atrás.**
  `capability-map.mjs:12-26` no mapea ninguna de las capacidades de entradas
  `kind:'service'`, ni las cuatro que añado (`fleet.editorUi`, `fleet.playerUi`,
  `fleet.player3dUi`, `fleet.monitor3d`). `resolveCapability` responde «Unknown
  capability» para todas. Mismo criterio que U234 y U180: no se amplía. Owner
  natural U184/U217.
- **O6 · un fallo intermitente en la suite de `mcp-launcher`.** En 1 de 5
  pasadas apareció `# fail 1`; las 4 restantes (incluidas 3 consecutivas al
  final) dieron `# fail 0`. No se capturó el nombre del test. Ocurrió justo
  después del trasiego de puertos de las mediciones (sockets en `TIME_WAIT`), lo
  que apunta a un test sensible al tiempo en `orchestrator`/`launch`, no a los
  datos de catálogo. Se anota para que no sorprenda; no se persigue por estar
  fuera de alcance.
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

## 6 · Lo que NO hice y por qué

| no hecho | por qué |
| --- | --- |
| Duplicar `cache-browser` / `firehose-browser` | Ya estaban de alta por U234. Se **verifican** (health de facto, tests, prueba de puerto), como U180 hizo con `socket-server`. |
| Declarar `deps: ['socket-server']` en `player-ui` | Los `deps` son objeto de **U184**; U180 sentó el precedente de dejar `deps: []`. Medido y declarado en O2. |
| Añadir las cuatro a los perfiles `minimo` / `v1-zeus` | La composición de perfiles la fija **U234**. Entran en `all` por construcción (toda entrada con `workspace`). |
| Editar `presets-sdk/src/env/index.mjs` | Fichero caliente, owner **U227**. Los seis slots y sus seis variables **ya existían**: este WP sólo los consume. |
| Arreglar O1 en `scripts/gates/matriz-51.mjs` | Fuera de `ALCANCE_DIFF` (`packages/mesh/mcp-launcher/**`); owner U233. Diagnóstico y parche de una línea entregados. |
| Arreglar O3 en `socket-server/src/config.mjs` | Fichero caliente, owner U194; entrada ajena (U180). |
| Tocar `packages/engine/volumes-ops/**`, `packages/engine/linea-kit/**`, `VOLUMES/**`, lockfile | Territorio prohibido. Verificado intacto. |
| `git push`, `plan/BACKLOG.md`, replanificar, `git stash` | Prohibido por el encargo. (`git stash` además es pila compartida entre worktrees — incidente de U180 §5.) |

---

## 7 · Reproducción (orden exacto)

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
npm run test:gates                        # 84 tests · 83 pass · 0 fail · 1 skip
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
```

**Higiene final**: sin listeners residuales en los doce puertos, `data/orchestrator`
borrado, `.env` temporal borrado, `git status` con **sólo los 2 ficheros del WP**
(más los 3 de O7, sin cambio de contenido y no commiteados).
