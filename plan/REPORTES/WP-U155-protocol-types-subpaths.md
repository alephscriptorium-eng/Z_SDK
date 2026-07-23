# WP-U155 · protocol-types-subpaths — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U155 |
| fecha | 2026-07-23 |
| rama | `wp/u155-protocol-types-subpaths` |
| commits | `7184540 76e183b` |
| eje(s) CA | IV |
| estado propuesto | listo para revisión |

## Qué se hizo

Se ampliaron las declaraciones TypeScript de `@zeus/protocol` para que todos
los subpaths JS públicos declaren condición `"types"` en `exports`, empezando
por `./peer-card-seat`. El generador (`types:generate`) emite
`types/<subpath>.d.ts` además de `types/index.d.ts`. Los subpaths que ya
estaban en la superficie raíz re-exportan tipos desde `./index.js`;
`peer-card-seat` y `node*` tienen `.d.ts` propios. `./spec` y `./spec/build`
quedan sin `types` (YAML / script de build). Se añadió changeset patch,
tests de sync/exports y un smoke Eje IV con dos consumidores TS
independientes (`peer-card-seat` + `roles`) bajo `tsc --noEmit`.

## Archivos tocados

- `packages/engine/protocol/package.json` — condiciones `"types"` en subpaths JS
- `packages/engine/protocol/spec/types-build.mjs` — `buildSubpathTypeDeclarations` + `TYPED_SUBPATHS`
- `packages/engine/protocol/spec/generate-types.mjs` — escribe subpath `.d.ts`
- `packages/engine/protocol/types/*.d.ts` — generados (8 subpaths + index sync)
- `packages/engine/protocol/test/types-sync.test.mjs` — sync + exports CA
- `packages/engine/protocol/test/subpath-types-smoke.test.mjs` — gate Eje IV (tsc)
- `packages/engine/protocol/test/fixtures/ts-subpath-smoke/**` — consumidores A/B
- `packages/engine/protocol/README.md` — documenta types en subpaths / exclusiones spec
- `.changeset/wp-u155-protocol-types-subpaths.md` — patch `@zeus/protocol`
- `plan/REPORTES/WP-U155-protocol-types-subpaths.md` — este reporte

## Evidencia

> No inventes observaciones. Salida literal o `⏳ sin verificar`.

### Gates

```
$ npm run gates
gates: OK (0 offenders)
```

### Tests del paquete

```
$ npm test -w @zeus/protocol
# Subtest: Eje IV: tsc resolves peer-card-seat + roles subpath types (two consumers)
ok 35 - Eje IV: tsc resolves peer-card-seat + roles subpath types (two consumers)
...
# Subtest: package exports JS subpaths expose types → published .d.ts (WP-U155)
ok 39 - package exports JS subpaths expose types → published .d.ts (WP-U155)
# Subtest: peer-card-seat.d.ts declares seat API without any escape
ok 40 - peer-card-seat.d.ts declares seat API without any escape
1..40
# tests 40
# pass 40
# fail 0
```

### Exports / publish surface

```
exports["./peer-card-seat"] = {
  "types": "./types/peer-card-seat.d.ts",
  "default": "./src/peer-card-seat.mjs"
}
files: [ 'src', 'spec', 'types', 'README.md' ]
```

Tabla subpath → types:

| subpath | types |
| ------- | ----- |
| `./contract` | `./types/contract.d.ts` |
| `./roles` | `./types/roles.d.ts` |
| `./gates` | `./types/gates.d.ts` |
| `./acl` | `./types/acl.d.ts` |
| `./peer-card` | `./types/peer-card.d.ts` |
| `./peer-card-seat` | `./types/peer-card-seat.d.ts` |
| `./node` | `./types/node.d.ts` |
| `./node-src-dir` | `./types/node-src-dir.d.ts` |
| `./spec` | sin types (YAML AsyncAPI) |
| `./spec/build` | sin types (script de build) |

### Eje IV (segundo consumidor / sensor)

- Cliente A: `test/fixtures/ts-subpath-smoke/consumer-seat.ts` →
  `import { generateSeatKeyPair, … } from '@zeus/protocol/peer-card-seat'`
  (+ `SeatKeyPair` tipado; sin `any`).
- Cliente B: `test/fixtures/ts-subpath-smoke/consumer-roles.ts` →
  `import { ROLES, createIntentCatalog, … } from '@zeus/protocol/roles'`.
- Gate: `subpath-types-smoke.test.mjs` instala el paquete por `file:` en
  temp + `@types/node` y corre `tsc --noEmit` (verde en la corrida arriba).

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u155-protocol-types-subpaths` |
| run_id | N/A — sin push en este turno de worker |
| workflow | N/A |
| conclusion | N/A |

## Demolición

Exports string-only en subpaths JS públicos (sin condición `"types"`).

```
$ node -e "const p=require('./packages/engine/protocol/package.json');
for (const [k,v] of Object.entries(p.exports)) {
  if (k==='.'||k.startsWith('./spec')) continue;
  console.log(k, typeof v==='string' ? 'STRING' : 'types='+v.types);
}"
./contract types=./types/contract.d.ts
./roles types=./types/roles.d.ts
./gates types=./types/gates.d.ts
./acl types=./types/acl.d.ts
./peer-card types=./types/peer-card.d.ts
./peer-card-seat types=./types/peer-card-seat.d.ts
./node-src-dir types=./types/node-src-dir.d.ts
./node types=./types/node.d.ts
```

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: protocol + changeset + reporte
      (`package-lock.json` tocado por `npm install` local → revertido, no commit)
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`
- [x] Eje IV evidenciado: dos consumidores TS + `tsc --noEmit` en test
- [x] Gates ejecutados de verdad: `gates: OK`
- [x] Commits convencionales: sí (tras este reporte)
- [x] Diff solo del alcance del WP: sí
- [x] Puertos/URLs/rooms hardcodeados: no (fixture usa `http://example.test`
      solo como string de forma de peer-card en smoke de tipos)
- [x] Cadenas if/switch que debieron ser tabla: no
- [x] Duplicación: reutiliza `types-build` existente; no copia de otro paquete
- [x] console.log / código comentado / TODO: no
- [x] Nombres de transición: no
- [x] Tests prueban comportamiento (resolución types + sync), no solo «no explota»
- [x] README del paquete actualizado
- [x] C8/C9 docs públicas: N/A (solo README de paquete)

## Hallazgos fuera de alcance

- El worktree arrancó sin `node_modules` resuelto (`@zeus/http-contract`
  missing → `spec-sync.test.mjs` fallaba hasta `npm install -w @zeus/protocol`).
  Setup local; no es bug de producto.
- U158 pedirá smoke TS desde registry en CI; este WP deja el patrón de
  fixture dual-consumer como base local.

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
