# Alephillo — Catálogo de animación

Vocabulario gestual de la marioneta. Cada clip debe ser **legible en silueta**. Duraciones indicadas son objetivo para el animador; tolerancia ±0.1 s.

---

## Capas del blend tree

```
Layer 0 (Override) ─── LOC_* | IDLE_*
Layer 1 (Additive) ─── gestos torso/brazos (slot primario)
Layer 2 (Additive) ─── gestos cabeza/cuello
Layer 3 (Additive) ─── gestos mano / objeto
Layer 4 (Additive) ─── gestos piernas / desplazamiento puntual
```

**Prioridad de conflicto:** si Layer 4 y locomoción compiten en piernas, gana locomoción salvo gesto con flag `fullBody: true`.

---

## Locomoción (Layer 0)

| Clip ID | Loop | Duración | Root motion | Notas |
|---------|------|----------|-------------|-------|
| `ALP_LOC_walk` | Sí | 1.0 s | 1.4 m/s | Paso amplio; brazos balanceo títere |
| `ALP_LOC_walk_slow` | Sí | 1.4 s | 0.7 m/s | Contemplativo |
| `ALP_LOC_turn_L` | No | 0.5 s | 90° Y | Pie pivote |
| `ALP_LOC_turn_R` | No | 0.5 s | 90° Y | Espejo |
| `ALP_LOC_stop` | No | 0.3 s | — | Frenado desde walk |

---

## Idle (Layer 0)

| Clip ID | Loop | Duración | Cuándo |
|---------|------|----------|--------|
| `ALP_IDLE_breathe` | Sí | 3.0 s | Default `neutral` |
| `ALP_IDLE_slow` | Sí | 4.0 s | `wonder`, sin input |
| `ALP_IDLE_shift` | Sí | 2.5 s | `doubt` |
| `ALP_IDLE_fidget` | Sí | 2.0 s | `unease` |
| `ALP_IDLE_look_horizon` | Sí | 6.0 s | Auto tras 8 s sin input |
| `ALP_IDLE_blink` | No | 0.2 s | Overlay evento cada 3–7 s (código) |

**Variante idle:** el controller elige aleatoriamente entre clips compatibles con `mood` cada 8–15 s.

---

## Gestos aditivos — catálogo principal

### Cabeza y actitud

| Gesture ID | Clip | Duración | Slot | Mood afín | Descripción |
|------------|------|----------|------|-----------|-------------|
| `nod_slow` | `ALP_ADD_nod_slow` | 1.2 s | 2 | neutral, melancholy | Asentimiento pensativo |
| `nod_quick` | `ALP_ADD_nod_quick` | 0.5 s | 2 | spark | Idea repentina |
| `shake_head` | `ALP_ADD_shake_head` | 0.8 s | 2 | doubt | Negación suave |
| `head_down` | `ALP_ADD_head_down` | 1.5 s | 2 | melancholy | Mirada al suelo |
| `look_up` | `ALP_ADD_look_up` | 2.0 s | 2 | wonder | Cielo / trascendencia |
| `look_away` | `ALP_ADD_look_away` | 1.0 s | 2 | unease | Evitar contacto |
| `tilt_curious` | `ALP_ADD_tilt_curious` | 1.5 s | 2 | wonder | Cabeza ladeada |

### Brazos y torso

| Gesture ID | Clip | Duración | Slot | Mood afín | Descripción |
|------------|------|----------|------|-----------|-------------|
| `shrug` | `ALP_ADD_shrug` | 1.0 s | 1 | doubt, neutral | Hombros al aire |
| `scratch_head` | `ALP_ADD_scratch_head` | 1.8 s | 1+3 | doubt | Mano a sombrero/cabeza |
| `hands_open` | `ALP_ADD_hands_open` | 1.5 s | 1 | wonder | Palmas arriba, filosófico |
| `hands_pockets` | `ALP_ADD_hands_pockets` | 2.0 s | 1 | melancholy | Manos invisibles en bolsillos sugeridos |
| `finger_up` | `ALP_ADD_finger_up` | 1.0 s | 1+3 | spark | Énfasis en punchline |
| `cross_arms` | `ALP_ADD_cross_arms` | 2.5 s | 1 | neutral | Escucha activa |
| `point` | `ALP_ADD_point` | 1.2 s | 1+3 | spark | Señalar interactuable |
| `wave_soft` | `ALP_ADD_wave_soft` | 1.5 s | 3 | neutral | Saludo mínimo |

### Piernas y desplazamiento

| Gesture ID | Clip | Duración | Slot | fullBody | Descripción |
|------------|------|----------|------|----------|-------------|
| `step_back` | `ALP_ADD_step_back` | 0.8 s | 4 | parcial | Retroceso 0.3 m |
| `kick_dust` | `ALP_ADD_kick_dust` | 1.0 s | 4 | no | Toque western seco |
| `sit_start` | `ALP_ADD_sit_start` | 1.2 s | 0 | **sí** | Transición a sentado (cutscene) |

### Sombrero y props

| Gesture ID | Clip | Duración | Slot | Notas |
|------------|------|----------|------|-------|
| `hat_tip` | `ALP_ADD_hat_tip` | 1.0 s | 2+3 | Saludo formal cómico |
| `hat_brush` | `ALP_ADD_hat_brush` | 1.5 s | 3 | Viento / polvo |
| `hold_object` | `ALP_ADD_hold_object` | loop | 3 | Requiere `attachProp` |

---

## Matriz mood → pesos recomendados

Valores 0–1 para **bias** al elegir idle y gestos ambientales automáticos.

| Gesture / Idle | neutral | wonder | doubt | melancholy | spark | unease |
|----------------|---------|--------|-------|------------|-------|--------|
| `idle_breathe` | 1.0 | 0.3 | 0.4 | 0.2 | 0.2 | 0.1 |
| `idle_slow` | 0.2 | 1.0 | 0.3 | 0.5 | 0.1 | 0.2 |
| `idle_shift` | 0.3 | 0.2 | 1.0 | 0.3 | 0.2 | 0.5 |
| `shrug` | 0.3 | 0.1 | 0.9 | 0.2 | 0.4 | 0.3 |
| `look_up` | 0.1 | 0.95 | 0.1 | 0.3 | 0.2 | 0.0 |
| `hands_open` | 0.2 | 0.8 | 0.3 | 0.2 | 0.5 | 0.1 |
| `head_down` | 0.1 | 0.2 | 0.3 | 0.9 | 0.0 | 0.4 |

---

## Curvas de peso aditivo

Gestos one-shot siguen envolvente estándar:

```
peso
1.0 ┤      ╭──╮
    │     ╱    ╲
0.0 ┤────╯      ╰────
    0   in  hold  out  tiempo
```

| Fase | Duración típica |
|------|-----------------|
| in | 0.15 s |
| hold | 60% del clip |
| out | 0.25 s |

**Gestos loop** (`hold_object`, `cross_arms`): in 0.2 s, out 0.2 s al cancelar.

---

## Sincronización y marcadores

Frames marcados en clips (notificación vía animation events):

| Marcador | Clip(s) | Evento |
|----------|---------|--------|
| `foot_L` | `LOC_walk`, `LOC_walk_slow` | `footstep` L |
| `foot_R` | idem | `footstep` R |
| `peak` | todos `ADD_*` | `onPeak` callback |
| `dust` | `kick_dust` | VFX línea en suelo |

---

## Combos narrativos sugeridos

Secuencias que el guionista / sistema de diálogo puede invocar por ID:

| Combo ID | Secuencia | Uso |
|----------|-----------|-----|
| `ponder` | `scratch_head` → beat 0.8 → `shrug` | Pregunta existencial |
| `reveal` | `finger_up` → `nod_quick` | Chiste o idea |
| `greet` | `hat_tip` → `wave_soft` | Encuentro amistoso |
| `uneasy_exit` | `look_away` → `step_back` | Retirada social |
| `marvel` | `look_up` → `hands_open` (overlap) | Paisaje importante |

Implementación: método opcional `playCombo(comboId)` que encola gestos con tiempos de [FUNCTIONAL.md](./FUNCTIONAL.md).

---

## Lo que no animar (v0.1)

- Lip sync fonémico.
- Dedos individuales.
- Daño / muerte gráfica.
- Ragdoll.
- Salto acrobático.

---

## Checklist para animador

- [ ] Silueta leíble en viewport 256 px.
- [ ] Codos con quiebre de marioneta (ángulos, no curva humana realista).
- [ ] Sombrero reacciona con retraso 1–2 frames tras cabeza.
- [ ] Sin pops en hombros al activar aditivos.
- [ ] Root motion de walk verificado en 10 m línea recta.
- [ ] Todos los clips exportados con prefijo `ALP_`.
