/**
 * Minimal HTTP server for volumes-ops (REST). MCP projected in tests via U40.
 * Port must be provided (or 0 for ephemeral) — no hardcoded mesh port.
 */

import express from 'express';
import cors from 'cors';
import { resolveZeusHost } from '@zeus/presets-sdk/env';
import { mountVolumesOpsRoutes } from './routes.mjs';

/**
 * @param {object} [options]
 * @param {number} [options.port=0]
 * @param {string} [options.host]
 * @param {{ volumesRoot?: string, ledgerPath?: string }} [options.ledger]
 * @returns {Promise<{ app: import('express').Express, server: import('node:http').Server, close: () => Promise<void>, url: string }>}
 */
export async function createVolumesOpsServer(options = {}) {
  const port = options.port ?? 0;
  const host = options.host ?? resolveZeusHost('127.0.0.1');

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  mountVolumesOpsRoutes(app, { ledger: options.ledger });

  const server = await new Promise((resolve, reject) => {
    const s = app.listen(port, host, () => resolve(s));
    s.on('error', reject);
  });

  const addr = server.address();
  const boundPort = typeof addr === 'object' && addr ? addr.port : port;
  const url = `http://${host}:${boundPort}`;

  return {
    app,
    server,
    url,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      })
  };
}
