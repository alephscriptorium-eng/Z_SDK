/**
 * Write TypeScript declarations for @zeus/protocol.
 * Run: npm run types:generate -w @zeus/protocol
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTypeDeclarations } from './types-build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'types');
const outPath = path.join(outDir, 'index.d.ts');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, buildTypeDeclarations());
console.log(`Wrote ${outPath}`);
