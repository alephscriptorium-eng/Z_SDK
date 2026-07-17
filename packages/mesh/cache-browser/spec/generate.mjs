import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildViewSpec } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, 'openapi.yaml'), buildViewSpec());
console.log('Wrote view-ui spec/openapi.yaml');
