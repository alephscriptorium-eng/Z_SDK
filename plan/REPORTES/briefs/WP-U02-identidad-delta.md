# Brief — WP-U02 · Identidad del juego: delta

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U02 · Identidad del juego: delta
Rama: wp/u02-identidad-delta
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u02-identidad-delta
Reporte: plan/REPORTES/WP-U02-identidad-delta.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U02-identidad-delta.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

WP completo (de plan/BACKLOG.md):
- (D-8) Retirar el nombre «CAUDAL» en favor de **delta**: títulos y prosa de
  `packages/arg/spec/*.md`, README de arg, y las cadenas/banners en código
  (~10 archivos: arg-console kit/vistas/server, authority, launch, contract).
  No cambia rooms, eventos ni rutas (eso es ola 5); solo la identidad.
- CA: `grep -ri CAUDAL packages/` limpio (salvo citas históricas en
  plan/DECISIONES.md); `test:arg` + `e2e:arg` verdes.
- Demolición: el nombre viejo — sin «(antes CAUDAL)» permanentes en specs;
  la historia queda en git y en D-8.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-8
- packages/arg/spec/*.md
- README de arg, arg-console, authority, launch, contract

Notas del orquestador:
- Lote 0a paralelo con U00 y U01. Merge preferido: primero entre los de la
  ola 0 (identidad antes que gates/tests si hay choque de strings).
- Solo identidad (CAUDAL→delta); no cambiar rooms/eventos/rutas (ola 5).
- Citas históricas de «CAUDAL» en plan/DECISIONES.md se quedan (CA lo dice).
- No toques gates (U00) ni tests de firehose-core/room-client-browser (U01).

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
