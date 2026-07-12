/**
 * Smoke test for console-monitor MCP monitor.
 * Starts in-process (headless), verifies health, snapshot, tools, and prompts.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { connectMcp, toolResultJson } from '@zeus/test-utils';
import { resolveZeusUiPorts, resolveMcpApprovalToken } from '@zeus/presets-sdk';
import { startAll } from '../src/start.mjs';

const TEST_MCP_PORT = 13014;

const SOCKET_TOOLS = [
  'set_playhead',
  'deck_load',
  'micropost_select',
  'firehose_corpus',
  'refresh_snapshot',
  'session_inspect'
];

const SESSION_TOOLS = [
  'bootstrap_decks',
  'goto_parte',
  'goto_anchor',
  'goto_year',
  'ensure_wikitext',
  'select_caso',
  'wait_for_session',
  'session_report'
];

async function connect(port) {
  return connectMcp(port);
}

async function isPlayerUiUp() {
  const { host, port } = resolveZeusUiPorts().player;
  try {
    const res = await fetch(`http://${host}:${port}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

let handle = null;
const clients = [];

test('console-monitor smoke', async (t) => {
  t.after(async () => {
    await Promise.allSettled(clients.map((c) => c.close()));
    await handle?.close?.();
  });

  handle = await startAll({ headless: true, mcpPort: TEST_MCP_PORT });
  console.log(`Started console-monitor MCP on port ${TEST_MCP_PORT}`);

  const healthRes = await fetch(`http://localhost:${TEST_MCP_PORT}/mcp/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, 'ok');
  assert.equal(health.server, 'console-monitor');
  assert.deepEqual(health.capabilities, { tools: 26, resources: 9, resourceTemplates: 4, prompts: 12 });
  console.log('Health check OK:', JSON.stringify(health.capabilities));

  const mcp = await connect(TEST_MCP_PORT);
  clients.push(mcp);

  const info = await mcp.readResource({ uri: 'player://info' });
  const infoJson = JSON.parse(info.contents[0].text);
  assert.equal(infoJson.name, 'console-monitor');
  assert.equal(infoJson.mcpPort, TEST_MCP_PORT);
  console.log('Resource OK: player://info');

  const snapshot = toolResultJson(await mcp.callTool({ name: 'getResourceByUri', arguments: { uri: 'player://snapshot' } }));
  assert.equal(snapshot.schemaVersion, '1.0');
  assert.ok(snapshot.monitor, 'snapshot should have monitor');
  assert.ok(snapshot.health, 'snapshot should have health');
  assert.ok(snapshot.infrastructure, 'snapshot should have infrastructure');
  assert.ok(Array.isArray(snapshot.events), 'snapshot should have events array');
  console.log('Resource OK: player://snapshot');

  const playhead = toolResultJson(await mcp.callTool({ name: 'set_playhead', arguments: { year: 1300 } }));
  assert.equal(playhead.year, 1300);
  assert.equal(typeof playhead.ok, 'boolean');
  console.log(`Tool OK: set_playhead year=1300 ok=${playhead.ok}`);

  const refreshed = toolResultJson(await mcp.callTool({ name: 'refresh_snapshot', arguments: {} }));
  assert.equal(refreshed.schemaVersion, '1.0');
  console.log('Tool OK: refresh_snapshot');

  const report = toolResultJson(await mcp.callTool({ name: 'session_report', arguments: {} }));
  assert.equal(report.action, 'session_report');
  assert.ok(report.report, 'session_report should include report');
  console.log('Tool OK: session_report');

  const tools = await mcp.listTools();
  const toolNames = tools.tools.map((t) => t.name);
  for (const name of SESSION_TOOLS) {
    assert.ok(toolNames.includes(name), `missing session tool: ${name}`);
  }
  console.log(`Session tools OK: ${SESSION_TOOLS.length} registered`);

  for (const name of SOCKET_TOOLS) {
    assert.ok(toolNames.includes(name), `missing socket tool: ${name}`);
  }
  console.log(`Socket tools OK: ${SOCKET_TOOLS.length} registered (incl. firehose C)`);

  const deckA = toolResultJson(
    await mcp.callTool({ name: 'getResourceByUri', arguments: { uri: 'player://deck/A' } })
  );
  assert.equal(deckA.deckId, 'A');
  assert.ok('phase' in deckA);
  console.log('Template OK: player://deck/A');

  const deckC = toolResultJson(
    await mcp.callTool({ name: 'getResourceByUri', arguments: { uri: 'player://deck/C' } })
  );
  assert.equal(deckC.deckId, 'C');
  assert.ok('phase' in deckC);
  console.log('Template OK: player://deck/C');

  const snapshotAt = toolResultJson(
    await mcp.callTool({
      name: 'getResourceByUri',
      arguments: { uri: 'player://snapshot/at/session' }
    })
  );
  assert.equal(snapshotAt.path, 'session');
  assert.ok(Array.isArray(snapshotAt.children));
  console.log('Template OK: player://snapshot/at/session');

  const restSnap = await fetch(`http://localhost:${TEST_MCP_PORT}/snapshot`);
  assert.equal(restSnap.status, 200);
  const restSnapJson = await restSnap.json();
  assert.equal(restSnapJson.schemaVersion, '1.0');
  console.log('REST OK: GET /snapshot');

  const restAt = await fetch(`http://localhost:${TEST_MCP_PORT}/snapshot/at?path=session`);
  assert.equal(restAt.status, 200);
  const restAtJson = await restAt.json();
  assert.ok(Array.isArray(restAtJson.children));
  console.log('REST OK: GET /snapshot/at');

  const inspectTool = toolResultJson(
    await mcp.callTool({ name: 'session_inspect', arguments: { path: 'session' } })
  );
  assert.equal(inspectTool.path, 'session');
  console.log('Tool OK: session_inspect');

  const prompts = await mcp.listPrompts();
  assert.equal(prompts.prompts.length, 12);
  const promptNames = prompts.prompts.map((p) => p.name).sort();
  assert.deepEqual(promptNames, [
    'diagnose-deck',
    'explore-medicion',
    'explore-monitor',
    'fetch-anchors',
    'inspect-snapshot',
    'pinch-session',
    'recovery-recipe',
    'report-session',
    'self-check',
    'sync-with-operator',
    'tail-events',
    'transport-control'
  ]);
  console.log('Prompt catalog OK: 12 prompts');

  const card = toolResultJson(
    await mcp.callTool({ name: 'getResourceByUri', arguments: { uri: 'server://card' } })
  );
  assert.equal(card.examples?.approvalToken, resolveMcpApprovalToken());
  assert.ok(card.examples?.goldenPath?.resolveUri === 'player://snapshot');
  assert.ok(Array.isArray(card.examples?.sampleResolve));
  assert.deepEqual(card.examples?.mutationPrompts, ['transport-control']);
  console.log('Server card OK: examples block');

  const recoveryPrompt = toolResultJson(
    await mcp.callTool({ name: 'getPrompt', arguments: { name: 'recovery-recipe' } })
  );
  assert.match(recoveryPrompt.text, /refresh_snapshot/);
  assert.match(recoveryPrompt.text, /player:\/\/health/);
  assert.match(recoveryPrompt.text, /Never call transport_play/);
  console.log('Prompt OK: recovery-recipe');

  const tailPrompt = toolResultJson(
    await mcp.callTool({ name: 'getPrompt', arguments: { name: 'tail-events', arguments: { limit: '8' } } })
  );
  assert.match(tailPrompt.text, /player:\/\/events\/8/);
  console.log('Prompt OK: tail-events');

  const transportPrompt = toolResultJson(
    await mcp.callTool({ name: 'getPrompt', arguments: { name: 'transport-control' } })
  );
  assert.match(transportPrompt.text, new RegExp(`\`${resolveMcpApprovalToken()}\``));
  console.log('Prompt gate OK: transport-control');

  const selfCheckPrompt = toolResultJson(
    await mcp.callTool({ name: 'getPrompt', arguments: { name: 'self-check' } })
  );
  assert.match(selfCheckPrompt.text, /sampleResolve/);
  assert.match(selfCheckPrompt.text, /transport-control/);
  console.log('Prompt OK: self-check');

  const bridgePrompts = toolResultJson(await mcp.callTool({ name: 'getPrompts', arguments: {} }));
  assert.equal(bridgePrompts.prompts.length, 12);
  console.log('Prompt bridge OK: getPrompts');

  if (await isPlayerUiUp()) {
    const gotoParte = toolResultJson(
      await mcp.callTool({ name: 'goto_parte', arguments: { parteId: 'IV', timeoutMs: 10000 } })
    );
    assert.equal(gotoParte.parteId, 'IV');
    assert.equal(gotoParte.year, 1978);
    console.log(`Integration OK: goto_parte IV ok=${gotoParte.ok} year=${gotoParte.year}`);
  } else {
    const { port: playerPort } = resolveZeusUiPorts().player;
    console.log(`Integration SKIP: player-ui :${playerPort} not running`);
  }

  console.log('SMOKE TEST PASSED');
});
