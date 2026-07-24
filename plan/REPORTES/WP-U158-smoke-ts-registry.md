# WP-U158 · smoke-ts-registry — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U158 |
| fecha | 2026-07-24 |
| rama | `wp/u158-smoke-ts-registry` |
| commit(s) | `6155bc0` (feat) · `bbde6f9` · `468231f` · `f9675a8` (reporte) |
| eje(s) CA | C8 (canal real registry) + I (extracción con cableado: smoke+CI) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se añadió un smoke nuevo (`smoke:ts-registry`) que instala `@zeus/*`
**desde el registry real** (`https://npm.scriptorium.escrivivir.co`) en un
directorio limpio fuera del workspace, valida que el lock resuelva URLs del
registry (no tarball/`file:`), y compila un consumidor TypeScript con
`tsc --noEmit` (strict / `noImplicitAny`, sin `any` de escape). Cubre
`@zeus/protocol` (+ `peer-card-seat`), `@zeus/rooms` y el subpath tipado
`@zeus/webrtc-signaling/messages`. Se cableó un job CI con skip limpio
`⏳` si el registry no responde (patrón U122). El smoke U54/U161
(`smoke:external-consumer`, tarballs) **no se tocó**. **No** se editó
`plan/BACKLOG.md`.

## Archivos tocados

- `scripts/smoke-ts-registry.mjs` — creado: probe registry → install →
  assert lock → `tsc --noEmit`; skip `⏳` si registry ausente
- `examples/ts-registry-consumer/consumer.ts` — consumidor TS tipado
- `examples/ts-registry-consumer/tsconfig.json` — strict / NodeNext
- `examples/ts-registry-consumer/README.md` — documentación del canal
- `package.json` — script `smoke:ts-registry`
- `.github/workflows/ci.yml` — job `smoke-ts-registry` (U158)
- `plan/REPORTES/WP-U158-smoke-ts-registry.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Gates (obligatorio)

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### CA — install desde registry real + tsc --noEmit → exit 0

```
$ npm run smoke:ts-registry

> zeus-sdk@0.1.0 smoke:ts-registry
> node scripts/smoke-ts-registry.mjs

smoke:ts-registry (WP-U158 · install from registry + tsc --noEmit)
  registry: https://npm.scriptorium.escrivivir.co
  pkgs:     @zeus/protocol@0.4.1 · @zeus/rooms@0.1.2 · @zeus/webrtc-signaling@0.3.3

registry probe: @zeus/protocol@0.4.1 → 0.4.1
  clean:    C:\Users\aleph\AppData\Local\Temp\zeus-u158-ts-registry-W6U5KX

consumer.ts: no any-escape: ok
npm install from registry: exit 0
package-lock: 7 @zeus/* resolved from registry: ok
.d.ts present (protocol, peer-card-seat, rooms, messages): ok
tsc --noEmit: exit 0

smoke:ts-registry — GREEN (registry install + tsc --noEmit, no any-escape)
```

Resolved del `package-lock.json` del consumidor limpio (canal C8 = registry,
no tarball workspace):

```
node_modules/@zeus/protocol → https://npm.scriptorium.escrivivir.co/@zeus/protocol/-/protocol-0.4.1.tgz
node_modules/@zeus/rooms → https://npm.scriptorium.escrivivir.co/@zeus/rooms/-/rooms-0.1.2.tgz
node_modules/@zeus/webrtc-signaling → https://npm.scriptorium.escrivivir.co/@zeus/webrtc-signaling/-/webrtc-signaling-0.3.3.tgz
node_modules/@zeus/socket-core → https://npm.scriptorium.escrivivir.co/@zeus/socket-core/-/socket-core-0.2.0.tgz
node_modules/@zeus/presets-sdk → https://npm.scriptorium.escrivivir.co/@zeus/presets-sdk/-/presets-sdk-0.1.3.tgz
node_modules/@zeus/http-contract → https://npm.scriptorium.escrivivir.co/@zeus/http-contract/-/http-contract-0.1.3.tgz
node_modules/@zeus/ui-kit → https://npm.scriptorium.escrivivir.co/@zeus/ui-kit/-/ui-kit-0.1.3.tgz
```

### Skip limpio (patrón U122 / ENTREGA sprint1 «⏳»)

```
$ ZEUS_SMOKE_TS_REGISTRY_SKIP=1 npm run smoke:ts-registry

smoke:ts-registry — skipped (⏳) — ZEUS_SMOKE_TS_REGISTRY_SKIP=1
```

(exit 0). El mismo skip ocurre automáticamente si `npm view` contra el
registry falla por red/DNS/TLS (no E404 de paquete pineado).

### U54/U161 intacto

```
$ rg -n "smoke:external-consumer|WP-U161" scripts/smoke-external-consumer.mjs package.json | head
```

`scripts/smoke-external-consumer.mjs` sin cambios en este WP; script
`smoke:external-consumer` conservado en `package.json`.

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u158-smoke-ts-registry` |
| run_id | `30071161716` — https://github.com/alephscriptorium-eng/Z_SDK/actions/runs/30071161716 |
| workflow | CI · job `smoke-ts-registry` |
| conclusion | **success** (SHA `bbde6f9840edd11719f6e05b424e3be70681849f`) |

```
CI job 89412151423:
registry probe: @zeus/protocol@0.4.1 → 0.4.1
npm install from registry: exit 0
package-lock: 7 @zeus/* resolved from registry: ok
tsc --noEmit: exit 0
smoke:ts-registry — GREEN (registry install + tsc --noEmit, no any-escape)
```

Job cableado (literal en `.github/workflows/ci.yml`):

```yaml
  smoke-ts-registry:
    name: smoke TS registry (U158)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Smoke TypeScript consumer from @zeus registry
        run: npm run smoke:ts-registry
        env:
          ZEUS_SMOKE_CLEANUP: '1'
```

## Demolición

N/A — WP de adición (smoke + CI). No se demolió el smoke tarball U54/U161.

## Auto-revisión (PRACTICAS.md §3 — con honestidad)

- [x] Puertos/URLs/rooms hardcodeados: consumidor de smoke usa URL/room de
  fixture solo para tipado (`loadScriptoriumConfig`); no levanta servicio
- [x] Cadenas if/switch → tabla: N/A
- [x] Duplicación: smoke nuevo convive con U54; no reimplementa join runtime
- [x] console.log / TODO: logs del smoke = evidencia CA
- [x] Nombres de transición: no
- [x] Demolición: N/A (adición)
- [x] Tests comportamiento: `tsc --noEmit` strict + assert lock registry +
  assert no `any`-escape
- [x] Arranque real: install registry + tsc (evidencia arriba); no runtime
  socket (fuera de CA U158)
- [x] README example documenta canal registry (C8)
- [x] Diff solo alcance U158 (no BACKLOG, no otros WPs)
- [x] Docs públicas C8/C9: README example declara registry real vs tarball U54
- [x] Changesets: N/A — sin tocar fuentes de paquetes publicables

## Hallazgos fuera de alcance

Ninguno bloqueante. `webrtc-signaling` tira de `presets-sdk` / `http-contract`
/ `ui-kit` como deps transitivas — quedan instaladas desde registry y
aparecen en el lock (evidencia C8 ampliada, no CA mínimo).

## Dudas / bloqueos

Ninguno. Run-id CI queda para el orquestador tras push.

---

## Revisión del orquestador

**Aceptado ✅ (2026-07-24).**

- CA registry real: cumplido y re-smoke independiente GREEN.
- CA TypeScript: `tsc --noEmit` strict exit 0; sin `any` de escape.
- Cobertura: protocol + `peer-card-seat`, rooms y
  webrtc-signaling/messages.
- CI: `30071161716` success; job `89412151423` confirma install real
  (no skip) + compile GREEN.
- U54/U161 intacto; diff limitado a U158.
