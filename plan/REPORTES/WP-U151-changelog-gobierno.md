# WP-U151 · changelog-gobierno — reporte

| dato | valor |
| ---- | ----- |
| agente | ejecutor lote Sprint 5 (orquestador+worker) |
| fecha | 2026-07-20 |
| rama | `wp/u151-changelog-gobierno` |
| commits | _(tip tras commit)_ |
| eje(s) CA | ninguno (gobierno) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se creó `CHANGELOG.md` en la raíz del monorepo (Keep a Changelog),
**derivado** del remate de `plan/BACKLOG.md` y de las olas en
`plan/BACKLOG-HISTORICO.md`, con granularidad **gruesa por ola/sprint**
(Sprints 1–4 + AMEND + micros + olas 0–10). No se tocó ningún
`packages/*/CHANGELOG.md`. No se adoptó `verificar-changelog.mjs` (Punto 2
del handoff: choca con changesets).

## Archivos tocados

- `CHANGELOG.md` · creado — changelog de gobierno del mundo
- `plan/REPORTES/WP-U151-changelog-gobierno.md` · creado — este reporte

## Evidencia

### CA1 · existe + formato Keep a Changelog

```
$ test -f CHANGELOG.md && head -8 CHANGELOG.md
# Changelog
...
Format: [Keep a Changelog](https://keepachangelog.com/).
```

### CA2 · sprints cerrados tienen sección

```
$ grep -E '^## \[' CHANGELOG.md
## [Unreleased]
## [Sprint 4] — 2026-07-20
## [Sprint 3] — 2026-07-19
## [Micros post-AMEND] — 2026-07-19
## [AMEND Sprint 2] — 2026-07-19
## [Sprint 2] — 2026-07-19
## [Sprint 1] — 2026-07-18
## [Post-U87 + estabilización] — 2026-07-18
## [Olas 0–10] — 2026-07-17 → 2026-07-18
```

### CA3 · no toca changelogs de paquete

```
$ git diff --name-only main...HEAD
CHANGELOG.md
plan/REPORTES/WP-U151-changelog-gobierno.md
```

### CA4 · sin gate verificar-changelog

```
$ grep -r verificar-changelog package.json .github/ 2>/dev/null | wc -l
0
```

## Auto-revisión (PRACTICAS)

- [x] Diff solo ALCANCE_DIFF
- [x] Derivado del BACKLOG (sin prosa inventada de producto)
- [x] Punto 2 handoff respetado (no gate changelog)
- [x] packages/*/CHANGELOG intactos
- [x] Commits convencionales

## Hallazgos fuera de alcance

- Tras merge de U149–U153, actualizar sección `[Unreleased]` → entrada
  Sprint 5 (orquestador en cierre de ola).
- Cruce vigía CHANGELOG↔backlog (ESTACION 0.3.1) queda operativo tras
  merge U151+U153.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

_(pendiente — no inventar ✅)_
