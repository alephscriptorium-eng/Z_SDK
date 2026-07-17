# Gamemap

**Verdad lógica del mundo compartido**: escenas instanciadas, actores, tick, snapshots. No es un `THREE.Scene` ni vive en el GPU del jugador.

Complementa [`gameobjects/`](../gameobjects/) (quién) y [`gamethings/`](../gamethings/) (dónde). Los **gameviewers** consumen snapshots; el **gamechannel** los transporta.

---

## Documentos

| Documento | Contenido |
|-----------|-----------|
| [SCENE.md](./SCENE.md) | Escena vs instancia, carga, grafo plano |
| [STATE.md](./STATE.md) | Snapshot autoritativo, actores, anclas |
| [TICK.md](./TICK.md) | Bucle lógico, progress, transiciones |
| [FUNCTIONAL.md](./FUNCTIONAL.md) | API MapEngine, intents, eventos |

---

## Implementación MVP

| Pieza | Ruta |
|-------|------|
| Motor lógico | [`../runtime/map-engine.mjs`](../runtime/map-engine.mjs) |
| Escena runtime | [`../runtime/scenes/vaiven-dos-nodos.mjs`](../runtime/scenes/vaiven-dos-nodos.mjs) |
| Autoridad (room) | [`../apps/map/`](../apps/map/) |
| Cliente intención | [`../apps/walk/`](../apps/walk/) |
| Observador | [`../apps/watch/`](../apps/watch/) |

```bash
npm run map-demo    # desde raíz del monorepo
npm run map
```

---

## Principio rector

> El mapa es **plano y pequeño**. El árbol enorme es problema del **viewer**, no de la verdad compartida.

---

## Versión

`0.1.0-spec` — 2026-07-12
