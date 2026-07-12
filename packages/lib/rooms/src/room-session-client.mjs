/**
 * Node room-session client — scriptorium /runtime with createSessionClientCore API.
 * Replaces @zeus/session-protocol/client for room transport (E6 cutover).
 */

import { io } from 'socket.io-client';
import {
  createSessionClientCore,
  INBOUND_SCHEMAS
} from '@zeus/session-protocol';
import { loadScriptoriumConfig, resolveSessionRoom } from './config.mjs';

/**
 * @param {object} [options]
 * @param {string} [options.sessionId]
 * @param {string} [options.room]
 * @param {string} [options.user]
 * @param {string} [options.scriptoriumUrl]
 * @param {(type: string, payload?: Record<string, unknown>, detail?: string) => void} [options.pushEvent]
 * @param {'enforce' | 'warn' | 'off'} [options.validate]
 */
export function createRoomSessionClient(options = {}) {
  const cfg = loadScriptoriumConfig();
  const sessionId = options.sessionId ?? 'default';
  const room = options.room ?? resolveSessionRoom(sessionId);
  const user = options.user ?? `room-session-${Date.now()}`;
  const base = (options.scriptoriumUrl ?? cfg.url).replace(/\/runtime\/?$/, '');
  const { pushEvent, validate = 'warn' } = options;

  const core = createSessionClientCore({
    url: `${base}/runtime`,
    ioFactory: (url, ioOptions) => {
      const socket = io(url, {
        transports: ['websocket'],
        reconnection: false,
        ...ioOptions,
        auth: { token: cfg.secret, room, user }
      });

      socket.on('SET_STATE', (data) => {
        if (data?.type === 'session:state' && data.snapshot) {
          socket.emit('session:state', data.snapshot);
        }
      });

      socket.on('connect', () => {
        socket.emit('CLIENT_REGISTER', {
          usuario: user,
          sesion: `${user}-${Date.now()}`,
          type: options.type ?? 'RoomSessionClient',
          features: options.features ?? ['session-viewer']
        });
        socket.emit('CLIENT_SUSCRIBE', { room });
      });

      return socket;
    },
    pushEvent
  });

  const roomEmit = (event, payload) => {
    const socket = core.getSocket();
    if (!socket?.connected) {
      pushEvent?.('emit:blocked', { event });
      return false;
    }
    if (validate !== 'off') {
      const schema = INBOUND_SCHEMAS.get(event);
      if (schema) {
        const parsed = schema.safeParse(payload ?? {});
        if (!parsed.success) {
          pushEvent?.('emit:invalid', { event, issues: parsed.error.flatten() });
          if (validate === 'enforce') return false;
        }
      }
    }
    socket.emit('ROOM_MESSAGE', { event, room, data: payload });
    pushEvent?.(`emit:${event}`, {
      raw: payload ? JSON.stringify(payload) : ''
    });
    return true;
  };

  core.emit = roomEmit;
  core.setPlayhead = (year) => roomEmit('domain:playhead:set', { year });
  core.pauseTransport = () => roomEmit('transport:pause');
  core.playTransport = () => roomEmit('transport:play');
  core.toggleSync = () => roomEmit('sync:toggle');
  core.deckLoad = (payload) => roomEmit('domain:deck:load', payload);
  core.registroSelect = (payload) => roomEmit('registro:select', payload);
  core.micropostSelect = (payload) => roomEmit('micropost:select', payload);
  core.firehoseCorpus = (payload) => roomEmit('firehose:corpus', payload);
  core.wikitextCache = (payload) => roomEmit('wikitext:cache', payload);
  core.wikitextPoll = (payload) => roomEmit('wikitext:poll', payload);
  core.setCaso = (casoId) => roomEmit('caso:set', { casoId });

  core.emitWithAck = (event, payload, timeoutMs = 30000) =>
    new Promise((resolve, reject) => {
      const socket = core.getSocket();
      if (!socket?.connected) {
        reject(new Error(`Not connected — cannot emit ${event}`));
        return;
      }
      if (validate !== 'off') {
        const schema = INBOUND_SCHEMAS.get(event);
        if (schema) {
          const parsed = schema.safeParse(payload ?? {});
          if (!parsed.success) {
            pushEvent?.('emit:invalid', { event, issues: parsed.error.flatten() });
            if (validate === 'enforce') {
              reject(new Error(`Invalid payload for ${event}`));
              return;
            }
          }
        }
      }
      const timer = setTimeout(() => {
        reject(new Error(`ACK timeout for ${event}`));
      }, timeoutMs);
      socket.emit('ROOM_MESSAGE', { event, room, data: payload }, (response) => {
        clearTimeout(timer);
        if (response?.code && response?.event) {
          reject(response);
        } else {
          resolve(response);
        }
      });
    });

  return core;
}
