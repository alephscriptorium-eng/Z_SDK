# Brief — WP-U98 · Una sola fuente de forma en el contrato

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U98 · Una sola fuente de forma en el contrato
Rama: wp/u98-contract-form
Worktree: .worktrees/wp-u98-contract-form
Reporte: plan/REPORTES/WP-U98-contract-form.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U98-contract-form.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — cola higiene; lote-higiene-11c;
dep U10 ✅; paralelo con U99 (otro worktree; superficies distintas):
- AsyncAPI (`EVENT_META` en protocol/spec) declara forma de 4 kinds;
  runtime solo valida `intent` (`isIntentShaped`) con reglas más laxas;
  `spec-sync.test` solo verifica YAML consigo mismo.
- Elegir vía y documentar en el reporte:
  · (a) derivar validadores desde `EVENT_META` → `isShaped(kind, data)`
  · (b) documentar en CONTRATO.md que solo `intent` se valida por diseño
- CA (literal BACKLOG):
  · (a): `isShaped(kind, data)` derivado de EVENT_META + test con
    evento inválido por kind rechazado
  · (b): CONTRATO.md fija el alcance; test-doc lo referencia
- Anexo trivial: tests domain-state usan `32 * 1024` a mano →
  `checkSnapshotBudget` (mismo WP si es trivial; si no, hallazgo).

Alcance orientativo:
- `packages/engine/protocol/spec/build.mjs` — `EVENT_META`
- `packages/engine/protocol/src/contract.mjs` — `isIntentShaped` /
  validación runtime
- `packages/engine/protocol/spec/CONTRATO.md`
- Tests protocol (`spec-sync`, `contract`, …) + anexo domain-state
  si aplica (`checkSnapshotBudget`)
- NO tocar WP-U93 / peer-card / webrtc / A-11 / DA-OasisTransport.
- NO implementar U99 (`makeIntent`/`game`) — otro WP del lote;
  si (a)/(b) de U98 toca docs de `makeIntent`, coordinar en hallazgo
  sin editar la firma de `makeIntent`.
- NO tocar Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Este WP es `@zeus/protocol` (engine). Cero nombres/conceptos
  exclusivos de delta/pozo en el kit. Anexo domain-state = consumidor
  delta; no filtrar nombres de juego hacia protocol.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- packages/engine/protocol/spec/build.mjs (EVENT_META)
- packages/engine/protocol/src/contract.mjs (isIntentShaped)
- packages/engine/protocol/spec/CONTRATO.md
- plan/REPORTES/WP-U10-protocol.md (origen del contrato)

Notas del orquestador:
- Lote-higiene-11c paralelo: U98 = forma contrato; U99 = game en
  makeIntent. Partición clara — no solapar firma makeIntent.
- Independiente de peer-card / U93; A-11 aún no llegó.
- Pregunta obligatoria (CA): ¿vía (a) o (b) elegida con evidencia?
  ¿CA de esa vía verde? ¿anexo checkSnapshotBudget hecho o
  hallazgo? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
