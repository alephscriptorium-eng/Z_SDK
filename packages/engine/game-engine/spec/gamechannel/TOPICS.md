# Gamechannel — Topics

## Convención de nombres

```
GAME_<DOMINIO>   — mayúsculas, compatible con client.room existente
```

Prefijo lógico para documentación: `game.<dominio>.<acción>`

---

## GAME_INTENT

**Dirección:** cliente → autoridad del mapa  
**Emisor típico:** `walk-app`, futuro input del jugador

```typescript
interface GameIntentMessage {
  type: 'GAME_INTENT';
  v: 1;
  from: string;        // usuario Rooms
  ts: number;
  actorId: string;
  intent: 'sit' | 'walk';
  anchorId?: string;
  linkId?: string;
  direction?: 'a-to-b' | 'b-to-a';
  requestId?: string;  // dedup opcional
}
```

### Ejemplos

```json
{
  "type": "GAME_INTENT",
  "v": 1,
  "from": "walk-demo",
  "actorId": "robot-ping",
  "intent": "walk",
  "linkId": "enlace-ab",
  "direction": "a-to-b",
  "ts": 1710000000000
}
```

```json
{
  "type": "GAME_INTENT",
  "v": 1,
  "from": "walk-demo",
  "actorId": "robot-ping",
  "intent": "sit",
  "anchorId": "ancla-a",
  "ts": 1710000000000
}
```

---

## GAME_STATE

**Dirección:** autoridad del mapa → todos los viewers  
**Emisor:** `map-app`

```typescript
interface GameStateMessage {
  type: 'GAME_STATE';
  v: 1;
  from: 'map-authority';
  ts: number;
  sceneId: string;
  tick: number;
  actors: Record<string, ActorState>;
  anchors: Record<string, { occupiedBy: string | null }>;
  reason?: 'change' | 'heartbeat';
  mode?: 'full';
}
```

---

## GAME_STATE_DELTA (v0.2)

**Dirección:** autoridad → viewers  
**Emisor:** autoridad con `stateDelta: true` (`@zeus/authority-kit`)  
**Cuándo:** entre heartbeats full; solo actores/anclas que cambiaron.

```typescript
interface GameStateDeltaMessage {
  type: 'GAME_STATE_DELTA';
  v: 2;
  mode: 'delta';
  from: string;
  ts: number;
  sceneId: string;
  tick: number;
  baseTick: number; // tick del estado local sobre el que aplica
  actors?: Record<string, ActorState | null>; // null = borrado
  anchors?: Record<string, { occupiedBy: string | null } | null>;
  reason?: 'change' | 'heartbeat';
}
```

Helpers canónicos: `diffGameState` / `applyGameStateDelta` en `@zeus/protocol`.
Si `baseTick` no coincide → pedir/esperar full (`GAME_STATE`).

---

## GAME_INTENT_RESULT (v0.2)

Respuesta directa al emisor si `requestId` presente. MVP: errores solo en log del map-app.

---

## Coexistencia PING/PONG

| Event | Demo |
|-------|------|
| `PING` / `PONG` | Matemáticas, latencia |
| `GAME_*` | Vaivén robot |

Misma `ROOMS_ROOM`, distintos handlers.

---

## Firehose vs filtrado

**Físico:** Rooms entrega todos los eventos de la room al socket.  
**Lógico:** cada app registra solo los handlers que necesita (= suscripción).

No hace falta un bus intermedio en MVP.

### Zone interest (v0.2 — logical)

Opaque zone ids on the subscriber (`CLIENT_SUSCRIBE.zones` and/or
`filterSnapshotByZones` / `createZoneStateHandler` in `@zeus/game-engine`).

| Capa | Comportamiento |
|------|----------------|
| Rooms wire | `CLIENT_SUSCRIBE { room, zones? }` declara interés; fan-out físico sigue siendo room-wide |
| Client filter | `filterSnapshotByZones(snapshot, zones, { zoneByBarrio, zoneByNode })` recorta actors / anclas / barrios / nodos |
| Default | `zones` ausente / `*` = firehose (compat) |

Server-side slice + unicast queda fuera de este corte (authority publish path;
coordina con cambios de wire de estado cuando existan).
