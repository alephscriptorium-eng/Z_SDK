# Brief — WP-U81 · Herramientas de segmentación del dramaturgo

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U81 · Herramientas de segmentación del dramaturgo
Rama: wp/u81-segmentacion
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u81-segmentacion
Reporte: plan/REPORTES/WP-U81-segmentacion.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U81-segmentacion.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 7; lote-7a; dep U80 ✅; paralelo con
U82 y U91 (otros worktrees); diseño en plan/DATOS.md:
- Portar el CONCEPTO (no línea a línea) de los pythons de referencia
  (segment_linea, segment_poder, fetch_wp_historia, fetch_snapshot —
  punteros DATOS.md §7) a herramientas JS del kit de línea.
- Tools:
  · `crear-linea` — scaffolding desde placeholders (nodos.yaml ejemplo,
    registry, carpetas)
  · `segmentar` — historial → manifest con milestones por reglas
  · `conectar-satelite` — instrucciones/config MCP satélite + remotos
    wiki/ATProto/SSB
  · `fetch` — materializar snapshots con gate de aprobación
  · `segmentar-force` (D-19) — contextos conversacionales → escenas
    prompt/think/output con anclas y cobertura; trace fuera
    (IMPORT_NOTES.md de DISK_03 = spec informal)
  · `crear-cotas` — autoría de líneas de cota (sima|cima)
- Starterkits documentados: «crea tu línea en 30 minutos» y «crea tu
  force en 30 minutos».
- Contrato = validador U80; las tools son cortesía. El dramaturgo puede
  segmentar con lo que prefiera — entra al mesh si valida.
- CA:
  · con el starterkit se crea una línea sintética de juguete E2E
    (tronco 3 nodos + satélite con 10 registros) que valida contra U80
    y se sirve por un linea-system apuntado a ella; tutorial documentado
- Demolición: n/a (nacimiento; pythons viven en network-engine, fuera).

Alcance orientativo:
- Extender `@zeus/linea-kit` (post-U80) con CLI/API de las tools +
  starterkits + docs/tutorial.
- Salida de tools debe validar con los schemas del kit (no inventar
  formatos).
- NO portar pythons línea a línea; NO tocar U82 (medir/vaciar) ni U91
  (loader MCP FORCES) ni U83/U92.
- Fixture / volúmenes: si hace falta DISK real, usa
  `ZEUS_VOLUMES_ROOT=<repo-principal>/VOLUMES` (worktrees no heredan
  DISK gitignored). DISK_03: hallazgo U80 (gitignore vs D-19) — no
  arreglar gitignore aquí salvo que bloquee el CA; fixtures del kit
  bastan para CI.

Regla de los dos juegos (PRACTICAS §1.11):
- Tools en engine: cero nombres de juego; cero forces concretas
  hardcodeadas. Starterkits genéricos / sintéticos.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §2, §7 (pythons/punteros), §8 (forces/cotas)
- plan/DECISIONES.md D-19
- plan/REPORTES/WP-U80-linea-kit.md (kit vivo + hallazgos VOLUMES)
- packages/engine/linea-kit/
- packages/mesh/linea-system/ (consumidor a apuntar en CA)
- VOLUMES/DISK_03/FORCES/IMPORT_NOTES.md (spec informal segmentar-force)

Notas del orquestador:
- Lote-7a paralelo: U81 = tools/starterkits en linea-kit; U82 =
  operación medir/vaciar; U91 = MCP loader FORCES. Particionar: no
  tocar CRUD de volúmenes ni el servidor MCP force://.
- NO U83 (tramas crecer/vaciar) ni U92 (intents force) — fuera de lote.
- Pregunta obligatoria (CA): ¿línea juguete E2E valida U80 y se sirve
  por linea-system? ¿tutorial documentado? ¿gates + regla dos juegos?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
