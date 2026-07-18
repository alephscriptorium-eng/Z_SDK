# Brief — WP-U122 · Auth durable registry `_password`

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: Sprint 1 · ENTREGA-18d · **D-24 (a)**. Dep **U119 ✅** (+ prosa U120/U121 ✅).
Ops carga secret tras merge — **no inventar tokens**.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U122 · release.yml → patrón _password (basic-auth durable)
Rama: wp/u122-registry-password-auth
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u122-registry-password-auth
Reporte: plan/REPORTES/WP-U122-registry-password-auth.md

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero.
Reporte desde plan/REPORTES/PLANTILLA.md.
Commits convencionales. Rama principal = main.

Política:
- Commits + push OK en rama WP.
- NO merge a main. NO U55. NO commitear credenciales / .env secretos.
- NO inventar NPM_TOKEN ni passwords en el repo.

Alcance:
- Cambiar auth de .github/workflows/release.yml al patrón _password
  (user + password base64), alineado a .npmrc.example del registry / D-24 (a).
- Sin secret: skip ⏳ limpio (no morir en quality/test).
- Evidenciar wiring + path skip; publish real = ops post-merge.

CA:
- con secret presente + tests verdes → npm view @zeus/protocol --registry=…
  (⏳ documentar si ops aún no cargó secret);
- sin secret → skip ⏳ limpio.

Demolición: wiring _authToken / JWT-as-NPM_TOKEN como única vía en workflow.

Lecturas: ENTREGA-18d bloque C; D-24; .github/workflows/release.yml;
  cualquier .npmrc.example del registry / docs publish.

Empieza: sitúate en el worktree, lee PRACTICAS, implementa.
```
