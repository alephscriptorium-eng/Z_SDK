/**
 * Fixture determinista: 50 deltas sobre un censo mock-shaped (Z01/Z02).
 * Sin imports de packs de juego.
 */

import { estadoDesdeCenso } from '../src/from-mock.mjs';

/** Slice del shape mockdatas-ciudad / startpack (ids displayName). */
export const CENSO_FIXTURE = {
  schemaVersion: 1,
  barrios: {
    VsCodeExtension: { estado: 'vivo', distrito: 'Zigurat' },
    MCPGallery: { estado: 'vivo', distrito: 'Runtime-MCP' },
    BlocklyEditor: { estado: 'latente', distrito: 'Editores' },
    WiringEditor: { estado: 'vivo', distrito: 'Editores' },
    WorkflowEditor: { estado: 'muerto', distrito: 'Editores' },
    StreamDesktop: { estado: 'muerto', distrito: 'Red-stream' },
    AgentLoreSDK: { estado: 'vivo', distrito: 'Lore-voz' },
    PrologEditor: { estado: 'latente', distrito: 'Editores' },
    BotHubSDK: { estado: 'vivo', distrito: 'Red-stream' },
    ScriptoriumVps: { estado: 'roto', distrito: 'Infra-UI' }
  }
};

/**
 * @returns {{ estado0: import('../src/tipos.mjs').ParteEstado, deltas: import('../src/tipos.mjs').ParteDelta[] }}
 */
export function fixture50() {
  const estado0 = estadoDesdeCenso(CENSO_FIXTURE, { tick: 100 });
  const ids = Object.keys(estado0.barrios).sort();
  /** @type {import('../src/tipos.mjs').ParteDelta[]} */
  const deltas = [{ type: 'tick', tick: 150 }];

  const estadosCycle = ['vivo', 'latente', 'roto', 'muerto', 'vivo'];
  for (let i = 0; i < 49; i++) {
    const id = ids[i % ids.length];
    const kind = i % 3;
    if (kind === 0) {
      deltas.push({
        type: 'barrio',
        id,
        estado: estadosCycle[i % estadosCycle.length],
        gentesActivas: i % 5
      });
    } else if (kind === 1) {
      deltas.push({
        type: 'barrio',
        id,
        deltaGentes: i % 2 === 0 ? 1 : -1
      });
    } else {
      deltas.push({
        type: 'work',
        barrioId: id,
        texto: `obra-${i}-${id}`
      });
    }
  }

  if (deltas.length !== 50) {
    throw new Error(`fixture50 expected 50 deltas, got ${deltas.length}`);
  }
  return { estado0, deltas };
}
