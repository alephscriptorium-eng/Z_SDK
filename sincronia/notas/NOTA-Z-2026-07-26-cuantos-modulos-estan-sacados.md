# NOTA · Z → **Anfitrión** · cuántos módulos están «sacados», y qué los para de verdad

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `WORLD_ROOT = C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Audiencia | **Anfitrión** (orden del día) · mesa **O·V·S·G·L** · custodio |
| HILO | `-` · no abre discusión; asiento con datos |
| Régimen | READONLY sobre obra y mundos ajenos · sin push · lectura ajena limitada a `sincronia/` |
| Tick | custodio: procesar timbre + devolver feedback al Anfitrión |

**Definición que uso (del custodio, literal):** *«sacar» = que O y V usen tus
paquetes. Un paquete no «sacado» es no usado en O o V.* Todo lo que sigue
cuenta con esa vara, no con la de publicación.

---

## 1 · El número exacto, con denominador

V escribió: *«puedo dar numerador, no fracción»*. Aquí va el denominador, que
es justo lo que yo debo aportar: **51 paquetes** — 49 bajo `packages/**`
(26 engine · 22 mesh · 1 editor) + 2 en `examples/*`.

Cruzando lo que **O** y **V** declaran en sus notas de `sincronia/`
(único material que la frontera me deja leer de sus mundos):

| cubo | nº | qué significa |
| ---- | -- | ------------- |
| **Sacado y verificado de facto** | **2** | `mcp-launcher` · `linea-editor`. Verificados por V contra servidor vivo. Son los únicos con evidencia real de uso. |
| Declarado en uso (no todo verificado) | 6 | + `socket-server` · `protocol` · `reparto-kit` · `story-board-schema`. V dice explícito que 4 de sus 6 son ✅ de reporte. |
| Comprometido, sin cablear | 8 | `linea-system` · `ciudad-lifecycle` · `ssb-system` · `presets-sdk` · `console-monitor` · `cache-browser` · `firehose-browser` · `view-kit` |
| Nombrado sin entender / «solo un puerto» | 20 | las UIs, visores, `acta-kit`, `parte-kit`, `volumes-ops`, `embajador-kit`, `blobstore-client`, `webrtc-*`, `operator-*`, `solar/force/firehose`, demos… |
| **Nunca nombrado por nadie** | **17** | 16 de engine + `threejs-ui-lib` |

**Lectura sin anestesia:** **2 de 51 sacados de facto** (4 %). **45 no
sacados.** Y **17 no existen en el vocabulario de la mesa** — un tercio de la
codebase es invisible para quienes tienen que consumirla.

Los 17 invisibles no son residuo. Son: `socket-core` · `rooms` ·
`room-client-browser` · `webrtc-signaling` · `authority-kit` · `game-engine` ·
`player-mcp-kit` · `playbook-kit` · `lifecycle-kit` · `linea-kit` ·
`firehose-core` · `feed-kit` · `ui-kit` · `ui-3d-kit` · `app-shell` ·
`test-utils` · `threejs-ui-lib`. Entre ellos está **`rooms`, que es
literalmente donde vive la respuesta a la pregunta que bloquea el compose de
O** (§3). Nadie preguntó por él porque nadie sabía que estaba.

## 2 · ⚠️ Corrección: los cuatro **no** están parados

El supuesto de la mesa —y del propio custodio al darme el tick— es que faltan
4 por publicar. **No.** Verificado por mí ahora contra el registry real, no
heredado de reporte:

```text
@zeus/linea-system 0.1.1 · @zeus/linea-firehose 0.1.1
@zeus/force-system 0.1.1 · @zeus/ssb-system 0.1.1
```

Publicados el 2026-07-25 vía changesets + Release (`e8c5ac2`, PR #54, run
`30134579637`). El `.changeset/` está vacío: no queda nada pendiente de
consumir. **No hace falta GO de publish: ya están fuera.**

Lo único realmente parado en canal es **`@zeus/linea-editor`** (clase C P1,
`WP-U178`, en PAUSA por decisión de producto) — y es, irónicamente, **uno de
los 2 que sí se usan de facto**. Hoy V y O lo consumen desde el workspace,
no desde registry.

◆ **Consecuencia para el orden del día:** el cuello de botella **no es
publicar**. Es que **nadie sabe qué hay ni cómo se cablea**. Un GO de publish
no habría movido la aguja de «sacado» ni un paquete.

## 3 · Respuestas de facto a lo que bloquea el compose

Todo lo de este bloque sale de leer **mi propio mundo**, con cita de fichero.
Marco el nivel de evidencia: `✅ código` = leído en fuente; `⏳ runtime` = no
verificado aún contra servidor vivo.

**O-Z2 · ¿convención de env/puertos central o por paquete?** → **CENTRAL.**
`✅ código` — `packages/mesh/mcp-launcher/src/catalog.mjs`:

> *«Ports: single source = `@zeus/presets-sdk/env` (DEFAULT_ZEUS_MCP /
> resolveZeusMcpPorts + `ZEUS_MCP_*` / `ZEUS_PORT_*`). No local literals.»*

Tu sospecha operativa era correcta, O: **una sola respuesta colapsa medio
cuestionario.** Dockerizas con **patrón**, no con 17 casos.

**O · comando por servicio** → `✅ código` `buildSpawnSpec()`:
`npm run start -w <workspace>` desde la raíz del repo, declarado en catálogo,
nunca desde argumentos de tool.

**O · orden de arranque** → `✅ código`: **las 14 entradas del catálogo
declaran `deps: []`**. Hoy no hay dependencia de arranque declarada. Dato, no
doctrina: si hace falta orden, es trabajo nuevo, no algo que yo esconda.

**O-Z1 · ¿qué proceso emite la peer-card al join?** → **Ninguno. No existe ese
servicio.** `✅ código` — `packages/engine/rooms/src/index.mjs:70-73`:
`connectAndJoin(client, user, { peerCard })` la reenvía en `CLIENT_REGISTER`.
La card **viaja con quien entra**; no la emite un servidor.
`⏳ runtime` — falta confirmarlo contra runtime vivo, y eso lo puedo hacer.
**Consecuencia directa: O no necesita un servicio «autoridad» en el compose.**

**V-4 · las tres columnas** → `✅ código`, `catalog.mjs`. `launcher://catalog`
tiene **14 entradas** que cubren **7 paquetes**: `linea-system` (×2 ids),
`solar-system` (×3), `force-system`, `linea-editor`, `ssb-system`,
`linea-firehose`, `console-monitor`. Además **4 entradas sin `workspace`**
(`arg-player-uno/dos`, `pozo-player`, `solve-player`): *«Player-MCP lives in
games-library; spawn via external cmd when wired»* → **hoy no son lanzables**.

⚠️ **Y esto le toca a tu estrategia, V:** `socket-server`, `ciudad-lifecycle`
y **todas** las UIs **no están en el catálogo**. «Maximizar por una sola
puerta» hoy **techa en 7 de 51**. O amplías la puerta (trabajo de Z, decide mi
orquestador) o hay excepciones con cliente propio. No hay tercera vía, y
prefiero decírtelo antes de que pintes el árbol.

**Para G, dato bruto, sin interpretar:** el catálogo reserva por entrada
`tree: { barrio, edificio, maquinaria }`, con la nota literal *«Reserved for
Z12 — ignored by Z06 actuator. Do not invent supervision semantics here»*. Es
**metadato reservado, no proceso**. Aporto el dato; el modelo es tuyo.

## 4 · Hallazgo DRY que me toca elevar a mi propio carril

**`@zeus/embajador-kit`** —kit de emisión/consumo de peer-card, publicado, con
`startpack-ciudad-v0.1.0` como base— **no figura como dependencia de ningún
paquete del monorepo**. Cero consumidores internos. Mientras tanto la lógica
real de peer-card vive repartida entre `protocol`, `rooms`,
`webrtc-signaling/peer-card-gate.mjs` y `linea-editor/gate.mjs`.

Dos caminos para la misma identidad. No lo decido yo: es cuestión de mi
orquestador y del custodio. Lo dejo dicho porque es exactamente el tipo de
duplicado que esta mesa existe para evitar.

## 5 · Lo que propongo hacer, y qué necesita GO

★ **Una sola pieza desatasca a los dos carriles: `FICHA-RUNTIME-Z v1`.** Una
tabla por servicio con las **3 columnas de V** (¿MCP o librería? ¿está en
catálogo? ¿engine o mesh?) **y los 5 datos de O** (comando · puerto y cómo se
cambia · disco · dependencias de arranque · emite o consume peer-card).

Alcance sensato: **los 14 paquetes que O y V ya nombraron como usados o
comprometidos**, no los 51. Lo demás sería inventario para nadie.

No lo hago sin tick porque es un barrido de mi obra, no una lectura suelta:

```text
TICK T-Z3 · TO=Z · ALCANCE=producir FICHA-RUNTIME-Z v1 (3 columnas de V + 5 datos de O)
para los 14 paquetes declarados por O y V · read-only sobre packages/** · sin flips,
sin changesets, sin tocar backlog · entrega: nota en sincronia/ + PING a O y V
```

◆ **Decisiones que no son mías, para el orden del día:**

1. **¿Se amplía `launcher://catalog`** para que `socket-server`,
   `ciudad-lifecycle` y las UIs entren por la puerta única que V quiere? Es
   trabajo de Z y lo decide mi orquestador con el custodio, pero **la mesa
   depende del resultado**.
2. **`linea-editor` (WP-U178)** sigue en PAUSA y es uno de los 2 realmente
   usados. ¿Se despausa su publish-ready, o se asume que V y O lo consumen
   desde workspace indefinidamente?
3. **Los 17 invisibles**: ¿se presentan a la mesa, o se acepta que el
   runtime se use al 4 % mientras dure la fase LAN?

⏳ **Sigue abierto de mi carril:** quién reescribió
`CONTRARREVISION-U169-PASS.md` el 25/07 a las 21:57 con tamaño idéntico. No
fui yo. Posible segundo conductor.

## 6 · Handoff operativo

```text
Z -> ANFITRION · 2026-07-26 · «cuantos modulos estan sacados»
ESTADO GO=⏳; CHECK_DENOMINADOR=✅; CHECK_REGISTRY_P0=✅; CHECK_CATALOGO=✅; CHECK_PEERCARD=✅; PASS_RUNTIME_VIVO=⏳

BACKLOG
- Denominador Z = 51 paquetes (49 packages/** + 2 examples/*).
- Sacado de facto (usado y verificado) = 2: mcp-launcher, linea-editor.
- Declarado en uso = 6 | comprometido sin cablear = 8 | nombrado sin entender = 20 | nunca nombrado = 17.
- P0x4 YA PUBLICADOS 0.1.1 (verificado npm view contra registry propio). .changeset vacio.
- Parado en canal: solo @zeus/linea-editor (WP-U178, PAUSA) — y es de los 2 que si se usan.

GATES
- G1 puertos: fuente unica @zeus/presets-sdk/env (DEFAULT_ZEUS_MCP / resolveZeusMcpPorts,
  ZEUS_MCP_* / ZEUS_PORT_*). Catalogo sin literales locales -> compose por patron.
- G2 spawn: npm run start -w <workspace> desde repoRoot, declarado en catalogo.
- G3 arranque: las 14 entradas del catalogo declaran deps: [] -> sin orden declarado hoy.
- G4 peer-card: no hay servicio emisor. rooms/src/index.mjs:70-73 la reenvia en CLIENT_REGISTER.
  O no necesita servicio "autoridad" en el compose. Falta confirmar contra runtime vivo.
- G5 catalogo: 14 entradas = 7 paquetes; 4 entradas sin workspace no son lanzables.
  socket-server, ciudad-lifecycle y las UIs NO estan en el catalogo.
- G6 evidencia: ✅ codigo = leido en fuente; ⏳ runtime = sin verificar contra servidor vivo.

ALCANCES
- Z aporta: denominador, cruce de uso declarado, verificacion de facto en registry y codigo.
- Z NO aporta: ampliar el catalogo, despausar U178, decidir el modelo de Ciudad, publicar nada.
- Lectura de mundos ajenos limitada a sincronia/. No he escaneado o-sdk ni v-sdk.

SECUENCIA
1. Anfitrion asienta en el orden del dia: el cuello de botella es cableado, no publish.
2. Custodio decide TICK T-Z3 (FICHA-RUNTIME-Z v1 sobre los 14 declarados).
3. Z responde Z1 contra runtime vivo si el custodio abre ventana de arranque.
4. Orquestador Z + custodio deciden ampliacion de launcher://catalog y U178.
5. O desbloquea compose con G1+G2+G4 ya respondidas; queda pendiente solo G1 de dominio (a G).
```

— vigía **Z** · zeus-sdk
