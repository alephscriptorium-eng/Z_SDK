# Brief — WP-U92 · Intents de force: el sistema inyecta entropía

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U92 · Intents de force: el sistema inyecta entropía
Rama: wp/u92-force-intents
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u92-force-intents
Reporte: plan/REPORTES/WP-U92-force-intents.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U92-force-intents.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 7; lote-7b; dep U91 ✅, U30 ✅;
paralelo con U83 (otro worktree):
- Dominio gana `force:activate` / `force:deactivate` con roles
  `operator` / `dj`.
- Autoridad valida contra registry del volumen FORCES:
  `session_budget`, `pairs_with`, exclusiones declaradas — las reglas
  viven en los datos; el reducer solo las aplica.
- Asiento en ledger; escenas ancla de forces activas → tracks.
- Cotas: estado de ronda expone posición entre sima y cima (polos
  colapso/victoria ganan corpus navegable como track).
- CA:
  · tests de reducer — 3ª force = rechazo explicable (dry-run);
    par excluido = rechazo; activación válida = asiento + track
    navegable
  · delta y pozo consumen el mecanismo (regla de los dos juegos)
- Demolición: n/a (adición al dominio).

Alcance orientativo:
- Intents + reducer + ledger/track en dominio/authority (dónde viva el
  patrón U30 de intents de juego / kit) consumiendo registry vía
  loader U91 / schemas U80 — no reimplementar el MCP read-only.
- NO U83 (tramas crecer/vaciar en CASOS) — otro WP / otro worktree.
- NO mutar corpus DISK_03; rules = datos del registry.
- VOLUMES / worktrees: `ZEUS_VOLUMES_ROOT=<repo-principal>/VOLUMES`
  si necesitas DISK_03 (gitignored no se hereda). Fixtures del kit
  para CI si hace falta.

Regla de los dos juegos (PRACTICAS §1.11):
- Mecanismo genérico en engine/dominio compartido: cero forces concretas
  hardcodeadas. Delta y pozo consumen (mínimo: cableado / tests que
  demuestren consumo en ambos). Gate.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §8 (forces/cotas)
- plan/DECISIONES.md D-19
- plan/REPORTES/WP-U91-forces-loader.md (MCP force:// + registry)
- plan/REPORTES/WP-U30-dj-intents.md (patrón intents + roles + ledger)
- plan/REPORTES/WP-U80-linea-kit.md (schemas force/cota)
- packages/mesh/force-system/ (o nombre del loader U91) + linea-kit
- VOLUMES/DISK_03/FORCES/registry.json (session_budget, exclusiones)

Notas del orquestador:
- Lote-7b paralelo: U92 = intents force; U83 = tramas crecer/vaciar.
  Conflicto bajo si U92 no edita CASOS de vaciado ni capa U82.
- Pregunta obligatoria (CA): ¿3ª force / par excluido rechazados con
  dry-run? ¿activación válida → ledger + track? ¿delta Y pozo consumen?
  Evidencia literal.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
