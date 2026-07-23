/** Types for `@zeus/ui-kit` (WP-U157). */

export const assetsDir: string;

export function template(
  title: string,
  content: unknown,
  opts?: Record<string, unknown>
): string;
export function navLink(
  href: string,
  text: string,
  opts?: Record<string, unknown>
): unknown;
export function pageContainer(...children: unknown[]): unknown;
export function contentSection(...children: unknown[]): unknown;

export function shellHeader(opts?: Record<string, unknown>): unknown;
export function shellFooter(opts?: Record<string, unknown>): unknown;
export function buildGlobalNav(opts?: Record<string, unknown>): unknown;
export function buildLocalNav(
  entries: Array<{ href: string; emoji?: string; text: string; pageKey?: string }>,
  currentPage?: string
): unknown;

export declare class ThemeHandler {
  constructor(opts?: Record<string, unknown>);
  getDefaultTheme(): string;
  listThemes(): string[];
  setTheme(name: string): unknown;
  getTheme(name?: string): unknown;
  [key: string]: unknown;
}

export const DEFAULT_THEME: string;
export const DEFAULT_THEMES: readonly string[];

export function createThemeRoutes(opts?: Record<string, unknown>): unknown;

export function mountFavicon(app: unknown, opts?: Record<string, unknown>): void;
export function faviconPath(): string;
export const FAVICON_HREF: string;

export function openViewerLink(opts?: Record<string, unknown>): unknown;
export function openViewerButton(opts?: Record<string, unknown>): unknown;
export function viewerLauncherMenu(opts?: Record<string, unknown>): unknown;
export function viewerLauncherSlot(opts?: Record<string, unknown>): unknown;

export const ZEUS_COMPANY: string;
export const ZEUS_PRODUCT: string;
export const ZEUS_LICENSE_LABEL: string;
export function formatShellTag(tag?: string): string;
export function formatShellFooter(opts?: Record<string, unknown>): string;
export function defaultShellBrand(opts?: Record<string, unknown>): {
  title: string;
  tag?: string;
  footer?: string;
};
