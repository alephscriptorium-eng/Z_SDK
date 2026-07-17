# WP-U83 · crecer-vaciar — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-18 |
| rama | `wp/u83-crecer-vaciar` |
| commit(s) | `58603aa` feat(delta) · `8be54e6` feat(pozo) · docs(plan) reporte (HEAD) |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

Delta y pozo incorporaron la mitad **vaciar** del ciclo DATOS §4 (crecer ya
en U30). Intent de dominio `empty` con coste narrativo, score `emptied` y
ledger `kind:"empty"` (`detail.opsIntent:"empty_playable"`). Autoridades
gemelan asiento ops vía `@zeus/volumes-ops` `empty_playable` (sin purga dura).
Casos C-33 (delta) y C-03 (pozo) en formato playbook-kit + checklist visual;
e2e MCP por juego.

- **delta:** purgar gotas hundidas del mar (alternativa a salvage: se destruyen).
- **pozo:** derramar el nivel del pozo de golpe (agua no etiquetable).

## Archivos tocados

- modificado `packages/games/delta/arg-domain/src/{contract,reducer,flow-engine,domain-state}.mjs` — intent `empty`
- creado `packages/games/delta/arg-domain/test/empty.test.mjs` — unit + domain-state
- modificado `packages/games/delta/arg-player-mcp/src/logic.mjs` — tool `player_empty`
- modificado `packages/games/delta/arg-player-mcp/test/playbook-coherence.test.mjs` — C-33
- modificado `packages/games/delta/spec/{CASOS,CONTRATO,LORE}.md` — trama + C-33
- modificado `packages/games/delta/arg-demos/apps/authority/**` — gemelo ops
- modificado `packages/games/pozo/src/{contract,domain,authority,player-mcp/logic}.mjs`
- modificado `packages/games/pozo/spec/CASOS.md` + tests + README — C-03
- modificado `e2e/{arg-mcp,pozo-mcp}-demo.mjs` — gates vaciado
- modificado `package-lock.json` — deps volumes-ops en arg-demos/pozo
- creado `plan/REPORTES/WP-U83-crecer-vaciar.md` — este reporte

## Evidencia

### Unit + coherencia

```
$ node --test packages/games/delta/arg-domain/test/empty.test.mjs
# tests 5 / pass 5 / fail 0

$ npm test -w @zeus/arg-domain
# tests 65 / pass 65 / fail 0

$ npm test -w @zeus/pozo
# tests 7 / pass 7 / fail 0

$ npm test -w @zeus/arg-player-mcp
# tests 22 / pass 22 / fail 0  (incluye coherencia C-33)
```

### e2e MCP vaciado por juego

```
$ npm run e2e:pozo-mcp
✅ G-POZO.0 coherencia CASOS.md · C-01,C-02,C-03
✅ G-POZO.1 tools · …player_empty
✅ G-POZO.2 C-01 · ok
✅ G-POZO.2 C-02 · ok
✅ G-POZO.2 C-03 · error=pozo_ya_vacio   # último paso esperado del caso
✅ G-POZO.3 runner ok
✅ G-POZO.4 sin imports arg/delta
🟢 e2e pozo-mcp: C-01/C-02/C-03 + gates en verde

$ npm run e2e:arg-mcp
✅ G-MCP.1 … player_empty en tools
…
✅ G-MCP.9 empty (C-33) · removed=27 · murk 28.2→3.2 · again=timeout_confirmacion
🟢 e2e CAUDAL MCP: todos los gates en verde
```

Nota G-MCP.9: el segundo `player_empty` (rechazo) llega como
`timeout_confirmacion` en el wrapper aunque la autoridad registra
`nada_que_vaciar`; el CA de ledger/score del primer vaciado está verde.
Rechazo idempotente cubierto en unit (`nada_que_vaciar` / `pozo_ya_vacio`).

### Gates / lint

```
$ npm run gates
gates: OK (0 offenders)

$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # preexistentes; cero errores nuevos
```

`ZEUS_OPEN_BROWSER` unset (= no abre).

### Pregunta obligatoria (CA)

| pregunta | respuesta |
| -------- | --------- |
| ¿casos nuevos pasan coherencia playbook-kit? | Sí — C-33 (delta) y C-03 (pozo) en expectedIds |
| ¿e2e MCP vaciado en delta Y pozo? | Sí — G-MCP.9 y G-POZO.2 C-03 |
| ¿scoring/ledger reflejan el ciclo? | Sí — `score.emptied` + ledger `kind:"empty"` + `opsIntent:"empty_playable"`; autoridad asienta ops twin |

## Demolición

n/a.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no — e2e usa puertos aislados
  locales; ops ledger en tmpdir / `ZEUS_OPS_LEDGER_PATH`.
- [x] Cadenas if/switch → tabla: handlers en `HANDLERS` / pozo `handlers`;
  collectLedger añade rama `empty` (mismo patrón preexistente).
- [x] Duplicación: consume `@zeus/volumes-ops` `empty_playable` en borde
  autoridad; dominio puro sin fs. Roles espejo del catálogo U82.
- [x] console.log / código comentado / TODO sin backlog: no (solo
  `console.warn` ops twin fallido, patrón autoridad).
- [x] Nombres de transición: no. `empty` / `emptied` del glosario vaciado.
- [x] Demolición: n/a.
- [x] Tests de comportamiento: murk/removed/ledger/score/rechazos.
- [x] Arranque real: e2e MCP ambos juegos (sin navegador).
- [x] README/specs actualizados (arg-domain, pozo, CONTRATO, LORE, CASOS).
- [x] Diff solo alcance U83 (+ lockfile deps + reporte).

Regla dos juegos: ambos consumen el ciclo con trama propia; engine
volumes-ops no nombrado desde dominio (solo borde autoridad).

## Hallazgos fuera de alcance

1. Tras `empty`, el wrapper MCP a veces reporta `timeout_confirmacion` en el
   rechazo idempotente aunque la autoridad ya aplicó `nada_que_vaciar`
   (confirmIntent/unchanged). Candidato a pulido en player-mcp-kit.
2. e2e arg-mcp acumula murk alto (~28) antes de C-33; reabrir grifo para
   generar más vertido colapsa la ronda — el gate vacía hundidas residuales.
3. Proyección visual del vaciado (gotas que desaparecen en tablero): e2e no
   abre navegador; checklist V4.9 queda para pasada humana.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
