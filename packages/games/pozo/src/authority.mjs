/**
 * pozo — autoridad: instancia @zeus/authority-kit con dominio pozo.
 */

import { startAuthority, PROTOCOL_EVENTS } from '@zeus/authority-kit';
import { createPozoDomainState } from './domain.mjs';
import { AUTHORITY_USER, GAME_ID } from './contract.mjs';
import { resolvePozoEndpoints } from './endpoints.mjs';
import { loadZeusEnv } from '@zeus/presets-sdk/env';

loadZeusEnv();

const endpoints = resolvePozoEndpoints();
const USER = process.env.ZEUS_SCRIPTORIUM_USER || AUTHORITY_USER;
const ROOM = endpoints.room;
const TICK_MS = Number(process.env.POZO_TICK_MS || 200);
const HEARTBEAT_MS = Number(process.env.POZO_STATE_HEARTBEAT_MS || 5000);

const state = createPozoDomainState();

const domain = {
  applyIntent: (payload) => state.applyIntent(payload),
  tick: (deltaSec, now) => state.tick(deltaSec, now),
  drainOutbox: () => state.drainOutbox(),
  contentRev: () => state.contentRev(),
  snapshot: (reason, opts) => state.snapshot(reason, opts)
};

console.log(
  `\n🫧 pozo authority · game=${GAME_ID} · user=${USER} · room=${ROOM} · tick=${TICK_MS}ms\n`
);

await startAuthority({
  user: USER,
  room: ROOM,
  game: GAME_ID,
  tickMs: TICK_MS,
  heartbeatMs: HEARTBEAT_MS,
  domain,
  events: PROTOCOL_EVENTS,
  join: {
    type: 'PozoAuthority',
    features: ['pozo-0.1', 'state', 'track', 'ledger']
  },
  snapshotBudget: true,
  onLedger: (entry) => {
    console.log(
      `[${USER}] 📜 ${entry.kind ?? entry.entryKind}`,
      JSON.stringify(entry.detail ?? { label: entry.label, dropId: entry.dropId })
    );
  }
});
