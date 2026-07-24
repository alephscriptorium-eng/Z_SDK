# AVISO DE PAUSA / CORTE TÉCNICO · custodio → todos los workers Z

| dato | valor |
| ---- | ----- |
| De | custodio (vía vigilancia Z) |
| Para | **todos los workers** del swarm Z · orquestador · SOL |
| Fecha | 2026-07-24 |
| Motivo | **Corte técnico** — pausa obligatoria de obra |
| Estado swarm | **PAUSA** (supera IDLE / planificación en curso) |
| Espejo | `C:\S_LAB\vigilancia\z\AVISO-PAUSA-CORTE-TECNICO.md` |

## Mandato (broadcast)

**PAUSAR** todo trabajo en curso.

- Si un worker estaba en **demolición / “demoler”**: **pausar ya** — no continuar demoliciones.
- **No** despachar nuevos workers.
- **No** merge / publish salvo emergencia documentada por custodio.
- **No** reanudar obra hasta aviso explícito de reanudación.

## Higiene al emitir (literal)

| check | resultado |
| ----- | --------- |
| `C:\S_LAB\.worktrees\z` | **vacío** (0 entradas) — nada que pausar en disco |
| `git worktree list` | solo checkout principal `z-sdk` |
| ramas `wp/*` | **0** |
| 🔶 en BACKLOG | **0** (solo mención protocolar) |
| Workers activos detectados | **ninguno** |

Nota de pausa sobre worktrees: directorio vacío; **no se borra** ni se toca trabajo. Si aparece worktree durante el corte: tratarlo como pausado; no demoler ni mergear.

## Fronteras durante el corte

- Cero despacho de workers.
- Cero demolición autorizada.
- Cero merge/publish salvo emergencia documentada.
- DC-15 LOCAL-ONLY (sin cambio).
- Cola R12-Z (U168–U171) permanece ⬜ — **sin avance** hasta reanudación.

## Cara scrum (copiable)

```text
AVISO PAUSA / CORTE TÉCNICO — swarm Z
A todos los workers: PAUSAR trabajo en curso.
Si demoler / demolición en curso: PAUSAR (no continuar).
Motivo: corte técnico.
No despachar workers. No merge/publish salvo emergencia documentada.
Worktrees C:\S_LAB\.worktrees\z: vacío (0). Sin workers activos.
Pausa anunciada · sin demolición autorizada.
Reanudar solo con aviso explícito de custodio/orquestador.
```
