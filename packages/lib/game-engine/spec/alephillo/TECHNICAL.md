# Alephillo — Especificación técnica

Documento para ingeniería de juegos y arte técnico. Define assets, pipeline, shaders y presupuestos sin prescribir motor concreto (Three.js, Unity, Godot, Bevy…).

**Referencia de animación:** [three.js — webgl_animation_skinning_additive_blending](https://threejs.org/examples/#webgl_animation_skinning_additive_blending)

---

## Arquitectura del prefab

```
Alephillo (root)
├── Transform
├── AlephilloController      ← script / componente lógico (ver FUNCTIONAL.md)
├── AnimationGraph
│   ├── Layer_Base           ← locomoción + idle (override)
│   └── Layer_Additive[4]    ← gestos, slots 0–3
├── SkinnedMesh
│   ├── Mesh: alephillo_body (low poly)
│   ├── Skeleton: SK_Alephillo
│   └── Materials[2]: M_Outline, M_Fill
├── Attach_Head              ← socket mirada / sombrero props
├── Attach_Hand_L
├── Attach_Hand_R
└── ShadowDecal              ← elipse de línea en suelo (quad + shader)
```

---

## Geometría

| Métrica | Objetivo |
|---------|----------|
| Triángulos cuerpo | ≤ 800 |
| Triángulos sombrero (sólido) | ≤ 200 |
| Bones influencia por vértice | ≤ 2 |
| LOD1 (lejos) | 400 tris, sin dedos ni borde sombrero |
| LOD2 (muy lejos) | billboarding opcional: silueta 2D atlas |

**Topología:** quads preferidos en export; triangulado en build. Sin geometría facial separada: expresión = huesos + aditivos.

### Jerarquía de huesos (mínimo)

```
root
└── pelvis
    ├── spine
    │   └── chest
    │       ├── neck
    │       │   └── head
    │       ├── shoulder_L → upperArm_L → lowerArm_L → hand_L
    │       └── shoulder_R → upperArm_R → lowerArm_R → hand_R
    ├── upperLeg_L → lowerLeg_L → foot_L
    └── upperLeg_R → lowerLeg_R → foot_R
```

**Huesos opcionales (no críticos v0.1):** `hat_bend`, `coat_tail` (si se añade chaquetón sugerido).

**Escala:** 1 unidad = 1 metro. Origen en suelo entre pies.

---

## Esqueleto y skinning

- **Bind pose:** T-pose relajada, brazos 10° hacia abajo (menos robótico).
- **Skinning:** linear, weights normalizados en DCC.
- **Export:** glTF 2.0 binario (`.glb`) preferido; FBX aceptado con hoja de huesos idéntica.

### Convención de nombres de huesos

Prefijo `ALP_` (ej. `ALP_head`). Animaciones referencian la misma jerarquía.

---

## Materiales y shaders

### M_Fill (cuerpo)

| Parámetro | Valor |
|-----------|-------|
| Albedo | `#F5F0E6` |
| Metallic | 0 |
| Roughness | 1 |
| Lighting | Desactivado o **1 luz direccional fija** (norte, intensidad 0.8) |
| Receive shadows | No |

### M_Outline (paso de contorno)

Implementación recomendada (elegir una):

1. **Screen-space outline** post-proceso sobre depth/normal del mesh.
2. **Inverted hull** (escala a lo largo de normales, color tinta, cull front).
3. **Sobrelínea en textura** para LOD2.

| Parámetro | Valor |
|-----------|-------|
| Color | `#1A1A1A` |
| Grosor pantalla | 2.0–2.5 px @ 1080p (escala con resolución) |
| Depth bias | Evitar z-fighting con suelo |

### M_ShadowDecal

- Quad en Y=0, shader alfa con patrón de guiones.
- Escala XZ proporcional a distancia cámara (mín 0.4 m, máx 0.9 m).

---

## Texturas

| Asset | Resolución | Contenido |
|-------|------------|-----------|
| `T_Alephillo_Albedo` | 512² | Relleno + bordes dibujados; UV único layout |
| `T_Alephillo_Emissive` | 256² | Opcional: ojos/línea boca (negro puro) |

**Sin:** normal, ORM, displacement.

### Atlas UV (layout conceptual)

```
┌─────────────────────────┐
│  SOMBRERO   │   CARA    │
├─────────────┼───────────┤
│  TORSO      │  BRAZOS   │
├─────────────┴───────────┤
│  PIERNAS / BOTAS        │
└─────────────────────────┘
```

---

## Animación — pipeline técnico

### Clips requeridos (ver catálogo completo en [ANIMATION.md](./ANIMATION.md))

| Prefijo | Tipo | Loop | Mezcla |
|---------|------|------|--------|
| `LOC_*` | Base | Sí | Override layer 0 |
| `IDLE_*` | Base | Sí | Override layer 0 |
| `ADD_*` | Aditivo | No / hold | Additive layers 1–4 |

### Additive blending (contrato)

Basado en el ejemplo three.js:

```javascript
// Pseudocódigo — patrón esperado
const actionBase = mixer.clipAction(clipLocomotion, mesh);
actionBase.play();

const actionAdd = mixer.clipAction(clipGesture, mesh);
actionAdd.blendMode = AdditiveBlending; // THREE.AdditiveAnimationBlendMode
actionAdd.play();

// Peso aditivo 0→1→0 según curva del gesto
actionAdd.setEffectiveWeight(weight);
```

**Reglas:**

- Máximo **3 aditivos** con peso > 0 simultáneamente.
- Locomoción base nunca se detiene salvo `STATE_LOCKED` (cutscene).
- Crossfade base: **0.2 s** locomoción; **0.15 s** idle.
- Gestos one-shot: duración 0.6–2.0 s; cola FIFO si se saturan slots.

### Root motion

| Clip | Root motion |
|------|-------------|
| `LOC_walk` | Sí — desplazamiento adelante en Z local |
| `LOC_walk_slow` | Sí |
| `LOC_turn_L/R` | Rotación Y en root |
| `IDLE_*` | No |
| `ADD_*` | No (excepto `ADD_step_back` — 0.3 m desplazamiento autorizado) |

El `AlephilloController` puede aplicar root motion al `Transform` o al character controller según el motor.

---

## Rendimiento — presupuestos

| Plataforma referencia | Objetivo |
|-----------------------|----------|
| iGPU laptop 2018 | 30 FPS, 1 Alephillo + 20 NPCs línea |
| Móvil medio 2022 | 60 FPS, 1 Alephillo + 8 NPCs |
| Desktop | 60+ FPS sin límite práctico |

| Recurso | Presupuesto |
|---------|-------------|
| Draw calls (Alephillo solo) | ≤ 3 |
| Memoria texturas | ≤ 2 MB |
| Animaciones activas | 1 base + 4 aditivos máx |
| Actualización IK (mirada) | 1 ray / frame opcional |

### Optimizaciones aprobadas

- Instancing de NPCs que comparten mesh.
- LOD automático por distancia a cámara.
- Baking de animaciones idle largas en textura (solo si perf indica cuello de botella).
- Desactivar outline en LOD2.

---

## Colisiones y física

| Componente | Forma | Capa |
|------------|-------|------|
| Cuerpo | Cápsula altura 1.6 m, radio 0.25 m | `Player` |
| Sombrero (opcional) | Sin colisión | — |
| Raycast interacción | Desde `Attach_Head`, 3 m | `Interactable` |

- **Slope max:** 35°.
- **Step height:** 0.25 m.
- Sin ragdoll en v0.1.

---

## Formato de entrega de assets

```
assets/
  characters/
    alephillo/
      SK_Alephillo.glb          # mesh + skeleton + bind pose
      AN_Alephillo_Library.glb  # o .anim por clip
      T_Alephillo_Albedo.png
      M_Alephillo.json          # definición de materiales (motor-specific)
      prefab_alephillo.*        # instancia lista del motor
```

### Naming de animaciones

`ALP_<CATEGORY>_<NAME>[@<VARIANT>]`

Ejemplos: `ALP_LOC_walk`, `ALP_ADD_shrug`, `ALP_IDLE_breathe`.

---

## Integración three.js (nota para referencia)

El ejemplo oficial demuestra:

1. Carga de modelo skinned.
2. `AnimationMixer` con múltiples acciones.
3. Modo aditivo para gestos superpuestos a idle.

El ingeniero debe replicar **semántica**, no necesariamente API idéntica. En Unity: `AvatarMask` + capas; en Godot: `AnimationNodeBlendTree` con add.

---

## Dependencias de sistema

| Sistema | Requerido | Opcional |
|---------|-----------|----------|
| Skinned mesh renderer | Sí | — |
| Animation mixer / graph | Sí | — |
| Outline / post FX | Sí | — |
| IK look-at (cabeza) | Recomendado | Dos huesos |
| Dialogue / UI | — | Sí |
| Input system | — | Sí |

---

## Versionado

- **Spec:** `0.1.0`
- Cambios breaking en huesos → major bump.
- Nuevos gestos aditivos → minor bump (compatibilidad hacia atrás si slots libres).
