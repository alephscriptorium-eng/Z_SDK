import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEditorSpec } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, 'openapi.yaml'), buildEditorSpec());
console.log('Wrote editor-ui spec/openapi.yaml');
