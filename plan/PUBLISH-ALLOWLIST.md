# PUBLISH-ALLOWLIST — clases publicables Zeus (fuente única)

**WP-U162.** Esta es la **única fuente normativa** de qué clases de
paquetes del monorepo pueden publicarse al registry propio
(`https://npm.scriptorium.escrivivir.co`, ver `.npmrc`) frente a las que
deben permanecer privadas.

> Regla dura: la publicabilidad **no** se infiere por ausencia de
> `"private": true` en el `package.json`. Solo entra en canal de publish
> lo que esta allowlist clasifica como publicable (o ya publicado por
> pipeline vigente) **y** un GO / WP de implementación lo prepara.

Inventario reproducible: `npm run audit:publish-allowlist`
(script `scripts/audit-publish-allowlist.mjs`). Ver también
[PRACTICAS.md](PRACTICAS.md) §6 (changesets / release) y
[REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md).

---

## 1. Clases

| clase | ¿puede publicar? | ámbito típico | notas |
| ----- | ---------------- | ------------- | ----- |
| **A · engine library** | **sí** (pipeline vigente) | `packages/engine/*` sin `private`, con `publishConfig.registry` | Canal canónico: changesets + `.github/workflows/release.yml`. C8 = registry propio. |
| **B · mesh runtime ya en canal** | **sí** (excepción histórica acotada) | runtimes mesh ya publicados con contrato de pack | Hoy: ver §2 lista «ya publicados (mesh)». No ampliar por analogía. |
| **C · mesh MCP / servicio con API exportada** | **candidato** (requiere GO + WP) | MCP servers / clientes con `exports` o API importable | Default = privado. Solo los nombres de §3. |
| **D · UI / visor / Angular / monitor visual** | **no** | player/editor UI, operator UI, threejs, WebRTC viewer, 3d-monitor, browsers visuales | Peer deps y empaquetado de producto; no son residuos mecánicos. |
| **E · demo / harness / fixture** | **no** | harnesses, fixtures de test, demos de integración | Incluye `packages/**/test/fixtures/**` y harnesses mesh. |
| **F · editor app** | **no** | `packages/editor/*` | App de estación; no SDK publicable. |
| **G · mesh sin clase C ni B** | **no** | resto de `packages/mesh/*` | Incluye juegos de ejemplo (`solar-system`, etc.) salvo decisión expresa documentada aquí. |

---

## 2. Ya publicados (inventario vivo = script + registry)

La lista canónica de «ya publicado» la produce el inventario
(`npm view` contra el registry de `.npmrc`), no esta tabla estática.

Expectativa de gobierno (addenda R5-Z, punto de partida):

- ~29 paquetes resolubles por `npm view` (mayormente clase **A**, más
  excepciones mesh clase **B** si el registry las tiene).
- Clase **B** observada en manifests (sin ampliar): `@zeus/operator-bridge`,
  `@zeus/socket-server`, `@zeus/mcp-launcher`, `@zeus/ciudad-lifecycle`
  (estado registry = inventario, no el flag `private`).

---

## 3. Candidatos explícitos (clase C) — allowlist nominal

Solo estos nombres pueden graduarse a publicables tras GO + WP de
publish-ready. **No** basta quitar `private`.

### P0 — servicios con API exportada

| paquete | path |
| ------- | ---- |
| `@zeus/linea-system` | `packages/mesh/linea-system` |
| `@zeus/linea-firehose` | `packages/mesh/linea-firehose` |
| `@zeus/force-system` | `packages/mesh/force-system` |
| `@zeus/ssb-system` | `packages/mesh/ssb-system` |

### P1 — requieren mayor triage

| paquete | path |
| ------- | ---- |
| `@zeus/linea-editor` | `packages/mesh/linea-editor` |

Cualquier otro mesh no listado aquí = clase **D/E/G** → **mantener privado**.

---

## 4. Mantener privados salvo decisión expresa

Sin enumeración exhaustiva aquí (el inventario clasifica los 49): UIs,
visores, Angular, monitores visuales, demos y harnesses — p. ej.
`player-ui`, `editor-ui`, `operator-ui`, `threejs-ui-lib`,
`webrtc-viewer`, `3d-monitor`, `blob-sync-harness`, `cache-browser`,
`firehose-browser`, `player-3d-ui`, `oasis-webrtc`, y fixtures.

### Democión documentada (WP-U167)

| paquete | path | justificación |
| ------- | ---- | ------------- |
| `@zeus/blobstore-client` | `packages/mesh/blobstore-client` | Hermano producto/harness de U100/U101: dep runtime de `@zeus/blob-sync-harness` (clase **E**, E404 en registry); tarball incluye `fixture-sidecar` / `run-fixture` / `test/`; live sidecar `ZEUS_BLOB_*` **diferido D-22**. No es candidato clase **C** mientras el plano ops no exista y el acoplamiento a harness persista. Re-evaluación = enmienda explícita aquí + WP publish-ready + GO (no ampliar P0 por analogía). |

### Democión documentada (WP-U166)

| paquete | path | justificación |
| ------- | ---- | ------------- |
| `@zeus/console-monitor` | `packages/mesh/console-monitor` | Producto **clase D** (monitor visual / TUI TOP + MCP de estación): contrato runtime contra `@zeus/player-ui` `/deck-io` (`createSessionClient` exige origin player-ui; `player-ui` = mantener privado / E404). Sin `exports` (solo `main`); tarball incluye `test/`. No es SDK/API importable clase **C** independiente del Tablero ALEPH privado. Gap `exports` **no** se cierra aquí — queda fuera de §3; re-evaluación = enmienda explícita + API desacoplada de player-ui + WP publish-ready + GO. |

Para mover un paquete de «mantener privado» a candidato o publicable:

1. Enmienda de **esta** allowlist (nombre + clase + justificación).
2. WP de medición publish-ready (sin publish).
3. GO de implementación y, aparte, GO de publish.

---

## 5. Condiciones de publish-ready (antes de cualquier publish)

Para un candidato de §3, un WP derivado debe demostrar:

1. `publishConfig.registry` = registry de `.npmrc`.
2. `files` explícito; tarball medido (`npm pack --dry-run` / pack a temp)
   sin `node_modules`, tests ni secretos.
3. `exports` / `types` (o decisión documentada de «JS-only»).
4. deps internas `@zeus/*` con semver pineado (no `*`) resoluble en registry.
5. changeset + relevancia en workflow de release (o workflow dedicado
   justificado).
6. C8: canal de install del consumidor = registry, no tarball workspace.

**U162 no ejecuta** flips de `private`, ni `npm publish`, ni changesets
de release, ni edits de `release.yml`.

---

## 6. Clasificación del inventario

Para cada paquete único bajo `packages/**`:

| etiqueta | criterio |
| -------- | -------- |
| `ya publicado` | `npm view <name>` OK en el registry canónico |
| `candidato` | nombre en §3 **y** no publicado |
| `mantener privado` | no publicado **y** no está en §3 |

El flag `private` en el manifest es **evidencia operativa**, no criterio
de allowlist.
