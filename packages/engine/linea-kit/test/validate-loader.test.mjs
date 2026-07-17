import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  validate,
  validateFile,
  validateVolumesTree,
  SCHEMA_FILES
} from '../src/validate.mjs';
import { loadLineaData, resolveNodo, resolveRegistrosForNodo } from '../src/loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');
const lineasFx = path.join(fixtures, 'lineas');
const forcesFx = path.join(fixtures, 'forces');

/** Prefer main-repo VOLUMES (gitignored disks) when worktree has none. */
function resolveLiveVolumesRoot() {
  if (process.env.ZEUS_VOLUMES_ROOT) return process.env.ZEUS_VOLUMES_ROOT;
  const candidates = [
    path.resolve(__dirname, '../../../../../../VOLUMES'),
    path.resolve(__dirname, '../../../../VOLUMES')
  ];
  let fallback = null;
  for (const c of candidates) {
    if (!fs.existsSync(path.join(c, 'volumes.json'))) continue;
    const hasDisk =
      fs.existsSync(path.join(c, 'DISK_01')) ||
      fs.existsSync(path.join(c, 'DISK_02')) ||
      fs.existsSync(path.join(c, 'DISK_03'));
    if (hasDisk) return c;
    fallback ??= c;
  }
  return fallback;
}

describe('schemas + fixtures', () => {
  it('registers all schema ids', () => {
    assert.ok(Object.keys(SCHEMA_FILES).length >= 15);
  });

  it('validates fixture force/cota family', () => {
    assert.equal(validateFile('force-registry', path.join(forcesFx, 'registry.json')).ok, true);
    assert.equal(validateFile('force', path.join(forcesFx, 'forces/force-sample/force.json')).ok, true);
    assert.equal(
      validateFile('force-manifest', path.join(forcesFx, 'forces/force-sample/manifest.json')).ok,
      true
    );
    assert.equal(validateFile('cota', path.join(forcesFx, 'cotas/sima/cota.json')).ok, true);
    assert.equal(
      validateFile('force-manifest', path.join(forcesFx, 'cotas/sima/manifest.json')).ok,
      true
    );
  });

  it('validates fixture line manifests and registros', () => {
    assert.equal(
      validateFile('manifest-tronco', path.join(lineasFx, 'demo/manifest.json')).ok,
      true
    );
    assert.equal(
      validateFile('nodo-meta', path.join(lineasFx, 'demo/nodos/N01/meta.json')).ok,
      true
    );
    assert.equal(
      validateFile('nodo-sections', path.join(lineasFx, 'demo/wp/historia/nodo-sections.json')).ok,
      true
    );
    const sat = JSON.parse(
      fs.readFileSync(path.join(lineasFx, 'demo/wp/historia/manifest.json'), 'utf8')
    );
    assert.equal(validate('manifest-satelite', sat).ok, true);
    for (const reg of sat.registros) {
      assert.equal(validate('registro', reg).ok, true, JSON.stringify(validate('registro', reg).errors));
    }
  });

  it('loads fixture lineas and resolves nodo→registros', async () => {
    const { lineas } = await loadLineaData(lineasFx, {
      troncoCoverage: { min: 1900, max: 2000 },
      sateliteCoverage: { min: 1900, max: 2000 }
    });
    const demo = lineas.demo;
    assert.ok(demo);
    const nodo = resolveNodo(demo, 1950);
    assert.equal(nodo.nodo.id, 'N01');
    const regs = resolveRegistrosForNodo(demo, 'N01');
    assert.equal(regs.total, 2);
    assert.equal(regs.sections[0], 'Intro');
  });
});

describe('live VOLUMES (read-only)', () => {
  it('validates DISK_01/02/03/04 when present without mutating them', () => {
    const root = resolveLiveVolumesRoot();
    if (!root) {
      console.log('⏳ VOLUMES root missing — skipped live validation (fixtures covered above)');
      return;
    }

    const before = snapshotMtimes(root);
    const report = validateVolumesTree({
      volumesRoot: root,
      sampleRegistros: 40,
      sampleCacheMeta: 15
    });

    const failed = report.results.filter((r) => !r.ok);
    if (failed.length) {
      console.error(
        failed.slice(0, 15).map((f) => ({
          schemaId: f.schemaId,
          path: f.path,
          errors: f.errors
        }))
      );
    }
    assert.equal(failed.length, 0, `${failed.length} schema failures under ${root}`);

    const after = snapshotMtimes(root);
    assert.deepEqual(after, before, 'VOLUMES files were mutated during validation');

    const disks = {
      DISK_01: fs.existsSync(path.join(root, 'DISK_01', 'FIREHOSE')),
      DISK_02: fs.existsSync(path.join(root, 'DISK_02', 'LINEAS')),
      DISK_03: fs.existsSync(path.join(root, 'DISK_03', 'FORCES')),
      DISK_04: fs.existsSync(path.join(root, 'DISK_04', 'SSB'))
    };
    console.log(
      `live VOLUMES ok at ${root}; disks=${JSON.stringify(disks)}; checked=${report.results.length}; skipped=${JSON.stringify(report.skipped)}`
    );
  });
});

/**
 * @param {string} root
 * @returns {Record<string, number>}
 */
function snapshotMtimes(root) {
  /** @type {Record<string, number>} */
  const out = {};
  const watch = [
    'volumes.json',
    'DISK_01/FIREHOSE/triage-manifest.json',
    'DISK_02/LINEAS/registry.yaml',
    'DISK_03/FORCES/registry.json',
    'DISK_04/SSB/manifest.json'
  ];
  for (const rel of watch) {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs)) out[rel] = fs.statSync(abs).mtimeMs;
  }
  return out;
}
