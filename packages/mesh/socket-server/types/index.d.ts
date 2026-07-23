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
