# Brief — WP-U94 · Una sola fuente por transición del dominio

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U94 · Una sola fuente por transición del dominio
Rama: wp/u94-domain-source
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u94-domain-source
Reporte: plan/REPORTES/WP-U94-domain-source.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U94-domain-source.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — cola higiene; lote-higiene-11b;
prioridad anti-propagación; dep U30+U83 ✅; paralelo con U96
(otro worktree; superficies distintas):
- en `games/delta/arg-domain`: curate (gate `reducer` ↔ mutador
  `line-board`) y vaciar (gate ↔ `flow-engine`) duplican codes;
  `domain-state.mjs` invoca mutadores sin comprobar `{ok,error}` en
  4 sitios.
- Exportar por mecánica una función pura de validación que consuman
  gate y mutador; domain-state comprueba el resultado o documenta por
  qué el gate previo lo hace redundante.
- CA (literal BACKLOG):
  · cada regla y sus codes en un solo sitio
  · test por mecánica: caso inválido → gate y mutador el mismo error
    desde la misma función
  · cero mutadores invocados sin comprobar resultado
  · tests arg-domain verdes
- Demolición: copias de arrays de orden / error codes.

Alcance orientativo:
- `packages/games/delta/arg-domain/src/reducer.mjs` — gates curate /
  vaciar
- `packages/games/delta/arg-domain/src/line-board.mjs` — mutador curate
  (y hermanos de orden de status)
- `packages/games/delta/arg-domain/src/flow-engine.mjs` — mutador vaciar
- `packages/games/delta/arg-domain/src/domain-state.mjs` — invocaciones
  sin comprobar `{ok,error}`
- Tests: `test/reducer.test.mjs`, `test/line-board.test.mjs`,
  `test/flow-engine.test.mjs`, `test/empty.test.mjs`,
  `test/domain-state.test.mjs` (+ nuevos tests de fuente única)
- NO tocar WP-U93 / peer-card / webrtc / A-11.
- NO implementar U96 (SSR registry) — otro WP del lote.
- NO tocar U98/U99 ni Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Este WP es dominio **delta** (`arg-domain`). No meter nombres/
  conceptos exclusivos de delta en paquetes engine. Pozo no se toca
  salvo que un test de matriz lo exija por regresión (no es el caso).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- Los 4 src listados arriba + tests asociados
- plan/REPORTES/WP-U83-crecer-vaciar.md (contexto vaciar)
- plan/REPORTES/WP-U30-dj-intents.md (contexto curate/milestone)

Notas del orquestador:
- Lote-higiene-11b paralelo: U94 = fuente única dominio delta;
  U96 = registro SSR. Partición clara — no solapar.
- Prioridad anti-propagación: rules/codes duplicados se replican;
  unificar YA.
- Independiente de peer-card / U93; sin credenciales.
- Pregunta obligatoria (CA): ¿cada regla/code en un solo sitio?
  ¿test por mecánica (mismo error gate+mutador desde misma fn)?
  ¿cero mutadores sin comprobar resultado? ¿tests arg-domain
  verdes? ¿Demolición de copias de orden/codes? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
