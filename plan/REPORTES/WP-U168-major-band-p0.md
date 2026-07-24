# WP-U168 · major-band-p0 — reporte

| dato | valor |
| ---- | ----- |
| agente | worker/orquestador (completado en carril tras worker colgado) |
| fecha | 2026-07-25 |
| rama | `wp/u168-major-band-p0` |
| eje(s) CA | IV |
| estado propuesto | listo para contrarrevisión + revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Migración de deps internas `@zeus/*` en P0×4
(`linea-system` · `linea-firehose` · `force-system` · `ssb-system`) de
pines exactos a banda major `>=M.m.p <(M+1).0.0`, con mínimo = versión
registry ya justificada en U163/U164. Allowlist §5 actualizada al
criterio major-band. `package-lock.json` alineado en el mismo WP.
`private: true` intacto. Gate `publish-ready` **no** editado (dueño U169);
queda ROJO hasta Ola B (esperado).

## Archivos tocados

- `packages/mesh/linea-system/package.json` — `@zeus/*` → major-band
- `packages/mesh/linea-firehose/package.json` — ídem
- `packages/mesh/force-system/package.json` — ídem
- `packages/mesh/ssb-system/package.json` — ídem
- `plan/PUBLISH-ALLOWLIST.md` — §5 criterio major-band
- `package-lock.json` — coherente con manifests
- `plan/REPORTES/WP-U168-major-band-p0.md` — este reporte

**No tocados:** `scripts/gate-publish-ready.mjs`, flip `private`,
`.changeset/**` de pub, `npm publish`, U165, R13.

## Rangos aplicados (mínimo = registry)

| paquete | deps `@zeus/*` (prod+dev) |
| ------- | ------------------------- |
| `@zeus/linea-system` | http-contract `>=0.1.3 <1.0.0` · linea-kit `>=0.3.0 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |
| `@zeus/linea-firehose` | firehose-core `>=0.1.3 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |
| `@zeus/force-system` | http-contract `>=0.1.3 <1.0.0` · linea-kit `>=0.3.0 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |
| `@zeus/ssb-system` | linea-kit `>=0.3.0 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |

## Consecuencia major `0`

Todos los mínimos están en major `0`. La banda `>=0.m.p <1.0.0`
**permite** saltos de minor dentro de `0.x` (pueden romper). No se usó
`^0.m.p`. Integración: `npm pack --dry-run` ×4 OK; resolución registry
de mínimos OK; gate publish-ready queda a cargo de U169.

## Evidencia

### Registry (mínimos)

```text
$ REG=https://npm.scriptorium.escrivivir.co
$ npm view @zeus/http-contract@0.1.3 version --registry $REG  → 0.1.3
$ npm view @zeus/linea-kit@0.3.0 version --registry $REG       → 0.3.0
$ npm view @zeus/presets-sdk@0.1.3 version --registry $REG    → 0.1.3
$ npm view @zeus/firehose-core@0.1.3 version --registry $REG  → 0.1.3
$ npm view @zeus/test-utils@0.1.3 version --registry $REG     → 0.1.3
```

### `npm pack --dry-run` ×4

| paquete | files | tarball |
| ------- | ----- | ------- |
| linea-system | 8 | zeus-linea-system-0.1.0.tgz |
| linea-firehose | 6 | zeus-linea-firehose-0.1.0.tgz |
| force-system | 8 | zeus-force-system-0.1.0.tgz |
| ssb-system | 11 | zeus-ssb-system-0.1.0.tgz |

### Gate (pre-U169 · esperado FAIL)

```text
$ npm run gate:publish-ready
… FAIL @zeus/linea-system … expected exact registry semver pin …
… (14 violations)
gate:publish-ready: FAIL (14 violations)
```

U169 adaptará el sensor a major-band.

### Fronteras

- `private: true` ×4 intacto
- cero `npm publish`
- cero changesets de pub
- cero edición de `scripts/gate-publish-ready.mjs`

## Auto-revisión

- Alcance = ALCANCE_DIFF del brief.
- Eje IV: semver/allowlist/lock coherentes en un WP.
- Contrarrevisión independiente **pendiente** (riesgo independiente).
