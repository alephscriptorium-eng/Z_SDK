# Brief — WP-U158 · smoke TypeScript desde registry + CI

(rol) plan/roles/README.md → WORKER

WP: WP-U158 · Consumidor TS limpio desde registry (C8) + gate CI
Rama: wp/u158-smoke-ts-registry
Worktree: C:\S_LAB\.worktrees\z\wp-u158-smoke-ts-registry
Reporte: plan/REPORTES/WP-U158-smoke-ts-registry.md

## Lecturas
- `scripts/smoke-external-consumer.mjs` (U54 — patrón JS)
- PRACTICAS C8 · REPLAN fase 3

## Tarea
1. Nuevo smoke (o extensión) que instale `@zeus/*` tipados **desde
   registry** (no solo tarball workspace) y compile un consumidor
   TypeScript (`tsc --noEmit`) sin `any` de escape en imports Zeus.
2. Cubrir al menos: `@zeus/protocol` (+ `peer-card-seat`), `@zeus/rooms`,
   y un subpath tipado de presets o webrtc.
3. Cablear en CI (job o step) con evidencia de run.
4. Documentar skip si registry/secrets ausentes (patrón U122) — pero el
   path verde local/CI con registry debe existir.

## CA
- Comando documentado exit 0 con tipado real.
- CI cita run-id o step literal en reporte (cuando corra).
- U54 JS intacto o conviviendo; no demoler sin reemplazo.

## Notas
- Deps: U155+U156 (mínimo). U157 refuerza pero no bloquea el smoke de los cinco.
- Estimación: M · C8 registry
