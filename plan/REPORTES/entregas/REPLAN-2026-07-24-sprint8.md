# REPLAN · Sprint 8 · publish-ready mesh (planificación)

| dato | valor |
| ---- | ----- |
| Fecha | 2026-07-24 |
| Rol | orquestador-Z |
| Autorización | **GO planificación** custodio (vía `GATE-R7-Z-PASS.md`) |
| Tip base planificado | `42e55b3df2436198779773631d62c030baa9364b` = `origin/main` |
| Gate previo | **R7-Z PASS** (corrección U162 / D-41) |
| Pedido siguiente | **R10-Z** a SOL (corrección plan Ola B; no GO implementación) |
| Gate Ola A | **R9-Z PASS** ([GATE-R9-Z-PASS.md](GATE-R9-Z-PASS.md)) |
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

### Corrección post-R9-Z (Ola B · 2026-07-24)

Mandato custodio tras **R9-Z PASS** (Ola A cerrada; U164–U166 sin GO):

```text
U165 solo lee PUBLISH-ALLOWLIST.
U166 posee sus enmiendas (allowlist/audit).
U165 se acepta/mergea último.
Reejecutar gate U165 tras integrar U164+U166.
Mantener U164–U166 ⬜ · pedir R10-Z.
```

## Fuentes

- [PUBLISH-ALLOWLIST.md](../../PUBLISH-ALLOWLIST.md) (U162 ✅ · U167 democión)
- [WP-U162-auditoria-publish-allowlist.md](../WP-U162-auditoria-publish-allowlist.md) § Plan U163–U167
- [ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](ADDENDA-R5-Z-AUDITORIA-PUBLISH.md)
- `vigilancia/z/GATE-R7-Z-PASS.md` · `GATE-R8-Z-PASS.md` · `GATE-R9-Z-PASS.md`
- [GATE-R9-Z-PASS.md](GATE-R9-Z-PASS.md) (archivo repo)

## Inventario de partida (U162 → post-U167)

| clase | n | notas |
| ----- | - | ----- |
| ya publicados | 29 | pipeline vigente / clase B histórica |
| candidatos §3 | 6 | P0×4 + P1×2 (blobstore democionado U167) |
| mantener privado | 14 | UIs, demos, harnesses, blobstore-client, etc. |

P0: `linea-system`, `linea-firehose`, `force-system`, `ssb-system`.  
P1 vivos: `linea-editor`, `console-monitor`.  
Democión documentada: `blobstore-client` (U167 ✅).

## Olas y dependencias

```text
[R8-Z PASS + GO implementación Ola A]  →  Ola A ✅
                │
    ┌───────────┴───────────┐
    ▼                       ▼
  U163 ✅                 U167 ✅
  POC linea-system        Triage blobstore (vía B)
    │
[R9-Z PASS · Ola A cerrada · NO GO Ola B]
    │
[R10-Z PASS + GO implementación Ola B]
    │
    ├───────────┐
    ▼           ▼
  U164        U166
  Replicar    Triage P1 +
  P0 resto    enmiendas allowlist
    │           │
    └─────┬─────┘
          ▼
        U165  (último)
        Gate pre-pub
        + re-gate tras U164+U166

[publish real / flip private / changesets de pub]
        → GO independiente (fuera de Sprint 8 plan)
```

| WP | ola | est. | deps | eje |
| -- | --- | ---- | ---- | --- |
| **U163** | A | M | U162 ✅ | IV (contrato publish-ready) |
| **U167** | A | M | U162 ✅ | IV (allowlist / triage) |
| **U164** | B | M | U163 ✅ (∥ U166) | IV |
| **U166** | B | M | U163 ✅ (∥ U164) | IV (posee enmiendas P1) |
| **U165** | B | S–M | U163 ✅ + merge tras U164+U166 | IV + C8 (allowlist solo lectura) |

**Paralelismo post-GO implementación Ola A:** `U163 ∥ U167` → **✅ cerrada**.  
**Ola B (corregida · post-R10-Z + GO):** `U164 ∥ U166` primero → luego
**U165** secuencial (aceptación/merge **último**) con **re-gate** del
script U165 sobre `main` tras integrar U164+U166.  
**Publish real** = fase y GO aparte.

## Alcances (resumen)

| WP | dentro | fuera (duro) |
| -- | ------ | ------------ |
| U163 | POC publish-ready `@zeus/linea-system`: `publishConfig`, `files`, pinear `@zeus/*`, decisión types/JS-only, medición `npm pack --dry-run` | flip `private`, `npm publish`, changesets de publicación, `release.yml` |
| U164 | mismo checklist en firehose / force-system / ssb-system; ssb: excluir fixtures del tarball | idem; allowlist; gate U165 |
| U165 | gate/script CI pre-pub mesh allowlist (files, types, semver ≠ `*`, registry C8, dry-run pack); **lee** allowlist | publish; **editar** allowlist (dueño = U166); aceptar sin re-gate post-U164+U166 |
| U166 | triage P1: exports en console-monitor; decidir publicabilidad; **posee** enmiendas allowlist/audit P1 | flip `private` / publish sin GO; P0; gate U165 |
| U167 | triage blobstore-client: desacoplar harness **o** enmendar allowlist a «mantener privado» | publish; ampliar P0 sin GO |

## Gates

| gate | significado |
| ---- | ----------- |
| **R8-Z** | SOL validó plan Sprint 8 inicial. No autorizó Ola B sola. |
| **R9-Z** | PASS cierre Ola A; HOLD Ola B hasta corrección plan + R10-Z. |
| **R10-Z** | SOL valida corrección plan Ola B (orden, posesiones allowlist, re-gate). **No** autoriza workers por sí solo. |
| GO implementación Ola B | custodio; habilita 🔶 + despacho tras R10-Z PASS. |
| GO publish | aparte; flips `private` + changesets de publicación + `npm publish`. |

## Estado orquestador tras corrección Ola B

- BACKLOG: Ola A ✅ · Ola B **plan corregido / IDLE de obra**.
- U164–U166 permanecen **⬜** (0 🔶 · sin despacho).
- Briefs U164/U165/U166 alineados (deps, fuera-de-alcance, orden).
- **Cero workers** · **cero** despacho · **cero** cambios `private` ·
  **cero** changesets de publicación · **cero** publish.
- Pedido: [AVISO-R10-Z-ola-b-replan.md](AVISO-R10-Z-ola-b-replan.md).
