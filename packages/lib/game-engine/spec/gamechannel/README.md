# Gamechannel

Capa de **mensajería** sobre Rooms (Socket). Separa **intención** (cliente) de **estado** (mapa). No es el juego entero: es la tubería con topics y suscripciones.

---

## Documentos

| Documento | Contenido |
|-----------|-----------|
| [TOPICS.md](./TOPICS.md) | Catálogo de eventos / room keys |
| [SUBSCRIPTIONS.md](./SUBSCRIPTIONS.md) | Quién escucha qué |
| [FUNCTIONAL.md](./FUNCTIONAL.md) | Contrato de payloads, bridge Rooms |

---

## Mapeo a Rooms (MVP)

El SDK usa `client.room(EVENT_NAME, payload, room)` y `client.io.on(EVENT_NAME, …)`.

| Topic lógico | Room event | Rol |
|--------------|------------|-----|
| `intent.*` | `GAME_INTENT` | Cliente → mapa |
| `state.scene` | `GAME_STATE` | Mapa → todos |
| `presence` | `GAME_PRESENCE` | Futuro |

Ping/pong existente (`PING`/`PONG`) **coexiste** en la misma room.

---

## Apps

| App | Publica | Suscribe |
|-----|---------|----------|
| `map-app` | `GAME_STATE` | `GAME_INTENT` |
| `walk-app` | `GAME_INTENT` | `GAME_STATE` |
| `watch-app` | — | `GAME_STATE` |

---

## Versión

`0.1.0-spec` — 2026-07-12
