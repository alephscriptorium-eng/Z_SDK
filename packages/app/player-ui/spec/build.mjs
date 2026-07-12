import { buildOpenApiDoc, zeusOpenApiServers, readPackageVersion } from '@zeus/http-contract';
import { PLAYER_ROUTES } from '../src/contract.mjs';

export function buildPlayerSpec() {
  return buildOpenApiDoc(PLAYER_ROUTES, {
    title: 'Zeus Player UI (Tablero ALEPH) API',
    version: readPackageVersion(import.meta.url),
    description: 'REST API for @zeus/player-ui deck tablero and ALEPH bridges.',
    servers: zeusOpenApiServers('player')
  });
}
