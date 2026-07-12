import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlayerSpec } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, 'openapi.yaml'), buildPlayerSpec());
console.log('Wrote player-ui spec/openapi.yaml');
