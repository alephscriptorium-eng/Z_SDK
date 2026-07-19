# Brief — WP-U03 · Z_SDK + CI

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U03 · Z_SDK + CI
Rama: wp/u03-z-sdk-ci
Worktree: .worktrees/wp-u03-z-sdk-ci
Reporte: plan/REPORTES/WP-U03-z-sdk-ci.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U03-z-sdk-ci.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

WP completo (de plan/BACKLOG.md):
- Push del monorepo a github.com/alephscriptorium-eng/Z_SDK (rama main).
- GitHub Actions: en cada PR / rama wp/*, job con:
    npm ci + npm run lint + npm run gates + matriz de tests de paquetes.
- Sin publish (eso es WP-U53).
- CA: una PR de prueba muestra los checks corriendo; rojo si se introduce
  una violación sintética.
- Demolición: n/a.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-11 (topología Z_SDK) y D-12 (CI desde ola 0)
- plan/ARQUITECTURA.md §5 / camino a semver+CI/CD (paso 1: CI en Z_SDK)
- package.json raíz: scripts `lint`, `gates` (U00 ya entregó `npm run gates`)
- plan/PRACTICAS.md §5–§6 (gates en CI; commits convencionales)

Notas del orquestador:
- Lote 0b (solo U03). Lote 0a (U00+U01+U02) ya ✅ en master.
- Dep blanda U00: `npm run gates` YA EXISTE — cablearlo en el workflow CI
  (no reinventar gates; no omitirlos).
- NO editar plan/BACKLOG.md.
- Remoto / acceso (bloqueo parcial, NO bloquea YAML local):
  · clone local SIN `git remote` (`git remote -v` vacío).
  · Repo `alephscriptorium-eng/Z_SDK` EXISTE, PUBLIC, vacío (size 0;
    default_branch nominal main; sin commits).
  · `gh` auth OK (scopes repo+workflow). Cuenta activa `escrivivir-co`:
    permissions.push=false (solo pull). En keyring también
    `alephscriptorium-eng` (inactiva).
  Mitigación: añadir `origin` → Z_SDK; para push/PR de prueba hace falta
  `gh auth switch --user alephscriptorium-eng` (o token con write en la
  org) — si falla, dejar CA de checks ⏳ con evidencia y no inventar verde.
  Workflow YAML + docs locales se entregan igual.
- Sin publish ni changesets (WP-U53).

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
