# CAUDAL — Acta de validación (plantilla en blanco)

Acta de **una** pasada de validación de [CASOS.md](CASOS.md) contra la demo real.
CASOS.md es el guion (qué hacer y en qué orden); esto es el registro de lo que
pasó en tu sesión. **Rellena una copia por sesión; no acumules rondas aquí.**

> **Antes de tocar nada, lee el prólogo «⚠️ LÉEME ANTES DE EMPEZAR» de
> [CASOS.md](CASOS.md)** y sigue su plan de secuencias (rondas A/B/C). Te
> ahorra las trampas conocidas: la ronda caduca en ~6 min, el launcher deja
> huérfanos, y este playbook ya ha mentido al menos una vez.

## Las dos reglas de este documento

1. **No inventes observaciones.** Si no lo has visto (tú, por captura, o el
   humano, confirmándolo), se escribe `⏳ sin verificar`. Nunca «debería verse».
2. **Que la evidencia MCP diga `ok:true` NO significa que se vea en pantalla.**
   Dominio y render están separados a propósito (G-ARG.1). Anota las dos
   columnas por separado; su desacuerdo es el hallazgo más valioso.

## Marcas

| marca | significado | qué generar |
| ----- | ----------- | ----------- |
| ✅ | se vio lo esperado | nada |
| ❌ | no se vio / falla | tarea de **bug**, citando el ID (`V3.4`) |
| ⚠️ | MCP ok pero la vista no acompaña | tarea de **render** — la más valiosa |
| 💡 | funciona pero es pobre/confuso | tarea de **mejora de UX** |
| ⏳ | no se pudo comprobar | dilo, no lo rellenes |

---

## Entorno de esta pasada

| dato | valor |
| ---- | ----- |
| fecha | _(rellenar)_ |
| agente / humano | _(rellenar)_ |
| comando | `ZEUS_OPEN_BROWSER=0 npm run demo:arg` |
| navegador | _(Chrome + extensión «Claude in Chrome» — ver CASOS.md §2)_ |
| feeds | _(synthetic / real / auto)_ |
| vistas abiertas | _(solo las del caso; abrir 3 escenas 3D satura GPUs modestas)_ |
| commit | _(rellenar: `git rev-parse --short HEAD`)_ |

## Rondas de esta sesión

> La ronda caduca en ~6 min (ver CASOS.md §1). Anota cuántas necesitaste y por
> qué murió cada una: es dato útil, no ruido.

| ronda | secuencias cubiertas | fin (colapso / reinicio manual) | notas |
| ----- | -------------------- | ------------------------------- | ----- |
| A | | | |
| B | | | |
| C | | | |

---

## Acta por secuencia

> Una entrada por PARADA del plan de CASOS.md. Copia los IDs del checklist
> (`V0.1`, `V1.2`…) y márcalos. Añade la evidencia MCP literal que respalde
> cada bloque.

### PARADA 0 — arranque
- Evidencia MCP: ⏳
- Checklist: `V0.1` ⏳ · `V0.2` ⏳ · `V0.3` ⏳ · `V0.4` ⏳ · `V0.5` ⏳
- Notas:

### PARADA 1 — movimiento (C-01, C-02, C-02b, C-03)
- Evidencia MCP: ⏳
- Checklist: `V1.1` ⏳ · `V1.2` ⏳ · `V1.3` ⏳ · `V1.4` ⏳ · `V1.5` ⏳ · `V1.6` ⏳ · `V1.7` ⏳
- Notas:

### PARADA 2 — grifo (C-04, C-04b, C-05)
- Evidencia MCP: ⏳
- Checklist: `V2.1` ⏳ · `V2.2` ⏳ · `V2.3` ⏳ · `V2.4` ⏳ · `V2.5` ⏳ · `V2.6` ⏳ · `V2.7` ⏳ · `V2.8` ⏳
- Notas:

### PARADA 3 — río (C-07, C-08, C-09)
- Evidencia MCP: ⏳
- Checklist: `V3.1` ⏳ · `V3.2` ⏳ · `V3.3` ⏳ · `V3.4` ⏳ · `V3.5` ⏳ · `V3.6` ⏳ · `V3.7` ⏳ · `V3.8` ⏳ · `V3.9` ⏳
- Notas:

### PARADA 4 — mar vivo (C-17, C-18)
- Evidencia MCP: ⏳
- Checklist: `V4.1` ⏳ · `V4.2` ⏳ · `V4.3` ⏳ · `V4.4` ⏳ · `V4.5` ⏳ · `V4.6` ⏳ · `V4.7` ⏳ · `V4.8` ⏳ · `V4.9` ⏳
- Notas:

### PARADA 5 — cantera (C-11, C-12, C-12b)
- Evidencia MCP: ⏳
- Checklist: `V5.1` ⏳ · `V5.2` ⏳ · `V5.3` ⏳ · `V5.4` ⏳ · `V5.5` ⏳ · `V5.6` ⏳
- Notas:

### PARADA 6 — cloaks y social (C-10, C-13, C-14, C-16)
- Evidencia MCP: ⏳
- Checklist: `V6.1` ⏳ · `V6.2` ⏳ · `V6.3` ⏳ · `V6.4` ⏳ · `V6.5` ⏳ · `V6.6` ⏳ · `V6.7` ⏳
- Notas:

### PARADA 7 — riada y colapso (C-06, C-15) · ronda desechable
- Evidencia MCP: ⏳
- Checklist: `V7.1` ⏳ · `V7.2` ⏳ · `V7.3` ⏳ · `V7.4` ⏳ · `V7.5` ⏳ · `V7.6` ⏳ · `V7.7` ⏳
- Notas:

---

## Tareas que salen de esta pasada

> El objetivo real: cada ❌ / ⚠️ / 💡 se convierte en una entrada accionable,
> citando el ID para que sea rastreable hasta la observación que la originó.

| ID | marca | qué se vio (o no) | tarea propuesta | tipo |
| -- | ----- | ----------------- | --------------- | ---- |
| | | | | |

## Discrepancias con el playbook

> Puntos donde CASOS.md afirma algo que la realidad no respalda. Estos son los
> más importantes: corrompen todas las validaciones futuras hasta que se
> arreglen. Verifica contra el código antes de acusar.

| dónde | qué afirma | qué pasa de verdad | acción |
| ----- | ---------- | ------------------ | ------ |
| | | | |
