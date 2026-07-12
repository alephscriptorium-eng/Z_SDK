/**
 * Session socket handler factory for @zeus/player-ui.
 */

import {
  reduceSessionInbound,
  applyActorEvents,
  applyDomainOps
} from '@zeus/session-domain';

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
    listServers,
    snapshotFromActor,
    domainState,
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
        default:
          break;
      }
    }
  };

  const dispatchInbound = (event, payload, ctx) => {
    const reduction = reduceSessionInbound(event, payload);
    if (
      reduction.actorEvents.length === 0 &&
      reduction.domainOps.length === 0 &&
      reduction.sideEffects.length === 0
    ) {
      return;
    }

    applyActorEvents(actor, reduction.actorEvents);
    applyDomainOps(domainState, reduction.domainOps);

    if (reduction.sideEffects.length === 0) {
      if (reduction.broadcast) {
        broadcastState(io());
      }
      return;
    }

    const run = async () => {
      try {
        await runSideEffects(reduction, ctx);
        if (reduction.broadcast) {
          broadcastState(io());
        }
      } catch (err) {
        console.error(`${event} error:`, err);
      }
    };

    run();
  };

  const handlers = {
    'domain:deck:load': (payload, ctx) => dispatchInbound('domain:deck:load', payload, ctx),
    'domain:playhead:set': (payload, ctx) => dispatchInbound('domain:playhead:set', payload, ctx),
    'registro:select': (payload, ctx) => dispatchInbound('registro:select', payload, ctx),
    'micropost:select': (payload, ctx) => dispatchInbound('micropost:select', payload, ctx),
    'firehose:corpus': (payload, ctx) => dispatchInbound('firehose:corpus', payload, ctx),
    'wikitext:cache': (payload, ctx) => dispatchInbound('wikitext:cache', payload, ctx),
    'wikitext:poll': (payload, ctx) => dispatchInbound('wikitext:poll', payload, ctx),
    'sync:toggle': (_payload, ctx) => dispatchInbound('sync:toggle', {}, ctx),
    'transport:play': (_payload, ctx) => dispatchInbound('transport:play', {}, ctx),
    'transport:pause': (_payload, ctx) => dispatchInbound('transport:pause', {}, ctx),
    'caso:set': (payload, ctx) => dispatchInbound('caso:set', payload, ctx),
    'selection:cast': (payload, ctx) => dispatchInbound('selection:cast', payload, ctx),
    'game:intent': (payload, ctx) => dispatchInbound('game:intent', payload, ctx),
    'material:pin': (payload, ctx) => dispatchInbound('material:pin', payload, ctx),
    'material:unpin': (payload, ctx) => dispatchInbound('material:unpin', payload, ctx),
    'node:ontology:set': (payload, ctx) => dispatchInbound('node:ontology:set', payload, ctx)
  };

  const onConnection = (socket, server) => {
    server.unicast(socket, 'session:state', snapshotFromActor(actor, domainState));
    listServers()
      .then((servers) => server.unicast(socket, 'catalog:servers', servers))
      .catch((error) => {
        console.error('Discovery on connect failed:', error.message);
        server.unicast(socket, 'catalog:servers', []);
      });
  };

  return { handlers, onConnection, dispatchInbound };
}
