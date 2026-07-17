# Brief — WP-U24 · authority-kit fuerza envelope `game`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U24 · authority-kit fuerza envelope `game`
Rama: wp/u24-envelope-game
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u24-envelope-game
Reporte: plan/REPORTES/WP-U24-envelope-game.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U24-envelope-game.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Cerrar A-02: `startAuthority` exige `game` (string no vacío) y publica
  `state|track|ledger` vía `makeEnvelope` de `@zeus/protocol` (hoy el kit
  no cablea `makeEnvelope` en producción; payloads salen sin `game`).
  Intent ya va tipado; objetivo 4/4 kinds con `game`.
- CA:
  · tests del kit asertan `payload.game` en state/track/ledger
  · autoridad delta instancia el kit y `test:arg` / `e2e:arg` verdes
  · cero nombres de juego en el kit (el `game` lo inyecta el caller)
- Demolición:
  · publicación de payloads sueltos sin envelope en el kit

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md § authority-kit / contrato único
- packages/lib/authority-kit (startAuthority, emisión state/track/ledger)
- packages/lib/protocol (makeEnvelope; campo `game`)
- packages/arg/arg-demos (autoridad delta que instancia el kit)
- Cola hallazgos U11: dual-wire / A-05 — NO mezclar en este WP
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Lote 2b paralelo con U21 y U22. Gate pre-U23: U23 NO se toma hasta que
  este WP esté ✅. Merge preferido temprano (pocos conflictos con vistas).
- NO implementar U21, U22 ni U23. No tocar dual-wire (A-05).
- Caller (delta) pasa `game: 'delta'` (o el id canónico ya usado); el kit
  no hardcodea nombres de juego (regla de los dos juegos / gate U00).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo puede arrancar autoridad
  solo pasando `game: 'pozo'` sin tocar el kit?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
