/**
 * SSB typed-message → corpus map (DATOS.md §3/§7, BlockchainComPort models).
 * Table, not if-chains (PRACTICAS §1.2).
 */

/** @type {Readonly<Record<string, string>>} */
export const CORPUS_BY_TYPE = Object.freeze({
  tribe: 'tribes',
  'tribe-invite-msg': 'tribes',
  'tribe-invite-tombstone': 'tribes',
  'tribe-open-invite': 'tribes',
  'tribe-open-invite-tombstone': 'tribes',
  parliamentProposal: 'parliament',
  parliamentLaw: 'parliament',
  parliamentCandidature: 'parliament',
  parliamentCandidatureVote: 'parliament',
  parliamentTerm: 'parliament',
  parliamentRevocation: 'parliament',
  votes: 'votes',
  votesVote: 'votes',
  votesOpinion: 'votes'
});

/** @type {ReadonlyArray<{ id: string, path: string, label: string }>} */
export const SSB_CORPORA = Object.freeze([
  { id: 'tribes', path: 'tribes', label: 'Tribes (tribe*)' },
  { id: 'parliament', path: 'parliament', label: 'Parliament (parliament*)' },
  { id: 'votes', path: 'votes', label: 'Votes (votes*)' }
]);

export const MANIFEST_NAME = 'manifest.json';
export const SSB_VOLUME_ID = 'ssb';
export const SSB_DISK = 'DISK_04';
export const SSB_VOLUME_PATH = 'DISK_04/SSB';

/**
 * Motivos de descarte (WP-U205). El descarte SILENCIOSO era el defecto: un
 * conteo `skipped` sin razón no distingue «este pub habla de otra cosa» de
 * «este volumen está lleno de DM cifrados que jamás vamos a poder exportar».
 * Los mensajes cifrados de SSB traen `content` como CADENA (`"...box"` /
 * `"...box2"`): nunca fueron exportables y ahora se dice POR QUÉ, no solo
 * cuántos.
 * @type {Readonly<Record<string,string>>}
 */
export const SKIP_REASONS = Object.freeze({
  MENSAJE_NO_OBJETO: 'mensaje_no_objeto',
  CLAVE_AUSENTE: 'clave_ausente',
  VALUE_AUSENTE: 'value_ausente',
  CONTENIDO_AUSENTE: 'contenido_ausente',
  CONTENIDO_CIFRADO: 'contenido_cifrado',
  CONTENIDO_NO_OBJETO: 'contenido_no_objeto',
  TIPO_AUSENTE: 'tipo_ausente',
  TIPO_NO_EXPORTABLE: 'tipo_no_exportable'
});

/**
 * Clasifica un `content` en corpus, o dice por qué no se puede.
 * `corpusForContent` es la mitad muda de esta función y se conserva intacta:
 * devuelve exactamente lo mismo que antes (corpus o null) para no mover el
 * contrato de sus consumidores (src/index.mjs:24).
 * @param {unknown} content
 * @returns {{ corpus: string|null, reason: string|null }}
 */
export function classifyContent(content) {
  if (content === null || content === undefined) {
    return { corpus: null, reason: SKIP_REASONS.CONTENIDO_AUSENTE };
  }
  // DM / grupo privado: el payload viaja como cadena cifrada, no como objeto.
  if (typeof content === 'string') {
    return { corpus: null, reason: SKIP_REASONS.CONTENIDO_CIFRADO };
  }
  if (typeof content !== 'object' || Array.isArray(content)) {
    return { corpus: null, reason: SKIP_REASONS.CONTENIDO_NO_OBJETO };
  }
  const type = /** @type {{ type?: unknown }} */ (content).type;
  if (typeof type !== 'string' || !type) {
    return { corpus: null, reason: SKIP_REASONS.TIPO_AUSENTE };
  }
  if (CORPUS_BY_TYPE[type]) return { corpus: CORPUS_BY_TYPE[type], reason: null };
  // Prefix fallback for forward-compatible tribe*/parliament*/votes* types.
  if (type.startsWith('tribe')) return { corpus: 'tribes', reason: null };
  if (type.startsWith('parliament')) return { corpus: 'parliament', reason: null };
  if (type.startsWith('votes')) return { corpus: 'votes', reason: null };
  return { corpus: null, reason: SKIP_REASONS.TIPO_NO_EXPORTABLE };
}

/**
 * @param {unknown} content
 * @returns {string|null} corpus id or null if not exportable
 */
export function corpusForContent(content) {
  return classifyContent(content).corpus;
}

/**
 * Safe filename for an SSB message key (`%hash=.sha256`).
 * @param {string} key
 */
export function messageFileName(key) {
  const raw = String(key || '');
  const b64 = Buffer.from(raw, 'utf8').toString('base64url');
  return `${b64}.json`;
}
