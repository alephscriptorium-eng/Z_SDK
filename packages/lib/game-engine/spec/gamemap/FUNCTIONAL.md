# Gamemap — Especificación funcional

## Identidad

| Campo | Valor |
|-------|-------|
| `id` | `gamemap.core` |
| `version` | `0.1.0` |

---

## API MapEngine

```typescript
interface MapEngine {
  sceneId: string;

  registerActor(id: string, initial: Partial<ActorState>): void;
  applyIntent(actorId: string, intent: GameIntent): IntentResult;
  tick(deltaSec: number): void;
  getSnapshot(): GameStateSnapshot;
  drainEvents(): MapEvent[];
}

type IntentResult = { ok: true } | { ok: false; error: string };

type GameIntent =
  | { intent: 'sit'; anchorId: string }
  | { intent: 'walk'; linkId: string; direction: 'a-to-b' | 'b-to-a' };
```

Implementación: [`runtime/map-engine.mjs`](../runtime/map-engine.mjs)

---

## Errores de intent

| Código | Significado |
|--------|-------------|
| `ancla_invalida` | id desconocido |
| `ancla_ocupada` | otro actor |
| `fuera_de_nodo` | actor no en parent del ancla |
| `enlace_invalido` | id desconocido |
| `nodo_origen_incorrecto` | walk desde nodo equivocado |
| `ya_caminando` | walk duplicado |

---

## Eventos internos (drainEvents)

| name | Cuándo |
|------|--------|
| `anchor_occupied` | sit ok |
| `link_enter` | walk ok |
| `link_progress` | progress cambió |
| `link_exit` | llegada a nodo |

---

## Autoridad map-app

```typescript
interface MapAuthority {
  start(): void;
  stop(): void;
  onIntent(msg: GameIntentMessage): void;
}
```

- Un solo `map-app` por room (MVP; sin elección de líder).
- Ignora `GAME_INTENT` si `actorId` no registrado.

---

## Criterios de aceptación MVP

- [ ] `map-app` + `walk-app` + `watch-app` en la misma room.
- [ ] Vaivén completo sin intervención manual.
- [ ] `watch-app` imprime progreso en consola.
