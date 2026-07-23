/** Types for `@zeus/app-shell/create-app-config` (WP-U157). */

export function stripVolatileConfig(config: object): object;

export function resolveRuntimeConfig(
  fileConfig: object,
  ctx: {
    appId: string;
    packageDir: string;
    appBase: object;
    defaultPort?: number;
  }
): object;

export function createAppConfig(options: {
  appId: string;
  defaultPort?: number;
  features?: object;
  extraDefaults?: object;
  importMetaUrl: string;
  configFileName?: string;
}): {
  packageDir: string;
  getAppConfig: () => object;
  getConfig: () => object;
  updateConfig: (newConfig: object) => object;
  setTheme: (name: string) => object;
  updateSection: (section: string, value: object) => object;
  getSectionDefaults: (section: string) => object;
  resolveDataDir: (config?: object) => string;
  resolveBasePath: (config?: object) => string;
  getViewersConfig: (config?: object) => object;
  getDefaultTheme: () => string;
  getLocalNavEntries: (config?: object) => unknown[];
};
