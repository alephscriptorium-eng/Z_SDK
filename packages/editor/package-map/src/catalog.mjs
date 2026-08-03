import fs from 'node:fs/promises';
import path from 'node:path';

export const WAVE_DEFINITIONS = [
  { id: 1, label: 'Nucleo', description: 'Contratos, runtime y proyeccion base' },
  { id: 2, label: 'Capacidades', description: 'Dominio, datos y adaptadores' },
  { id: 3, label: 'Mesh + apps', description: 'Servicios, integraciones e interfaces' }
];

const FORBIDDEN_SEGMENTS = new Set([
  '.changeset',
  'data',
  'docs',
  'e2e',
  'examples',
  'exampes',
  'plan',
  'sincronia',
  'test',
  'VOLUMES'
]);
export const CATEGORY_DEFINITIONS = {
  contract: { label: 'Contrato', color: '#f1c75b' },
  transport: { label: 'Transporte', color: '#79d7ab' },
  authority: { label: 'Autoridad', color: '#ff7369' },
  domain: { label: 'Dominio', color: '#d9a7eb' },
  data: { label: 'Datos', color: '#66c7e8' },
  adapter: { label: 'Adaptador', color: '#f1a45d' },
  projection: { label: 'Proyeccion', color: '#9bd477' },
  shell: { label: 'Shell UI', color: '#d8dedb' },
  service: { label: 'Servicio', color: '#ed8db2' },
  app: { label: 'Aplicacion', color: '#a9b4ff' }
};

const WAVE_ONE = new Set([
  '@zeus/app-shell',
  '@zeus/authority-kit',
  '@zeus/game-engine',
  '@zeus/http-contract',
  '@zeus/lifecycle-kit',
  '@zeus/player-mcp-kit',
  '@zeus/protocol',
  '@zeus/room-client-browser',
  '@zeus/rooms',
  '@zeus/socket-core',
  '@zeus/ui-3d-kit',
  '@zeus/ui-kit',
  '@zeus/view-kit'
]);

const WAVE_TWO = new Set([
  '@zeus/acta-kit',
  '@zeus/embajador-kit',
  '@zeus/feed-kit',
  '@zeus/firehose-core',
  '@zeus/linea-kit',
  '@zeus/parte-kit',
  '@zeus/playbook-kit',
  '@zeus/presets-sdk',
  '@zeus/reparto-kit',
  '@zeus/story-board-schema',
  '@zeus/test-utils',
  '@zeus/volumes-ops',
  '@zeus/webrtc-signaling'
]);

const CATEGORY_MEMBERS = {
  contract: [
    '@zeus/http-contract',
    '@zeus/protocol',
    '@zeus/story-board-schema'
  ],
  transport: [
    '@zeus/oasis-webrtc',
    '@zeus/room-client-browser',
    '@zeus/rooms',
    '@zeus/socket-core',
    '@zeus/socket-server',
    '@zeus/webrtc-signaling',
    '@zeus/webrtc-viewer'
  ],
  authority: [
    '@zeus/authority-kit',
    '@zeus/ciudad-lifecycle',
    '@zeus/lifecycle-kit'
  ],
  domain: [
    '@zeus/acta-kit',
    '@zeus/embajador-kit',
    '@zeus/game-engine',
    '@zeus/parte-kit',
    '@zeus/playbook-kit',
    '@zeus/reparto-kit',
    '@zeus/solar-system'
  ],
  data: [
    '@zeus/blob-sync-harness',
    '@zeus/blobstore-client',
    '@zeus/cache-browser',
    '@zeus/feed-kit',
    '@zeus/firehose-browser',
    '@zeus/firehose-core',
    '@zeus/force-system',
    '@zeus/linea-firehose',
    '@zeus/linea-kit',
    '@zeus/linea-system',
    '@zeus/presets-sdk',
    '@zeus/ssb-system',
    '@zeus/volumes-ops'
  ],
  adapter: [
    '@zeus/operator-bridge',
    '@zeus/player-mcp-kit'
  ],
  projection: [
    '@zeus/threejs-ui-lib',
    '@zeus/ui-3d-kit',
    '@zeus/view-kit'
  ],
  shell: [
    '@zeus/app-shell',
    '@zeus/ui-kit'
  ],
  service: [
    '@zeus/console-monitor',
    '@zeus/linea-editor',
    '@zeus/mcp-launcher',
    '@zeus/test-utils'
  ],
  app: [
    '@zeus/3d-monitor',
    '@zeus/editor-ui',
    '@zeus/operator-ui',
    '@zeus/package-map',
    '@zeus/player-3d-ui',
    '@zeus/player-ui'
  ]
};

const CATEGORY_BY_PACKAGE = new Map(
  Object.entries(CATEGORY_MEMBERS).flatMap(([category, names]) => (
    names.map((name) => [name, category])
  ))
);

function waveFor(name) {
  if (WAVE_ONE.has(name)) return 1;
  if (WAVE_TWO.has(name)) return 2;
  return 3;
}

function categoryFor(name, manifest) {
  const explicit = CATEGORY_BY_PACKAGE.get(name);
  if (explicit) return explicit;
  if (manifest.zeus?.role === 'mcp') return 'service';
  if (manifest.zeus?.role === 'app' || manifest.zeus?.role === 'ui') return 'app';
  return 'adapter';
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function packageManifestPaths(packagesRoot) {
  const manifests = [];
  for (const group of ['engine', 'editor', 'mesh']) {
    const groupRoot = path.join(packagesRoot, group);
    const entries = await fs.readdir(groupRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const packageRoot = path.join(groupRoot, entry.name);
      const manifestPath = path.join(packageRoot, 'package.json');
      try {
        await fs.access(manifestPath);
        manifests.push(manifestPath);
      } catch {}

      const projectsRoot = path.join(packageRoot, 'projects');
      try {
        const projects = await fs.readdir(projectsRoot, { withFileTypes: true });
        for (const project of projects) {
          if (!project.isDirectory()) continue;
          const projectManifest = path.join(projectsRoot, project.name, 'package.json');
          try {
            await fs.access(projectManifest);
            manifests.push(projectManifest);
          } catch {}
        }
      } catch {}
    }
  }
  return manifests;
}

function collectTypePaths(exportsField, paths = []) {
  if (!exportsField || typeof exportsField !== 'object') return paths;
  for (const [key, value] of Object.entries(exportsField)) {
    if (key === 'types' && typeof value === 'string') paths.push(value);
    else collectTypePaths(value, paths);
  }
  return paths;
}

function collectSubpaths(exportsField) {
  if (!exportsField || typeof exportsField !== 'object') return [];
  return Object.keys(exportsField)
    .filter((key) => key.startsWith('.') && key !== '.')
    .map((key) => key.replace(/^\.\//, ''));
}

function hasForbiddenSegment(filePath) {
  return filePath
    .replaceAll('\\', '/')
    .split('/')
    .some((segment) => FORBIDDEN_SEGMENTS.has(segment));
}

function symbolsFromDeclaration(source) {
  const symbols = new Set();
  const declarationPattern = /export\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  const listPattern = /export\s+(?:type\s+)?\{([^}]+)\}/gs;
  for (const match of source.matchAll(declarationPattern)) symbols.add(match[1]);
  for (const match of source.matchAll(listPattern)) {
    for (const entry of match[1].split(',')) {
      const symbol = entry
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/).at(-1)
        ?.trim();
      if (symbol && /^[A-Za-z_$][\w$]*$/.test(symbol)) symbols.add(symbol);
    }
  }
  return [...symbols];
}

async function publicSurface(packageRoot, manifest) {
  const declaredPaths = [
    manifest.types,
    manifest.typings,
    ...collectTypePaths(manifest.exports)
  ].filter((value) => typeof value === 'string');
  const typePaths = [...new Set(declaredPaths)];
  const symbols = new Set();
  const evidence = [];

  for (const declaredPath of typePaths) {
    if (hasForbiddenSegment(declaredPath)) continue;
    const absolutePath = path.resolve(packageRoot, declaredPath);
    if (!absolutePath.startsWith(packageRoot + path.sep)) continue;
    try {
      const source = await fs.readFile(absolutePath, 'utf8');
      symbolsFromDeclaration(source).forEach((symbol) => symbols.add(symbol));
      evidence.push(declaredPath.replaceAll('\\', '/'));
    } catch {}
  }

  return {
    symbols: [...symbols].sort((left, right) => left.localeCompare(right)),
    subpaths: collectSubpaths(manifest.exports),
    evidence
  };
}

export async function buildPackageCatalog(packagesRoot) {
  const manifestPaths = await packageManifestPaths(packagesRoot);
  const packageRecords = await Promise.all(manifestPaths.map(async (manifestPath) => {
    const packageRoot = path.dirname(manifestPath);
    const manifest = await readJson(manifestPath);
    const relativeRoot = path.relative(path.dirname(packagesRoot), packageRoot).replaceAll('\\', '/');
    const surface = await publicSurface(packageRoot, manifest);
    const dependencies = Object.keys(manifest.dependencies || {})
      .filter((name) => name.startsWith('@zeus/'));
    const devDependencies = Object.keys(manifest.devDependencies || {})
      .filter((name) => name.startsWith('@zeus/'));

    return {
      id: manifest.name.replace(/^@zeus\//, ''),
      name: manifest.name,
      version: manifest.version || '0.0.0',
      description: manifest.description || 'Sin descripcion publica.',
      role: manifest.zeus?.role || (manifest.private ? 'private' : 'package'),
      group: relativeRoot.split('/')[1] || 'package',
      wave: waveFor(manifest.name),
      category: categoryFor(manifest.name, manifest),
      dependencies,
      devDependencies,
      symbols: surface.symbols,
      subpaths: surface.subpaths,
      evidence: surface.evidence.map((file) => `${relativeRoot}/${file}`),
      manifestPath: `${relativeRoot}/package.json`
    };
  }));

  packageRecords.sort((left, right) => left.name.localeCompare(right.name));
  const knownNames = new Set(packageRecords.map((item) => item.name));
  const edges = packageRecords.flatMap((item) => item.dependencies
    .filter((dependency) => knownNames.has(dependency))
    .map((dependency) => ({
      from: item.id,
      to: dependency.replace(/^@zeus\//, ''),
      kind: 'dependency'
    })));

  return {
    generatedAt: new Date().toISOString(),
    waves: WAVE_DEFINITIONS,
    categories: CATEGORY_DEFINITIONS,
    packages: packageRecords,
    edges
  };
}