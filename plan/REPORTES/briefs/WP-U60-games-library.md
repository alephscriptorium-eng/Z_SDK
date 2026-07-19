# Brief — WP-U60 · Repo Z_SDK-games-library

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U60 · Repo Z_SDK-games-library
Rama: wp/u60-games-library
Worktree: .worktrees/wp-u60-games-library
Reporte: plan/REPORTES/WP-U60-games-library.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U60-games-library.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO npm publish real.
- NO push de credenciales / tokens / .env con secretos al repo nuevo.
- SÍ permitido: `gh repo create` de `alephscriptorium-eng/Z_SDK-games-library`
  si `gh` auth OK (cuenta con write en la org). Eso lo hace el worker.
- Scaffold + push inicial al repo NUEVO (games-library) OK si auth lo permite;
  documentar evidencia. Si auth falla → ⏳ honesto, dejar scaffold local
  listo y checklist ops.
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.

WP completo (de plan/BACKLOG.md) — D-22 frente (3); Ola 6 GO; D-11:
- Crear repo `github.com/alephscriptorium-eng/Z_SDK-games-library`.
- `plan/`-lite: PRACTICAS y plantilla de reporte **enlazadas** desde
  Z_SDK (no copiar cuerpos enteros).
- `.npmrc` con scopes (`@zeus` → registry propio, alineado D-7).
- CI mínima: install + tests (scaffold smoke si aún no hay juegos).
- Scaffold vacío o mínimo — migración de juegos = U61 (NO mover
  `packages/games/` en este WP).
- CA:
  · repo existe;
  · clone limpio + `npm install` + tests verdes (o scaffold con test smoke).
- Demolición: n/a.

Alcance orientativo:
- Trabajo principal: repo nuevo + scaffold + CI + plan-lite.
- En el monorepo Z_SDK: solo el reporte + (si hace falta) puntero/doc
  mínimo en plan o README hacia la library — sin migrar juegos.
- NO U61 (mover delta/pozo). NO U62 (start packs).
- NO editar plan/BACKLOG.md.
- NO push de credenciales.

Regla de los dos juegos (PRACTICAS §1.11):
- Scaffold sin hardcodear un solo juego como «el» juego; nombres
  delta/pozo solo como ejemplos futuros si hace falta.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §6 (Z_SDK-games-library)
- plan/DECISIONES.md D-10, D-11, D-22 frente (3)
- plan/BACKLOG.md Ola 6 + remate 2026-07-18c
- .npmrc del monorepo (scopes de referencia)

Notas del orquestador:
- Lote D-22 post-U104: **U60 ∥ U105 ∥ U106** (paralelo; worktrees).
- Rama principal = `main`.
- Orden de merge sugerido si hay choque en plan/: U106 → U105 → U60
  (U60 toca poco el monorepo).
- Creds: org `alephscriptorium-eng`; si `gh auth` no tiene write,
  documentar ⏳ — no inventar repo remoto.
- NO editar plan/BACKLOG.md.
- NO push de monorepo ni de secretos.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
