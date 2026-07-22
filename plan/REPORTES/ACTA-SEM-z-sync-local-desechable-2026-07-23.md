# ACTA · SEM-z · borrado `scripts/sync-claude-skills.mjs` · 2026-07-23

| dato | valor |
| ---- | ----- |
| Mandato | GO SEM-z · SKILLS-EN-MUNDOS · mundo z-sdk · 2026-07-23 |
| Carril | z · worktree `C:\S_LAB\.worktrees\z\wp-sem-z-skills-0.7.0` |
| Tip PRE (fetch) | `d0d9de1d3af0e75a9f5d7d7b4c2b4d3762beb90c` (= `origin/main`) |
| Paquete | `@alephscript/skills-scriptorium@0.7.0` |
| Issue | #16 (migración consumidores → bin del paquete) |

## Veredicto desechable

`scripts/sync-claude-skills.mjs` nació en WP-U147 como PORT del mecanismo
de espejo (o-sdk → z-sdk). Con el publish **0.7.0** ese mecanismo vive en
el paquete (`bin/alephscript-skills-sync.mjs` / `alephscript-skills-sync`).
El script local **nació para extinguirse** (issue #16): duplicar la lógica
en el consumidor = deriva asegurada.

| campo | valor |
| ----- | ----- |
| Path | `C:\S_LAB\.worktrees\z\wp-sem-z-skills-0.7.0\scripts\sync-claude-skills.mjs` |
| Origen | WP-U147 · PORT de `codebase/o-sdk/scripts/sync-claude-skills.mjs` |
| SHA256 PRE | `27CCC25BBFC107CD11A6682F1768F04918BEBAF2B5C07EFEFD67ADD49E926BEB` |
| Tamaño PRE | 3000 bytes · 82 líneas |
| Sustituto canónico | `alephscript-skills-sync --runtime claude` (bin `@0.7.0`) |
| Enganche | `package.json` → `"skills:sync": "alephscript-skills-sync --runtime claude"` |
| Veredicto | **BORRAR** (desechable · nació para extinguirse) |
| Ejecutado | **sí** (este GO · SEM-z) |
| POST | path ausente |

## No borrados (explícito)

| path | motivo |
| ---- | ------ |
| `node_modules/@alephscript/skills-scriptorium/bin/…` | bin canónico del paquete |
| `.claude/skills/**` | espejo regenerado por el bin (gitignore) |
| `codebase/o-sdk/scripts/sync-claude-skills.mjs` | mundo o-sdk EXCLUIDO; no tocar |

## Relación

- Issue #16 · release `v0.7.0` / `@alephscript/skills-scriptorium@0.7.0`
- Patrón OLA0: `plan/REPORTES/ACTA-OLA0-sync-local-desechable-2026-07-23.md` (scriptorium)
