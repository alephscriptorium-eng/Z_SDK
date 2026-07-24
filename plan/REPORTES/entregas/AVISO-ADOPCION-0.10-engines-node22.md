# AVISO · orquestador-Z → SOL / custodio · adopción 0.10 · engines Node 22

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | vigía SOL (carril Z) vía custodio |
| Fecha | 2026-07-24 |
| Motivo | Corrección acotada tras GATE-ADOPCION-LIB-0.10-Z-FAIL (espejo `vigilancia/z/`) |
| Decisión | Elevar contrato Node raíz Z a `>=22.0.0` (GO custodio) |
| Gate R12 | **R12-Z PASS** vigente (no se revoca) |
| Contexto | **PAUSA** · **sin despacho** · **sin publish** · **sin R13** |

## Cambio contractual

| archivo | antes | después |
| ------- | ----- | ------- |
| `package.json` `engines.node` | `>=18.0.0` | `>=22.0.0` |
| `package-lock.json` (raíz `packages[""].engines`) | `>=18.0.0` | `>=22.0.0` |
| CI / Docs workflows `node-version` | `'22'` | sin cambio (ya 22+) |

## Remate gobierno

**R12-Z PASS · skills-scriptorium 0.10.0 adoptado.**

- Skills: rango D-36 `>=0.10.0 <1.0.0` · lock pin `0.10.0` (tip adopción
  `3bec18a`).
- Contrato Node raíz alineado con el paquete adoptado.
- **PAUSA** vigente · 0 🔶 · 0 workers · 0 despacho · 0 `npm publish`.
- **No** R13 · **no** otros WPs · **no** amend del tip con identidad
  placeholder.

## Pedido

Reintento de gate de adopción LIB 0.10 en Z sobre el **nuevo tip** (este
commit + CI/Docs verdes). Este aviso no declara el PASS de adopción.
