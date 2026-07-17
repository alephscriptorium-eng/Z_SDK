# Brief — WP-U20 · `@zeus/view-kit`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U20 · @zeus/view-kit
Rama: wp/u20-view-kit
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u20-view-kit
Reporte: plan/REPORTES/WP-U20-view-kit.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U20-view-kit.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Extraer el kit de navegador de `arg-console/assets/js/kit/` (~4.600 LOC:
  escena, ventanitas/panel, HUD, inspector raycast, stick-puppet, droplets,
  deep-links honestos) a paquete engine browser-safe servido por import-map.
  arg-console pasa a consumirlo.
- CA:
  · `test:arg-console` verde
  · `e2e:arg` verde
  · `demo:arg` se ve igual (verificación humana u captura, anotada
    honestamente en el reporte)
- Demolición:
  · el kit dentro de arg-console (quedan solo las vistas tablero/jugador
    específicas de delta)

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md § layout engine/view-kit + §4 deps (browser-safe)
- plan/DECISIONES.md D-2 y D-8 (dos juegos; engine sin nombres de juego)
- packages/arg/arg-console/assets/js/kit/ (fuente a extraer)
- packages/arg/arg-console (import-map / consumo del kit)
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Ola 2 inicio: solo U20. U21/U22 dep U20; U23 dep U20+kits — NO implementar
  U21, U22 ni U23 en este chat.
- Ubicación provisional: `packages/lib/view-kit` (layout engine/ llega en
  WP-U51). Package name `@zeus/view-kit`.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Verificación visual `demo:arg` (CA): si el entorno es headless / sin
  display, documentar ⏳ honesto en el reporte. El CA permite captura o
  anotación humana — no inventar «se ve igual» sin evidencia.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo puede consumir
  @zeus/view-kit tal cual?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
