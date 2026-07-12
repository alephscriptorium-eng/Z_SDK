# Alephillo — Diseño y caracterización

## Linaje y propósito

**Alephillo** no es un clon de Cuttlas: hereda su **economía gráfica** (muñeco de pocos trazos, mucha alma) y su **tono** (western metafísico, humor seco, pausas largas). Es el avatar del jugador-observador en un mundo que parece **viñeta ampliada**: líneas antes que volúmenes, vacío antes que decorado.

Referencia cultural: [Cuttlas — Wikipedia](https://es.wikipedia.org/wiki/Cuttlas).

---

## Silueta y lectura

```
        ╭──╮
       ╱    ╲     ← sombrero: elipse achatada, ala ancha (40% altura total)
      │  ○ ○ │    ← ojos: dos puntos o guiones; sin pupila salvo mirada "fija"
      │  ─  │     ← boca: un trazo; rara vez se abre
       ╲    ╱
        │││       ← cuerpo: trapezoide blanco, sin cintura marcada
       ╱ │ ╲      ← brazos: segmentos rectos, codos en ángulo de marioneta
      │  │  │     ← piernas: líneas; botas sugeridas con bloque negro mínimo
```

**Proporciones (altura normalizada = 1.0):**

| Zona | Fracción | Notas |
|------|----------|-------|
| Sombrero | 0.22 | Siempre visible; nunca se quita en gameplay |
| Cabeza | 0.18 | Casi circular en frontal |
| Torso | 0.28 | Más ancho que cadera (forma de lágrima invertida suave) |
| Piernas | 0.32 | Largas; paso amplio y lento |
| Brazos | 0.55 del torso | Llegan a mitad de muslo en reposo |

**Regla de oro:** desde la cámara gameplay típica (3/4, distancia media), la silueta debe distinguirse de cualquier NPC con **solo contorno**, sin color.

---

## Paleta y materialidad

### Modo mundo (por defecto)

- **Fondo / suelo:** blanco puro o gris papel (`#F8F8F6`).
- **Tinta / contorno:** negro suave (`#1A1A1A`), grosor constante en unidades de pantalla (screen-space outline).
- **Relleno corporal Alephillo:** blanco roto (`#F5F0E6`) — único personaje con relleno visible de forma habitual.
- **Sombra:** no sombras realistas; solo **línea de suelo** (elipse discontinua bajo los pies).

### Acentos de color (uso narrativo, no cosmético)

| Token | Hex | Uso permitido |
|-------|-----|----------------|
| `accent.sky` | `#3D5A80` | Cielo en momentos de epifanía; objetos de memoria |
| `accent.warm` | `#C45C3E` | Peligro lejano, atardecer citado en diálogo |
| `accent.alien` | `#4A7C59` | Presencias "fuera de lugar" (eco de personajes tipo 37) |

**Máximo 5% del framebuffer** con color fuera de B/N en escena normal. Picos narrativos pueden subir a 15% temporalmente (≤ 8 s).

### Textura

- **Una sola hoja** 512×512, UVs simples.
- Detalle dibujado a mano: ligera irregularidad en el borde del sombrero y las botas.
- Sin normal maps. Opcional: **ruido sutil** en albedo para evitar banding en gradientes de cielo.

---

## Personalidad

### Voz interior (para escritores y sistemas de diálogo)

Alephillo **piensa en voz alta** con frases cortas, a veces incompletas. No es héroe ni antihéroe: es **testigo**. Humor por contraste entre la grandilocuencia del pensamiento y la modestia del gesto.

**Rasgos:**

| Rasgo | Manifestación en juego |
|-------|------------------------|
| Contemplativo | Idle largo; mira el horizonte sin input del jugador |
| Irónico suave | Gestos `shrug` + líneas de diálogo con doble sentido |
| Valiente distraído | Avanza hacia objetivos sin prisa; `scratch_head` antes de decisiones |
| Empático silencioso | `nod_slow` ante NPCs; poco texto, mucho gesto |
| Metafísico doméstico | Comenta objetos mundanos como si fueran cosmos |

**No hace:** gritos, poses de poder, violencia gráfica, slapstick rápido.

**Sí hace:** pausas, miradas, encogimiento de hombros, manos al aire filosóficas.

### Estados emocionales (capa lógica, no solo animación)

| Mood ID | Descripción | Locomoción | Aditivos favoritos |
|---------|-------------|------------|-------------------|
| `neutral` | Presente, abierto | `idle_breathe` | — |
| `wonder` | Asombro tranquilo | `idle_slow` | `look_up`, `hands_open` |
| `doubt` | Duda cómica | `idle_shift` | `scratch_head`, `shrug` |
| `melancholy` | Tristeza ligera | `walk_slow` | `head_down`, `hands_pockets` |
| `spark` | Idea / chiste | parado | `finger_up`, `nod_quick` |
| `unease` | Incomodidad social | `idle_fidget` | `step_back`, `look_away` |

El ingeniero mapea `mood` → pesos de aditivos y velocidad de locomoción (ver [ANIMATION.md](./ANIMATION.md)).

---

## Relación con el mundo

### Contrato visual mundo ↔ marioneta

1. **El mundo es mayormente contorno.** Edificios, árboles y NPCs secundarios: solo líneas; relleno blanco o ninguno.
2. **Alephillo es la excepción legible:** lleva relleno claro para anclar al jugador.
3. **Profundidad** se sugiere con grosor de línea (lejos = fino) y parallax, no con luces.
4. **Objetos interactivos** ganan un segundo trazo interior (como tinta china) al entrar en foco.

### Escala en escena

- Ojos del jugador: **1.65 m** unidades mundo.
- Puertas: 2.1 m (Alephillo pasa sin agacharse; el sombrero casi roza el dintel — gag opcional).
- NPCs: misma altura o ±10%; nunca el doble.

### Cámara recomendada

- Tercera persona 3/4, FOV 45–50°.
- Ligera **oscilación vertical** al caminar (2–3 cm) — sensación de papel tambaleante.
- En diálogos: acercamiento lento al torso superior; el sombrero puede recortarse frame.

---

## NPCs y familia visual (para coherencia)

Alephillo convive con arquetipos que comparten reglas pero distinta silueta:

| Arquetipo | Silueta | Color acento |
|-----------|---------|--------------|
| `Companion` | Redondo, bajo | `accent.sky` en prenda |
| `Trickster` | Encorvado, sombrero alto | `accent.warm` |
| `Stillman` | Sentado, casi sin líneas | ninguno |
| `Visitor` | Forma no humana simple | `accent.alien` |

Alephillo siempre se reconoce por **proporción vertical + sombrero ancho + relleno blanco**.

---

## Audio (dirección, no implementación)

- Pasos: percusión seca, papel o madera hueca.
- Ropa: sin foley realista; opcional crujido de papel muy bajo.
- Voces: si hay voz, preferir murmullo o texto en pantalla con tipografía manuscrita.
- Música: espacio amplio; un instrumento (armónica, piano seco) en momentos `wonder`.

---

## Glosario

| Término | Significado |
|---------|-------------|
| **Marioneta** | Alephillo en rig; cuerpo de línea con articulaciones visibles |
| **Tinta** | Contorno screen-space negro |
| **Aditivo** | Clip de gesto superpuesto sin romper locomoción |
| **Viñeta** | Composición de cámara con margen blanco opcional |
| **Beat** | Pausa dramática de 0.4–1.2 s tras línea de diálogo |
