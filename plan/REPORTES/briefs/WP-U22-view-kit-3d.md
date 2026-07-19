# Brief — WP-U22 · 3d-monitor y player-3d-ui sobre view-kit

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U22 · 3d-monitor y player-3d-ui sobre view-kit
Rama: wp/u22-view-kit-3d
Worktree: .worktrees/wp-u22-view-kit-3d
Reporte: plan/REPORTES/WP-U22-view-kit-3d.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U22-view-kit-3d.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Migrar vistas de 3d-monitor y player-3d-ui al view-kit; evaluar en el
  reporte si tras la migración merecen vivir como apps o pasar a `examples/`.
- CA:
  · e2e `e2e:player-3d` verde
  · vistas de 3d-monitor verdes (sus e2e/tests)
  · diff negativo neto
- Demolición:
  · el view-kit ancestro duplicado en 3d-monitor (`assets/js/kit/` propio —
    de donde nació el de arg-console; el círculo se cierra)

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md § view-kit / mesh visores
- packages/lib/view-kit (o ubicación post-U20 de `@zeus/view-kit`)
- packages/platform/3d-monitor (kit duplicado + vistas)
- packages/platform/player-3d-ui (o ruta actual del player-3d)
- Cola hallazgos WP-U20: `packages/platform/3d-monitor` aún tiene
  `assets/js/kit/` propio — este WP lo demuele
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Lote 2b paralelo con U21 y U24. No tocar arg-console config (U21) ni
  authority-kit envelope (U24). Si hace falta app-shell nuevo de U21,
  consumir lo que ya esté en master post-U20; no bloquearse esperando U21.
- Evaluar en §hallazgos/reporte: ¿apps o `examples/`? Decisión del
  orquestador/usuario tras el reporte — no mover a examples sin evidencia.
- NO implementar U21, U23 ni U24 en este chat. A-05 (dual-wire) fuera de
  alcance.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo puede montar una vista 3d
  mínima solo con `@zeus/view-kit`?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
