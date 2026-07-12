import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { buildFocusExport } from '@zeus/presets-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');
const generator = path.resolve(__dirname, '../scripts/generate-json-path-browser.mjs');
const assetPath = path.resolve(__dirname, '../assets/js/json-path.js');
const sdkSource = path.resolve(__dirname, '../../presets-sdk/src/shared/json-path.mjs');

function generateInMemory() {
  let body = fs.readFileSync(sdkSource, 'utf8');
  body = body.replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '');
  body = body.replace(/^export /gm, '');
  body = body.replace(/^export \{ DEFAULT_ROOT \};?\s*/m, '');
  return `/* GENERATED — do not edit. Run: npm run build:json-path -w @zeus/ui-kit */
(function (global) {
  'use strict';
${body}
  global.ZeusJsonPath = {
    DEFAULT_ROOT,
    isRootPath,
    parsePath,
    formatPath,
    getAtPath,
    getParentPath,
    listChildren,
    getSiblingPaths,
    inspectAtPath,
    buildFocusExport,
    previewValue,
    typeOfValue
  };
})(typeof window !== 'undefined' ? window : globalThis);
`;
}

function loadBrowserJsonPath(script) {
  const sandbox = { global: {}, window: {} };
  sandbox.global = sandbox.window;
  vm.runInNewContext(script, sandbox, { filename: 'json-path.js' });
  return sandbox.global.ZeusJsonPath;
}

const normalizeEol = (s) => s.replace(/\r\n/g, '\n');

test('generated json-path.js matches in-memory generator output', () => {
  const expected = normalizeEol(generateInMemory());
  const committed = normalizeEol(fs.readFileSync(assetPath, 'utf8'));
  assert.equal(committed, expected, 'Run: npm run build:json-path -w @zeus/ui-kit');
  assert.ok(fs.existsSync(generator));
});

test('browser buildFocusExport matches SDK', () => {
  const script = fs.readFileSync(assetPath, 'utf8');
  const browser = loadBrowserJsonPath(script);
  const fixture = { decks: { A: { id: 1 }, B: { id: 2 } } };
  const pathArg = 'decks.B';

  const sdkExport = buildFocusExport(fixture, pathArg, { maxChildren: 3 });
  const browserExport = browser.buildFocusExport(fixture, pathArg, { maxChildren: 3 });

  delete sdkExport.exportedAt;
  delete browserExport.exportedAt;
  assert.equal(JSON.stringify(browserExport), JSON.stringify(sdkExport));
});

test('browser json-path honors custom rootLabel', () => {
  const script = fs.readFileSync(assetPath, 'utf8');
  const browser = loadBrowserJsonPath(script);
  assert.equal(browser.parsePath('root', 'root').length, 0);
  assert.equal(JSON.stringify(browser.parsePath('child', 'root')), JSON.stringify(['child']));
  assert.equal(browser.isRootPath('snapshot', 'snapshot'), true);
});
