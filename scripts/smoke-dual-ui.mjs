#!/usr/bin/env node
/**
 * Dual-UI smoke (SM-A/OP-C, docs/reference/decisions.md): health-check the dev
 * stack for "dos UIs, un contrato".
 *
 * Does not start servers — run VS Code **Start ▸ dual-ui-smoke** first, or:
 *   npm run start:lineas
 *   npm run start:socket-server
 *   npm run start:player
 *   npm run start:player-3d
 *   npm run start:operator-ui
 */

import { loadZeusEnv, DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk';
import { DEFAULT_ZEUS_MCP } from '@zeus/presets-sdk/env';

loadZeusEnv();

const host = process.env.ZEUS_HOST || 'localhost';
const ports = {
  scriptorium: Number(process.env.ZEUS_PORT_SCRIPTORIUM ?? DEFAULT_ZEUS_UI_MESH.scriptorium.port),
  player: Number(process.env.ZEUS_PORT_PLAYER ?? DEFAULT_ZEUS_UI_MESH.player.port),
  player3d: Number(process.env.ZEUS_PORT_PLAYER_3D ?? DEFAULT_ZEUS_UI_MESH.player3d.port),
  operator: Number(process.env.ZEUS_PORT_OPERATOR_UI ?? DEFAULT_ZEUS_UI_MESH.operator.port),
  lineaEspana: Number(process.env.ZEUS_MCP_LINEA_ESPAN ?? DEFAULT_ZEUS_MCP.lineas.espana),
  lineaWp: Number(process.env.ZEUS_MCP_LINEA_WP ?? DEFAULT_ZEUS_MCP.lineas.wpHistoria),
};

/** @type {{ id: string, url: string, validate: (body: any) => boolean, required?: boolean }[]} */
const targets = [
  {
    id: 'socket-server',
    url: `http://${host}:${ports.scriptorium}/health`,
    validate: (b) => b?.ok === true,
  },
  {
    id: 'player-ui (room master)',
    url: `http://${host}:${ports.player}/health`,
    validate: (b) => b?.status === 'ok' && b?.service === 'player-ui',
  },
  {
    id: 'player-3d-ui',
    url: `http://${host}:${ports.player3d}/health`,
    validate: (b) => b?.status === 'ok',
  },
  {
    id: 'operator-ui',
    url: `http://${host}:${ports.operator}/health`,
    validate: (b) => b?.ok === true && b?.service === 'operator-ui',
  },
  {
    id: 'linea-espana (MCP)',
    url: `http://${host}:${ports.lineaEspana}/mcp/health`,
    validate: (b) => b?.status === 'ok',
    required: false,
  },
  {
    id: 'linea-wp-historia (MCP)',
    url: `http://${host}:${ports.lineaWp}/mcp/health`,
    validate: (b) => b?.status === 'ok',
    required: false,
  },
];

let failed = 0;
let lineasOk = 0;

console.log('Dual-UI smoke — checking health endpoints…\n');

for (const target of targets) {
  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      if (target.required === false) {
        console.warn(`○ ${target.id}: HTTP ${res.status} (optional — start lineas for full cast smoke)`);
        continue;
      }
      console.error(`✗ ${target.id}: HTTP ${res.status} (${target.url})`);
      failed++;
      continue;
    }
    const body = await res.json();
    if (!target.validate(body)) {
      if (target.required === false) {
        console.warn(`○ ${target.id}: unexpected body (optional)`, body);
        continue;
      }
      console.error(`✗ ${target.id}: unexpected body`, body);
      failed++;
      continue;
    }
    console.log(`✓ ${target.id} — ${target.url}`);
    if (target.id.includes('linea')) lineasOk++;
  } catch (err) {
    if (target.required === false) {
      console.warn(`○ ${target.id}: ${err.message} (optional — cue B needs lineas)`);
      continue;
    }
    console.error(`✗ ${target.id}: ${err.message} (${target.url})`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} required check(s) failed. Start the stack with VS Code "Start ▸ dual-ui-smoke".`);
  process.exit(1);
}

console.log('\nDual-UI smoke OK — open :3018 and :3020.');
if (lineasOk === 2) {
  console.log('Lineas up — Cue B → Send One should register selections.last in both HUDs.');
} else {
  console.log('Tip: start lineas for deck resolve + selection:cast (Cue B → wait → Send One).');
}
process.exit(0);
