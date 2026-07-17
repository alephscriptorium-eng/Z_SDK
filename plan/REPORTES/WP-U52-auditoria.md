# WP-U52 · auditoria — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm chat WP-U52) |
| fecha | 2026-07-17 |
| rama | `wp/u52-auditoria` |
| commit(s) | `e884493` `9a8ba1b` |
| estado propuesto | listo para revisión |

## Qué se hizo

Barrido final de vías muertas post-U50/U51/U53/U54. Inventario de **35**
paquetes workspace (`packages/{engine,editor,mesh,games}` + `examples/` +
`threejs-ui-lib` anidado): **cero huérfanos**. Grep `TODO|FIXME|HACK` en
código de producto: **cero**. Demolición en este WP: ejemplo Angular muerto
`EJEMPLO-MODULAR` (+ CSS), wording «ARG» en `@zeus/game-engine`, comentario
«Backward-compat» engañoso en presets-sdk, READMEs mesh/examples que mentían
rutas `lib/`/`app/` o presentaban `session:state` como contrato room del
visor 3D. Acta de cierre Ola 5 abajo. Push / publish: **no intentado**.

## Archivos tocados

- `packages/mesh/player-3d-ui/README.md` — rutas `engine/`; snapshot vía `onState`
- `packages/mesh/3d-monitor/README.md` — enlace a `player-3d-ui`; sin `packages/app/`
- `examples/ping-pong-bots/README.md` — aclara wire local `session:state` ≠ contrato engine
- `packages/engine/game-engine/package.json` + `src/paths.node.mjs` — sin identidad ARG
- `packages/engine/presets-sdk/src/index.mjs` — comentario barrel (no «compat»)
- `packages/mesh/operator-ui/projects/threejs-ui-lib/EJEMPLO-MODULAR*` — **borrados**
- `packages/mesh/operator-ui/projects/threejs-ui-lib/src/lib/EJEMPLO-MODULAR*` — **borrados**
- `.changeset/wp-u52-auditoria.md` — patch game-engine + presets-sdk
- `plan/REPORTES/WP-U52-auditoria.md` — este reporte (cierre Ola 5)

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Inventario / huérfanos

Script one-shot (no commiteado): walk de `package.json` bajo `packages/` +
`examples/` + edges por deps `package.json` + `rg` de nombres `@zeus/*`.

```
=== ORPHANS ===
(none)
```

35 paquetes; todos con ≥1 consumidor real (otro paquete, scripts raíz,
`e2e/`/`scripts/`/`docs/`) o rol de entrypoint documentado.

### `TODO|FIXME|HACK` (producto)

```
rg -n "\bTODO\b|\bFIXME\b|\bHACK\b" packages examples scripts e2e test \
  --glob '!**/node_modules/**' --glob '!**/dist/**' …
(exit 1 / sin matches en código de producto)
```

(Matches previos solo en `plan/REPORTES/*`, plantillas PRACTICAS, hashes lock.)

### Demolición EJEMPLO-MODULAR

```
rg -l "EJEMPLO-MODULAR|ejemplo-modular" packages/mesh/operator-ui \
  --glob '!**/node_modules/**' --glob '!**/dist/**'
(exit 1 / sin matches)
```

### `npm run gates`

```
gates: OK (0 offenders)
```

### `npm run lint`

```
✖ 12 problems (0 errors, 12 warnings)
```

(warnings preexistentes; 0 errors)

### `npm test -w @zeus/game-engine`

```
# tests 4
# pass 4
# fail 0
```

### Arranque visual

⏳ sin verificar — WP de auditoría/docs/demolición; no se levantaron viewers.

---

## Tabla paquete → consumidores

Leyenda de rol: **P** = publicable (`engine/*` sin `private`); **E** =
entrypoint/demo (scripts raíz / demos); **M** = mesh/editor/games privado;
**X** = example.

| paquete | path | rol | consumidores reales (resumen) |
| ------- | ---- | --- | ----------------------------- |
| `@zeus/protocol` | `engine/protocol` | P | authority-kit, arg-domain, arg-console, operator-bridge, player-mcp-kit, player-ui, pozo, docs, scripts, root |
| `@zeus/authority-kit` | `engine/authority-kit` | P | arg-demos, pozo, player-ui, docs, root |
| `@zeus/player-mcp-kit` | `engine/player-mcp-kit` | P | arg-player-mcp, pozo, docs, root |
| `@zeus/playbook-kit` | `engine/playbook-kit` | P | arg-player-mcp, player-mcp-kit, pozo, docs, e2e, root |
| `@zeus/view-kit` | `engine/view-kit` | P | arg-console, 3d-monitor, player-3d-ui, pozo, docs, root |
| `@zeus/game-engine` | `engine/game-engine` | P | arg-domain, arg-console, ui-3d-kit, player-3d-ui, 3d-monitor, game-demos, root |
| `@zeus/rooms` | `engine/rooms` | P | app-shell, authority-kit, player-mcp-kit, room-client-browser, socket-server, player-ui, pozo, demos/bots, mesh browsers, docs, e2e, scripts, root |
| `@zeus/room-client-browser` | `engine/room-client-browser` | P | player-ui, player-3d-ui, 3d-monitor, arg-console, operator-ui, pozo, rooms, docs |
| `@zeus/presets-sdk` | `engine/presets-sdk` | P | casi todo el mesh + engine + games + e2e/scripts/docs/root |
| `@zeus/http-contract` | `engine/http-contract` | P | cache/firehose/editor/linea/player-ui/presets/protocol/solar/test-utils/ui-kit, docs, root |
| `@zeus/ui-kit` | `engine/ui-kit` | P | app-shell, editor, browsers, player-*, 3d-monitor, arg-console, presets |
| `@zeus/ui-3d-kit` | `engine/ui-3d-kit` | P | player-3d-ui, 3d-monitor, arg-console, view-kit, pozo, threejs-ui-lib, operator-ui, game-engine |
| `@zeus/app-shell` | `engine/app-shell` | P | editor-ui, player-ui, player-3d-ui, 3d-monitor, browsers, console-monitor, arg-console |
| `@zeus/firehose-core` | `engine/firehose-core` | P | firehose-browser, linea-firehose, player-ui |
| `@zeus/test-utils` | `engine/test-utils` | P | browsers, linea-*, solar, player-ui, console-monitor, arg-feeds, arg-player-mcp, e2e |
| `@zeus/editor-ui` | `editor/editor-ui` | M/E | root scripts (`start:editor`) |
| `@zeus/socket-server` | `mesh/socket-server` | M/E | player-ui, e2e, root |
| `@zeus/player-ui` | `mesh/player-ui` | M/E | console-monitor, root |
| `@zeus/player-3d-ui` | `mesh/player-3d-ui` | M/E | 3d-monitor, ui-3d-kit (refs), root |
| `@zeus/3d-monitor` | `mesh/3d-monitor` | M/E | ui-3d-kit, root |
| `@zeus/operator-ui` | `mesh/operator-ui` | M/E | operator-bridge; entrypoint `start:operator-ui` / serve.mjs |
| `@zeus/operator-bridge` | `mesh/operator-bridge` | M | operator-ui, root tests |
| `@zeus/threejs-ui-lib` | `mesh/operator-ui/projects/…` | M | operator-ui, operator-bridge |
| `@zeus/cache-browser` | `mesh/cache-browser` | M/E | presets-sdk refs, root |
| `@zeus/firehose-browser` | `mesh/firehose-browser` | M/E | presets-sdk, docs, root |
| `@zeus/console-monitor` | `mesh/console-monitor` | M/E | root |
| `@zeus/linea-system` | `mesh/linea-system` | M/E | cache-browser, root |
| `@zeus/linea-firehose` | `mesh/linea-firehose` | M/E | e2e, root |
| `@zeus/solar-system` | `mesh/solar-system` | M/E | e2e, root |
| `@zeus/arg-domain` | `games/delta/arg-domain` | M | arg-*, cache/firehose, protocol/view-kit tests, e2e/scripts/test, root |
| `@zeus/arg-feeds` | `games/delta/arg-feeds` | M | arg-demos, root |
| `@zeus/arg-console` | `games/delta/arg-console` | M/E | arg-demos, root |
| `@zeus/arg-player-mcp` | `games/delta/arg-player-mcp` | M/E | root |
| `@zeus/arg-demos` | `games/delta/arg-demos` | M/E | root (`demo:arg`) |
| `@zeus/pozo` | `games/pozo` | M/E | docs, root (`demo:pozo`) |
| `@zeus/game-demos` | `examples/game-demos` | X/E | game-engine, root |
| `@zeus/ping-pong-bots` | `examples/ping-pong-bots` | X/E | game-engine, root |

**¿Tabla completa?** Sí (todos los `package.json` del workspace).

**Huérfanos:** 0 (ningún paquete sin consumidores ni rol entrypoint/demo).

---

## Demolición

| ítem | acción | grep post |
| ---- | ------ | --------- |
| `EJEMPLO-MODULAR.component.ts` ×2 + CSS | borrado | cero refs |
| game-engine «ARG» en description / comment | reescrito (D-8) | cero «for the ARG» |
| READMEs `../../lib/`, `packages/app/` | corregidos | cero en READMEs mesh vivos |
| player-3d-ui README `session:state` como evento room | → `onState` | solo aclaración en ping-pong (wire local vivo) |
| comentario Backward-compat presets-sdk | reescrito | — |

### Residuales **no** demolidos aquí (grandes → WP)

1. **`file:` en operator-ui / threejs-ui-lib** — install aislado Angular
   (`npm --prefix packages/mesh/operator-ui`); no se puede pasar a `*` del
   workspace sin cambiar el modelo de build, ni a semver de registry sin
   publish real. Propuesta: **WP-U55** (post-publish / o unificar install).
2. **Wire vivo `session:*` en player-ui / socket-server / console-monitor /
   ping-pong-bots** — no es código muerto: es el protocolo local DJ. El
   contrato room del engine ya es `state`/`intent`. Migrar/demoler el wire
   local es un WP de producto, no higiene. Propuesta: **WP-U56** (ola ≥6 o
   backlog mesh).

```
# file: residuales (vivos, justificados hasta registry)
@zeus/operator-ui → file:../operator-bridge
@zeus/operator-ui → file:../../engine/room-client-browser
@zeus/operator-ui → file:../../engine/ui-3d-kit
@zeus/threejs-ui-lib → file:../../../../engine/ui-3d-kit
```

---

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no añadidos.
- [x] Cadenas if/switch que debieron ser tabla: n/a (docs/demolición).
- [x] Duplicación con otros paquetes: no.
- [x] console.log / código comentado / TODO sin backlog: TODOs producto = 0;
      EJEMPLO comentado demolido; `session:*` vivo documentado → WP-U56.
- [x] Nombres fuera de glosario o de transición: se eliminó wording ARG /
      Backward-compat engañoso.
- [x] Demolición completa (grep arriba): sí para ítems de este WP; file:/session
      diferidos con WP explícito.
- [x] Tests prueban comportamiento: n/a nuevos; game-engine 4/4 verde tras
      change de metadata.
- [ ] Arranque real verificado: ⏳ auditoría/docs.
- [x] README/specs del paquete siguen siendo verdad: READMEs tocados alineados
      al layout U51 y al wire real.
- [x] El diff contiene solo el alcance del WP: sí (sin BACKLOG).

---

## Acta de cierre — Refundación Ola 5

### Resumen ejecutivo (olas 0–5)

| Ola | Enfoque | Estado |
| --- | ------- | ------ |
| **0** | Gates, tests núcleo, identidad delta, CI Z_SDK | ✅ cerrado |
| **1** | Contrato único `protocol` + kits authority / player-mcp / playbook | ✅ |
| **2** | view-kit, app-shell, pozo (2º juego), envelope game | ✅ |
| **3** | DJ intents, player-ui DJ, operator-ui contrato único | ✅ |
| **4** | Route→MCP, portal docs (VitePress) | ✅ |
| **5** | Monorepo publicable + layout final + semver CI + consumidores externos + **auditoría** | ✅ con U52 |

### Ola 5 — piezas

| WP | Resultado |
| -- | --------- |
| **U50** Scope publish | 15 engine publicables; `release:dry`; registry install ⏳ (política) |
| **U51** Layout final | `packages/{engine,editor,mesh,games}` + `examples/`; carpetas `lib/app/platform/mcp/arg` demolidas |
| **U53** Changesets + release CI | semver por paquete; publish real ⏳ (sin token en swarm) |
| **U54** Consumidores externos | `.d.ts` + smoke Node/Bun; registry smoke ⏳ |
| **U52** Auditoría (este) | tabla completa; 0 huérfanos; 0 TODO sueltos; demoliciones menores; residuales → U55/U56 |

### Postura del monorepo al cierre

- Layout y reglas de dependencia (ARQUITECTURA §2/§4) **vivos y gateados**.
- Engine publicable en metadata; **primer publish registry** sigue pendiente
  de credenciales/CI (no bloquea cierre de ola de código).
- Dos juegos (`delta`, `pozo`) consumen kits; D-8 intacto.
- Deuda explícita post-Ola 5: `file:` Angular (U55), wire `session:*` DJ
  local (U56), e2e ambientales ya en colas U51 (C-30, VOLUMES, :13022).

**Pregunta CA:** ¿tabla completa? **sí**. ¿gates verdes? **sí**.
¿huérfanos/TODO-sin-backlog/código-comentado = 0 o WP nuevo? **0 en producto
tras demoliciones; residuales grandes → WP-U55 / WP-U56**. ¿READMEs veraces?
**sí los tocados; root/delta ya alineados U51**. ¿Acta cierre Ola 5? **sí
(esta sección)**.

---

## Hallazgos fuera de alcance

1. **Proponer WP-U55 · Demoler `file:` operator-ui** — tras publish engine al
   registry (o unificar `npm --prefix` con workspaces raíz).
2. **Proponer WP-U56 · Retirar wire `session:*` del stack DJ** — player-ui,
   socket-server allowlist, console-monitor, ping-pong session-participant;
   sustituir por contrato room / proyección ya usada en operator-ui (U32).
3. Colas U51 abiertas (no reabiertas): C-30 playbook, VOLUMES e2e, huérfano
   `:13022` en e2e:operator-ui.
4. Lint: 12 warnings preexistentes (no tocados; fuera de demolición U52).

## Dudas / bloqueos

Ninguno bloqueante. Orquestador: ¿aceptar U55/U56 como WPs nuevos en
BACKLOG (ola 6+ o cola mesh) sin reabrir Ola 5?

Push: **no intentado** (política brief).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
