/**
 * Notes whether the Angular host is built. The ESM shell (serve.mjs) is the
 * always-on runtime; `ng build` (operator-ui twin) is opt-in when Angular
 * toolchain is installed in this package.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, '..', 'dist', 'public', 'browser', 'index.html');
if (fs.existsSync(dist)) {
  console.log('angular dist present:', dist);
} else {
  console.log(
    'angular dist absent — ESM shell (peer-list/media/chat) served by serve.mjs; sources under projects/'
  );
}
