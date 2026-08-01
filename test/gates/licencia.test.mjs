/**
 * WP-U237-B3 — gate de coherencia de licencia (regla `licencia`).
 *
 * El lock es lo que viaja a una instalación reproducible. CA: verde en el repo
 * real (con las trampas presentes) y rojo por las DOS caras — manifiesto mutado
 * y lock mutado — sobre árboles temporales, nunca mutando el lock de 1,5 MB del
 * árbol de trabajo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  REPO_ROOT,
  LICENSE_POINTER,
  EXTRA_LICENSED_MANIFESTS,
  runAllGates,
  scanLicenseCoherence,
  workspaceLockKeys
} from '../../scripts/gates/scan.mjs';

/**
 * Árbol sintético mínimo con la misma forma que el repo: raíz + un miembro de
 * workspace + la lib anidada + un paquete de registry + las trampas.
 * @param {(tree: {root: string, writeJson: (rel: string, value: unknown) => void}) => void} [mutate]
 * @returns {string} temp root
 */
function withFakeRepo(mutate) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-gates-licencia-'));
  /** @param {string} rel @param {unknown} value */
  const writeJson = (rel, value) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`);
  };

  fs.writeFileSync(path.join(root, 'LICENSE.md'), '# LICENSE — composite\n');
  writeJson('package.json', { name: 'fake-sdk', license: LICENSE_POINTER, private: true });
  writeJson('packages/engine/alpha/package.json', { name: '@fake/alpha', license: LICENSE_POINTER });
  for (const rel of EXTRA_LICENSED_MANIFESTS) {
    writeJson(rel, { name: '@fake/nested-lib', license: LICENSE_POINTER });
  }

  // --- trampas, todas deben quedar FUERA del universo del gate ---
  // T1: paquete de registry con la cadena histórica AIPLv1.
  // T3/T4: manifiestos sin campo `license` que no son miembros de workspace.
  writeJson('packages/engine/alpha/test/fixtures/smoke/package.json', {
    name: 'ts-subpath-smoke',
    private: true
  });
  writeJson('.claude/skills/demo/fixture/package.json', {
    name: 'cliente-independiente-del-gate',
    private: true
  });
  // Directorio que matchea `examples/*` sin manifiesto: no está en el lock.
  fs.mkdirSync(path.join(root, 'examples/external-consumer'), { recursive: true });

  writeJson('package-lock.json', {
    name: 'fake-sdk',
    lockfileVersion: 3,
    packages: {
      '': { name: 'fake-sdk', license: LICENSE_POINTER },
      'packages/engine/alpha': { name: '@fake/alpha', license: LICENSE_POINTER },
      'node_modules/@alephscript/mcp-core-sdk': { version: '1.5.0', license: 'AIPLv1' },
      'node_modules/@fake/alpha': { resolved: 'packages/engine/alpha', link: true },
      'node_modules/left-pad': { version: '1.0.0', license: 'MIT' }
    }
  });

  if (mutate) mutate({ root, writeJson });
  return root;
}

/** @param {string} root @param {() => void} fn */
function using(root, fn) {
  try {
    fn();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('CA verde: el repo real no tiene offenders de licencia', { timeout: 60_000 }, () => {
  const { byRule } = runAllGates({ repoRoot: REPO_ROOT });
  assert.deepEqual(
    byRule.licencia,
    [],
    `offenders de licencia inesperados:\n${JSON.stringify(byRule.licencia, null, 2)}`
  );
});

test('CA verde: la regla queda registrada en byRule', () => {
  const { byRule } = runAllGates({ repoRoot: REPO_ROOT });
  assert.ok(
    Object.prototype.hasOwnProperty.call(byRule, 'licencia'),
    'byRule debe declarar la clave `licencia` (si falta, el push de offenders lanzaría)'
  );
});

test('CA verde: árbol sintético limpio, con las cuatro trampas presentes', () => {
  const root = withFakeRepo();
  using(root, () => {
    assert.deepEqual(scanLicenseCoherence({ repoRoot: root }), []);
  });
});

test('cara A (rojo): manifiesto de workspace mutado a AIPLv1 sin regenerar el lock', () => {
  const root = withFakeRepo(({ writeJson }) => {
    writeJson('packages/engine/alpha/package.json', { name: '@fake/alpha', license: 'AIPLv1' });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.equal(offenders.length, 1, JSON.stringify(offenders, null, 2));
    assert.equal(offenders[0].rule, 'licencia');
    assert.equal(offenders[0].path, 'packages/engine/alpha/package.json');
    assert.equal(typeof offenders[0].line, 'number');
    assert.match(offenders[0].detail, /AIPLv1/);
  });
});

test('cara B (rojo): entrada raíz del lock mutada a AIPLv1', () => {
  const root = withFakeRepo(({ root: r, writeJson }) => {
    const lock = JSON.parse(fs.readFileSync(path.join(r, 'package-lock.json'), 'utf8'));
    lock.packages[''].license = 'AIPLv1';
    writeJson('package-lock.json', lock);
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    const lockOffenders = offenders.filter((o) => o.path === 'package-lock.json');
    assert.equal(lockOffenders.length, 1, JSON.stringify(offenders, null, 2));
    assert.equal(lockOffenders[0].rule, 'licencia');
    assert.match(lockOffenders[0].detail, /<raíz>/);
    assert.match(lockOffenders[0].detail, /regenera el lock/);
  });
});

test('cara B (rojo): entrada de miembro del lock rancia frente a su manifiesto', () => {
  const root = withFakeRepo(({ root: r, writeJson }) => {
    const lock = JSON.parse(fs.readFileSync(path.join(r, 'package-lock.json'), 'utf8'));
    lock.packages['packages/engine/alpha'].license = 'AIPLv1';
    writeJson('package-lock.json', lock);
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.equal(offenders.length, 2, JSON.stringify(offenders, null, 2));
    assert.ok(
      offenders.some((o) => o.path === 'package-lock.json'),
      'el lock rancio se señala por su propia ruta'
    );
    assert.ok(
      offenders.some(
        (o) =>
          o.path === 'packages/engine/alpha/package.json' && /discrepan/.test(o.detail)
      ),
      'y la discrepancia manifiesto↔lock se señala en el manifiesto'
    );
  });
});

test('contraprueba T2: la lib anidada SÍ se vigila, contra el manifiesto', () => {
  const root = withFakeRepo(({ writeJson }) => {
    writeJson(EXTRA_LICENSED_MANIFESTS[0], { name: '@fake/nested-lib', license: 'MIT' });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.equal(offenders.length, 1, JSON.stringify(offenders, null, 2));
    assert.equal(offenders[0].path, EXTRA_LICENSED_MANIFESTS[0]);
    assert.match(offenders[0].detail, /MIT/);
  });
});

test('fail-closed: la lib anidada declarada pero ausente es offender', () => {
  const root = withFakeRepo(({ root: r }) => {
    fs.rmSync(path.join(r, EXTRA_LICENSED_MANIFESTS[0]), { force: true });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.equal(offenders.length, 1, JSON.stringify(offenders, null, 2));
    assert.match(offenders[0].detail, /manifiesto ausente/);
  });
});

test('fail-closed: puntero que apunta a un LICENSE.md inexistente', () => {
  const root = withFakeRepo(({ root: r }) => {
    fs.rmSync(path.join(r, 'LICENSE.md'), { force: true });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.ok(
      offenders.some((o) => o.path === 'LICENSE.md' && /no existe/.test(o.detail)),
      JSON.stringify(offenders, null, 2)
    );
  });
});

test('fail-closed: sin package-lock.json la licencia no viaja', () => {
  const root = withFakeRepo(({ root: r }) => {
    fs.rmSync(path.join(r, 'package-lock.json'), { force: true });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.equal(offenders.length, 1);
    assert.equal(offenders[0].path, 'package-lock.json');
  });
});

test('T1: el universo excluye toda clave con segmento node_modules', () => {
  const keys = workspaceLockKeys({
    '': {},
    'packages/engine/alpha': {},
    'node_modules/@alephscript/mcp-core-sdk': {},
    'packages/engine/alpha/node_modules/left-pad': {},
    'packages/node_modulesish/beta': {}
  });
  assert.deepEqual(keys.sort(), ['', 'packages/engine/alpha', 'packages/node_modulesish/beta']);
});

test('el universo del repo real es la raíz más los directorios de workspace', () => {
  const lock = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'package-lock.json'), 'utf8')
  );
  const keys = workspaceLockKeys(lock.packages);
  assert.ok(keys.includes(''), 'la raíz cuenta');
  assert.ok(keys.includes('examples/game-demos'));
  assert.ok(keys.includes('examples/ping-pong-bots'));
  assert.ok(!keys.includes('examples/external-consumer'), 'sin manifiesto no hay clave de lock');
  for (const key of keys) {
    const rel = key === '' ? 'package.json' : `${key}/package.json`;
    assert.ok(fs.existsSync(path.join(REPO_ROOT, rel)), `falta manifiesto de ${key}`);
    assert.equal(lock.packages[key].license, LICENSE_POINTER, `lock rancio en ${key}`);
  }
});
