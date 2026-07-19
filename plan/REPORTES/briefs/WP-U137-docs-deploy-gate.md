# Brief — WP-U137 · Docs deploy saltado = fallo visible

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-28** · GO vigilante post-AMEND · falso verde Pages.
Repo principal: `Z_SDK-games-library`. **Paralelo con U136.**

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U137 · Deploy saltado en main+docs/** no puede ser verde
Rama zeus: wp/u137-docs-deploy-gate
Worktree zeus: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u137-docs-deploy-gate
Rama library: wp/u137-docs-deploy-gate
Worktree library: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u137-docs-deploy-gate
Reporte: plan/REPORTES/WP-U137-docs-deploy-gate.md (en zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero (zeus).
Reporte desde plan/REPORTES/PLANTILLA.md (zeus).
Commits convencionales en ambos repos según toque.
NO mezclar con U136 / U135.
NO tocar docs de contenido (solo workflows / evidencia).

Política:
- Commits + push OK en ramas WP.
- NO merge a main. NO ✅ BACKLOG.
- No ampliar a zeus sin evidencia del mismo bug.

Paths:
- Library: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library
- Zeus (reporte + cotejo opcional): c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk

Problema:
- Workflow Docs de la library terminó `success` con job **deploy saltado**.
- AMEND horas en main sin Pages servido; nadie lo notó sin verificación
  en vivo → falso verde.

Alcance:
1. Revisar condición del job `deploy` (y upload artifact) en
   `Z_SDK-games-library/.github/workflows/docs.yml`.
2. Valorar: en push a `main` con `docs/**` tocado, deploy-saltado debe
   ser **fallo (rojo)**, no verde silencioso.
3. Implementar gate mínimo (p. ej. job assert que falle si
   `needs.deploy.result` ∈ {skipped,failure,cancelled} cuando el evento
   exige deploy en main).
4. Zeus `.github/workflows/docs.yml` tiene el mismo esquema if/main:
   **anotar** en §hallazgos. Fix simétrico solo si hay evidencia del
   mismo falso verde en zeus — no ampliar por simetría estética.

CA:
- Push a `main` con cambios en `docs/**` → el job deploy **corre y
  success**, O el workflow entero **falla de forma visible** (rojo).
- En `wp/**` / PR: deploy puede seguir saltado a propósito (build-only);
  eso NO debe pintar rojo el workflow (o documentar excepción clara).
- Documentar en reporte: causa raíz del skip observado + diff del gate +
  cómo verificar (gh run / lógica if).

Demolición: conclusión `success` del workflow Docs cuando en main+docs
el deploy no corrió.

Empieza: sitúate en worktrees, lee docs.yml library (+ cotejo zeus),
diseña gate mínimo, implementa, reporta, push ramas. NO merge.
```
