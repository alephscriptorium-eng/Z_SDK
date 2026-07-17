# WP-U53 · changesets — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-17 |
| rama | `wp/u53-changesets` |
| commit(s) | `fadb4b5` feat(release); `5be3a7c` docs(release); _(este reporte)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se adoptó **changesets** en el monorepo: `@changesets/cli`, `.changeset/config.json`
(sin `fixed`/`linked` → semver **por paquete**), changeset de prueba
`.changeset/wp-u53-changesets.md` (patch `@zeus/protocol`), workflow
`.github/workflows/release.yml` con job `release` que **needs: [quality, test]**
y solo invoca `changesets/action` si existe `secrets.NPM_TOKEN` (tag + GitHub
Release vía `createGithubReleases: true`). Se demolió el chequeo lockstep
`LOCKSTEP = '0.1.0'` en `scripts/release-dry.mjs` (ahora valida semver
independiente). Scripts `release:changeset-dry`, `version-packages`,
`release:publish`. PRACTICAS §6 pasa a changeset obligatorio. **No** se hizo
`git push` ni `npm publish` real.

## Archivos tocados

- `.changeset/config.json` — creado (registry-aligned, independent bumps)
- `.changeset/README.md` — creado (cómo añadir changeset)
- `.changeset/wp-u53-changesets.md` — creado (changeset de prueba CA)
- `.github/workflows/release.yml` — creado (quality+test → release condicional)
- `.github/workflows/ci.yml` — modificado (comentario apunta a release.yml)
- `package.json` / `package-lock.json` — `@changesets/cli` + scripts release
- `scripts/release-dry.mjs` — demolición LOCKSTEP; export helpers; semver check
- `scripts/release-changeset-dry.mjs` — creado (version → pack → restore, sin publish)
- `test/release/release-u53.test.mjs` — creado (contrato workflow + demolición)
- `plan/PRACTICAS.md` — §6 changeset obligatorio
- `plan/ARQUITECTURA.md` — §5 paso 3 cableado; lockstep marcado demolido
- `README.md` — comandos release locales / CI
- `packages/engine/test-utils/README.md` — sin lenguaje lockstep
- `plan/REPORTES/WP-U53-changesets.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm run test:release` (verde)

```
# tests 5
# pass 5
# fail 0
```

### `npm run gates` (verde)

```
gates: OK (0 offenders)
```

### `npm run lint` (verde; warnings preexistentes ajenos)

```
✖ 12 problems (0 errors, 12 warnings)
```

### `npm run release:changeset-dry` (verde — CA local e2e sin publish)

```
pending changesets (1):
  - wp-u53-changesets.md

→ changeset version
🦋  All files have been updated. Review them and commit at your leisure

bumps after version (2 distinct version(s)):
  @zeus/authority-kit@0.1.1  [CHANGELOG]
  @zeus/protocol@0.1.1  [CHANGELOG]

→ release:dry (npm pack + verify)
release:dry — 15 publicable package(s), 2 distinct version(s)
…
pack @zeus/authority-kit@0.1.1 … ok (4 entries, zeus-authority-kit-0.1.1.tgz)
pack @zeus/protocol@0.1.1 … ok (12 entries, zeus-protocol-0.1.1.tgz)
…
release:dry — all 15 green

→ restore working tree (re-write pending changesets for CI)
release:changeset-dry — green (bump + changelog + pack; publish skipped)
⏳ npm publish / git tag / GitHub Release: only from CI with NPM_TOKEN
```

Tras restore: `@zeus/protocol` y `@zeus/authority-kit` vuelven a `0.1.0`;
changeset pendiente reescrito para CI.

### Publish real / tag / GitHub Release

⏳ **sin verificar** — política swarm: sin `NPM_TOKEN` / sin push. El workflow
está cableado para publicar solo si `steps.creds.outputs.has_npm == 'true'`.

### Pipeline rojo bloquea release

Evidencia estática (test + YAML): job `release` declara `needs: [quality, test]`.
Un fallo en lint/gates/tests impide el job de publish. No se disparó Actions
remoto (no push).

## Demolición

- **Lockstep manual en `release-dry.mjs`:** constante `LOCKSTEP` y chequeo
  `version ≠ lockstep` eliminados. Grep:

```
rg -n "LOCKSTEP|lockstep 0\.1\.0" scripts/
# (sin matches)
```

- Evidencia de versiones independientes en dry-run: `2 distinct version(s)`
  (`0.1.0` + `0.1.1`) en el mismo `release:dry`.
- **No** había script `npm publish` provisional de U50 que demoler (U50 solo
  dejó `release:dry`); el camino de publish es únicamente CI + changesets.
- Docs: lenguaje «publicado en lockstep» retirado de `test-utils` README y
  ARQUITECTURA §5 actualizado.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: registry URL
      `https://npm.scriptorium.escrivivir.co` en scripts/workflow = contrato
      D-7 / publishConfig (mismo patrón U50; no es room/puerto de runtime).
- [x] Cadenas if/switch que debieron ser tabla: no.
- [x] Duplicación con otros paquetes: quality/test matrix duplicada entre
      `ci.yml` y `release.yml` a propósito (release debe poder fallar quality
      sin depender de workflow_run). Hallazgo: candidata a `workflow_call`.
- [x] console.log / código comentado / TODO sin backlog: logs de progreso en
      scripts de release (stdout), sin debug.
- [x] Nombres fuera de glosario o de transición: no (`release:changeset-dry`,
      no legacy/v2).
- [x] Demolición completa (grep arriba): sí en scripts; menciones históricas
      en DECISIONES/BACKLOG/reportes U50 intactas (historia).
- [x] Tests prueban comportamiento: workflow contract + semver verify +
      ausencia LOCKSTEP + presencia changeset; dry-run e2e ejercita bump+pack.
- [x] Arranque real: n/a (no UI); dry-run local sí.
- [x] README/specs siguen siendo verdad: README + PRACTICAS + ARQUITECTURA
      actualizados; games no se publican.
- [x] Diff solo alcance WP: sí (sin BACKLOG; sin U52/U54).

## Hallazgos fuera de alcance

1. `changeset version` avisa que `@zeus/operator-ui` usa deps `file:` frente a
   versiones registry de bridge/room-client/ui-3d-kit — residual U50 hasta
   primer publish real (ya anotado en reporte U50).
2. Rama base local del swarm es `master`; changesets `baseBranch: main` (como
   en GitHub `origin/main`). `changeset status` falla sin ref local `main`;
   por eso `release:changeset-dry` no depende de status.
3. Duplicación de matriz quality/test en `release.yml` vs `ci.yml` — candidato
   a `workflow_call` en WP menor.
4. `ZEUS_OPEN_BROWSER`: no tocado (opt-in intacto).

## Dudas / bloqueos

Ninguno que bloquee revisión. Publish real queda ⏳ hasta que el orquestador /
ops configure `NPM_TOKEN` en Actions y haga merge a `main` (fuera de este WP;
política: no push).

### Push / publish

- `git push`: **no intentado**
- `npm publish`: **no intentado**
- `gh`: **no intentado**

---

## Revisión del orquestador

**Veredicto: aceptado ✅** — orquestador / 2026-07-17

Política usuario: swarm sin credenciales / no push / no publish. CA remoto
publish+tag+GitHub Release queda **⏳ OK** (dry local + workflow cableado;
no bloquea aceptación).

### Verificado

- **Base limpia**: merge-base = `master` (`f9fc6b9`); HEAD no detrás de master.
  No hace falta merge para revisar. U54 paralelo no está en esta rama.
- **Alcance** `master...HEAD` (15 files): `.changeset/*`, `release.yml`,
  scripts release, `test/release`, PRACTICAS §6 / ARQUITECTURA §5, README,
  reporte. **Sin** `plan/BACKLOG.md`. Sin producto runtime. Sin U52.
- **Commits** convencionales: `feat(release)`, `docs(release)`, `docs(report)`.
- **Demolición lockstep**: `LOCKSTEP` ausente en `scripts/`; `release:dry`
  reporta `N distinct version(s)`; docs lockstep permanente retirados.
- **Workflow** `.github/workflows/release.yml`:
  - `release` `needs: [quality, test]` (pipeline rojo bloquea publish)
  - publish solo si `secrets.NPM_TOKEN` → `has_npm == true`
  - `changesets/action@v1` + `createGithubReleases: true`
  - sin secret: skip documentado (⏳)
- **PRACTICAS §6**: changeset obligatorio en publicables +
  `npm run release:changeset-dry` documentado.
- **Re-CA local** (worktree, esta revisión):
  - `npm run release:changeset-dry` → green (bump `@zeus/protocol` +
    `@zeus/authority-kit` → `0.1.1`, pack 15 green, restore + changeset
    pendiente reescrito)
  - `npm run gates` → `gates: OK (0 offenders)`
  - `npm run test:release` → 5/5 pass
  - `npm run test:gates` → 7/7 pass

### CA remoto publish

⏳ **OK** — no bloquear. Publish/tag/GitHub Release solo tras merge a `main`
con `NPM_TOKEN` en Actions (fuera del swarm).

### Solape U54 (nota merge)

U54 toca también `scripts/release-dry.mjs` + `package.json` (chequeo `.d.ts`).
Partición coherente con brief: U53 = versionado/semver; U54 = tipos en
tarball. **Merge preferido: U53 primero**, luego U54 (rebase/resolver el
bloque `.d.ts` sobre exports de U53).

### Hallazgos → cola (no bloquean)

1. Deps `file:` en `@zeus/operator-ui` (aviso changeset) — residual U50.
2. `baseBranch: main` vs rama local `master` — `changeset status` frágil;
   dry-run no depende de status (OK).
3. Duplicación matriz quality/test `ci.yml` / `release.yml` → candidato
   `workflow_call`.

### Merge / BACKLOG

**Listo merge+✅: SÍ** (autorizado tras OK usuario). Esta revisión: **NO
merge / NO push / NO publish / NO ✅ BACKLOG** (pedido explícito). Tras merge
futuro: ✅ U53 en master + `git worktree remove` del worktree U53.
