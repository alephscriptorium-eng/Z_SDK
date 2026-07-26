# DRAFT · backlog encolable del carril Z

| dato | valor |
| ---- | ----- |
| Dueño | vigía **Z** · `C:\S_LAB\z-sdk` |
| Contrato | `PROTOCOLO.md` §9.5 — borrador; **nada se encola sin check del custodio** |
| Actualizado | 2026-07-26 (R2) |

`BLOQUEA:` = candidato que hoy impide el hilado común. Primeros del
cherry-pick del custodio.

---

## Z-D1 · Peercard de facto contra runtime vivo

- **BLOQUEA:** la prueba del grafo (§2c del informe R1) — para O, Z, y por
  arrastre S y custodio: nadie marca su fila sin saber cómo entra la card.
- Alcance: arrancar `socket-server` local + cliente mínimo `@zeus/rooms`;
  confirmar que `connectAndJoin(..., {peerCard})` la reenvía en
  `CLIENT_REGISTER`; capturar id y log.
- CA tentativo: log literal del `CLIENT_REGISTER` con `peerCard` presente +
  id reproducible. Sin log = no vale (marca sin entrada = falsedad).
- Evidencia previa: `rooms/src/index.mjs:70-73` (✅ código, ⏳ runtime).
- Necesita: tick + ventana de arranque de proceso.

## Z-D2 · Ampliar `launcher://catalog`

- **BLOQUEA:** la estrategia de puerta única de V y el objetivo §2a
  (4 % → 100 %). Hoy el catálogo cubre **7 paquetes de 51**.
- Alcance ola 1: `socket-server` + `ciudad-lifecycle`. UIs en olas
  posteriores, no de golpe.
- CA tentativo: entradas nuevas resuelven puerto por `presets-sdk/env` (cero
  literales), `deps` declaradas si las hay, `health` verificado de facto.
- Necesita: tick + GO del orquestador Z (es obra, no gobierno).

## Z-D3 · FICHA-RUNTIME-Z (versión mínima)

- Alcance **recortado** tras denegación de T-Z3: solo los **3 servicios del
  grafo** (`socket-server`, `mcp-launcher`, `linea-editor`), no los 14.
- Columnas: MCP/librería · en catálogo sí/no · engine/mesh · comando ·
  puerto y cómo se cambia · disco · deps de arranque · peercard emite/consume.
- CA tentativo: cada fila con cita de fichero; cero inferencia.
- Necesita: tick.

## Z-D4 · Reúso de peercards (❓ del custodio)

- Alcance: responder si la card de edificio se reúsa al subir a barrio/ciudad
  o cada nivel emite. Material: sin servicio emisor · `authority-kit` y
  `rooms` sin explorar · `embajador-kit` con **0 consumidores** y lógica
  repartida en 4 sitios.
- Necesita: hilo con Z/G (el informe lo sitúa ahí), no nota suelta.

## Z-D5 · Presentar los 17 invisibles

- Alcance: una ola por tanda temática (transporte · autoridad/juego · UI kits),
  no un volcado. Sirve al §2a.
- Necesita: tick, y va **después** de D1–D3.

---

⏳ Abierto de carril (no candidato, anomalía): quién reescribió
`CONTRARREVISION-U169-PASS.md` el 25/07 a las 21:57 con tamaño idéntico.

— vigía **Z**
