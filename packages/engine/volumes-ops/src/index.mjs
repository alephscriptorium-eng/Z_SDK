/**
 * @zeus/volumes-ops — measure and empty VOLUMES with roles + ledger (WP-U82).
 */

export { VOLUMES_OPS_INTENT_DEFS, VOLUMES_OPS_CATALOG } from './catalog.mjs';
export {
  measurePath,
  measureVolume,
  measureCorpus,
  measureAllVolumes
} from './measure.mjs';
export {
  emptyVolume,
  clearDirectoryContents,
  isSoftEmptyTarget,
  DEFAULT_SOFT_CORPUS_STATUSES
} from './empty.mjs';
export { syncVolumeCounters } from './counters.mjs';
export { importPack, IDENTITY_DENYLIST } from './import.mjs';
export { FAMILY_DRIVERS, detectVolumeFamily } from './drivers.mjs';
export { LINEAS_DRIVER, LINEAS_FAMILY } from './driver-lineas.mjs';
export { FORCES_DRIVER, FORCES_FAMILY, hashUnitTree } from './driver-forces.mjs';
// WP-U206 · CA local-first: adaptador de pack, verificador de integridad
// (paso 6) y cerco del root (paso 7). Los tres viven en `src/` a propósito:
// en `e2e/` el CA pasaría y el producto seguiría desprotegido.
export {
  buildPackFromStartpack,
  readStartpackIdentity,
  PackAdapterError,
  PACK_DATA_DIR
} from './pack-adapter.mjs';
export { verifyRootIntegrity, assertRootIntegrity } from './verify.mjs';
export { scanRootCerco, assertRootCerco } from './cerco.mjs';
// El guardián de arranque: ÚNICO punto por el que los servicios entran a los
// dos verificadores (decisión ⑩). Se llama, no se replica.
export { assertVolumesRootBootable, cercoIsStrict } from './boot.mjs';
export {
  FIREHOSE_DRIVER,
  FIREHOSE_FAMILY,
  FIREHOSE_ROOT_FILES,
  TRIAGE_INDEX_FILE,
  firehoseUnitKey,
  parseAtUri,
  isFirehoseUnit,
  isUnitSlot
} from './driver-firehose.mjs';
export {
  MANIFEST_FILE_NAME,
  resolveManifestPath,
  readManifestRaw,
  hashManifest,
  sealManifest
} from './manifest.mjs';
export {
  STATE_FILE_NAME,
  STATE_VERSION,
  resolveVolumesStatePath,
  loadVolumesState,
  writeVolumesState,
  recordVolumeState,
  recordVolumeSync
} from './state.mjs';
export {
  appendOpsLedger,
  readOpsLedger,
  resolveOpsLedgerPath,
  DEFAULT_LEDGER_NAME
} from './ledger.mjs';
export { VOLUMES_OPS_ROUTES } from './contract.mjs';
export { mountVolumesOpsRoutes } from './routes.mjs';
export { createVolumesOpsServer } from './server.mjs';
