# Brief — WP-U135 · Protocolo Actions (`gh`) en roles + PRACTICAS

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **GO usuario** · **D-27** · Fase 0 + (b) ligera (informe investigación
swarm). Micro solo gobernanza `plan/`.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U135 · Protocolo Actions (`gh`) en roles + PRACTICAS
Rama: wp/u135-protocolo-actions-gh
Worktree: .worktrees/wp-u135-protocolo-actions-gh
Reporte: plan/REPORTES/WP-U135-protocolo-actions-gh.md

1 WP = este chat. NO editar plan/BACKLOG.md estados 🔶/✅.
Leer plan/PRACTICAS.md entero + roles ORQUESTADOR/WORKER/REVISION/BRIEF +
  roles/README + REPORTES/PLANTILLA.md.

Política (Fase 0+(b)):
- Solo gobernanza plan/. Sin tocar .github/workflows ni código de producto.
- Canónico: `gh run list` / `gh run view` (adaptador CLI).
- NO inventar MCP / Automations / Cursor-in-CI como obligatorios.
- NO workflow_dispatch de publish/release al worker; NO volcar secrets.
- Commits + push OK. NO merge a main.

Edits concisos (estilo existente, español, tablas cortas):

1. plan/roles/ORQUESTADOR.md
   - Ritual: `gh run list` (CI/Docs del tip); resumen post-merge.
   - Prohibido: secrets / dispatch publish al worker.

2. plan/roles/REVISION.md
   - Antes de ✅: checks Actions del tip de la rama.
   - N/A si paths-ignore U104 (solo plan/** / **.md → CI no corre).
   - Devolver si solo hay verde local cuando el CA implica runner.

3. plan/roles/WORKER.md
   - Tras push: citar run_id/conclusion o N/A (paths-ignore).
   - Verde local ≠ gate CI.
   - No workflow_dispatch publish/release; no volcar secrets.

4. plan/roles/BRIEF.md y/o roles/README.md
   - Línea: evidencia CI / adaptador `gh`.

5. plan/PRACTICAS.md
   - Evidencia Actions como literal (como tests/lint).
   - §5: gates CI en wp/* (y N/A paths-ignore).
   - §7: estado `esperando CI` cuando aplique.
   - §8 C8: nota Pages vs local si cabe (sin inventar gate nuevo).

6. plan/REPORTES/PLANTILLA.md
   - Subsección «Evidencia CI» (run_id / conclusion / N/A).

CA:
- Diff solo plan/ gobernanza (roles + PRACTICAS + PLANTILLA + este reporte).
- Texto accionable; `gh run*` canónico.
- No MCP/extensión obligatorios; no secrets en reportes.

Demolición: N/A (gobernanza).

Empieza: sitúate en el worktree, edita, reporta desde PLANTILLA (incluye
  la nueva sección CI en el propio reporte).
```
