# AVISO · orquestador-Z → SOL / custodio · R8-Z (plan Sprint 8)

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | vigía SOL (carril Z) vía custodio |
| Fecha | 2026-07-24 |
| Motivo | Pedir **R8-Z PASS** sobre planificación Sprint 8 (U163–U167) |
| Gate previo | **R7-Z PASS** (`vigilancia/z/GATE-R7-Z-PASS.md`) |
| Autorización | GO **planificación** custodio (no GO implementación) |
| Espejo | `C:\S_LAB\vigilancia\z\AVISO-R8-Z-sprint8-plan.md` |

## Pedido a SOL

Validar el plan Sprint 8 y emitir **R8-Z PASS** (o FAIL con evidencia).

**R8-Z es gate de planificación.** No autoriza workers, ni 🔶, ni flips
`private`, ni changesets de publicación, ni `npm publish`.

## Hechos (literal)

1. **R7-Z PASS** registró corrección U162 (D-41 · no precedente) y
   autorizó solo GO planificación Sprint 8.
2. Orquestador encoló **U163–U167** como **⬜** (0 🔶 · sin despacho).
3. Briefs + replan + fronteras duras persistidos bajo `plan/`.
4. **Cero workers** · **cero** cambios `private` · **cero** changesets
   de publicación · **cero** publish en este lote.
5. U162 permanece ✅ por ratificación ex post acotada; **no** se reabre
   como GO previo legítimo.

## Artefactos

| artefacto | ruta |
| --------- | ---- |
| Replan | `plan/REPORTES/entregas/REPLAN-2026-07-24-sprint8.md` |
| Brief U163 | `plan/REPORTES/briefs/WP-U163-poc-publish-ready-linea-system.md` |
| Brief U164 | `plan/REPORTES/briefs/WP-U164-replicar-p0-publish-ready.md` |
| Brief U165 | `plan/REPORTES/briefs/WP-U165-gate-prepub-mesh-allowlist.md` |
| Brief U166 | `plan/REPORTES/briefs/WP-U166-triage-p1-linea-editor-console-monitor.md` |
| Brief U167 | `plan/REPORTES/briefs/WP-U167-triage-blobstore-client.md` |
| Allowlist | `plan/PUBLISH-ALLOWLIST.md` |
| BACKLOG | § Sprint 8 |

## Olas candidatas (a validar en R8)

| ola | WPs | deps | notas |
| --- | --- | ---- | ----- |
| **A** | U163 ∥ U167 | U162 ✅ | tras GO implementación |
| **B** | U164 ∥ U165 ∥ U166 | U163 ✅ | tras Ola A / U163 |
| Publish | — | GO aparte | private + changesets de pub + npm publish |

## Tip gobierno

| dato | valor |
| ---- | ----- |
| Tip planificación Sprint 8 | `ad738220444deb7e7af3d3f67cdcf4c5e13155f0` |
| Tip base (R7-Z PASS) | `42e55b3df2436198779773631d62c030baa9364b` |
| Push | normal (sin force) |
| Working tree esperado | limpio tras tip-fill + push |

## Quietud / frontera

- Sprint 7 CERRADO / IDLE; Sprint 8 = **planificación / IDLE de obra**.
- 0 🔶 · 0 workers · 0 `wp/*` despachados.
- Frontera: sin private · sin changesets de pub · sin publish.
- DC-15 LOCAL-ONLY.

## Handoff a SOL (copiable)

```text
R8-Z pedido por orquestador-Z · planificación Sprint 8

Hechos:
- R7-Z PASS · GO planificación custodio (no GO implementación)
- U163–U167 encolados ⬜ · briefs + replan listos
- Ola A: U163 ∥ U167
- Ola B tras U163: U164 ∥ U165 ∥ U166
- Publish real / private / changesets de pub = GO aparte
- Cero workers · cero despacho · cero private · cero changesets de pub · cero publish
- U162 ✅ solo por D-41 (no precedente; no reabrir como GO previo)

Pedir: R8-Z PASS (planificación) o FAIL con evidencia.
Tip gobierno: ad738220444deb7e7af3d3f67cdcf4c5e13155f0
(serie tip-fill → HEAD tras push)
Replan: plan/REPORTES/entregas/REPLAN-2026-07-24-sprint8.md
DC-15: LOCAL-ONLY
```
