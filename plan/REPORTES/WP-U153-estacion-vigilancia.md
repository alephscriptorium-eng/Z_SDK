# WP-U153 · estacion-vigilancia — reporte

| dato | valor |
| ---- | ----- |
| agente | ejecutor lote Sprint 5 (orquestador+worker) |
| fecha | 2026-07-20 |
| rama | `wp/u153-estacion-vigilancia` |
| commits | _(tip tras commit)_ |
| eje(s) CA | vigilancia (read-only) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se materializó la **estación** de vigilancia como instancia local: wrapper
`scripts/estacion/run-watcher.sh` que invoca
`node_modules/.../vigilancia/scripts/watcher.sh` (sin copiar el método),
checks 0.3.1 en `scripts/estacion/checks-031.sh`, calibración en
`scripts/estacion/README.md`, scripts npm `vigilancia` /
`vigilancia:watch` / `vigilancia:check`, y `.vigilancia/` en `.gitignore`.
Sin datos de instancia en git.

## Archivos tocados

- `scripts/estacion/run-watcher.sh` · creado — arranque parametrizado
- `scripts/estacion/checks-031.sh` · creado — checks regla 15 + CHANGELOG↔backlog
- `scripts/estacion/README.md` · creado — calibración local
- `.gitignore` · modificado — ignora `.vigilancia/`
- `package.json` · modificado — scripts npm vigilancia*
- `plan/REPORTES/WP-U153-estacion-vigilancia.md` · creado — este reporte

## Evidencia

### CA1 · watcher vs WORLD_ROOT=zeus → pulso en OUT_DIR

```
$ timeout 90 bash node_modules/.../vigilancia/scripts/watcher.sh \
    <MUNDO_RAIZ> <OUT_DIR=.vigilancia> 2
# (exit 124 = timeout del bucle; el pulso ya estaba escrito)

$ grep 'wt_reg=' .vigilancia/watch.log | tail -1
[2026-07-20 14:39:20] wt_reg=4 wt_dir=6 mtime[ wp-u12-player-mcp-kit:vacio wp-u150-gate-sitio:606s wp-u151-changelog-gobierno:630s wp-u153-estacion-vigilancia:6s wp-u23-pozo:vacio wp-u89-webrtc-viewer:vacio ] ajenos[ ] locks=''
```

Nota: el primer ciclo en este host tarda ~60–90s (find mtime sobre
`.worktrees/` grandes). `ESTACION_TIMEOUT` default del wrapper = 120s.

### CA2 · OUT_DIR gitignorado

```
$ git check-ignore -v .vigilancia/watch.log
.gitignore:62:.vigilancia/	.vigilancia/watch.log
```

### CA3 · checks 0.3.1

```
$ bash scripts/estacion/checks-031.sh
=== check 1 · residuo IDE (regla 15) ===
residuos_sesion=0
=== check 2 · CHANGELOG gobierno ↔ backlog ✅ ===
CHANGELOG.md ausente en esta rama (dep merge U151) — check N/A hasta merge
changelog_presente=0
```

El watcher (método del paquete) además elevó `!!RESIDUO` sobre
`.claude/skills/**/*.md` del espejo `skills:sync` (~200 líneas) — ver
hallazgos. El check local distingue espejo skills vs residuo de sesión.

## Auto-revisión (PRACTICAS)

- [x] Diff solo ALCANCE_DIFF (script/config + gitignore + package.json scripts + reporte)
- [x] Método no copiado (invoca watcher del paquete)
- [x] Sin datos de instancia en git (OUT_DIR ignorado; README sin rutas de usuario)
- [x] Eje vigilancia evidenciado
- [x] Commits convencionales

## Hallazgos fuera de alcance

1. **Falso positivo regla 15:** `skills:sync` deja markdowns de método bajo
   `.claude/skills/`; el watcher 0.3.1 los eleva todos como RESIDUO. Candidato
   a feedback al diseñador (excluir espejo de skills) o a no materializar el
   espejo en `.claude/` (solo `node_modules`).
2. **Huérfanos FS:** `.worktrees/wp-u12|u23|u89-*` sin registro git (basura
   preexistente) — higiene residual, no de este WP.
3. **CHANGELOG cruz:** check 2 queda operativo tras merge U151.

## Dudas / bloqueos

Ninguno bloqueante. CA de pulso cumplido; cruce CHANGELOG = N/A en esta rama
hasta merge U151 (declarado).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador · 2026-07-20)

### CA
- [x] CA1 — watcher produce pulso en `.vigilancia/watch.log` (`wt_reg=…`)
- [x] CA2 — `git check-ignore` → `.vigilancia/` ignorado
- [x] CA3 — checks 0.3.1: residuo IDE=0; CHANGELOG↔backlog operativo post-U151
- [x] ALCANCE_DIFF OK; método invocado (no copiado); sin datos de instancia en git

### Merge
merge no-ff a main (auto-merge `package.json` con `docs:verify` de U150).
Hallazgos → cola residual (espejo skills:sync falso positivo; huérfanos worktrees).
