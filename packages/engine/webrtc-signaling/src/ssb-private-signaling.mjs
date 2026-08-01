/**
 * SignalingService over SSB private messages (WP-U90).
 *
 * Sister of SocketRoomSignalingService: same abstract API, transport is
 * ssb-box DMs (`type: 'webrtc-signal'`) mediated by the OASIS pub — not a
 * dedicated signaling websocket.
 *
 * Default: offer+answer only (no trickle ICE) — gossip latency cannot carry
 * per-candidate messages reliably. Set `allowTrickle: true` only for labs.
 */

import { isSsbId } from '@zeus/protocol';
import { createMessageId } from './messages.mjs';
import { SignalingService } from './signaling-service.mjs';
import { SSB_WEBRTC_SIGNAL_TYPE } from './ssb-private-transport.mjs';
import {
  peerCardFromMessage,
  ssbIdFromMessage,
  SIGNALING_ADMISSION
} from './peer-card-gate.mjs';

/**
 * Abstract signaling type → SSB content.signal field.
 * Table (PRACTICAS §1.2), not if/else chains.
 */
export const ABSTRACT_TO_SSB_SIGNAL = Object.freeze({
  offer: 'offer',
  answer: 'answer',
  'ice-candidate': 'ice-candidate',
  'room-join': 'room-join',
  'room-leave': 'room-leave',
  'peer-connected': 'peer-connected',
  'peer-disconnected': 'peer-disconnected'
});

export const SSB_SIGNAL_TO_ABSTRACT = Object.freeze(
  Object.fromEntries(Object.entries(ABSTRACT_TO_SSB_SIGNAL).map(([k, v]) => [v, k]))
);

/**
 * @typedef {object} SsbPrivateSignalingOptions
 * @property {import('./ssb-private-transport.mjs').SsbPrivateTransport} [transport]
 * @property {boolean} [allowTrickle=false] — when false, sendIceCandidate is a no-op
 * @property {boolean} [requireSsbId=true] — ssbId obligatorio en card (federación)
 * @property {boolean} [requireSeatSignature=false] — exigir firma de asiento
 */

export class SsbPrivateSignalingService extends SignalingService {
  /** @param {SsbPrivateSignalingOptions} [options] */
  constructor(options = {}) {
    super();
    this._options = options;
    /** @type {import('./ssb-private-transport.mjs').SsbPrivateTransport|null} */
    this._transport = options.transport ?? null;
    /** @type {(() => void)|null} */
    this._unsub = null;
    this._allowTrickle = options.allowTrickle === true;
    // Carril SSB: identidad = feed id en el saludo (Z_SDK #4)
    this._requireSsbId = options.requireSsbId !== false;
    // D1 (devolución): truthiness, no identidad estricta — una exigencia
    // declarada con truthy no-booleano no puede caer a `false`.
    this._requireSeatSignature = Boolean(options.requireSeatSignature);
    // Una opción `admission` no se ignora en silencio: se aplica (y en
    // este carril, `anonymous` lanza — ver `setAdmission` abajo).
    // WP-U251 (defecto 5): `!= null`, paridad con el gemelo de navegador —
    // `admission: ''` es un typo de despliegue, no un «no declarado».
    if (options.admission != null) this.setAdmission(options.admission);
  }

  /**
   * El carril SSB NO admite antesala anónima (WP-U197 · D1 de la
   * devolución). Antes se confiaba en que `requireSsbId` valía `true` por
   * defecto; eso es un DEFECTO, no una imposibilidad: `requireSsbId:false`
   * es legal y `setAdmission()` es público y heredado. Aquí se hace
   * estructural: en un carril cuyo transporte ES la identidad del feed,
   * «anónimo» no es un modo, es una contradicción.
   *
   * Esto es la mitad RUIDOSA del candado: la vía de configuración se
   * entera. La mitad ESTRUCTURAL es `getAdmission()` (WP-U251 · defecto 2).
   * @param {string} mode
   */
  setAdmission(mode) {
    if (mode === SIGNALING_ADMISSION.anonymous) {
      throw new Error(
        'SsbPrivateSignalingService: el carril SSB no admite antesala anónima (la identidad del feed ES el transporte)'
      );
    }
    return super.setAdmission(mode);
  }

  /**
   * WP-U251 (defecto 2) — el candado, de verdad.
   *
   * U197 dejó anotado el alcance exacto: `setAdmission()` era un `override`
   * de método sobre un campo público, así que garantizaba «no hay
   * configuración que lo abra», NO «es imposible por construcción» —
   * `svc._admission = …`, `SignalingService.prototype.setAdmission.call(…)`,
   * una subclase o `setPrototypeOf` lo pinchaban desde dentro del proceso.
   *
   * Ahora el modo del torno es una CONSTANTE en este carril: `#admission`
   * es privado (nadie lo escribe sin pasar por `setAdmission`) y el torno
   * —`_gatedOutbound` / `handleMessage` en `signaling-service.mjs`— lee
   * AQUÍ. Aunque alguien consiga escribir el campo, el torno no lo mira.
   * @returns {string} siempre `peer-card`
   */
  getAdmission() {
    return SIGNALING_ADMISSION.peerCard;
  }

  getTransport() {
    return this._transport;
  }

  /**
   * Extiende el retrato del padre con la política PROPIA de este carril
   * (WP-U251 · devolución, M5). Los dos campos muerden, medido:
   *  - `_allowTrickle`: el carril cierra el trickle ICE **a propósito** (la
   *    latencia de gossip no lo aguanta). Un `connect()` fallido lo dejaba
   *    ENCENDIDO — 0 → 1 publicaciones por `sendIceCandidate`.
   *  - `_transport`: se instalaba antes de lo que lanza y, como
   *    `_connected` sigue en pie de un connect anterior, el `sendOffer`
   *    siguiente publicaba la peer-card local —**con su token dentro**—
   *    por el transporte que instaló la llamada que falló.
   * @protected
   */
  _policySnapshot() {
    return {
      ...super._policySnapshot(),
      transport: this._transport,
      allowTrickle: this._allowTrickle
    };
  }

  /** @param {ReturnType<SsbPrivateSignalingService['_policySnapshot']>} snapshot @protected */
  _policyRestore(snapshot) {
    super._policyRestore(snapshot);
    this._transport = snapshot.transport;
    this._allowTrickle = snapshot.allowTrickle;
  }

  /**
   * WP-U251 (defecto 4): política en bloque, con rollback. El vector que lo
   * hacía fail-open es propio de este carril: `connect(feed, {
   * requireSsbId: false, admission: 'anonymous' })` rebajaba la exigencia
   * federada en la línea de arriba y LANZABA en la de abajo — dejando el
   * carril SSB aceptando cards sin feed id por culpa de una llamada que
   * falló. `requireSsbId` es aquí la exigencia estructural del carril.
   * @param {string} userId — local feedId (must match transport.whoami when set)
   * @param {SsbPrivateSignalingOptions} [config]
   */
  async connect(userId, config = {}) {
    const snapshot = this._policySnapshot();
    try {
      const opts = { ...this._options, ...config };
      this._transport = opts.transport ?? this._transport;
      if (!this._transport) {
        throw new Error(
          'SsbPrivateSignalingService.connect requires a SsbPrivateTransport (inject createSbotPrivateTransport or createInMemorySsbPrivateBus)'
        );
      }

      const who = this._transport.whoami();
      if (who && userId && who !== userId) {
        throw new Error(
          `SsbPrivateSignalingService: userId ${userId} does not match transport whoami ${who}`
        );
      }
      this.userId = userId || who;
      this._allowTrickle = opts.allowTrickle === true;
      // D1: normalizar al guardar.
      if (opts.requireSsbId != null) this._requireSsbId = Boolean(opts.requireSsbId);
      if (opts.requireSeatSignature != null) {
        this._requireSeatSignature = Boolean(opts.requireSeatSignature);
      }
      // U251 defecto 5: `!= null` — paridad con el gemelo de navegador.
      if (opts.admission != null) this.setAdmission(opts.admission);

      this._unbind();
      this._unsub = this._transport.subscribePrivate((msg) => this._onPrivateMsg(msg));
      this.handleConnectionChange(true);
    } catch (err) {
      this._policyRestore(snapshot);
      throw err;
    }
  }

  async disconnect() {
    this._unbind();
    this.roomId = '';
    this.handleConnectionChange(false);
  }

  /**
   * Bookmark logical room and present peer-card (WP-U93).
   * Room id is a logical label — the pub does not host a socket room.
   * @param {string} roomId
   * @param {object} peerCard
   */
  async joinRoom(roomId, peerCard) {
    if (!this._connected || !this._transport) {
      throw new Error('Not connected to SSB private signaling transport');
    }
    let card = peerCard;
    // Amarrar ssbId al feed local si la card aún no lo trae.
    // WP-U262: `card.ssbId` y `this.userId` se leen UNA vez cada uno — el
    // feed que se comprueba ausente y el que se estampa son el mismo dato.
    const localFeed = this.userId;
    const cardSsbId = card && typeof card === 'object' ? card.ssbId : undefined;
    if (card && typeof card === 'object' && !isSsbId(cardSsbId) && isSsbId(localFeed)) {
      card = { ...card, ssbId: localFeed };
    }
    this.setPeerCard(card);
    this.roomId = roomId;
  }

  async leaveRoom() {
    this.roomId = '';
  }

  /**
   * Trickle ICE is disabled by default (gossip). Override to send only when
   * `allowTrickle: true`.
   * @param {string} targetPeerId
   * @param {RTCIceCandidateInit} candidate
   */
  async sendIceCandidate(targetPeerId, candidate) {
    if (!this._allowTrickle) return;
    return super.sendIceCandidate(targetPeerId, candidate);
  }

  /** @param {import('./signaling-service.mjs').SignalingMessage} message */
  async sendMessage(message) {
    if (!this._connected || !this._transport) {
      throw new Error('Not connected to SSB private signaling transport');
    }
    const gated = this._gatedOutbound(message);
    const to = gated.to;
    if (!to) {
      throw new Error('SSB private signaling requires message.to (peer feedId)');
    }

    const signal = ABSTRACT_TO_SSB_SIGNAL[gated.type];
    if (!signal) {
      throw new Error(`Unknown signaling message type for SSB: ${gated.type}`);
    }

    const outFrom = gated.from || this.userId;
    const content = {
      type: SSB_WEBRTC_SIGNAL_TYPE,
      signal,
      from: outFrom,
      to,
      roomId: gated.roomId || this.roomId || undefined,
      timestamp: gated.timestamp ?? Date.now(),
      messageId: gated.messageId || createMessageId(this.userId),
      recps: [to]
    };

    if (gated.offer != null) content.offer = gated.offer;
    if (gated.answer != null) content.answer = gated.answer;
    if (gated.candidate != null) content.candidate = gated.candidate;
    if (gated.data != null) content.data = gated.data;
    // WP-U262 · lo que se comprueba es lo que se publica. La cascada leía
    // `gated.peerCard` ×3, `gated.ssbId` ×2 y `gated.from` ×3 para elegir
    // UN feed id: podía validarse uno y publicarse otro por el DM.
    const outCard = gated.peerCard;
    const outSsbId = gated.ssbId;
    const outCardSsbId = outCard?.ssbId;
    if (outCard != null) content.peerCard = outCard;
    if (isSsbId(outSsbId)) content.ssbId = outSsbId;
    else if (isSsbId(outCardSsbId)) content.ssbId = outCardSsbId;
    else if (isSsbId(outFrom)) content.ssbId = outFrom;

    await this._transport.publishPrivate(content, [to]);
  }

  _unbind() {
    if (this._unsub) {
      try {
        this._unsub();
      } catch {
        /* best effort */
      }
      this._unsub = null;
    }
  }

  /**
   * @param {import('./ssb-private-transport.mjs').SsbPrivateMessage} msg
   */
  _onPrivateMsg(msg) {
    const content = msg?.value?.content;
    if (!content || content.type !== SSB_WEBRTC_SIGNAL_TYPE) return;

    const from = content.from || msg.value.author || '';
    if (from && from === this.userId) return;

    const to = content.to;
    if (to && to !== this.userId) return;

    const signal = content.signal;
    if (!this._allowTrickle && signal === 'ice-candidate') return;

    // WP-U262: `content.signal` se leía ×2 y `content.data` ×2; la card y
    // el feed id se extraían con dos recorridos independientes del MISMO
    // contenido (`content.peerCard` ×4), así que el mensaje podía nacer con
    // la card de una lectura y el `ssbId` de otra.
    const abstractType = SSB_SIGNAL_TO_ABSTRACT[signal] || signal;
    const peerCard = peerCardFromMessage(content);
    const ssbId = ssbIdFromMessage(content, peerCard) || (isSsbId(from) ? from : null);
    const data = content.data;
    /** @type {import('./signaling-service.mjs').SignalingMessage} */
    const message = {
      type: abstractType,
      from,
      to,
      roomId: content.roomId || this.roomId,
      timestamp: content.timestamp ?? msg.value.timestamp ?? Date.now(),
      messageId: content.messageId || createMessageId(from || 'peer'),
      data,
      ...(peerCard != null ? { peerCard } : {}),
      ...(ssbId ? { ssbId } : {})
    };

    if (abstractType === 'offer') message.offer = content.offer ?? data;
    if (abstractType === 'answer') message.answer = content.answer ?? data;
    if (abstractType === 'ice-candidate') {
      message.candidate = content.candidate ?? data;
    }

    this.handleMessage(message);
  }
}
