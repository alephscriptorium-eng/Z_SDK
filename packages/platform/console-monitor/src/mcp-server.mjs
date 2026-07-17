/**
 * MCP server factory for @zeus/console-monitor over Streamable HTTP.
 */

import { z } from 'zod';
import { promptMessages, resolveMcpApprovalToken, mcpApprovalGateLine } from '@zeus/presets-sdk';
import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import { inspectSnapshotAt } from './snapshot-inspect.mjs';
import { DECK_IDS } from './deck-slots.mjs';
import * as logic from './logic.mjs';
import * as logicSession from './logic-session.mjs';

const DeckId = z.enum(DECK_IDS);

export const SERVER_NAME = 'console-monitor';
export const SERVER_VERSION = '0.1.0';

function buildPlayerCardExamples(config) {
  return {
    approvalToken: resolveMcpApprovalToken(),
    goldenPath: {
      prompt: 'report-session',
      args: {},
      resolveUri: 'player://snapshot'
    },
    sampleResolve: [
      { uri: 'player://snapshot', expect: 'object with health and session' },
      { uri: 'player://health', expect: 'object with socket and rest status' },
      { uri: 'player://events/16', expect: 'object with events array' },
      { uri: 'player://aleph/anchors', expect: 'object with grid cells' }
    ],
    prompts: [
      { name: 'report-session', args: {} },
      { name: 'tail-events', args: { limit: '16' } },
      { name: 'fetch-anchors', args: {} },
      { name: 'recovery-recipe', args: {} },
      { name: 'self-check', args: {} }
    ],
    mutationPrompts: ['transport-control']
  };
}

function buildPlayerInfo(config, stateStore) {
  return {
    name: SERVER_NAME,
    version: SERVER_VERSION,
    playerUiUrl: config.baseUrl,
    sessionUrl: config.sessionUrl,
    mcpPort: config.mcpPort,
    mcpUrl: `http://${config.mcpHost}:${config.mcpPort}/mcp`,
    debugServer: config.debugServer,
    refreshHz: config.refreshHz,
    restPollMs: config.restPollMs,
    maxEvents: config.maxEvents,
    defaultCaso: config.defaultCaso,
    monitorUptimeMs: stateStore.getMonitorUptime()
  };
}

function getResourceRegistry(stateStore, config, _poller) {
  return [
    {
      name: 'player-info',
      uri: 'player://info',
      title: 'Player debug monitor info',
      mimeType: 'application/json',
      description: 'Monitor metadata: player-ui URLs, poll intervals, MCP port, and uptime.',
      read: () => buildPlayerInfo(config, stateStore)
    },
    {
      name: 'player-snapshot',
      uri: 'player://snapshot',
      title: 'Player monitor snapshot',
      mimeType: 'application/json',
      description:
        'Canonical agent-facing composite: session, decks, health, infrastructure, servers, and typed events.',
      read: () => stateStore.getSnapshot()
    },
    {
      name: 'player-session',
      uri: 'player://session',
      title: 'Player session state',
      mimeType: 'application/json',
      description: 'Full session:state payload from player-ui socket (phase, playhead, decks).',
      read: () => stateStore.getSession()
    },
    {
      name: 'player-health',
      uri: 'player://health',
      title: 'Player monitor health',
      mimeType: 'application/json',
      description: 'Socket connection status plus REST health poll timestamps.',
      read: () => stateStore.getHealth()
    },
    {
      name: 'player-events',
      uri: 'player://events',
      title: 'Player monitor events',
      mimeType: 'application/json',
      description: 'Ring buffer of typed socket/emit events (newest first).',
      read: () => ({ events: stateStore.getEvents(), count: stateStore.getEvents().length })
    },
    {
      name: 'player-servers',
      uri: 'player://servers',
      title: 'Player server catalog',
      mimeType: 'application/json',
      description: 'Merged socket catalog:servers and REST /api/servers.',
      read: () => stateStore.getServers()
    },
    {
      name: 'player-aleph-anchors',
      uri: 'player://aleph/anchors',
      title: 'ALEPH anchors grid',
      mimeType: 'application/json',
      description: 'REST /api/aleph/anchors?linea= — Wave A grid and cache stats per línea.',
      read: () => stateStore.getAnchors()
    },
    {
      name: 'player-aleph-medicion',
      uri: 'player://aleph/medicion',
      title: 'ALEPH medicion (default caso)',
      mimeType: 'application/json',
      description: `REST medicion for default caso (${config.defaultCaso}).`,
      read: () => stateStore.getMedicion(config.defaultCaso)
    }
  ];
}

function getTemplateRegistry(stateStore, config, poller) {
  return [
    {
      name: 'player-deck',
      uriTemplate: 'player://deck/{deckId}',
      title: 'Deck state',
      mimeType: 'application/json',
      description: 'Deck A, B, or C with resolved payload from current session.',
      read: (variables) => {
        const deckId = variables.deckId?.toUpperCase();
        if (!DECK_IDS.includes(deckId)) {
          return { error: `Invalid deckId "${variables.deckId}": use A, B, or C` };
        }
        const deck = stateStore.getDeck(deckId);
        if (!deck) {
          return { deckId, phase: 'empty', resolved: null };
        }
        return { deckId, ...deck };
      }
    },
    {
      name: 'player-aleph-medicion-caso',
      uriTemplate: 'player://aleph/medicion/{casoId}',
      title: 'ALEPH medicion by caso',
      mimeType: 'application/json',
      description: 'REST /api/aleph/medicion/:casoId — fetches on demand if not cached.',
      read: async (variables) => poller.fetchMedicion(variables.casoId)
    },
    {
      name: 'player-events-limit',
      uriTemplate: 'player://events/{limit}',
      title: 'Recent events',
      mimeType: 'application/json',
      description: 'Last N typed events from the monitor ring buffer.',
      read: (variables) => {
        const limit = Number(variables.limit);
        const events = stateStore.getEvents(limit);
        return { limit: Number.isFinite(limit) ? limit : config.maxEvents, events, count: events.length };
      }
    },
    {
      name: 'player-snapshot-at',
      uriTemplate: 'player://snapshot/at/{path}',
      title: 'Snapshot subtree',
      mimeType: 'application/json',
      description:
        'Focus navigation into player://snapshot — returns value, children, parent, and sibling paths.',
      read: (variables) => inspectSnapshotAt(stateStore, variables.path || 'session')
    }
  ];
}

function getPromptRegistry() {
  return [
    {
      name: 'explore-monitor',
      title: 'Explore player debug monitor',
      description:
        'Onboarding: read player://info and server://card, exercise golden path, verify transport gate.',
      argsSchema: {},
      render: () => {
        const steps = [
          'Explore the console-monitor MCP monitor capabilities.',
          '',
          'Steps:',
          '1. Read server://card.examples — single source of truth (goldenPath, sampleResolve, approvalToken).',
          '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
          '2. Read player://info for monitor URLs and poll intervals.',
          '   Bridge fallback: getResourceByUri({ uri: "player://info" }).',
          '3. List resource templates with getResourceTemplates.',
          '4. Golden path: getPrompt(examples.goldenPath.prompt) → resolve player://snapshot; confirm health + session.',
          '   Error: if health.socket.connected is false, report offline — do not invent deck state.',
          `5. Mutation prompt transport-control: render; verify gate requires exact token \`${resolveMcpApprovalToken()}\` — do NOT play/pause.`,
          '6. Run getPrompt("self-check") for full validation including sampleResolve.',
          '7. Brief report: snapshot OK?, transport gate OK?, monitor health.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'report-session',
      title: 'Report Tablero session',
      description: 'Workflow: poll player://snapshot and summarize phase, year, decks for operator alignment.',
      argsSchema: {},
      render: () => {
        const steps = [
          'Produce a Tablero ALEPH session report for operator alignment.',
          '',
          'Steps:',
          '1. Read player://snapshot (canonical composite).',
          '   Bridge fallback: getResourceByUri({ uri: "player://snapshot" }).',
          '2. Extract: session.phase, playhead.year, playhead.playing, sync flag.',
          '3. For each deck A/B/C: phase, serverName, resolved summary (nodo or firehose corpus/selection).',
          '4. Note REST health and any degraded decks.',
          '5. Write a concise summary the operator can confirm against the browser Tablero.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'diagnose-deck',
      title: 'Diagnose deck issues',
      description: 'Inspect player://deck/{deckId} for degraded state, resolve errors, and wikitext status.',
      argsSchema: {
        deckId: DeckId.describe('Deck id: A, B, or C.')
      },
      render: ({ deckId }) => {
        const uri = `player://deck/${deckId}`;
        const steps = [
          `Diagnose deck ${deckId} on the Tablero monitor.`,
          '',
          'Steps:',
          `1. Read ${uri} for full deck state and resolved payload.`,
          `   Bridge fallback: getResourceByUri({ uri: "${uri}" }).`,
          '2. If phase is degraded, check player://servers for server connectivity.',
          '3. Read player://health for socket + REST status.',
          '4. Inspect recent player://events/16 for deck:resolved and wikitext errors.',
          '5. Report: phase, serverName, nodo or firehose corpus/selection, registros/posts count, wikitext cached/miss (A/B), last resolve timing.',
          '6. Suggest fixes (reconnect server, reload deck, cache wikitext via wikitext_cache or cache_anchor tool; for C use deck_load, micropost_select, or firehose_corpus).'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'sync-with-operator',
      title: 'Sync with human operator',
      description: 'Poll player://snapshot each turn before commenting on Tablero state.',
      argsSchema: {},
      render: () => {
        const steps = [
          'Stay aligned with the human operator running the Tablero in the browser.',
          '',
          'Workflow (repeat every turn before stating Tablero facts):',
          '1. Read player://snapshot OR call session_report / refresh_snapshot first.',
          '2. Compare your summary to what the operator sees: year, play/pause, deck phases.',
          '3. If snapshot.health.socket.connected is false, say the monitor is offline — do not invent deck state.',
          '4. When proposing playhead moves, prefer goto_parte / goto_year and confirm via session_report.',
          '5. Prefer short factual updates; ask the operator to confirm ambiguous states.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'pinch-session',
      title: 'Pinch session with operator',
      description:
        'Collaborative DJ workflow: session_report, bootstrap if needed, goto_parte/anchor/year, confirm without Playwright.',
      argsSchema: {},
      render: () => {
        const gateBootstrap = mcpApprovalGateLine('bootstrap_decks');
        const gateCacheAnchor = mcpApprovalGateLine('cache_anchor');
        const gateWikitext = mcpApprovalGateLine('ensure_wikitext');
        const steps = [
          'Pinch a Tablero ALEPH session together with the human operator — no Playwright.',
          '',
          'Workflow:',
          '1. Call session_report (or read player://snapshot) before stating any Tablero facts.',
          `2. If decks A/B/C are empty: present plan; ${gateBootstrap}; then bootstrap_decks.`,
          '3. To navigate: goto_parte (I–IV), goto_anchor (P01–P24), or goto_year.',
          '4. To change crossover caso/VU meters: select_caso.',
          '5. After each action, call session_report again and compare with what the operator sees.',
          '6. Use wait_for_session when you need to block until year/nodo/phase matches.',
          `7. Missing Wave A anchors: ${gateCacheAnchor}; then cache_anchor (nodoId).`,
          `8. Other wikitext gaps on deck B: ${gateWikitext}; then ensure_wikitext.`,
          '9. Low-level socket tools (set_playhead, deck_load, …) remain available when needed.',
          '10. Never invent state if health.socket.connected is false.',
          '11. If degraded before mutating, run recovery-recipe first.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'explore-medicion',
      title: 'console-monitor medicion exploration',
      description: 'Read AEO caso medicion: ejes, buffers MCS, timeline.',
      argsSchema: {
        casoId: z
          .string()
          .optional()
          .describe('Caso id, e.g. aeo-p24-linea. Defaults to active caso from snapshot.')
      },
      render: ({ casoId }) => {
        const casoTarget = casoId ?? 'active caso from player://snapshot';
        const medicionUri = casoId
          ? `player://aleph/medicion/${casoId}`
          : 'player://aleph/medicion/{casoId}';
        const steps = [
          `Explore AEO medicion for caso ${casoTarget} on the Tablero monitor.`,
          '',
          'Steps:',
          '1. Read player://snapshot and note session.activeCaso.',
          '   Bridge fallback: getResourceByUri({ uri: "player://snapshot" }).',
          '2. Read player://aleph/medicion for the default caso medicion payload.',
          '   Bridge fallback: getResourceByUri({ uri: "player://aleph/medicion" }).',
          `3. Read ${medicionUri} for caso-specific medicion (on demand if not cached).`,
          `   Bridge fallback: getResourceByUri({ uri: "${medicionUri}" }).`,
          '4. Summarize: caso_foco, latest intensidad/lectura, ejes (capacidad, pluralidad, legitimidad, continuidad, vector).',
          '5. List active MCS buffers and timeline progression if present.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'inspect-snapshot',
      title: 'console-monitor snapshot inspection',
      description:
        'Focused navigation into player://snapshot subtree via session_inspect or template URI.',
      argsSchema: {
        path: z
          .string()
          .optional()
          .describe('Dot path, e.g. infrastructure.anchors.grid.summary. Defaults to session.')
      },
      render: ({ path }) => {
        const targetPath = path ?? 'session';
        const steps = [
          `Inspect player://snapshot at path "${targetPath}" — cheaper than reading the full snapshot.`,
          '',
          'Steps:',
          `1. Call session_inspect with { path: "${targetPath}" }.`,
          '   Returns value, children, parent, and sibling paths for navigation.',
          `2. Alternatively read player://snapshot/at/${targetPath}.`,
          `   Bridge fallback: getResourceByUri({ uri: "player://snapshot/at/${targetPath}" }).`,
          '3. Drill into children using returned childPath values.',
          '4. Use parent/siblings to navigate back or sideways without re-fetching the full snapshot.',
          '5. If health.socket.connected is false, abort — do not invent snapshot values.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'transport-control',
      title: 'console-monitor transport control',
      description:
        'Workflow to play/pause playhead transport and toggle deck sync — requires user approval before mutating.',
      argsSchema: {},
      render: () => {
        const gateLine = mcpApprovalGateLine('transport_play, transport_pause, sync_toggle');
        const steps = [
          'Control Tablero playhead transport (play / pause / sync toggle) with human approval.',
          '',
          'Steps:',
          '1. Read player://snapshot OR call session_report — never state transport facts without reading.',
          '   Bridge fallback: getResourceByUri({ uri: "player://snapshot" }).',
          '2. If snapshot.health.socket.connected is false, abort and report monitor offline.',
          '3. Present the concrete command (transport_play, transport_pause, or sync_toggle) and expected effect.',
          `4. ${gateLine}`,
          `5. Only after token \`${resolveMcpApprovalToken()}\`: call the chosen transport tool.`,
          '6. Call session_report again and report the delta: playhead.playing, sync flag.',
          '7. Prefer goto_parte / goto_year for navigation; transport tools only affect play/pause/sync.',
          '8. If health is degraded, run recovery-recipe before proposing transport mutations.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'tail-events',
      title: 'console-monitor event tail',
      description: 'Read recent typed events from the monitor ring buffer via player://events/{limit}.',
      argsSchema: {
        limit: z
          .string()
          .optional()
          .describe('Max events to return (e.g. 16). Defaults to 16 if omitted.')
      },
      render: ({ limit }) => {
        const lim = limit ?? '16';
        const uri = `player://events/${lim}`;
        const steps = [
          `Read the last ${lim} typed monitor events from the Tablero ring buffer.`,
          '',
          'Steps:',
          `1. Read ${uri}.`,
          `   Bridge fallback: getResourceByUri({ uri: "${uri}" }).`,
          '2. Alternatively call session_inspect on player://events if embedded in snapshot.',
          '3. Summarize newest-first: type, detail, timestamp; flag deck:resolved / wikitext errors.',
          '4. Example: getPrompt("tail-events", { limit: "16" }).',
          '5. Error: non-numeric limit may clamp or error; empty buffer returns events: [].',
          '6. If health.socket.connected is false, events may be stale — note monitor offline.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'fetch-anchors',
      title: 'console-monitor Wave A anchors',
      description: 'Read the ALEPH anchor grid (cached/missing) from player://aleph/anchors.',
      argsSchema: {
        linea: z
          .string()
          .optional()
          .describe('Linea id filter (default from snapshot/info, usually espana).')
      },
      render: ({ linea }) => {
        const lineaNote = linea ? `linea=${linea}` : 'default linea from snapshot (usually espana)';
        const steps = [
          `Fetch Wave A anchor grid for Tablero (${lineaNote}).`,
          '',
          'Steps:',
          '1. Read player://aleph/anchors for grid cells, cacheStats, and summary (cached/missing).',
          '   Bridge fallback: getResourceByUri({ uri: "player://aleph/anchors" }).',
          '2. Cross-check player://snapshot infrastructure.anchors if already loaded.',
          '3. Report: total anchors, cached vs missing counts, sample P01–P24 statuses.',
          '4. Complements pinch-session/cache_anchor — this prompt is read-only.',
          '5. Error: if REST poll failed, anchors may be partial; check player://health.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'recovery-recipe',
      title: 'console-monitor recovery recipe',
      description:
        'Non-destructive recovery playbook before any mutation: refresh, health, reload deck, re-report.',
      argsSchema: {},
      render: () => {
        const steps = [
          'Recover Tablero monitor alignment without mutating playhead or transport (read-only + safe reload).',
          '',
          'Steps:',
          '1. Call refresh_snapshot (or read player://snapshot) — establish baseline.',
          '2. Read player://health — check socket.connected and rest.status.',
          '   Bridge fallback: getResourceByUri({ uri: "player://health" }).',
          '3. If socket disconnected: report offline; stop — do not invent deck state.',
          '4. Read player://servers for MCP catalog connectivity.',
          '5. If a deck is degraded or empty: deck_load with same serverName/presetId (reload, not a new config).',
          '   This step changes deck binding only — still no playhead/transport mutation.',
          '6. Call session_report and compare with operator browser.',
          '7. If still degraded, run diagnose-deck for the affected deckId.',
          `8. Only after recovery succeeds, consider mutation prompts (pinch-session, transport-control) with token ${resolveMcpApprovalToken()}.`,
          '9. Never call transport_play, cache_anchor, or ensure_wikitext from this recipe.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'self-check',
      title: 'console-monitor prompt self-check',
      description:
        'Validate all monitor prompts: render, URI/tool refs, and approval gate on transport-control.',
      argsSchema: {},
      render: () => {
        const steps = [
          'Run a self-check of all console-monitor MCP prompts (read-only; touches data, zero mutation).',
          '',
          'Steps:',
          '1. Call getPrompts to enumerate prompts.',
          '2. Read server://card.examples — goldenPath, prompts[], sampleResolve, approvalToken.',
          '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
          '3. For each examples.prompts entry: getPrompt(name, args); assert render references URI/tool.',
          '4. **Touch the data**: resolve each examples.sampleResolve URI; assert valid JSON per expect hint.',
          '5. Golden path: player://snapshot must include health and session blocks.',
          '6. Mutation prompt transport-control: render; assert gate requires exact token `' + resolveMcpApprovalToken() + '`.',
          '   Do NOT call transport_play/pause/sync_toggle.',
          '7. recovery-recipe: confirm all steps are non-destructive (no transport/cache mutations).',
          '8. Report table: prompt | render OK? | sample URI OK? | gate? | notes.'
        ];
        return promptMessages(steps.join('\n'));
      }
    }
  ];
}

export function createServer(stateStore, config, substrate) {
  return createStandardMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    port: config.mcpPort,
    registry: getResourceRegistry(stateStore, config, substrate.poller),
    templateRegistry: getTemplateRegistry(stateStore, config, substrate.poller),
    promptRegistry: getPromptRegistry(),
    buildMcp: (server) => {
      logic.buildMcp(server, {
        client: substrate.client,
        poller: substrate.poller,
        stateStore
      });
      logicSession.buildMcp(server, {
        client: substrate.client,
        poller: substrate.poller,
        stateStore
      });
    },
    logLabel: SERVER_NAME,
    extraHealth: () => ({ playerUiUrl: config.baseUrl }),
    getCardExamples: () => buildPlayerCardExamples(config),
    extraRoutes: (app) => {
      app.get('/snapshot', (_req, res) => {
        res.json(stateStore.getSnapshot());
      });

      app.get('/snapshot/at', (req, res) => {
        const path = req.query.path || 'session';
        res.json(inspectSnapshotAt(stateStore, String(path)));
      });
    }
  });
}
