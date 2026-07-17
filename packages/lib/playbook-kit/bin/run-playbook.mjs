#!/usr/bin/env node
/**
 * CLI: coherencia + (opcional) mitad MCP contra un MCP HTTP ya levantado.
 *
 *   node bin/run-playbook.mjs --casos path/to/CASOS.md --check
 *   node bin/run-playbook.mjs --casos … --ids C-01,C-03 --port 4121 --out acta.md
 *
 * Puerto vía --port o resolveZeusMcpPorts().argPlayer.uno (PRACTICAS §1.1).
 * No abre navegadores (ZEUS_OPEN_BROWSER opt-in ajeno a este bin).
 */

import fs from 'node:fs';
import { resolve } from 'node:path';
import { resolveZeusMcpPorts, resolveZeusHost } from '@zeus/presets-sdk/env';
import {
  checkPlaybookCoherence,
  createMcpHttpClient,
  runMcpCases
} from '../src/index.mjs';

function usage() {
  console.error(`Uso:
  zeus-playbook-run --casos <CASOS.md> --check [--expected-ids C-01,C-02]
  zeus-playbook-run --casos <CASOS.md> --ids C-01,C-03 [--port N] [--out acta.md]
`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = { check: false, ids: [], expectedIds: null, casos: null, port: null, outFile: null, game: 'juego' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') out.check = true;
    else if (a === '--casos') out.casos = argv[++i];
    else if (a === '--ids') out.ids = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--expected-ids') {
      out.expectedIds = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    }
    else if (a === '--port') out.port = Number(argv[++i]);
    else if (a === '--out') out.outFile = argv[++i];
    else if (a === '--game') out.game = argv[++i];
    else if (a === '--help' || a === '-h') usage();
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.casos) usage();

const markdown = fs.readFileSync(resolve(args.casos), 'utf8');

if (args.check || args.ids.length === 0) {
  const result = checkPlaybookCoherence(markdown, {
    expectedIds: args.expectedIds ?? undefined,
    toolPattern: /`[a-z][a-z0-9_]*\s*\{/
  });
  if (!result.ok) {
    console.error('coherencia: FAIL');
    for (const e of result.errors) console.error(' -', e);
    process.exit(1);
  }
  console.log(`coherencia: OK · ${result.ids.length} casos`);
  if (args.ids.length === 0) process.exit(0);
}

const port = args.port ?? resolveZeusMcpPorts().argPlayer.uno;
const host = resolveZeusHost();
const client = createMcpHttpClient({ host, port });
await client.waitConnected();
await client.initialize();

const { ok, results, acta } = await runMcpCases({
  markdown,
  casoIds: args.ids,
  callTool: (tool, toolArgs) => client.callTool(tool, toolArgs),
  game: args.game,
  comando: `zeus-playbook-run --casos ${args.casos} --ids ${args.ids.join(',')}`,
  commit: process.env.ZEUS_PLAYBOOK_COMMIT || '⏳'
});

if (args.outFile) {
  fs.writeFileSync(resolve(args.outFile), acta, 'utf8');
  console.log(`acta → ${resolve(args.outFile)}`);
} else {
  console.log(acta);
}

for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.id} (${r.role})`);
}
process.exit(ok ? 0 : 1);
