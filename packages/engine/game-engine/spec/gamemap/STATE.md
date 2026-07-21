# Gamemap — Estado

Snapshot **autoritativo** que publica la autoridad del mapa por **gamechannel** (`GAME_STATE`).

---

## Snapshot

```typescript
interface GameStateSnapshot {
  sceneId: string;
  tick: number;
  ts: number;
  actors: Record<string, ActorState>;
  anchors: Record<string, { occupiedBy: string | null }>;
}
```

---

## ActorState

```typescript
interface ActorState {
  id: string;
  kind: string;           // ej. gameobjects.alephillo-robot
  zone: string;           // nodo id O enlace id mientras camina
  pose: 'sit' | 'walk' | 'idle';
  anchorId: string | null;
  linkId: string | null;
  progress: number | null; // 0..1 en enlace
  linkDirection: 'a-to-b' | 'b-to-a' | null;
  position: { x: number; y: number; z: number };
}
```

### Lectura de `zone`

| Condición | `zone` | `pose` |
|-----------|--------|--------|
| Sentado en ancla | `nodo-*` | `sit` |
| Caminando | `enlace-*` | `walk` |
| Llegó, antes de sit | `nodo-*` | `idle` (breve; MVP auto-sit) |

---

## Ejemplo (vaivén)

```json
{
  "sceneId": "vaiven-dos-nodos",
  "tick": 142,
  "actors": {
    "robot-ping": {
      "id": "robot-ping",
      "kind": "gameobjects.alephillo-robot",
      "zone": "enlace-ab",
      "pose": "walk",
      "progress": 0.42,
      "linkDirection": "a-to-b",
      "position": { "x": 12.7, "y": 0, "z": 0 }
    }
  }
}
```

---

## Mutación

Solo la **autoridad del mapa** (`map-app`) muta estado vía `MapEngine`. Clientes **nunca** envían `GAME_STATE`.

---

## Deltas (v0.2)

`GAME_STATE_DELTA`: parche por actor/ancla entre heartbeats full. Contrato y
helpers en `@zeus/protocol` (`diffGameState`, `applyGameStateDelta`). La
autoridad opt-in (`startAuthority({ stateDelta: true, events: { DELTA: 'GAME_STATE_DELTA' } })`)
publica full en boot/heartbeat y deltas en cambios intermedios.
