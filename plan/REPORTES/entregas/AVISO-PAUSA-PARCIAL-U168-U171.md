# AVISO · PAUSA parcial · obra autorizada solo U168–U171

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | workers · SOL · custodio (carril Z) |
| Fecha | 2026-07-25 |
| Motivo | **Levantar PAUSA únicamente** para Sprint 9 / R12 (U168–U171) |
| Autorización | TICK custodio · secuencia P0×4 · GO impl. U168–U171 |
| Gate plan | **R12-Z PASS** vigente · **R13-Z PASS** planificación (sin GO impl. R13) |
| GO publish | **D-42** condicionado P0×4 (ya vigente; completar condiciones) |
| Espejo | `C:\S_LAB\vigilancia\z\AVISO-PAUSA-PARCIAL-U168-U171.md` |

## Mandato

**PAUSA parcial.** Queda autorizada **solo** la obra de:

| WP | ola | qué |
| -- | --- | --- |
| **U168** | A | major-band P0×4 |
| **U170** | A (∥) | contrarrevisión independiente (PRACTICAS) |
| **U169** | B | gate publish-ready major-band |
| **U171** | C | prep pub / changesets dry (**sin** `npm publish` manual) |

Olas: `U168 ∥ U170` → `U169` → `U171`.

## Sigue en PAUSA (sin despacho)

- **R13** / U172–U177 / épica **U73** (aunque exista R13-Z PASS de planificación).
- **U178** (publish-ready `linea-editor`).
- Demoliciones / merges / publish fuera de U168–U171.
- Flip `private` · `npm publish` manual · Release publish efectivo hasta
  cumplir **todas** las condiciones D-42 + evidencia orquestador.

## Fronteras duras

- **Cero** `npm publish` manual en esta secuencia.
- **Cero** abrir R13 ni U172–U178/U73.
- **Cero** force push.
- DC-15 LOCAL-ONLY (sin Issues nuevos).
- Contrarrevisión PASS documentada en WPs de riesgo antes de ✅.
- Identity: `WORLD_ROOT=C:/S_LAB/z-sdk` ·
  `CANONICAL_WORLD_ROOT=C:/S_LAB/z-sdk` ·
  `READ_ONLY_ROOTS=["C:/S_LAB/.worktrees"]` ·
  `DOWNSTREAM_PATTERNS=[".worktrees/*"]`.

## Cara scrum (copiable)

```text
PAUSA PARCIAL Z — obra solo U168–U171 (Sprint 9 / R12).
Olas: U168∥U170 → U169 → U171.
Resto (R13, U172–U178, U73, demoliciones) sigue en PAUSA.
GO publish P0×4 = D-42 condicionado (sin npm publish manual ahora).
Sin force push. Sin abrir R13.
```
