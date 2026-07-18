# Brief — WP-U97 · feed-kit cuenta volúmenes por volumes-ops

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U97 · feed-kit cuenta volúmenes por volumes-ops
Rama: wp/u97-feed-volumes-ops
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u97-feed-volumes-ops
Reporte: plan/REPORTES/WP-U97-feed-volumes-ops.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U97-feed-volumes-ops.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — cola higiene; lote-higiene-11a;
dep U85 ✅; paralelo con U95 (otro worktree; superficies distintas):
- `feed-kit/jetstream-sync.mjs` duplica recuento de corpus y parcheo de
  `volumes.json` que `volumes-ops` ya provee (`syncVolumeCounters` +
  `resetVolumesCache`).
- Divergencia: feed-kit solo cuenta `.json` y nunca invalida caché.
- Sustituir por `syncVolumeCounters('firehose')` +
  `loadVolumesConfig()` / `resolveVolumesRoot()`.
- CA (literal BACKLOG):
  · `rg "countJsonFiles|readFileSync\(volumesPath" engine/feed-kit/src`
    sin matches
  · `npm test -w @zeus/feed-kit` verde
  · recuento cubre cualquier tipo e invalida caché
- Demolición: `countJsonFiles` y el parcheo manual.

Alcance orientativo:
- `packages/engine/feed-kit/src/jetstream-sync.mjs` — reemplazar
  recuento/parcheo local por APIs de `@zeus/volumes-ops`
  (`syncVolumeCounters`, `resetVolumesCache`, `loadVolumesConfig`,
  `resolveVolumesRoot` según el WP).
- Añadir dependencia workspace a volumes-ops si falta.
- NO tocar WP-U93 / peer-card / webrtc-signaling / autoridad-join.
- NO implementar U95 (helper `./node`) — otro WP del lote.
- NO tocar U94/U96/U98/U99 ni Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- feed-kit / volumes-ops = engine genérico; cero conceptos exclusivos
  de delta/pozo. Gate.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- packages/engine/feed-kit/src/jetstream-sync.mjs
- packages/engine/volumes-ops/src/ (counters.mjs, contract, index)
- plan/REPORTES/WP-U85-feed-families.md (contexto feed-kit)
- plan/DATOS.md §5 (files-first / VOLUMES) si hace falta anclar

Notas del orquestador:
- Lote-higiene-11a paralelo: U97 = feed-kit → volumes-ops; U95 =
  paths `./node`. Partición clara — no solapar.
- Independiente de peer-card / U93; sin credenciales.
- Pregunta obligatoria (CA): ¿rg sin matches de countJsonFiles /
  readFileSync(volumesPath)? ¿tests feed-kit verdes? ¿recuento
  tipado + invalida caché? ¿Demolición de countJsonFiles + parcheo?
  Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
