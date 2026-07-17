# WP-U00 · gates — reporte

| dato | valor |
| ---- | ----- |
| agente | worker wp/u00-gates |
| fecha | 2026-07-17 |
| rama | `wp/u00-gates` |
| commit(s) | `eed6855` feat(gates); `1c892bb` test(gates); _(este)_ docs(reportes) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se instaló el gate raíz `npm run gates` (estilo grep-gates ARG WP-15) con cuatro
reglas: (a) puertos/URLs de la malla Zeus fuera de `presets-sdk/env`, docs y
specs; (b) nombres de transición (`legacy`/`v2`/`-old`/`-new`/…, sin falso
positivo en `oldid`); (c) nada fuera de `packages/arg/` importa `@zeus/arg-*`;
(d) `packages/engine/**` no nombra conceptos de un juego (no-op hasta que nazca
el layout). Las violaciones preexistentes quedaron en
`scripts/gates/exceptions.mjs` con comentario de por qué, sin desactivar el
gate. El CA se cubre con `test/gates/gates.test.mjs` (verde en repo + rojo
sintético por tipo).

## Archivos tocados

- `package.json` — modificado: scripts `gates` y `test:gates`
- `scripts/gates/scan.mjs` — creado: scanners a–d + `runAllGates`
- `scripts/gates/run.mjs` — creado: CLI exit 1 si hay offenders
- `scripts/gates/exceptions.mjs` — creado: excepciones preexistentes comentadas
- `test/gates/gates.test.mjs` — creado: CA verde + rojo sintético a–d
- `plan/REPORTES/WP-U00-gates.md` — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Comandos ejecutados y su salida relevante (tests, e2e, lint, gates):

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)

$ npm run test:gates

> zeus-sdk@0.1.0 test:gates
> node --test test/gates/*.test.mjs

TAP version 13
# Subtest: CA verde: npm run gates / runAllGates limpio en el repo actual
ok 1 - CA verde: npm run gates / runAllGates limpio en el repo actual
# Subtest: CA rojo (a): puerto hardcodeado detectado
ok 2 - CA rojo (a): puerto hardcodeado detectado
# Subtest: CA rojo (b): nombre de transición detectado
ok 3 - CA rojo (b): nombre de transición detectado
# Subtest: CA rojo (c): import de @zeus/arg-* fuera de packages/arg
ok 4 - CA rojo (c): import de @zeus/arg-* fuera de packages/arg
# Subtest: CA rojo (d): concepto de juego en packages/engine
ok 5 - CA rojo (d): concepto de juego en packages/engine
# Subtest: oldid de dominio no dispara transición -old
ok 6 - oldid de dominio no dispara transición -old
# Subtest: presets-sdk/env puede declarar puertos sin offender
ok 7 - presets-sdk/env puede declarar puertos sin offender
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# duration_ms ~614

$ npm run lint
… (16 warnings preexistentes, 0 errors)
✖ 16 problems (0 errors, 16 warnings)
exit 0
```

- Efecto visible (vistas/demo): n/a (gate de repo, sin UI).

## Demolición

n/a (WP sin demolición).

```
(n/a)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: `KNOWN_ZEUS_PORTS` en `scan.mjs` es
  espejo intencional de `presets-sdk/env` (el gate no importa el módulo para no
  acoplarse); el propio `scripts/gates/` está exento del scan (a). No hay
  nuevos binds en apps.
- [x] Cadenas if/switch que debieron ser tabla: scanners = lista de reglas +
  `EXCEPTIONS[]`; sin switch creciente.
- [x] Duplicación con otros paquetes (busqué antes de responder): patrón tomado
  de `packages/arg/arg-console/test/grep-gates.test.mjs`; no se copió lógica de
  negocio. El listado de puertos duplica defaults de env a propósito (documentado).
- [x] console.log / código comentado / TODO sin backlog: `console.log` solo en
  CLI `run.mjs` (salida del gate). Sin TODO.
- [x] Nombres fuera de glosario o de transición: ningún `legacy`/`v2`/`-old` en
  el código nuevo (salvo literales en tests sintéticos bajo `test/gates/`,
  exentos).
- [x] Demolición completa (grep arriba): n/a.
- [x] Tests prueban comportamiento, no solo «no explota»: rojo sintético por
  tipo (a–d) + verde repo + `oldid` no-falso-positivo + env permitido.
- [x] Arranque real verificado: n/a (no hay proceso de servicio); se ejecutó
  `npm run gates` y `npm run test:gates` de verdad.
- [x] README/specs del paquete siguen siendo verdad: no hay paquete nuevo
  publicable; scripts raíz documentados en `package.json`. No toqué specs ARG.
- [x] El diff contiene solo el alcance del WP: `scripts/gates/`, `test/gates/`,
  `package.json` (+ este reporte). No se editó `plan/BACKLOG.md`.

## Hallazgos fuera de alcance

- Decenas de fallbacks `?? 30xx` / `localhost:3017` fuera de
  `presets-sdk/env` (listados como excepciones). Candidato a WP de limpieza:
  retirar fallbacks y forzar resolver.
- `packages/mcp/{linea-system/src/lineas.mjs,solar-system/src/bodies.mjs}`
  duplican puertos del catálogo MCP; consolidar hacia env.
- Imports mesh→`@zeus/arg-domain` en cache/firehose-browser: se cortan al
  layout `games/` (ola 5); excepciones temporales.
- API `legacy` / SessionManifest `v2` en session-domain/player-ui: ola 3.
- `npm run lint` ya tenía 16 warnings `no-unused-vars` ajenos (no tocados).

## Dudas / bloqueos

- Ningún bloqueo. Nota para orquestador: posible conflicto de merge en
  `package.json` con U01 (scripts raíz) — coordinar al integrar lote 0a.
- ¿Conviene que U03 añada `npm run gates` al job CI sin más cambios? El script
  ya existe y es verde.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
