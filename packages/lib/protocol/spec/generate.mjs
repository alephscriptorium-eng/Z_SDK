/**
 * Generate AsyncAPI from @zeus/protocol contract.
 * Run: npm run spec:generate -w @zeus/protocol
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAsyncApiSpec } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'asyncapi.yaml');

fs.writeFileSync(outPath, buildAsyncApiSpec());
console.log(`Wrote ${outPath}`);
