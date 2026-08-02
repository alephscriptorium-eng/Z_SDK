# WP-U266 · El puerto mal formado falla al arrancar y no se anuncia

- **Rama**: `wp/u266-puerto-mal-formado` · base **`52d63e6`**
- **Worktree**: `C:\S_LAB\wt\z-u266` (canónico `C:\S_LAB\v-sdk` no tocado)
- **Fecha de ejecución**: 2026-08-02
- **Preflight**: `identidad-raiz: PASS` · `world-real = git-toplevel = c:/s_lab/wt/z-u266`

---

## 0 · Resultado en una línea

`readEnvPort` valida ahora la **cadena cruda** (entero decimal 1..65535) y
**lanza** en vez de caer al defecto; el catálogo **deja de tragarse** ese error;
los **cinco ficheros de servidor que resolvían su puerto a mano** pasan por la
fuente única; y el **orden de precedencia de cada slot vive en un solo sitio**,
para que quien ata y quien anuncia no puedan separarse.

Hacen falta las cuatro cosas, y cada una está medida: con sólo la primera el
catálogo anunciaba **4101** en verde con `ZEUS_MCP_SUN=0`; con las dos primeras
`socket-server` seguía levantando en un efímero con `ZEUS_PORT_SCRIPTORIUM=0`;
y con las tres, `game-bridge` anunciaba **4001** mientras `serve.mjs` ataba en
**4002** sin un solo valor mal formado.

---

## 1 · La decisión de diseño, con el radio delante

### 1.1 · El censo, RE-HECHO por el criterio correcto (corrección de la 1ª entrega)

**Mi primera entrega midió el radio de la FUNCIÓN y lo presentó como el radio
del DEFECTO.** Es un error de encuadre, no de aritmética, y es la raíz de B1: el
defecto no es «quién llama a `readEnvPort`», es **«quién convierte una cadena
`ZEUS_PORT_*` / `ZEUS_MCP_*` en un puerto de escucha»**. Ese conjunto es
estrictamente mayor, y los que faltaban **faltaban precisamente por no llamar a
`readEnvPort` — que es lo que los hacía vulnerables**.

**Censo viejo (criterio equivocado: llamadas a `readEnvPort`)**

| consumidor | cuántos |
| --- | --- |
| `presets-sdk/src/env/index.mjs` | 9 call sites |
| `packages/mesh/linea-firehose/src/config.mjs:12` | 1 |
| `presets-sdk/test/env-canonical.mjs:33,38` | 2 asertos |

Y la frase que escribí: «el **único** consumidor de producción fuera de
presets-sdk». **Es verdad de la función y falsa de la ficha.**

**Censo nuevo (criterio correcto: quien convierte la cadena en puerto de escucha)**

```bash
grep -rnE "process\.env\.(ZEUS_PORT_[A-Z_0-9]+|ZEUS_MCP_[A-Z_0-9]+|ZEUS_[A-Z_0-9]*PORT[A-Z_0-9]*|OPERATOR_UI_PORT)" \
  --include=*.mjs packages/ scripts/ e2e/ | grep -v node_modules | grep -v /test/
```

| # | fichero | clave(s) | ¿en `.env.example`? | estado |
| --- | --- | --- | --- | --- |
| 1 | `presets-sdk/src/env/index.mjs` | todas, vía `readEnvPort` | — | fuente única |
| 2 | `mesh/linea-firehose/src/config.mjs:12` | `ZEUS_MCP_FIREHOSE` | sí | ya usaba `readEnvPort` |
| 3 | **`mesh/socket-server/src/config.mjs`** (`:29-35` antes; `:42` ahora) | `ZEUS_PORT_SCRIPTORIUM` + alias `ZEUS_SCRIPTORIUM_PORT` | **sí** (`.env.example:30`) | **B1 · era vulnerable · ARREGLADO** |
| 4 | **`mesh/operator-ui/serve.mjs`** (`:66,163` antes; `:90,183` ahora) | `OPERATOR_UI_PORT` + `ZEUS_PORT_OPERATOR_UI` | **sí** (`:26`) | **sólo el alias · ARREGLADO** |
| 5 | **`mesh/webrtc-viewer/serve.mjs`** (`:50-59` antes; `:75` ahora) | `WEBRTC_VIEWER_PORT` + `ZEUS_PORT_WEBRTC_VIEWER` | **sí** (`:28`) | **sólo el alias · ARREGLADO** — no lo nombraba nadie: **sale del censo** |
| 6 | **`mesh/webrtc-viewer/src/game-bridge.mjs:24`** (antes) | `WEBRTC_VIEWER_PORT` + `ZEUS_PORT_WEBRTC_VIEWER` | **sí** (`:28`) | **B2 · lee el entorno POR PARÁMETRO · ARREGLADO** — invisible a los dos censos anteriores |
| 7 | **`mesh/oasis-webrtc/src/http-api.mjs:32`** | `ZEUS_PORT_OASIS_WEBRTC` | **sí** (`:29`) | **B3 · lee por parámetro · ARREGLADO** — lo di por «cubierto» midiendo el canal equivocado |
| 8 | `mcp-launcher/src/launcher-server.mjs` (`:15-18` antes; `:24` ahora) | `ZEUS_MCP_LAUNCHER` | sí | M3 · antipatrón · ARREGLADO |
| 9 | `scripts/smoke-dual-ui.mjs:21-26` | 6 claves | sí | M7 · ARREGLADO (M-c: dos por CADENA) |
| 10 | `scripts/smoke-external-consumer.mjs:30` | `ZEUS_SMOKE_SCRIPTORIUM_PORT` | **no** | M7 · declarado, **no** arreglado (§7.7) |
| 11 | `e2e/*.mjs` (helpers, demos) | varias | — | **escriben** el entorno, no lo leen para atar |

**Cómo creció la cifra, vuelta a vuelta, que es el dato honesto:**

| vuelta | cifra que di | qué la corrigió |
| --- | --- | --- |
| 1ª | «**1** consumidor de producción» | criterio equivocado (radio de la función) |
| 2ª | «**3** servidores» | instrumento anclado en `process.env.` |
| 3ª | «**4** ficheros, y no hay un sexto» | medí `oasis-webrtc` por el canal enmascarado |
| 4ª | **5 ficheros de servidor** + 1 MCP + 2 scripts | — |

Los cinco: `socket-server/src/config.mjs`, `operator-ui/serve.mjs`,
`webrtc-viewer/serve.mjs`, `webrtc-viewer/src/game-bridge.mjs` y
`oasis-webrtc/src/http-api.mjs`.

### 1.1.bis · La lección del WP, que vale más que los dos bloqueantes

> **Corregir el encuadre de un censo no es corregir su instrumento.**

Entre la 2ª y la 3ª vuelta corregí el **criterio** —de «quién llama a
`readEnvPort`» a «quién convierte una cadena en un puerto»— y di el censo por
bueno. Pero el **instrumento** seguía siendo el mismo `grep` anclado en el
literal `process.env.`, y ese instrumento **por construcción no puede ver una
lectura por parámetro**:

```js
export function resolveWebRtcViewerEndpoint(env = process.env) {   // ← el hueco
  const port = Number(env.ZEUS_PORT_WEBRTC_VIEWER || env.WEBRTC_VIEWER_PORT || …);
}
```

El residuo del instrumento viejo **es exactamente el fichero que faltaba** (B2).
Y no fue un descuido pasivo: escribí en **dos sitios de código** que el alias
«no lo conoce nadie más», con la confianza que da un censo — una confianza que
el instrumento no sostenía. Las dos frases están corregidas
(`webrtc-viewer/serve.mjs`, `test/puerto-mal-formado.test.mjs`).

**Precedente de la casa que debí mirar**: `scripts/gates/claves.mjs:718-723` ya
tiene escrita esta misma lección, sobre este mismo problema — enumera las cuatro
formas de leer el entorno (`process.env.X`, `process.env['X']`, desestructuración,
y la dinámica que «no se puede enumerar») porque su primera versión sólo conocía
las dos primeras. La casa ya había tropezado aquí y lo había dejado por escrito.

### 1.1.ter · Censo re-hecho con instrumento nuevo (6 sondas)

Ahora el método, no sólo el resultado. Seis sondas independientes, cada una con
su `rc` comprobado aparte:

| sonda | qué busca | hallazgo |
| --- | --- | --- |
| S1 | lectura por **parámetro** (`env.X`, `e.X`) | **`webrtc-viewer/src/game-bridge.mjs` (B2)** + `oasis-webrtc/src/http-api.mjs` |
| S2 | índice `process.env[...]` | `orchestrator.mjs:104` (`envInt`, **timeouts** no puertos) · `volumes/resolve.mjs` (no puerto) |
| S3 | desestructuración de `process.env` | ninguno en producción |
| S4 | literal `process.env.X` (el instrumento viejo) | los ya conocidos |
| S5 | **claves de puerto que la fuente única NO conoce** — el más fuerte, porque no depende de la forma sintáctica | **exactamente 3 alias**: `OPERATOR_UI_PORT`, `WEBRTC_VIEWER_PORT`, `ZEUS_SCRIPTORIUM_PORT`, más `ZEUS_SMOKE_SCRIPTORIUM_PORT` (arnés) |
| S6 | `CLIENT_PORT` / `SERVER_PORT` / `KNOWN_ZEUS_PORTS` | **falsos positivos**: los dos primeros se **escriben** a un hijo desde valores ya validados (`scripts/mcp-inspector.mjs:24-25`); el tercero es constante de un gate |

**S5 es el instrumento que debería haber usado desde el principio**: en vez de
buscar formas de leer el entorno (lista abierta e inagotable), compara el
conjunto de **claves con pinta de puerto referenciadas** contra las **33 que
declara la fuente única**. La diferencia es el censo, y no depende de cómo se
lea la variable.

**Resultado: 3 alias, los tres enrutados.**

**Y aquí me equivoqué otra vez, en la misma frase (B3).** Escribí que
`oasis-webrtc` estaba «**cubierto** (medido, no razonado)». «Sin alias» era
cierto. «Cubierto» lo medí **por `process.env`** — que es exactamente el canal
donde el guardián ancho lo tapa — y **no por el canal que acababa de producir
B2**, cuya lección había escrito tres párrafos más arriba. El contraste que
debí hacer, y que lo delata al instante:

```
resolveOasisWebrtcListen({ ZEUS_PORT_OASIS_WEBRTC: '0x10' }).port  -> 16     rc=0
ZEUS_PORT_OASIS_WEBRTC=0x10   (por process.env)                    -> ABORTA  rc=1
```

Punta a punta con `"0"` declarado: **ataba en un efímero (61432) y anunciaba ese
mismo efímero**. `ZEUS_PORT_OASIS_WEBRTC` está en `.env.example:29`, bajo mi
cabecera. **Era un sexto fichero, y lo declaré cubierto.**

> **Medir por el canal equivocado es no medir.** Tener la lección escrita no
> basta: hay que aplicarla al caso siguiente, que es donde duele.

Cerrado: `resolveOasisWebrtcListen` pasa por
`readEnvPortAlias(uiPortEnvChain('oasisWebrtc'), slot.port, env)`, con test que
ejercita **el `env` por parámetro** (el canal que ningún otro guardián ve).

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

3. **Los tres servidores que resolvían a mano** (B1). La CA es una propiedad
   **del producto**, no de una función: se cierra por arriba, haciendo que
   pasen por la fuente única, no acotando la cabecera de `.env.example`.

### 1.2.bis · B1 · el hueco que la contrarrevisión encontró, y su reparto de méritos

`.env.example` prometía, **bajo la cabecera que añadí yo**, que «un valor mal
formado aborta el arranque; NO cae al default». Para tres de sus claves era
mentira. Documentación que miente al operador es peor que el silencio anterior.

Reproducido antes de tocar nada, por el entrypoint documentado:

```
cd packages/mesh/socket-server && ZEUS_PORT_SCRIPTORIUM=0 node src/index.mjs
→ rc=0, VERDE  ·  los siete vectores: port=0 / -1 / 65536 / 3.5 / 16 / 0 / 3012
```

**Pero el reparto de méritos NO es el que decía la devolución, y lo medí
ablacionando en vez de suponerlo.** Con la guarda de `presets-sdk` ya puesta
(mi primer commit) y el `Number(...)` viejo restaurado en cada servidor:

| servidor | clave canónica | alias legado |
| --- | --- | --- |
| `socket-server` | **vulnerable de verdad** (usa `DEFAULT_ZEUS_UI_MESH.scriptorium`, una constante: nadie valida) | vulnerable |
| `operator-ui` | **ya cubierta** por `resolveRoomClientConfig()` → `resolveZeusUiPorts()` (`room-client-browser/src/index.mjs:29`) | **vulnerable** |
| `webrtc-viewer` | **ya cubierta** por su propio `resolveZeusUiPorts()` (lo llama para el defecto) | **vulnerable** |

Medida que lo fija, con el código viejo y `OPERATOR_UI_PORT=0`:

```
Serving at http://localhost:55770 · room=CIUDAD_DEMO · game=ciudad     ← rc=124 (timeout: seguía vivo)
```

Un efímero anunciado como suyo. Con `ZEUS_PORT_OPERATOR_UI=0`, en cambio, el
código viejo **ya abortaba** — por `resolveZeusUiPorts`, no por este fichero.

**Conclusión honesta**: la devolución acierta de pleno en `socket-server`
(medido, verde, exactamente el defecto de la ficha) y acierta en que hay que
cerrarlo por arriba; en `operator-ui` lo que quedaba vivo era **el alias
legado**, no la clave canónica. El arreglo sigue siendo el correcto en los tres:
depender de que otro resolver valide «de rebote» es exactamente la fragilidad
que esta ficha existe para quitar.

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
enrojece la del catálogo.

**Matización pedida (M6), y es justa**: esa ceguera es **por construcción**, no
un casi-fallo medido. `presets-sdk/test/env-puerto-mal-formado.mjs` **no importa
`catalog.mjs` bajo ninguna configuración**, así que no podría enterarse aunque
quisiera. Sigue valiendo como demostración de que *ese* fichero no cubre *ese*
camino —que es lo que se quería mostrar— pero no es «un test que estuvo a punto
de cazarlo y no pudo». El casi-fallo real de este WP es otro y está en §4.1.

### 4.bis · Ablaciones de la segunda vuelta (B1 y menores)

| # | qué desactivé | qué miré | resultado | diagnóstico |
| --- | --- | --- | --- | --- |
| **E** | `socket-server/src/config.mjs` restaurado a `Number(process.env…)` | su suite nueva | **1 pass / 4 fail** | **nadie disparó**: `Missing expected exception: "0" deberia abortar` |
| **F** | `webrtc-viewer/serve.mjs` restaurado | su suite nueva | **1 pass / 2 fail** | **mixto — ver abajo** |
| **G** | `operator-ui/serve.mjs` restaurado (los dos sitios) | entrypoint real | `OPERATOR_UI_PORT=0` → **arranca y anuncia 55770**, rc=124 | **nadie disparó** |

**La ablación F es la que hay que leer con cuidado, porque cazó un error mío.**
En su primera versión, mi test de `webrtc-viewer` afirmaba que los siete
vectores por la clave **canónica** demostraban el cableado de ese fichero. Al
ablacionar, **ese test siguió en verde**: lo satisfacía `resolveZeusUiPorts()`,
que `resolveViewerPort` llama para calcular su defecto. Eso es literalmente
**«saltó OTRO guardián»** — parecía verificación y no lo era.

Reescrito: el test de la canónica **dice en su nombre de quién es el mérito**
(`guardian: resolveZeusUiPorts`) y el que sostiene este fichero es el del alias
legado, que sí enrojece al ablacionar. Diagnóstico del rojo del alias: el hijo
sale con **rc=-1/124 por timeout**, es decir **el servidor arrancó de verdad** y
siguió vivo en un efímero. Nadie disparó.

**Una ablación no vale sólo por enrojecer: vale por enrojecer donde dice.** Si
me hubiera quedado con el conteo (`2 fail`) y no con el reparto, habría firmado
una cobertura que no tenía.

### 4.bis.2 · Ablaciones de la tercera vuelta

| # | qué desactivé | qué miré | resultado | diagnóstico |
| --- | --- | --- | --- | --- |
| **H** | `game-bridge.mjs` restaurado a `Number(env.X \|\| env.Y \|\| …)` | `webrtc-viewer/test/puerto-anunciado.test.mjs` | **3 pass / 2 fail** | **mixto — ver abajo** |
| **I** | `applyEnvToUis` vuelve a `readEnvPort(UI_PORT_ENV[uiId], …)` | `presets-sdk` | **12 pass / 2 fail** | **nadie disparó**: `3017 !== 5555` y `Missing expected exception` |
| **J** | `create-app-config` vuelve a `fileConfig.server?.port` crudo | `app-shell` | **5 pass / 1 fail** | **nadie disparó**: `Missing expected exception: config.json server.port=0 deberia abortar` |

**La ablación H repite —por tercera vez en este WP— el patrón que hay que
nombrar.** El test de «alias mal formado por `process.env`» **siguió en verde**
al ablacionar `game-bridge`: lo satisface `resolveZeusUiPorts()`, que desde
**mi propio arreglo M-a** conoce la cadena de alias. Es defensa en profundidad y
está bien que exista, pero **no demuestra el cableado de este fichero**.

Los dos que sí lo sostienen, y que enrojecen:
- **el `env` por parámetro** (`Missing expected exception`) — canal que
  `resolveZeusUiPorts` no puede ver, porque no mira `process.env`;
- **anunciar == atar** (`4001 !== 4002`).

El test verde está renombrado con el guardián que le corresponde y con un aviso
en cabecera. **Regla que sale de aquí**: en este repo `resolveZeusUiPorts` es un
guardián ancho que **enmascara** el cableado de cada fichero; un test de fichero
sólo es portante si usa un canal que ese guardián no ve.

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

## 3.bis · B2 · el quinto fichero, y la mitad «no se anuncia» de la CA

`packages/mesh/webrtc-viewer/src/game-bridge.mjs` construye las URLs del visor
que el juego reparte. Tenía **las dos mitades** del defecto de la ficha.

**B2a · valor mal formado por el alias, anunciado tal cual, `rc=0`:**

```
WEBRTC_VIEWER_PORT=0      → http://localhost:0        rc=0
WEBRTC_VIEWER_PORT=0x10   → http://localhost:16       rc=0
WEBRTC_VIEWER_PORT=03012  → http://localhost:3012     rc=0
WEBRTC_VIEWER_PORT=abc    → http://localhost:NaN      rc=0
```

**B2b · y ésta es la grave, porque no necesita ningún valor malo:** precedencia
**opuesta** dentro del mismo paquete. `serve.mjs` (que **ATA**) leía
`WEBRTC_VIEWER_PORT` primero; `game-bridge` (que **ANUNCIA**) leía
`ZEUS_PORT_WEBRTC_VIEWER` primero. Con configuración enteramente válida:

```
ZEUS_PORT_WEBRTC_VIEWER=4001  WEBRTC_VIEWER_PORT=4002
   serve.mjs    ATA en   : 4002
   game-bridge  ANUNCIA  : http://localhost:4001
```

Eso es el defecto de la ficha completo —lo anunciado y lo atado se separan—
conseguido sin un solo valor mal formado.

**Arreglo**: `game-bridge` pasa por `readEnvPortAlias`, y el **orden deja de
estar escrito en ningún servidor**: se pide a `uiPortEnvChain()`, en la fuente
única. `serve.mjs` importa la misma constante. Hay test que falla si alguien
vuelve a escribir la lista a mano en cualquiera de los dos.

Hizo falta además ampliar `readEnvPortAlias` con un tercer parámetro `env`: la
API pública de `resolveWebRtcViewerEndpoint(env = process.env)` recibe el mapa
por parámetro, y validar sólo `process.env` habría dejado **esa misma vía**
—la que se escapó— sin cubrir. Es el test que sostiene el fichero (§4.bis).

## 3.ter · M-a · el alias era invisible al lado del anuncio (misma clase que B2b)

```
ZEUS_SCRIPTORIUM_PORT=5555
   socket-server ATA en       : 5555
   resolveCatalog() ANUNCIA   : 3017
   resolveStopServicePorts()  : [3017]     ← `stop:services` NO lo mataba
```

Preexistente, sí — pero **este WP asciende los alias a entrada validada de la
fuente única**, así que dejarlos mudos ante el catálogo habría sido cerrar una
puerta y dejar la de al lado abierta. Elevado y **cerrado**, no declarado.

`UI_PORT_ENV_CHAIN` es ahora la **única** definición del orden, y el orden **no
es uniforme, a propósito**: `scriptorium` lee primero la canónica; `operator` y
`webrtcViewer` primero el alias, porque es lo que ya hacían sus servidores y
uniformarlo movería el puerto a quien lo tuviera configurado. Después:

```
ZEUS_SCRIPTORIUM_PORT=5555 → ATA 5555 · ANUNCIA 5555 · STOP [5555]
```

## 4.ter · Lo que rompí sin querer, y el idioma que no había visto

**Mi guarda tumbó el gate `GD`.** `e2e/local-first-ca.mjs` ponía
`ZEUS_MCP_FORCES = '0'` **a propósito** en dos pasos, con el comentario «puerto
0 para no chocar con nada». Medido tras mi primer commit:

```
ZEUS_GAMES_LIBRARY=C:/S_LAB/g-sdk node e2e/local-first-ca.mjs
→ RC=1 · 2 paso(s) en rojo: 2, 6
  error · Puerto mal formado: ZEUS_MCP_FORCES="0" — fuera de rango 1..65535
```

No es un daño colateral aceptable: `GD` es un gate abierto por decisión del
custodio y lo citan las aceptaciones de U255, U258 y U259.

**Cómo lo cerré, y por qué NO relajando la guarda.** Lo que ese arnés quiere no
es «el puerto cero», es «un puerto que no choque». `startAll()` de
`@zeus/force-system` no acepta puerto por argumento (`start.mjs:15`), así que el
entorno era su único punto de inyección. Se pide un puerto libre al SO y se pasa
como número concreto — la doctrina que **U267** ya dejó escrita para este mismo
problema (`mcp-launcher/test/helpers/ports.mjs`). Después:

```
→ RC=0 · 7/7 pasos verdes · 14 vectores rojos comprobados
```

que es exactamente la cifra histórica de U259.

**Esto refina el contrato y merece estar escrito**: `0` **explícito en código**
es un idioma legítimo y vivo de esta casa («dame un efímero») — seis llamadas de
la suite de `socket-server` lo usan, y U267 lo bendijo. `ZEUS_*=0` **desde el
entorno** es configuración mal formada. Por eso la guarda va en la conversión
**cadena-de-entorno → puerto**, y `options.port` / `{ port: 0 }` pasan intactos.
No es una inconsistencia: es la línea exacta del defecto.

### 4.quater · Un octavo vector que nadie había medido

La ablación E hizo caer también el test de valores legítimos, y no por lo que yo
esperaba. Con el código viejo de `socket-server`:

```
ZEUS_PORT_SCRIPTORIUM=  node -e "…resolveConfig().port"   →  port = 0
```

`Number('' ?? mesh.port)` = `Number('')` = **0**: el `??` no salta la cadena
vacía. O sea que una clave **declarada y vacía** —el caso que todo el mundo
entiende como «sin configurar»— hacía que el Scriptorium atara un puerto
efímero. No está en los siete de la ficha y no lo había medido nadie. Con el
arreglo da el defecto (`3017`), y hay aserto que lo fija.

---

## 4.quinquies · B4 · mi guardián del orden no vigilaba al que ATA

Escribí: «hay test que cae si alguien reescribe la lista a mano **en cualquiera
de los dos**». **Era falso, y la contrarrevisión lo midió con cuatro ablaciones:**

| ablación | ¿lo cazaba? |
| --- | --- |
| lista a mano en `game-bridge`, invertida | sí |
| las dos a mano, invertidas y coherentes entre sí | sí |
| orden invertido dentro de `UI_PORT_ENV_CHAIN` | sí |
| **lista a mano en `serve.mjs`, invertida** | **NO — suite 25/25 VERDE con B2 reintroducido** |

**Causa**: mi test «anunciar y atar leen la MISMA cadena» calculaba el lado que
ata como `readEnvPortAlias(WEBRTC_VIEWER_PORT_ENV, 3023)` — **lo re-derivaba de
la constante en vez de preguntárselo a `serve.mjs`**, cuyo `resolveViewerPort`
no se exporta. Nunca observaba la lista de quien ata. Un guardián que se mira a
sí mismo.

**Cierre**: el test resuelve ahora el lado «ata» **arrancando el servidor de
verdad en proceso hijo** y leyendo `server.address().port` de
`createWebRtcViewerServer()`. No re-deriva nada: observa el puerto realmente
atado. Verificado con la ablación **F2**:

```
F2 · serve.mjs con lista LITERAL INVERTIDA
   ROJO  puerto-anunciado.test.mjs  9/8pass/1fail
        cae: U266/B4 · anunciar == ATAR, con el puerto REAL del bind
        motivo: lo atado (4001) y lo anunciado (4002) se han separado
```

### 4.quinquies.2 · Y `serve.mjs` no tenía NI UN test que mordiera

La clase es peor de lo que la conté: `resolveZeusUiPorts` no enmascaraba «un
test», enmascaraba **todo el cableado de `serve.mjs`**. Deshaciendo entero mi
arreglo del bind, la suite del paquete quedaba **25/25 en verde** mientras el
octavo vector volvía a morder (`WEBRTC_VIEWER_PORT=""` → efímero).

Ahora sí muerde, porque el aserto mira el **puerto atado** y no un recálculo.
Ablación **F** (`serve.mjs` a `Number(process.env…)`):

```
   VERDE  <-- NO LO CAZA  puerto-mal-formado.test.mjs  3/3pass/0fail
   ROJO   puerto-anunciado.test.mjs  9/8pass/1fail
        cae: U266/B4 · el octavo vector, contra el bind real: clave vacía = defecto, no efímero
```

El primer fichero **sigue sin morder y ya lo dice en su cabecera**: es el
residuo documental que la contrarrevisión encontró
(`puerto-mal-formado.test.mjs:71-72` afirmaba «el caso que NADIE mas cubre»,
falso **desde M-a**, que es mi propio arreglo). Corregido en el sitio.

> **Un arreglo que ensancha un guardián ancho puede dejar ciego un test que ayer
> mordía.** Por eso H no era la tercera repetición del patrón sino la cuarta —
> y la creó mi propio parche. Las ablaciones se corren **después** del último
> cambio, no antes.

## 4.sexies · TODAS las ablaciones, re-corridas DESPUÉS del último cambio

Instrucción explícita de la 4ª vuelta, y tenía razón de serlo: el mapa cambió.
Arnés en scratchpad (no versionado) que aplica cada ablación, corre las suites
que deberían enrojecer, restaura y anota **qué aserto** cae.

| # | ablación | suites que enrojecen | diagnóstico |
| --- | --- | --- | --- |
| **A** | `readEnvPort` sin guarda | `presets-sdk` (8/14) · `mcp-launcher` catálogo (4/5) | nadie disparó · **pero ver abajo** |
| **B** | catálogo se traga el error | `mcp-launcher` catálogo | nadie disparó |
| **C** | `dotenv override:true` | `presets-sdk` (sólo el de precedencia) | nadie disparó |
| **E** | `socket-server` a mano | su suite (1/5) | nadie disparó |
| **F** | `serve.mjs` a mano | `puerto-anunciado` (octavo vector) | nadie disparó |
| **F2** | `serve.mjs` con lista literal **invertida** | `puerto-anunciado` (anuncia≠ata) | nadie disparó — **el caso de B4** |
| **H** | `game-bridge` a mano | `puerto-anunciado` (2 asertos) | nadie disparó |
| **I** | `applyEnvToUis` sin cadena | `presets-sdk` (los 2 de M-a) | nadie disparó |
| **J** | `config.json` crudo | `app-shell` | nadie disparó |
| **K** | `oasis-webrtc` a mano | su suite | nadie disparó — **el caso de B3** |
| **L** | `UI_PORT_ENV_CHAIN` invertida | `puerto-anunciado` (2) + `presets-sdk` | nadie disparó |

**El mapa de la ablación A cambió dos veces, y lo digo porque en la 2ª vuelta
afirmé otra cosa.** Tras M-2, A **sí** enrojece `app-shell` (por el aserto de
`resolveAppPort`, que es el único con gate en CI). Antes de M-2 dejaba **cuatro
suites en VERDE** (`app-shell`, `socket-server`,
`oasis-webrtc`, `webrtc-viewer/puerto-anunciado`). No es un agujero: es que el
sistema tiene ahora **dos puntos de validación independientes** —`readEnvPort` y
`readEnvPortAlias`, que desde B3/M-i valida con `validarPuerto` **directamente**
en vez de delegar— y ablacionar uno no ciega al otro. Diagnóstico medido, no
razonado: con A puesta, `app-shell` aborta y el disparo es

```
at readEnvPortAlias  (env/index.mjs:360)
at applyEnvToUis     (env/index.mjs:403)
at resolveZeusUiPorts(env/index.mjs:443)
```

o sea **«saltó OTRO guardián»**, y por eso esas cuatro suites no enrojecen con A.
Lo que A sí sostiene en exclusiva es `presets-sdk` y el camino del catálogo MCP.

**Nota de método**: A, B y E fallaron al aplicarse en el primer intento del
arnés — «NO ENCAJA». No era que el código hubiera cambiado: eran los **únicos
patrones multilínea**, y el árbol está en **CRLF** mientras los patrones se
escriben con `
`. El mismo artefacto de checkout que enturbió `@zeus/protocol`.
Un arnés de ablación que «no encaja» es un falso negativo silencioso: si no
llego a mirar por qué, habría dado tres ablaciones por imposibles.

## 5 · Vectores de prueba entregados (CA-3)

| fichero | qué ejerce | tests | ¿lo corre CI? | ¿muerde? |
| --- | --- | --- | --- | --- |
| `presets-sdk/test/env-puerto-mal-formado.mjs` | la función, `readEnvPortAlias`, cadenas de alias, `SPEC_TOOL_PORTS` perezoso, precedencia | 14 | **sí** | A · C · I · L |
| `app-shell/test/puerto-mal-formado.mjs` | el **bind**, `resolveAppPort` en exclusiva (M-2) y el `config.json` de la app | 8 | **sí** | **A** · J |
| `socket-server/test/puerto-mal-formado.test.mjs` | el servidor de B1, alias y `{port:0}` | 5 | **sí** | E |
| `oasis-webrtc/test/puerto-mal-formado.test.mjs` | B3 por el `env` de parámetro, y el contrato real de `env` (M-1) | 6 | **NO** | K |
| `webrtc-viewer/test/puerto-anunciado.test.mjs` | B2 + **B4: anunciar == ATAR con el bind real** | 9 | **NO** | F · F2 · H · L |
| `webrtc-viewer/test/puerto-mal-formado.test.mjs` | entrypoint real por `process.env` | 3 | **NO** | **ninguna — enmascarado, y lo dice** |
| `mcp-launcher/test/catalogo-puerto-mal-formado.test.mjs` | el **anuncio** (catálogo, procesos hijo) | 5 | **NO** | A · B |

La columna «¿muerde?» sale de la re-corrida de §4.sexies, no de la intención con
que escribí cada fichero. `webrtc-viewer/test/puerto-mal-formado.test.mjs` **no
muerde ninguna ablación** y se queda igualmente: documenta el canal
`process.env` y lleva escrito en cabecera de quién es el mérito.

`operator-ui` **no tiene arnés de test de Node** (su `scripts.test` es
`ng test threejs-ui-lib`), así que su cableado no queda con gate automático:
está medido a mano en §1.2.bis y su mecanismo compartido —`readEnvPortAlias`—
sí está cubierto en `presets-sdk`, que sí corre CI. Declarado en §7.9.

Los tres cubren los **siete valores medidos** y los legítimos
(`1`, `80`, `3012`, `14012`, `65535`, `''`, ausente). El del catálogo además
barre **las 23 entradas** del catálogo con la configuración por defecto y
comprueba que ningún puerto anunciado es 0 ni sale de 1..65535 (el denominador
—23— se imprime en la propia corrida, no se cita de memoria).

---

## 6 · Estado de suites y gates (re-medido hoy)

| gate | antes | después |
| --- | --- | --- |
| `npm test -w @zeus/presets-sdk` | 55 · 55 pass · RC 0 | **69 · 69 pass · 0 fail · RC 0** |
| `npm test -w @zeus/app-shell` | 9 · 9 pass · RC 0 | **17 · 17 pass · 0 fail · RC 0** |
| `npm test -w @zeus/socket-server` | 23 · 23 pass · RC 0 | **28 · 28 pass · 0 fail · RC 0** |
| `npm test -w @zeus/webrtc-viewer` | 17 · 17 pass · RC 0 | **29 · 29 pass · 0 fail · RC 0** |
| `npm test -w @zeus/oasis-webrtc` | 3 · 3 pass · RC 0 | **9 · 9 pass · 0 fail · RC 0** |
| `npm test -w @zeus/room-client-browser` | 7 · 7 pass · RC 0 | **7 · 7 pass · 0 fail · RC 0** |
| `npm test -w @zeus/mcp-launcher` | 37 · 36 pass · 1 skip · RC 0 | **42 · 41 pass · 1 skip · RC 0** |
| `npm run gates` | — | **OK (0 offenders) · RC 0** |
| `npm run test:gates` | — | **160 · 160 pass · 0 skip · RC 0** (ver abajo) |
| `node scripts/generar-env.mjs --check` | — | **OK · RC 0** |
| `npx eslint` (todo lo tocado) | — | **RC 0** |
| `node e2e/local-first-ca.mjs` (gate `GD`) | 7/7 · 14 rojos | **7/7 · 14 rojos · RC 0** |

**Un intermitente observado y NO reproducido, que declaro en vez de callar.**
En una pasada de `npm test -w @zeus/mcp-launcher` vi **42 · 40 pass · 1 fail**.
No capturé el nombre del test, y **no se ha reproducido en las 9 pasadas
siguientes** (todas 42 · 41 pass · 1 skip · RC 0). Lo dejo escrito con su
denominador —**1 de 10**— porque un rojo visto una vez y no explicado no
desaparece por no mencionarlo. Ese paquete además no está en la matriz de CI
(§7.9), así que no hay historial de CI donde contrastarlo.

**M5 · el desglose de `test:gates`, explicado en vez de re-afirmado.** La
discrepancia (yo: 159 pass + 1 skip; la contrarrevisión: 160 pass + 0 skip) no
era ruido: el test que se omite es

```
ok 107 - equivalencia árbol vivo ↔ árbol commiteado: mismo JSON, byte a byte
  # SKIP conjunto de lectura del gate con cambios sin commitear (1):
     M packages/mesh/mcp-launcher/src/catalog.mjs — el árbol commiteado no los ve, por definición
```

Se auto-omite cuando hay cambios sin commitear **dentro del CONJUNTO DE LECTURA
del gate** — no cuando «el árbol está sucio», que es como lo escribí en la 2ª
vuelta y era impreciso (M-f). La condición es `lecturasDivergentes()`, en
`test/gates/matriz-51.test.mjs:295-301`.

La diferencia importa y la verifiqué contra mí mismo: al medir esto en la 3ª
vuelta mi árbol tenía **más de 20 ficheros modificados** y el gate dio
**160 · 160 pass · 0 skip**, porque `catalog.mjs` ya estaba commiteado. Yo lo
medí en la 2ª con `catalog.mjs` sin commitear; la contrarrevisión, con su
conjunto de lectura limpio. **Los dos números eran correctos**, y la causa no
era la que yo dije.

**Matriz de CI completa (27 workspaces), corrida en local: 26 en verde.**
El único rojo es **`@zeus/protocol`** (3 fallos), **preexistente y ajeno**:

- `git status -- packages/engine/protocol/` → **vacío** (no lo he tocado).
- `grep -rn "readEnvPort" packages/engine/protocol/` → **rc=1**, comprobado con
  `rc` aparte, no por tubería.

**M4 · corrijo mi atribución, que era más ancha que mi evidencia.** Dije «los 3
son CRLF». Son **dos**. El tercero,
`Eje IV: tsc resolves peer-card-seat + roles subpath types`, falla por otra cosa:

```
tsc --noEmit failed (Eje IV):
"C:\Program" no se reconoce como un comando interno o externo,
```

Es una ruta con espacios sin comillar al invocar `tsc`, resuelto fuera del
worktree por el `npm install` parcial de esta máquina — no fin de línea. Y **no
corrí `main`**: que ese tercero pase en un árbol limpio es medida de la
contrarrevisión (`C:/S_LAB/z-sdk`), no mía, y lo cito como suya. Sigue siendo
ajeno al WP por las dos comprobaciones de arriba.

Aviso del brief comprobado: el `npm ci` de esta máquina venía **sin
`node_modules` en absoluto** en este worktree. Se instaló con
`npm_config_logs_dir` dentro del worktree (`npm install --prefer-offline
--no-audit --no-fund`, 2699 paquetes, RC 0) y `dotenv`/`ajv` quedaron presentes
antes de medir nada. El directorio de logs se borró al terminar.

---

## 6.bis · Los menores de la devolución, uno a uno

| # | qué era | qué hice | evidencia |
| --- | --- | --- | --- |
| **M1** | `SPEC_TOOL_PORTS = resolveSpecToolPorts()` a nivel de módulo: 4 claves de tooling tumbaban el import de **todo** `@zeus/presets-sdk`, arrastrando a `linea-firehose` | **Perezoso.** Cada propiedad valida al leerse. Decidido con el dato de que **no tiene ni un consumidor** (`grep` repo-entero: sólo su definición y su tipo), así que hacerlo perezoso no rompe a nadie y quita el daño colateral | antes `ZEUS_PORT_DOCS=0 node -e "import('@zeus/presets-sdk/env')"` → **rc=1**; ahora importa, y `SPEC_TOOL_PORTS.docs` lanza al leerse. Test propio |
| **M2** | Tercer `catch` mudo (`loadEnv()`, `catalog.mjs:47-51`), inalcanzable hoy pero con **mi** comentario asignándole el papel que M1 producía | Misma condición que los otros dos: repropaga si `err.code` es de configuración, y el comentario dice que hoy es inalcanzable **y por qué se le pone la guarda igual** | — |
| **M3** | `launcher-server.mjs:15-18` conservaba `if (raw && Number.isFinite(Number(raw)))` — el antipatrón que la ficha condena por su nombre, muerto por accidente y revivible al arreglar O9 | Pasa por `readEnvPort` | entra en el censo (§1.1, fila 6) |
| **M4** | Atribución de los 3 rojos de `@zeus/protocol` | Corregida: 2 CRLF + 1 `tsc`/ruta con espacios; y digo que no corrí `main` | §6 |
| **M5** | Desglose de `test:gates` | Explicado: el skip depende del árbol sucio | §6 |
| **M6** | Encuadre de la ablación B | Reescrito: ceguera **por construcción**, no casi-fallo | §4 |
| **M7** | `smoke-dual-ui.mjs` y `smoke-external-consumer.mjs` con `Number(process.env…)` | `smoke-dual-ui.mjs` **arreglado** (sus 6 claves están en `.env.example`); `smoke-external-consumer.mjs` **declarado y no arreglado** | §1.1 filas 7-8, §7.8 |

### 6.ter · Los menores de la TERCERA vuelta

| # | qué era | qué hice | evidencia |
| --- | --- | --- | --- |
| **M-a** | Los tres alias eran **invisibles al lado del anuncio**: catálogo y `stop:services` no los conocían | **Elevado y cerrado**, no declarado: `UI_PORT_ENV_CHAIN` en la fuente única, y `applyEnvToUis` / `resolveAppPort` leen por cadena | §3.ter · ablación **I** |
| **M-b** | `create-app-config.mjs` usaba `fileConfig.server?.port` **sin validar**: `{"server":{"port":0}}` → `server.port = 0` | **Cerrado.** Un fichero de configuración **es** configuración, que es lo que la garantía dice cubrir. Se valida sólo si es el valor que gana, por coherencia con la regla del alias | ablación **J** · ninguno de los 6 `src/config.json` declara `server`, así que hoy era inalcanzable |
| **M-c** | `smoke-dual-ui` comprobaba `ZEUS_PORT_OPERATOR_UI` mientras operator-ui **ata por `OPERATOR_UI_PORT`, que gana** | `scriptorium` y `operator` pasan a ir **por cadena**: el smoke sondea el puerto que el servidor escucha | — |
| **M-d** | §7 saltaba del ítem 6 al 8 | Renumerado 1-12 | — |
| **M-e** | §9 no decía que el gate `GD` **exige `ZEUS_GAMES_LIBRARY`** | Añadido, con el valor usado | §9 |
| **M-f** | Mi M5 decía «árbol sucio» | **Impreciso y corregido**: el skip lo produce que haya cambios sin commitear **dentro del conjunto de lectura del gate** (`test/gates/matriz-51.test.mjs:295-301`, `lecturasDivergentes()`). Verificado por mí mismo: con **20+ ficheros modificados** pero `catalog.mjs` ya commiteado, da **160/160/0 skips** | §6 |

### 6.quater · Los menores de la CUARTA vuelta

| # | qué era | qué hice |
| --- | --- | --- |
| **M-i** | `readEnvPortAlias(names, fallback, null)` → `TypeError: Cannot read properties of null`, alcanzable desde API pública (`resolveWebRtcViewerEndpoint(null)`); el default `= process.env` sólo cubre `undefined` | `env == null` cubre los dos. Un error opaco donde debería haber fallback es un mal error. Aserto en el test de `oasis-webrtc` |
| **M-ii** | El hueco de S5, **con nombre**: `ZEUS_DISCOVERY_URLS` (en `.env.example:78`) mete puertos sin validar en la lista de discovery | **Declarado, no cerrado** (§7.16). Medido: `"http://localhost:0,http://localhost:0x10"` entra tal cual, rc=0. Severidad baja —es lista de sondeo y falla ruidoso— pero convierte mi límite abstracto en un caso concreto |

**Un aserto mío que era más ancho que la verdad, cazado por su propio test.**
Escribí en el test de `oasis-webrtc` que «el mapa explícito NO se mezcla con
`process.env`». **Falso**: el mapa gobierna la **búsqueda de la clave**, pero el
**fallback** es `resolveZeusUiPorts().oasisWebrtc.port`, que sí lee
`process.env`. Medido:

```
ZEUS_PORT_OASIS_WEBRTC=14099
  resolveOasisWebrtcListen({ clave: '14022' }).port -> 14022   (la CLAVE la manda el mapa)
  resolveOasisWebrtcListen({}).port                 -> 14099   (el FALLBACK no)
```

Corregido el aserto para decir lo que pasa, y declarado en §7.17. Es
preexistente y lo mismo ocurre en `game-bridge`.

### 6.quinquies · Los menores de la QUINTA vuelta

**M-1 · declaré la mitad del fallback y no la mitad del aborto.**
Escribí el trasvase benigno (un valor **bien formado** de `process.env` se cuela
como fallback) y no escribí el reverso, que es el que muerde:

```
process.env ZEUS_PORT_OASIS_WEBRTC=0x10  +  env={ ZEUS_PORT_OASIS_WEBRTC: '5555' }
   →  rc=1, ABORTA          (y lo mismo en `game-bridge`)
```

El llamante que pasa su propio mapa **correcto** muere por una variable ambiente
que estaba sobreescribiendo explícitamente. Y eso **contradecía el docstring que
yo mismo escribí**: *«quien pasa su propio mapa está diciendo "resuelve contra
ESTO"»*. Una frase que promete aislamiento y no lo da es la clase de este WP
entero — la tercera vez que me pasa, ahora en una promesa de API.

**La conducta se conserva** (abortar ante cualquier configuración mal formada es
lo que pide la CA, y falla ruidoso y seguro). **Lo que se corrige es la
promesa**: el JSDoc de `readEnvPortAlias` y el `.d.ts` publicado dicen ahora el
alcance exacto —`env` gobierna de dónde se leen las claves **de esa llamada**, y
**no aísla de `process.env`** ni en el fallback ni frente al aborto— y hay
**aserto** que lo fija, para que la promesa no vuelva a separarse del código.
Declarado en §7.19 con su nombre: *abortar con configuración explícita válida*.

**M-2 · el único test de bind con gate en CI no fijaba el mecanismo que decía fijar.**
Con `readEnvPort` leniente, `@zeus/app-shell` quedaba **15/15 verde**: el aborto
venía de `readEnvPortAlias` vía `resolveZeusUiPorts()` (`create-app-config.mjs:205`),
**no de `resolveAppPort`**. Yo había declarado el hecho («cuatro suites verdes»)
sin ver lo que importaba: **el enmascarado era justo el único con gate en CI**, y
`mcp-launcher`, `webrtc-viewer` y `oasis-webrtc` están fuera. O sea que **CI no
tenía ni un test que mordiera sobre el bind**.

Cerrado por la grieta que deja el propio diseño: `ZEUS_PORT_PLAYER_DEBUG` está
en `MCP_PORT_ENV` y **no** en `UI_PORT_ENV`, así que `resolveZeusUiPorts()` no lo
mira; y `resolvePlayerDebugEndpoint()` (`:231`) es condicional y va **después**.
Con `appId: 'debug'` el único validador del camino es `resolveAppPort`:

```
at readEnvPort          (env/index.mjs:318)
at resolveAppPort       (env/index.mjs:457)
at resolveRuntimeConfig (create-app-config.mjs:211)
```

Ablación corrida **después** del cambio, como se pidió:

```
A · readEnvPort sin guarda  →  app-shell  8/7pass/1fail
     cae: U266/M-2 · resolveAppPort valida por si mismo (sin resolveZeusUiPorts delante)
     motivo: Missing expected exception: "0" deberia abortar por resolveAppPort
```

**CI pasa a tener un test que muerde sobre el bind**, que antes no tenía.

**Y una guarda ajena que me cazó, como debía.** Al tocar
`socket-server/src/config.mjs` saltó el censo de despacho de **WP-U194**
(`relay-contract.test.mjs`), que sella la **forma** de todos los fuentes del
paquete para que no entre una vía de emisión nueva por la puerta de atrás. Es
legítimo re-anclar —el propio test lo dice— y lo hice comprobando antes lo que
importa: `config.mjs` sigue con **`emisiones=0`** y `relay.mjs`, el único
emisor, queda intacto con sus **5**, así que `EMISIONES_ANCLADAS` no se mueve.
El sello anterior queda escrito junto al nuevo.

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
7. **`scripts/smoke-external-consumer.mjs:30` sigue con `Number(process.env…)`**
   sobre `ZEUS_SMOKE_SCRIPTORIUM_PORT`. **No** lo arreglo, y la razón es que
   acota el daño: esa clave **no está en `.env.example`** (comprobado, `rc=1`),
   así que la cabecera que escribí no promete nada sobre ella; es una variable
   de arnés con defecto `13054`; y el script no importa `presets-sdk`, así que
   arreglarlo significaría acoplarlo sólo por consistencia. Queda en el censo.
8. **`operator-ui` no tiene arnés de test de Node.** Su `scripts.test` es
   `ng test threejs-ui-lib`, así que el cableado de su puerto **no queda con
   gate automático**: está medido a mano (§1.2.bis) y su mecanismo compartido
   (`readEnvPortAlias`) sí tiene test en `presets-sdk`, que corre CI. Añadirle
   un arnés de Node excede este WP.
9. **`webrtc-viewer` y `mcp-launcher` no están en la matriz de CI**, así que
    dos de mis cinco ficheros de test sólo corren en local. Es la misma deuda
    del §7.1 y se enruta con él.
10. **La distinción «entorno se valida / explícito no» deja una puerta abierta
    por diseño**: quien llame `createScriptoriumServer({ port: -1 })` desde
    código sigue pasando sin validar. Es deliberado —`{ port: 0 }` es idioma
    vivo (§4.ter)— pero significa que la garantía es sobre **configuración**,
    no sobre todo puerto posible. No medí qué pasa con un explícito absurdo.
11. **`reservarPuertoLibre()` del e2e no es reserva atómica**: queda la ventana
    entre soltar y atar. Es el mismo trato que U267 aceptó y declaró.

12. **El orden de precedencia de los alias se congela por compatibilidad, no
    por criterio.** `operator` y `webrtcViewer` leen primero el alias legado
    porque es lo que hacían; `scriptorium` primero la canónica. Uniformarlo
    sería más limpio y **movería el puerto** a quien ya lo tenga configurado.
    Queda como deuda con nombre, no como descuido.
13. **La cobertura de `game-bridge` por `process.env` la da otro guardián.**
    `resolveZeusUiPorts` (vía `UI_PORT_ENV_CHAIN`) dispara antes que el
    cableado del propio fichero. Lo que este WP demuestra de `game-bridge` es
    la vía del **`env` por parámetro** y la **coincidencia anuncio/bind**; la
    otra es defensa en profundidad, y está dicho en el test.
14. **El instrumento S5 depende de que las claves «tengan pinta de puerto»**
    (`[A-Z_]*PORT[A-Z_]*`). Una clave de puerto que no lleve `PORT` en el
    nombre se le escapa. No encontré ninguna, pero es el límite del método que
    propongo, y conviene decirlo en vez de presentarlo como exhaustivo.
15. **`ZEUS_DISCOVERY_URLS` mete puertos sin validar** (M-ii). Es el hueco de
    S5 con nombre: la clave no lleva `PORT`, así que mi instrumento no la ve.
    Medido: `"http://localhost:0,http://localhost:0x10"` entra tal cual, rc=0.
    Severidad baja —lista de sondeo, falla ruidoso— y **no la cierro**: validar
    URLs es el eje de `resolveZeusHost` (§7.3), no el de esta ficha.
16. **El `env` explícito gobierna la clave, no el fallback.** Con un mapa
    propio, el valor por defecto sigue saliendo de `resolveZeusUiPorts()`, que
    lee `process.env`. Afecta a `oasis-webrtc` y `game-bridge`, es preexistente
    y está aseverado tal cual (no como me habría gustado que fuese).
17. **`@zeus/oasis-webrtc` tampoco está en la matriz de CI**, así que el test
    de B3 sólo corre en local. Se suma a §7.9.
19. **Abortar con configuración explícita válida** (M-1). Con `process.env` mal
    formado, `resolveOasisWebrtcListen` / `resolveWebRtcViewerEndpoint` abortan
    **aunque el mapa `env` que se les pasa sea válido**, porque el resolver del
    mesh dispara al calcular el fallback. Es **deliberado** —la CA pide abortar
    ante configuración mal formada, y falla ruidoso— pero significa que `env`
    **no es un mecanismo de aislamiento**. Está dicho en el JSDoc, en el `.d.ts`
    y con aserto. Aislarlo de verdad exigiría pasar el mapa también a los
    resolvers del mesh, que hoy no lo aceptan; excede esta ficha.
20. **Los tres ficheros que `npm install` marca como modificados**
   (`feed-kit/bin/jetstream-sync.mjs`, `linea-kit/bin/linea-kit.mjs`,
   `playbook-kit/bin/run-playbook.mjs`) **no se commitean**: `git diff --quiet`
   sobre los tres → **rc=0**, o sea sin cambio de contenido. Es el `mtime` de
   npm (O7 de U181). `linea-kit` es además territorio prohibido y queda intacto.

---

## 8 · Lo que NO hice y por qué

| no hecho | por qué |
| --- | --- |
| Añadir `@zeus/mcp-launcher` / `@zeus/webrtc-viewer` a la matriz de CI | Sin dato propio de esas suites en CI; radio mayor que este WP. Enrutado (§7.1, §7.10). |
| Acotar la cabecera de `.env.example` a las claves cubiertas | Era la salida barata de B1. Se cerró **por arriba**: los tres servidores pasan por la fuente única, así que la cabecera es verdad y no hace falta encogerla. |
| Relajar la guarda para que `ZEUS_*=0` siga siendo «efímero» | Habría arreglado el gate `GD` en una línea y **destruido la CA**. Se arregló el arnés, no la guarda (§4.ter). |
| Arreglar `smoke-external-consumer.mjs` | Su clave no está en `.env.example`; acoplarlo a presets-sdk sólo por simetría (§7.8). |
| Darle arnés de test de Node a `operator-ui` | Excede el WP (§7.9). |
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

# 5 · B1 · los tres servidores, por su entrypoint documentado
(cd packages/mesh/socket-server && ZEUS_PORT_SCRIPTORIUM=0 node src/index.mjs); echo "rc=$?"   # 1
ZEUS_PORT_OPERATOR_UI=0    node packages/mesh/operator-ui/serve.mjs;    echo "rc=$?"           # 1
OPERATOR_UI_PORT=0         node packages/mesh/operator-ui/serve.mjs;    echo "rc=$?"           # 1
ZEUS_PORT_WEBRTC_VIEWER=03012 node packages/mesh/webrtc-viewer/serve.mjs; echo "rc=$?"         # 1
#   y el idioma que NO se rompe:
node -e "import('./packages/mesh/socket-server/src/config.mjs').then(m=>console.log(m.resolveConfig({port:0}).port))"   # 0

# 6 · suites y gates
npm test -w @zeus/presets-sdk     # 67 · 67 pass · RC 0
npm test -w @zeus/app-shell       # 13 · 13 pass · RC 0
npm test -w @zeus/socket-server   # 28 · 28 pass · RC 0
npm test -w @zeus/webrtc-viewer   # 20 · 20 pass · RC 0
npm test -w @zeus/mcp-launcher    # 42 · 41 pass · 1 skip · RC 0
npm run gates                     # OK (0 offenders) · RC 0
npm run test:gates                # 160 · 160 pass · 0 skip · RC 0  (con el árbol limpio)
node scripts/generar-env.mjs --check   # OK · RC 0
# el gate GD EXIGE ZEUS_GAMES_LIBRARY apuntando al mundo hermano; sin ella el
# paso 1 muere y el gate no llega a correr (M-e).
ZEUS_GAMES_LIBRARY=C:/S_LAB/g-sdk node e2e/local-first-ca.mjs   # 7/7 · 14 rojos · RC 0

# 7 · las ablaciones (§4 y §4.bis): restaurar el cuerpo viejo de readEnvPort, o
#     neutralizar el re-throw del catálogo, o devolver cada servidor a su
#     `Number(process.env…)`, y ver enrojecer la suite que toca — comprobando
#     CUÁL aserto cae, no sólo que caiga (la ablación F enseña por qué).

rm -rf .tmp-npm-logs
```

**Higiene final**: sin listeners residuales (`netstat` → rc=1), sin
`data/orchestrator`, sin `.env` temporal, sin ablaciones en el árbol
(`grep -rn ABLACION` → rc=1), `.tmp-npm-logs` borrado, y `git status` con sólo
los ficheros del WP más los 3 de O7 sin cambio de contenido y no commiteados.
