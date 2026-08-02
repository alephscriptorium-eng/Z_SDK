# WP-U266 · El puerto mal formado falla al arrancar y no se anuncia

- **Rama**: `wp/u266-puerto-mal-formado` · base **`52d63e6`**
- **Worktree**: `C:\S_LAB\wt\z-u266` (canónico `C:\S_LAB\v-sdk` no tocado)
- **Fecha de ejecución**: 2026-08-02
- **Preflight**: `identidad-raiz: PASS` · `world-real = git-toplevel = c:/s_lab/wt/z-u266`

---

## 0 · Resultado en una línea

`readEnvPort` valida ahora la **cadena cruda** (entero decimal 1..65535) y
**lanza** en vez de caer al defecto; el catálogo **deja de tragarse** ese error;
y los **tres servidores que resolvían su puerto a mano** pasan por la fuente
única. Hacen falta las tres cosas: con sólo la primera, medido, el catálogo
anunciaba **4101** en verde con `ZEUS_MCP_SUN=0`, y `socket-server` seguía
levantando en un efímero con `ZEUS_PORT_SCRIPTORIUM=0`.

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
| 6 | `mcp-launcher/src/launcher-server.mjs` (`:15-18` antes; `:24` ahora) | `ZEUS_MCP_LAUNCHER` | sí | M3 · antipatrón · ARREGLADO |
| 7 | `scripts/smoke-dual-ui.mjs:21-26` | 6 claves | sí | M7 · ARREGLADO |
| 8 | `scripts/smoke-external-consumer.mjs:30` | `ZEUS_SMOKE_SCRIPTORIUM_PORT` | **no** | M7 · declarado, **no** arreglado (§7.8) |
| 9 | `e2e/*.mjs` (helpers, demos) | varias | — | **escriben** el entorno, no lo leen para atar |

**Cifra nueva: 3 servidores de producción resolvían su puerto fuera de la fuente
única** (más 1 servidor MCP, 2 scripts y el `e2e`), no «1 consumidor».

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

## 5 · Vectores de prueba entregados (CA-3)

| fichero | qué ejerce | tests | ¿lo corre CI? |
| --- | --- | --- | --- |
| `packages/engine/presets-sdk/test/env-puerto-mal-formado.mjs` | la **función**, `readEnvPortAlias`, `SPEC_TOOL_PORTS` perezoso y la precedencia `.env`/proceso | 12 | **sí** |
| `packages/engine/app-shell/test/puerto-mal-formado.mjs` | el **bind** (`createAppConfig → resolveAppPort`) | 4 | **sí** |
| `packages/mesh/socket-server/test/puerto-mal-formado.test.mjs` | el servidor de B1, con alias y `{port:0}` | 5 | **sí** |
| `packages/mesh/webrtc-viewer/test/puerto-mal-formado.test.mjs` | entrypoint real, alias legado | 3 | **NO** |
| `packages/mesh/mcp-launcher/test/catalogo-puerto-mal-formado.test.mjs` | el **anuncio** (catálogo, en procesos hijo) | 5 | **NO** — ver §7 |

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
| `npm test -w @zeus/presets-sdk` | 55 · 55 pass · RC 0 | **67 · 67 pass · 0 fail · RC 0** |
| `npm test -w @zeus/app-shell` | 9 · 9 pass · RC 0 | **13 · 13 pass · 0 fail · RC 0** |
| `npm test -w @zeus/socket-server` | 23 · 23 pass · RC 0 | **28 · 28 pass · 0 fail · RC 0** |
| `npm test -w @zeus/webrtc-viewer` | 17 · 17 pass · RC 0 | **20 · 20 pass · 0 fail · RC 0** |
| `npm test -w @zeus/mcp-launcher` | 37 · 36 pass · 1 skip · RC 0 | **42 · 41 pass · 1 skip · RC 0** |
| `npm run gates` | — | **OK (0 offenders) · RC 0** |
| `npm run test:gates` | — | **160 · 160 pass · 0 skip · RC 0** (ver abajo) |
| `node scripts/generar-env.mjs --check` | — | **OK · RC 0** |
| `npx eslint` (todo lo tocado) | — | **RC 0** |
| `node e2e/local-first-ca.mjs` (gate `GD`) | 7/7 · 14 rojos | **7/7 · 14 rojos · RC 0** |

**M5 · el desglose de `test:gates`, explicado en vez de re-afirmado.** La
discrepancia (yo: 159 pass + 1 skip; la contrarrevisión: 160 pass + 0 skip) no
era ruido: el test que se omite es

```
ok 107 - equivalencia árbol vivo ↔ árbol commiteado: mismo JSON, byte a byte
  # SKIP conjunto de lectura del gate con cambios sin commitear (1):
     M packages/mesh/mcp-launcher/src/catalog.mjs — el árbol commiteado no los ve, por definición
```

Se **auto-omite cuando el árbol tiene cambios sin commitear** en su conjunto de
lectura. Yo lo medí con `catalog.mjs` sucio; la contrarrevisión, sobre árbol
limpio. **Los dos números son correctos, en estados de árbol distintos**, y el
gate es honesto al decir por qué se omite. Con todo commiteado da **160/160/0**,
que es el que dejo en la tabla.

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
8. **`scripts/smoke-external-consumer.mjs:30` sigue con `Number(process.env…)`**
   sobre `ZEUS_SMOKE_SCRIPTORIUM_PORT`. **No** lo arreglo, y la razón es que
   acota el daño: esa clave **no está en `.env.example`** (comprobado, `rc=1`),
   así que la cabecera que escribí no promete nada sobre ella; es una variable
   de arnés con defecto `13054`; y el script no importa `presets-sdk`, así que
   arreglarlo significaría acoplarlo sólo por consistencia. Queda en el censo.
9. **`operator-ui` no tiene arnés de test de Node.** Su `scripts.test` es
   `ng test threejs-ui-lib`, así que el cableado de su puerto **no queda con
   gate automático**: está medido a mano (§1.2.bis) y su mecanismo compartido
   (`readEnvPortAlias`) sí tiene test en `presets-sdk`, que corre CI. Añadirle
   un arnés de Node excede este WP.
10. **`webrtc-viewer` y `mcp-launcher` no están en la matriz de CI**, así que
    dos de mis cinco ficheros de test sólo corren en local. Es la misma deuda
    del §7.1 y se enruta con él.
11. **La distinción «entorno se valida / explícito no» deja una puerta abierta
    por diseño**: quien llame `createScriptoriumServer({ port: -1 })` desde
    código sigue pasando sin validar. Es deliberado —`{ port: 0 }` es idioma
    vivo (§4.ter)— pero significa que la garantía es sobre **configuración**,
    no sobre todo puerto posible. No medí qué pasa con un explícito absurdo.
12. **`reservarPuertoLibre()` del e2e no es reserva atómica**: queda la ventana
    entre soltar y atar. Es el mismo trato que U267 aceptó y declaró.

13. **Los tres ficheros que `npm install` marca como modificados**
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
