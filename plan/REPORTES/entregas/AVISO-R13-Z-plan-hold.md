# AVISO · orquestador-Z → custodio / SOL · plan actualizado (R13-Z en HOLD)

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | custodio + vigía SOL (carril Z) |
| Fecha | 2026-07-24 |
| Motivo | Plan activo actualizado: D-42 asentado · cola R13-Z planificada · U178 encolado |
| Estado R13-Z | **HOLD** — no se pide R13-Z PASS hasta el commit del asiento DA-S21 |
| Estado R12-Z | Pedido **vigente** sin cambios ([AVISO-R12-Z-plan.md](AVISO-R12-Z-plan.md)) |
| Contexto | **PAUSA / CORTE TÉCNICO** vigente (solo gobierno de plan en esta pasada) |
| Espejo | `C:\S_LAB\vigilancia\z\AVISO-R13-Z-plan-hold.md` |

## Qué se asentó (esta pasada · solo `plan/`)

1. **GO publish condicionado P0×4** — **D-42** en DECISIONES +
   allowlist §3 («GO publish condicionado P0×4») + BACKLOG remate.
   Condiciones completas (skills 0.10.0 validado · R12-Z PASS + GO
   impl. · U168–U171 ✅ · major-band + gate · contrarrevisión PASS ·
   changesets/matriz CI-Release · gate online/C8 verde · tarballs
   limpios/JS-only) → publish P0×4 **sin nuevo GO**; hasta entonces
   **cero publish / cero flip private**.
2. **`linea-editor` publish-ready = WP separado U178 ⬜** (cola publish
   P1; dep U168+U169; GO impl. propio; no mezclar con P0×4).
3. **Clases privadas por producto excluidas** — texto explícito en
   allowlist §4 (D-42): sin flip/changesets/publish sin enmienda +
   nueva decisión custodio.
4. **Cola R13-Z planificada** (D-43 · «GO custodio 2026-07-24 · asiento
   DA-S21 pendiente»): épica **U73 reactivada ⬜** + **U172–U177 ⬜**
   con briefs; camino A (absorber en contratos/paquetes existentes; sin
   reconstruir el editor legado). **R13-Z en HOLD.**
5. Addendas archivadas en `plan/REPORTES/entregas/` (títulos =
   ficheros): `ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md` ·
   `ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md`.

## Artefactos

| artefacto | ruta |
| --------- | ---- |
| Replan R13 | `plan/REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md` |
| D-42 / D-43 | `plan/DECISIONES.md` |
| Allowlist (D-42) | `plan/PUBLISH-ALLOWLIST.md` §3–§5 |
| BACKLOG | § Remate · § Sprint 9/R12 · § Cola publish P1 (U178) · § R13-Z |
| Brief U172 | `plan/REPORTES/briefs/WP-U172-proyector-mcp-mutaciones.md` |
| Brief U173 | `plan/REPORTES/briefs/WP-U173-kit-reparto-permisos.md` |
| Brief U174 | `plan/REPORTES/briefs/WP-U174-personajes-story-board.md` |
| Brief U175 | `plan/REPORTES/briefs/WP-U175-autoria-gateada-linea-editor.md` |
| Brief U176 | `plan/REPORTES/briefs/WP-U176-importador-corpus-legado.md` |
| Brief U177 | `plan/REPORTES/briefs/WP-U177-contrato-ide-cierre-zigurat.md` |
| Brief U178 | `plan/REPORTES/briefs/WP-U178-publish-ready-linea-editor.md` |

## Secuencia hacia el tercer frente (bloqueo duro)

```text
[asiento DA-S21 commiteado]  ← levanta HOLD de R13-Z (pedir gate ahí)
        │
[reanudación pausa] → [R12-Z PASS] → [GO impl. R12] → [U168–U171 ✅ + cierre R12]
        │
[R13-Z PASS] → [GO implementación tercer frente]  ← solo entonces 🔶/workers
```

Publish P0×4 = condiciones D-42 completas (sin nuevo GO al cumplirlas).
Publish `linea-editor` = PASS de U178 + condiciones D-42 propias.

## Nota de runtime

Cascada de modelo para futuros despachos R13: preferir **Fable**; si
no disponible, **GPT-5.6 Sol**; si tampoco, el mejor disponible —
anotar cascada en el aviso del despacho. Esta pasada de planificación:
**Fable, sin fallback**.

## Quietud / frontera

- **0 🔶 · 0 workers · 0 despacho · 0 `npm publish` · 0 flip private.**
- Tercer frente **sin abrir**; U168–U171 intactos; Sprint 8/U165 no
  reabiertos; PAUSA respetada.
- DC-15 LOCAL-ONLY.

## Tip gobierno

| dato | valor |
| ---- | ----- |
| Tip base pre-lote | `1cf1318` (AVISO PAUSA) |
| Tip planificación R13/D-42 | `0ae4692` |
| Push | normal (sin force) |
