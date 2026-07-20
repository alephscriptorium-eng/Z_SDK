# Brief — WP-U146 · `plan/roles/` → referencia versionada + calibración zeus

Orquestador · 2026-07-20 · GO Sprint 4 (ejecución diferida D-35).

```text
(rol) plan/roles/WORKER.md

WP: WP-U146 · plan/roles/ → referencia versionada 0.3.0 + calibración local
Rama: wp/u146-roles-referencia
Worktree: sí (lote paralelo con U145)
Reporte: plan/REPORTES/WP-U146-roles-referencia.md

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-35 (esto ejecuta su parte diferida, con GO)
- emmanuel-sdk plan/REPORTES/WP-I60-activacion-skill.md — EL procedimiento
  probado (solo lectura, repo ajeno, no tocar)
- emmanuel-sdk plan/roles/README.md — resultado final de I60 (modelo)
- copia local de la biblioteca de skills (`<ruta-local-custodio>`):
  `skills/swarm-orquestacion/` y `skills/vigilancia/` — contenido 0.3.0
  (solo lectura; para calcular el delta local; citar siempre el PAQUETE,
  nunca esa ruta local)

Tarea (I60 adaptado a zeus / 0.3.0):
1. git rm plan/roles/{ORQUESTADOR,WORKER,REVISION,CORRECCION,BRIEF}.md
   (copias del protocolo genérico; su fuente pasa a ser el paquete).
2. Reescribir plan/roles/README.md como referencia versionada:
   paquete @alephscript/skills-scriptorium · versión FIJADA 0.3.0 ·
   skills swarm-orquestacion + vigilancia · registry
   npm.scriptorium.escrivivir.co · bloque npm view / npm install.
3. Calibración local zeus (lo que el genérico NO fija y este mundo sí):
   compara los prompts borrados con el contenido del paquete y conserva
   SOLO el delta. Candidatos detectados por el orquestador (verifícalos):
   - separación backlog refundación vs packages/games/delta/spec/BACKLOG.md
   - adaptador de evidencia CI = gh CLI + paths-ignore U104 (CI N/A si
     solo plan/** / **.md)
   - límites Actions del swarm (secrets, workflow_dispatch de publish)
   - dominios/portales propios (z-sdk.escrivivir.co, games.*)
4. Coser plan/README.md y plan/PRACTICAS.md: «autocontenido» =
   «autocontenido vía referencia versionada, resoluble por npm view».

CA (I60 §CA1–CA5 adaptado):
1. Dedup: grep de cabeceras de prompt genérico en plan/ → exit 1;
   ls plan/roles/ = README.md solo.
2. npm view @alephscript/skills-scriptorium@0.3.0 version → exit 0
   (salida literal).
3. Calibración local visible sin abrir el paquete (grep literal).
4. git diff --name-only main...HEAD solo plan/.
5. Ceguera: 0 términos-marco en diff y en árbol público (patrón en
   PRACTICAS; no transcribir el literal del marco en el reporte).

Notas del orquestador:
- NO tocar package.json / node_modules (eso es U145, en paralelo).
- BACKLOG no lo editas tú (ya está el 🔶 del orquestador).
- Este WP ejecuta la «sustitución gradual» que D-35 difirió — el GO
  existe (Sprint 4); cítalo en el reporte.
- Evidencia CI: tras push, esperado N/A por paths-ignore U104 (solo
  plan/**) — verificar con gh run list y decirlo explícito.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
