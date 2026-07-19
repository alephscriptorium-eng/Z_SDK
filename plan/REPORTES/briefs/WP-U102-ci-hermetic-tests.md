# Brief — WP-U102 · Tests herméticos para CI

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U102 · Tests herméticos para CI
Rama: wp/u102-ci-hermetic-tests
Worktree: .worktrees/wp-u102-ci-hermetic-tests
Reporte: plan/REPORTES/WP-U102-ci-hermetic-tests.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U102-ci-hermetic-tests.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push (worker). Orquestador hará merge a main + push después.
- NO gh pr / gh pr create.
- NO npm publish real.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — lote-ci-hermetic; cierra CA remoto U03:
- Triaje run CI
  https://github.com/alephscriptorium-eng/Z_SDK/actions/runs/29634248585
  (27/31 verde; lint+gates ✅). 4 rojos = tests no herméticos, no bugs
  de producto.
- Workspaces a arreglar:
  · linea-system — ENOENT VOLUMES/DISK_02/LINEAS/registry.yaml
  · linea-firehose — mismo patrón VOLUMES
  · presets-sdk — resolveStopTargets / ZEUS_STOP_SERVICES / puertos
    zeus-docs
  · 3d-monitor — PUBLIC_ROOM < env < ?room=
- Enfoque: fixture mínima VOLUMES en el repo (o skip ⏳ honesto si no
  hay datos) + env explícito en presets-sdk / 3d-monitor. Sin ampliar
  alcance a otros WS ni a producto fuera de lo necesario para hermeticidad.
- CA (literal): run CI completamente verde en `main` (matriz + lint +
  gates). Cierra CA remoto U03 pendiente.
- Demolición: asunciones de paths/env del host en esas 4 suites (o skip
  documentado).

Alcance orientativo:
- Solo los 4 workspaces de la tabla. Fixture o skip; env explícito.
- NO “arreglar” producto real salvo que un test asuma un contrato
  incorrecto y el mínimo sea alinear el test (preferir fixture/env).
- NO tocar plan/BACKLOG.md.
- NO push hasta merge (worker no push).

Regla de los dos juegos (PRACTICAS §1.11):
- Tests/fixtures de mesh/engine — cero nombres exclusivos de delta/pozo
  en código nuevo de paquetes compartidos salvo docs de engache.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- .github/workflows/ci.yml (matriz workspaces)
- packages relevantes de los 4 WS (tests que leen VOLUMES / env / room)
- plan/BACKLOG.md cola lote 0b (WP-U03) + remate (triage → U102)
- plan/REPORTES/WP-U03-z-sdk-ci.md (contexto CA remoto)

Notas del orquestador:
- Lote-ci-hermetic: solo U102. Prep listo; worker NO lanzado aquí.
- Rama principal del repo = `main` (no master).
- Preguntas CA: ¿los 4 WS verdes en local con `npm test -w`? ¿sin
  depender de VOLUMES/DISK_02 del host? ¿env explícito en presets /
  3d-monitor? Evidencia literal. CI verde en main = CA final (tras
  merge+push del orquestador).
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
