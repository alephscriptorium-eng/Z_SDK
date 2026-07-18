# Brief — WP-U122 · Auth durable registry `_password` (⬜ · no asignar aún)

_Plantilla lista. Asignar tras **U119 ✅** (final del sprint; ops carga secret)._

Origen: Sprint 1 · ENTREGA-18d · D-24 modelo **(a)**.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U122 · release.yml → patrón _password (basic-auth durable)
Rama: wp/u122-registry-password-auth
Worktree: (crear al asignar) .worktrees/wp-u122-registry-password-auth
Reporte: plan/REPORTES/WP-U122-registry-password-auth.md

Deps: U119 ✅ (gate CI). Secret lo carga OPS tras merge — no inventar tokens.

Alcance:
- Cambiar bloque auth de .github/workflows/release.yml al patrón
  _password (user + password base64), alineado a .npmrc.example del
  registry / D-24 (a).
- Sin secret: skip ⏳ limpio (no morir en test).
- NO publish real en el WP; evidenciar el wiring + skip path.

CA: con secret presente + tests verdes → npm view @zeus/protocol
  --registry=… (⏳ si ops aún no cargó secret — documentar);
  sin secret → skip ⏳ limpio.

Demolición: wiring _authToken / JWT-as-NPM_TOKEN como única vía.

NO editar plan/BACKLOG.md. NO U55 (demoler file: es siguiente, ops).
NO commitear credenciales.
```
