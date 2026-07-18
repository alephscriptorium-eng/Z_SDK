# WP-U97 · feed-volumes-ops — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-18 |
| rama | `wp/u97-feed-volumes-ops` |
| commit(s) | `bbd599d` (+ reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

- Se fusionó `master` (`539cd70`) en el worktree (fast-forward desde `6c1690d`).
- `refreshFirehoseCorpusCounts` deja de contar solo `.json` y de parchear
  `volumes.json` a mano: apunta `ZEUS_VOLUMES_ROOT`, llama
  `syncVolumeCounters('firehose')` de `@zeus/volumes-ops` (recuento tipado +
  `resetVolumesCache`).
- `ensureFirehoseVolumeLayout` lee/resuelve el registro vía
  `loadVolumesConfig` / `resolveVolumesRoot` (sin `readFileSync(volumesPath)`).
- Dependencia workspace `@zeus/volumes-ops` en `@zeus/feed-kit` + changeset
  patch + nota en README.
- Test nuevo: corpus `raw` con `.json`/`.bin`/`.txt` → `files === 3` y
  `loadVolumesConfig` refleja el contador tras invalidar caché.

## Archivos tocados

- `packages/engine/feed-kit/src/jetstream-sync.mjs` — modificado: APIs
  volumes-ops/presets; demolición `countJsonFiles` + parcheo de contadores
- `packages/engine/feed-kit/package.json` — modificado: dep `@zeus/volumes-ops`
- `packages/engine/feed-kit/test/resolve.test.mjs` — modificado: CA tipado+caché
- `packages/engine/feed-kit/README.md` — modificado: documenta syncVolumeCounters
- `package-lock.json` — modificado: lock de la nueva dep
- `.changeset/wp-u97-feed-volumes-ops.md` — creado: patch feed-kit
- `plan/REPORTES/WP-U97-feed-volumes-ops.md` — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `git merge master` → fast-forward a `539cd70`.
- `npm test -w @zeus/feed-kit`:

```
# tests 9
# pass 9
# fail 0
# duration_ms 3013.7615
```

Incluye `refreshFirehoseCorpusCounts counts any file type and invalidates cache` ok.

- CA `rg "countJsonFiles|readFileSync\(volumesPath" packages/engine/feed-kit/src`:

```
(no matches — CA OK)
```

- `npm run lint`: exit 0; 12 warnings preexistentes ajenos a feed-kit (0 errors).
- Arranque live jetstream / demo visual: `⏳ sin verificar` (CA no lo exige;
  fixture + unit cubren el recuento).

## Demolición

Borrados: `countJsonFiles` y el bucle de parcheo manual de `corpus.files` +
`writeFileSync` de contadores en `refreshFirehoseCorpusCounts`.

```
$ rg "countJsonFiles|readFileSync\(volumesPath" packages/engine/feed-kit
(no matches)
$ rg "countJsonFiles" packages/engine/feed-kit
(no matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no introducidos. `DEFAULT_JETSTREAM_URL`
  preexistente (override `ZEUS_JETSTREAM_URL`). Root vía `ZEUS_VOLUMES_ROOT`.
- [x] Cadenas if/switch que debieron ser tabla: no aplica (sin discriminante nuevo).
- [x] Duplicación con otros paquetes: eliminada; se reutiliza volumes-ops
  (`syncVolumeCounters` + measure tipado).
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no (`withVolumesRoot` helper local).
- [x] Demolición completa (grep arriba): sí.
- [x] Tests prueban comportamiento: tipado (3 ficheros mixtos) + caché vía
  `loadVolumesConfig` tras `resetVolumesCache`.
- [ ] Arranque real verificado: `⏳` solo fixture/unit; live WS no corrido.
- [x] README/specs del paquete siguen siendo verdad: README actualizado.
- [x] El diff contiene solo el alcance del WP: sí (no U93/U95/peer-card).

## Hallazgos fuera de alcance

- `ensureFirehoseVolumeLayout` sigue escribiendo la entrada `firehose` en
  `volumes.json` (creación de layout, no recuento). Si se quiere un helper
  «upsert volume entry» en volumes-ops/presets, sería WP aparte.
- Tras el refresh, `source.syncedAt` queda el del `ensure*` previo (ya no se
  reestampa en el recount). Comportamiento aceptable en el flujo
  ensure→write→refresh; si se necesita stamp post-count, candidata a WP.
- Lint: warnings históricos en authority-kit / rooms / mesh (ajenos).

## Dudas / bloqueos

Ninguno. Push no intentado (política del brief).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
