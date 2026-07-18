# WP-U87 · solve-coagula — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (lote-ola9-b+catalog / Cursor Grok) |
| fecha | 2026-07-18 |
| rama | `wp/u87-solve-coagula` (zeus) · `wp/u87-solve-coagula` (library) |
| commit(s) | library: `e2f3eb1`; zeus: (este reporte + punteros) |
| estado propuesto | listo para revisión |
| push monorepo | **no intentado** (política worker) |
| push library | OK `origin/wp/u87-solve-coagula` |

## Qué se hizo

Se recreó **SOLVE ET COAGULA** como tercer juego de producto en
`Z_SDK-games-library`: dramaturgia sembrada vía CARPETA DRAMATURGO (U86) +
overlay del original `scriptorium-network-games/SOLVE_ET_COAGULA` (sin
modificar originales); paquete `@zeus/solve-coagula` (dominio `join` /
`open_act` / `consult_linea`, authority-kit, MCP, vista lectora); start pack
`@zeus/startpack-solve-coagula` con fixture **linea-aleph** (registro_count
677); fila Notario; e2e C-01..C-03 en verde; GitHub Release
`startpack-solve-coagula-v0.1.0`. En Z_SDK: punteros README/`docs/games` +
este reporte. **No** se tocó engine/editor (gaps → §hallazgos). delta+pozo
siguen siendo el mínimo de la regla de los dos juegos.

## Archivos tocados

### Library `Z_SDK-games-library` (push OK · `e2f3eb1`)

| archivo | acción |
| ------- | ------ |
| `packages/solve-coagula/**` | creado — juego + dramaturgia + CASOS + tests |
| `packages/startpack-solve-coagula/**` | creado — pack + fixture linea + acta |
| `e2e/solve-coagula-mcp-demo.mjs` | creado — e2e MCP |
| `scripts/lib/startpack-games.mjs` | fila `solve-coagula` |
| `scripts/resolve-startpack.mjs` | env `ZEUS_STARTPACK_SOLVE_COAGULA` |
| `package.json` / lock / README / `docs/startpacks.md` / `e2e/roots.mjs` | scripts + docs |

### Monorepo Z_SDK (`wp/u87-solve-coagula`)

| archivo | acción |
| ------- | ------ |
| `README.md` | modificado — puntero solve-coagula |
| `docs/games/index.md` | modificado — sección WP-U87 |
| `plan/REPORTES/WP-U87-solve-coagula.md` | creado — este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Library — unit

```
npm test -w @zeus/solve-coagula
# tests 6 # suites 2 # pass 6 # fail 0

npm test -w @zeus/startpack-solve-coagula
# tests 1 # pass 1 # fail 0
```

### Library — e2e mesh (CA)

```
npm run e2e:solve-coagula-mcp

✅ G-SOLVE.0 coherencia CASOS.md · C-01,C-02,C-03
✅ G-SOLVE.1 tools · player_join,player_state,player_open_act,player_consult_linea
✅ G-SOLVE.2 C-01 · ok evidencia=sí
✅ G-SOLVE.2 C-02 · ok evidencia=sí
✅ G-SOLVE.2 C-03 · ok evidencia=sí
✅ G-SOLVE.3 runner ok · 3 filas
✅ G-SOLVE.4 sin imports arg/delta · limpio

🟢 e2e solve-coagula-mcp: C-01/C-02/C-03 + gates en verde
```

### Notario + acta + tarball instalable

```
node scripts/notario-release.mjs --game solve-coagula --skip-tests
✅ Notario done · checks loadStartPack/volumes/acta/gamemap todos ok
tarball: .release-startpack/zeus-startpack-solve-coagula-0.1.0.tgz

npm install ./zeus-startpack-solve-coagula-0.1.0.tgz → OK
loadStartPack OK solve-coagula solve-coagula-demo acts=8
```

### GitHub Release (library)

```
GitHub Release: startpack-solve-coagula-v0.1.0 OK
tag: startpack-solve-coagula-v0.1.0
https://github.com/alephscriptorium-eng/Z_SDK-games-library/releases/tag/startpack-solve-coagula-v0.1.0
```

### Vista / smoke HTTP

```
view health: {"status":"ok","service":"solve-view","game":"solve-coagula","acts":8,"linea":677,...}
```

Mesh completo con room conectada: cubierto por e2e (arriba). Smoke ad-hoc
con puertos aislados: MCP `status:ok` pero `connected:false` cuando el
socket-server no aceptó a tiempo en ese host — no contradice el e2e verde.

Navegador humano: `⏳ sin verificar` (`ZEUS_OPEN_BROWSER` no usado).

### Story-board schema (kit U86)

```
✅ .../packages/solve-coagula/dramaturgia/readerapp/story-board.json
   dialect=solve-inline  act-0→[panel-elenco]; … act-7→[…]
```

### Push

- Library: `git push -u origin wp/u87-solve-coagula` → OK (`e2f3eb1`)
- Z_SDK monorepo: **no intentado** (política swarm)

### Originales intactos

`scriptorium-network-games/SOLVE_ET_COAGULA` — no modificado (solo lectura /
copia a library).

## Demolición

n/a (nacimiento; delta+pozo intactos como mínimo de la regla de los dos juegos).

```
(no aplica)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: MCP/vista vía `readEnvPort`
      (`ZEUS_MCP_SOLVE` / `ZEUS_PORT_SOLVE_VIEW`); scriptorium vía
      `resolveZeusUiPorts`. Defaults del juego (4132/3026) — hallazgo slots
      en presets-sdk (mismo patrón pozo). CASOS.md cita localhost como docs.
- [x] Cadenas if/switch → tablas: handlers `{ join, open_act, consult_linea }`;
      `STARTPACK_GAMES` tabla; resolve env por mapa.
- [x] Duplicación: patrón authority/MCP/vista alineado a pozo (consumo kits),
      no copy de delta. Dramaturgia desde kit U86 + overlay original.
- [x] console.log / código comentado / TODO sin backlog: logs de arranque
      (patrón authority); sin TODO.
- [x] Nombres: `solve-coagula` solo en library/juego; engine intacto.
- [x] Demolición: n/a.
- [x] Tests de comportamiento: domain + coherencia CASOS + e2e evidencia.
- [x] Arranque real: e2e mesh verde; vista health OK; browser humano no abierto.
- [x] README/specs: README juego + library + docs/games + acta Notario.
- [x] Diff solo alcance WP: sí (library juego/startpack + punteros zeus;
      sin BACKLOG).

## Hallazgos fuera de alcance — «qué faltó al editor/kits»

Patrón WP-U23 (backlog mundo A; **no** parcheado aquí):

1. **Editor U70 solo materializa `sketch`** — `validateDraft` exige
   `gameId === 'sketch'`; no hay materialize de dramaturgia / story-board /
   blockchain. SOLVE no se pudo *producir* desde la UI del editor; se armó
   en library a mano + kit U86.
2. **Editor sin materiales narrativos** — catálogo = escena
   `vaiven-dos-nodos` + línea juguete + casos; cero REIC, actos, uichain,
   agentchain. Falta un modo «mundo A / carpeta dramaturgo» en editor-ui.
3. **Carpeta dramaturgo: instantiate ≠ importar obra** — solo rellena
   plantilla vacía; no hay `--from SOLVE_ET_COAGULA` ni sync de blockchain
   real. El overlay se hizo a mano (copia de archivos).
4. **Widgets SOLVE sin runtime en mesh** — `panel-elenco`, `panel-heatmap`,
   etc. son specs `uichain/*.prompt.md`; view-kit no los renderiza. Vista
   U87 = lista de actos + meta linea (honesta), no el teatro transmedia.
5. **linea-kit / startpack no montan linea-aleph vivo** — starterkit =
   `juguete`; corpus 48 MB queda fuera de git. Fixture subset en startpack;
   montaje completo vía `ZEUS_LINEA_ALEPH_ROOT` documentado, no cableado al
   editor.
6. **Skills stub** (`disfraz-rude-bot`, browsers de caché) siguen solo en
   network-engine (`STUBS.md`); U87 no las reimplementa.
7. **Slots `solvePlayer` / `solveView` ausentes** en `presets-sdk/env` +
   `KNOWN_ZEUS_PORTS` (mismo hallazgo histórico de pozo).
8. **Dialectos story-board** (U86): SOLVE usa widgets en `acts[]`; el editor
   sketch no conoce el schema.

## Dudas / bloqueos

Ninguno. CA cumplido en library (mesh e2e + acta Notario + Release). Monorepo
solo punteros; push zeus no intentado.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
