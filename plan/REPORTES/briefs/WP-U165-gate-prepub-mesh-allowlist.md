# Brief — WP-U165 · Gate pre-publicación mesh allowlist

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U165 · Gate pre-publicación mesh allowlist (**reapertura** ·
corrección tras R11-Z FAIL reintento; no WP nuevo)
Rama: wp/u165-semver-root-devdep
Worktree: C:\S_LAB\.worktrees\z\wp-u165-semver-root-devdep
Reporte: plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md
Gate FAIL: plan/REPORTES/entregas/GATE-R11-Z-FAIL-REINTENTO.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 · §5 (**solo lectura** — no editar)
- plan/REPORTES/entregas/GATE-R11-Z-FAIL-REINTENTO.md (motivos + CA)
- plan/REPORTES/entregas/GATE-R11-Z-FAIL.md (contexto sensor previo)
- `scripts/gate-publish-ready.mjs` (usa `require('semver')`)
- `package.json` raíz (devDependencies — falta `semver`)
- plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md (addenda previa)
- plan/PRACTICAS.md §6 · C8

## Tarea (corrección R11-Z FAIL reintento · semver raíz)
1. Declarar `semver` como **devDependency directa del package.json
   raíz** con el package manager (`npm install --save-dev semver` o
   equivalente) y actualizar `package-lock.json` coherentemente.
2. Verificar `npm ls semver --depth=0` **verde** (exit 0; semver
   aparece bajo el root, no empty).
3. Re-ejecutar **gate P0×4** (`npm run gate:publish-ready` → PASS).
4. Re-ejecutar **probes rojos** (exit 1 cada uno), sin escribir
   manifests:
   `star` · `latest` · `git` · `url` · `windows-path` ·
   `missing-version`
   vía `node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe <kind>`.
5. `npm run gates` + lint/check del gate si toca scripts (idealmente
   no toca lógica).
6. Evidencia literal en addenda del reporte WP-U165 (tabla
   gate/probes + `npm ls`).
7. **No** publish, **no** flip `private`, **no** changesets de
   publicación, **no** editar `plan/PUBLISH-ALLOWLIST.md`, **no**
   reabrir U164/U166.

## CA (alineados al FAIL-REINTENTO)
- Root declara `semver` en `devDependencies` (directo, no solo
  transitivo).
- `package-lock.json` actualizado con esa declaración.
- `npm ls semver --depth=0` exit 0 y lista `semver@…` bajo root.
- Re-gate P0×4 PASS; probes ×6 FAIL exit 1 (como reintento anterior).
- Allowlist byte-identical; cero private / publish / changesets.
- Fronteras de publicación intactas.

## ALCANCE_DIFF
- `package.json` (devDependency `semver`)
- `package-lock.json`
- `plan/REPORTES/` (addenda reporte)
- **Opcional mínimo:** `scripts/**` solo si el install/require lo
  exige (preferible no tocar sensor)
- **Prohibido:** `plan/PUBLISH-ALLOWLIST.md`, flips `private`,
  `.changeset/**` de release, `npm publish`, workflows publish,
  reabrir U164/U166

## Notas
- Estado: **🔶** · corrección dentro del CA U165 (custodio: no GO
  nuevo; no WP nuevo).
- La lógica semver/C8/probes **ya pasa**; el bloqueo es solo la
  dependencia directa no declarada.
- U164 ✅ · U166 ✅ intactos.
- Estimación: S · Eje IV + C8
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY
- Tras merge + CI: orquestador pedirá **nuevo reintento R11-Z** (no
  declarar PASS).
