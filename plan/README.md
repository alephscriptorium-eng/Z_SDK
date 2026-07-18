# plan/ — Refundación de zeus-sdk

Esta carpeta es el **centro de mando de la refundación**: convertir zeus-sdk en
una herramienta para crear juegos, con **delta** (`packages/games/delta/*`, antes
«CAUDAL» hasta WP-U02) como primer juego construido con ella, **pozo** como
segundo juego mínimo que fuerza la abstracción, y el playbook de validación
como primer producto del método.

Aquí trabaja un **swarm de agentes** coordinado por un **orquestador** (el
agente de sesión del usuario). La regla de reparto:

- El **swarm implementa** los work packages (WP) del [BACKLOG.md](BACKLOG.md).
- El **orquestador** mantiene esta carpeta, revisa reportes y es el único que
  marca un WP como ✅ aceptado.
- El **usuario** resuelve lo listado en [DECISIONES.md](DECISIONES.md) §abiertas.

## Mapa de documentos

| doc | qué contiene | quién lo edita |
| --- | ------------ | -------------- |
| [VISION.md](VISION.md) | por qué refundamos, los dos mundos (editor / mesh), principios y glosario | orquestador |
| [ARQUITECTURA.md](ARQUITECTURA.md) | diagnóstico datado de la codebase y arquitectura objetivo | orquestador |
| [DATOS.md](DATOS.md) | el plano de datos: líneas (troncos/satélites), formatos canónicos, familias de feed, ciclo crecer/vaciar de VOLUMES, files-first/IPFS, kits del dramaturgo | orquestador |
| [BACKLOG.md](BACKLOG.md) | olas y WPs con criterios de aceptación y demolición | orquestador (estado); swarm propone |
| [RE-PLAN.md](RE-PLAN.md) | balance de cierre de la refundación (lecciones; **no** inventa WPs) | orquestador |
| [PRACTICAS.md](PRACTICAS.md) | **lectura obligatoria antes de tocar código** — anti-monkey-code, auto-revisión, formato de reporte | orquestador |
| [DECISIONES.md](DECISIONES.md) | decisiones tomadas (con fecha) y decisiones abiertas | orquestador |
| [REPORTES/](REPORTES/) | un acta por WP ejecutado, según [REPORTES/PLANTILLA.md](REPORTES/PLANTILLA.md) | swarm |
| [recursos/](recursos/README.md) | clones externos de referencia (gitignorados salvo su README, con procedencia y hallazgos) | orquestador |

Relación con otros backlogs: `packages/games/delta/spec/BACKLOG.md` sigue vivo y manda
sobre las **features del juego delta** (fases 1.6 y 2). Este `plan/` manda
sobre la **refundación del SDK**. Un agente trabaja en uno u otro, nunca mezcla
ambos en un mismo WP.

## Prompts de rol (el protocolo del swarm)

En [roles/](roles/README.md): prompts agnósticos de herramienta para encender
cada rol sin copiar instrucciones (ORQUESTADOR, WORKER, REVISION, CORRECCION,
BRIEF), más las reglas de estado (BACKLOG solo lo edita el orquestador, en
master) y de paralelismo (un worktree por worker).

Adaptador Cursor: [`.cursor/rules/`](../.cursor/rules/) (refuerzo automático
de PRACTICAS al editar código o `plan/`; si contradice a `plan/`, gana `plan/`).

## Ciclo de trabajo de un agente del swarm

1. **Toma un WP** del BACKLOG que esté ⬜ y sin dependencias pendientes.
   Márcalo 🔶 con tu identificador y la fecha.
2. **Lee antes de escribir**: PRACTICAS.md entero, el WP completo (incluida su
   sección *Demolición*), y el código que vas a sustituir. No se sustituye lo
   que no se ha leído.
3. **Rama propia** `wp/<id>-<slug>`. Alcance = el WP, nada más. Lo que
   descubras fuera del alcance se anota en el reporte (§hallazgos), no se
   arregla de pasada.
4. **Implementa con tests en el mismo WP.** Si tocas protocolo o proceso,
   también e2e. Verde local antes de reportar (`npm run lint` + los tests del
   CA del WP).
5. **Demolición**: borra lo que tu WP sustituye (está listado en el WP). Un WP
   que deja el camino viejo y el nuevo conviviendo NO está terminado.
6. **Auto-revisión** (obligatoria, ver PRACTICAS.md §3): al terminar, para,
   relee tu diff completo contra el checklist y corrige lo que caiga.
7. **Reporta**: crea `REPORTES/WP-<id>-<slug>.md` desde la plantilla. Un WP
   sin reporte, o con reporte sin auto-revisión rellena, no se acepta.
8. El **orquestador revisa** (diff + reporte + CA) y marca ✅ o devuelve con
   comentarios en el propio reporte (§revisión del orquestador).

## Cómo reportar (resumen; detalle en la plantilla)

- Un archivo por WP: `REPORTES/WP-U03-player-mcp-kit.md`.
- Contiene: qué se hizo, archivos tocados, **evidencia literal** (salida de
  tests/e2e, no «pasan los tests»), demoliciones ejecutadas, auto-revisión
  rellenada, hallazgos fuera de alcance y dudas.
- La evidencia sigue la regla de CASOS.md: **no inventes observaciones**. Si
  no lo ejecutaste, se escribe `⏳ sin verificar`, no «debería funcionar».
