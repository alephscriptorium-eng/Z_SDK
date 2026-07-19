# Brief — WP-U143 · CNAME `docs/public/` (ambos repos)

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-34** · GO **usuario** U143 ∥ U144. Fuente:
[REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md](../entregas/ENTREGA-2026-07-19-sprint3.md)
(§Nota ítem 1). Repos: **zeus-sdk** (portal) + **Z_SDK-games-library**
(catálogo). Barato, sin riesgo. **No** tocar DNS ni Pages Settings.

Ceguera: citar solo la entrega interna arriba — **no** rutas absolutas
de máquina ni nombres de estación externa.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U143 · Commitear docs/public/CNAME en portal + catálogo
Rama zeus: wp/u143-cname-docs-public
Worktree zeus: .worktrees/wp-u143-cname-docs-public
Rama library: wp/u143-cname-docs-public
Worktree library: (library)/.worktrees/wp-u143-cname-docs-public
Reporte: plan/REPORTES/WP-U143-cname-docs-public.md (en zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero (zeus).
Reporte desde plan/REPORTES/PLANTILLA.md (zeus).
Commits convencionales en ambos repos.
NO merge a main. NO ✅ BACKLOG.
NO mezclar con U144 (zonas distintas; ver notas).

Fuente (ruta INTERNA):
plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md (§Nota ítem 1)

Paths (sibling típico; localizar en máquina):
- Zeus: checkout zeus-sdk / Z_SDK
- Library: Z_SDK-games-library (sibling bajo el mismo padre de SCRIPTORIUM_V0)

Problema:
- Custom domain vive solo en Settings→Pages. Si se reconfigura Pages,
  el dominio se pierde en silencio.
- Portal: docs/public/ existe (p.ej. api/) pero sin CNAME trackeado.
- Catálogo: docs/public/ puede no existir — crearlo si falta.

Fix (mínimo; NO implementar DNS/Settings):
1. Zeus: crear docs/public/CNAME con UNA línea:
   z-sdk.escrivivir.co
2. Library: mkdir docs/public/ si falta; crear docs/public/CNAME con:
   games.z-sdk.escrivivir.co
3. Commitear en ambas ramas WP. Push ramas. NO merge.

CA verificables:
1. En zeus: `git ls-files docs/public/CNAME` → docs/public/CNAME
   y contenido exacto `z-sdk.escrivivir.co` (sin BOM / sin trailing junk).
2. En library: `git ls-files docs/public/CNAME` → docs/public/CNAME
   y contenido exacto `games.z-sdk.escrivivir.co`.
3. Diff acotado a esos CNAME (+ reporte zeus). Sin workflows, sin DNS.
4. Tras merge+deploy (post-revisión; no es gate de este chat): Settings
   refleja dominio — documentar ⏳ si aún no mergeado.

Demolición: n/a (añadir ficheros).

Paralelismo (U144 en vuelo):
- U143 toca docs/public/ (ambos repos).
- U144 toca .github/workflows/docs.yml (solo library) + reporte zeus.
- Sin solape de ficheros. No rebasear sobre la otra rama.

Evidencia CI: tras push,
  gh run list --branch wp/u143-cname-docs-public
→ run_id/conclusion (Docs si paths docs/**) o N/A. Protocolo U135.
Library: mismo comando en ese repo.

Empieza: worktrees en ambos repos, PRACTICAS, crea CNAME, verifica
ls-files + cat, reporta, push ramas. NO merge. NO tocar U144.
```
