# WP-U156 · types-subpaths-presets-webrtc-ui3d — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U156 |
| fecha | 2026-07-23 |
| rama | `wp/u156-types-subpaths-presets-webrtc-ui3d` |
| commit(s) | `29e42cf` (feat) · `98ae158` (reporte) |
| eje(s) CA | IV |
| estado propuesto | listo para revisión |

## Qué se hizo

Se añadieron condiciones `"types"` en los subpaths JS públicos de
`@zeus/presets-sdk` usados por el mesh (`./env`, `./docs`, `./paths`,
`./discovery`, `./mcp`, `./volumes`, `./browse-core`, `./anchor-grid`), en
los tres subpaths de `@zeus/webrtc-signaling` (`./peer-session`,
`./messages`, `./peer-card-gate`) y en `@zeus/ui-3d-kit/node`. Cada
condición apunta a un `.d.ts` bajo `src/` o `types/` (incluido en
`files` de publish). Se crearon tres changesets (uno por paquete).
Deferidos sin tipar (documentados): `./horse`, `./presets/contract`,
`./mcp/http-contract`. `@zeus/rooms` no se tocó (N/A).

## Archivos tocados

- creado `.changeset/wp-u156-presets-sdk-types-subpaths.md` — changeset presets-sdk
- creado `.changeset/wp-u156-webrtc-signaling-types-subpaths.md` — changeset webrtc-signaling
- creado `.changeset/wp-u156-ui-3d-kit-types-node.md` — changeset ui-3d-kit
- modificado `packages/engine/presets-sdk/package.json` — exports con `types`
- creado `packages/engine/presets-sdk/src/env/index.d.ts`
- creado `packages/engine/presets-sdk/src/docs/index.d.ts`
- creado `packages/engine/presets-sdk/src/paths/index.d.ts`
- creado `packages/engine/presets-sdk/src/paths/anchor-grid.d.ts`
- creado `packages/engine/presets-sdk/src/discovery/index.d.ts`
- creado `packages/engine/presets-sdk/src/mcp/index.d.ts`
- creado `packages/engine/presets-sdk/src/volumes/index.d.ts`
- creado `packages/engine/presets-sdk/src/volumes/browse-core.d.ts`
- modificado `packages/engine/webrtc-signaling/package.json` — exports con `types`
- creado `packages/engine/webrtc-signaling/types/messages.d.ts`
- creado `packages/engine/webrtc-signaling/types/peer-session.d.ts`
- creado `packages/engine/webrtc-signaling/types/peer-card-gate.d.ts`
- modificado `packages/engine/ui-3d-kit/package.json` — export `./node` con `types`
- creado `packages/engine/ui-3d-kit/src/node.d.ts`
- creado `plan/REPORTES/WP-U156-types-subpaths-presets-webrtc-ui3d.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Tabla subpath → types path (export audit)

| paquete | subpath | types | exists | in `files` |
| ------- | ------- | ----- | ------ | ---------- |
| `@zeus/presets-sdk` | `.` | `./src/types.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./env` | `./src/env/index.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./docs` | `./src/docs/index.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./paths` | `./src/paths/index.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./discovery` | `./src/discovery/index.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./mcp` | `./src/mcp/index.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./volumes` | `./src/volumes/index.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./browse-core` | `./src/volumes/browse-core.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./anchor-grid` | `./src/paths/anchor-grid.d.ts` | yes | yes |
| `@zeus/presets-sdk` | `./presets/contract` | _(deferred)_ | — | n/a |
| `@zeus/presets-sdk` | `./mcp/http-contract` | _(deferred)_ | — | n/a |
| `@zeus/presets-sdk` | `./horse` | _(deferred)_ | — | n/a |
| `@zeus/webrtc-signaling` | `.` | `./types/index.d.ts` | yes | yes |
| `@zeus/webrtc-signaling` | `./peer-session` | `./types/peer-session.d.ts` | yes | yes |
| `@zeus/webrtc-signaling` | `./messages` | `./types/messages.d.ts` | yes | yes |
| `@zeus/webrtc-signaling` | `./peer-card-gate` | `./types/peer-card-gate.d.ts` | yes | yes |
| `@zeus/ui-3d-kit` | `.` | `./src/index.d.ts` | yes | yes |
| `@zeus/ui-3d-kit` | `./node` | `./src/node.d.ts` | yes | yes |

### Eje IV — segundo consumidor / sensor

Contrato `"types"` en subpath ejercitado por ≥2 clientes independientes:

1. **Sensor tipado:** `packages/engine/webrtc-signaling/types/index.d.ts`
   reexporta `resolveIceServers` / `GOOGLE_STUN_URLS` desde
   `@zeus/presets-sdk/env` — segundo cliente TS del subpath tipado.
2. **Sensor mesh (runtime):** `packages/mesh/webrtc-viewer/serve.mjs`
   importa `@zeus/presets-sdk/env`; `player-3d-ui` + `3d-monitor` importan
   `@zeus/ui-3d-kit/node`; `webrtc-viewer` importa
   `@zeus/webrtc-signaling/peer-card-gate` y `./peer-session`.

```
Eje IV sensors:
  consumer1 webrtc-signaling/types/index.d.ts → @zeus/presets-sdk/env: true
  consumer2 mesh/webrtc-viewer/serve.mjs → @zeus/presets-sdk/env: true
  player-3d-ui → ui-3d-kit/node: true
  3d-monitor → ui-3d-kit/node: true
  webrtc-viewer → peer-card-gate: true
  webrtc-viewer → peer-session: true
```

### Gates (obligatorio)

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Tests de los tres paquetes

```
$ npm test --workspace=@zeus/presets-sdk
# tests 43
# pass 43
# fail 0

$ npm test --workspace=@zeus/webrtc-signaling
# tests 22
# pass 22
# fail 0

$ npm test --workspace=@zeus/ui-3d-kit
# tests 24
# pass 24
# fail 0
```

- Efecto visible (vistas/demo): N/A (cambio de metadata de exports + `.d.ts`).

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u156-types-subpaths-presets-webrtc-ui3d` |
| run_id | **N/A** — sin push de la rama en este WP |
| workflow | — |
| conclusion | **N/A** |

```
⏳ sin verificar — worker no hizo push; CI queda a cargo del orquestador post-revisión.
```

## Demolición

Demolición de exports string-only en subpaths JS tocados: cada subpath
tipado pasó de `"sub": "./….mjs"` a objeto con `"types"` + `"default"`.
Los deferidos (`./horse`, `./presets/contract`, `./mcp/http-contract`)
siguen string-only a propósito (candidatos residuales, no demolidos aquí).

```
(export audit arriba — todos los subpaths tocados tienen types → fichero existente)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no — solo declaraciones de tipos
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: types de webrtc subpaths solapan
      parcialmente `types/index.d.ts` (mismo contrato, entradas distintas);
      aceptable para resolución por subpath
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa: string-only demolido en subpaths tocados; deferidos listados
- [x] Tests prueban comportamiento: tests existentes verdes (sin tests nuevos
      de lógica — WP de metadata/types; CA pide tests de paquetes verdes)
- [x] Arranque real verificado: N/A (sin cambio de runtime JS)
- [x] README/specs del paquete siguen siendo verdad: no se mentía sobre types
      de subpaths; no se regeneraron specs (sin cambio de contrato runtime)
- [x] El diff contiene solo el alcance del WP: sí (tres packages + changesets + reporte);
      `package-lock` / bins tocados por `npm install` se descartaron
- [x] Docs públicas C8/C9: N/A

## Hallazgos fuera de alcance

- Subpaths deferidos de presets-sdk (`./horse`, `./presets/contract`,
  `./mcp/http-contract`) siguen sin `"types"` — candidato a WP residual o
  ampliación de U157.
- `types/index.d.ts` de webrtc-signaling no se refactorizó para
  re-exportar desde los nuevos `.d.ts` de subpath (duplicación tipada
  mínima).

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
