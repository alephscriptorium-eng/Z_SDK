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
 * @param {unknown} content
 * @returns {string|null} corpus id or null if not exportable
 */
export function corpusForContent(content) {
  if (!content || typeof content !== 'object') return null;
  const type = /** @type {{ type?: unknown }} */ (content).type;
  if (typeof type !== 'string' || !type) return null;
  if (CORPUS_BY_TYPE[type]) return CORPUS_BY_TYPE[type];
  // Prefix fallback for forward-compatible tribe*/parliament*/votes* types.
  if (type.startsWith('tribe')) return 'tribes';
  if (type.startsWith('parliament')) return 'parliament';
  if (type.startsWith('votes')) return 'votes';
  return null;
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
