/**
 * HTTP API + static /webrtc page over an injected SsbPrivateTransport / bus.
 * Browser clients poll inbox; Node peers can use @zeus/webrtc-signaling directly.
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  resolveZeusUiPorts,
  resolveIceServers
} from '@zeus/presets-sdk/env';
import {
  SSB_WEBRTC_SIGNAL_TYPE,
  createInMemorySsbPrivateBus
} from '@zeus/webrtc-signaling';
import { renderWebrtcPage } from './view.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../public');

/**
 * @returns {{ host: string, port: number, path: string }}
 */
export function resolveOasisWebrtcListen(env = process.env) {
  const ui = resolveZeusUiPorts();
  const slot = ui.oasisWebrtc;
  return {
    host: env.ZEUS_HOST || slot.host || 'localhost',
    port: Number(env.ZEUS_PORT_OASIS_WEBRTC || slot.port),
    path: slot.path || '/webrtc'
  };
}

/**
 * @typedef {object} OasisWebrtcAppOptions
 * @property {ReturnType<typeof createInMemorySsbPrivateBus>} [bus]
 * @property {Map<string, import('@zeus/webrtc-signaling').SsbPrivateTransport>} [transports]
 * @property {(env?: NodeJS.ProcessEnv) => RTCIceServer[]} [resolveIce]
 * @property {NodeJS.ProcessEnv} [env]
 */

/**
 * Build Express app: GET /webrtc, POST /api/webrtc/signal, GET /api/webrtc/inbox.
 * Each request identifies the local feed via `X-SSB-Feed` header (or body.feedId).
 *
 * @param {OasisWebrtcAppOptions} [opts]
 */
export function createOasisWebrtcApp(opts = {}) {
  const env = opts.env ?? process.env;
  const bus = opts.bus ?? createInMemorySsbPrivateBus();
  /** @type {Map<string, import('@zeus/webrtc-signaling').SsbPrivateTransport>} */
  const transports = opts.transports ?? new Map();
  const resolveIce = opts.resolveIce ?? resolveIceServers;

  /** @type {Map<string, object[]>} */
  const inboxes = new Map();

  function transportFor(feedId) {
    if (!feedId) throw new Error('feedId required (X-SSB-Feed or body.feedId)');
    if (!transports.has(feedId)) {
      const t = bus.createTransport(feedId);
      t.subscribePrivate((msg) => {
        if (!inboxes.has(feedId)) inboxes.set(feedId, []);
        inboxes.get(feedId).push(msg);
      });
      transports.set(feedId, t);
    }
    return transports.get(feedId);
  }

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'oasis-webrtc' });
  });

  app.get('/webrtc', (_req, res) => {
    res.type('html').send(renderWebrtcPage());
  });

  app.get('/js/webrtc-app.js', (_req, res) => {
    res.type('application/javascript').send(
      readFileSync(join(PUBLIC_DIR, 'webrtc-app.js'), 'utf8')
    );
  });

  app.get('/assets/styles/webrtc.css', (_req, res) => {
    res.type('text/css').send(readFileSync(join(PUBLIC_DIR, 'webrtc.css'), 'utf8'));
  });

  app.get('/api/webrtc/ice', (_req, res) => {
    const iceServers = resolveIce(env, { warn: () => {} });
    res.json({ iceServers });
  });

  app.get('/api/webrtc/whoami', (req, res) => {
    const feedId = String(req.headers['x-ssb-feed'] || req.query.feedId || '');
    if (!feedId) {
      res.status(400).json({ error: 'X-SSB-Feed header or feedId query required' });
      return;
    }
    const t = transportFor(feedId);
    res.json({ feedId: t.whoami() });
  });

  /**
   * Publish a webrtc-signal private message (ssb-box DM via pub mediator).
   * Body: { feedId, to, signal, offer?, answer?, roomId?, messageId? }
   */
  app.post('/api/webrtc/signal', async (req, res) => {
    try {
      const feedId = String(
        req.headers['x-ssb-feed'] || req.body?.feedId || ''
      );
      const to = String(req.body?.to || '');
      const signal = String(req.body?.signal || '');
      if (!feedId || !to || !signal) {
        res.status(400).json({ error: 'feedId, to, and signal are required' });
        return;
      }
      const t = transportFor(feedId);
      const content = {
        type: SSB_WEBRTC_SIGNAL_TYPE,
        signal,
        from: feedId,
        to,
        roomId: req.body.roomId,
        messageId: req.body.messageId,
        timestamp: Date.now(),
        recps: [to]
      };
      if (req.body.offer != null) content.offer = req.body.offer;
      if (req.body.answer != null) content.answer = req.body.answer;
      if (req.body.candidate != null) content.candidate = req.body.candidate;
      if (req.body.data != null) content.data = req.body.data;

      const msg = await t.publishPrivate(content, [to]);
      res.json({ ok: true, key: msg.key });
    } catch (err) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  /**
   * Drain private webrtc-signal messages for this feed (poll).
   * Query: ?feedId=…&since=0
   */
  app.get('/api/webrtc/inbox', (req, res) => {
    const feedId = String(req.headers['x-ssb-feed'] || req.query.feedId || '');
    if (!feedId) {
      res.status(400).json({ error: 'feedId required' });
      return;
    }
    transportFor(feedId);
    const since = Number(req.query.since || 0);
    const box = inboxes.get(feedId) || [];
    const messages = box.slice(since);
    res.json({
      feedId,
      nextSince: box.length,
      messages: messages.map((m) => ({
        key: m.key,
        author: m.value.author,
        timestamp: m.value.timestamp,
        content: m.value.content
      }))
    });
  });

  return {
    app,
    bus,
    transports,
    transportFor,
    /**
     * @param {{ host?: string, port?: number }} [listen]
     */
    async listen(listen = {}) {
      const slot = resolveOasisWebrtcListen(env);
      const host = listen.host ?? slot.host;
      const port = listen.port ?? slot.port;
      const server = createServer(app);
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => resolve());
      });
      const addr = server.address();
      const boundPort = typeof addr === 'object' && addr ? addr.port : port;
      return {
        server,
        host,
        port: boundPort,
        url: `http://${host}:${boundPort}`
      };
    }
  };
}
