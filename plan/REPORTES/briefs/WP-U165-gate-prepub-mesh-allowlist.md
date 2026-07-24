# Brief — WP-U165 · Gate pre-publicación mesh allowlist

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U165 · Gate pre-publicación mesh allowlist (**reapertura** ·
corrección tras R11-Z FAIL; no WP nuevo)
Rama: wp/u165-gate-semver-registry-probes
Worktree: C:\S_LAB\.worktrees\z\wp-u165-gate-semver-registry-probes
Reporte: plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md
Gate FAIL: plan/REPORTES/entregas/GATE-R11-Z-FAIL.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 · §5 (**solo lectura** — no editar)
- plan/REPORTES/entregas/GATE-R11-Z-FAIL.md (motivos + CA faltantes)
- `scripts/gate-publish-ready.mjs` (sensor defectuoso)
- `scripts/audit-publish-allowlist.mjs` (U162 · patrón `npm view`)
- plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md (entrega previa)
- plan/PRACTICAS.md §6 · C8

## Tarea (corrección R11-Z FAIL)
1. Endurecer validación de deps internas `@zeus/*`:
   - aceptar solo **semver pineado** (versión exacta válida);
   - rechazar `*`, dist-tags (`latest`, …), Git/URL, alias/protocolos
     locales (`workspace:`, `file:`, `link:`, …) y rutas POSIX/Windows.
2. Comprobar que cada `@zeus/*@versión` medida sea **resoluble** en el
   registry canónico de `.npmrc` (`npm view` / equivalente sin
   workspace).
3. Añadir **probes rojos** (deben fallar, sin escribir manifests) para:
   `*`, `latest`, Git/URL, ruta Windows, versión inexistente; mantener
   **probe verde** (P0×4 PASS).
4. Re-ejecutar P0×4 + gates + lint; evidencia literal en reporte.
5. **No** publish, **no** flip `private`, **no** changesets de
   publicación, **no** editar `plan/PUBLISH-ALLOWLIST.md`.

## CA
- Predicado de rango/pin demuestra «registry semver» (no solo denylist
  parcial); mensaje alineado con la propiedad comprobada.
- Resolución C8 real por cada pin `@zeus/*` medido (o fallo explícito).
- Probes rojos documentados: `*` · `latest` · Git/URL · `C:\…` ·
  versión inexistente → exit ≠ 0.
- Probe verde: `npm run gate:publish-ready` → P0×4 OK.
- Allowlist byte-identical (solo lectura); cero private / publish /
  changesets de pub.
- `npm run gates` OK si toca `scripts/`.
- **Re-gate P0×4** post-fix con evidencia en reporte.

## ALCANCE_DIFF
- `scripts/**` (gate / probes)
- `package.json` (npm script solo si hace falta)
- `.github/workflows/**` solo si añade check **sin** publish
- `plan/REPORTES/` (reporte)
- **Prohibido:** `plan/PUBLISH-ALLOWLIST.md` (solo lectura; enmiendas =
  **U166**), flips `private`, `.changeset/**` de release, `npm publish`,
  reabrir U164/U166

## Notas
- Estado: **🔶** · corrección dentro del CA U165 ya autorizado (custodio:
  no GO nuevo).
- U164 ✅ · U166 ✅ intactos.
- Estimación: S · Eje IV + C8
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY
