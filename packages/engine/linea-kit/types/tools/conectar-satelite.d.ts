/**
 * Declarations for src/tools/conectar-satelite.mjs.
 * Writes MCP satellite instructions and remote stubs (wiki/ATProto/SSB).
 */

import type { KitFailure } from '../common.js';

export interface ConectarSateliteOptions {
  lineDir: string;
  lineaId: string;
  /** Defaults to `wp/historia/`. */
  sateliteRel?: string;
  wiki?: { title?: string; apiBase?: string };
  atproto?: { collection?: string; endpointHint?: string };
  ssb?: { feedType?: string; diskHint?: string };
}

/** The `remotes.json` document this tool writes. */
export interface RemotesDocument {
  generated_at: string;
  linea_id: string;
  satelite_rel: string;
  remotes: {
    wiki: {
      kind: 'static_authority';
      title: string;
      api_base: string | null;
      note: string;
    };
    atproto: {
      kind: 'stream';
      collection: string;
      endpoint_hint: string | null;
      note: string;
    };
    ssb: {
      kind: 'gossip';
      feed_type: string;
      disk_hint: string;
      note: string;
    };
  };
}

/** One MCP server entry of the `mcp-satelite.json` document. */
export interface McpServerStub {
  name: string;
  kind: string;
  resources: string[];
  tools?: string[];
}

/** The `mcp-satelite.json` document this tool writes. */
export interface McpSateliteConfig {
  generated_at: string;
  linea_id: string;
  servers: {
    tronco: McpServerStub;
    satelite: McpServerStub;
  };
  point_linea_system: {
    env: string;
    lineas_root_hint: string;
    registry_entry_id: string;
  };
}

export interface ConectarSateliteOk {
  ok: true;
  satDir: string;
  remotesPath: string;
  mcpPath: string;
  instructionsPath: string;
  remotes: RemotesDocument;
  mcpConfig: McpSateliteConfig;
}

export declare function conectarSatelite(
  options: ConectarSateliteOptions
): ConectarSateliteOk | KitFailure;
