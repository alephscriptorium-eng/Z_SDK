# {{game}} — Acta de validación (plantilla)

Acta de **una** pasada de validación de CASOS.md contra la demo real.
CASOS.md es el guion (qué hacer y en qué orden); esto es el registro de lo que
pasó en tu sesión. **Rellena una copia por sesión; no acumules rondas aquí.**

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
| ❌ | no se vio / falla | tarea de **bug**, citando el ID |
| ⚠️ | MCP ok pero la vista no acompaña | tarea de **render** — la más valiosa |
| 💡 | funciona pero es pobre/confuso | tarea de **mejora de UX** |
| ⏳ | no se pudo comprobar | dilo, no lo rellenes |

---

## Entorno de esta pasada

| dato | valor |
| ---- | ----- |
| fecha | {{fecha}} |
| agente / humano | {{agente}} |
| comando | {{comando}} |
| navegador | {{navegador}} |
| commit | {{commit}} |

## Casos ejecutados (mitad MCP)

> La mitad visual sigue siendo humana (G-ARG.1). Checklist humano = `⏳` hasta
> confirmación.

{{casos_block}}

## Tareas que salen de esta pasada

| ID | marca | qué se vio (o no) | tarea propuesta | tipo |
| -- | ----- | ----------------- | --------------- | ---- |
| | | | | |

## Discrepancias con el playbook

| dónde | qué afirma | qué pasa de verdad | acción |
| ----- | ---------- | ------------------ | ------ |
| | | | |
