# WP-U129 · estado-repo-links — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-19 |
| rama | `wp/u129-estado-repo-links` |
| commit(s) | `42ddb93` |
| estado propuesto | listo para revisión |

## Qué se hizo

En `docs/guide/estado.md` se corrigieron los dos links del portal que apuntaban
a `github.com/alephscriptorium-eng/zeus-sdk/...` →
`github.com/alephscriptorium-eng/Z_SDK/...` (remote canónico del monorepo).
`npm run docs:build` OK. No se tocaron hero/index (U124) ni se inventó
`publicar-la-web` (U131). Artefactos regenerados por `docs:build` (specs
openapi/asyncapi) **no** se commitearon — fuera de alcance.

## Archivos tocados

- `docs/guide/estado.md` — modificado: 2 URLs repo

## Evidencia

Diff:

```
-.../alephscriptorium-eng/zeus-sdk/blob/main/plan/BACKLOG.md
-.../alephscriptorium-eng/zeus-sdk/blob/main/plan/DECISIONES.md
+.../alephscriptorium-eng/Z_SDK/blob/main/plan/BACKLOG.md
+.../alephscriptorium-eng/Z_SDK/blob/main/plan/DECISIONES.md
```

Remote verifica nombre:

```
origin  https://github.com/alephscriptorium-eng/Z_SDK.git
```

`docs:build`:

```
vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 29.95s.
exit_code: 0
```

Push: `origin/wp/u129-estado-repo-links` @ `42ddb93`.

## Demolición

URLs incorrectas `zeus-sdk` en ese fichero: demolidas (queda mención textual
`Z_SDK-games-library` en tabla histórica, correcta).

## Auto-revisión (PRACTICAS.md §3)

- [x] Solo `estado.md` en el commit
- [x] Sin refs WP/D-## nuevas en prosa
- [x] docs:build verificado
- [x] Specs regenerados por el build dejados sin stage (no ensuciar el WP)

## Hallazgos fuera de alcance

- `docs:build` ensucia specs openapi/asyncapi en el worktree; política de
  commit de esos artefactos = decisión/orquestador si hace falta WP aparte.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
