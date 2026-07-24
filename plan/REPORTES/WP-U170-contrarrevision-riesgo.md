# WP-U170 · contrarrevisión-riesgo — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor) |
| fecha | 2026-07-25 |
| rama | `wp/u170-contrarrevision-riesgo` |
| commit(s) | _(rellenar tras commit)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Persistí en `plan/PRACTICAS.md` la regla de **contrarrevisión independiente
read-only** para WPs de riesgo: activación selectiva por clases (gates,
manifests/semver/pub, CI/Release/auth, contratos cruzados), con referencia
a la clasificación canónica en `revision-adversarial.md` sin duplicar la
tabla completa. Definí **quién** (revisor ≠ worker ≠ orquestador que acepta;
SOL vía handoff), **qué** (checklist verificable de seis ítems) y **cuándo**
(orden worker → PASS contrarrevisión → ✅ orquestador → merge; gate Rn-Z
post-merge separado). Añadí plantilla corta
`plan/REPORTES/CHECKLIST-CONTRARREVISION.md`. Aplica a U168/U169/U171 según
REPLAN R12. Cero cambios en `packages/**`.

## Archivos tocados

- `plan/PRACTICAS.md` — modificado: §7 (referencia cruzada) + §9 completo
- `plan/REPORTES/CHECKLIST-CONTRARREVISION.md` — creado: checklist operativo
- `plan/REPORTES/WP-U170-contrarrevision-riesgo.md` — creado: este reporte

## Evidencia

### Preflight identidad

```
$ cd C:/S_LAB/.worktrees/z/wp-u170-contrarrevision-riesgo
$ WORLD_ROOT=C:/S_LAB/z-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/z-sdk \
  READ_ONLY_ROOTS='["C:/S_LAB/.worktrees"]' \
  DOWNSTREAM_PATTERNS='[".worktrees/*"]' \
  node ../../../z-sdk/.claude/skills/vigilancia/scripts/verificar-identidad-raiz.mjs
identidad-raiz: PASS
world-real: c:/s_lab/z-sdk
git-toplevel: c:/s_lab/z-sdk
```

### Alcance (cero packages)

```
$ git diff --name-only
plan/PRACTICAS.md
plan/REPORTES/CHECKLIST-CONTRARREVISION.md
plan/REPORTES/WP-U170-contrarrevision-riesgo.md
```

```
$ git diff --name-only | rg '^packages/' ; echo exit:$?
exit:1
```

(ningún path bajo `packages/`)

### Gates (obligatorio)

**N/A** — el WP solo toca `plan/**`; no hay cambios en `packages/` ni
`scripts/`.

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u170-contrarrevision-riesgo` |
| run_id | **N/A** (paths-ignore U104: solo `plan/**` / `**.md`) |
| workflow | CI |
| conclusion | **N/A** |

## Demolición

N/A — WP de proceso; no se borró código.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [ ] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo markdown de plan)
- [ ] Cadenas if/switch que debieron ser tabla: N/A
- [ ] Duplicación con otros paquetes: N/A
- [ ] console.log / código comentado / TODO sin backlog: no aplica
- [ ] Nombres fuera de glosario o de transición: no
- [ ] Demolición completa: N/A
- [ ] Tests prueban comportamiento: N/A (sin código)
- [ ] Arranque real verificado: N/A
- [ ] README/specs del paquete siguen siendo verdad: N/A
- [x] El diff contiene solo el alcance del WP: sí — solo `plan/PRACTICAS.md`
      y `plan/REPORTES/` (checklist + reporte)
- [ ] Si docs públicas C8/C9: N/A (no toca docs públicas)

## Hallazgos fuera de alcance

Ninguno.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
