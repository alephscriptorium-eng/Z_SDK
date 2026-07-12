/**
 * Generate mcp-resources.md catalog from RESOURCE_PAYLOADS.
 * Run: npm run spec:generate -w @zeus/http-contract
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMcpResourceCatalog } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'mcp-resources.md');

fs.writeFileSync(outPath, buildMcpResourceCatalog());
console.log(`Wrote ${outPath}`);
