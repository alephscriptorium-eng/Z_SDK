# REPLAN · Sprint 8 · publish-ready mesh (planificación)

| dato | valor |
| ---- | ----- |
| Fecha | 2026-07-24 |
| Rol | orquestador-Z |
| Autorización | **GO planificación** custodio (vía `GATE-R7-Z-PASS.md`) |
| Tip base planificado | `42e55b3df2436198779773631d62c030baa9364b` = `origin/main` |
| Gate previo | **R7-Z PASS** (corrección U162 / D-41) |
| Pedido siguiente | **R8-Z** a SOL (solo planificación; no GO implementación) |
| Proyección | DC-15 **LOCAL-ONLY** |

## Mandato (fronteras duras de esta ronda)

```text
GO planificación Sprint 8: encolar U163–U167 como ⬜ y preparar briefs,
dependencias, alcances y olas.
Sin workers, sin cambios private, sin changesets de publicación y sin publish.
Después pedir R8-Z a SOL.
```

**No** es GO de implementación. **No** reabre U162 como si hubiera tenido GO
previo legítimo (D-41: ratificación ex post acotada; no precedente).

## Fuentes

- [PUBLISH-ALLOWLIST.md](../../PUBLISH-ALLOWLIST.md) (U162 ✅)
- [WP-U162-auditoria-publish-allowlist.md](../WP-U162-auditoria-publish-allowlist.md) § Plan U163–U167
- [ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](ADDENDA-R5-Z-AUDITORIA-PUBLISH.md)
- `vigilancia/z/GATE-R7-Z-PASS.md` (olas candidatas A/B)

## Inventario de partida (U162)

| clase | n | notas |
| ----- | - | ----- |
| ya publicados | 29 | pipeline vigente / clase B histórica |
| candidatos §3 | 7 | P0×4 + P1×3 |
| mantener privado | 13 | UIs, demos, harnesses, etc. |

P0: `linea-system`, `linea-firehose`, `force-system`, `ssb-system`.  
P1: `linea-editor`, `console-monitor`, `blobstore-client`.

## Olas y dependencias

```text
[R8-Z PASS + GO implementación custodio]
                │
    ┌───────────┴───────────┐
    ▼                       ▼
  U163                    U167
  POC linea-system        Triage blobstore-client
  (P0 plantilla)          (o deslistar allowlist)
    │
    ├───────────┬───────────┐
    ▼           ▼           ▼
  U164        U165        U166
  Replicar    Gate        Triage P1
  P0 resto    pre-pub     linea-editor +
              mesh        console-monitor

[publish real / flip private / changesets de pub]
        → GO independiente (fuera de Sprint 8 plan)
```

| WP | ola | est. | deps | eje |
| -- | --- | ---- | ---- | --- |
| **U163** | A | M | U162 ✅ | IV (contrato publish-ready) |
| **U167** | A | M | U162 ✅ | IV (allowlist / triage) |
| **U164** | B | M | U163 | IV |
| **U165** | B | S–M | U163 | IV + C8 |
| **U166** | B | M | U163 (∥ U164/U165) | IV |

**Paralelismo post-GO implementación:** `U163 ∥ U167` (Ola A).  
Tras U163 ✅: `U164 ∥ U165 ∥ U166` (Ola B).  
**Publish real** = fase y GO aparte tras preparar y aceptar paquetes.

## Alcances (resumen)

| WP | dentro | fuera (duro) |
| -- | ------ | ------------ |
| U163 | POC publish-ready `@zeus/linea-system`: `publishConfig`, `files`, pinear `@zeus/*`, decisión types/JS-only, medición `npm pack --dry-run` | flip `private`, `npm publish`, changesets de publicación, `release.yml` |
| U164 | mismo checklist en firehose / force-system / ssb-system; ssb: excluir fixtures del tarball | idem |
| U165 | gate/script CI pre-pub mesh allowlist (files, types, semver ≠ `*`, registry C8, dry-run pack) | publish; no ampliar allowlist sin enmienda |
| U166 | triage P1: exports en console-monitor; decidir publicabilidad linea-editor | flip `private` / publish sin GO |
| U167 | triage blobstore-client: desacoplar harness **o** enmendar allowlist a «mantener privado» | publish; ampliar P0 sin GO |

## Gates

| gate | significado |
| ---- | ----------- |
| **R8-Z** | SOL valida plan Sprint 8 (briefs + olas + fronteras). **No** autoriza workers. |
| GO implementación | custodio; habilita 🔶 + despacho Ola A. |
| GO publish | aparte; flips `private` + changesets de publicación + `npm publish`. |

## Estado orquestador tras este replan

- BACKLOG: **Sprint 8** abierto en **planificación / IDLE de obra**.
- U163–U167 encolados **⬜** (0 🔶).
- Briefs en `plan/REPORTES/briefs/WP-U163-*.md` … `WP-U167-*.md`.
- **Cero workers** · **cero** despacho · **cero** cambios `private` ·
  **cero** changesets de publicación · **cero** publish.
- Pedido: [AVISO-R8-Z-sprint8-plan.md](AVISO-R8-Z-sprint8-plan.md).
