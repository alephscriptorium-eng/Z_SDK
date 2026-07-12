import { resolvePlayerUiEndpoint } from '@zeus/presets-sdk';
import { SESSION_NAMESPACE } from './protocol.mjs';

/**
 * Compose player base URL + session namespace path.
 * @param {number} [fallbackPort]
 */
export function resolveSessionSocketUrl(fallbackPort) {
  const { baseUrl } = resolvePlayerUiEndpoint(fallbackPort);
  return `${baseUrl}${SESSION_NAMESPACE}`;
}

export { SESSION_NAMESPACE };
