# Brief — WP-U99 · `game` en `makeIntent`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U99 · `game` obligatorio también en `makeIntent`
Rama: wp/u99-makeintent-game
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u99-makeintent-game
Reporte: plan/REPORTES/WP-U99-makeintent-game.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U99-makeintent-game.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — cola higiene; lote-higiene-11c;
sin urgencia (cierra higiene vigilante); dep U10+U24 ✅; paralelo
con U98 (otro worktree; superficies distintas):
- `makeIntent` deja `game` opcional (`if (game != null)`), asimétrico
  con `makeEnvelope`. Emisores actuales ya pasan `game` (U30/U92).
- Elegir vía y documentar en el reporte:
  · (a) exigirlo y lanzar si falta
  · (b) test engine 4-kinds + doc del alcance en CONTRATO.md
- CA (literal BACKLOG):
  · (a): `makeIntent` sin `game` lanza; wrappers delta/pozo verdes
  · (b): test 4-kinds + CONTRATO.md
- Demolición (a): el condicional `if (game != null)`.

Alcance orientativo:
- `packages/engine/protocol/src/contract.mjs` — `makeIntent` /
  `makeEnvelope`
- `packages/engine/protocol/spec/CONTRATO.md` (+ types si (a) cambia
  firma)
- Tests protocol; si vía (a): wrappers/emisiones delta y pozo
  (`makeIntent` callers) verdes
- NO tocar WP-U93 / peer-card / webrtc / A-11 / DA-OasisTransport.
- NO implementar U98 (forma / isShaped / EVENT_META) — otro WP;
  no reescribir validadores de forma de kinds aquí.
- NO tocar Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Cambio en `@zeus/protocol` = engine genérico. Si vía (a) toca
  wrappers de juego, solo pasar `game` — no meter lógica de juego
  en protocol. Verificar delta Y pozo si cambian callers.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- packages/engine/protocol/src/contract.mjs (makeIntent vs makeEnvelope)
- packages/engine/protocol/spec/CONTRATO.md
- plan/REPORTES/WP-U24-envelope-game.md (contexto game en envelope)
- Grep callers de makeIntent en games/delta y games/pozo

Notas del orquestador:
- Lote-higiene-11c paralelo: U99 = game en makeIntent; U98 = forma
  contrato. Partición clara — U99 no deriva isShaped desde EVENT_META.
- Sin urgencia; cierra higiene vigilante. Independiente de U93;
  A-11 aún no llegó.
- Pregunta obligatoria (CA): ¿vía (a) o (b)? ¿CA verde? Si (a):
  ¿wrappers delta/pozo verdes y condicional demolido? Evidencia
  literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
