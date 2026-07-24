# WP-U167 · triage-blobstore-client — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (WP-U167) |
| fecha | 2026-07-24 |
| rama | `wp/u167-triage-blobstore-client` |
| commits | `d96d0ba` · `dfc7e6e` · `c7f4532` |
| eje(s) CA | IV |
| estado propuesto | listo para revisión |

## Qué se hizo

**Vía B** (deslistar / mantener privado): se eligió y cerró frente a vía A
(desacoplar harness).

Justificación (producto/harness, no solo «falta pack»):

1. `@zeus/blobstore-client` nace como hermano U100/U101 de
   `@zeus/blob-sync-harness` (clase **E**, §4 allowlist; E404 registry).
2. Dep runtime: `src/lan.mjs` reexporta `BLOB_LANES` /
   `assertLanBlobTransferAllowed` desde el harness privado → C8 imposible
   sin publicar el harness o desacoplar (vía A).
3. Tarball actual incluye `fixture-sidecar`, `run-fixture` y `test/` —
   naturaleza harness/demo mezclada con cliente HTTP.
4. Live sidecar / `ZEUS_BLOB_*` sigue **diferido D-22** — no reabrir;
   no hay consumidor ops externo medible para un candidato clase C.

Desviación de alcance nominal: además de `plan/PUBLISH-ALLOWLIST.md`, se
actualizó `scripts/audit-publish-allowlist.mjs` (lista `CANDIDATES.P1`)
porque el CA del brief exige inventario/`audit:publish-allowlist`
coherente; el script es el gemelo mecánico de §3.

No se tocó código de `packages/mesh/blobstore-client/**` (vía B no lo
exige). No se amplió P0. No se tocaron P1 restantes (U166). Cero publish,
cero changesets de publicación, `"private": true` intacto.

## Archivos tocados

- `plan/PUBLISH-ALLOWLIST.md` — modificado: quitado de §3 P1; §4 democión
  documentada WP-U167 con justificación.
- `scripts/audit-publish-allowlist.mjs` — modificado: `CANDIDATES.P1`
  sin `@zeus/blobstore-client` (coherencia con §3).
- `plan/REPORTES/WP-U167-triage-blobstore-client.md` — creado: este
  reporte.

## Evidencia

### Grafo de deps (declarado; bloqueante vía A / C8)

```
@zeus/blobstore-client@0.0.0 (private: true)
├── dependencies
│   ├── @zeus/blob-sync-harness: *   ← mantener privado / E404
│   └── @zeus/webrtc-signaling: *    ← ya publicado (0.3.3 registry)
└── devDependencies
    ├── @zeus/authority-kit: *
    └── @zeus/protocol: *

acoplamiento código: packages/mesh/blobstore-client/src/lan.mjs
  → import { BLOB_LANES, assertLanBlobTransferAllowed }
    from '@zeus/blob-sync-harness'
```

### `npm pack --dry-run` (contexto; vía B no exige checklist §5 completo)

```
npm pack -w @zeus/blobstore-client --dry-run
→ zeus-blobstore-client-0.0.0.tgz · total files: 13
  incluye: src/fixture-sidecar.mjs, src/run-fixture.mjs, test/client.test.mjs
  (sin publishConfig / sin files / version 0.0.0)
```

### Diff allowlist (§3 / §4)

- §3 P1: quedan solo `@zeus/linea-editor`, `@zeus/console-monitor`.
- §4: tabla «Democión documentada (WP-U167)» para
  `@zeus/blobstore-client`.

### Inventario / audit coherente (Eje IV — segundo consumidor)

Allowlist (humano) + `audit:publish-allowlist` (sensor independiente):

```
$ npm run audit:publish-allowlist
audit:publish-allowlist (WP-U162)
registry: https://npm.scriptorium.escrivivir.co
packages/** package.json files: 49
unique package names: 49
allowlist candidatos: 6 (P0=4 P1=2)

@zeus/blobstore-client	mantener privado		true	0.0.0	E404	packages/mesh/blobstore-client/package.json
@zeus/blob-sync-harness	mantener privado		true	0.0.0	E404	packages/mesh/blob-sync-harness/package.json

--- summary ---
total_unique: 49
ya_publicado: 29
candidato: 6
mantener_privado: 14

--- candidatos (allowlist §3, no publicados) ---
@zeus/console-monitor	P1	…
@zeus/force-system	P0	…
@zeus/linea-editor	P1	…
@zeus/linea-firehose	P0	…
@zeus/linea-system	P0	…
@zeus/ssb-system	P0	…
(exit 0)
```

Antes (U162): candidatos 7 (P0=4 P1=3), `blobstore-client` = candidato P1;
`mantener_privado` = 13. Después: +1 privado, −1 candidato.

### Frontera dura

```
packages/mesh/blobstore-client/package.json → "private": true (intacto)
ls .changeset/ → solo config.json + README.md (cero changesets de pub)
npm publish → no ejecutado
```

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: allowlist + reporte; + script
      audit (CA coherencia; desviación nominal documentada arriba).
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: N/A.
- [x] Sellos con fuente; rutas citadas existentes: D-22 / U162 / allowlist.
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: re-evaluación =
      enmienda allowlist + WP + GO (`<pendiente>` ops/sidecar).
- [x] Eje(s) aplicables evidenciado(s): IV — allowlist + audit como
      segundo consumidor de la clasificación.
- [x] Gates ejecutados de verdad: `audit:publish-allowlist` exit 0;
      `npm pack --dry-run` (contexto).
- [x] Commits convencionales: sí (rama worker).
- [x] Diff solo del alcance del WP: sin P0, sin U166 paquetes, sin
      BACKLOG, sin merge main, sin flip private.

## Hallazgos fuera de alcance

- Vía A futura (si ops entrega sidecar y hay GO): inlinear
  `lan-gate` en `blobstore-client` (o import directo
  `assertSignalingPeerCard` desde `@zeus/webrtc-signaling`), quitar dep
  harness, luego checklist §5 — **no** hecho aquí.
- `files` / exclusión de `test/`+fixtures en pack: irrelevante mientras
  sea «mantener privado»; candidato a WP publish-ready solo tras
  re-listar en §3.
- Worktree sin `node_modules/@zeus/blob-sync-harness` linkeado en este
  checkout: el grafo se evidenció por manifests + `lan.mjs` + lockfile
  (`packages/mesh/blobstore-client` deps), no por `npm ls` resuelto.

## Dudas / bloqueos

Ninguno para cerrar U167 vía B.

---

## Revisión del orquestador

**Aceptado ✅** (orquestador · 2026-07-24).

- Vía B cerrada con causa verificable: dependencia runtime del harness
  privado, tarball contaminado por fixtures/tests y sidecar D-22 diferido.
- Allowlist §3/§4 y auditor nominal coherentes: 6 candidatos
  (P0=4, P1=2); `blobstore-client` = mantener privado.
- Eje IV: fuente humana + sensor ejecutable alineados.
- Fronteras verificadas: `private: true` intacto; cero `.changeset/**`,
  workflow publish, `npm publish`, BACKLOG, P0 o paquetes U166.
- Excepción de alcance aprobada: las líneas de
  `scripts/audit-publish-allowlist.mjs` son el mínimo imprescindible para
  satisfacer la CA explícita de coherencia del auditor con §3.
- Merge post-✅ a `main` (`f46743b`).
