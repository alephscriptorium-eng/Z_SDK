# Brief — WP-U145 · Dependencia registry `@alephscript/skills-scriptorium@0.3.0`

Orquestador · 2026-07-20 · GO Sprint 4 (ejecución diferida D-35).

```text
(rol) plan/roles/WORKER.md

WP: WP-U145 · Dependencia registry @alephscript/skills-scriptorium@0.3.0
Rama: wp/u145-dep-skills-scriptorium
Worktree: sí (lote paralelo con U146)
Reporte: plan/REPORTES/WP-U145-dep-skills-scriptorium.md

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-35 (adopción como referencia versionada)
- .npmrc raíz (scope @alephscript ya apunta al registry propio)
- emmanuel-sdk plan/REPORTES/WP-I60-activacion-skill.md §CA2 (patrón de
  evidencia npm view — solo lectura, repo ajeno, no tocar)

Tarea:
1. package.json raíz: añadir devDependency
   "@alephscript/skills-scriptorium": "0.3.0"  ← EXACTA, sin ^ ni ~
   (es referencia versionada canónica: el pin es doctrina, D-35).
2. npm install (el registry sale de .npmrc; no pasar --registry a mano
   salvo evidencia npm view, donde sí se explicita como en I60).
3. Verificar contenido instalado: skills/vigilancia, swarm-orquestacion,
   site-web, _plantilla bajo node_modules/@alephscript/skills-scriptorium/.

CA:
1. node_modules/@alephscript/skills-scriptorium/skills/vigilancia/SKILL.md
   existe (ls literal en reporte).
2. npm view @alephscript/skills-scriptorium@0.3.0 version → 0.3.0, exit 0
   (salida literal).
3. git diff --name-only solo: package.json, package-lock.json, reporte.

Notas del orquestador:
- NO tocar plan/roles/ (eso es U146, en vuelo en paralelo). Cero solape.
- Ceguera (PRACTICAS): la única cita de procedencia permitida es el nombre
  versionado del paquete.
- Evidencia CI: tras push, gh run list --branch wp/u145-dep-skills-scriptorium
  → run_id/conclusion; si solo package*.json dispara CI, reportarlo.
- Prohibido volcar tokens/secrets del registry en el reporte.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
