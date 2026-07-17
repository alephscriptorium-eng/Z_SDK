# WP-U82 · volumenes-crud — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-18 |
| rama | `wp/u82-volumenes-crud` |
| commit(s) | `cc46241` feat volumes-ops · `84a471c` docs reporte |
| estado propuesto | listo para revisión |

## Qué se hizo

Nació `@zeus/volumes-ops` (`packages/engine/volumes-ops`): medición files-first
(archivos + bytes por volumen/corpus/`linePath`), vaciado con roles (DATOS.md
§4: `operator` = purga dura + asiento JSONL; `player`/`dj` rechazados en
`empty_volume`; `empty_playable` asienta sin borrar), reescritura de contadores
en `volumes.json`, y contrato RouteEntry REST→MCP (patrón U40). Server HTTP
efímero para e2e (`port: 0`). Corpus sintético bajo `mkdtemp` +
`ZEUS_VOLUMES_ROOT` — no se tocó DISK_01/02/03 real. Changeset minor.

## Archivos tocados

- creado `packages/engine/volumes-ops/**` — package, measure/empty/ledger/counters, contract/routes/server, tests, README
- creado `.changeset/wp-u82-volumenes-crud.md` — bump minor
- modificado `package-lock.json` — workspace `@zeus/volumes-ops`
- creado `plan/REPORTES/WP-U82-volumenes-crud.md` — este reporte

## Evidencia

### Unit + CA e2e

```
$ npm test -w @zeus/volumes-ops
# Subtest: CA: fill → measure resource → empty operator → reject player; counters
ok 1 - CA: fill → measure resource → empty operator → reject player; counters
# Subtest: player hard empty → rol_no_autorizado; files remain
ok 2 - player hard empty → rol_no_autorizado; files remain
# Subtest: operator empty raw → files gone + ledger + counters
ok 3 - operator empty raw → files gone + ledger + counters
# Subtest: empty_playable seats ledger without deleting
ok 4 - empty_playable seats ledger without deleting
# Subtest: measurePath counts files and bytes
ok 5 - measurePath counts files and bytes
# Subtest: measureVolume / measureCorpus + syncVolumeCounters write volumes.json
ok 6 - measureVolume / measureCorpus + syncVolumeCounters write volumes.json
# tests 6 / pass 6 / fail 0
```

CA cubierto en `test/e2e-crud.test.mjs`: llenar corpus sintético → medir HTTP +
MCP `volumes://measure/{volumeId}` → POST empty `player` → 403
`rol_no_autorizado` (archivos intactos) → POST empty `operator` → archivos
fuera + `.ops-ledger.jsonl` + `volumes.json` contadores a 0.

### Gates / lint / dos juegos

```
$ npm run gates
gates: OK (0 offenders)

$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # preexistentes; cero errores nuevos

$ npm test -w @zeus/arg-domain
# tests 60 / pass 60

$ npm test -w @zeus/pozo
# tests 6 / pass 6
```

Arranque: e2e levantó HTTP + MCP efímeros (`port: 0`). `ZEUS_OPEN_BROWSER`
unset (= no abre).

### Pregunta obligatoria (CA)

| pregunta | respuesta |
| -------- | --------- |
| ¿e2e medir + vaciar operator OK + rechazo player? | Sí (test CA ok 1) |
| ¿ledger asienta? | Sí — `.ops-ledger.jsonl` con `kind: empty_volume`, `role: operator` |
| ¿volumes.json contadores? | Sí — `files`/`bytes` reescritos tras vaciar |

## Demolición

Auditoría de scripts sueltos de limpieza/purga de VOLUMES:

```
$ rg -n "purge|vaciar|limpiar.*volume|clean.*DISK|rmSync.*VOLUMES" scripts/ --glob '*.{mjs,js,sh,md}'
(sin matches)
```

**No había scripts de limpieza sin autoridad/ledger que demoler.** Nada borrado.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no — `port: 0` / `resolveZeusHost`; sin slot UI nuevo en env (lib, no mesh permanente).
- [x] Cadenas if/switch → tabla: catálogo de intents; mapa `statusByError` en routes.
- [x] Duplicación: reutiliza `@zeus/presets-sdk/volumes`, `@zeus/protocol` roles, `@zeus/http-contract` U40, `@zeus/linea-kit/curation` para soft/canon.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres de transición (`legacy`/`v2`/…): no. Cero nombres de juego.
- [x] Demolición: n/a (nada que borrar; auditoría documentada).
- [x] Tests de comportamiento: measure bytes/files, reject player, purge+ledger+counters, MCP resource.
- [x] Arranque real: e2e HTTP+MCP; no navegador.
- [x] README del paquete describe contratos y política de temp VOLUMES.
- [x] Diff solo alcance U82 (+ changeset + reporte).

Regla dos juegos: ¿pozo puede consumir esto tal cual? Sí — roles genéricos y
ops sobre VOLUMES sin conceptos de juego; arg-domain y pozo verdes.

## Hallazgos fuera de alcance

1. **VOLUMES/README.md** documenta `npm run volumes:sync:firehose` /
   `volumes:init:lineas` que **no existen** en `package.json` raíz (docs drift;
   no son scripts de purga — no demolidos aquí).
2. Worktree sin `DISK_*` (gitignored); ops reales requieren
   `ZEUS_VOLUMES_ROOT` al árbol master (mismo hallazgo U80).
3. `readonly: true` en registry vivo no bloquea aún el vaciado operator en
   código (la autoridad es el rol+ledger). Si se quiere honorar `readonly` como
   segundo candado, candidato a WP fino.
4. `npm run release:changeset-dry` sobre paquete **aún untracked** falla al
   restaurar (`git checkout` del package.json nuevo) y ensucia el árbol con
   bumps/CHANGELOGs. Correr el dry solo tras el primer commit del paquete, o
   endurecer el script.

## Dudas / bloqueos

Ninguno bloqueante. Push: **no intentado** (política del brief).

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-18 (orquestador).

### Verificado

- Diff `master...HEAD` acotado: solo `@zeus/volumes-ops`, changeset minor,
  `package-lock.json`, reporte. **No** tocó `plan/BACKLOG.md`.
- Merge-base = master (`3d78e06`); no hace falta merge previo.
- Re-CA: `npm test -w @zeus/volumes-ops` → 6/6 pass (e2e CA + roles + measure).
- `npm run gates` → OK (0 offenders).
- Roles: `empty_volume` = operator only (`rol_no_autorizado` para player);
  `empty_playable` = player/dj asienta sin borrar (DATOS.md §4).
- Ledger: `.ops-ledger.jsonl` append-only con `kind: empty_volume` + role.
- `volumes.json`: `syncVolumeCounters` reescribe `files`/`bytes` post-vaciado.
- REST→MCP vía RouteEntry (`volumes://measure/{volumeId}`); mutación empty
  solo HTTP. `port: 0` / `resolveZeusHost`; cero nombres de juego.
- Demolición: auditoría sin scripts sueltos de purga — n/a documentada.
- Hallazgos (docs drift scripts, readonly candado, dry-run untracked) → no
  bloquean; candidatos a WP/notas, no arreglados de pasada.

### CA

- [x] e2e fill → measure resource → empty operator (ledger + archivos fuera)
- [x] rechazo empty con rol player
- [x] `volumes.json` refleja contadores

### Merge

Autorizado. Orden sugerido: **U82** independiente de U81/U91 (lote-7a).
Tras merge en master: orquestador marca ✅ BACKLOG + `git worktree remove`
`.worktrees/wp-u82-volumenes-crud`. Dirty CRLF en
`playbook-kit/bin/run-playbook.mjs` (fuera de alcance) — no incluir.

### Acción siguiente

Usuario/orquestador: merge + ✅ BACKLOG en master (esta revisión no hace
ni merge ni push ni ✅).
