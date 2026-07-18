import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ZEUS_MCP,
  DEFAULT_ZEUS_UI_MESH,
  resolveZeusMcpPorts,
  resolveZeusUiPorts,
  resetZeusEnvLoader
} from '../src/env/index.mjs';

test('solve/pozo port slots — defaults in catalog', () => {
  assert.equal(DEFAULT_ZEUS_MCP.pozoPlayer.uno, 4131);
  assert.equal(DEFAULT_ZEUS_MCP.solvePlayer.uno, 4132);
  assert.equal(DEFAULT_ZEUS_UI_MESH.pozoView.port, 3025);
  assert.equal(DEFAULT_ZEUS_UI_MESH.solveView.port, 3026);
});

test('resolveZeus*Ports exposes solve/pozo keys', () => {
  const prev = {
    mcpPozo: process.env.ZEUS_MCP_POZO,
    mcpSolve: process.env.ZEUS_MCP_SOLVE,
    viewPozo: process.env.ZEUS_PORT_POZO_VIEW,
    viewSolve: process.env.ZEUS_PORT_SOLVE_VIEW
  };
  resetZeusEnvLoader();
  try {
    delete process.env.ZEUS_MCP_POZO;
    delete process.env.ZEUS_MCP_SOLVE;
    delete process.env.ZEUS_PORT_POZO_VIEW;
    delete process.env.ZEUS_PORT_SOLVE_VIEW;

    const mcp = resolveZeusMcpPorts();
    const ui = resolveZeusUiPorts();
    assert.equal(mcp.pozoPlayer.uno, 4131);
    assert.equal(mcp.solvePlayer.uno, 4132);
    assert.equal(ui.pozoView.port, 3025);
    assert.equal(ui.solveView.port, 3026);

    process.env.ZEUS_MCP_POZO = '5131';
    process.env.ZEUS_MCP_SOLVE = '5132';
    process.env.ZEUS_PORT_POZO_VIEW = '3125';
    process.env.ZEUS_PORT_SOLVE_VIEW = '3126';
    resetZeusEnvLoader();

    const mcpOver = resolveZeusMcpPorts();
    const uiOver = resolveZeusUiPorts();
    assert.equal(mcpOver.pozoPlayer.uno, 5131);
    assert.equal(mcpOver.solvePlayer.uno, 5132);
    assert.equal(uiOver.pozoView.port, 3125);
    assert.equal(uiOver.solveView.port, 3126);
  } finally {
    if (prev.mcpPozo == null) delete process.env.ZEUS_MCP_POZO;
    else process.env.ZEUS_MCP_POZO = prev.mcpPozo;
    if (prev.mcpSolve == null) delete process.env.ZEUS_MCP_SOLVE;
    else process.env.ZEUS_MCP_SOLVE = prev.mcpSolve;
    if (prev.viewPozo == null) delete process.env.ZEUS_PORT_POZO_VIEW;
    else process.env.ZEUS_PORT_POZO_VIEW = prev.viewPozo;
    if (prev.viewSolve == null) delete process.env.ZEUS_PORT_SOLVE_VIEW;
    else process.env.ZEUS_PORT_SOLVE_VIEW = prev.viewSolve;
    resetZeusEnvLoader();
  }
});
