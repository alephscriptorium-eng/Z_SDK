# Brief — WP-U10 · `@zeus/protocol`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U10 · @zeus/protocol
Rama: wp/u10-protocol
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u10-protocol
Reporte: plan/REPORTES/WP-U10-protocol.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U10-protocol.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Generalizar packages/arg/arg-domain/src/contract.mjs + spec/CONTRATO.md
  a paquete @zeus/protocol:
  · eventos state|intent|track|ledger con campo game en el envelope
  · makeIntent, validación de forma
  · roles (player|dj|operator) declarados por intent
  · gates genéricos (una autoridad por room; vistas proyectan; dominio
    puro; presupuesto de snapshot)
- Generación AsyncAPI desde este contrato (asume el rol del
  spec:generate de session-protocol).
- Estudiar Peer Card de transmedia-system como credencial de rol
  (token revocable roomId/endpoint/scopes/expiresAt). Si convence:
  roles con peer cards desde el día 1; si no: documentar por qué.
- CA:
  · arg-domain re-exporta/consume @zeus/protocol sin cambiar
    comportamiento (test:arg verde)
  · AsyncAPI generado y renderizado en el portal docs
  · tests de roles (intent de rol no autorizado ⇒ rechazo)
- Demolición:
  · el contrato duplicado dentro de arg-domain (queda solo lo
    específico de delta)
  · la parte de session-protocol que solo generaba spec
    (el resto de session-protocol muere en WP-U31)

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-2 (contrato único state|intent|track|ledger + roles;
  AsyncAPI del contrato; sesión Scriptorium se absorbe y muere en ola 3)
- plan/DECISIONES.md D-8 / PRACTICAS §1.11 (regla de los dos juegos:
  engine jamás nombra delta/pozo ni conceptos de juego)
- packages/arg/arg-domain/src/contract.mjs
- packages/arg/spec/CONTRATO.md
- session-protocol (solo la parte spec:generate que este WP absorbe)
- Peer Card / transmedia-system (credencial de rol; anotar decisión en
  reporte)

Notas del orquestador:
- Ola 1 inicio: SOLO U10. U11/U12/U13 dependen de U10 — NO implementarlos.
- NO editar plan/BACKLOG.md.
- Tras merge de U10, el orquestador asignará U11/U12 (paralelo posible).
- Pregunta obligatoria en el reporte (PRACTICAS §1.11): ¿pozo puede
  consumir @zeus/protocol tal cual?

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
