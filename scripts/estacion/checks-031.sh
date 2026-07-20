#!/usr/bin/env bash
# Checks 0.3.1 de ESTACION.md (instancia zeus) — read-only.
# 1) Residuo de info en carpetas IDE (regla 15)
# 2) Cruce CHANGELOG de gobierno ↔ WP ✅ del backlog
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== check 1 · residuo IDE (regla 15) ==="
resid=0
for ide in .claude .cursor .windsurf .aider; do
  [ -d "$ide" ] || continue
  while IFS= read -r rf; do
    [ -z "$rf" ] && continue
    # Espejo skills:sync bajo .claude/skills/ = método versionado (no sesión).
    # Se lista aparte; no cuenta como residuo de sesión.
    case "$rf" in
      .claude/skills/*) echo "  (espejo skills, no sesión): $rf"; continue ;;
    esac
    echo "  RESIDUO: $rf"
    resid=$((resid + 1))
  done < <(find "$ide" -type f -name '*.md' \
    -not -path '*/worktrees/*' -not -path '*/node_modules/*' \
    -not -path '*/.git/*' 2>/dev/null || true)
done
echo "residuos_sesion=$resid"

echo "=== check 2 · CHANGELOG gobierno ↔ backlog ✅ ==="
if [ ! -f CHANGELOG.md ]; then
  echo "CHANGELOG.md ausente en esta rama (dep merge U151) — check N/A hasta merge"
  echo "changelog_presente=0"
  exit 0
fi
echo "changelog_presente=1"
# WP ✅ del remate vivo (líneas con ✅ **WP-U…) vs mención en CHANGELOG
missing=0
while IFS= read -r id; do
  [ -z "$id" ] && continue
  if ! grep -q "$id" CHANGELOG.md; then
    echo "  FALTA en CHANGELOG: $id"
    missing=$((missing + 1))
  fi
done < <(grep -oE 'WP-U[0-9]+' plan/BACKLOG.md | sort -u | while read -r w; do
  # solo ids que aparecen junto a ✅ en el tablero vivo (heurística gruesa)
  if grep -q "✅.*$w\|$w.*✅\|$w — ✅\|$w ·.*✅" plan/BACKLOG.md 2>/dev/null; then
    echo "$w"
  fi
done | sort -u)
echo "wp_ok_sin_changelog=$missing"
