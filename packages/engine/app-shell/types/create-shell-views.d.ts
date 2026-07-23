/** Types for `@zeus/app-shell/create-shell-views` (WP-U157). */

export function createShellViews(options: {
  uiId: string;
  getAppConfig: () => object;
  resolveDataDir: (config?: object) => string;
  getBrand?: (config: object) => { title: string; tag?: string; footer?: string };
  buildLocalNavEntries?: () => Array<{
    href: string;
    emoji: string;
    text: string;
    pageKey: string;
  }>;
  defaultCurrentPage?: string;
  getDefaultTheme: () => string;
}): {
  template: (pageTitle: string, content: unknown, viewOptions?: Record<string, unknown>) => string;
  navLink: (...args: unknown[]) => unknown;
  pageContainer: (...args: unknown[]) => unknown;
  contentSection: (...args: unknown[]) => unknown;
};
