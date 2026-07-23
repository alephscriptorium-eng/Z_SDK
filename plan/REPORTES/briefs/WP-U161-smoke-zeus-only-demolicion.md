# Brief — WP-U161 · smoke scope `@zeus` + demolición residual

(rol) plan/roles/README.md → WORKER

WP: WP-U161 · Smoke consumidor un solo scope `@zeus` + cierre demolición
Rama: wp/u161-smoke-zeus-only
Worktree: C:\S_LAB\.worktrees\z\wp-u161-smoke-zeus-only
Reporte: plan/REPORTES/WP-U161-smoke-zeus-only.md

## Lecturas
- U54 smoke · U160 reporte · `.npmrc` (scopes)

## Tarea
1. Smoke / e2e que arranque socket-server + cliente rooms **sin**
   `@alephscript/*` en el árbol del consumidor de prueba (solo `@zeus`).
2. Conservar tests cliente/servidor del monorepo.
3. Demoler residuales acordados: deps en root/examples que aún tiren de
   mcp-core-sdk **si** el mandato del arco lo exige; si `spec-generate`
   necesita `/spec`, documentar decisión (extraer stub vs dejar root
   como excepción ops) — no dejar ambigüedad.
4. Changesets si toca paquetes publicables.

## CA
- Evidencia: install consumidor con `.npmrc` solo-`@zeus` → exit 0
  (repro del síntoma E404 resuelto).
- Tabla demolición: símbolo/dep → destino o «excepción ops» firmada.
- Tests + smoke verdes.

## Notas
- Dep: U160 ✅ · Estimación: M · Ejes I + II
