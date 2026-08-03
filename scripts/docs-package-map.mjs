#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildPackageCatalog } from '../packages/editor/package-map/src/catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const packagesRoot = path.join(root, 'packages');
const sourceDir = path.join(root, 'packages', 'editor', 'package-map', 'public');
const outDir = path.join(root, 'docs', 'public', 'package-map');
const assets = ['index.html', 'styles.css', 'atlas.js'];
const forbiddenEvidence = /(^|\/)(plan|sincronia|VOLUMES|examples|exampes|data|\.changeset|docs|e2e|test)(\/|$)/;

function validateCatalog(catalog) {
  if (!Array.isArray(catalog.packages) || catalog.packages.length === 0) {
    throw new Error('Package map catalog has no packages');
  }
  if (!Array.isArray(catalog.waves) || catalog.waves.length !== 3) {
    throw new Error(`Package map requires 3 waves; received ${catalog.waves?.length ?? 0}`);
  }

  const categoryIds = new Set(Object.keys(catalog.categories || {}));
  const invalidCategories = catalog.packages
    .filter((item) => !categoryIds.has(item.category))
    .map((item) => item.name);
  if (invalidCategories.length > 0) {
    throw new Error(`Packages without a valid category: ${invalidCategories.join(', ')}`);
  }

  const unsafeEvidence = catalog.packages.flatMap((item) => (
    [item.manifestPath, ...item.evidence].filter((file) => forbiddenEvidence.test(file))
  ));
  if (unsafeEvidence.length > 0) {
    throw new Error(`Forbidden package-map evidence: ${unsafeEvidence.join(', ')}`);
  }
}

async function validatePortableAssets() {
  const html = await fs.readFile(path.join(sourceDir, 'index.html'), 'utf8');
  const client = await fs.readFile(path.join(sourceDir, 'atlas.js'), 'utf8');
  for (const reference of ['./styles.css', './atlas.js']) {
    if (!html.includes(reference)) {
      throw new Error(`Package map index must use relative asset ${reference}`);
    }
  }
  if (!client.includes("fetch('./catalog.json')")) {
    throw new Error('Package map client must load ./catalog.json');
  }
}

await validatePortableAssets();
const catalog = await buildPackageCatalog(packagesRoot);
validateCatalog(catalog);

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });
await Promise.all(assets.map((asset) => (
  fs.copyFile(path.join(sourceDir, asset), path.join(outDir, asset))
)));
await fs.writeFile(
  path.join(outDir, 'catalog.json'),
  `${JSON.stringify(catalog, null, 2)}\n`,
  'utf8'
);

console.log(
  `Package map generated: ${catalog.packages.length} packages, `
  + `${catalog.edges.length} edges -> ${pathToFileURL(outDir).href}`
);