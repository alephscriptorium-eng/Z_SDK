# Brief — WP-U21 · app-shell aprende de arg-console

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U21 · app-shell aprende de arg-console
Rama: wp/u21-app-shell
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u21-app-shell
Reporte: plan/REPORTES/WP-U21-app-shell.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U21-app-shell.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Las razones por las que arg-console evitó `createAppConfig` (whitelist
  rígida) se arreglan EN app-shell; arg-console y las vistas del view-kit
  usan app-shell.
- CA:
  · arg-console sin config propia divergente
  · los demás consumidores de app-shell intactos (sus tests verdes)
- Demolición:
  · `arg-console/src/config.mjs` divergente
  · el comentario «a propósito NO usa createAppConfig»

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md § app-shell / layout provisional packages/lib
- packages/lib/app-shell (createAppConfig y whitelist actual)
- packages/arg/arg-console/src/config.mjs (config divergente a absorber)
- packages/arg/arg-console (consumo post-U20 de @zeus/view-kit)
- Cola hallazgos WP-U20: colisión de nombre arg-console `src/view-kit/`
  (SSR defineView) ≠ `@zeus/view-kit` (browser) — alinear/renombrar SSR
  si hace falta para este WP; no expandir a U22
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Lote 2b paralelo con U22 y U24. Merge preferido: U24 puede ir primero
  (no toca vistas); U21 antes que U22 si hay conflicto en app-shell /
  import-maps compartidos.
- NO implementar U22, U23 ni U24 en este chat.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo puede usar app-shell +
  createAppConfig tal cual tras este WP?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
