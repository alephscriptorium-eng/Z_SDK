# Brief — WP-U11 · `@zeus/authority-kit`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U11 · @zeus/authority-kit
Rama: wp/u11-authority-kit
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u11-authority-kit
Reporte: plan/REPORTES/WP-U11-authority-kit.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U11-authority-kit.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Autoridad genérica extraída de `arg-demos/apps/authority`:
  · loop de tick
  · aplicación de intents vía reducer registrado
  · emisión state/ledger/track
  · presupuesto de snapshot
  · arranque/parada limpios (sin huérfanos: cascada SIGINT ya
    resuelta en `arg-demos/launch.mjs` — se hereda, no se reinventa)
- CA:
  · la autoridad de delta queda instanciando el kit (diff negativo
    en arg-demos)
  · `e2e:arg` y `test:arg` verdes sin tocar los tests
- Demolición:
  · el código genérico que quede duplicado en arg-demos

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md § layout engine/authority-kit + §4 deps
- plan/DECISIONES.md D-2 (contrato único) y D-8 (dos juegos)
- packages/lib/protocol (U10 ✅) — envelope, roles, Peer Card helpers
- packages/arg/arg-demos/apps/authority (fuente a extraer)
- packages/arg/arg-demos/launch.mjs (cascada SIGINT; heredar)
- packages/arg/arg-domain (reducer / applyIntent)

Notas del orquestador:
- Lote 1b paralelo con WP-U12. NO implementar U12 ni U13.
- Merge preferido: U11 y U12 pueden mergearse en cualquier orden
  tras aceptación; no comparten superficie esperada.
- Hallazgo U10 (obligatorio atender en este WP / documentar decisión):
  · migrar wire `arg:*` → kinds canónicos en el cableado de autoridad
    (+ vistas quedan fuera si no entran en demolición; anotar en hallazgos)
  · Peer Card handshake: ¿exigir Peer Card en handshake de room en U11
    o basta `role` en el intent hasta ola WebRTC? Decidir y documentar
    en el reporte (si bloquea producto → DECISIONES §abiertas; si no,
    justificación en reporte). Helpers U10 ya listos
    (`makePeerCard` / `peerCardGrantsRole`); la autoridad aún no exige
    card en cada intent.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo puede consumir
  @zeus/authority-kit tal cual?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
