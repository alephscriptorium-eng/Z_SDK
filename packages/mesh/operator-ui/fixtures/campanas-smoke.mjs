/**
 * Smoke · campanas (parte → clases → schedule + mute).
 *
 * Uso (desde worktree / raíz zeus-sdk):
 *   node packages/mesh/operator-ui/fixtures/campanas-smoke.mjs
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const operatorUiRoot = path.resolve(__dirname, '..');
const zeusRoot = path.resolve(operatorUiRoot, '../../..');

const parteKitUrl = pathToFileURL(
  path.join(zeusRoot, 'packages/engine/parte-kit/src/index.mjs'),
).href;
const bridgeUrl = pathToFileURL(
  path.join(zeusRoot, 'packages/mesh/operator-bridge/src/index.mjs'),
).href;
const audioUrl = pathToFileURL(path.join(__dirname, 'campanas-audio.mjs')).href;

const {
  redactarParte,
  estadoVacio,
  campanasDesdeParte,
} = await import(parteKitUrl);
const { campanasFromLedger, createOperatorBridge } = await import(bridgeUrl);
const {
  scheduleCampanas,
  readCampanasMuted,
  writeCampanasMuted,
  CAMPANA_HZ,
} = await import(audioUrl);

const { parte } = redactarParte(estadoVacio(), [
  { type: 'tick', tick: 7 },
  { type: 'barrio', id: 'plaza', estado: 'vivo', gentesActivas: 3 },
  { type: 'barrio', id: 'zigurat', estado: 'roto', gentesActivas: 0 },
  { type: 'barrio', id: 'rio', estado: 'latente', gentesActivas: 0 },
]);

const fromParte = campanasDesdeParte(parte);
assert.deepEqual(
  fromParte.map((e) => e.clase),
  ['despertar', 'degradar', 'roto'],
  'parte must yield three campana classes',
);

const entry = { entryKind: 'parte', detail: { parte } };
const fromLedger = campanasFromLedger(entry);
assert.deepEqual(
  fromLedger.map((e) => e.clase),
  ['despertar', 'degradar', 'roto'],
);

const b = createOperatorBridge();
const [msg] = b.onLedger(entry);
assert.match(msg.content, /parte tick=7 titulares=/);

const plan = scheduleCampanas(fromLedger, false);
assert.equal(plan.length, 3);
assert.equal(plan[0].hz, CAMPANA_HZ.despertar);
assert.equal(plan[1].hz, CAMPANA_HZ.degradar);
assert.equal(plan[2].hz, CAMPANA_HZ.roto);
assert.deepEqual(scheduleCampanas(fromLedger, true), [], 'mute → empty schedule');

/** @type {Record<string, string>} */
const mem = {};
const store = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v);
  },
};
assert.equal(readCampanasMuted(store), false);
writeCampanasMuted(store, true);
assert.equal(readCampanasMuted(store), true);
writeCampanasMuted(store, false);
assert.equal(readCampanasMuted(store), false);

console.log(
  'CAMPANAS_SMOKE_OK',
  JSON.stringify({
    clases: fromParte.map((e) => e.clase),
    hz: plan.map((p) => p.hz),
    muteClears: true,
    ledgerContent: msg.content,
  }),
);
