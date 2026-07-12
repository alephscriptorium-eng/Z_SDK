# Gamechannel — Especificación funcional

## Bridge Rooms

```javascript
// publicar
client.room('GAME_STATE', payload, config.room);

// suscribir
client.io.on('GAME_INTENT', (data) => { ... });
client.io.on('GAME_STATE', (data) => { ... });
```

Mismo patrón que `ping-app` (`PING`) y `pong-app` (`PONG`).

---

## Validación payload

| Campo | Regla |
|-------|-------|
| `type` | Debe coincidir con room key |
| `v` | `1` en MVP |
| `ts` | número, opcional skew check |
| `from` | usuario Rooms emisor |

Map-app ignora intents sin `actorId` o `intent`.

---

## Autoridad única

Si dos `map-app` conectan: **undefined behavior** en MVP. Documentar: lanzar solo uno por room.

---

## Idempotencia

`walk-app` guarda `lastIntentKey` para no spamear:

```
${intent}-${linkId}-${direction}-${anchorId}
```

mientras `pose === 'walk'`.

---

## Criterios de aceptación

- [ ] `watch-app` recibe estados sin participar en intents.
- [ ] `walk-app` completa ciclo A→B→A.
- [ ] `map-app` rechaza walk inválido sin crashear.

---

## Relación con gameviewer

| Tier | App |
|------|-----|
| 0 | `watch-app` (consola) |
| 1+ | `gameviewer` futuro (WebGL) |

Misma suscripción `GAME_STATE`.
