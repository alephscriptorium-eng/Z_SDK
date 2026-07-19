# Brief — WP-U123 · Library retiro `file:` / `.deps` → registry

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U123 · Retiro puente file:/.deps en Z_SDK-games-library
Rama: wp/u123-retiro-file-deps (zeus + library)
Worktree zeus: .worktrees/wp-u123-retiro-file-deps
Worktree library: (library)/.worktrees/wp-u123-retiro-file-deps
Reporte: plan/REPORTES/WP-U123-retiro-file-deps.md (en zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md.
Commits convencionales. NO mezclar backlog delta.

Evidencia ops: @zeus/protocol 0.2.0 en registry propio; engine/* publicados.

WP completo (plan U61 «post-publish → quitar file:»):
- En Z_SDK-games-library: quitar deps file:.deps/zeus-sdk/... del
  package.json raíz; juegos resuelven @zeus/* desde registry.
- Quitar preinstall que fuerza ensure-zeus-sdk si el default es registry.
- Criterio .deps (elige y documenta): FALLBACK DEV documentado —
  conservar setup:zeus-sdk + resolveZeusSdkRoot para demos/e2e que
  spawnean mesh no publicado (socket-server, webrtc-viewer estático,
  etc.); NO como camino de npm install.
- Mesh no publicado: no dejar file: en package.json. Si arg-console
  declara @zeus/webrtc-viewer y no está en registry: retirar dep npm
  y servir solo vía monorepoRoot (ya lo hace server.mjs).
- Actualizar README + docs (modo provisional → registry + fallback).
- CA: install limpio sin file: en package.json (raíz+workspaces);
  npm test verde; documentar fallback.
- Demolición: file:.deps en package.json; preinstall puente obligatorio.

Alcance library:
- package.json / package-lock.json
- scripts/ensure-zeus-sdk.mjs, zeus-sdk-root.* (ajustar prosa; no romper
  resolve para demos)
- README.md, docs/ (delta modo provisional, index)
- packages/**/package.json solo si hace falta (webrtc-viewer, pins)
- NO tocar micros zeus. NO U55.

Lecturas extra:
- plan/REPORTES/WP-U61-migrate-games.md (§file: temporal / retiro)
- plan/DECISIONES.md D-7, D-10, D-24
- Library README «Consumo de @zeus/*»

Notas orquestador:
- Paralelo con U55; no chocan.
- Push ambas ramas; ciclo revisión+merge autorizado (GO usuario).
- NO editar BACKLOG.

Empieza: sitúate en worktrees, lee PRACTICAS, implementa library + reporte zeus.
```
