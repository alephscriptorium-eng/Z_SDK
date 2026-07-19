# Brief — WP-U131 · Documentar publicar la web (pipeline docs)

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: Sprint 2 · ADDENDA bloque **D** · **D-25**. Cabe ∥ A.
Este es el WP de **pipeline documental** (VitePress/Pages), no release npm.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U131 · docs/guide/publicar-la-web.md (+ puntero library)
Rama zeus: wp/u131-publicar-la-web
Worktree zeus: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u131-publicar-la-web
Rama library: wp/u131-publicar-la-web
Worktree library: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u131-publicar-la-web
Reporte: plan/REPORTES/WP-U131-publicar-la-web.md (zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero.
NO aplicar CAPA (U124/U125). NO tocar release-startpack (U126).

Política:
- Commits + push OK. NO merge a main.
- Estilo post-U120: doctrina operativa, SIN refs WP-U## / D-## en la página.
- Spot-check contra workflows reales (.github/workflows/docs.yml); cero
  pasos inventados.
- Puntero corto equivalente en library (enlace o réplica breve).

Fuente: plan/ENTREGA-2026-07-19-sprint2/00-ADDENDA.md bloque D

Alcance:
1. zeus: docs/guide/publicar-la-web.md (o equivalente) — ciclo completo:
   editar docs/ · docs:dev · docs:build · push docs/** → Actions → Pages
   (o workflow_dispatch) · custom domain + CNAME + Enforce HTTPS ·
   catálogo library alimentado por GitHub Releases
2. library: puntero corto (página o párrafo en docs existentes)
3. Enlazar desde nav/sidebar solo si hace falta para que sea alcanzable
   (mínimo; documentar)

CA:
- Página existe; comandos citados corren tal cual
- Descripción calza con docs.yml real
- Library enlaza o replica en corto
- docs:build OK en repos tocados

Demolición: N/A.

Empieza: worktrees, lee docs.yml + Pages reality, escribe, verifica, reporta.
```
