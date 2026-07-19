# WP-U127 · higiene-worktrees — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-19 |
| rama zeus | `wp/u127-higiene-worktrees` |
| rama library | `wp/u127-higiene-worktrees` (sin commits de código) |
| commit(s) | _(solo este reporte en zeus)_ |
| estado propuesto | bloqueado |

## Qué se hizo

Operación local en `Z_SDK-games-library` (sin merge, sin tocar worktrees Sprint 2
activos):

1. `git worktree remove --force .worktrees/u107-review` — desregistró el worktree
   detached; el dir residual se borró después con `rm -rf` ✅
2. Dir huérfano `.worktrees/wp-u121-prosa-library-docs` borrado ✅
3. Dir huérfano `.worktrees/wp-u123-retiro-file-deps` — borrado parcial; queda
   cáscara vacía `packages/delta/arg-console/` con **Device or resource busy**
   (lock Windows; Restart Manager ACCESS_DENIED sin admin). No está en
   `git worktree list` (nunca estuvo registrado al inicio del WP como worktree
   activo — solo dir residual).

Worktrees Sprint 2 (`wp-u125`, `wp-u126`, `wp-u128`, `wp-u131`, `wp-u127`) no
tocados.

## Archivos tocados

Ninguno en el repo (solo FS local `.worktrees/`). Este reporte en zeus.

## Evidencia

Antes (extracto):

```
.../.worktrees/u107-review                    dfd6f06 (detached HEAD)
.../.worktrees/wp-u125-copy-web-b             ...
... dirs: u107-review/, wp-u121-prosa-library-docs/, wp-u123-retiro-file-deps/, wp-u125-..., ...
```

Después — `git worktree list`:

```
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library                                           [main]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u125-copy-web-b             [wp/u125-copy-web-b]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u126-release-startpack-yml  [wp/u126-release-startpack-yml]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u127-higiene-worktrees      [wp/u127-higiene-worktrees]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u128-zeus-deps-semver       [wp/u128-zeus-deps-semver]
C:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u131-publicar-la-web        [wp/u131-publicar-la-web]
```

u107 / u121: GONE. Residual u123:

```
rm: cannot remove '.../wp-u123-retiro-file-deps/packages/delta/arg-console': Device or resource busy
# dir vacío (0 archivos) que no se puede rmdir
```

CA «los tres fuera de `.worktrees/`»: **no cumplido** por residual u123.

## Demolición

- `u107-review` worktree + dir: demolido
- `wp-u121-*` dir: demolido
- `wp-u123-*` dir: demolición incompleta (lock OS)

## Auto-revisión (PRACTICAS.md §3)

- [x] Alcance solo los tres nombrados (no se tocaron wp-u125/126/128/131)
- [x] Diff de código: vacío (operación git/FS)
- [x] CA documentado con evidencia literal; residual honesto

## Hallazgos fuera de alcance

- En Windows, dirs de worktree con `node_modules` o cwd de procesos externos
  pueden quedar «busy» tras `git worktree remove` parcial — conviene
  `worktree remove` cuando no hay tests npm en vuelo.

## Dudas / bloqueos

**Bloqueo:** cáscara vacía `.worktrees/wp-u123-retiro-file-deps/` no borrable
mientras haya handle Windows. Acción sugerida al usuario/orquestador: cerrar
handles (IDE/antivirus/tests) y `rm -rf .worktrees/wp-u123-retiro-file-deps`,
o reiniciar sesión y borrar. Tras eso el CA queda verde sin más commits.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
