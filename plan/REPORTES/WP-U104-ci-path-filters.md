# WP-U104 · ci-path-filters — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) / Cursor Grok |
| fecha | 2026-07-18 |
| rama | `wp/u104-ci-path-filters` |
| commit(s) | `1ad710a` ci(workflows)…; `538c176` docs(reportes)… |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

Se añadieron filtros de paths a los tres workflows de economía (D-22 frente 1),
sin tocar jobs, concurrency ni la condición de secrets del release:

1. **`ci.yml`** — `paths-ignore: ['plan/**', '**.md']` en `push` y
   `pull_request` (alineados). Un push/PR que solo toque plan o markdown no
   dispara la matriz ~31 jobs.
2. **`release.yml`** — `paths: ['.changeset/**', 'packages/**']` en `push` a
   `main`. Ya no corre quality+test+release en cada push a main; solo cuando
   hay cambios de changesets o paquetes. Jobs internos (creds / skip
   NPM_TOKEN) intactos.
3. **`docs.yml`** — `paths: ['docs/**']` en `push` y `pull_request`;
   `workflow_dispatch` se conserva sin filtro (publicación manual).

Glob `**.md` verificado contra la tabla oficial de GitHub Actions
(«Matches all `.js` files in the repository» para el análogo `**.js`).

## Archivos tocados

- modificado `.github/workflows/ci.yml` — paths-ignore push + PR
- modificado `.github/workflows/release.yml` — paths allowlist changesets/packages
- modificado `.github/workflows/docs.yml` — paths docs/** + workflow_dispatch
- creado `plan/REPORTES/WP-U104-ci-path-filters.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### YAML resultante (headers `on:`)

**ci.yml**

```yaml
on:
  push:
    branches:
      - main
      - 'wp/**'
    paths-ignore:
      - 'plan/**'
      - '**.md'
  pull_request:
    paths-ignore:
      - 'plan/**'
      - '**.md'
```

**release.yml**

```yaml
on:
  push:
    branches:
      - main
    paths:
      - '.changeset/**'
      - 'packages/**'
```

**docs.yml**

```yaml
on:
  push:
    branches:
      - main
      - 'wp/**'
    paths:
      - 'docs/**'
  pull_request:
    paths:
      - 'docs/**'
  workflow_dispatch:
```

### Simulación CA (razonamiento GHA; no Actions remoto)

GitHub solo omite el workflow cuando **todos** los paths del push/PR
cumplen `paths-ignore`, o cuando **ninguno** cumple `paths`.

| Escenario | CI | Release (main) | Docs |
| --- | --- | --- | --- |
| Solo `plan/*.md` | no (ignore) | no (fuera de paths) | no (fuera de paths) |
| Solo `README.md` / cualquier `**.md` | no | no | no |
| Cambio en `packages/**` | sí | sí | no |
| Solo `.changeset/**` | sí (no está en ignore) | sí | no |
| Solo `docs/**` (no solo .md si hay assets) | depende† | no | sí |
| `workflow_dispatch` docs | n/a | n/a | sí (sin filtro de paths) |

† Si el commit solo toca `docs/**/*.md`, CI también se omite por `**.md`
(deseable: no gastar matriz en markdown del portal). Si toca
`docs/**` no-md (p. ej. config, assets), CI corre — fuera del CA literal
pero coherente con paths-ignore.

### Verificación remota post-merge

```
⏳ sin verificar — worker no hace push; Actions no se puede ejercitar
desde esta rama local. Checklist post-merge (orquestador/ops):
1. Push solo plan/*.md a main → 0 runs de CI / Release / Docs.
2. Push que toque packages/** → CI completo + Release (si main).
3. Push solo docs/** → Docs build; CI omitido si solo .md.
4. Actions → Docs → Run workflow → build (y deploy si main).
```

### Lint / tests de paquetes

```
n/a — WP solo YAML de workflows; PRACTICAS §1.10 excepción de
demolición/movimiento + brief «NO tocar código de paquetes, tests».
```

### Diff vs main

```
$ git diff main...HEAD --stat
 .github/workflows/ci.yml      | 8 ++++++++
 .github/workflows/docs.yml    | 5 +++++
 .github/workflows/release.yml | 5 +++++
 3 files changed, 18 insertions(+)
```

_(más este reporte en commit posterior)_

## Demolición

Triggers anchos (cualquier push/PR sin filtro de paths) en los tres
workflows. No hay símbolos de código que grepear; la demolición es la
sustitución de los bloques `on:`:

| Antes | Después |
| --- | --- |
| `ci.yml`: push/PR sin paths | paths-ignore plan + md |
| `release.yml`: todo push a main | paths changesets + packages |
| `docs.yml`: push/PR sin paths | paths docs/** (+ dispatch) |

```
$ git show HEAD:.github/workflows/ci.yml | head -20
# (tras merge del commit de implementación)
# push/pull_request llevan paths-ignore — ya no hay trigger «todo path»
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: n/a (solo workflows)
- [x] Cadenas if/switch que debieron ser tabla: n/a
- [x] Duplicación con otros paquetes: n/a
- [x] console.log / código comentado / TODO sin backlog: solo comentarios
      de contexto WP-U104 / D-22 en YAML
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa: triggers anchos reemplazados en los tres files
- [x] Tests prueban comportamiento: simulación documentada; Actions remoto
      ⏳ (política no-push)
- [x] Arranque real verificado: n/a (no hay proceso local)
- [x] README/specs del paquete siguen siendo verdad: n/a
- [x] El diff contiene solo el alcance del WP: solo `.github/workflows/*`
      (+ este reporte)

## Hallazgos fuera de alcance

1. **Release ya no re-valida quality+test en merges a main que no toquen
   `packages/**` ni `.changeset/**`.** Ej.: cambio solo en
   `.github/workflows/ci.yml`, root `package.json`, o scripts de tooling.
   Coherente con el CA; si se quiere re-validar tooling, ampliar `paths`
   en un WP futuro.
2. **PyYAML trata la clave `on:` como booleano `True` (YAML 1.1).** No
   afecta a GitHub Actions; sí rompe parsers ingenuos de validación local.
3. Un commit mixto `plan/*.md` + `packages/**` **sí** dispara CI (y
   release en main): comportamiento documentado de GHA, no un bug.

## Dudas / bloqueos

Ninguno. CA verificable al 100 % solo post-merge en Actions (checklist
arriba).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador / 2026-07-18)

### Verificado
- Diff `main...HEAD` acotado a los 3 YAML + este reporte (tras merge
  `29d50ef` de `main` tip `13898df` U106 plan — sin conflicto).
- **CA-1** (solo `plan/*.md` → 0 jobs): `ci` paths-ignore `plan/**`+`**.md`;
  `release`/`docs` allowlist no incluye `plan/**` → no disparan.
- **CA-2** (`packages/**` → CI completo): no está en paths-ignore → CI sí;
  release también (paths allowlist).
- **CA-3** (docs solo `docs/**` o `workflow_dispatch`): paths + dispatch
  sin filtro — confirmado en YAML.
- Glob `**.md`: alineado con docs GHA («`**.js` matches all `.js`»).
- PR alineado con push en `ci`/`docs`; concurrency/secrets release intactos.
- Worker no tocó `plan/BACKLOG.md`. Commits convencionales §6.
- Actions remoto: ⏳ honesto + checklist post-merge (aceptable; no-push).

### PRACTICAS
§1 n/a (solo workflows). §3 auto-revisión honesta. Demolición = triggers
anchos sustituidos. Sin alcance extra.

### Merge (cuando el usuario autorice)
1. Merge `wp/u104-ci-path-filters` → `main` (FF o merge commit).
2. Orquestador en `main`: BACKLOG U104 🔶→✅; desbloquea lote
   **U60 ∥ U105 ∥ U106**.
3. `git worktree remove` `.worktrees/wp-u104-ci-path-filters`.
4. Checklist Actions del reporte (plan-only / packages / docs / dispatch).

**Push: no intentado.** **BACKLOG ✅: no aplicado** (pedido explícito de
esta revisión).
