# REPLAN · R12-Z / Sprint 9 · major-band P0×4 (planificación)

| dato | valor |
| ---- | ----- |
| Fecha | 2026-07-24 |
| Rol | orquestador-Z |
| Autorización | **GO planificación** R12-Z (custodio · prioritario) |
| Tip base | `6ad16c46fda67dcbf93248de4b0384e222dbc2a6` = `origin/main` (pre-lote gobierno) |
| Gate previo | **R11-Z PASS** ([GATE-R11-Z-PASS.md](GATE-R11-Z-PASS.md)) |
| Pedido siguiente | **R12-Z PASS** a SOL (planificación; no GO implementación) |
| Proyección | DC-15 **LOCAL-ONLY** |

## Mandato (fronteras duras)

```text
AVISO IDLE Z + GO planificación R12-Z prioritario:
migrar P0×4 a major-band, contrarrevisión y preparar publicación.
Sin npm publish hasta R12-Z PASS.
Alinear BACKLOG con R11-Z PASS + Sprint 8 cerrado (gobierno only).
No reabrir U165 ni Sprint 8. Sin workers / sin 🔶 ahora.
```

## Fuentes

- [GATE-R11-Z-PASS.md](GATE-R11-Z-PASS.md) · observación lock-coherence
- [ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md](ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md)
- [PUBLISH-ALLOWLIST.md](../../PUBLISH-ALLOWLIST.md) §3 P0 · §5
- [AVISO-IDLE-Z.md](AVISO-IDLE-Z.md)

## Política semver (major-band)

Forma canónica por dependencia interna `@zeus/*` publicada:

```text
>=M.m.p <(M+1).0.0
```

- Rechazo de `*`, tags, Git/URL, aliases, rutas locales.
- Mínimo `M.m.p` y resolución existen en registry (C8).
- Para major `0`: declarar que minor puede romper; exigir test de
  integración antes de ✅ (no convertir a `^0.m.p`).
- Sustituye pines exactos actuales de P0×4 (post U163/U164).

P0×4 allowlist:

| paquete | path |
| ------- | ---- |
| `@zeus/linea-system` | `packages/mesh/linea-system` |
| `@zeus/linea-firehose` | `packages/mesh/linea-firehose` |
| `@zeus/force-system` | `packages/mesh/force-system` |
| `@zeus/ssb-system` | `packages/mesh/ssb-system` |

## Contrarrevisión (quién / qué / CA)

| campo | valor |
| ----- | ----- |
| Quién | Revisor **independiente** read-only (SOL vía handoff o agente fresco distinto del worker y del orquestador que acepta) |
| Cuándo | Tras reporte worker y **antes** de ✅/merge en WPs de riesgo |
| Aplica a | **U168 · U169 · U171** (gates/manifests/pub); U170 = proceso (revisión ligera orquestador) |
| Qué intenta refutar | falsos negativos; deps no declaradas; install limpia; prueba manual vs test; alcance/fronteras publish |
| Salida | observaciones numeradas → devolución, o PASS revisión → orquestador puede ✅ |
| Separación | gate Rn-Z post-merge permanece distinto |

Persistencia normativa = **U170** (PRACTICAS + checklist).

## Olas y dependencias

```text
[R11-Z PASS · IDLE Z · GO planificación R12-Z]
        │
        ▼
[R12-Z PASS + GO implementación]  →  despacho (no ahora)
        │
    ┌───┴───┐
    ▼       ▼
  U168    U170
  major   contrarrevisión
  band    (PRACTICAS)
  P0×4
    │
    ▼
  U169  (gate major-band · dep U168)
    │
    ▼
  U171  (prep publicación · sin publish real)
    │
[GO publish aparte] → flip private + changesets + npm publish
```

| WP | ola | est. | deps | eje | posesión archivos |
| -- | --- | ---- | ---- | --- | ----------------- |
| **U168** | A | M | Sprint 8 ✅ | IV | `packages/mesh/{linea-system,linea-firehose,force-system,ssb-system}/**` · allowlist §5 · lock si manifests |
| **U170** | A | S | Sprint 8 ✅ | IV proc. | `plan/PRACTICAS.md` (+ plantilla checklist bajo `plan/REPORTES/` si hace falta) |
| **U169** | B | M | U168 ✅ | IV+C8 | `scripts/gate-publish-ready.mjs` · tests/probes del gate · package.json root solo si declara deps del sensor |
| **U171** | C | M | U168+U169 ✅ | IV | checklist bajo `plan/REPORTES/` · dry-run changesets **sin** aplicar publish · **no** flip private |

**Paralelismo máximo post-GO impl.:** `U168 ∥ U170` → luego U169 → luego U171.  
**No** solapar U168 y U169 sobre el mismo gate.

## CA transversales (R11-Z PASS → R12)

1. Todo WP que cambie manifests **verifica/actualiza lock** en el mismo
   alcance (no acumular snapshots atrasados).
2. Contrarrevisión PASS documentada antes de ✅ en U168/U169/U171.
3. Frontera: cero `npm publish` / cero Release publish efectivo en este
   sprint hasta GO publish; prep (U171) solo dry-run/checklist.

## Gates

| gate | significado |
| ---- | ----------- |
| **R11-Z** | PASS — Sprint 8 cerrado. No autoriza publish. |
| **R12-Z** | SOL valida plan Sprint 9 / major-band. **No** autoriza workers por sí solo. |
| GO implementación | custodio; habilita 🔶 + despacho tras R12-Z PASS. |
| GO publish | aparte; flips `private` + changesets de pub + `npm publish`. |

## Estado orquestador tras este replan

- BACKLOG: Sprint 8 **CERRADO** · Sprint 9 / R12 = **planificación / IDLE**.
- U168–U171 **⬜** (0 🔶 · sin despacho).
- Briefs listos · aviso IDLE + aviso R12 persistidos.
- **Cero workers** · **cero** `npm publish` · **cero** flip private.
- Pedido / reintento: [AVISO-R12-Z-pedido-PASS.md](AVISO-R12-Z-pedido-PASS.md).
- **R13 detrás de R12:** petición R13-Z solo tras **R12-Z PASS**; DA-S21 ·
  `2eb4784` asentada (autoridad); hold R13 restante = operativo (PAUSA).
