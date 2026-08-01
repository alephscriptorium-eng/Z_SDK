/**
 * WP-U251 · defecto (6) — el candado SSB, visible para TypeScript.
 *
 * El sensor es `test/fixtures/ts-candado-ssb/consumidor.ts`, chequeado con
 * `tsc --noEmit`. No hay `npm install` de por medio: el fixture resuelve
 * `@zeus/webrtc-signaling` con un `paths` relativo a `types/index.d.ts`.
 *
 * `tsc` sale del `node_modules` del repo (pinado en el lockfile). Si no
 * está, el test FALLA — no se salta: un sensor que se apaga solo no vigila.
 * Nunca `npx`: el binario no está declarado en el package.json del repo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(here, 'fixtures', 'ts-candado-ssb');

function resolveTsc() {
  const require = createRequire(import.meta.url);
  try {
    const tsc = require.resolve('typescript/lib/tsc.js');
    if (fs.existsSync(tsc)) return tsc;
  } catch {
    /* cae al assert de abajo */
  }
  return null;
}

test('D6: el candado SSB es visible en tiempo de compilación (tsc --noEmit)', () => {
  const tsc = resolveTsc();
  assert.ok(
    tsc,
    'typescript no resoluble desde node_modules — ejecuta `npm ci` en la raíz del repo'
  );

  const run = spawnSync(process.execPath, [tsc, '-p', fixture], {
    encoding: 'utf8',
    cwd: fixture
  });
  const salida = `${run.stdout ?? ''}\n${run.stderr ?? ''}`;

  assert.equal(
    run.status,
    0,
    `tsc --noEmit falló sobre el consumidor TS del candado SSB:\n${salida}`
  );
  assert.doesNotMatch(salida, /error TS/, salida);
});
