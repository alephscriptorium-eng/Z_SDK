# DRAFT · backlog encolable del carril Z

| dato | valor |
| ---- | ----- |
| Dueño | vigía **Z** · `C:\S_LAB\z-sdk` |
| Contrato | `PROTOCOLO.md` §9.5 · INFORME-R2 §2.d (compactar y reemplazar) |
| Actualizado | 2026-07-26 (R3) — **sustituye** al DRAFT de R2, no lo acumula |

`BLOQUEA:` = impide el hilado común. Primeros del cherry-pick.

---

## Z-D1 · Z-runtime · peercard en vivo + ficha de los 3 servicios

- **BLOQUEA:** las 7 marcas del grafo (holón-7). Hoy **0/7**; sin esto nadie
  marca con evidencia real.
- Alcance: (a) arrancar `socket-server` local + cliente mínimo `@zeus/rooms`;
  (b) ficha de `socket-server` · `mcp-launcher` · `linea-editor` — comando,
  puerto y cómo se cambia, disco, deps de arranque, peercard emite/consume,
  en catálogo sí/no, engine/mesh, MCP o librería.
- **CA en dos modalidades** (INFORME-R2 §2.a, apertura anónima base + card
  opt-in): entrada **sin** card registra nodo anónimo; entrada **con** card
  la reenvía en `CLIENT_REGISTER`. Ambas con log literal; una sola no basta.
- Evidencia previa: `rooms/src/index.mjs:70-73` (✅ código · ⏳ runtime) ·
  `mcp-launcher/src/catalog.mjs`.
- Necesita: TICK + ventana de arranque de proceso local.
- Fusiona los antiguos Z-D1 y Z-D3.

## Z-D2 · Hilo peercard-reúso (Z · G)

- Pregunta: ¿la card de edificio se reúsa al subir a barrio/ciudad, o cada
  nivel emite? Reformulada tras §2.a: qué cambia si el nivel base es anónimo.
- Aporto: sin servicio emisor · `authority-kit` y `rooms` sin explorar ·
  `embajador-kit` con **0 consumidores** y lógica repartida en 4 sitios.
- Necesita: TICK de hilo + COMPACTADOR por nombrar.

## Z-D4 · U93-bis · separar transporte de permiso en `webrtc-signaling`

- **BLOQUEA:** la política R2 §2.a en el carril WebRTC (hoy sin card no hay
  ni `room-join`) y, por arrastre, el modelo de nodo de O (§E: permiso no
  gobierna transporte).
- Discrepancia **confirmada de facto**: `peer-card-gate.mjs`
  (`PEER_CARD_GATED_TYPES`) + `signaling-service.mjs:187,248`; no existe
  `requirePeerCard:false`.
- Alcance: 3 capas — transporte anónimo · capacidades opt-in en la acción ·
  verificación fuerte si hay card.
- CA: (1) sin card conecta · (2) card válida concede en la acción · (3) card
  inválida **rechaza y no degrada a anónimo** · (4) acción sin rol denegada
  con cable intacto.
- Necesita: TICK. Es refactor de obra; convive con REFACTOR O↔V (no toca
  claves ni puertos).

## Z-D5 · VOLUMES · matriz ✅ (R6) → queda el porte de genealogía

- Barrido (R5) + **matriz de 9 campos en 3 planos** (R6): INVENTARIO ≠
  IMPORT ≠ CONTRATO DE MONTAJE. Fuente histórica declarada por el custodio.
- Resta: (a) columna `root VPS` — ◆ dato pendiente del custodio; (b) molde
  playground RO (entregable de **O**); (c) porte one-off de la genealogía.
- ★ Sirve la dirección elevada: `ZEUS_VOLUMES_ROOT` único del Scriptorium,
  `volumes.json` como contrato lógico, path por env — misma convención que
  ya usan los puertos.

## Z-D8 · Porte one-off de la genealogía (la herramienta YA existe)

- **BLOQUEA:** la dirección de §2 del tick R6 y el molde con datos no-fixture.
- `scripts/import-legado/` (WP-U176 ✅) cumple el contrato pedido: fuente RO
  por env, validación AJV + reparto + schemas de línea, determinista, one-off,
  salida a `IMPORT_OUT/LINEAS/`. Brief: *ejecución real = tick del operador*.
- Alcance: ejecutar `--check` primero contra la fuente histórica declarada;
  escribir solo tras PASS del check.
- ⚠️ Cubre **obra → línea/story-board/reparto**. NO cubre firehose ni export
  SSB: esos van por `feed-kit` y `ssb-system`.
- Necesita: TICK del operador con env inyectado. Z no fija rutas.

## Z-D9 · Anclaje por contenido de volúmenes (git/rad/IPFS) — O + Z

- Wikimedia: **encaje natural** — snapshots inmutables por `oldid` con
  sidecar `source_url`/`fetched_at` (`DATOS.md` §2).
- Firehose: **caso difícil** — es flujo; hay que decidir la **unidad** de
  anclaje (ventana temporal / bloque de N eventos) antes de tocar transporte.
- ◆ Pregunta previa a cualquier diseño: ¿el ancla **sustituye** al volumen o
  lo **alimenta**? El contrato de montaje actual supone lo segundo.
- Necesita: TICK conjunto O·Z tras respuesta a esa pregunta.

## Z-D6 · C8 · el arranque de ronda documentado no funciona

- `VOLUMES/README.md:24` manda `npm install @zeus/startpack-delta`; contra el
  registry propio da **E404**. Solo `startpack-ciudad` resuelve (0.1.0).
- **BLOQUEA:** el molde local de O — hoy no se puede montar siguiendo mi doc.
- Dos opciones con coste evaluadas en R6: **A** publicar los 6 packs (dueño
  **G**; voto declarado del custodio; caro y poco reversible) · **B** README →
  Release oficial (dueño **Z**; ~1 h, reversible, coherente con anclaje por
  contenido). ★ Z se inclina por B; decide la mesa con G.
- CA: el comando documentado se ejecuta contra el canal real y resuelve.
- Necesita: consenso con **G** — los packs viven en g-sdk; Z no puede
  ejecutar A por su cuenta.

## Z-D7 · Relay: allowlist silenciosa y colapso de identidad

- Hallazgos R5 (`socket-server/src/relay.mjs`): eventos fuera de las 8 del
  allowlist se **descartan sin traza**; `MAKE_MASTER` suprimido; un único
  `bridgeClient` con identidad `scriptorium-bridge` **colapsa el emisor**
  aguas arriba.
- No es transformación de payload (el modelo de O se sostiene), pero sí
  potestad de corte y pérdida de origen → material del hilo peercard-reúso y
  del ◆ de mesa sobre nodo/relay.
- Alcance mínimo: trazar lo descartado (log) antes que cambiar política.
- Necesita: TICK + decisión de mesa sobre §D/§E.

## Z-D3 · F2 · superficie del runtime (aparcado por el cherry-pick)

- Ampliar `launcher://catalog` (ola 1: `socket-server` + `ciudad-lifecycle`)
  y presentar los **17 invisibles** por tandas temáticas.
- Sirve al objetivo 51/51, pero **va después** del holón-7 y de la segunda
  puerta. No lo pido en este turno.
- Fusiona los antiguos Z-D2 y Z-D5.

---

⏳ Anomalía de carril (no candidato): `CONTRARREVISION-U169-PASS.md`
reescrito 25/07 21:57 con tamaño idéntico; no fui yo.

— vigía **Z**
