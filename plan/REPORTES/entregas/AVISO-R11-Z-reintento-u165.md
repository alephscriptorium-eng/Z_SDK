# AVISO · orquestador-Z → SOL / custodio · reintento R11-Z

| dato | valor |
| ---- | ----- |
| De | orquestador-Z |
| Para | vigía SOL (carril Z) vía custodio |
| Fecha | 2026-07-24 |
| Motivo | **U165 ✅ re-validado** tras R11-Z FAIL; pedir **reintento R11-Z** |
| Gate previo | **R11-Z FAIL** técnico (`GATE-R11-Z-FAIL.md`) |
| Espejo | `C:\S_LAB\vigilancia\z\AVISO-R11-Z-reintento-u165.md` |

## Pedido a SOL

Re-evaluar cierre de Ola B / Sprint 8 y emitir **R11-Z PASS** (o FAIL
con evidencia) sobre el tip actual.

**Este aviso no declara PASS.** Solo solicita reintento tras la
corrección de U165. No autoriza flip `private`, changesets de
publicación ni `npm publish` (GO publish aparte).

## Hechos (literal)

1. **R11-Z FAIL** archivado en
   `plan/REPORTES/entregas/GATE-R11-Z-FAIL.md` (espejo
   `vigilancia/z/GATE-R11-Z-FAIL.md`).
2. **U164 ✅** y **U166 ✅** se conservaron; **solo U165** se reabrió
   (sin WP nuevo; sin GO nuevo).
3. **U165 ✅ re-validado** — sensor `scripts/gate-publish-ready.mjs`:
   - pines semver exactos (`semver.valid`);
   - rechazo `*` · dist-tags · Git/URL · rutas POSIX/Windows ·
     protocolos locales;
   - resolución C8 `npm view @zeus/*@pin` contra registry `.npmrc`;
   - probes rojos ×5 + probe verde P0×4.
4. Allowlist **solo lectura** (byte-identical en obra U165).
5. Frontera dura: **cero** flip `private` · **cero** changesets de
   publicación · **cero** `npm publish`.
6. Quietud: `.worktrees/z` vacío · ramas `wp/*` 0.

## Resultados

| WP | Estado | Evidencia |
| -- | ------ | --------- |
| U164 | ✅ (intacta) | merge `6a2a409` |
| U166 | ✅ (intacta) | merge `25cf693` |
| U165 | ✅ re-validado | tip obra `5a3c4d9` · merge `b550510` · reporte `plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md` |

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

### Re-gate P0×4 (literal tip)

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
| Tip código (merge U165 corrección) | `b550510f33dca98edb394fe1caa8ee8a157bd9e9` |
| Tip gobierno (aceptación + este aviso) | `<rellenar tras commit aviso>` |
| Push | normal (sin force) |
| CI | `30085114674` **success** — https://github.com/alephscriptorium-eng/Z_SDK/actions/runs/30085114674 (head `1fc405a`; incluye merge código `b550510` + plan) |
| smoke TS registry (job CI) | `89455353450` **success** |
| Docs | N/A en este push (paths; sin delta docs) — homólogo previo `30083260612` success |
| Release | no re-disparado (sin delta `packages/**` / `.changeset/**`). Homólogo packages tip U164: `30082419532` **success** |

> El push de aceptación `1fc405a` ya tiene CI verde. Si este aviso viaja
> en un commit posterior solo-`plan/**`, SOL verifica quietud de
> `origin/main` y que los run-ids del tip código sigan vigentes.

## Quietud / frontera

- `C:\S_LAB\.worktrees\z`: **vacío**.
- Worktrees git: solo checkout principal.
- Ramas `wp/*` locales/remotas: **0**.
- Stash: vacío · locks: 0.
- Allowlist: no enmendada en U165.
- P0×4: `private: true` intacto.

## Handoff copiable a SOL

```text
Reintento R11-Z tras corrección U165.

FAIL previo: GATE-R11-Z-FAIL (isRegistryRange laxo; sin registry view;
solo probe *).

Corrección U165 ✅:
- classifyZeusVersion: pin semver exacto; rechaza latest/git/url/Windows
- npm view C8 por cada @zeus/* pin
- probes rojos: star, latest, git, url, windows-path, missing-version
- verde P0×4 OK

Tip código: b550510
Tip gobierno aceptación: 1fc405a (+ aviso posterior si aplica)
CI: 30085114674 success
smoke: 89455353450 success

U164 ✅ · U166 ✅ intactos. Solo U165 tocado.
Allowlist solo lectura. No private / no changesets / no publish.
Pedir R11-Z PASS (o FAIL con evidencia). No declarar PASS aquí.
DC-15 LOCAL-ONLY.
```
