# Brief — WP-U164 · Replicar P0 publish-ready (firehose / force / ssb)

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U164 · Replicar P0: linea-firehose, force-system, ssb-system
Rama: wp/u164-replicar-p0-publish-ready
Worktree: C:\S_LAB\.worktrees\z\wp-u164-replicar-p0-publish-ready
Reporte: plan/REPORTES/WP-U164-replicar-p0-publish-ready.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 P0 · §5
- Brief + reporte U163 (plantilla POC)
- plan/REPORTES/entregas/REPLAN-2026-07-24-sprint8.md
- `packages/mesh/{linea-firehose,force-system,ssb-system}/package.json`

## Tarea
1. Aplicar el **mismo checklist** publish-ready de U163 a:
   `@zeus/linea-firehose`, `@zeus/force-system`, `@zeus/ssb-system`.
2. En `ssb-system`: garantizar exclusión de fixtures del tarball
   (`files` / medición pack).
3. Pinear `@zeus/*`; `publishConfig`; decisión types/JS-only por paquete
   (o heredar patrón U163 con justificación).
4. Tabla de evidencia pack dry-run ×3 en el reporte.
5. **No** flip `private`, **no** publish, **no** changesets de
   publicación, **no** `release.yml`.

## CA
- Tres paquetes con checklist §5 medido (pack dry-run literal).
- `ssb-system`: 0 fixtures/tests en tarball medido.
- Cero `*` en deps `@zeus/*` de los tres.
- Frontera dura: cero private / cero publish / cero changesets de pub.
- Diff solo esos tres paths + reporte.

## ALCANCE_DIFF
- `packages/mesh/linea-firehose/**`
- `packages/mesh/force-system/**`
- `packages/mesh/ssb-system/**`
- reporte `plan/REPORTES/`
- **Prohibido:** private flip, publish, changesets de pub, P1, linea-system
  (salvo lectura)

## Notas
- Estado: **⬜** · Ola B · deps: **U163**
- **NO DESPACHAR** hasta R8-Z PASS + GO implementación + U163 ✅
- Estimación: M · Eje IV
- Paralelo con U165 ∥ U166 tras U163
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY
