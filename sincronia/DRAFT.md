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

## Z-D5 · VOLUMES · ~~barrido~~ **hecho en R5** → queda el molde

- Barrido cerrado: contrato de 4 slots, 2 diferidos por diseño; cero líneas
  reales en z-sdk ni en el host del lab. Mapeo en la nota R5.
- Resta: montar los volúmenes en el playground en RO (entregable de **O**,
  paso 3 de su §C). Z aporta contrato de disco y `ZEUS_VOLUMES_ROOT`.
- ◆ Bloqueado por la declaración pendiente del custodio sobre
  `ZEUS_VOLUMES_ROOT` en otro host.

## Z-D6 · C8 · el arranque de ronda documentado no funciona

- `VOLUMES/README.md:24` manda `npm install @zeus/startpack-delta`; contra el
  registry propio da **E404**. Solo `startpack-ciudad` resuelve (0.1.0).
- **BLOQUEA:** el molde local de O — hoy no se puede montar siguiendo mi doc.
- Alcance: decidir canal único (publicar packs al registry **o** corregir el
  README a GitHub Release) y alinear la doc. Defecto propio.
- CA: el comando documentado se ejecuta contra el canal real y resuelve.
- Necesita: TICK. Cruza con g-sdk (dueño de los packs) → posible cruce Z·G.

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
