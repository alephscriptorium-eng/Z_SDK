/**
 * Write TypeScript declarations for @zeus/protocol (root + subpaths).
 * Run: npm run types:generate -w @zeus/protocol
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTypeDeclarations,
  buildSubpathTypeDeclarations
} from './types-build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'types');

fs.mkdirSync(outDir, { recursive: true });

const indexPath = path.join(outDir, 'index.d.ts');
fs.writeFileSync(indexPath, buildTypeDeclarations());
console.log(`Wrote ${indexPath}`);

const subpaths = buildSubpathTypeDeclarations();
for (const [name, body] of Object.entries(subpaths)) {
  const outPath = path.join(outDir, `${name}.d.ts`);
  fs.writeFileSync(outPath, body);
  console.log(`Wrote ${outPath}`);
}
