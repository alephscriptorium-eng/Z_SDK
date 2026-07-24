# AVISO · orquestador-Z → SOL / custodio · R12-Z (plan Sprint 9)

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | vigía SOL (carril Z) vía custodio |
| Fecha | 2026-07-24 |
| Motivo | Pedir **R12-Z PASS** sobre planificación Sprint 9 (U168–U171) |
| Gate previo | **R11-Z PASS** ([GATE-R11-Z-PASS.md](GATE-R11-Z-PASS.md)) + **IDLE Z** |
| Autorización | GO **planificación** R12-Z custodio (no GO implementación) |
| Espejo | `C:\S_LAB\vigilancia\z\AVISO-R12-Z-plan.md` |

## Pedido a SOL

Validar el plan R12-Z / Sprint 9 y emitir **R12-Z PASS** (o FAIL con
evidencia).

**R12-Z es gate de planificación.** No autoriza workers, ni 🔶, ni flips
`private`, ni changesets de publicación efectivos, ni `npm publish`.

## Hechos (literal)

1. **R11-Z PASS** archivado; Sprint 8 **CERRADO**; U165 ✅ **no
   reabierto**.
2. **IDLE Z** declarado; higiene `.worktrees/z` vacío · `wp/*` 0 · 0 🔶.
3. BACKLOG remate alineado a PASS + IDLE + cola R12 (gobierno only).
4. Orquestador encoló **U168–U171** como **⬜** (0 🔶 · sin despacho).
5. Briefs + replan + fronteras duras bajo `plan/`.
6. **Cero workers** · **cero** `npm publish` en este lote.
7. Fuente política: ADDENDA-R12 (major-band + contrarrevisión).

## Artefactos

| artefacto | ruta |
| --------- | ---- |
| IDLE | `plan/REPORTES/entregas/AVISO-IDLE-Z.md` |
| Replan | `plan/REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md` |
| Addenda | `plan/REPORTES/entregas/ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md` |
| Brief U168 | `plan/REPORTES/briefs/WP-U168-major-band-p0.md` |
| Brief U169 | `plan/REPORTES/briefs/WP-U169-gate-major-band.md` |
| Brief U170 | `plan/REPORTES/briefs/WP-U170-contrarrevision-riesgo.md` |
| Brief U171 | `plan/REPORTES/briefs/WP-U171-prep-publicacion.md` |
| GATE R11 | `plan/REPORTES/entregas/GATE-R11-Z-PASS.md` |
| BACKLOG | § Remate · § Sprint 9 / R12-Z |

## Olas candidatas (a validar en R12)

| ola | WPs | deps | notas |
| --- | --- | ---- | ----- |
| **A** | U168 ∥ U170 | Sprint 8 ✅ | major-band P0×4 ∥ contrarrevisión PRACTICAS |
| **B** | U169 | U168 ✅ | gate major-band + probes + lock CA |
| **C** | U171 | U168+U169 ✅ | prep pub / dry-run · **sin** publish real |
| Publish | — | GO aparte | private + changesets + npm publish |

## Tip gobierno

| dato | valor |
| ---- | ----- |
| Tip base pre-lote | `6ad16c46fda67dcbf93248de4b0384e222dbc2a6` |
| Tip planificación R12 | `<rellenar tras commit/push>` |
| Push | normal (sin force) |
| Working tree esperado | limpio tras tip-fill + push |

## Quietud / frontera

- Sprint 8 CERRADO; Sprint 9 = **planificación / IDLE de obra**.
- 0 🔶 · 0 workers · 0 `wp/*` despachados.
- Frontera: sin private flip · sin changesets de pub efectivos · sin
  `npm publish` hasta **R12-Z PASS** (publish real = GO publish aparte).
- DC-15 LOCAL-ONLY.

## Handoff a SOL (copiable)

```text
R12-Z pedido por orquestador-Z · planificación Sprint 9 / major-band

Hechos:
- R11-Z PASS · Sprint 8 CERRADO · IDLE Z · higiene PASS
- BACKLOG remate alineado (gobierno; no reabre U165/Sprint 8)
- GO planificación custodio (no GO implementación)
- U168–U171 encolados ⬜ · briefs + replan listos
- Ola A: U168 ∥ U170 (major-band P0×4 ∥ contrarrevisión)
- Ola B: U169 (gate major-band; dep U168)
- Ola C: U171 (prep publicación sin publish real)
- Publish real / private / changesets de pub = GO aparte
- Cero workers · cero despacho · cero npm publish
- Contrarrevisión independiente obligatoria en U168/U169/U171
- CA lock-coherence (hallazgo R11-Z PASS) en WPs que toquen manifests

Pedir: R12-Z PASS (planificación) o FAIL con evidencia.
Tip gobierno: <rellenar tras push>
Replan: plan/REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md
DC-15: LOCAL-ONLY
```
