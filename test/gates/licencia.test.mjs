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
import { execFileSync } from 'node:child_process';
import {
  REPO_ROOT,
  LICENSE_POINTER,
  EXTRA_LICENSED_MANIFESTS,
  runAllGates,
  scanLicenseCoherence,
  workspaceLockKeys,
  collectManifests,
  isManifestLicenseExempt
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

  fs.writeFileSync(
    path.join(root, 'LICENSE.md'),
    '# LICENSE — composite\nGPL-3.0-or-later + Animus Iocandi\n'
  );
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

/**
 * Materializa el estado COMMITEADO (HEAD) de LICENSE.md, el lock y todos los
 * manifiestos en un árbol temporal, con un solo proceso `git cat-file --batch`.
 *
 * Por qué no se lee el árbol de trabajo: `node --test` corre los ficheros de
 * test EN PARALELO y `test/gates/matriz-51.test.mjs` muta el repo real mientras
 * tanto — planta `packages/mesh/zz-pieza-fantasma-u233/package.json` (:98-112) y
 * **renombra** `packages/mesh/blob-sync-harness/package.json` fuera de sitio
 * (:137-153) para sus fail-probes. Cualquier aserción sobre el disco vivo es
 * por tanto una carrera, no una medida. Lo commiteado es además lo que viaja.
 *
 * La cobertura del árbol de trabajo la da `npm run gates`, que en CI corre solo
 * y antes de los tests (`.github/workflows/ci.yml:39-42`).
 * @returns {string}
 */
let committedTree;
function committedRepo() {
  if (committedTree) return committedTree;
  const paths = [
    ...execFileSync('git', ['ls-files', '-z', '--', '*package.json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    })
      .split('\0')
      .filter((p) => p === 'package.json' || p.endsWith('/package.json')),
    'LICENSE.md',
    'package-lock.json'
  ];
  const out = execFileSync('git', ['cat-file', '--batch'], {
    cwd: REPO_ROOT,
    input: `${paths.map((p) => `HEAD:${p}`).join('\n')}\n`,
    maxBuffer: 256 * 1024 * 1024
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-licencia-head-'));
  let off = 0;
  for (const rel of paths) {
    const nl = out.indexOf(0x0a, off);
    const header = out.subarray(off, nl).toString('utf8');
    assert.ok(!/ missing$/.test(header), `git no resuelve HEAD:${rel}`);
    const size = Number(header.split(' ')[2]);
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, out.subarray(nl + 1, nl + 1 + size));
    off = nl + 1 + size + 1;
  }
  committedTree = dir;
  return dir;
}

test('CA verde: el repo commiteado no tiene offenders de licencia', { timeout: 60_000 }, () => {
  const offenders = scanLicenseCoherence({ repoRoot: committedRepo() });
  assert.deepEqual(
    offenders,
    [],
    `offenders de licencia inesperados:\n${JSON.stringify(offenders, null, 2)}`
  );
});

test('CA verde: la regla queda registrada en byRule', () => {
  const { byRule } = runAllGates({ repoRoot: committedRepo() });
  assert.ok(
    Object.prototype.hasOwnProperty.call(byRule, 'licencia'),
    'byRule debe declarar la clave `licencia` (si falta, el push de offenders lanzaría)'
  );
  assert.deepEqual(byRule.licencia, []);
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

// --- m2: `existsSync` no basta. Tres formas de dejar el puntero mintiendo. ---
for (const [nombre, romper, esperado] of [
  ['vacío', (abs) => fs.writeFileSync(abs, '   \n'), /está vacío/],
  [
    'con el texto de otra licencia',
    (abs) => fs.writeFileSync(abs, 'MIT License\n\nPermission is hereby granted…\n'),
    /no menciona/
  ],
  [
    'siendo un directorio',
    (abs) => {
      fs.rmSync(abs, { force: true });
      fs.mkdirSync(abs);
    },
    /no es un fichero regular/
  ]
]) {
  test(`m2 fail-closed: LICENSE.md ${nombre}`, () => {
    const root = withFakeRepo(({ root: r }) => romper(path.join(r, 'LICENSE.md')));
    using(root, () => {
      const offenders = scanLicenseCoherence({ repoRoot: root });
      const hit = offenders.filter((o) => o.path === 'LICENSE.md');
      assert.equal(hit.length, 1, JSON.stringify(offenders, null, 2));
      assert.match(hit[0].detail, esperado);
    });
  });
}

test('m3: sin package-lock.json la lista extra SIGUE revisándose', () => {
  const root = withFakeRepo(({ root: r, writeJson }) => {
    fs.rmSync(path.join(r, 'package-lock.json'), { force: true });
    writeJson(EXTRA_LICENSED_MANIFESTS[0], { name: '@fake/nested-lib', license: 'MIT' });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.ok(
      offenders.some((o) => o.path === 'package-lock.json'),
      'el lock ausente se reporta'
    );
    assert.ok(
      offenders.some((o) => o.path === EXTRA_LICENSED_MANIFESTS[0] && /MIT/.test(o.detail)),
      'y el informe NO se queda corto justo cuando más hay que arreglar'
    );
  });
});

// --- BLOQUEANTE 1: el universo sale de `lock.packages`. Universo vacío o de
// otra forma NO puede significar verde. Cinco vectores; el npm 6 es el que
// `npm ci` deja pasar con exit 0 y solo un warning. ---
for (const [nombre, contenido] of [
  ['lock `{}`', {}],
  ['`packages` vacío', { lockfileVersion: 3, packages: {} }],
  ['`packages` como array', { lockfileVersion: 3, packages: [] }],
  ['`packages` null', { lockfileVersion: 3, packages: null }],
  ['forma npm 6 (lockfileVersion 1, sin `packages`)', {
    lockfileVersion: 1,
    dependencies: { 'left-pad': { version: '1.0.0' } }
  }]
]) {
  test(`B1 el gate NO se silencia con ${nombre}`, () => {
    const root = withFakeRepo(({ writeJson }) => writeJson('package-lock.json', contenido));
    using(root, () => {
      const offenders = scanLicenseCoherence({ repoRoot: root });
      assert.ok(
        offenders.some((o) => o.path === 'package-lock.json'),
        `universo amputado sin offender del lock: ${JSON.stringify(offenders, null, 2)}`
      );
      // y además NINGÚN manifiesto queda tapado: al vaciarse el universo, la
      // enumeración por glob los denuncia a todos en vez de callar.
      assert.ok(
        offenders.some((o) => o.path === 'package.json'),
        'la raíz debe salir señalada, no en silencio'
      );
    });
  });
}

test('m1: una entrada de lock null es offender, no TypeError que tumbe el arnés', () => {
  const root = withFakeRepo(({ root: r, writeJson }) => {
    const lock = JSON.parse(fs.readFileSync(path.join(r, 'package-lock.json'), 'utf8'));
    lock.packages['packages/engine/alpha'] = null;
    writeJson('package-lock.json', lock);
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.ok(
      offenders.some((o) => o.path === 'package-lock.json' && /no es un objeto/.test(o.detail))
    );
  });
  // y el arnés completo sigue en pie, no tumbado por un lock malformado
  const conRaizNula = withFakeRepo(({ root: r, writeJson }) => {
    const lock = JSON.parse(fs.readFileSync(path.join(r, 'package-lock.json'), 'utf8'));
    lock.packages[''] = null;
    writeJson('package-lock.json', lock);
  });
  using(conRaizNula, () => {
    assert.doesNotThrow(() => runAllGates({ repoRoot: conRaizNula }));
  });
});

// --- BLOQUEANTE 2: enumeración por glob. Ningún manifiesto exento en silencio. ---
test('B2 manifiesto nuevo que no es miembro de workspace = offender', () => {
  const root = withFakeRepo(({ writeJson }) => {
    writeJson('packages/mesh/operator-ui/projects/dev-app/package.json', {
      name: 'dev-app',
      license: 'MIT'
    });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.equal(offenders.length, 1, JSON.stringify(offenders, null, 2));
    assert.equal(offenders[0].path, 'packages/mesh/operator-ui/projects/dev-app/package.json');
    assert.match(offenders[0].detail, /sin clasificar/);
  });
});

test('B2 el mismo manifiesto tampoco pasa sin campo `license`', () => {
  const root = withFakeRepo(({ writeJson }) => {
    writeJson('packages/mesh/operator-ui/projects/dev-app/package.json', { name: 'dev-app' });
  });
  using(root, () => {
    const offenders = scanLicenseCoherence({ repoRoot: root });
    assert.equal(offenders.length, 1, JSON.stringify(offenders, null, 2));
    assert.match(offenders[0].detail, /sin clasificar/);
  });
});

test('B2 la exención es por clase de ruta, con nombre, y solo esas clases', () => {
  assert.equal(isManifestLicenseExempt('packages/engine/protocol/test/fixtures/x/package.json'), true);
  assert.equal(isManifestLicenseExempt('.claude/skills/demo/fixture/package.json'), true);
  assert.equal(isManifestLicenseExempt('packages/mesh/x/tests/package.json'), true);
  // el vector del bloqueante NO cae en ninguna clase eximida
  assert.equal(
    isManifestLicenseExempt('packages/mesh/operator-ui/projects/dev-app/package.json'),
    false
  );
  assert.equal(isManifestLicenseExempt('package.json'), false);
});

test('B2 la enumeración sale del índice de git: nada no rastreado la altera', () => {
  const tracked = new Set(
    execFileSync('git', ['ls-files', '-z', '--', '*package.json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    })
      .split('\0')
      .filter((p) => p === 'package.json' || p.endsWith('/package.json'))
  );
  const enumerated = collectManifests(REPO_ROOT);
  assert.ok(enumerated.length > 0);
  for (const rel of enumerated) {
    assert.ok(tracked.has(rel), `${rel} no está rastreado: la enumeración no debe verlo`);
  }
  // `*package.json` casa también `ng-package.json`; no debe colarse.
  assert.ok(!enumerated.some((p) => p.endsWith('ng-package.json')));
});

test('B2 sin git (árbol temporal) la reserva recorre el disco y ve MÁS, no menos', () => {
  const root = withFakeRepo(({ writeJson }) => {
    writeJson('packages/mesh/suelto/package.json', { name: 'suelto', license: 'MIT' });
  });
  using(root, () => {
    assert.ok(
      collectManifests(root).includes('packages/mesh/suelto/package.json'),
      'la reserva degrada cerrado: enumera lo que git no puede confirmar'
    );
  });
});

test('B2 el repo commiteado: todo manifiesto está clasificado o eximido por regla escrita', () => {
  const root = committedRepo();
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const classified = new Set([
    ...EXTRA_LICENSED_MANIFESTS,
    ...workspaceLockKeys(lock.packages).map((k) => (k === '' ? 'package.json' : `${k}/package.json`))
  ]);
  const manifests = collectManifests(root);
  const exempt = manifests.filter((m) => !classified.has(m) && isManifestLicenseExempt(m));
  const unclassified = manifests.filter(
    (m) => !classified.has(m) && !isManifestLicenseExempt(m)
  );
  assert.deepEqual(unclassified, [], `manifiestos sin clasificar: ${unclassified.join(', ')}`);
  // La garantía se declara con su alcance: hay exenciones, son por clase de
  // ruta y son enumerables. No es «por construcción».
  assert.ok(manifests.length >= 53, `manifiestos recorridos: ${manifests.length}`);
  assert.ok(exempt.every((m) => isManifestLicenseExempt(m)));
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

test('el universo commiteado es la raíz más los directorios de workspace', () => {
  const root = committedRepo();
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const keys = workspaceLockKeys(lock.packages);
  assert.equal(keys.length, 51, 'raíz + 50 miembros de workspace');
  assert.ok(keys.includes(''), 'la raíz cuenta');
  assert.ok(keys.includes('examples/game-demos'));
  assert.ok(keys.includes('examples/ping-pong-bots'));
  assert.ok(!keys.includes('examples/external-consumer'), 'sin manifiesto no hay clave de lock');
  for (const key of keys) {
    const rel = key === '' ? 'package.json' : `${key}/package.json`;
    assert.ok(fs.existsSync(path.join(root, rel)), `falta manifiesto de ${key}`);
    assert.equal(lock.packages[key].license, LICENSE_POINTER, `lock rancio en ${key}`);
  }
});
