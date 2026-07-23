/** Types for `@zeus/presets-sdk/mcp` (WP-U156). */

export function mountMCPRoute(
  app: unknown,
  options: { mcpServer: unknown; path?: string; logLabel?: string }
): void;
export function createMcpHttpStart(opts: object): (opts2?: object) => Promise<object>;

export function createMcpApp(options: object): {
  app: unknown;
  mcpServer: unknown;
  start: (opts?: object) => Promise<object>;
};
export function mountHealthRoute(
  app: unknown,
  options: {
    mcpServer: unknown;
    name: string;
    version: string;
    extraHealth?: (req: unknown) => Record<string, unknown>;
  }
): void;

export function createStandardMcpServer(options: {
  name: string;
  version: string;
  port: number;
  host?: string;
  registry?: object[];
  templateRegistry?: object[];
  promptRegistry?: object[];
  buildMcp?: (mcpServer: unknown) => void;
  serverCard?: boolean;
  extraHealth?: (req: unknown) => Record<string, unknown>;
  extraRoutes?: (app: unknown) => void;
  mcpPath?: string;
  logLabel?: string;
  getCardExamples?: () => Record<string, unknown>;
}): {
  app: unknown;
  mcpServer: unknown;
  start: (opts?: object) => Promise<object>;
  updateServerCard?: (patch: object) => void;
};

export function jsonContent(payload: unknown): {
  content: Array<{ type: string; text: string }>;
};
export function promptMessages(text: string): {
  messages: Array<{ role: string; content: { type: string; text: string } }>;
};
export function renderPromptText(entry: { render: (args: object) => unknown }, args?: object): string;

export function getMcpCapabilities(mcpServer: unknown): Record<string, unknown>;
export function registerCommonMCP(mcpServer: unknown, opts?: object): void;

export const SERVER_CARD_URI: string;
export function buildServerCard(name: string, opts?: object): object;
export function createServerCardResource(name: string): object;
export function updateServerCard(name: string, patch: object): void;

export function mcpApprovalGateLine(opts?: object): string;

export function isMainModule(importMetaUrl: string): boolean;
export function healthUrlFor(mcpUrl: string): string;
export function runMcpMain(
  startFn: () => Promise<object | object[]>,
  options?: { label?: string }
): Promise<void>;

export declare class MCPToolsExtractor {
  constructor(opts?: object);
  extract(opts?: object): Promise<object>;
}

export declare class ServerRegistry {
  constructor(opts?: object);
  list(): unknown[];
  get(name: string): unknown;
  register(entry: object): void;
}
