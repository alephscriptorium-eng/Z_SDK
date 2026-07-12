import { buildOpenApiDoc } from '@zeus/http-contract';
import { HORSE_PRESET_ROUTES } from './contract.mjs';

/**
 * @returns {string} OpenAPI YAML for horse preset control plane
 */
export function buildHorsePresetSpec() {
  return buildOpenApiDoc(HORSE_PRESET_ROUTES, {
    title: 'Zeus Horse Preset Capability',
    version: '0.1.0',
    description:
      'Control plane for curated preset offers over HORSE channels. ' +
      'Peers advertise a filtered MCP surface via horse.offer(presetOffer).'
  });
}
