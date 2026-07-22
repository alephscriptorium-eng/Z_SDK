/**
 * Smoke · puerta externos.
 *
 * Peercard firmada (E02 seat) + embajador-kit → startpack-ciudad-v0.1.0.
 *
 *   node packages/mesh/operator-ui/fixtures/puerta-smoke.mjs
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entryUrl = pathToFileURL(path.join(__dirname, 'puerta-entry.mjs')).href;

const {
  DEFAULT_STARTPACK,
  emitirPuertaFirmada,
  entrarPorPuerta,
  consumirCredencial,
} = await import(entryUrl);

assert.equal(DEFAULT_STARTPACK.ref, 'startpack-ciudad-v0.1.0');

const { credencial, keys, startpackRef } = await emitirPuertaFirmada({
  roomId: 'CIUDAD_DEMO',
  displayName: 'amigo-a5',
});
assert.equal(startpackRef, 'startpack-ciudad-v0.1.0');
assert.equal(credencial.startpack.ref, DEFAULT_STARTPACK.ref);
assert.ok(credencial.peerCard.ssbId);
assert.ok(credencial.peerCard.seatSignature);
assert.equal(credencial.peerCard.ssbId, keys.ssbId);
assert.notEqual(credencial.signature?.alg, 'stub');
assert.equal(credencial.signature?.pending, false);

const bareCard = consumirCredencial(credencial.peerCard);
assert.equal(bareCard.ok, true);
assert.equal(bareCard.defaultStartpack, true);
assert.equal(bareCard.startpack.ref, 'startpack-ciudad-v0.1.0');

const entry = entrarPorPuerta(credencial);
assert.equal(entry.ok, true, entry.errors.join('; '));
assert.equal(entry.defaultStartpack, true);
assert.equal(entry.startpack.ref, 'startpack-ciudad-v0.1.0');
assert.equal(entry.seat.ok, true);
assert.equal(entry.ssbId, keys.ssbId);
assert.equal(entry.role, 'player');

const tampered = {
  ...credencial,
  peerCard: { ...credencial.peerCard, token: 'forged' },
};
const bad = entrarPorPuerta(tampered);
assert.equal(bad.ok, false);
assert.ok(bad.errors.some((e) => e.startsWith('seat:')));

console.log(
  'PUERTA_SMOKE_OK',
  JSON.stringify({
    startpack: entry.startpack.ref,
    defaultStartpack: entry.defaultStartpack,
    seatOk: entry.seat.ok,
    ssbIdPrefix: entry.ssbId.slice(0, 12),
    role: entry.role,
    kit: '@zeus/embajador-kit',
    firma: '@zeus/protocol/peer-card-seat',
  }),
);
