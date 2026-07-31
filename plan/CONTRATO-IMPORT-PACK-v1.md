# CONTRATO-IMPORT-PACK-v1 · pack Release → root de volúmenes cercado

| dato | valor |
| ---- | ----- |
| WP | **U201** · Contrato de import v1 (P0 · carril D 3/8 · BACKLOG :258) |
| Implementación | `packages/engine/volumes-ops/src/import.mjs` (`importPack`) |
| Tests | `packages/engine/volumes-ops/test/import-pack.test.mjs` (7 pasos + casos rojos) |
| Genealogía | `CONTRATO-IMPORT-PACK-v0` — propuesta Z, no ejecutada: `sincronia/notas/NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:111-140` **[cita inerte]** |
| Consenso marco | mesa H-01: instalar (kit npm) → **sembrar (pack por Release, import-once)** → sincronizar (P2P, futuro) |
| Herencias duras | U199 (manifiesto sellado sha256 + `volumes.state.json`) · U200 (root por env obligatorio ◆5, cero defaults, rechazo node_modules — cerco §10.8) |

## 0 · Supersesiones sobre v0 (decisiones de v1, declaradas)

v0 se cita como génesis **[cita inerte]**; donde v1 contradice a v0 manda v1:

1. **R5-v0 muere** («`volumes.json` MUTABLE aunque los corpora sean RO»).
   Desde U199 el manifiesto está sellado: la medición JAMÁS lo escribe; el
   estado vivo va a `volumes.state.json`. **El import es el ÚNICO escritor
   legítimo del manifiesto**, y escribe re-sellando (nuevo sha256) vía
   `manifest.mjs` — nunca `writeFileSync` directo.
2. **Staging junto al root, no «fuera del root»** (v0 paso 2 decía «fuera»).
   v1: directorio temporal `.import-staging-*` DENTRO del root destino —
   mismo dispositivo, fusión por `rename` atómico, jamás cross-device. Se
   conserva la intención de v0: nada aterriza sobre slots vivos a medias.
3. **«Import pobla corpora»** (BACKLOG :256, compromiso U199): los conteos
   `files`/`bytes` de `corpora` del MANIFIESTO los escribe el import en
   SELLAR, medidos del árbol recién aterrizado. Así el consumidor
   `firehose-core/src/browse.mjs:32,112` (lee del manifiesto) vuelve a ser
   veraz sin migrarlo. La deriva posterior es asunto del estado (U199), no
   del manifiesto.
4. **Symlink en el pack = rechazo** (v0 solo prohibía crear enlaces). v1
   falla-cerrado: un enlace dentro del pack ES un ancla viva por
   construcción; no se materializa como copia, se aborta (paso 1).
5. **Material de identidad = rechazo en VERIFICAR** (v0 lo dejaba como
   CA-d «grep de secretos = 0»). v1: denylist de nombres
   (`.env*`, `*.pem`, `*.key`, `id_rsa*`, `secret*`) en el pack → aborta.
6. **Rol operador**: el import muta el manifiesto sellado → intent
   `import_pack` en el catálogo de volumes-ops, solo `operator`, asiento en
   ledger. Rol omitido resuelve a `player` → denegado (hostil-omite).
7. **Shape del pack v1 propia, declarada** (la shape real de
   `@zeus/startpack-*` vive en games-library y NO es visible en este árbol;
   solo se hereda de v0 el principio «version + hash declarados por el
   propio Release»):

   ```text
   <packRoot>/
     manifest.json   { name, version,
                       volumes: { <id>: { disk, path, readonly?, label?,
                                          corpora?: [{id, path, label?}] } },
                       hashes: { "<rel bajo volumes/>": "<sha256 hex>", … } }
     volumes/DISK_xx/<path>/…   (datos; TODOS enumerados en hashes)
   ```

   Neutral C1/C2 (herencia v0): cambia el peso del artefacto, no el
   contrato de aterrizaje.

## 1 · Los 7 pasos — contrato observable por paso

Cada paso reporta en `result.steps[]` (`{ step, ok, … evidencia }`). Todo
fallo: `{ ok:false, step, error }`, **root intacto** (hash del manifiesto
idéntico) y **staging eliminado**.

| # | paso | qué verifica / hace | qué toca | qué NO toca | qué deja si falla |
| - | ---- | ------------------- | -------- | ----------- | ----------------- |
| 1 | **VERIFICAR** | `manifest.json` del pack (name, version, volumes, hashes); cada fichero listado existe y su sha256 coincide; cero ficheros sin enumerar; cero symlinks/junctions; cero material de identidad (denylist §0.5); con corpora declarados, todo fichero del volumen vive bajo un corpus (fusión estricta por corpus); destino = **root canónico U200** (env obligatorio; node_modules rechazado) — `volumesRoot` explícito solo como ASERCIÓN de consistencia (difiere → `root_inconsistente`); root destino sin `volumes.json` = not operable (U199, no se inventa) | nada | root, red (0 accesos: el pack ya está en disco) | nada (no llegó a existir staging) |
| 2 | **STAGING** | copia los datos del pack a `.import-staging-<name>-<pid>-<ts>/` bajo el root destino (mismo device); la copia materializa — jamás enlaza | staging propio | slots vivos, manifiesto | staging borrado |
| 3 | **VALIDAR** | manifiesto candidato (fusión destino+pack en memoria) contra el schema `volumes` de linea-kit (gate U80); re-hash de lo staged = hashes del pack | nada fuera del staging | slots vivos, manifiesto | staging borrado |
| 4 | **FUSIONAR** | pase 1 (dry): TODA colisión se detecta ANTES de mover nada — corpus `id` ya presente en el volumen destino con contenido distinto = **ERROR, no merge** (v0 paso 4); volumen nuevo con `disk`/`path` ya ocupados por otro volumen = ERROR; pase 2: `rename` de staging a `DISK_xx/<path>` | slots destino (solo en pase 2) | corpus idéntico ya presente (queda como no-op de corpus) | root intacto (el pase 1 aborta antes del primer rename); staging borrado |
| 5 | **SELLAR** | reescribe el manifiesto vía `manifest.mjs` (único escritor legítimo): entrada de volumen + `corpora` con `files`/`bytes` MEDIDOS del árbol aterrizado + `source.imported { name, version, packHash, importedAt, origin? }` (origen = metadato INERTE, §10.8); re-sella (nuevo sha256); registra estado (U199) y asiento `import_pack` en el ops-ledger | manifiesto (re-sellado), `volumes.state.json`, ledger | datos ya fusionados (RO desde aquí) | n/a (los pasos que escriben slots ya cerraron; un fallo aquí se reporta con root de datos consistente y manifiesto previo intacto) |
| 6 | **NO-OP** | si el manifiesto destino ya registra `name` + `packHash` idénticos → retorna `{ ok:true, noop:true }` SIN staging, SIN escritura: sha256 del manifiesto idéntico antes/después (se decide tras VERIFICAR, antes de STAGING) | nada | todo | n/a |
| 7 | **NO-LINK** | tras fusionar: walk del árbol aterrizado → 0 symlinks/junctions (lstat); complementa el rechazo de entrada (§0.4) | nada | — | (si detectara un enlace: fallo con evidencia; los datos provienen de copias, así que su presencia implica intervención externa) |

## 2 · CA (ejecutables — test por paso)

| CA | evidencia |
| -- | --------- |
| 7 pasos con test (verde + rojo donde aplica) | `test/import-pack.test.mjs`: verificar (hash roto, fichero sin enumerar, secreto, symlink → 4 rojos), staging limpio tras éxito y tras fallo, validar (schema roto → rojo), fusionar (colisión → rojo CA-2), sellar (corpora poblados + sha nuevo), no-op (CA-3), no-link (CA-4) |
| Colisión aborta sin root a medias | hash del manifiesto idéntico + árbol sin residuos `.import-staging*` + slot previo intacto |
| No-op por hash | sha256 del manifiesto tras import 1 == tras import 2 |
| Sin symlinks | junction plantada en el pack → rechazo en VERIFICAR; walk post-import = 0 enlaces |
| Suites previas verdes | volumes-ops · firehose-core · feed-kit · linea-kit · presets-sdk (tails en reporte del WP) |

## 3 · Lo que este contrato NO cubre (fronteras)

- **Descarga/canal del Release** (URL, verificación de firma de Release):
  fuera — el pack llega expandido a disco por el operador o el kit; la URL
  de origen solo viaja como metadato inerte (v0 paso 1, cerco §10.8).
- **Drivers por familia DISK** (detect/validate/index/merge específicos de
  FORCES/LINEAS/FIREHOSE/SSB — nota H-01 §③): eslabones U202–U205; este
  contrato es la mecánica común de aterrizaje sobre la que montan.
- **Sincronizar (P2P)**: tercer momento del consenso H-01, futuro.
