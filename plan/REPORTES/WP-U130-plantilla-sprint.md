# WP-U130 · plantilla-sprint — reporte

| dato | valor |
| ---- | ----- |
| agente | cursor-swarm (worker U130) |
| fecha | 2026-07-19 |
| rama | `wp/u130-plantilla-sprint` |
| commit(s) | `b1d3185` · `b063842` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se formalizó el ciclo de sprint ya probado en `plan/PRACTICAS.md` §7
(entrada con GO, ejecución con CA/Devuelto, cierre con estado declarado,
retro a residuales). Se enlazó desde `plan/roles/README.md` y el ritual de
`ORQUESTADOR.md`. Se estrenó el cierre de Sprint 2 con acta
`REPORTES/entregas/ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md` usando la fórmula
`esperando: revisión+merge U130 de orquestador`. No se editó
`plan/BACKLOG.md`.

## Archivos tocados

- modificado `plan/PRACTICAS.md` — §7 Ciclo de sprint (gobernanza)
- modificado `plan/roles/README.md` — sección Ciclo de sprint + puntero §7
- modificado `plan/roles/ORQUESTADOR.md` — ritual: estado declarado
- creado `plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md` — estreno cierre
- modificado `plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-INDICE.md` — fila acta
- creado `plan/REPORTES/WP-U130-plantilla-sprint.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Texto del ciclo existe (PRACTICAS §7 + roles):

```
$ rg -n "Ciclo de sprint|IDLE sin pendientes|esperando:" \
    plan/PRACTICAS.md plan/roles/README.md plan/roles/ORQUESTADOR.md \
    plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md

plan/roles/ORQUESTADOR.md:43:   (`IDLE sin pendientes` o `esperando: <tick> de <quién>`; PRACTICAS §7).
plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md:19:> **esperando: revisión+merge U130 de orquestador**
plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md:22:pasar a **`IDLE sin pendientes`** …
plan/PRACTICAS.md:141:## 7. Ciclo de sprint (gobernanza)
plan/PRACTICAS.md:171:| `IDLE sin pendientes` | …
plan/PRACTICAS.md:172:| `esperando: <tick> de <quién>` | …
plan/roles/README.md:55:## Ciclo de sprint
```

- Estreno cierre Sprint 2 (acta declara estado §7):

```
> **esperando: revisión+merge U130 de orquestador**
```

- Worker no tocó BACKLOG:

```
$ git diff main -- plan/BACKLOG.md
(sin salida)
```

- Lint/tests/gates: N/A (WP gobernanza markdown; sin código de producto).

## Demolición

N/A (gobernanza; no se demuele código).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (plan/)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: no; formaliza práctica ya usada
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (`IDLE` / `esperando:`
      son la fórmula del ADDENDA)
- [x] Demolición completa: N/A
- [x] Tests prueban comportamiento: N/A (gobernanza)
- [x] Arranque real verificado: N/A
- [x] README/specs del paquete: roles/README actualizado a propósito
- [x] El diff contiene solo el alcance del WP: sí (plan/ gobernanza + acta +
      reporte; cero BACKLOG)

## Hallazgos fuera de alcance

Ninguno nuevo. La retro del sprint (preserveSymlinks Windows, dispatch
startpack, nav solve-coagula, cache vitepress library, DNS ops) ya está
listada en el acta para que el orquestador la deje en cola residual al ✅
— sin abrir WPs sin GO.

## Dudas / bloqueos

Ninguno. Tras ✅: remate BACKLOG → `IDLE sin pendientes` (salvo ticks ops
DNS ajenos al lote).

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-19 · tip claim `2b448be`
(`b1d3185` · `b063842` · `2b448be`).

Verificado:
- Diff `main...wp/u130-plantilla-sprint` = 6 archivos plan/ (PRACTICAS §7,
  roles README + ORQUESTADOR, acta + índice ENTREGA, reporte). Cero código
  de producto; worker **no** tocó `plan/BACKLOG.md`.
- CA brief / ADDENDA C: texto del ciclo existe (entrada GO / ejecución CA /
  cierre estado declarado / retro residuales); acta estrena
  `esperando: revisión+merge U130 de orquestador`.
- PRACTICAS §2 alcance OK; §3 auto-revisión honesta; §6 commits
  `docs(plan|reportes)`.

**Merge:** `wp/u130-plantilla-sprint` → `main`. Tras merge: remate BACKLOG
→ **IDLE sin pendientes** (0 🔶); acta a estado cerrado; `git worktree
remove`. Residuales del sprint anotados en cola viva (sin WP nuevos sin GO).
