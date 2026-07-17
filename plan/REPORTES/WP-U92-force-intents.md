# WP-U92 · force-intents — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u92-force-intents` |
| commit(s) | `be26ab3`, `b8eb721`, `56605e6`, `81f2be3` |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

Nació `@zeus/linea-kit/force-activation` (puro, browser-safe): aplica
`session_budget`, exclusiones y boot del registry **inyectado** — cero ids
concretos de corpus en engine.

Delta (`@zeus/arg-domain`) y pozo ganan intents `force:activate` /
`force:deactivate` (roles `operator`/`dj`): dry-run explicable, asiento en
ledger, track de escena ancla (`force://…/scene/…`), snapshot con
`forces.active` + cotas sima/cima (posición entre polos colapso/victoria).

## Archivos tocados

- creado `packages/engine/linea-kit/src/force-activation.mjs` — reglas puras
- creado `packages/engine/linea-kit/test/force-activation.test.mjs` — CA unit
- creado `.changeset/wp-u92-force-intents.md` — bump minor linea-kit
- creado `plan/REPORTES/WP-U92-force-intents.md` — este reporte
- modificado `linea-kit` package.json / index / README — export subpath
- modificado `arg-domain` contract/reducer/domain-state + tests + README + dep
- modificado `pozo` contract/domain + test + README + dep

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

```
$ npm test -w @zeus/linea-kit
# tests 26 / pass 26 / fail 0
# (incluye suite force-activation: budget 3ª force, pair_excluded, track ref)

$ npm test -w @zeus/arg-domain
# tests 63 / pass 63 / fail 0
# (reducer + domain-state WP-U92: ledger + track; budget; exclusion; rol)

$ npm test -w @zeus/pozo
# tests 7 / pass 7 / fail 0
# (WP-U92 force:activate — ledger + track; 3ª force y par excluido)

$ npm run gates
gates: OK (0 offenders)

$ npm run lint
✖ 13 problems (0 errors, 13 warnings)  # warnings preexistentes + uno
# corregido en force-activation.test (reg unused)
```

Worktree: `npm install` local para enlazar `@zeus/linea-kit` del worktree
(el `node_modules` del repo principal apuntaba a packages/ de master sin el
export nuevo). `ZEUS_OPEN_BROWSER` unset — sin navegador.

### CA — preguntas obligatorias

| pregunta | evidencia |
| -------- | --------- |
| ¿3ª force / par excluido rechazados con dry-run? | Sí — `session_budget_exceeded` / `pair_excluded` en linea-kit, arg-domain reducer, pozo `explainIntent` |
| ¿activación válida → ledger + track? | Sí — `force:activate` en ledger + `hint: force-browser` / `force://…/scene/…` |
| ¿delta Y pozo consumen? | Sí — ambos importan `@zeus/linea-kit/force-activation` y tests verdes |

### ¿delta y pozo verdes? (PRACTICAS §1.11)

- **delta:** sí — `npm test -w @zeus/arg-domain` 63 pass.
- **pozo:** sí — consume el mismo módulo; `npm test -w @zeus/pozo` 7 pass.
- Engine no nombra forces concretas ni juegos.

## Demolición

n/a (adición al dominio / linea-kit).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no — refs `force://` son ids de
  recurso MCP, no URLs de servicio.
- [x] Cadenas if/switch → tabla: handlers en `HANDLERS` (delta) / objeto
  `handlers` (pozo); exclusiones en bucle sobre datos.
- [x] Duplicación: reglas en linea-kit; juegos solo cablean intents/ledger.
- [x] console.log / comentado / TODO: no en código nuevo de producción.
- [x] Nombres de transición: ninguno.
- [x] Demolición: n/a.
- [x] Tests de comportamiento: budget, exclusion, ledger, track, roles, cotas.
- [ ] Arranque real (authority/demo con registry vivo): `⏳ sin verificar`
  (CA pide tests reducer + consumo dos juegos; autoridad no cablea DISK_03
  aún — inyectar `forcesRegistry` en create* queda para borde/launcher).
- [x] README linea-kit / arg-domain / pozo actualizados; changeset linea-kit.
- [x] Diff solo alcance U92 (sin BACKLOG, sin CASOS vaciado U83, sin MCP
  activate en force-system).

## Hallazgos fuera de alcance

1. **Autoridad/demo no inyectan `forcesRegistry` por defecto** — sin opción
   el intent responde `forces_no_configuradas`. Candidato: cablear
   `loadForcesData` / fixture en authority demos (borde node).
2. **`resolveTrackRef` no resuelve `force://`** — el track sale en outbox con
   URI; deep-link a browser force queda pendiente (player-ui / MCP).
3. **Worktree node_modules** — hace falta `npm install` en el worktree para
   que exports nuevos de linea-kit no resuelvan al árbol master.
4. **pairs_with** — afinidad blanda no rechaza activación (solo exclusiones
   del registry); coherente con CA; si se quiere hard-pair afirmativo, WP
   aparte.

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
