#!/usr/bin/env node
/**
 * Generate browser IIFE from @zeus/presets-sdk shared/json-path.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkSource = path.resolve(__dirname, '../../presets-sdk/src/shared/json-path.mjs');
const outFile = path.resolve(__dirname, '../assets/js/json-path.js');

let body = fs.readFileSync(sdkSource, 'utf8');
body = body.replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '');
body = body.replace(/^export /gm, '');
body = body.replace(/^export \{ DEFAULT_ROOT \};?\s*/m, '');

const output = `/* GENERATED — do not edit. Run: npm run build:json-path -w @zeus/ui-kit */
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

fs.writeFileSync(outFile, output);
console.log('Wrote', outFile);
