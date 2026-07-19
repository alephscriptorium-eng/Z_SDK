# Brief — WP-U144 · Consulta `npm ci` en docs.yml del catálogo

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-34** · GO **usuario** U143 ∥ U144. Fuente:
[REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md](../entregas/ENTREGA-2026-07-19-sprint3.md)
(§Nota ítem 2). Repo de código: **Z_SDK-games-library**
(`.github/workflows/docs.yml`). Reporte en **zeus-sdk**.

Consulta, **no** imposición de `npm ci`. Ambos desenlaces cumplen CA.

Ceguera: citar solo la entrega interna arriba — **no** rutas absolutas
de máquina ni nombres de estación externa.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U144 · Alinear o documentar npm install vs npm ci (catálogo docs.yml)
Rama zeus: wp/u144-npm-ci-consulta
Worktree zeus: .worktrees/wp-u144-npm-ci-consulta
Rama library: wp/u144-npm-ci-consulta
Worktree library: (library)/.worktrees/wp-u144-npm-ci-consulta
Reporte: plan/REPORTES/WP-U144-npm-ci-consulta.md (en zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero (zeus).
Reporte desde plan/REPORTES/PLANTILLA.md (zeus).
Commits convencionales según toque (library yml ± reporte zeus).
NO merge a main. NO ✅ BACKLOG.
NO mezclar con U143 (zonas distintas; ver notas).

Fuente (ruta INTERNA):
plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md (§Nota ítem 2)

Paths:
- Library: Z_SDK-games-library → .github/workflows/docs.yml
- Zeus (reporte): plan/REPORTES/…
- Referencia (solo lectura): zeus .github/workflows/docs.yml usa `npm ci`

Problema:
- docs.yml del catálogo: `npm install` (step «Install (@zeus desde registry)»).
- Portal zeus usa `npm ci`.
- Consulta: `npm ci` también resuelve del registry vía lockfile + `.npmrc`.

Decisión orquestador (worker ejecuta; ambos CA válidos):
1. PREFERIDO: cambiar el step a `npm ci` y verificar build verde
   (`npm run docs:build` local y/o Actions en la rama).
   Hay package-lock.json + .npmrc con scopes @zeus / @alephscript.
2. Si (1) falla o hay motivo real (documentar evidencia): dejar
   `npm install` y añadir comentario en el propio yml explicando por qué
   no `npm ci` (no handwaving — citar el fallo o la restricción).

Fix: SOLO library `.github/workflows/docs.yml` (+ reporte zeus).
NO tocar docs/public/ (eso es U143). NO tocar DNS/Settings.
NO tocar docs.yml de zeus salvo cita de referencia en reporte.

CA verificables (UNA de las dos):
A. Step usa `npm ci` + evidencia de build Docs verde (local y/o
   `gh run list --branch wp/u144-npm-ci-consulta` success), O
B. Comentario en el yml explica por qué no `npm ci`, con evidencia
   del motivo en el reporte.
Diff acotado al yml (+ reporte). Sin CNAME, sin packages de producto.

Demolición: n/a (o comentario obsoleto «deps desde registry» si ya no
aplica tras pasar a npm ci — alinear prosa del step).

Paralelismo (U143 en vuelo):
- U144 toca .github/workflows/docs.yml (library) + reporte zeus.
- U143 toca docs/public/CNAME (ambos repos).
- Sin solape. No rebasear sobre la otra rama.

Evidencia CI: tras push library,
  gh run list --branch wp/u144-npm-ci-consulta
→ Docs run_id/conclusion. Zeus reporte suele ser N/A (paths-ignore U104).
Protocolo Actions U135.

Empieza: worktrees, PRACTICAS, decide A o B con evidencia, implementa,
verifica CA, reporta, push ramas. NO merge. NO tocar U143.
```
