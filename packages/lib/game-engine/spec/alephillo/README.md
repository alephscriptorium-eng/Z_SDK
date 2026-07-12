# Alephillo

**Marioneta expresiva** inspirada en la estética naïf y filosófica de *Cuttlas* (Calpurnio), diseñada para integrarse en mundos **blanco y negro de líneas**, con acentos de color puntuales y animación por **capas aditivas** sobre un esqueleto mínimo.

> Este paquete es **especificación de diseño**, no implementación. El ingeniero de juegos recibe contratos claros, presupuestos de rendimiento y vocabulario expresivo listo para cablear en su motor.

---

## Documentos

| Documento | Audiencia | Contenido |
|-----------|-----------|-----------|
| [DESIGN.md](./DESIGN.md) | Arte, diseño, narrativa | Identidad visual, personalidad, tono, relación con el mundo |
| [TECHNICAL.md](./TECHNICAL.md) | Ingeniería, arte técnico | Rig, materiales, shaders, assets, presupuestos, referencia three.js |
| [FUNCTIONAL.md](./FUNCTIONAL.md) | Gameplay, sistemas | API pública, estados, eventos, integración con escena y diálogo |
| [ANIMATION.md](./ANIMATION.md) | Animación, gameplay | Capas base + aditivas, blend tree, catálogo gestual, reglas de mezcla |
| [recursos/](./recursos/) | Implementación | Ejemplo three.js, Xbot.glb, docs, imágenes Cuttlas |

---

## Resumen ejecutivo

| Atributo | Valor |
|----------|-------|
| **Nombre** | Alephillo |
| **Arquetipo** | Vaquero contemplativo / marioneta de línea |
| **Silueta** | Alta, delgada, sombrero ancho, brazos largos de títere |
| **Paleta** | B/N dominante; acentos: blanco roto (`#F5F0E6`), tinta (`#1A1A1A`), acento narrativo (`#3D5A80` opcional) |
| **Rig** | Humanoid mínimo (~12 huesos jugables) + 4 slots aditivos |
| **Referencia técnica** | [three.js — additive skinning](https://threejs.org/examples/#webgl_animation_skinning_additive_blending) |
| **Target hardware** | WebGL 2 / GLES 3.0, 30 FPS en iGPU 2018+ |

---

## Integración en 5 pasos (para el ingeniero)

1. **Instanciar** `Alephillo` como `SkinnedMesh` + `AnimationMixer` según [TECHNICAL.md](./TECHNICAL.md).
2. **Registrar** el catálogo de clips de [ANIMATION.md](./ANIMATION.md) en el blend tree (base locomoción + aditivos expresivos).
3. **Conectar** la API de [FUNCTIONAL.md](./FUNCTIONAL.md): `setMood()`, `playGesture()`, `lookAt()`, eventos `onBeat` / `onLineEnd`.
4. **Aplicar** el material de contorno + relleno plano; respetar reglas de color del mundo (solo Alephillo y objetos narrativos llevan acento).
5. **Validar** contra checklist de aceptación en [FUNCTIONAL.md § Aceptación](./FUNCTIONAL.md#criterios-de-aceptación).

---

## Principio rector

> *La marioneta no simula realismo: **sugiere pensamiento**.*  
> Cada gesto debe leerse a 50 px de altura en pantalla. Si no se entiende en miniatura, sobra detalle.

---

## Estado del paquete

| Versión | Fecha | Notas |
|---------|-------|-------|
| `0.1.0-spec` | 2026-07-11 | Especificación inicial. Sin assets binarios. |
