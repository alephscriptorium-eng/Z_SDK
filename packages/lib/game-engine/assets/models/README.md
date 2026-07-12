# Placeholder models

GLB placeholders from `gea-sdk/packages/game` (three.js official examples /
sample-assets). **Placeholders until the real Alephillo GLB lands** — see blocker
below and `gea-sdk/packages/game/gameobjects/alephillo/TECHNICAL.md`.

## `SK_Alephillo.glb` (canonical filename)

| Status | Detail |
|--------|--------|
| **Shipped** | Xbot mesh copy under canonical name until ALP_* rig art lands |
| **Clip-map** | `DEFAULT_CLIP_MAPS['SK_Alephillo.glb']` shares Xbot clip proxies (`placeholderMesh: 'Xbot.glb'`) |
| **Swap** | Replace binary + switch clip-map to identity `ALP_*` names when art delivers |

## Other placeholders

| File | Origin (gea-sdk) | Upstream | Clips |
|------|------------------|----------|-------|
| `SK_Alephillo.glb` | copy of Xbot (canonical name) | three.js Xbot mesh | same as Xbot |
| `Xbot.glb` | `gameobjects/alephillo/recursos/threejs/modelos/` | three.js sample (additive blending) | `agree`, `headShake`, `idle`, `run`, `sad_pose`, `sneak_pose`, `walk` |
| `RobotExpressive.glb` | idem | three.js sample (skinning morph) | `Idle`, `Walking`, `Sitting`, `Running`, `Standing`, `Dance`, `Death`, `Jump`, `No`, `Punch`, `ThumbsUp`, `WalkJump`, `Wave`, `Yes` |
| `SheenChair.glb` | `gamethings/recursos/modelos/threejs/` | glTF sample assets | — (static anchor) |

Spec clip names (`ALP_LOC_*` / `ALP_IDLE_*` / `ALP_ADD_*`) map to these real
clip names in `@zeus/ui-3d-kit`'s `src/puppet/clip-map.mjs`
(see `../../spec/alephillo/`).

These binaries are now **owned canonically by `@zeus/game-engine`** (block-11
GA-B — no more vendor-sync from gea-sdk). `@zeus/ui-3d-kit` serves them by
re-exporting `modelsDir` from `@zeus/game-engine/node`. Do not edit binaries by
hand; the real Alephillo rig lands as a one-shot replacement (block-09 AR-A).

## Download (if a binary is missing)

```bash
# from the game-engine package root
curl -fsSL -o assets/models/Xbot.glb \
  https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb
curl -fsSL -o assets/models/RobotExpressive.glb \
  https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb
curl -fsSL -o assets/models/SheenChair.glb \
  https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb
```
