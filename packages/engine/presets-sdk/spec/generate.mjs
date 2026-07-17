import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMcpHttpSpec } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'mcp-http.openapi.yaml');

fs.writeFileSync(outPath, buildMcpHttpSpec());
console.log(`Wrote ${outPath}`);
