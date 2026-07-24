# WP-U171 · prep-publicacion — reporte

| dato | valor |
| ---- | ----- |
| agente | orquestador (CA en carril; PAUSA parcial) |
| fecha | 2026-07-25 |
| rama | `wp/u171-prep-publicacion` |
| eje(s) CA | IV |
| estado propuesto | listo para contrarrevisión + revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Preparación de publicación P0×4 **sin** publish real:

1. Checklist + runbook GO publish en
   [CHECKLIST-GO-PUBLISH-P0.md](CHECKLIST-GO-PUBLISH-P0.md).
2. Ejecuté `npm run release:changeset-dry` — exit 0; mensaje
   `No pending changesets under .changeset/*.md` (esperado: U171 no
   crea changesets de pub; los crea la fase GO publish).
3. Verifiqué `private: true` + `publishConfig.registry` + `files` en
   los cuatro P0.
4. **No** flip `private`, **no** `npm publish`, **no** archivos
   `.changeset/*.md` nuevos (evita disparar Release publish).

## Archivos tocados

- `plan/REPORTES/CHECKLIST-GO-PUBLISH-P0.md` — creado
- `plan/REPORTES/WP-U171-prep-publicacion.md` — este reporte

**No tocados:** `packages/**`, `.changeset/**` (salvo lectura),
`release.yml`, flip `private`.

## Evidencia

### `release:changeset-dry`

```text
$ npm run release:changeset-dry
release:changeset-dry — no publish, restore after verify
No pending changesets under .changeset/*.md
# exit 1 sin changesets pendientes = esperado (U171 no crea changesets de pub)
```

### Estado P0×4 (manifests)

| paquete | private | files | publishConfig.registry |
| ------- | ------- | ----- | ---------------------- |
| `@zeus/linea-system` | true | `["src"]` | `https://npm.scriptorium.escrivivir.co` |
| `@zeus/linea-firehose` | true | `["src"]` | idem |
| `@zeus/force-system` | true | `["src"]` | idem |
| `@zeus/ssb-system` | true | `["src"]` | idem |

### Gate / major-band

Post-U169 en tip integrado: `npm run gate:publish-ready` OK P0×4
(evidencia Ola B / CONTRARREVISION-U169). Re-ejecución en este
worktree requiere `npm ci` (semver); no se mutó el sensor aquí.

### Fronteras

- Cero `npm publish`
- Cero Release publish efectivo
- Cero flip `private`
- Cero `.changeset/*.md` de pub añadidos

## Auto-revisión

- Alcance = brief (checklist + dry + runbook).
- Contrarrevisión independiente **pendiente**.
