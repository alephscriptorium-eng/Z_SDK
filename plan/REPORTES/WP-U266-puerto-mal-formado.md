# WP-U266 · El puerto mal formado falla al arrancar y no se anuncia

- **Rama**: `wp/u266-puerto-mal-formado` · base **`52d63e6`**
- **Worktree**: `C:\S_LAB\wt\z-u266` (canónico `C:\S_LAB\v-sdk` no tocado)
- **Fecha de ejecución**: 2026-08-02
- **Preflight**: `identidad-raiz: PASS` · `world-real = git-toplevel = c:/s_lab/wt/z-u266`

---

## 0 · Resultado en una línea

`readEnvPort` valida ahora la **cadena cruda** (entero decimal 1..65535) y
**lanza** en vez de caer al defecto; y el catálogo **deja de tragarse** ese
error. Hacen falta las dos cosas: con sólo la primera, medido, el catálogo
anunciaba **4101** en verde con `ZEUS_MCP_SUN=0` — un falso verde peor que el
defecto original.

---

## 1 · La decisión de diseño, con el radio delante

### 1.1 · El radio, re-medido (la cifra del brief estaba mal)

El brief decía «11 llamadas dentro de `presets-sdk/src/env/index.mjs`». **Son
9.** Re-medido hoy sobre el árbol:

```bash
grep -n "readEnvPort(" packages/engine/presets-sdk/src/env/index.mjs | grep -v "export function"
#   :301 :318 :367 :375 :393 :414 :415 :416 :417   -> 9 call sites
grep -c "readEnvPort(" packages/engine/presets-sdk/src/env/index.mjs
#   10  = 9 call sites + 1 línea de la definición
```

(Las líneas se han desplazado respecto al brief —`:195 :212 :261 …`— porque el
bloque de precedencia y la guarda se insertaron por encima.)

| consumidor | qué es | cuántos |
| --- | --- | --- |
| `presets-sdk/src/env/index.mjs` | interno del propio módulo | **9** call sites |
| `packages/mesh/linea-firehose/src/config.mjs:12` | **único** consumidor de producción fuera de presets-sdk | 1 |
| `presets-sdk/test/env-canonical.mjs:33,38` | test | 2 asertos |
| `presets-sdk/src/index.mjs:60` + `src/env/index.d.ts` (`:31` en la base, `:59` ya con los tipos nuevos) | **API publicada** (valor y tipo) | — |

Comprobado con `rc` aparte (`grep … > /dev/null; echo $?`), no por tubería.

### 1.2 · ¿Dónde va la guarda? En las dos. Y no por gusto

La pregunta del brief («¿en `readEnvPort`? ¿en el catálogo? ¿en las dos?») la
decidió una **medición**, no una preferencia. Sonda: inyecté un `throw` dentro
de `readEnvPort` y miré qué veía el catálogo.

```bash
# sonda temporal en readEnvPort: if (String(raw) === '0') throw new Error('SONDA-U266')
ZEUS_MCP_SUN=0 node -e "import('./packages/mesh/mcp-launcher/src/catalog.mjs').then(m=>{
  const e=m.resolveCatalog().find(x=>x.id==='solar-sun');
  console.log('NO propago. port=',e.port);}).catch(err=>console.log('PROPAGO:',err.message))"
```

```
resolveCatalog NO propago.
  solar-sun port     = 4101   <-- el DEFECTO, no el 0 pedido
  solar-sun healthUrl= http://localhost:4101/mcp/health
```

`catalog.mjs` tenía **dos `catch` mudos** (`syncEnvPorts` / `syncUiPorts`) que
convertían cualquier fallo en «usa los puertos por defecto». Es decir:

> Una guarda **sólo** en `readEnvPort` habría **empeorado** el defecto. Hoy falla
> ruidosamente (`ok:false`, `fetch failed`); con la guarda a medias arrancaría
> **verde** escuchando en 4101 mientras el operador cree haber pedido otra cosa.
> El atenuante que el brief pedía preservar se habría perdido justo al «arreglarlo».

Por eso:

1. **`readEnvPort`** valida y lanza. Es donde vive el conocimiento de «qué es un
   puerto», y cubre de una vez los 9 call sites internos **y** `linea-firehose`,
   que si no se quedaba fuera.
2. **`catalog.mjs`** deja de tragarse el error de configuración. Sus `catch`
   existen para «presets-sdk no importable» (arranque offline), no para «tu
   configuración está mal»; ahora distinguen por `err.code`.

El error se discrimina por **`code`** y no por `instanceof`: con copias
duplicadas del paquete en el monorepo `instanceof` falla entre instancias
distintas del módulo. El `code` viaja. Está escrito en el JSDoc, no escondido.

### 1.3 · El cambio de contrato, declarado

`readEnvPort` es API publicada y **hasta hoy devolvía siempre un número**.
Ahora:

| entrada | antes | ahora |
| --- | --- | --- |
| clave ausente / `''` | defecto | **defecto** (sin cambio) |
| valor bien formado | el número | el número (sin cambio) |
| valor mal formado | defecto, o el disparate (`0`, `-1`, `16`…) | **lanza `ZeusPortConfigError`** |

Se actualizaron los tres puntos de la superficie publicada: `src/index.mjs`
(export de `validarPuerto`, `ZeusPortConfigError`, `ZEUS_PORT_ERROR_CODE`,
`MIN/MAX_ZEUS_PORT`) y `src/env/index.d.ts` (tipos + el `@throws`).

---

## 2 · Qué se rechaza y por qué (los siete, más lo que arrastran)

| valor | antes devolvía | ahora | motivo |
| --- | --- | --- | --- |
| `"0"` | `0` | lanza | fuera de rango; `listen(0)` pide puerto **efímero** — es el vector de la ficha |
| `"-1"` | `-1` | lanza | no es entero decimal sin signo |
| `"65536"` | `65536` | lanza | fuera de rango 1..65535 |
| `"3.5"` | `3.5` | lanza | no es entero |
| `"0x10"` | `16` | lanza | hex no es una grafía de puerto |
| `"  "` | `0` | lanza | espacios no son «sin configurar» |
| `"03012"` | `3012` | lanza | ceros a la izquierda: lo escrito y lo anunciado no coinciden |
| `""` / ausente | defecto | **defecto** | «sin configurar» sigue siendo legítimo |
| `"1"`, `"80"`, `"3012"`, `"14012"`, `"65535"` | el número | **el número** | legítimos, sin cambio |

**Sin `trim`, a propósito.** Si se recortara, `"  "` caería en `""` y devolvería
el defecto **en silencio** — exactamente el falso verde que este WP prohíbe. La
consecuencia es que `" 3012 "` también se rechaza; queda declarado.

### 2.1 · Dos cambios que van MÁS ALLÁ de los siete medidos

No los escondo, porque cambian comportamiento que alguien podía estar usando:

1. **`"abc"` (y cualquier no numérico) ahora lanza.** Antes caía al defecto.
   Es la misma clase de falso verde: un `ZEUS_PORT_EDITOR=abc` levantaba en 3012
   creyendo el operador que lo había movido.
2. **Rompía un aserto existente de WP-U227.**
   `presets-sdk/test/env-ciudad-lifecycle.mjs:39` (en la base; `:44` ya con el
   cambio) afirmaba literalmente
   `ZEUS_MCP_CIUDAD_LIFECYCLE='no-numerico'` → `3051`. Ese aserto **fijaba la
   leniencia como intención**, no era un accidente. Lo cambié a `assert.throws`
   y añadí el caso `''` → `3051` para conservar lo que U227 sí quería fijar (que
   el slot está cableado a su variable). Es el único test ajeno tocado, y se
   toca porque es consecuencia directa del contrato que este WP cambia.

---

## 3 · Qué medí, con la orden exacta

### 3.1 · Los siete, en la función

```bash
node -e "import('@zeus/presets-sdk/env').then(m=>{
  for (const v of ['0','-1','65536','3.5','0x10','  ','03012','','abc',' 3012 ','3012','1','65535']){
    process.env.ZEUS_PORT_EDITOR=v;
    try { console.log(JSON.stringify(v),'OK ->',m.readEnvPort('ZEUS_PORT_EDITOR',3012)); }
    catch(e){ console.log(JSON.stringify(v),'LANZA',e.code,e.motivo); }}})"
```

Los siete lanzan; `''` → 3012; `"3012"`/`"1"`/`"65535"` intactos.

### 3.2 · El camino real: el catálogo (CA-1)

Cada caso en **proceso hijo**, con el `rc` comprobado **aparte** de la salida:

```bash
for v in 0 -1 65536 3.5 0x10 "  " 03012; do
  out=$(ZEUS_PORT_EDITOR="$v" node -e "import('./packages/mesh/mcp-launcher/src/catalog.mjs').then(m=>{
    const e=m.resolveCatalog().find(x=>x.id==='editor-ui');
    console.log('ANUNCIA '+e.port); process.exit(0);
  }).catch(err=>{console.log('ABORTA '+err.code); process.exit(1);})" 2>/dev/null)
  rc=$?; echo "$v rc=$rc $out"
done
```

```
"0"      rc=1  ABORTA ZEUS_PUERTO_MAL_FORMADO
"-1"     rc=1  ABORTA ZEUS_PUERTO_MAL_FORMADO
"65536"  rc=1  ABORTA ZEUS_PUERTO_MAL_FORMADO
"3.5"    rc=1  ABORTA ZEUS_PUERTO_MAL_FORMADO
"0x10"   rc=1  ABORTA ZEUS_PUERTO_MAL_FORMADO
"  "     rc=1  ABORTA ZEUS_PUERTO_MAL_FORMADO
"03012"  rc=1  ABORTA ZEUS_PUERTO_MAL_FORMADO
```

Y por la familia MCP —la que se tragaba el error— `ZEUS_MCP_SUN=0/-1/65536`:
`rc=1 ABORTA` (antes: `rc=0 ANUNCIA 4101`). El legítimo `ZEUS_MCP_SUN=4999` →
`rc=0 ANUNCIA 4999`.

### 3.3 · El camino real: el bind, y el arranque de verdad

```bash
cd packages/editor/editor-ui && ZEUS_PORT_EDITOR=0 node src/server.mjs
```

```
RC_arranque=1
  code: 'ZEUS_PUERTO_MAL_FORMADO', envVar: 'ZEUS_PORT_EDITOR',
  rawValue: '0', motivo: 'fuera de rango 1..65535'
```

Y el orquestador, la misma orden que usó U181:

```bash
ZEUS_PORT_EDITOR=0 node packages/mesh/mcp-launcher/src/orchestrator.mjs start editor-ui
#   RC=1, ZEUS_PUERTO_MAL_FORMADO
```

Diferencia con la medición de U181: antes **spawneaba** y el bind caía en un
puerto efímero (`ok:false` + `fetch failed`, con proceso vivo en 56206). Ahora
**no llega a spawnear**. Verificado sin residuo: `netstat` sin listeners en
3012/14012 (`rc=1`) y `data/orchestrator` ni se crea (`ls` → `rc=2`).

**Positivo (que el arreglo no rompe lo bueno):** `ZEUS_PORT_EDITOR=14012 node
src/server.mjs` → `Editor UI running on http://localhost:14012`, `curl /health`
→ **200**. Proceso matado y puerto liberado después (`netstat` → `rc=1`).

### 3.4 · La precedencia (CA-2), medida

```bash
printf 'ZEUS_PORT_EDITOR=14012\n' > .env
node -e "…readEnvPort…"                      # -> 14012   (sólo .env)
ZEUS_PORT_EDITOR=15012 node -e "…"           # -> 15012   (gana el proceso)
ZEUS_PORT_EDITOR=0     node -e "…"           # -> ABORTA  (el malo del proceso no se tapa con el .env bueno)
printf 'ZEUS_PORT_EDITOR=03012\n' > .env
node -e "…"                                  # -> ABORTA  (mal formado en el .env también aborta)
ZEUS_PORT_EDITOR=15012 node -e "…"           # -> 15012   (proceso bueno gana sobre .env malo)
rm -f .env
```

**Dónde quedó escrita** (CA-2 pide «donde se lea», no en un reporte suelto):

1. `presets-sdk/src/env/index.mjs` — bloque de 20 líneas en el JSDoc de
   **`loadZeusEnv`**, que es la función que la implementa, con el orden 1/2/3 y
   la advertencia de qué se rompe si alguien pone `override: true`.
2. `readEnvPort` — un puntero de una línea a lo anterior.
3. **`.env.example`** — el fichero que abre el operador. No se editó a mano
   (está generado): se añadió al generador
   `presets-sdk/src/env/generate-env.mjs:224-231` y se regeneró.
   `node scripts/generar-env.mjs --check` → **OK, RC=0**.

---

## 4 · Los negativos, verificados desactivando su guardián

Regla de la casa: un negativo no está verificado hasta que desactivas su
guardián y lo ves enrojecer — distinguiendo **«nadie disparó»** de **«saltó OTRO
guardián»**. Cuatro ablaciones, y lo que vi en cada una:

| # | qué desactivé | suite | resultado | ¿nadie disparó, u otro guardián? |
| --- | --- | --- | --- | --- |
| **A** | cuerpo de `readEnvPort` restaurado a `Number.isFinite` | presets-sdk | 10 → **5 pass / 5 fail** | **nadie disparó**: `Missing expected exception: "0" deberia lanzar` |
| **A** | ídem | mcp-launcher | 5 → **3 pass / 2 fail** | **nadie disparó**: `"0": codigo de salida — 0 !== 1` (el hijo salió 0 y anunció) |
| **B** | sólo el re-`throw` del catálogo (`if (false && …)`), guarda de `readEnvPort` **intacta** | presets-sdk | **10/10 VERDE** | — |
| **B** | ídem | mcp-launcher | **3 pass / 2 fail** | **nadie disparó**: vuelve a anunciar 4101 con `rc=0` |
| **C** | `dotenv.config({ override: true })` | presets-sdk | **9 pass / 1 fail** (sólo el de precedencia) | **nadie disparó**: `14012 !== 15012` |
| **D** | cuerpo de `readEnvPort` restaurado | app-shell | 4 → **2 pass / 2 fail** | **nadie disparó**: `Missing expected exception: "0" deberia abortar el bind` |

**La ablación B es la que justifica el diseño**: con la guarda de `readEnvPort`
enteramente puesta, la suite de la función se queda **10/10 en verde** y sólo
enrojece la del catálogo. Es la demostración literal de «probar la función no es
probar el camino»: el test de función es **ciego** al `catch` mudo.

Las ablaciones son **dirigidas**, no destructivas: en A, B y D los tests de
valores legítimos y de defectos siguen verdes; sólo caen los asertos del valor
mal formado. En C cae **1 de 10**, exactamente el de precedencia.

Verificado que no quedó ninguna ablación en el árbol:
`grep -rn "ABLACION" packages/ --include=*.mjs` → **rc=1** (ninguna).

### 4.1 · Un rojo que parecía verificación y no lo era

La primera versión del test de catálogo falló **los 5 casos**, y por poco lo doy
por bueno: el hijo salía con **código 1**, que es justo lo que el test espera del
fallo bueno. La causa real era otra —
`ERR_UNSUPPORTED_ESM_URL_SCHEME`: en Windows `import("C:\…")` necesita una URL
`file://`— y el hijo moría **antes** de llegar al catálogo. **Saltó otro
guardián.** Lo cazó el aserto sobre el mensaje (`ABORTA ZEUS_PUERTO_MAL_FORMADO`),
no el del código de salida. Si el test hubiera mirado sólo `rc`, habría pasado
**en verde por la razón equivocada**. Arreglado con `pathToFileURL` y anotado en
el propio fichero para que nadie lo simplifique a un `rc`.

---

## 5 · Vectores de prueba entregados (CA-3)

| fichero | qué ejerce | tests | ¿lo corre CI? |
| --- | --- | --- | --- |
| `packages/engine/presets-sdk/test/env-puerto-mal-formado.mjs` | la **función** + precedencia `.env`/proceso | 10 | **sí** (`@zeus/presets-sdk` está en la matriz) |
| `packages/engine/app-shell/test/puerto-mal-formado.mjs` | el **bind** (`createAppConfig → resolveAppPort`) | 4 | **sí** (`@zeus/app-shell` está en la matriz) |
| `packages/mesh/mcp-launcher/test/catalogo-puerto-mal-formado.test.mjs` | el **anuncio** (catálogo, en procesos hijo) | 5 | **NO** — ver §7 |

Los tres cubren los **siete valores medidos** y los legítimos
(`1`, `80`, `3012`, `14012`, `65535`, `''`, ausente). El del catálogo además
barre **las 23 entradas** del catálogo con la configuración por defecto y
comprueba que ningún puerto anunciado es 0 ni sale de 1..65535 (el denominador
—23— se imprime en la propia corrida, no se cita de memoria).

---

## 6 · Estado de suites y gates (re-medido hoy)

| gate | antes | después |
| --- | --- | --- |
| `npm test -w @zeus/presets-sdk` | 55 · 55 pass · 0 fail · RC 0 | **65 · 65 pass · 0 fail · RC 0** |
| `npm test -w @zeus/app-shell` | 9 · 9 pass · 0 fail · RC 0 | **13 · 13 pass · 0 fail · RC 0** |
| `npm test -w @zeus/mcp-launcher` | 37 · 36 pass · 1 skip · RC 0 | **42 · 41 pass · 1 skip · RC 0** |
| `npm run gates` | — | **OK (0 offenders) · RC 0** |
| `npm run test:gates` | — | **160 · 159 pass · 1 skip · 0 fail · RC 0** |
| `node scripts/generar-env.mjs --check` | — | **OK · RC 0** |
| `npx eslint` (7 ficheros tocados) | — | **RC 0** |

**Matriz de CI completa (27 workspaces), corrida en local: 26 en verde.**
El único rojo es **`@zeus/protocol`** (3 fallos), y es **preexistente y ajeno**:

- `git status -- packages/engine/protocol/` → **vacío** (no lo he tocado).
- `grep -rn "readEnvPort" packages/engine/protocol/` → **rc=1** (ninguna
  mención; comprobado con `rc` aparte, no por tubería).
- El fallo es de sincronía de tipos por **fin de línea**:
  `packages/engine/protocol/types/index.d.ts` está en disco *with CRLF line
  terminators* y el generador emite LF. Es el artefacto de checkout en Windows;
  en el runner Linux de CI no se da.

Aviso del brief comprobado: el `npm ci` de esta máquina venía **sin
`node_modules` en absoluto** en este worktree. Se instaló con
`npm_config_logs_dir` dentro del worktree (`npm install --prefer-offline
--no-audit --no-fund`, 2699 paquetes, RC 0) y `dotenv`/`ajv` quedaron presentes
antes de medir nada. El directorio de logs se borró al terminar.

---

## 7 · Límites NO cerrados

1. **El test que prueba CA-1 en su forma fuerte no lo corre CI.**
   `@zeus/mcp-launcher` **no está** en la matriz de `ci.yml` (27 workspaces,
   comprobado: `grep -n "mcp-launcher" .github/workflows/ci.yml` → **rc=1**).
   O sea: el lado del **anuncio** sólo tiene gate en local. Mitigado en parte
   metiendo el lado del **bind** en `@zeus/app-shell`, que sí está en la matriz,
   pero **no es lo mismo**. No añadí el workspace a la matriz a propósito: no
   tengo ni una medición de esa suite en CI (spawnea procesos; U267 acaba de
   sanear sus puertos fijos y midió determinismo **en esta máquina**, no en el
   runner), y meter una suite de la que no tengo dato de CI tiene un radio mayor
   que este WP. **Queda enrutado como ítem propio.**
2. **`PORT_TABLE` sigue siendo una instantánea de import** (`catalog.mjs:530`).
   Con configuración mal formada eso ahora hace reventar el **import** del
   módulo, no sólo la llamada — deseable para CA-1, pero significa que cualquier
   consumidor de `catalog.mjs` muere al importarlo. Es coherente con «falla al
   arrancar»; se declara porque cambia dónde salta el error. La rancidez de
   `PORT_TABLE` en sí es el **O9 de U181** y sigue sin dueño.
3. **`resolveZeusHost` no valida nada.** Un `ZEUS_HOST` basura sigue colándose y
   produce URLs anunciadas hacia un host que no resuelve. Es la misma clase de
   defecto que éste por el otro eje del par host/puerto, y está **fuera del
   alcance** de esta ficha. No medido.
4. **No hay comprobación de colisión entre puertos.** Dos slots con el mismo
   valor bien formado siguen pasando; `buildPortTable` documenta la tabla pero
   nadie asevera unicidad. Fuera de alcance.
5. **El rango 1..65535 no distingue puertos privilegiados** (<1024). Un
   `ZEUS_PORT_EDITOR=80` se acepta y fallará al escuchar sin privilegios, con el
   error del SO. Decidido así: es un fallo de permisos, no de forma, y falla
   ruidosamente en el `listen`.
6. **`" 3012 "` (con espacios alrededor) se rechaza.** Es más estricto que
   antes. Consecuencia buscada de no hacer `trim` (§2); si alguien tenía espacios
   en su `.env` le va a saltar. Declarado, no medido en campo.
7. **Los tres ficheros que `npm install` marca como modificados**
   (`feed-kit/bin/jetstream-sync.mjs`, `linea-kit/bin/linea-kit.mjs`,
   `playbook-kit/bin/run-playbook.mjs`) **no se commitean**: `git diff --quiet`
   sobre los tres → **rc=0**, o sea sin cambio de contenido. Es el `mtime` de
   npm (O7 de U181). `linea-kit` es además territorio prohibido y queda intacto.

---

## 8 · Lo que NO hice y por qué

| no hecho | por qué |
| --- | --- |
| Añadir `@zeus/mcp-launcher` a la matriz de CI | Sin dato propio de esa suite en CI; radio mayor que este WP. Enrutado (§7.1). |
| Validar `ZEUS_HOST` | Otro eje, fuera de alcance (§7.3). |
| Arreglar la rancidez de `PORT_TABLE` (O9 de U181) | Preexistente y sin dueño; sólo se declara (§7.2). |
| Tocar `packages/engine/volumes-ops/**`, `linea-kit/**`, `VOLUMES/**`, lockfile | Territorio prohibido. Verificado intacto. |
| Arreglar los 3 rojos de `@zeus/protocol` | Ajenos, preexistentes y de fin de línea en Windows (§6). |
| `git push` | Prohibido por el encargo. |
| `git stash` | Pila compartida entre worktrees (incidente de U180 §5). |

---

## 9 · Reproducción (orden exacto)

```bash
cd C:/S_LAB/wt/z-u266
mkdir -p .tmp-npm-logs
npm_config_logs_dir=C:/S_LAB/wt/z-u266/.tmp-npm-logs npm install --prefer-offline --no-audit --no-fund

# 1 · los siete, en la función
node -e "import('@zeus/presets-sdk/env').then(m=>{for (const v of ['0','-1','65536','3.5','0x10','  ','03012','','abc','3012','65535','1']){process.env.ZEUS_PORT_EDITOR=v;try{console.log(JSON.stringify(v),'OK',m.readEnvPort('ZEUS_PORT_EDITOR',3012))}catch(e){console.log(JSON.stringify(v),'LANZA',e.code)}}})"

# 2 · el camino: catálogo (rc aparte de la salida)
for v in 0 -1 65536 3.5 0x10 "  " 03012; do
  out=$(ZEUS_PORT_EDITOR="$v" node -e "import('./packages/mesh/mcp-launcher/src/catalog.mjs').then(m=>{console.log('ANUNCIA '+m.resolveCatalog().find(x=>x.id==='editor-ui').port);process.exit(0)}).catch(e=>{console.log('ABORTA '+e.code);process.exit(1)})" 2>/dev/null); echo "$v rc=$? $out"; done

# 3 · el camino: bind y arranque real
(cd packages/editor/editor-ui && ZEUS_PORT_EDITOR=0 node src/server.mjs); echo "rc=$?"     # 1
ZEUS_PORT_EDITOR=0 node packages/mesh/mcp-launcher/src/orchestrator.mjs start editor-ui; echo "rc=$?"   # 1
(cd packages/editor/editor-ui && ZEUS_PORT_EDITOR=14012 node src/server.mjs &) ; sleep 6
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:14012/health    # 200

# 4 · precedencia
printf 'ZEUS_PORT_EDITOR=14012\n' > .env
node -e "import('@zeus/presets-sdk/env').then(m=>console.log(m.readEnvPort('ZEUS_PORT_EDITOR',3012)))"   # 14012
ZEUS_PORT_EDITOR=15012 node -e "import('@zeus/presets-sdk/env').then(m=>console.log(m.readEnvPort('ZEUS_PORT_EDITOR',3012)))"   # 15012
rm -f .env

# 5 · suites y gates
npm test -w @zeus/presets-sdk     # 65 · 65 pass · RC 0
npm test -w @zeus/app-shell       # 13 · 13 pass · RC 0
npm test -w @zeus/mcp-launcher    # 42 · 41 pass · 1 skip · RC 0
npm run gates                     # OK (0 offenders) · RC 0
npm run test:gates                # 160 · 159 pass · 1 skip · RC 0
node scripts/generar-env.mjs --check   # OK · RC 0

# 6 · las ablaciones (§4): restaurar el cuerpo viejo de readEnvPort, o
#     neutralizar el re-throw del catálogo, y ver enrojecer la suite que toca.

rm -rf .tmp-npm-logs
```

**Higiene final**: sin listeners residuales (`netstat` → rc=1), sin
`data/orchestrator`, sin `.env` temporal, sin ablaciones en el árbol
(`grep -rn ABLACION` → rc=1), `.tmp-npm-logs` borrado, y `git status` con sólo
los ficheros del WP más los 3 de O7 sin cambio de contenido y no commiteados.
