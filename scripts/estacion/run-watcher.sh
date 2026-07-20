#!/usr/bin/env bash
# Estación de vigilancia — arranque local (instancia zeus).
# Invoca el watcher del paquete; NO copia el método.
#
# Uso:
#   npm run vigilancia          # un pulso (timeout + kill)
#   npm run vigilancia:watch    # bucle continuo
#
# Calibración (mundo): WORLD_ROOT = raíz del repo; OUT_DIR = .vigilancia/
# (gitignorado). Canal CI: `gh run list` (ver plan/PRACTICAS §7 / remate).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# worktree sin npm install: resolver node_modules del checkout principal
resolve_watcher() {
  local cand
  for cand in \
    "$ROOT/node_modules/@alephscript/skills-scriptorium/skills/vigilancia/scripts/watcher.sh" \
    "$(dirname "$(cd "$ROOT" && git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")/node_modules/@alephscript/skills-scriptorium/skills/vigilancia/scripts/watcher.sh"
  do
    if [ -f "$cand" ]; then
      echo "$cand"
      return 0
    fi
  done
  return 1
}
WATCHER="$(resolve_watcher || true)"
OUT_DIR="${OUT_DIR:-$ROOT/.vigilancia}"
INTERVAL="${INTERVAL:-45}"
WORLD_ROOT="${WORLD_ROOT:-$ROOT}"

if [ -z "${WATCHER:-}" ] || [ ! -f "$WATCHER" ]; then
  echo "watcher no encontrado bajo node_modules/@alephscript/skills-scriptorium" >&2
  echo "¿instalaste el paquete? (npm ci en la raíz del monorepo)" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"
export WORLD_ROOT OUT_DIR INTERVAL

# Un solo pulso si ESTACION_ONCE=1 (evidencia CA / CI local)
if [ "${ESTACION_ONCE:-0}" = "1" ]; then
  # El watcher es un bucle; acotar con timeout.
  # En mundos grandes el primer ciclo puede tardar (find mtime worktrees).
  ONCE_TIMEOUT="${ESTACION_TIMEOUT:-120}"
  set +e
  if command -v timeout >/dev/null 2>&1; then
    timeout "$ONCE_TIMEOUT" bash "$WATCHER" "$WORLD_ROOT" "$OUT_DIR" 2
  else
    bash "$WATCHER" "$WORLD_ROOT" "$OUT_DIR" 2 &
    pid=$!
    sleep "$ONCE_TIMEOUT"
    kill "$pid" 2>/dev/null
    kill -9 "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null
  fi
  set -e
  if [ -f "$OUT_DIR/watch.log" ] && grep -q 'wt_reg=' "$OUT_DIR/watch.log"; then
    echo "pulso escrito en $OUT_DIR/watch.log"
    grep 'wt_reg=' "$OUT_DIR/watch.log" | tail -n 3 || true
    exit 0
  fi
  echo "sin pulso wt_reg= en $OUT_DIR/watch.log tras timeout=${ONCE_TIMEOUT}s" >&2
  ls -la "$OUT_DIR" >&2 || true
  exit 1
fi

exec bash "$WATCHER" "$WORLD_ROOT" "$OUT_DIR" "$INTERVAL"
