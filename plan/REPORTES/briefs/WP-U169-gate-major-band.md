# Brief — WP-U169 · Adaptar gate publish-ready a major-band

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U169 · Adaptar gate publish-ready a major-band
Rama: wp/u169-gate-major-band
Worktree: C:\S_LAB\.worktrees\z\wp-u169-gate-major-band
Reporte: plan/REPORTES/WP-U169-gate-major-band.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md
- plan/REPORTES/entregas/ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md
- plan/REPORTES/entregas/GATE-R11-Z-PASS.md (lock-coherence)
- `scripts/gate-publish-ready.mjs` (hoy exige pin exacto `semver.valid`)
- plan/PUBLISH-ALLOWLIST.md §5 (post-U168)
- plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md (contexto; no reabrir)

## Tarea
1. Adaptar el sensor para aceptar banda major `>=M.m.p <(M+1).0.0`
   (y rechazar `*`, tags, git, url, paths, aliases).
2. Actualizar probes verde/rojo; convertir casos adversariales a tests
   automatizados cuando sea razonable en alcance.
3. Re-gate P0×4 en verde tras U168; fail-probes en rojo.
4. Documentar CA: todo cambio de manifests exige lock actualizado en el
   mismo WP (hallazgo R11-Z PASS) — chequeo o nota enforceable.
5. **No** reabrir U165 como WP · **no** publish · **no** flip private.
6. **No** editar manifests P0 (dueño U168) salvo fix mínimo documentado
   si el gate lo exige tras merge U168 (preferir devolver).

## CA
- Gate PASS sobre P0×4 con major-band.
- Probes rojos rechazan `*` / latest / git / url / windows-path /
  missing-version (o set equivalente documentado).
- Contrarrevisión independiente PASS antes de ✅.
- Allowlist solo lectura salvo que U168 ya la haya alineado.
- Cero publish / private / changesets de pub.

## ALCANCE_DIFF
- `scripts/gate-publish-ready.mjs` (+ tests del gate si existen/crean)
- `package.json` raíz / lock solo si declara deps del sensor
- reporte bajo `plan/REPORTES/`
- **Prohibido:** flip private, npm publish, changesets de release,
  reabrir U165, ampliar allowlist P0/P1

## Notas
- Estado: **🔶** despachado (PAUSA parcial · post Ola A ✅ · 2026-07-25)
- Estimación: M · Eje IV + C8 · Ola B · dep **U168 ✅**
- Contrarrevisión: obligatoria · RIESGO_REVISION=independiente
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- WORLD_ROOT=C:/S_LAB/z-sdk · CANONICAL_WORLD_ROOT=C:/S_LAB/z-sdk ·
  READ_ONLY_ROOTS=["C:/S_LAB/.worktrees"] · DOWNSTREAM_PATTERNS=[".worktrees/*"]
- DC-15 LOCAL-ONLY
- No editar `plan/BACKLOG.md` (solo orquestador)
