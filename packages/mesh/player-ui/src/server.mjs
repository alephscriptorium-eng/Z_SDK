#!/usr/bin/env node

/**
 * @zeus/player-ui server — DJ vista on the game room (ARG_DELTA).
 * Local xstate + MCP decks; shared state/ledger via @zeus/authority-kit.
 */

import path from 'node:path';
import { createRequire } from 'node:module';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import { browserAssetsDir as roomClientAssetsDir } from '@zeus/room-client-browser';
import { mountSpecRoutes, mountSwaggerUi } from '@zeus/presets-sdk/docs';
import { createActor } from 'xstate';
import {
  ServerRegistry,
  PresetStore,
  syncDiscoveredServers,
  resolveDiscoverySources,
  createCatalogService,
  applyPresetFilter,
  normalizeSatRel,
  resolveUiMesh,
  readVolumeFile,
  TRIAGE_MANIFEST_PATH
} from '@zeus/presets-sdk';
import { FIREHOSE_SERVER_NAME } from './deck-kit.mjs';
import { assetsDir as uiKitAssetsDir, createThemeRoutes } from '@zeus/ui-kit';

import { getConfig, resolveDataDir, packageDir } from './config.mjs';
import { ThemeHandler } from './theme-handler.mjs';
import { sessionMachine, snapshotFromActor } from './session-machine.mjs';
import { deckView } from './views/deck_view.mjs';
import { settingsView } from './views/settings_view.mjs';
import {
  getAlephConfig,
  loadMedicion,
  loadLineaRegistry,
  loadManifestForLinea,
  buildAnchorGrid,
  buildTopology,
  resolveLineaServers,
  resolveTopologyServerNames
} from './aleph-bridge.mjs';
import {
  isFirehoseDeck,
  resolveFirehoseDeck
} from './firehose-bridge.mjs';
import { createTtlCache } from './ttl-cache.mjs';
import { createSessionHandlers } from './socket-handlers.mjs';
import { createAlephRoutes } from './aleph-routes.mjs';
import { buildPlayerSpec } from '../spec/build.mjs';
import { createDebugRoutes } from './debug-routes.mjs';
import { createDjTransport, resolveDjRoom } from './dj-transport.mjs';
import { attachLocalDeckIo } from './local-deck-io.mjs';
import { makeError, ERROR_CODES } from './deck-errors.mjs';
import { buildViewLinksResponse } from './link-recipes/view-link-recipes.mjs';
import { buildFirehoseLinksResponse } from './link-recipes/firehose-link-recipes.mjs';

const require = createRequire(import.meta.url);

function socketIoDistDir() {
  return `${path.dirname(require.resolve('socket.io-client/package.json'))}${path.sep}dist`;
}

function parseResourceJson(result) {
  const text = result?.contents?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function parseToolJson(content) {
  const text = content?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function parseEmbeddedJson(text) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  if (start === -1) return null;
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return null;
  }
}

function buildWikitextResult(parsed, oldid) {
  const oid = parsed?.oldid ?? oldid;
  if (!parsed) {
    return { cached: false, oldid: oid, error: 'empty response' };
  }
  if (parsed.error) {
    return {
      cached: false,
      oldid: oid,
      error: parsed.error,
      hint: parsed.hint,
      stats: parsed.stats,
      action: parsed.action
    };
  }
  return {
    cached: parsed.cached !== false,
    oldid: oid,
    bytes: parsed.wikitext_length ?? (parsed.wikitext?.length ?? 0),
    preview: typeof parsed.wikitext === 'string'
      ? parsed.wikitext.slice(0, 200)
      : undefined
  };
}

/**
 * Programmatic bootstrap for e2e and CLI.
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {string} [options.dataDir]
 * @param {string[]} [options.discoveryUrls]
 * @param {number} [options.discoveryCacheTtlMs]
 */
export async function createPlayerServer(options = {}) {
  const config = getConfig();
  const port = options.port ?? config.server?.port ?? 3013;
  const host = options.host ?? config.server?.host ?? 'localhost';
  const dataDir = options.dataDir ?? resolveDataDir(config);
  const themeHandler = new ThemeHandler();

  const store = new PresetStore({ dataDir });
  const registry = new ServerRegistry();
  const catalog = createCatalogService({ registry });
  const discoverySources = resolveDiscoverySources({
    dataDir,
    localDiscovery: options.discoveryUrls
      ? {
          ...config.discovery,
          urls: options.discoveryUrls,
          exclusiveUrls: options.discoveryExclusive !== false,
          timeoutMs: options.discoveryTimeoutMs ?? 5000
        }
      : config.discovery
  });
  const actor = createActor(sessionMachine);
  actor.start();
  const alephConfig = getAlephConfig(config);
  actor.send({ type: 'CASO_SET', casoId: alephConfig.defaultCaso || 'aeo-p24-linea' });

  const debugEnabled = config.debug === true;
  const debugStats = {
    startedAt: Date.now(),
    eventCounts: {},
    lastResolveMs: { A: null, B: null, C: null },
    resolveCount: { A: 0, B: 0, C: 0 }
  };

  const bumpDebugEvent = (event) => {
    if (!debugEnabled) return;
    debugStats.eventCounts[event] = (debugStats.eventCounts[event] || 0) + 1;
  };

  const transportBox = { current: /** @type {Awaited<ReturnType<typeof createDjTransport>> | null} */ (null) };
  const localIoBox = { current: /** @type {ReturnType<typeof attachLocalDeckIo> | null} */ (null) };

  const broadcastState = () => {
    bumpDebugEvent('state');
    localIoBox.current?.broadcastState(snapshotFromActor(actor));
  };

  const emitDeckResolved = (_io, payload) => {
    localIoBox.current?.emitDeckResolved(payload);
  };

  const emitSessionEvent = (_io, event, payload) => {
    localIoBox.current?.io?.emit(event, payload);
  };

  async function runDiscovery() {
    return syncDiscoveredServers(registry, discoverySources, {
      catalog,
      pruneStale: true,
      registerMode: 'strict'
    });
  }

  const serversCache = createTtlCache(
    async () => {
      await runDiscovery();
      return catalog.getAllServers();
    },
    {
      ttlMs:
        options.discoveryCacheTtlMs ??
        config.discovery?.cacheTtlMs ??
        3000
    }
  );

  async function listServers() {
    return serversCache.get();
  }

  async function fetchWikitext(extractor, oldid) {
    if (oldid == null) return null;
    const oid = Number(oldid);
    try {
      const wtRes = await extractor.readResource(`linea://wikitext/${oid}`);
      return buildWikitextResult(parseResourceJson(wtRes), oid);
    } catch (error) {
      const embedded = parseEmbeddedJson(error.message);
      if (embedded?.error) {
        return buildWikitextResult(embedded, oid);
      }
      return { cached: false, oldid: oid, error: error.message };
    }
  }

  function deckAllowsTool(deck, entry, toolName) {
    const tools = deck.filtered?.tools || entry?.tools || [];
    return tools.some((t) => t.name === toolName);
  }

  async function getDeckExtractor(deckId) {
    const deck = actor.getSnapshot().context.decks[deckId];
    if (!deck?.serverName) return { error: 'deck not loaded' };
    const entry = await catalog.getServerEntry(deck.serverName);
    if (!entry || entry.isConnected === false) {
      return { error: 'disconnected', deck };
    }
    const extractor = registry.extractors.get(deck.serverName);
    if (!extractor) return { error: 'no extractor', deck };
    return { deck, entry, extractor };
  }

  async function resolveDeck(deckId, year, selectedOldid = null, io = null, firehoseOpts = {}) {
    const deck = actor.getSnapshot().context.decks[deckId];
    if (!deck || !deck.serverName || deck.phase === 'empty' || deck.phase === 'loading') {
      return null;
    }

    const resolveStarted = debugEnabled ? performance.now() : 0;

    if (isFirehoseDeck(deck)) {
      const prev = deck.resolved;
      const corpus =
        firehoseOpts.corpus ??
        prev?.corpus ??
        config.deck?.firehoseDefaultCorpus ??
        'candidate';
      const path =
        firehoseOpts.path !== undefined
          ? firehoseOpts.path
          : (prev?.path ?? '');
      const selectedFilePath =
        firehoseOpts.selectedFilePath !== undefined
          ? firehoseOpts.selectedFilePath
          : (prev?.selected?.filePath ?? null);

      const resolved = await resolveFirehoseDeck({
        corpus,
        path,
        selectedFilePath
      });
      actor.send({ type: 'DECK_RESOLVED', deckId, phase: 'playing', resolved });

      const payload = { deckId, ...resolved };
      if (debugEnabled && io) {
        const ms = performance.now() - resolveStarted;
        debugStats.lastResolveMs[deckId] = ms;
        debugStats.resolveCount[deckId] = (debugStats.resolveCount[deckId] || 0) + 1;
        bumpDebugEvent('deck:resolved');
        emitSessionEvent(io, 'debug:resolve-timing', { deckId, corpus, ms });
      }
      return payload;
    }

    const entry = await catalog.getServerEntry(deck.serverName);
    if (!entry || entry.isConnected === false) {
      actor.send({ type: 'DECK_DEGRADED', deckId });
      return { deckId, year, error: 'disconnected' };
    }

    const extractor = registry.extractors.get(deck.serverName);
    if (!extractor) {
      actor.send({ type: 'DECK_DEGRADED', deckId });
      return { deckId, year, error: 'no extractor' };
    }

    const templates = (deck.filtered?.resourceTemplates || entry.resourceTemplates || [])
      .map(t => t.name);

    let nodo = null;
    let oldid = null;
    let registrosPayload = null;
    let selected = null;
    let wikitext = null;

    if (templates.includes('linea-nodo')) {
      try {
        const nodoRes = await extractor.readResource(`linea://nodo/${year}`);
        nodo = parseResourceJson(nodoRes);
      } catch (error) {
        nodo = { error: error.message };
      }
    }

    if (templates.includes('linea-registros-year')) {
      try {
        const regRes = await extractor.readResource(`linea://registros/year/${year}`);
        const parsed = parseResourceJson(regRes);
        if (parsed?.error) {
          registrosPayload = { error: parsed.error };
        } else {
          registrosPayload = {
            anchor: parsed.anchor ?? null,
            sections: parsed.sections ?? [],
            items: parsed.registros ?? [],
            total: parsed.total ?? 0,
            cached_count: parsed.cached_count ?? 0
          };
          if (!nodo?.nodo && parsed.nodo) {
            nodo = { nodo: parsed.nodo };
          }
        }
      } catch (error) {
        registrosPayload = { error: error.message };
      }
    }

    if (templates.includes('linea-oldid')) {
      try {
        const oldidRes = await extractor.readResource(`linea://oldid/${year}`);
        oldid = parseResourceJson(oldidRes);
      } catch (error) {
        oldid = { error: error.message };
      }
    }

    const pickOldid = selectedOldid ?? oldid?.oldid ?? registrosPayload?.anchor?.oldid ?? null;

    if (templates.includes('linea-wikitext') && pickOldid != null) {
      wikitext = await fetchWikitext(extractor, pickOldid);
      if (selectedOldid != null) {
        const match = registrosPayload?.items?.find(r => r.oldid === Number(selectedOldid));
        selected = match ?? { oldid: Number(selectedOldid) };
      }
    } else if (templates.includes('linea-wikitext') && oldid?.oldid != null && !oldid.error) {
      wikitext = await fetchWikitext(extractor, oldid.oldid);
    }

    const resolved = { year, nodo, oldid, registros: registrosPayload, selected, wikitext };
    actor.send({ type: 'DECK_RESOLVED', deckId, phase: 'playing', resolved });

    if (debugEnabled && io) {
      const ms = performance.now() - resolveStarted;
      debugStats.lastResolveMs[deckId] = ms;
      debugStats.resolveCount[deckId] = (debugStats.resolveCount[deckId] || 0) + 1;
      bumpDebugEvent('deck:resolved');
      emitSessionEvent(io, 'debug:resolve-timing', { deckId, year, ms });
    }

    return { deckId, ...resolved };
  }

  async function handleFirehoseCorpus(io, { deckId = 'C', corpus, path = '' }) {
    const resolved = await resolveDeck(deckId, null, null, io, {
      corpus: corpus || config.deck?.firehoseDefaultCorpus || 'candidate',
      path,
      selectedFilePath: null
    });
    if (resolved) {
      emitDeckResolved(io, resolved);
      broadcastState(io);
    }
    return resolved;
  }

  async function handleMicropostSelect(io, { deckId = 'C', filePath, corpus, path }) {
    const deck = actor.getSnapshot().context.decks[deckId];
    const prev = deck?.resolved;
    const resolved = await resolveDeck(deckId, null, null, io, {
      corpus: corpus ?? prev?.corpus,
      path: path !== undefined ? path : prev?.path,
      selectedFilePath: filePath ?? null
    });
    if (resolved) {
      emitDeckResolved(io, resolved);
      broadcastState(io);
    }
    return resolved;
  }

  async function handleRegistroSelect(io, { deckId = 'B', oldid, registro_id: _registro_id }) {
    const year = actor.getSnapshot().context.playhead.year;
    const resolved = await resolveDeck(deckId, year, oldid, io);
    if (resolved) {
      emitDeckResolved(io, resolved);
      broadcastState(io);
    }
    return resolved;
  }

  async function handleWikitextCache(socket, { deckId = 'B', oldid }, ctx = {}) {
    const ack = ctx?.ack;
    const emitResult = (result) => {
      socket.emit('wikitext:cache-result', result);
    };

    const deckCtx = await getDeckExtractor(deckId);
    if (deckCtx.error) {
      const result = { ok: false, error: deckCtx.error };
      emitResult(result);
      if (ack) ack(result);
      return result;
    }
    const { deck, entry, extractor } = deckCtx;
    if (!deckAllowsTool(deck, entry, 'cache_wikitext')) {
      const result = {
        ok: false,
        error: 'preset does not include cache_wikitext tool'
      };
      emitResult(result);
      if (ack) ack(result);
      return result;
    }

    try {
      const content = await extractor.callTool('cache_wikitext', { oldid: Number(oldid) });
      const parsed = parseToolJson(content);
      const initial = {
        ok: !parsed?.error,
        oldid: Number(oldid),
        status: 'caching',
        ...parsed
      };
      emitResult(initial);
      if (!initial.ok) {
        if (ack) ack(initial);
        return initial;
      }

      const wikitext = await waitForWikitextCached(io, socket, { deckId, oldid: Number(oldid) });
      const final = {
        ok: true,
        oldid: Number(oldid),
        cached: true,
        bytes: wikitext.bytes,
        preview: wikitext.preview
      };
      emitResult(final);
      if (ack) ack(final);
      return final;
    } catch (error) {
      const result = { ok: false, oldid: Number(oldid), error: error.message };
      emitResult(result);
      if (ack) ack(result);
      return result;
    }
  }

  const wikitextWaitByOldid = new Map();
  const WIKITEXT_WAIT_MS = 30000;
  const WIKITEXT_POLL_MS = 2000;

  async function waitForWikitextCached(io, socket, { deckId = 'B', oldid }) {
    const key = Number(oldid);
    if (wikitextWaitByOldid.has(key)) return wikitextWaitByOldid.get(key);

    const waitPromise = (async () => {
      const started = Date.now();
      while (Date.now() - started < WIKITEXT_WAIT_MS) {
        const deckCtx = await getDeckExtractor(deckId);
        if (deckCtx.error) {
          const err = makeError({
            event: 'wikitext:cache',
            code: ERROR_CODES.HANDLER_ERROR,
            message: String(deckCtx.error)
          });
          localIoBox.current?.io?.emit('deck:error', err);
          throw new Error(deckCtx.error);
        }
        const wikitext = await fetchWikitext(deckCtx.extractor, key);
        if (wikitext?.cached) {
          await handleRegistroSelect(io, { deckId, oldid: key });
          return wikitext;
        }
        await new Promise((r) => setTimeout(r, WIKITEXT_POLL_MS));
      }
      const err = makeError({
        event: 'wikitext:cache',
        code: ERROR_CODES.HANDLER_ERROR,
        message: 'wikitext cache wait timed out',
        details: { oldid: key, timeoutMs: WIKITEXT_WAIT_MS }
      });
      localIoBox.current?.io?.emit('deck:error', err);
      throw new Error(err.message);
    })().finally(() => {
      wikitextWaitByOldid.delete(key);
    });

    wikitextWaitByOldid.set(key, waitPromise);
    return waitPromise;
  }

  async function handleWikitextPoll(io, socket, { deckId = 'B', oldid }) {
    const ctx = await getDeckExtractor(deckId);
    if (ctx.error) {
      socket.emit('wikitext:poll-result', { cached: false, error: ctx.error });
      return;
    }
    const wikitext = await fetchWikitext(ctx.extractor, oldid);
    if (wikitext?.cached) {
      await handleRegistroSelect(io, { deckId, oldid: Number(oldid) });
      socket.emit('wikitext:poll-result', { cached: true, oldid: Number(oldid) });
    } else {
      socket.emit('wikitext:poll-result', {
        cached: false,
        oldid: Number(oldid),
        error: wikitext?.error,
        action: wikitext?.action
      });
    }
  }

  async function resolveAllDecks(io) {
    const { playhead, decks } = actor.getSnapshot().context;
    const year = playhead.year;
    const results = [];
    for (const deckId of Object.keys(decks)) {
      const deck = decks[deckId];
      if (deck.phase === 'empty' || deck.phase === 'loading') continue;

      const entry = await catalog.getServerEntry(deck.serverName);
      if (!entry || entry.isConnected === false) {
        if (isFirehoseDeck(deck)) {
          const resolved = await resolveDeck(deckId, year, null, io);
          if (resolved) {
            results.push(resolved);
            emitDeckResolved(io, resolved);
          }
          continue;
        }
        actor.send({ type: 'DECK_DEGRADED', deckId });
        results.push({ deckId, year, error: 'disconnected' });
        continue;
      }

      const resolved = await resolveDeck(deckId, year, null, io);
      if (resolved) {
        results.push(resolved);
        emitDeckResolved(io, resolved);
      }
    }
    broadcastState(io);
    return results;
  }

  async function handleDeckLoad(io, { deckId, serverName, presetId }) {
    actor.send({ type: 'DECK_LOADING', deckId, serverName, presetId });
    broadcastState(io);

    const entry = await catalog.getServerEntry(serverName);
    const preset = presetId ? store.getById(presetId) : null;
    const filtered = applyPresetFilter(entry, preset);
    const phase = !entry || entry.isConnected === false
      ? (serverName === FIREHOSE_SERVER_NAME ? 'cued' : 'degraded')
      : 'cued';

    actor.send({ type: 'DECK_LOADED', deckId, phase, filtered });
    broadcastState(io);
    await resolveAllDecks(io);
  }

  await listServers();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use('/assets', express.static(uiKitAssetsDir));
  app.use('/assets', express.static(path.join(packageDir, 'assets')));
  app.use('/assets/room-client', express.static(roomClientAssetsDir));
  app.use('/vendor/socket.io', express.static(socketIoDistDir()));

  mountSpecRoutes(app, {
    specs: {
      'openapi.json': buildPlayerSpec
    }
  });
  mountSwaggerUi(app, { title: 'Player UI API' });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'player-ui',
      role: 'dj',
      room: resolveDjRoom(process.env),
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api', createThemeRoutes(themeHandler, getConfig));

  app.use(
    '/api',
    createAlephRoutes({
      store,
      config,
      alephConfig,
      actor,
      registry,
      getAlephConfig,
      loadManifestForLinea,
      normalizeSatRel,
      buildViewLinksResponse,
      resolveDataDir,
      resolveUiMesh,
      readVolumeFile,
      TRIAGE_MANIFEST_PATH,
      buildFirehoseLinksResponse,
      loadLineaRegistry,
      resolveLineaServers,
      resolveTopologyServerNames,
      parseResourceJson,
      buildAnchorGrid,
      loadMedicion,
      buildTopology,
      listServers,
      getSessionSnapshot: () => snapshotFromActor(actor),
      getDjState: () => transportBox.current?.getLastState?.() ?? null,
      getDjLedger: () => transportBox.current?.getLedgerTail?.() ?? []
    })
  );

  app.use('/api', createDebugRoutes({ config }));

  /** DJ intents from decks / e2e — authority owns validation. */
  app.post('/api/dj/:intent', (req, res) => {
    const intent = req.params.intent;
    if (!['cache', 'curate', 'milestone'].includes(intent)) {
      res.status(400).json({ ok: false, error: 'intent_invalida' });
      return;
    }
    const dj = transportBox.current;
    if (!dj) {
      res.status(503).json({ ok: false, error: 'dj_transport_no_listo' });
      return;
    }
    const body = req.body ?? {};
    const payload = dj.emitDjIntent(intent, {
      lineId: body.lineId ?? 'linea-aleph',
      registroId: body.registroId ?? body.registro_id,
      ...(intent === 'curate' && body.to ? { to: body.to } : {}),
      ...(intent === 'milestone' && body.reasons ? { reasons: body.reasons } : {})
    });
    bumpDebugEvent(`dj:${intent}`);
    res.json({ ok: true, payload, room: dj.room });
  });

  app.get('/api/dj/projection', (_req, res) => {
    res.json({
      room: transportBox.current?.room ?? resolveDjRoom(),
      state: transportBox.current?.getLastState?.() ?? null,
      ledger: transportBox.current?.getLedgerTail?.() ?? []
    });
  });

  app.get('/settings', async (req, res) => {
    try {
      const html = settingsView();
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (error) {
      console.error('Settings render error:', error);
      res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
    }
  });

  app.get('/', async (req, res) => {
    try {
      const servers = await listServers();
      const presets = store.getAll();
      const html = deckView({
        servers,
        presets,
        themes: themeHandler.getAvailableThemes(),
        currentTheme: themeHandler.getCurrentTheme(),
        djRoom: resolveDjRoom(process.env)
      });
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (error) {
      console.error('Deck render error:', error);
      res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
    }
  });

  const httpServer = http.createServer(app);
  const ioBox = { current: /** @type {import('socket.io').Server | null} */ (null) };

  function handleDjIntent(intent, payload = {}) {
    const registroId =
      payload.registroId ??
      payload.registro_id ??
      (payload.oldid != null ? `P${String(payload.oldid).padStart(2, '0')}` : null);
    // Map deck oldid → line-board seed ids when possible (P03/P04).
    const mapped =
      registroId ??
      (payload.oldid === 1882 ? 'P03' : payload.oldid === 1898 ? 'P04' : null);
    if (!mapped && intent === 'cache') {
      // Fallback demo seed so deck cache still produces a ledger entry.
      transportBox.current?.emitDjIntent(intent, {
        lineId: payload.lineId ?? 'linea-aleph',
        registroId: 'P03'
      });
      return;
    }
    if (!mapped) return;
    transportBox.current?.emitDjIntent(intent, {
      lineId: payload.lineId ?? 'linea-aleph',
      registroId: mapped,
      ...(intent === 'curate' ? { to: payload.to ?? 'draft' } : {}),
      ...(intent === 'milestone'
        ? { reasons: payload.reasons ?? ['deck'] }
        : {})
    });
  }

  const { handlers, onConnection } = createSessionHandlers({
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
    getIo: () => ioBox.current,
    getDjState: () => transportBox.current?.getLastState?.() ?? null,
    getDjLedger: () => transportBox.current?.getLedgerTail?.() ?? []
  });

  const localIo = attachLocalDeckIo(httpServer, { handlers, onConnection });
  localIoBox.current = localIo;
  ioBox.current = localIo.io;

  const djTransport = await createDjTransport({
    actorId: options.actorId ?? `player-ui-dj-${options.sessionId ?? 'default'}`,
    room: options.room ?? resolveDjRoom(process.env),
    onState: (snap) => {
      localIo.emitDjProjection({
        state: snap,
        ledger: transportBox.current?.getLedgerTail?.() ?? []
      });
    },
    onLedger: (entry) => {
      localIo.emitDjLedger(entry);
    }
  });
  transportBox.current = djTransport;

  const io = localIo.io;
  const session = { mode: 'dj', room: djTransport.room, transport: djTransport };

  console.log(`DJ transport: room → ${djTransport.room} (no scriptorium master)`);

  let debugHeartbeat = null;
  if (debugEnabled) {
    debugHeartbeat = setInterval(() => {
      io.emit('debug:stats', {
        uptime: Date.now() - debugStats.startedAt,
        lastResolveMs: { ...debugStats.lastResolveMs },
        resolveCount: { ...debugStats.resolveCount },
        eventCounts: { ...debugStats.eventCounts }
      });
    }, 1000);
  }

  const started = await new Promise((resolve, reject) => {
    httpServer.listen(port, host, () => {
      const addr = httpServer.address();
      const boundPort = typeof addr === 'object' && addr ? addr.port : port;
      resolve({ port: boundPort, host });
    });
    httpServer.on('error', reject);
  });

  return {
    app,
    httpServer,
    io,
    session,
    dj: djTransport,
    actor,
    registry,
    catalog,
    store,
    port: started.port,
    host: started.host,
    url: `http://${started.host}:${started.port}`,
    refreshDiscovery: async () => {
      serversCache.invalidate();
      await runDiscovery();
    },
    async markDeckDegraded(deckId) {
      actor.send({ type: 'DECK_DEGRADED', deckId });
      broadcastState(io);
    },
    emitDjIntent: (intent, args) => djTransport.emitDjIntent(intent, args),
    close: async () => {
      if (debugHeartbeat) clearInterval(debugHeartbeat);
      actor.send({ type: 'SESSION_CLOSE' });
      actor.stop();
      await registry.close();
      await djTransport.close();
      await localIo.close();
      await new Promise((res) => {
        if (!httpServer.listening) {
          res();
          return;
        }
        httpServer.close((err) => {
          if (err?.code === 'ERR_SERVER_NOT_RUNNING') {
            res();
            return;
          }
          res();
        });
      });
    }
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const server = await createPlayerServer();
  console.log(`Player UI running on ${server.url}`);
  console.log(`Preset store: ${resolveDataDir()} (${server.store.count()} preset(s))`);

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
