# Arquitectura — @zeus/game-engine

Absorbido desde `gea-sdk/packages/game` (block-11 GA-B). El motor lógico y las
escenas viven aquí como única fuente de verdad; los binarios y specs de diseño
lo acompañan.

```
spec/alephillo/  → actor Alephillo (specs, animación)
spec/gamemap/    → verdad lógica compartida (MapEngine, tick)
spec/gamechannel/→ tubería Rooms (GAME_INTENT, GAME_STATE)
spec/*.yaml      → escenas de diseño (gamething)
src/             → map-engine, scenes (runtime)
assets/models/   → GLBs canónicos (placeholder Alephillo hasta rig ALP_*)
```

Consumidores en zeus:
- **`@zeus/ui-3d-kit`** — importa el motor y sirve los GLBs a los visores.
- **`@zeus/game-demos`** — runners map/walk/watch sobre `@zeus/rooms`.
- **`@zeus/ping-pong-bots`** — bots de canal (eval/resolve + sesión).

La variante Angular WebGL (`threejs-gamify-ui`, viewer tier 2+) queda fuera del
workspace de zeus por decisión GA-D (ver block-11); zeus ya rediseñó en vanilla
ESM (`ui-3d-kit`, block-02/block-08).
