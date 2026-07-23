/** Types for `@zeus/app-shell/create-theme-handler` (WP-U157). */

export function createThemeHandler(options: {
  getAppConfig: () => object;
  setTheme: (name: string) => object;
  getDefaultTheme: () => string;
}): new () => {
  getDefaultTheme?: () => string;
  listThemes?: () => string[];
  setTheme?: (name: string) => unknown;
  getTheme?: (name?: string) => unknown;
  [key: string]: unknown;
};
