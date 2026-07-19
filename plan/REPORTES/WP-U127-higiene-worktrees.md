# WP-U127 · higiene-worktrees — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-19 |
| rama zeus | `wp/u127-higiene-worktrees` |
| rama library | `wp/u127-higiene-worktrees` (sin commits de código) |
| commit(s) | _(solo este reporte en zeus)_ |
| estado propuesto | listo-revisión |

## Qué se hizo

Operación local en `Z_SDK-games-library` (sin merge, sin tocar worktrees Sprint 2
activos):

1. `git worktree remove --force .worktrees/u107-review` — desregistró el worktree
   detached; el dir residual se borró con `rm -rf` ✅
2. Dir huérfano `.worktrees/wp-u121-prosa-library-docs` borrado ✅
3. Dir huérfano `.worktrees/wp-u123-retiro-file-deps` — primero borrado parcial
   (cáscara `packages/delta/arg-console/` con **Device or resource busy**).
   Diagnóstico posterior: 6 procesos npm/node huérfanos con cwd en esa cáscara
   (árbol `npm run test:delta` → `@zeus/arg-console`, creados 2026-07-18 23:39,
   padre ya muerto). No son IDE/Cursor. Tras `Stop-Process` de PIDs
   20184, 24324, 39212, 30492, 38372, 40376 → `rm -rf` OK ✅

Worktrees Sprint 2 legítimos no tocados por este WP.

## Archivos tocados

Ninguno en el repo library (solo FS local `.worktrees/`). Este reporte en zeus.

## Evidencia

### Diagnóstico del lock (desbloqueo)

```
PID 40376 node  npm run test:delta          cwd=.../wp-u123-retiro-file-deps/
PID 38372 cmd   npm test -w @zeus/arg-...   cwd=.../wp-u123-retiro-file-deps/
PID 30492 node  npm test -w @zeus/arg-console
PID 39212 cmd   node --test test/*.test.mjs cwd=.../arg-console/
PID 24324 node  node --test ...
PID 20184 node  test\server.test.mjs        cwd=.../arg-console/
# Restart Manager RmGetList rc=5 (ACCESS_DENIED) sin admin — cwd scan vía PEB sí reveló el lock
```

### Después — `git worktree list` (library)

```
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library                                           [main]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u126-release-startpack-yml  [wp/u126-release-startpack-yml]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u127-higiene-worktrees      [wp/u127-higiene-worktrees]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u128-zeus-deps-semver       [wp/u128-zeus-deps-semver]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u131-publicar-la-web        [wp/u131-publicar-la-web]
```

### Después — dirs en `.worktrees/`

```
wp-u126-release-startpack-yml/
wp-u127-higiene-worktrees/
wp-u128-zeus-deps-semver/
wp-u131-publicar-la-web/
```

u107 / u121 / u123: **GONE** (ni en `git worktree list` ni en `.worktrees/`).

CA «los tres fuera de `.worktrees/`»: **cumplido**.

## Demolición

- `u107-review` worktree + dir: demolido
- `wp-u121-*` dir: demolido
- `wp-u123-*` dir: demolido (tras liberar handles de tests huérfanos)

## Auto-revisión (PRACTICAS.md §3)

- [x] Alcance solo los tres nombrados (no se tocaron wp-u126/128/131 ni otros Sprint 2)
- [x] Diff de código library: vacío (operación git/FS)
- [x] CA documentado con evidencia literal
- [x] Kill limitado a npm/node huérfanos con cwd en la cáscara u123 (no IDE)

## Hallazgos fuera de alcance

- En Windows, `npm test`/`test:delta` colgados con cwd en un worktree demolido
  dejan dirs «busy» tras `rm -rf` parcial. Antes de higiene: matar/esperar tests
  o comprobar cwd (`PEB` / handle) si `RmGetList` da ACCESS_DENIED.

## Dudas / bloqueos

Ninguno. Residual u123 liberado; WP desbloqueado.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
