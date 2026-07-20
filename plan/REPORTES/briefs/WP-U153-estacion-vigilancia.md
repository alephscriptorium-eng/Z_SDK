# Brief — WP-U153 · Materializar estación de vigilancia

Orquestador · 2026-07-20 · GO Sprint 5 (D-37).

```text
(rol) plan/roles/WORKER.md

WP: WP-U153 · Materializar estación de vigilancia
Rama: wp/u153-estacion-vigilancia
Worktree: .worktrees/wp-u153-estacion-vigilancia (indep.)
Reporte: plan/REPORTES/WP-U153-estacion-vigilancia.md

Lecturas extra:
- node_modules/.../vigilancia/SKILL.md + reference/ESTACION.md (checks 0.3.1)
- node_modules/.../vigilancia/scripts/watcher.sh (invocar, NO copiar método)
- plan/PRACTICAS.md · HANDOFF (ceguera: sin datos de instancia en git)

Tarea:
1. Script/config de arranque local que parametriza:
   WORLD_ROOT=<raíz zeus> OUT_DIR=<fuera de git / gitignorado> INTERVAL=default
   invocando watcher.sh desde node_modules (path relativo al paquete).
2. Añadir OUT_DIR a .gitignore.
3. Ejecutar checks 0.3.1 de ESTACION.md (residuo IDE = regla 15; cruce
   CHANGELOG↔backlog — si CHANGELOG aún no existe en esta rama, documentar
   N/A / pendiente U151 merge; no inventar datos).
4. CERO datos de instancia (rutas absolutas de usuario, IDs de chat) en git.

CA:
1. Watcher arranca y produce pulso en OUT_DIR (muestra literal)
2. OUT_DIR gitignorado (git check-ignore / status limpio de OUT_DIR)
3. Dos checks 0.3.1 ejecutados (salida literal)

ALCANCE_DIFF: script/config estación + .gitignore + reporte.
Eje: vigilancia (read-only).

Notas:
- Independiente. Calibración local (colas, gh) en plan/ o README del
  script — no en el skill.
- Preferir OUT_DIR bajo .vigilancia/ o hermano del repo gitignorado.

Empieza: sitúate en rama/worktree, lee PRACTICAS + ESTACION.md, implementa.
```
