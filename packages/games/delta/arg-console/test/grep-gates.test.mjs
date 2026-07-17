/**
 * G-ARG grep gates (WP-15 parcial) — disciplina de capas delta.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../../..');

function collectSourceFiles(dir) {
  const abs = path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(path.relative(repoRoot, full)));
    else if (/\.(mjs|js)$/.test(entry.name) && !entry.name.endsWith('.test.mjs')) out.push(full);
  }
  return out;
}

const viewerRoots = [
  'packages/games/delta/arg-console/assets/js',
  'packages/games/delta/arg-console/src',
  'packages/mesh/cache-browser/assets/js',
  'packages/mesh/cache-browser/src',
  'packages/mesh/firehose-browser/assets/js',
  'packages/mesh/firehose-browser/src'
];

const forbiddenInViewers = [
  /@zeus\/arg-feeds/,
  /createArgDomainState/,
  /resolveRuntimeFeeds/
];

test('G-ARG.1 viewers no instancian dominio como autoridad', { timeout: 5000 }, () => {
  const offenders = [];
  for (const root of viewerRoots) {
    for (const file of collectSourceFiles(root)) {
      const rel = path.relative(repoRoot, file);
      if (rel.includes('grep-gates')) continue;
      const text = fs.readFileSync(file, 'utf8');
      if (/createArgDomainState/.test(text)) offenders.push(rel);
    }
  }
  assert.deepEqual(offenders, [], `G-ARG.1: ${offenders.join(', ')}`);
});

test('G-ARG.3 visores no importan arg-feeds ni mutación MCP', { timeout: 5000 }, () => {
  const offenders = [];
  for (const root of viewerRoots) {
    for (const file of collectSourceFiles(root)) {
      const rel = path.relative(repoRoot, file);
      if (rel.includes('grep-gates')) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const pattern of forbiddenInViewers) {
        if (pattern.test(text)) {
          offenders.push(`${rel} (${pattern})`);
          break;
        }
      }
    }
  }
  assert.deepEqual(offenders, [], `G-ARG.3: ${offenders.join(', ')}`);
});

test('G-ARG.3 arg-domain/src sin imports de red/MCP', { timeout: 5000 }, () => {
  const offenders = [];
  const forbidden = [
    /from\s+['"]@zeus\/presets-sdk/,
    /from\s+['"]@zeus\/arg-feeds/,
    /from\s+['"]@modelcontextprotocol/,
    /from\s+['"]node:http/,
    /from\s+['"]node:https/
  ];
  for (const file of collectSourceFiles('packages/games/delta/arg-domain/src')) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.test(text)) offenders.push(`${path.relative(repoRoot, file)} (${pattern})`);
    }
  }
  assert.deepEqual(offenders, [], `arg-domain debe ser browser-safe: ${offenders.join(', ')}`);
});
