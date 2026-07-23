/** Types for `@zeus/presets-sdk/env` (WP-U156). */

export const MONOREPO_ROOT: string;

export function loadZeusEnv(repoRoot?: string): void;
export function resetZeusEnvLoader(): void;

export type ValidateMode = 'off' | 'warn' | 'enforce';

export const DEFAULT_ZEUS_MCP: Record<string, Record<string, number>>;
export const DEFAULT_ZEUS_UI_MESH: Record<
  string,
  { host: string; port: number; path: string; label: string; emoji: string }
>;
export const DEFAULT_SPEC_TOOL_PORTS: {
  studio: number;
  docs: number;
  inspector: number;
  inspectorProxy: number;
};

export function resolveValidateMode(scope?: 'http' | 'socket'): ValidateMode;
export function readEnvPort(name: string, fallback: number): number;
export function resolveZeusHost(fallback?: string): string;
export function applyEnvToMcp(
  mcp: object,
  host?: string
): { host: string; mcp: Record<string, Record<string, number>> };
export function applyEnvToUis(
  uis: object,
  host?: string
): Record<string, { host: string; port: number; path?: string; label?: string; emoji?: string }>;
export function mcpToUrls(
  host: string,
  mcp: object,
  opts?: { excludeGroups?: string[] }
): string[];
export function mcpToDiscoveryUrls(host: string, mcp: object): string[];
export function resolveZeusMcpPorts(
  baseMcp?: typeof DEFAULT_ZEUS_MCP
): Record<string, Record<string, number>>;
export function resolveZeusUiPorts(
  baseUis?: typeof DEFAULT_ZEUS_UI_MESH
): typeof DEFAULT_ZEUS_UI_MESH;
export function resolveAppPort(appId: string, fallback: number): number;
export function resolvePlayerUiEndpoint(fallbackPort?: number): {
  baseUrl: string;
  host: string;
  port: number;
};
export function resolvePlayerUiBaseUrl(): string;
export function resolvePlayerDebugEndpoint(fallbackPort?: number): {
  baseUrl: string;
  host: string;
  port: number;
};
export function resolvePrensaBaseUrl(fallback?: string): string;
export function resolveSpecToolPorts(base?: typeof DEFAULT_SPEC_TOOL_PORTS): {
  studio: number;
  docs: number;
  inspector: number;
  inspectorProxy: number;
};
export const SPEC_TOOL_PORTS: {
  studio: number;
  docs: number;
  inspector: number;
  inspectorProxy: number;
};
export function resolveInspectorEndpoint(): {
  host: string;
  uiPort: number;
  proxyPort: number;
  token: string;
};
export const DEFAULT_MCP_APPROVAL_TOKEN: string;
export function resolveMcpApprovalToken(): string;
export function resolveExtraDiscoveryUrls(): string[];
export const GOOGLE_STUN_URLS: readonly string[];
export function resolveIceServers(
  env?: NodeJS.ProcessEnv,
  opts?: { warn?: (msg: string) => void }
): Array<{ urls: string | string[]; username?: string; credential?: string }>;
export function buildInspectorUrl(mcpUrl: string): string;
export const ZEUS_STOP_SERVICES: readonly string[];
export function resolveStopServicePorts(serviceId: string): number[];
export function resolveStopTargets(serviceIds: string[]): number[];
export function openBrowser(url: string, opts?: object): Promise<void> | void;
