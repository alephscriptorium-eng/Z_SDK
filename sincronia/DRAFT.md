# DRAFT · backlog encolable del carril Z

| dato | valor |
| ---- | ----- |
| Dueño | vigía **Z** · `C:\S_LAB\z-sdk` |
| Contrato | `PROTOCOLO.md` §9.5 · compactar y reemplazar |
| Actualizado | 2026-07-26 (**R7**) — sustituye al DRAFT de R6 |
| Fuente normativa | `INFORME-R3` |

`BLOQUEA:` = impide el hilado común. Primeros del cherry-pick.

---

## Z-D1 · Z-runtime · peercard en vivo + ficha de los 3 servicios

- **BLOQUEA:** las 7 marcas del grafo. Sigue **0/7**.
- Alcance: `socket-server` local + cliente mínimo `@zeus/rooms`; ficha de
  `socket-server` · `mcp-launcher` · `linea-editor`.
- CA en dos modalidades (política §2.a): entrada **sin** card → nodo anónimo ·
  entrada **con** card → reenviada en `CLIENT_REGISTER`. Ambas con log literal.
- Necesita: TICK + ventana de arranque de proceso local.

## Z-D4 · U93-bis · separar transporte de permiso en `webrtc-signaling`

- **BLOQUEA:** la política §2.a en el carril WebRTC (hoy sin card no hay ni
  `room-join`) y el modelo de nodo de O.
- Confirmado de facto: `peer-card-gate.mjs` + `signaling-service.mjs:187,248`;
  no existe `requirePeerCard:false`.
- CA: (1) sin card conecta · (2) card válida concede en la acción · (3) card
  inválida **rechaza y no degrada a anónimo** · (4) acción sin rol denegada con
  el cable intacto.
- Necesita: TICK.

## Z-D8 · Porte one-off de la genealogía (adaptadores por familia)

- **BLOQUEA:** el molde con datos no-fixture y la dirección §2.b del informe.
- `scripts/import-legado/` (U176 ✅) es **pieza parcial**: cubre obra→línea/
  story-board/reparto. **Faltan adaptadores** para `linea-aleph` completo
  (48 MB · 677 registros), FIREHOSE (38 MB · 8.388 f) y FORCES (12 corpus).
- Precondición: el `registry.yaml` histórico está **stale** — se trata como
  incompleto, no como índice.
- Gate: `validateVolumes()` → `ok:true` antes de fusionar en el root.
- Necesita: TICK del operador con env inyectado + ruta del root local.

## Z-D6 · Doc de canal y arranque de ronda (contrato ya entregado)

- Contrato entregado en R7: 8 requisitos de `loadStartPack` +
  `CONTRATO-IMPORT-PACK-v0`. Es **canal-agnóstico**: sirve a C1 y a C2.
- Resta **solo doc mía**, y son dos defectos en el mismo fichero:
  `VOLUMES/README.md:24` (comando `npm install` → E404) y `:26` (apuntar el env
  al `volumes/` del pack = enlace vivo, **contra el cerco §10.8**).
- ◆ Espera la frontera C1/C2 (**G + custodio**) antes de corregir la doc, para
  no escribirla dos veces.
- Necesita: decisión de frontera. Luego ~1 h de doc.

## Z-D9 · Anclaje por contenido — **reencuadrado por el cerco §10.8**

- ⚠️ Corrección: el cerco prohíbe **anclas vivas como dependencia de
  arranque**. Por tanto git/rad/IPFS solo pueden ser **fuente de import** y
  **metadato inerte de procedencia**, nunca ruta de lectura del runtime.
- Wikimedia encaja (snapshots inmutables por `oldid` con sidecar de
  procedencia). **Firehose es flujo**: decidir unidad de anclaje antes de
  tocar transporte.
- ◆ Pregunta abierta en el informe (O + custodio): ¿el ancla sustituye o
  alimenta? Con el cerco, la respuesta parece forzada a **alimenta**.
- Necesita: respuesta a esa pregunta; luego TICK conjunto O·Z.

---

## Aparcados (no pido nada este turno)

| id | qué | espera |
| -- | --- | ------ |
| Z-D2 | Hilo peercard-reúso (Z·G) — aporto `authority-kit`/`rooms` sin explorar y `embajador-kit` con 0 consumidores | TICK de hilo + compactador |
| Z-D7 | Relay: allowlist silenciosa de 8 · `MAKE_MASTER` suprimido · colapso de identidad en `scriptorium-bridge` | hilo peercard + mesa nodo/relay |
| Z-D5 | Molde playground RO (entregable de O) · columna `root VPS` de la matriz | ruta del volumen VPS (custodio) |
| Z-D3 | F2: ampliar `launcher://catalog` + presentar los 17 invisibles | después del holón-7 |

⏳ Anomalía de carril: `CONTRARREVISION-U169-PASS.md` reescrito 25/07 21:57 con
tamaño idéntico; no fui yo.

— vigía **Z**
