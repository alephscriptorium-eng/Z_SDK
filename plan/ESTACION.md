# ESTACIÓN · calibración del mundo z-sdk (zeus-sdk)

**La estación se activa desde aquí.** Instancia del consumidor. El método
vive en el paquete `@alephscript/skills-scriptorium` (skills `vigilancia` +
`estacion-viva`). **Esta calibración NO va en el skill** — solo aquí en
`plan/`.

## Params

| param | valor |
| ----- | ----- |
| `MUNDO_RAIZ` / `WORLD_ROOT` | `C:\S_LAB\z-sdk` (checkout principal) |
| `WORKTREE_BASE` | `C:\S_LAB\.worktrees\z` |
| `OUT_DIR` | `C:\S_LAB\vigilancia\z` |
| `INTERVAL` | `45` (default del watcher) |

## OUT_DIR

- Ruta canónica: **`C:\S_LAB\vigilancia\z`**
- Contiene: `watch.log`, `anomalias.log`, `watcher.pid` (sesión)
- Fuera del repo público. Crear con `mkdir` al primer arranque del watcher.

## Espejo de skills

| dato | valor |
| ---- | ----- |
| paquete | `@alephscript/skills-scriptorium@0.8.0` |
| registry | `https://npm.scriptorium.escrivivir.co` |
| comando | `npm run skills:sync` → `alephscript-skills-sync --runtime claude` |
| destino | `.claude/skills/` (gitignore — regenerable, no forzar commit) |

Tras `npm install`, regenerar el espejo con `npm run skills:sync`. El
README bajo `.claude/skills/` documenta procedencia `@0.8.0` y
generador `alephscript-skills-sync`.

## Watcher

```text
# One-shot (evidencia / pulso)
WORLD_ROOT=<worktree-o-mundo> OUT_DIR=C:/S_LAB/vigilancia/z ONCE=1 \
  bash .claude/skills/estacion-viva/scripts/watcher-sesion.sh

# Sesión (muere con el padre; PID en OUT_DIR/watcher.pid)
WORLD_ROOT=<worktree-o-mundo> OUT_DIR=C:/S_LAB/vigilancia/z INTERVAL=45 \
  bash .claude/skills/estacion-viva/scripts/watcher-sesion.sh
```

Equivalente npm (checkout principal):

```text
npm run vigilancia
npm run vigilancia:watch
npm run vigilancia:check
```

## Relación con VISION / PRACTICAS

Estación = layout operativo del carril z (calibración auditable en plan).
No reescribe `plan/PRACTICAS.md` ni `plan/VISION.md` — PORT local únicamente.
