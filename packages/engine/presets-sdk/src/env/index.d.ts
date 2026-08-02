/** Types for `@zeus/presets-sdk/env` (WP-U156). */

export const MONOREPO_ROOT: string;

export function loadZeusEnv(repoRoot?: string): void;
export function resetZeusEnvLoader(): void;

export type ValidateMode = 'off' | 'warn' | 'enforce';

export const DEFAULT_ZEUS_HOST: string;
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

/** `group.key` → ZEUS_* override var (MCP ports). */
export const MCP_PORT_ENV: Record<string, string>;
/** UI id → ZEUS_* override var. */
export const UI_PORT_ENV: Record<string, string>;
/** UI id → cadena de claves (alias legados) en orden de precedencia real. */
export const UI_PORT_ENV_CHAIN: Readonly<Record<string, readonly string[]>>;
/** Cadena de claves de entorno de un slot, de mayor a menor prioridad. */
export function uiPortEnvChain(uiId: string): string[];
/** Spec tool id → ZEUS_* override var. */
export const SPEC_TOOL_PORT_ENV: Record<string, string>;

export function resolveValidateMode(scope?: 'http' | 'socket'): ValidateMode;

/** Rango de puerto anunciable. El 0 queda fuera a proposito (WP-U266). */
export const MIN_ZEUS_PORT: number;
export const MAX_ZEUS_PORT: number;
/** `code` estable del error de puerto mal formado. */
export const ZEUS_PORT_ERROR_CODE: 'ZEUS_PUERTO_MAL_FORMADO';

/**
 * Configuracion de puerto invalida. Discriminar por `code`, no por
 * `instanceof` (copias duplicadas del paquete rompen `instanceof`).
 */
export class ZeusPortConfigError extends Error {
  code: 'ZEUS_PUERTO_MAL_FORMADO';
  envVar: string;
  rawValue: string;
  motivo: string;
}

/** Valida la forma textual de un puerto sin mirar el entorno. */
export function validarPuerto(
  raw: string
): { ok: true; value: number } | { ok: false; motivo: string };

/**
 * Puerto declarado en `name`, o `fallback` si la clave no esta configurada.
 * **Lanza** `ZeusPortConfigError` si esta declarada pero mal formada
 * (cambio de contrato de WP-U266: antes devolvia siempre un numero).
 */
export function readEnvPort(name: string, fallback: number): number;

/**
 * Como `readEnvPort` con una cadena de nombres (alias legados): gana el primero
 * declarado y **solo se valida el que gana**.
 */
export function readEnvPortAlias(
  names: string[],
  fallback: number,
  env?: Record<string, string | undefined>
): number;
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
export const DEFAULT_ZEUS_INSPECTOR_TOKEN: string;
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
