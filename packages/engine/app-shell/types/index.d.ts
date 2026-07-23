/** Types for `@zeus/app-shell` (WP-U157). */

export {
  createAppConfig,
  resolveRuntimeConfig,
  stripVolatileConfig
} from './create-app-config.js';

export { createThemeHandler } from './create-theme-handler.js';
export { createShellViews } from './create-shell-views.js';
export {
  defineView,
  createViewRegistry,
  renderViewLayout
} from './ssr-view-registry.js';
