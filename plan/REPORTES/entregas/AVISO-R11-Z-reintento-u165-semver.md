# AVISO · orquestador-Z → SOL / custodio · nuevo reintento R11-Z (semver)

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | vigía SOL (carril Z) vía custodio |
| Fecha | 2026-07-24 |
| Motivo | **U165 ✅** tras R11-Z FAIL reintento (`semver` root); pedir **nuevo reintento R11-Z** |
| Gate previo | **R11-Z FAIL reintento** (`GATE-R11-Z-FAIL-REINTENTO.md`) |
| Espejo | `C:\S_LAB\vigilancia\z\AVISO-R11-Z-reintento-u165-semver.md` |

## Pedido a SOL

Re-evaluar cierre de Ola B / Sprint 8 y emitir **R11-Z PASS** (o FAIL
con evidencia) sobre el tip actual.

**Este aviso no declara PASS.** Solo solicita reintento tras la
corrección de U165 (semver raíz). No autoriza flip `private`,
changesets de publicación ni `npm publish` (GO publish aparte).

## Hechos (literal)

1. **R11-Z FAIL reintento** archivado en
   `plan/REPORTES/entregas/GATE-R11-Z-FAIL-REINTENTO.md` (espejo
   `vigilancia/z/GATE-R11-Z-FAIL-REINTENTO.md`). Bloqueo: root no
   declaraba `semver` pese a `require('semver')` en el gate.
2. **U164 ✅** y **U166 ✅** se conservaron; **solo U165** se tocó
   (sin WP nuevo; sin GO nuevo).
3. **U165 ✅** — corrección mínima:
   - `semver@^7.8.5` en `devDependencies` del `package.json` raíz;
   - `package-lock.json` coherente;
   - `npm ls semver --depth=0` → `semver@7.8.5` exit 0;
   - re-gate P0×4 PASS; probes rojos ×6 FAIL exit 1;
   - `npm run gates` OK.
4. Allowlist **solo lectura** (byte-identical en obra U165).
5. Frontera dura: **cero** flip `private` · **cero** changesets de
   publicación · **cero** `npm publish`.
6. Quietud: `.worktrees/z` vacío · ramas `wp/*` 0.
7. Aviso previo (obsoleto): `AVISO-R11-Z-reintento-u165.md`.

## Resultados

| WP | Estado | Evidencia |
| -- | ------ | --------- |
| U164 | ✅ (intacta) | merge `6a2a409` |
| U166 | ✅ (intacta) | merge `25cf693` |
| U165 | ✅ (semver raíz) | tip obra `1bfd9b8` · merge `289b7fe` · reporte `plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md` |

### `npm ls semver --depth=0` (literal tip)

```
$ npm ls semver --depth=0
zeus-sdk@0.1.0 C:\S_LAB\z-sdk
└── semver@7.8.5
npm_ls_exit=0
```

### Tabla probes (post-corrección)

| probe | esperado | obtenido |
| ----- | -------- | -------- |
| verde P0×4 | PASS exit 0 | PASS exit 0 |
| `--fail-probe star` (`*`) | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe latest` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe git` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe url` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe windows-path` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe missing-version` | FAIL exit 1 (E404) | FAIL exit 1 |

### Re-gate P0×4 (literal)

```
$ npm run gate:publish-ready
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system, @zeus/linea-firehose, @zeus/force-system, @zeus/ssb-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
PASS @zeus/linea-system … zeusDeps=4
PASS @zeus/linea-firehose … zeusDeps=3
PASS @zeus/force-system … zeusDeps=4
PASS @zeus/ssb-system … zeusDeps=3
gate:publish-ready: OK (4 P0 candidates)
```

## Tip + runners (literal)

| dato | valor |
| ---- | ----- |
| Tip código (merge U165 semver) | `289b7fe9c8a77e59ba747c6bc2f4f3c01aed6ad4` |
| Tip obra | `1bfd9b8ae776cb6bf00a3f78e181685720c738ca` |
| Tip gobierno (aceptación) | `88a95684fa3a20234ee7e521667b03ca51bcac56` |
| Push | normal (sin force) |
| CI | `30088694250` **success** — https://github.com/alephscriptorium-eng/Z_SDK/actions/runs/30088694250 (head `88a9568`; incluye merge código `289b7fe` + plan) |
| smoke TS registry (job CI) | `89466799397` **success** |
| Docs | `30088694310` **success** |
| Release | no re-disparado en este tip (sin delta `packages/**` / `.changeset/**` de release). Homólogo packages tip U164: `30082419532` **success** |

## Quietud / frontera

- `C:\S_LAB\.worktrees\z`: **vacío**.
- Worktrees git: solo checkout principal.
- Ramas `wp/*` locales/remotas: **0**.
- Stash: vacío · locks: 0.
- Allowlist: no enmendada en U165.
- P0×4: `private: true` intacto.

## Handoff copiable a SOL

```text
Nuevo reintento R11-Z tras corrección U165 (semver raíz).

FAIL previo: GATE-R11-Z-FAIL-REINTENTO
(semver no declarado en root; npm ls empty/exit 1).

Corrección U165 ✅:
- package.json root: devDependencies.semver ^7.8.5
- package-lock.json actualizado
- npm ls semver --depth=0 → semver@7.8.5 exit 0
- re-gate P0×4 OK
- probes rojos: star, latest, git, url, windows-path, missing-version (exit 1)
- gates OK

Tip código: 289b7fe
Tip obra: 1bfd9b8
Tip gobierno (aceptación): 88a9568
CI: 30088694250 success
smoke: 89466799397 success
Docs: 30088694310 success

U164 ✅ · U166 ✅ intactos. Solo U165 tocado.
Allowlist solo lectura. No private / no changesets / no publish.
Pedir R11-Z PASS (o FAIL con evidencia). No declarar PASS aquí.
DC-15 LOCAL-ONLY.
```
