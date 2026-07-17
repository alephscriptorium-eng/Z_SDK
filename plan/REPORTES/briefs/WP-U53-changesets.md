# Brief — WP-U53 · Semver + release desde CI

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U53 · Semver + release desde CI
Rama: wp/u53-changesets
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u53-changesets
Reporte: plan/REPORTES/WP-U53-changesets.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U53-changesets.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- NO configurar credenciales de registry / tokens de publish en el repo.
- CI/workflows: editar/añadir YAML locales; verificar con act / dry-run /
  simulación documentada — NO disparar publish real en Actions remoto.
- Si el CA pide «release end-to-end con publish + tag + GitHub Release»:
  sin credenciales de swarm → marcar ⏳ honesto en el reporte Y demostrar
  el camino con dry-run local (changeset → bump → changelog →
  `npm pack` / release:dry) + workflow que SOLO publicaría si secrets
  existen y pipeline verde. NO inventar publish.

WP completo (de plan/BACKLOG.md) — Ola 5 lote-5b; dep U50 ✅, U03 ✅;
ARQUITECTURA §5 paso 3; D-12 (changesets, no semantic-release):
- Adoptar **changesets** en el monorepo:
  · bump semver **por paquete** (cierra lockstep 0.x de U50)
  · changelog generado
  · `npm publish` al registry propio desde CI (condición dura: pipeline
    verde = lint + gates + tests)
  · tag git + GitHub Release en Z_SDK
- PRACTICAS §6: documentar / cablear que changeset es obligatorio en
  paquetes publicables (además del commit convencional).
- CA:
  · un cambio de prueba con changeset produce release automático
    end-to-end (bump + changelog + publish + tag)
    → en swarm: dry-run local + workflow cableado; publish real = ⏳
  · un pipeline rojo lo bloquea (evidencia: job de release depende de
    quality/test verdes, o test sintético documentado)
- Demolición (obligatoria — cero vías muertas):
  · versionado lockstep manual de U50 (scripts/docs que digan «todos
    los engine a la misma versión» como política permanente)
  · cualquier script de publish provisional de WP-U50 que el pipeline
    de changesets sustituya (no dejar dos caminos de release)

Alcance orientativo:
- Añadir `@changesets/cli` (+ config `.changeset/config.json` alineada
  a registry propio / scope `@zeus`).
- Workflow de release (p.ej. `.github/workflows/release.yml`) que:
  · solo corre con pipeline verde
  · usa changesets/action o equivalente
  · publica a `npm.scriptorium.escrivivir.co` cuando hay secret
  · crea tag + GitHub Release
- Actualizar `release:dry` / docs si el camino de verificación cambia.
- NO publicar juegos (siguen private; ola 6 / games-library).

Regla de los dos juegos (PRACTICAS §1.11):
- No introducir nombres de juego en paquetes engine; `gates` verde.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §5 (camino a semver + CI/CD, paso 3)
- plan/DECISIONES.md D-7 (registry), D-12 (changesets + CI)
- .github/workflows/ci.yml (U03 — base a extender, sin publish hoy)
- scripts/release-dry.mjs + root package.json (release:dry U50)
- packages/engine/*/package.json (publishConfig, versiones lockstep)
- plan/PRACTICAS.md §6 (changeset obligatorio post-U53)

Notas del orquestador:
- Lote-5b paralelo con U54. U52 es la última — NO tocar U52.
- Conflicto blando con U54: ambos tocan tarballs / `release:dry` /
  tipos en packs. Coordinar: U53 es dueño de changesets + CI release;
  U54 es dueño de `.d.ts` + smoke externo + docs handshake. Si ambos
  tocan el mismo script de verificación de tarball, merge preferido
  U53 primero o particionar (U53 versionado; U54 chequeo de tipos).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir.
- Pregunta obligatoria (CA): ¿changesets cableado? ¿workflow de release
  bloquea si CI rojo? ¿dry-run bump+changelog+pack verde? ¿publish
  real = ⏳ o evidencia con secret (NO forzar)? ¿lockstep manual
  demolido?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
