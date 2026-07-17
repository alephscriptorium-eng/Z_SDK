/**
 * Resources estándar del patrón MCP-por-actor:
 *   `<game>://player/state` · `<game>://scene` · `<game>://casos`
 * El id de esquema lo aporta el juego (sin hardcodear nombres en el kit).
 */

/**
 * @param {string} game — prefijo de URI (p.ej. el id corto que el juego elija)
 */
export function standardPlayerResourceUris(game) {
  if (typeof game !== 'string' || !game) {
    throw new TypeError('standardPlayerResourceUris: game (string no vacío) es obligatorio');
  }
  return Object.freeze({
    playerState: `${game}://player/state`,
    scene: `${game}://scene`,
    casos: `${game}://casos`
  });
}

/**
 * @param {{
 *   game: string,
 *   bridge: { actor: string },
 *   readPlayerState: () => unknown,
 *   readScene: () => unknown,
 *   readCasos: () => unknown,
 *   titles?: { playerState?: string, scene?: string, casos?: string },
 *   descriptions?: { playerState?: string, scene?: string, casos?: string }
 * }} opts
 */
export function buildStandardPlayerResources({
  game,
  bridge,
  readPlayerState,
  readScene,
  readCasos,
  titles = {},
  descriptions = {}
}) {
  const uris = standardPlayerResourceUris(game);
  return [
    {
      name: `${game}-player-state`,
      uri: uris.playerState,
      title: titles.playerState ?? `Actor "${bridge.actor}" en vivo`,
      mimeType: 'application/json',
      description:
        descriptions.playerState ??
        'Snapshot compacto de MI actor (mismo payload que el tool de estado).',
      read: readPlayerState
    },
    {
      name: `${game}-scene`,
      uri: uris.scene,
      title: titles.scene ?? 'Escena con estados en vivo',
      mimeType: 'application/json',
      description:
        descriptions.scene ?? 'Topología / escena del juego para planificar acciones.',
      read: readScene
    },
    {
      name: `${game}-casos`,
      uri: uris.casos,
      title: titles.casos ?? 'Playbook de casos de validación',
      mimeType: 'application/json',
      description:
        descriptions.casos ?? 'Playbook CASOS.md (markdown + índice de ids).',
      read: readCasos
    }
  ];
}
