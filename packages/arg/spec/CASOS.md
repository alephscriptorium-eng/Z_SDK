# CAUDAL — Playbook de casos de validación (humano + agente MCP)

Documento bilingüe humano/agente: un **agente LLM** conectado a
`@zeus/arg-player-mcp` ejecuta los pasos (llamadas MCP literales) mientras un
**humano** observa las vistas del arg-console (:3021) y los navegadores
reales. Cada caso termina con evidencia verificable en `arg:state` /
`arg:ledger` (la respuesta de cada tool es `{ ok, error?, evidencia }`).

## Cómo conectar

| pieza | URL |
| ----- | --- |
| MCP jugador **uno** | `http://localhost:4121/mcp` · health `http://localhost:4121/mcp/health` |
| MCP jugador **dos** | `http://localhost:4122/mcp` · health `http://localhost:4122/mcp/health` |
| MCP Inspector (deep-link) | `http://localhost:4121/docs` / `http://localhost:4122/docs` (arranca antes `npm run spec:inspector`) |
| Vistas humanas | `npm run demo:arg` → tablero `:3021/views/tablero`, jugador `:3021/views/jugador?actor=uno` (y `?actor=dos`), cache-browser `:3015/?actor=…`, firehose-browser `:3016/?actor=…` |

- Transporte: Streamable HTTP (`POST /mcp`, JSON-RPC `initialize` +
  `tools/call`). Espera a que `/mcp/health` responda `connected: true` antes
  de llamar tools (el wrapper reintenta la room en segundo plano).
- Una instancia = UN actor: el servidor de :4121 solo actúa como `uno`, el de
  :4122 solo como `dos` (G-ARG.1: emite intents, jamás muta dominio).
- El playbook completo vive en el resource `arg://casos`; el prompt MCP
  `validar-caso {casoId}` devuelve un caso listo para ejecutar.
- Rechazos: la autoridad ignora intents inválidos (no-op). El wrapper detecta
  el no-op (~3 s) y devuelve `ok:false` con la regla probable del reducer.

Convención de pasos: `tool {args JSON}` sobre el MCP del actor indicado.

---

## C-01 — join y spawn en plaza

- **Precondición**: demo levantada (autoridad emitiendo `arg:state`), health `connected: true`.
- **Pasos del agente (uno)**:
  1. `player_join {}`
  2. `player_state {}`
- **Qué observa el humano**: en el **tablero** aparece un monigote nuevo en la plaza; en `jugador?actor=uno` la cámara chase lo encuadra.
- **Criterio de éxito**: `ok:true` con `evidencia.actor` → `nodeId:"plaza"`, `zone:"terraza"`, `pose:"idle"`, `score:{labeled:0,excavated:0}`.
- **Errores esperados**: ninguno. Repetir `player_join` es idempotente.

## C-02 — move válido plaza → terraza-a

- **Precondición**: C-01 (uno en `plaza`).
- **Pasos del agente (uno)**:
  1. `player_move {"nodeId":"terraza-a"}`
- **Qué observa el humano**: en el tablero/jugador el monigote camina la pasarela (pose `walk`) y se detiene en la terraza oeste.
- **Criterio de éxito**: `ok:true`, `evidencia.actor.nodeId === "terraza-a"`, `llegada:true` (durante el tránsito la pose fue `walk`).
- **Errores esperados**: ninguno.

## C-02b — move inválido sin enlace (no-op)

- **Precondición**: uno en `plaza` (o cualquier nodo NO adyacente a `cima-a`).
- **Pasos del agente (uno)**:
  1. `player_move {"nodeId":"cima-a"}`
- **Qué observa el humano**: nada — el monigote NO se mueve (la autoridad ignora el intent).
- **Criterio de éxito**: `ok:false`, `error:"sin_enlace"` (regla probable por dry-run del reducer); el actor sigue en su nodo.
- **Errores esperados**: `sin_enlace`.

## C-03 — goto multi-salto plaza → cima-a

- **Precondición**: uno en `plaza`.
- **Pasos del agente (uno)**:
  1. `player_goto {"nodeId":"cima-a"}`
- **Qué observa el humano**: en `jugador?actor=uno` la **chase cam** sigue al monigote plaza → terraza-a → cima-a; en la cima ve el grifo A con su manómetro.
- **Criterio de éxito**: `ok:true`, `evidencia.ruta === ["terraza-a","cima-a"]`, `evidencia.actor.nodeId === "cima-a"`, `zone:"cima"`.
- **Errores esperados**: ninguno.

## C-04 — contacto con el grifo

- **Precondición**: C-03 (uno en `cima-a`, dentro del radio de contacto 3.5).
- **Pasos del agente (uno)**:
  1. `player_contact {"targetId":"grifo-a"}`
- **Qué observa el humano**: el **anillo de cloak** del grifo pulsa; en la vista jugador se abre el **panel de contacto** (PROMPTS/TOOLS/RESOURCES vía HORSE).
- **Criterio de éxito**: `ok:true`, `evidencia.contacto.state === "open"` con `contactId "c-grifo-a--uno"`.
- **Errores esperados**: `fuera_de_alcance` si no está en la cima.

## C-04b — tap_set SIN contacto ⇒ rechazado

- **Precondición**: SIN contacto abierto con `grifo-a` (si C-04 lo abrió, `player_contact_close {}` primero). La apertura actual debe ser distinta de la pedida.
- **Pasos del agente (uno)**:
  1. `player_tap_set {"tapId":"grifo-a","aperture":0.75}`
- **Qué observa el humano**: la válvula NO gira, la apertura no cambia.
- **Criterio de éxito**: `ok:false`, `error:"sin_contacto"` (regla REAL del reducer: `tap:set` exige contacto abierto).
- **Errores esperados**: `sin_contacto`.

## C-05 — tap_set 0.75 con contacto

- **Precondición**: C-04 (contacto `open` con `grifo-a`), uno en `cima-a`.
- **Pasos del agente (uno)**:
  1. `player_tap_set {"tapId":"grifo-a","aperture":0.75}`
  2. `player_observe {"what":"taps"}`
- **Qué observa el humano**: la **válvula gira**, el **manómetro baja** (releaseRate alivia presión) y empiezan a **nacer gotas** en el río A (puntos azules).
- **Criterio de éxito**: paso 1 `ok:true` con `evidencia.grifo.aperture === 0.75`; en pocos segundos `player_state` muestra `rios["rio-a"].gotasEnVuelo > 0`.
- **Errores esperados**: `apertura_invalida` si el valor sale de 0..1.

## C-06 — presión: grifo cerrado ⇒ riada (burst)

- **Precondición**: contacto abierto con `grifo-a` (C-04). Caso lento: ~50 s con el grifo cerrado (inflowRate 0.02/s).
- **Pasos del agente (uno)**:
  1. `player_tap_set {"tapId":"grifo-a","aperture":0}`
  2. Repetir `player_observe {"what":"taps"}` cada ~5 s hasta que `grifo-a.state === "burst"`.
  3. `player_observe {"what":"ledger","n":10}`
- **Qué observa el humano**: el **manómetro sube** y parpadea en rojo cerca de 1; al llegar, **riada**: salpicadura roja fuera del cauce y el murk del mar sube.
- **Criterio de éxito**: `taps["grifo-a"].state` pasa por `burst` (luego `cooldown` con `pressure 0.5`); el ledger contiene una entrada `kind:"burst"` con `detail.tapId:"grifo-a"`.
- **Errores esperados**: ninguno (la presión es física del dominio, no requiere más intents).

## C-07 — ride en embarcadero-a + surf

- **Precondición**: gotas fluyendo en `rio-a` (C-05, apertura > 0 desde hace unos segundos).
- **Pasos del agente (uno)**:
  1. `player_goto {"nodeId":"embarcadero-a"}`
  2. `player_ride {"riverId":"rio-a"}`
  3. `player_observe {"what":"tracks","n":5}`
- **Qué observa el humano**: el monigote se agacha (pose `ride`) y **surfea el cauce adelantando gotas** (el jinete va un 15% más rápido que el caudal); la **franja inferior de tracking** de la vista jugador muestra la uri de la gota pisada, y un **firehose-browser** abierto con `?actor=uno` va cargando esos recursos.
- **Criterio de éxito**: paso 2 `ok:true` con `evidencia.riding.riverId === "rio-a"` (embarca a progress 0.5); paso 3 devuelve entradas `arg:track` con `actorId:"uno"` y `hint:"firehose-browser"` cuando pisa gotas.
- **Errores esperados**: `fuera_de_embarcadero` si no hizo el paso 1; `ya_montado` si repite.

## C-08 — label:cast montado ⇒ ledger + score + cristal

- **Precondición**: C-07 (uno montado en `rio-a` con gotas alrededor).
- **Pasos del agente (uno)**:
  1. `player_label {"label":"agora","tries":20}`
  2. `player_observe {"what":"sea"}` (repetir tras ~20 s)
- **Qué observa el humano**: la gota pisada se vuelve **cristal facetado brillante**; al llegar a la desembocadura el cristal suma y la **islita del mar crece**.
- **Criterio de éxito**: paso 1 `ok:true` con `evidencia.ledger.kind === "label"`, `actorId:"uno"` y `evidencia.score.labeled` incrementado; más tarde `sea.crystals` sube en 1.
- **Errores esperados**: `no_montado`, `sin_gota` (ninguna gota bajo los pies en ningún intento), `etiqueta_invalida` (fuera del labelset `agora|memoria|ruido`), `ya_etiquetada`.

## C-09 — auto-dismount en la desembocadura

- **Precondición**: uno montado en `rio-a` (C-07/C-08).
- **Pasos del agente (uno)**:
  1. Esperar sin emitir intents y sondear `player_state {}` cada ~3 s hasta que `riding` sea `null`.
- **Qué observa el humano**: el monigote llega a la boca del río y **desmonta solo en la orilla del mar** (pose `idle`).
- **Criterio de éxito**: `actor.riding === null`, `actor.nodeId === "orilla-mar"`, `zone:"mar"` — sin haber llamado a `player_dismount`.
- **Errores esperados**: si se llama `player_dismount` DESPUÉS del auto-dismount ⇒ `ok:false, error:"no_montado"` (también evidencia válida del caso).

## C-10 — nadar: cloak que prohíbe vs cloak que permite

- **Precondición**: uno en `orilla-mar` (C-09 o `player_goto {"nodeId":"orilla-mar"}`). OJO: SIN cloak equipado nadar está permitido por defecto — para ver el rechazo hay que vestir un preset que lo prohíba.
- **Pasos del agente (uno)**:
  1. `player_cloak_equip {"presetId":"aleph-tronco-puro"}` (swimAllowed: false)
  2. `player_move {"nodeId":"boya-1"}` ⇒ debe fallar
  3. `player_cloak_equip {"presetId":"aleph-firehose-browse"}` (swimAllowed: true, walk ×1.25)
  4. `player_move {"nodeId":"boya-1"}` ⇒ debe nadar
- **Qué observa el humano**: con el tronco puro el monigote se queda en la orilla; con el cloak firehose entra al agua con **pose braza (`swim`)** hasta la boya 1.
- **Criterio de éxito**: paso 2 `ok:false, error:"nadar_no_permitido"`; paso 4 `ok:true` con llegada a `boya-1` (pose `swim` durante el tránsito, `zone:"mar"`).
- **Errores esperados**: `nadar_no_permitido` (solo en el paso 2).

## C-11 — cantera: pisar una cámara ⇒ track (o ghost honesto)

- **Precondición**: uno con los pies en tierra (p.ej. `orilla-mar`). La cámara de entrada `camara-0-2` viene cacheada por el start pack en feeds reales; en sintético puede ser ghost.
- **Pasos del agente (uno)**:
  1. `player_goto {"nodeId":"camara-0-2"}` (ruta … → `cantera-entrada` → `camara-0-2`; la boca siempre está abierta)
  2. `player_observe {"what":"tracks","n":5}`
- **Qué observa el humano**: el monigote entra en la cantera; si la cámara está `cached`, un **cache-browser** abierto con `?actor=uno` **carga el recurso** de la cámara; si está `ghost`, el browser lo dice honestamente («no excavado aún») y no navega.
- **Criterio de éxito**: paso 1 `ok:true` con `nodeId:"camara-0-2"`, `zone:"cantera"`; si la cámara estaba `cached`, paso 2 muestra un `arg:track` con `hint:"cache-browser"` y su `ref.uri`; si estaba `ghost`, la ausencia de track es el resultado correcto (verificable en `arg://scene` → `cantera.camaras`).
- **Errores esperados**: ninguno.

## C-12 — excavate pasillo ghost ⇒ digging → open

- **Precondición**: C-11 (uno en `camara-0-2`); el pasillo `pasillo-camara-0-2--camara-1-2` en estado `ghost` (verifícalo en `arg://scene`). En feeds reales añade `"approval":"APROBAR"` (token `resolveMcpApprovalToken`).
- **Pasos del agente (uno)**:
  1. `player_excavate {"corridorId":"pasillo-camara-0-2--camara-1-2","waitOpen":true}`
- **Qué observa el humano**: la línea discontinua gris del pasillo **pulsa en ámbar** (`digging`, ~2.5 s en sintético) y luego se vuelve **sólida** (`open`); las cámaras de ambos extremos pasan a `cached` con glow.
- **Criterio de éxito**: `ok:true` con `evidencia.pasillo.state === "open"` y `evidencia.ledger.kind === "excavate"`; el score `excavated` del actor sube en 1.
- **Errores esperados**: `ya_abierto` / `ya_excavando` al repetir; `aprobacion_requerida` en feeds reales sin approval (se manifiesta como timeout con nota, la autoridad no lo reduce).

## C-12b — excavate no adyacente ⇒ fuera_de_camara

- **Precondición**: uno en `camara-0-2`; un pasillo `ghost` LEJOS de su cámara, p.ej. `pasillo-camara-2-0--camara-3-0`.
- **Pasos del agente (uno)**:
  1. `player_excavate {"corridorId":"pasillo-camara-2-0--camara-3-0"}`
- **Qué observa el humano**: nada — ningún pasillo cambia.
- **Criterio de éxito**: `ok:false`, `error:"fuera_de_camara"`.
- **Errores esperados**: `fuera_de_camara` (si ese pasillo ya no está ghost, elige otro no adyacente: primero se evalúa el estado del pasillo).

## C-13 — cloak:equip del PresetStore ⇒ anillo e inventario

- **Precondición**: uno unido (C-01). Presets del start pack: `aleph-tronco-puro`, `aleph-firehose-browse` (sembrados con `npm run seed:aleph`).
- **Pasos del agente (uno)**:
  1. `player_cloak_equip {"presetId":"aleph-firehose-browse","label":"firehose"}`
  2. `player_state {}`
- **Qué observa el humano**: sobre el monigote aparece/cambia el **anillo de cloak**; en la vista jugador el **inventario `Q`** marca el preset equipado.
- **Criterio de éxito**: `ok:true` con `evidencia.cloak.presetId === "aleph-firehose-browse"` y `evidencia.fisica` (walk ×1.25, nada permitido); `player_state` refleja el cloak.
- **Errores esperados**: `preset_requerido` con presetId vacío.

## C-14 — contacto jugador ↔ jugador (WP-11)

- **Precondición**: los DOS MCP conectados (uno :4121, dos :4122); ambos actores unidos y en el MISMO nodo (p.ej. `plaza`).
- **Pasos del agente**:
  1. (dos) `player_join {}` · (dos) `player_goto {"nodeId":"plaza"}` si hace falta
  2. (uno) `player_goto {"nodeId":"plaza"}` si hace falta
  3. (uno) `player_contact {"targetId":"dos"}`
- **Qué observa el humano**: en ambas vistas jugador se abre el **menú de contacto** con las **ofertas HORSE cruzadas** (prompts/tools/resources del cloak del otro).
- **Criterio de éxito**: paso 3 `ok:true` con `evidencia.contacto` `{a,b} = {dos,uno}` y `state:"open"` (contactId `c-dos--uno`).
- **Errores esperados**: `fuera_de_alcance` (a más de 3.5 de distancia), `contacto_consigo` si el targetId es el propio actor.

## C-15 — colapso: murk > capacidad (fin de ronda)

- **Precondición**: partida avanzada. Caso LARGO (minutos): cada gota que llega al mar sin etiquetar suma 1 de murk (capacidad 60) y cada riada vierte 0.8/s durante 4 s.
- **Pasos del agente (uno)**:
  1. `player_contact {"targetId":"grifo-a"}` + `player_tap_set {"tapId":"grifo-a","aperture":1}` (nadie etiqueta: todo se vierte)
  2. Opcional acelerar con riadas: alternar `player_tap_set {"tapId":"grifo-a","aperture":0}` y dejar reventar (C-06) las veces que haga falta.
  3. Sondear `player_observe {"what":"sea"}` hasta `collapsed: true`; después `player_observe {"what":"ledger","n":10}`.
- **Qué observa el humano**: el mar se **enturbia** progresivamente; al superar la capacidad, **el mar sube y traga las terrazas** (shake + fade): colapso del delta.
- **Criterio de éxito**: `sea.collapsed === true` y entrada de ledger `kind:"collapse"` con `detail.murk > detail.capacity`.
- **Errores esperados**: ninguno (es la física del vertido).

## C-16 — emotes visibles en el monigote

- **Precondición**: uno unido (C-01).
- **Pasos del agente (uno)**:
  1. `player_emote {"name":"wave"}`
  2. `player_emote {"name":"nod"}`
  3. `player_emote {"name":"shake"}`
  4. `player_emote {"name":"thumbsUp"}`
- **Qué observa el humano**: el monigote **saluda / asiente / niega / levanta el pulgar** como capa aditiva sobre su pose (cada emote dura ~2.5 s).
- **Criterio de éxito**: cada llamada `ok:true` con `evidencia.emote === name` (visto en `arg:state` antes de expirar el TTL).
- **Errores esperados**: el reducer rechaza nombres fuera de `wave|nod|shake|thumbsUp` (`emote_invalido`) — el tool ya lo impide con su enum.

---

## Fase 1.6 — Mar vivo ([MAR.md](MAR.md), WP-28..32)

Los casos siguientes requieren la fase 1.6 desplegada. Antes de ejecutarlos,
verifica con `tools/list` que el MCP expone `player_salvage` y `player_track`;
si no están, la fase aún no ha sido entregada por el swarm y el caso se
reporta como `pendiente_de_fase`, no como fallo.

## C-17 — rescatar una gota hundida del mar (salvage)

- **Precondición**: fase 1.6 desplegada. Al menos una gota **hundida** en el
  mar: genera vertido con C-05 (grifo abierto, nadie etiqueta) y espera ~20 s
  a que lleguen gotas sin etiquetar. Verifícalo con `player_observe {"what":"sea"}`
  → `droplets` con entradas de `label: null`.
- **Pasos del agente (uno)**:
  1. `player_observe {"what":"sea"}` → anota `murk`, `crystals` y el `dropletId` de una gota con `label: null`.
  2. `player_cloak_equip {"presetId":"aleph-firehose-browse"}` (permite nadar)
  3. `player_goto {"nodeId":"boya-1"}` (el rescate exige proximidad: zona mar, o orilla/boya a ≤ 3.5 de la posición de la gota)
  4. `player_salvage {"dropletId":"<id del paso 1>","label":"memoria"}`
  5. `player_observe {"what":"sea"}`
- **Qué observa el humano**: la gota tenue bajo la superficie **asciende con un destello**, se vuelve cristal y **se une al cluster «memoria»** apelotonado hacia el final del mar (si es la primera con esa etiqueta, nace el cluster con su letrero); el mar se aclara un punto.
- **Criterio de éxito**: paso 4 `ok:true` con `evidencia.ledger.kind === "label"` y `detail.salvage === true`, y `score.labeled` incrementado; paso 5: la gota aparece flotante con `label:"memoria"`, `murk` bajó en 1 y `crystals` subió en 1 respecto al paso 1.
- **Errores esperados**: `gota_invalida` (id inexistente o ya flotante), `etiqueta_invalida` (fuera del labelset), `fuera_de_alcance` (lejos de la gota), `nadar_no_permitido` en el paso 3 sin cloak nadador.

## C-18 — lanzar una gota del mar al firehose-browser (track:cast)

- **Precondición**: fase 1.6 desplegada. Un **firehose-browser** abierto con `?actor=uno` (:3016). Al menos una gota en el mar, flotante o hundida (C-08 o C-17 la dejan).
- **Pasos del agente (uno)**:
  1. `player_observe {"what":"sea"}` → anota un `dropletId` y su `uri`.
  2. `player_track {"dropletId":"<id del paso 1>"}`
  3. `player_observe {"what":"tracks","n":5}`
- **Qué observa el humano**: el firehose-browser del jugador **navega al recurso de la gota** (deep-link honesto: si el ref es sintético, la franja de juego lo marca `「sintético」` sin ENOENT; no navega).
- **Criterio de éxito**: paso 2 `ok:true` con evidencia del `arg:track` emitido; paso 3 muestra un track con `actorId:"uno"`, `hint:"firehose-browser"` y el `ref.uri` de la gota. Sin mutación de dominio: score, `crystals` y `murk` intactos.
- **Errores esperados**: `gota_invalida` (la gota ya salió del pool por overflow — elige otra del paso 1).
