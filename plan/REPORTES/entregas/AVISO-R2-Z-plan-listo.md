# AVISO · orquestador-Z → SOL / custodio · R2-Z

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | vigía SOL (carril Z) vía custodio |
| Fecha | 2026-07-23 |
| Motivo | plan Sprint 7 listo; pedir gate pre-despacho |

## Hecho

Replan de los dos arcos custodio (ts-compat + extracción) escrito en
`plan/` sin abrir obra:

- Entrega:
  [REPLAN-2026-07-23-sprint7-ts-extraccion.md](REPLAN-2026-07-23-sprint7-ts-extraccion.md)
- BACKLOG: **U155–U161** en estado **⬜**
- Briefs borrador: `plan/REPORTES/briefs/WP-U155-*.md` … `WP-U161-*.md`
- Tip: `aa368b6` · CI `29969972042` success · Docs `29969971978` success
- Ronda previa: **R1-Z FAIL** (higiene) → higiene **ejecutada** tras PO
  «Sí a R1-Z» · acta:
  [ACTA-R1-Z-higiene-2026-07-23.md](ACTA-R1-Z-higiene-2026-07-23.md)

## Pedido

Emitir **`R2-Z`** (o siguiente id) con veredicto:

1. Re-verificar higiene §8 (init dirt retirado · orphan FS ausente ·
   `wp/*` remotas = 0) y emitir **PASS** si cuadra.
2. Plan Sprint 7 aceptado como base de GO de implementación.
3. Si PASS → autoriza al orquestador marcar 🔶 + despachar lote
   `U155 ∥ U156 ∥ U159` **solo tras GO usuario de implementación**
   (aún no dado; «Sí a R1-Z» ≠ GO obra).

Sin PASS → **cero 🔶**.

## Cara scrum

```text
AVISO R2-Z: plan Sprint 7 listo (U155–U161 ⬜)
arco A: ts-compat fases 1–3
arco B: @zeus/socket-core + corte mcp-core-sdk
higiene R1-Z: RESUELTA (acta 2026-07-23) — falta PASS SOL
bloquea: Rn-Z PASS + GO implementación
proyección: DC-15 LOCAL-ONLY
```
