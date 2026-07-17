# WP-U13 · playbook-kit — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U13) |
| fecha | 2026-07-17 |
| rama | `wp/u13-playbook-kit` |
| commit(s) | `61dc749` feat(playbook-kit) · `471d1b7` refactor(player-mcp-kit)! · `982e2c4` refactor(arg-player-mcp)! · `d0fa43a` docs(reportes) |
| estado propuesto | listo para revisión |
| push | no intentado |
| browsers | no launch (`ZEUS_OPEN_BROWSER` no set) |

## Qué se hizo

Se creó `@zeus/playbook-kit` (`packages/lib/playbook-kit`): parseo de
playbook (`listCasoIds` / `extractCaso`, absorbido desde player-mcp-kit),
formato de caso (precondición / pasos MCP / observación humana / criterio /
errores), `checkPlaybookCoherence`, plantilla de acta, cliente MCP HTTP y
`runMcpCases` (mitad MCP; deps de precondición como setup). `arg-player-mcp`
valida `packages/arg/spec/CASOS.md` con el kit; se demuele `casos.test.mjs`.
E2E `e2e:playbook-kit` ejecuta C-01 / C-03 / C-04b / C-05 contra stack
equivalente a `demo:arg` (socket + autoridad + MCP uno, puertos aislados) y
escribe acta pre-rellenada con evidencia MCP.

## Archivos tocados

- creado `packages/lib/playbook-kit/**` — paquete + tests + README + plantilla + CLI
- creado `e2e/playbook-kit-demo.mjs` — CA runner + acta
- modificado `package.json` / `package-lock.json` — scripts `test:playbook-kit`, `e2e:playbook-kit`
- modificado `packages/lib/player-mcp-kit/**` — quita `casos-md` (absorción)
- modificado `packages/arg/arg-player-mcp/**` — dep playbook-kit; demuele `casos.test.mjs`
- creado `plan/REPORTES/WP-U13-playbook-kit.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/playbook-kit` → exit 0:

```
# tests 13
# pass 13
# fail 0
```

- `npm run test:arg-player-mcp` → exit 0:

```
# tests 20
# pass 20
# fail 0
```

(incluye `CASOS.md pasa coherencia del playbook-kit`)

- `npm test -w @zeus/player-mcp-kit` → exit 0:

```
# tests 8
# pass 8
# fail 0
```

- `npm run e2e:playbook-kit` → exit 0 (sin `ZEUS_OPEN_BROWSER`):

```
✅ G-PB.0 coherencia CASOS.md · 21 casos
✅ G-PB.1 acta escrita · …\Temp\zeus-playbook-kit-acta-21608.md
✅ G-PB.2 C-01 · ok evidencia=—
✅ G-PB.2 C-03 · ok evidencia=sí
✅ G-PB.2 C-04b · error=sin_contacto
✅ G-PB.2 C-05 · ok evidencia=—
✅ G-PB.3 C-04 setup para C-05 · contacto open
✅ G-PB.4 runner ok · 5 filas en acta

🟢 e2e playbook-kit: CA C-01/03/04b/05 + acta en verde
```

- Fragmento del acta generada (observación humana en ⏳; MCP relleno):

```
### C-04b — tap_set SIN contacto ⇒ rechazado · caso · MCP ✅
- Observación humana: ⏳ sin verificar
- Evidencia MCP:
  - `player_tap_set` {"tapId":"grifo-a","aperture":0.75} → `{"ok":false,"error":"sin_contacto",…}`

### C-05 — tap_set 0.75 con contacto · caso · MCP ✅
- Evidencia MCP:
  - `player_tap_set` … → `{"ok":true,"evidencia":{"grifo":{"aperture":0.75,…}}}`
  - `player_observe` {"what":"taps"} → aperture 0.75 en grifo-a
```

- `npm run lint` → exit 0 (0 errors; 16 warnings preexistentes ajenos).
- `npm run gates` → `gates: OK (0 offenders)`.

- Vista humana de `demo:arg`: ⏳ sin verificar (CA es mitad MCP; no se abrió browser).

## Demolición

1. `packages/arg/arg-player-mcp/test/casos.test.mjs` →
   `test/playbook-coherence.test.mjs` (kit).
2. `packages/lib/player-mcp-kit/src/casos-md.mjs` (+ test) →
   `packages/lib/playbook-kit/src/casos-md.mjs`.

```
$ rg "casos\.test\.mjs" packages --glob '!**/playbook-kit/**'
(solo comentario en playbook-coherence.test.mjs / coherence.mjs)

$ rg "listCasoIds" packages/lib/player-mcp-kit/src
(sin coincidencias)

$ rg "\b(delta|pozo|grifo|cantera)\b" packages/lib/playbook-kit/src packages/lib/playbook-kit/bin
(sin coincidencias)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: CLI usa `resolveZeusMcpPorts` /
  `resolveZeusHost`. E2e usa puertos aislados por env (mismo patrón que
  `e2e:arg-mcp`); no hardcode en el kit publicable.
- [x] Cadenas if/switch → tablas: n/a relevante; deps/parseo por regex + maps.
- [x] Duplicación: `casos-md` absorbido; arg ya no tiene coherencia local.
- [x] console.log / comentado / TODO sin backlog: no en el kit.
- [x] Nombres glosario / transición: sin legacy/v2; playbook-kit en layout
  provisional `packages/lib/` (U51 moverá a engine/).
- [x] Demolición completa (grep arriba).
- [x] Tests de comportamiento: coherencia, parse, deps C-04b/C-05, runner mock,
  e2e real.
- [x] Arranque real: e2e levantó socket+autoridad+MCP; acta escrita. Browser no.
- [x] README del paquete alineado con API.
- [x] Diff solo alcance U13 (+ scripts root mínimos).

### ¿pozo puede consumir `@zeus/playbook-kit` tal cual? (PRACTICAS §1.11)

**Sí.** El kit no nombra juegos: exige markdown `## C-xx — …` con los cinco
campos y llamadas `` `tool {json}` ``. Pozo aporta su `CASOS.md`, patrón de
tools y URL/puerto MCP vía env.

## Hallazgos fuera de alcance

- E2e usa stack aislado (como `e2e:arg-mcp`), no el launcher completo
  `npm run demo:arg` (console + browsers). Misma autoridad/MCP; documentado en
  el comando del acta. Si el orquestador exige literalmente el launcher, es
  un ajuste menor del e2e.
- Cola U12: ruido `EADDRINUSE` / health null por MCP huérfanos — no reproducido
  en esta pasada (puertos 13037/14131).
- `arg/spec/VALIDACION.md` del juego delta sigue siendo la plantilla humana
  rica (paradas V0–V7); el kit aporta plantilla genérica + relleno MCP. No se
  demuele la de delta (sigue útil para pasadas humanas completas).

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
