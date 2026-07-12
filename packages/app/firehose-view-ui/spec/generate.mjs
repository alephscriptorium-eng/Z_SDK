import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFirehoseSpec } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, 'openapi.yaml'), buildFirehoseSpec());
console.log('Wrote firehose-view-ui spec/openapi.yaml');
