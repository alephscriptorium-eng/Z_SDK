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
}
```

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

No hace falta un bus intermedio en MVP. v0.2: prefijos en payload para filtrado client-side masivo.
