# Brief — WP-U55 · Demoler deps `file:` operator-ui/threejs-ui-lib

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U55 · Demoler deps `file:` operator-ui/threejs-ui-lib
Rama: wp/u55-demoler-file-deps
Worktree: .worktrees/wp-u55-demoler-file-deps
Reporte: plan/REPORTES/WP-U55-demoler-file-deps.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U55-demoler-file-deps.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md.

Evidencia ops (GO usuario):
- npm view @zeus/protocol → 0.2.0 en
  https://npm.scriptorium.escrivivir.co
- engine/* publicados; mesh/* en general NO (private).

WP completo:
- Sustituir deps `file:` en
  packages/mesh/operator-ui/package.json y
  packages/mesh/operator-ui/projects/threejs-ui-lib/package.json
  por versiones del registry D-7.
- Hoy: operator-bridge, room-client-browser, ui-3d-kit vía file:.
- room-client-browser + ui-3d-kit YA en registry.
- operator-bridge es mesh private: hacerlo publicable (quitar private,
  publishConfig, files, README mínimo si hace falta) + npm publish
  al registry propio — solo lo necesario para CA. No abrir publish
  mesh completo.
- operator-ui .npmrc debe resolver @zeus al registry propio.
- Regenerar package-lock de operator-ui sin file:.
- CA: grep file: en esos package.json → 0; npm install aislado en
  operator-ui verde; tests del paquete / build que exija el CA.
- Demolición: deps file: residuales.

Alcance:
- packages/mesh/operator-ui/**
- packages/mesh/operator-bridge/** (solo para hacerlo publicable + publish)
- NO U123 (library). NO otros mesh. NO micros.

Lecturas extra:
- plan/BACKLOG-HISTORICO.md WP-U55 CA
- plan/REPORTES/WP-U50-scope-publish.md (residual file:)
- plan/REPORTES/WP-U105-publish-prep.md
- plan/DECISIONES.md D-7, D-24

Notas orquestador:
- Lote paralelo con U123 (library); no chocan paths.
- Tras CA: push rama; orquestador revisa+merge (GO usuario ciclo completo).
- NO editar BACKLOG.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
