# Brief — WP-U95 · Un solo helper para `./node`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U95 · Un solo helper para `./node`
Rama: wp/u95-paths-node
Worktree: .worktrees/wp-u95-paths-node
Reporte: plan/REPORTES/WP-U95-paths-node.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U95-paths-node.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — cola higiene; lote-higiene-11a;
paralelo con U97 (otro worktree; superficies distintas):
- El one-liner `path.dirname(fileURLToPath(import.meta.url))` está en
  5 paquetes con dos nombres de fichero (`node.mjs` / `paths.node.mjs`).
- Extraer `nodeSrcDir(import.meta.url)` a util compartido; unificar
  nombre.
- CA (literal BACKLOG):
  · una sola implementación en `packages/` (fuera de node_modules)
  · los 5 `exports["./node"]` homogéneos
  · servidores Express que lo consumen verdes
- Demolición: las 4 copias.

Alcance orientativo:
- Localizar las 5 copias actuales:
  · `packages/engine/protocol/src/node.mjs`
  · `packages/engine/game-engine/src/paths.node.mjs`
  · `packages/engine/view-kit/src/paths.node.mjs`
  · `packages/engine/ui-3d-kit/src/paths.node.mjs`
  · `packages/games/delta/arg-domain/src/node.mjs`
- Extraer helper compartido (p.ej. en util de engine / protocol /
  test-utils — elige el ancla mínima; no inventar paquete si ya hay
  hogar natural); unificar nombre de fichero/export.
- Homogeneizar `exports["./node"]` en los 5 `package.json`.
- NO tocar WP-U93 / peer-card / webrtc-signaling / autoridad-join.
- NO implementar U97 (feed-kit / volumes-ops) — otro WP del lote.
- NO tocar U94/U96/U98/U99 ni Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Helper de paths = util genérico; cero conceptos exclusivos de
  delta/pozo en el módulo compartido. Gate. `arg-domain` solo consume.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- Los 5 `node.mjs` / `paths.node.mjs` listados arriba + sus package.json
- Servidores Express que importan `./node` (rg `from '.*\/node'` /
  `exports["./node"]`)

Notas del orquestador:
- Lote-higiene-11a paralelo: U95 = paths `./node`; U97 = feed-kit →
  volumes-ops. Partición clara — no solapar.
- Independiente de peer-card / U93; sin credenciales.
- Pregunta obligatoria (CA): ¿una sola impl en packages/? ¿5 exports
  homogéneos? ¿Express consumidores verdes? ¿4 copias demolidas?
  Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
