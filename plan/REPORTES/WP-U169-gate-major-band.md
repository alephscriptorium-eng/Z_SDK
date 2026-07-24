# WP-U169 · gate-major-band — reporte

| dato | valor |
| ---- | ----- |
| agente | orquestador (CA en carril; PAUSA parcial) |
| fecha | 2026-07-25 |
| rama | `wp/u169-gate-major-band` |
| eje(s) CA | IV + C8 |
| estado propuesto | listo para contrarrevisión + revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Adapté `scripts/gate-publish-ready.mjs` para aceptar deps `@zeus/*` en
forma canónica major-band `>=M.m.p <(M+1).0.0` (además de pines exactos),
rechazando `*`, tags, git, url, paths y aliases. El sensor resuelve el
**mínimo** `M.m.p` en el registry canónico. Re-gate P0×4 en verde tras
U168; seis fail-probes en rojo. Documenté CA lock-coherence (R11): todo
cambio de manifests exige lock en el mismo WP.

## Archivos tocados

- `scripts/gate-publish-ready.mjs` — sensor major-band + mensajes
- `plan/REPORTES/WP-U169-gate-major-band.md` — este reporte

**No tocados:** manifests P0 (dueño U168), flip `private`, publish,
changesets, reopen U165, allowlist (salvo lectura).

## Evidencia

### Gate verde P0×4

```text
$ npm run gate:publish-ready
gate:publish-ready (WP-U169; P0 allowlist · major-band)
PASS @zeus/linea-system … zeusDeps=4
PASS @zeus/linea-firehose … zeusDeps=3
PASS @zeus/force-system … zeusDeps=4
PASS @zeus/ssb-system … zeusDeps=3
gate:publish-ready: OK (4 P0 candidates)
exit 0
```

### Fail-probes (inyección memoria · `--package @zeus/linea-system`)

| kind | exit | motivo |
| ---- | ---- | ------ |
| star (`*`) | 1 | wildcard * |
| latest | 1 | tags/other ranges rejected |
| git | 1 | git/github locator |
| url | 1 | http(s) URL |
| windows-path | 1 | Windows/absolute path |
| missing-version (`9.9.9`) | 1 | E404 registry |

### Lock-coherence (CA R11)

Regla enforceable (PRACTICAS / este gate): si un WP muta
`packages/**/package.json` que altera deps, debe actualizar
`package-lock.json` en el **mismo** WP. U168 ya lo cumplió; U169 no
mutó manifests.

### Fronteras

- `private: true` P0×4 intacto
- cero `npm publish` / changesets de pub
- cero reopen U165

## Auto-revisión

- Alcance = brief.
- Contrarrevisión independiente **pendiente**.
