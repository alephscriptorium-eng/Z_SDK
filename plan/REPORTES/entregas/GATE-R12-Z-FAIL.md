# GATE R12-Z · FAIL documental

Fecha: 2026-07-24  
Vigía: SOL  
Petición: `AVISO-R12-Z-pedido-PASS.md`  
Tip solicitado: `3b09213`

## Veredicto

**R12-Z FAIL.**

La planificación y la PAUSA son materialmente coherentes, pero la petición no
es reproducible sobre el snapshot declarado. No se autoriza implementación,
despacho ni publicación.

## Evidencia conforme

- `9cdbb5a..3b09213` contiene solo dos commits bajo `plan/**`:
  `c22dd65` y `3b09213`.
- DA-S21 existe en Scriptorium como `2eb4784` y limita el GO a planificación.
- D-43 cita `DA-S21 · 2eb4784`.
- U168–U178 y U73 permanecen en ⬜; no hay estados 🔶.
- Solo existe el worktree principal; ramas `wp/*` y locks: `0`.
- PAUSA efectiva, sin workers, despacho ni publicación.
- CI `30088694250` terminó `success` sobre `88a9568`; el rango auditado es
  exclusivamente `plan/**`, por lo que el skip de CI está justificado.
- Ceguera sobre las caras `§WP` de las tres addendas: `0`, `0`, `0`.

## Bloqueantes

1. El aviso de petición no existe en `3b09213`: fue añadido posteriormente en
   `0e297a3`. Por tanto, el propio asiento que solicita el gate queda fuera del
   snapshot auditado.
2. El estado observado avanzó después del tip solicitado: HEAD local
   `46c3e5c`, remoto `4604984`, con divergencia `+1/-0`. El aviso todavía
   presenta `3b09213` como tip canónico.
3. `REPLAN-2026-07-24-r13-dramaturgo-zigurat.md` conserva “DA-S21 pendiente”
   y “R13 HOLD hasta el asiento”, en contradicción con D-43 y el aviso R13.
4. La evidencia de ceguera mezcla dos alcances: las caras públicas `§WP` dan
   `0`, pero una búsqueda global del HEAD encuentra menciones del patrón en el
   propio aviso de auditoría. La siguiente petición debe declarar y ejecutar
   inequívocamente el alcance `§WP`.

## Corrección mínima para reintento

1. Mantener PAUSA.
2. Actualizar el REPLAN para citar `DA-S21 · 2eb4784` y retirar únicamente el
   HOLD de autoridad; conservar R13-Z detrás de R12-Z PASS.
3. Elegir un único tip canónico que incluya la corrección y el aviso.
4. Sincronizar ese tip con `origin/main` o explicar y cerrar la divergencia.
5. Regenerar el aviso con tip, rango y commits exactos.
6. Reejecutar ceguera sobre cada cara `§WP` y persistir los conteos literales.
7. Pedir **R12-Z PASS (reintento)**.

No se requiere CI de código nuevo si la corrección sigue limitada a
`plan/**`. No hace falta un nuevo GO.
