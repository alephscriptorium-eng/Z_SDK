# Brief — WP-U120 · Prosa portal zeus/docs

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: Sprint 1 · ENTREGA-18d · **D-24**. Dep **U119 ✅**. **Paralelo con U121.**
**Heros/lemas EXENTOS.** Solo zeus/docs — no library.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U120 · Refactor prosa docs/ (zeus, ~23 md)
Rama: wp/u120-prosa-zeus-docs
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u120-prosa-zeus-docs
Reporte: plan/REPORTES/WP-U120-prosa-zeus-docs.md

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md.
Commits convencionales. Rama principal = main.

Política:
- Commits + push OK en rama WP.
- NO merge a main. NO U121 / U122 / U55.
- NO tocar heros/lemas de marca (D-24).
- NO Z_SDK-games-library/docs (eso es U121).

Alcance:
- Nueva guide/estado.md: mover WP-U## / D-## / «ola» / ⏳ / fechas de estado.
- Arreglar comandos rotos (p.ej. getting-started.md).
- Contador «dos juegos» → regla paramétrica.
- Tabla paquetes mínima + puntero a fuente viva.
- P1-sin-negación en doctrinales (no heros).

CA:
- docs:build verde
- grep en doctrinales (excl. guide/estado.md):
  WP-U|D-[0-9]|ola [0-9]|⏳|puede estar|consultado 20 → 0
- bloques de comando spot-check corren tal cual
- heros intactos

Demolición: prosa swarm/estado en doctrinales; números muertos en producto.

Lecturas: plan/REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md bloque B; D-24; docs/.

Empieza: sitúate en el worktree, lee PRACTICAS, implementa.
```
