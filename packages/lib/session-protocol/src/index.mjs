import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const srcDir = path.resolve(__dirname);
export const browserAssetsDir = path.resolve(__dirname, '..', 'browser');

export * from './protocol.mjs';
export * from './errors.mjs';
export * from './endpoint.mjs';
export * from './schemas/index.mjs';
export { createSessionClient } from './client.mjs';
export { createRoomSessionClient } from './room-session-client.mjs';
export { createSessionClientCore, waitForSocketEvent } from './client-core.mjs';
export {
  SCENE_IDS,
  SCENE_DECLARATIONS,
  getSceneDeclaration,
  projectSlice,
  buildDomainNodes,
  firehoseDeckContextFromSession
} from './projection/index.mjs';
