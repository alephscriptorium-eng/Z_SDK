# Gamechannel — Suscripciones

Matriz **quién escucha qué** en el MVP vaivén.

---

## Por rol

| Rol | App | Subscribe | Publish | Notas |
|-----|-----|-----------|---------|-------|
| Autoridad | `map-app` | `GAME_INTENT` | `GAME_STATE` (+ `GAME_STATE_DELTA` si stateDelta) | Única fuente de verdad |
| Jugador / driver | `walk-app` | `GAME_STATE` (+ delta) | `GAME_INTENT` | Automatiza loop |
| Observador | `watch-app` | `GAME_STATE` (+ delta) | — | gameviewer tier0; apply delta |
| Legacy ping | `ping-app` | `PONG` | `PING` | Sin cambios |
| Legacy pong | `pong-app` | `PING` | `PONG` | Sin cambios |

---

## walk-app — lógica de suscripción reactiva

Al recibir `GAME_STATE`, decidir siguiente intent:

| Estado observado | Siguiente intent |
|------------------|------------------|
| `sit` @ `ancla-a` | `walk` `enlace-ab` `a-to-b` |
| `sit` @ `ancla-b` | `walk` `enlace-ab` `b-to-a` |
| `walk` | esperar |
| `idle` | esperar (mapa auto-sit en MVP) |

Debounce: no reenviar mismo intent si ya hay walk en curso.

---

## watch-app — filtro

Imprime líneas solo si:
- `reason === 'change'`, o
- cada N heartbeats (configurable)

Formato:

```
[watch] robot-ping · walk · enlace-ab · progress=0.42 · pos=(12.7,0,0)
```

---

## Multijugador (futuro)

| actorId | Owner | Subscribe state |
|---------|-------|-----------------|
| `robot-ping` | walk-demo | `state.actor.robot-ping` (filtrado client) |
| `robot-pong` | otro user | idem |

MVP: un solo actor `robot-ping`.

---

## Registro al conectar

Extensión de `CLIENT_REGISTER.features`:

```json
{
  "type": "MapWalkDemo",
  "features": ["gamemap-0.1", "gamechannel-intent"]
}
```
