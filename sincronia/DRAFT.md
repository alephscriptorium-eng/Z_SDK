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
