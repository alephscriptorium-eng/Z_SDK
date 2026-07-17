# WP-U30 · dj-intents — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (Cursor Grok) |
| fecha | 2026-07-17 |
| rama | `wp/u30-dj-intents` |
| commit(s) | `b6cf972` feat(arg-domain): intents dj cache/curate/milestone con line-board · `a89d948` docs(arg): diseño DJ en CONTRATO/LORE y casos C-30..C-32 |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

Se diseñó en el spec delta (CONTRATO + LORE) el tablero de líneas del
manipulador y se cableó en `@zeus/arg-domain`: intents con rol `dj`
`cache` / `curate` / `milestone`, hermanos de `label:cast` y `excavate`.

Cadena de dominio: registro ghost → cached → `delta_status`
pending→draft→curated (un paso) → milestone con `reasons[]`. Cada paso
asienta ledger (`kind` homónimo) y sube score (`cached` / `curated` /
`milestoned`). Snapshot añade `lines: { rev, regs: [[…]] }` compacto
(~74 B semilla). Player sin rol `dj` recibe `rol_no_autorizado`.

Casos C-30/C-31/C-32 en CASOS.md (formato playbook-kit, tools `dj_*`
provisionales hasta U31). Pozo no gana intents DJ (juego mínimo propio);
se verificó sin regresión.

## Archivos tocados

- creado `packages/arg/arg-domain/src/line-board.mjs` — motor puro del tablero
- modificado `packages/arg/arg-domain/src/contract.mjs` — INTENT_DEFS dj
- modificado `packages/arg/arg-domain/src/reducer.mjs` — handlers cache/curate/milestone
- modificado `packages/arg/arg-domain/src/domain-state.mjs` — ops, ledger, snapshot, approval en cache
- modificado `packages/arg/arg-domain/src/index.mjs` — exports line-board
- modificado `packages/arg/arg-domain/README.md` — documenta line-board
- creado `packages/arg/arg-domain/test/line-board.test.mjs`
- modificado `packages/arg/arg-domain/test/reducer.test.mjs` — válidos/inválidos dj
- modificado `packages/arg/arg-domain/test/domain-state.test.mjs` — ledger + rol
- modificado `packages/arg/spec/CONTRATO.md` — entidad + tabla reducer + wire
- modificado `packages/arg/spec/LORE.md` — sección manipulador
- modificado `packages/arg/spec/CASOS.md` — C-30..C-32
- modificado `packages/arg/arg-player-mcp/test/playbook-coherence.test.mjs` — ids + patrón dj_

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm run test:arg-domain` → **59 pass**, 0 fail
- `npm run test:arg` → **verde** (domain + feeds + console + player-mcp)
- `npm run test:pozo` → **6 pass**, 0 fail
- `npm run gates` → `gates: OK (0 offenders)`
- `npm run lint` → 0 errors (18 warnings preexistentes ajenos)
- `npm run e2e:pozo-mcp` → verde (`C-01/C-02 + gates`)
- e2e delta / `demo:arg` con navegador: `⏳ sin verificar` (CA no exige
  decks UI; U31; `ZEUS_OPEN_BROWSER` no seteado)
- Presupuesto snapshot (script local, 8 bots + dj + 1 cache):

```
{"before":2884,"after":3175,"delta":291,"linesBytes":74,
 "lines":{"rev":1,"regs":[["linea-aleph","P03",1,0,0],["linea-aleph","P04",0,0,0]]}}
```

- Ledger (test domain-state): entradas `cache` / `curate` / `milestone` con
  `actorId`, `ref`, `detail.lineId|registroId|status|reasons`.

### ¿delta y pozo verdes donde aplique? (PRACTICAS §1.11)

- **delta:** sí — dominio + playbook coherencia.
- **pozo:** no necesita `cache`/`curate`/`milestone` (trama propia
  `draw_drop`; no hay line-board). Verificado `test:pozo` + `e2e:pozo-mcp`
  verdes; cero imports de arg/delta en pozo (G-POZO.4). No se forzó
  simetría falsa ni se tocó engine.

## Demolición

n/a (adición al dominio).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; refs `linea://…` son ids de
  dominio, no URLs de servicio.
- [x] Cadenas if/switch que debieron ser tabla: handlers en `HANDLERS`;
  collectLedger por kind; applyOps por `op` (mismo patrón preexistente).
- [x] Duplicación con otros paquetes: line-board vive en arg-domain (juego);
  protocol ya tenía rol `dj` (U10). No se copió a engine.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: `cache`/`curate`/`milestone`
  del glosario VISION/DATOS; sin v2/old/new.
- [x] Demolición completa: n/a.
- [x] Tests prueban comportamiento (rol, cadena, rechazos, ledger, score).
- [ ] Arranque real verificado: `⏳` demo:arg no levantada (alcance dominio;
  U31 para decks).
- [x] README/specs del paquete actualizados (README arg-domain + CONTRATO/
  LORE/CASOS).
- [x] Diff solo alcance U30 (sin BACKLOG, sin player-ui, sin dual-wire).

## Hallazgos fuera de alcance

- Tools MCP `dj_*` y decks player-ui: **U31** (casos ya redactados con
  `pendiente_de_fase` hasta entonces).
- Side-effect real de volumen (`cache_wikitext` / escritura markdown): borde
  autoridad/Notario; U30 solo dominio puro (como excavate sintético).
- `makeIntent` de arg-domain aún no pasa `role` por el 4º opts object (solo
  `from`); los tests meten `role` en args — patrón ya usado en U10. Candidato
  a cleanup menor.
- Cola U10/U11 dual-wire / Peer Card: no mezclado.

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
