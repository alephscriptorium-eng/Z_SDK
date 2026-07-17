# Brief — WP-U80 · `@zeus/linea-kit`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U80 · `@zeus/linea-kit`
Rama: wp/u80-linea-kit
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u80-linea-kit
Reporte: plan/REPORTES/WP-U80-linea-kit.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U80-linea-kit.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 7; lote-post5; paralelo con U56
(otro worktree); diseño en plan/DATOS.md:
- Nacer `@zeus/linea-kit` (paquete **engine**): formatos canónicos de
  DATOS.md §2 como JSON Schemas + validador:
  · nodos.yaml, manifests tronco/satélite, registro, snapshots,
    nodo-sections, registry, sidecars de cache, volumes.json
- **Loader** de lectura generalizado extraído de
  `packages/mesh/linea-system` (layout post-U51; path vivo — no
  `packages/mcp/…`): nodo→secciones→registros, resolución por año/oldid.
- Unificar en el schema la cadena de curación
  (`delta_status` / `labeled` / `editorialStatus` → un solo enum).
- Familia **force/cota** (DATOS.md §8, D-19): schema `force.json`,
  registry agregado con `session_budget`/exclusiones, corpus de escenas
  con cobertura; cotas como corpus con rol `sima|cima`.
- Browser-safe el modelo; node-only el fs.
- CA:
  · datos vivos `VOLUMES/DISK_02/LINEAS`, `DISK_01/FIREHOSE`,
    `DISK_03/FORCES` (fixture force/cota ya en repo, formato v0 en su
    README) validan contra los schemas **sin tocarlos**
  · linea-system y arg-feeds consumen el kit (diff negativo de API
    pública / comportamiento)
  · regla de los dos juegos: el kit no nombra juegos ni forces concretas
- Demolición: el loader duplicado en linea-system (debe importar el kit).

Alcance orientativo:
- Nuevo paquete bajo `packages/engine/linea-kit` (nombre `@zeus/linea-kit`),
  workspace + exports + tests de validación.
- Portar/generalizar loader desde `packages/mesh/linea-system/src/loader.mjs`
  (y helpers de lectura relacionados) → kit; linea-system queda fino.
- Schemas force/cota alineados al fixture DISK_03 (README formato v0).
- Consumers: linea-system + arg-feeds (ajustar imports; no reescribir
  producto de feeds más allá del consumo del kit).
- NO implementar U81 (herramientas segmentar/crear-linea) — solo formatos
  + loader + validador. U81 viene después (dep U80).

Regla de los dos juegos (PRACTICAS §1.11):
- El kit es engine: cero nombres de juego (`delta`, `pozo`, …) y cero
  forces concretas hardcodeadas. Validar fixtures genéricos / VOLUMES
  sin acoplar el modelo a un juego.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §2 (formatos canónicos) y §8 (forces/cotas)
- plan/DECISIONES.md D-19 (y D-13/D-14 si tocas files-first)
- plan/ARQUITECTURA.md §2/§4 (dónde vive un paquete engine)
- packages/mesh/linea-system/ (loader vivo a generalizar)
- VOLUMES/DISK_02/LINEAS, DISK_01/FIREHOSE, DISK_03/FORCES (+ READMEs)
- packages que consuman linea hoy (arg-feeds / feeds)

Notas del orquestador:
- Lote-post5 paralelo con U56 (session-wire mesh). Particionar: U80 =
  engine/datos/VOLUMES schemas; U56 = mesh DJ sockets. No pisar
  player-ui / socket-server.
- Ola 6 / U55 / U60+ pausados (sin credenciales/registry) — no tocarios.
- U81+ no asignados: no portar tools de segmentación en este WP.
- Pregunta obligatoria (CA): ¿VOLUMES DISK_01/02/03 validan sin mutar
  datos? ¿linea-system consume kit (loader demolido allí)? ¿gates +
  regla dos juegos verdes? ¿browser-safe vs node-only documentado?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
