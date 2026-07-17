/**
 * Local deck handler factory for @zeus/player-ui (DJ vista).
 * Inbound events drive local xstate + MCP; DJ intents go via dj-transport.
 */

import { reduceDeckInbound, applyActorEvents } from './session-inbound.mjs';

/**
 * @param {object} deps
 */
export function createSessionHandlers(deps) {
  const {
    actor,
    broadcastState,
    resolveAllDecks,
    handleDeckLoad,
    handleRegistroSelect,
    handleMicropostSelect,
    handleFirehoseCorpus,
    handleWikitextCache,
    handleWikitextPoll,
    handleDjIntent,
    listServers,
    snapshotFromActor,
    getIo
  } = deps;

  const io = () => getIo();

  const runSideEffects = async (reduction, ctx) => {
    const payload = reduction.sideEffectPayload;
    for (const effect of reduction.sideEffects) {
      switch (effect) {
        case 'deckLoad':
          await handleDeckLoad(io(), payload);
          break;
        case 'registroSelect':
          await handleRegistroSelect(io(), payload);
          break;
        case 'micropostSelect':
          await handleMicropostSelect(io(), payload);
          break;
        case 'firehoseCorpus':
          await handleFirehoseCorpus(io(), payload);
          break;
        case 'wikitextCache':
          await handleWikitextCache(ctx.socket, payload, ctx);
          break;
        case 'wikitextPoll':
          await handleWikitextPoll(io(), ctx.socket, payload);
          break;
        case 'resolveAllDecks':
          await resolveAllDecks(io());
          break;
        case 'djCache':
          handleDjIntent?.('cache', payload);
          break;
        case 'djCurate':
          handleDjIntent?.('curate', payload);
          break;
        case 'djMilestone':
          handleDjIntent?.('milestone', payload);
          break;
        default:
          break;
      }
    }
  };

  const dispatchInbound = (event, payload, ctx) => {
    const reduction = reduceDeckInbound(event, payload);
    if (reduction.actorEvents.length === 0 && reduction.sideEffects.length === 0) {
      return;
    }

    applyActorEvents(actor, reduction.actorEvents);

    if (reduction.sideEffects.length === 0) {
      if (reduction.broadcast) broadcastState(io());
      return;
    }

    const run = async () => {
      try {
        await runSideEffects(reduction, ctx);
        if (reduction.broadcast) broadcastState(io());
      } catch (err) {
        console.error(`${event} error:`, err);
      }
    };

    run();
  };

  /** @type {Record<string, (payload: unknown, ctx: object) => unknown>} */
  const handlers = Object.fromEntries(
    [
      'domain:deck:load',
      'domain:playhead:set',
      'registro:select',
      'micropost:select',
      'firehose:corpus',
      'wikitext:cache',
      'wikitext:poll',
      'sync:toggle',
      'transport:play',
      'transport:pause',
      'caso:set',
      'selection:cast',
      'dj:cache',
      'dj:curate',
      'dj:milestone'
    ].map((event) => [event, (payload, ctx) => dispatchInbound(event, payload ?? {}, ctx)])
  );

  const onConnection = (socket, server) => {
    server.unicast(socket, 'session:state', snapshotFromActor(actor));
    server.unicast(socket, 'dj:projection', {
      state: deps.getDjState?.() ?? null,
      ledger: deps.getDjLedger?.() ?? []
    });
    listServers()
      .then((servers) => server.unicast(socket, 'catalog:servers', servers))
      .catch((error) => {
        console.error('Discovery on connect failed:', error.message);
        server.unicast(socket, 'catalog:servers', []);
      });
  };

  return { handlers, onConnection, dispatchInbound };
}
