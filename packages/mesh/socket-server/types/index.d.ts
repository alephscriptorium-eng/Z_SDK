/** Types for `@zeus/socket-server` (WP-U157). */

export const NAMESPACE: string;

export function resolveConfig(options?: {
  port?: number;
  host?: string;
  bridge?: 'local' | 'remote' | string;
  secret?: string;
}): {
  port: number;
  host: string;
  bridge: string;
  secret: string;
};

/**
 * Contrato de propagación del relay (WP-U194). Los nombres de evento NO se
 * enumeran aquí: viven en una sola tabla, `src/relay-contract.mjs`.
 */
export const RELAY_CONTRACT_VERSION: string;
export const RELAY_CONTRACT_SEAL: string;
export const RELAY_CONTRACT: {
  readonly version: string;
  readonly seal: string;
  readonly upstream: readonly string[];
  readonly downstream: ReadonlySet<string>;
};
export function relayContractDescriptor(): {
  version: string;
  seal: string;
  upstream: string[];
  downstream: string[];
  counts: { upstream: number; downstream: number };
};

export interface ScriptoriumServerHandle {
  httpServer: import('node:http').Server;
  socketServer: unknown;
  bridgeClient: unknown;
  port: number;
  host: string;
  url: string;
  runtimeUrl: string;
  adminUiUrl: string;
  adminUiAvailable: boolean;
  close: () => Promise<void> | void;
}

export function createScriptoriumServer(options?: {
  port?: number;
  host?: string;
  bridge?: 'local' | 'remote' | string;
  secret?: string;
}): Promise<ScriptoriumServerHandle>;
