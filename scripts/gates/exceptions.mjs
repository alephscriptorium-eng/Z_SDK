/**
 * Excepciones justificadas de los gates de prácticas (WP-U00).
 *
 * Regla (PRACTICAS §5): nunca desactivar un gate. Si hace falta una excepción
 * legítima, se anota AQUÍ con comentario de por qué.
 *
 * Formato:
 * - `path` relativo al root del monorepo (con `/`, sin leading `./`)
 * - `rule`: 'ports' | 'transition' | 'arg-import' | 'two-games'
 * - `reason`: por qué está permitido (obligatorio)
 * - `line` (opcional): si se omite, aplica a todo el archivo para esa regla
 */

/** @typedef {'ports'|'transition'|'arg-import'|'two-games'} GateRule */

/**
 * @type {Array<{ path: string, rule: GateRule, reason: string, line?: number }>}
 */
export const EXCEPTIONS = [
  // --- (a) puertos/URLs hardcodeados fuera de presets-sdk/env ---
  // Fallbacks preexistentes que duplican DEFAULT_ZEUS_* hasta que un WP
  // posterior los retire (no es demolición de U00).
  {
    path: 'packages/arg/arg-console/src/config.mjs',
    rule: 'ports',
    reason: 'DEFAULT_*_PORT pre-U00; defaults canónicos viven en presets-sdk/env'
  },
  {
    path: 'packages/arg/arg-console/src/server.mjs',
    rule: 'ports',
    reason: 'comentario de cabecera cita :3021; puerto real sale de config'
  },
  {
    path: 'packages/arg/arg-demos/launch.mjs',
    rule: 'ports',
    reason: 'fallback ZEUS_PORT_* pre-U00; pendiente alinear con resolveZeusUiPorts'
  },
  {
    path: 'packages/arg/arg-feeds/src/real.mjs',
    rule: 'ports',
    reason: 'comentario de cabecera cita puertos MCP; no hay literal de bind'
  },
  {
    path: 'packages/mcp/linea-firehose/src/config.mjs',
    rule: 'ports',
    reason: 'DEFAULT_PORT 3008 pre-U00; espejo de DEFAULT_ZEUS_MCP.firehose.disk'
  },
  {
    path: 'packages/mcp/linea-firehose/src/start.mjs',
    rule: 'ports',
    reason: 'comentario de cabecera cita default 3008'
  },
  {
    path: 'packages/app/editor-ui/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3012 pre-U00; mesh canónico en presets-sdk/env'
  },
  {
    path: 'packages/app/player-ui/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3013 pre-U00'
  },
  {
    path: 'packages/app/player-ui/src/views/deck_view.mjs',
    rule: 'ports',
    reason: 'fallback scriptorium 3017 si mesh vacío; pre-U00'
  },
  {
    path: 'packages/app/player-ui/src/link-recipes/firehose-link-recipes.mjs',
    rule: 'ports',
    reason: 'JSDoc cita :3016; no es bind'
  },
  {
    path: 'packages/app/player-ui/src/aleph-routes.mjs',
    rule: 'ports',
    reason: 'resolveAppPort fallback 3015 pre-U00'
  },
  {
    path: 'packages/app/player-3d-ui/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3018 pre-U00'
  },
  {
    path: 'packages/app/ping-pong-bots/launch.mjs',
    rule: 'ports',
    reason: 'fallback ZEUS_SCRIPTORIUM_URL localhost:3017 en log; pre-U00'
  },
  {
    path: 'packages/platform/cache-browser/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3015 pre-U00'
  },
  {
    path: 'packages/platform/firehose-browser/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3016 pre-U00'
  },
  {
    path: 'packages/platform/firehose-browser/src/views/firehose_view.mjs',
    rule: 'ports',
    reason: 'texto UI menciona MCP :3008; no es bind'
  },
  {
    path: 'packages/platform/3d-monitor/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3019 pre-U00'
  },
  {
    path: 'packages/platform/console-monitor/src/config.mjs',
    rule: 'ports',
    reason: 'fallback scriptorium 3017 si mesh vacío; pre-U00'
  },
  {
    path: 'packages/lib/rooms/src/config.mjs',
    rule: 'ports',
    reason: 'fallback ZEUS_SCRIPTORIUM_URL localhost:3017; pre-U00'
  },
  {
    path: 'packages/lib/room-client-browser/src/index.mjs',
    rule: 'ports',
    reason: 'fallback scriptorium 3017 si mesh vacío; pre-U00'
  },
  {
    path: 'packages/lib/room-client-browser/browser/dev-room-config.mjs',
    rule: 'ports',
    reason: 'config de desarrollo con URL de ejemplo; pre-U00'
  },
  {
    path: 'packages/lib/room-client-browser/browser/room-client.browser.mjs',
    rule: 'ports',
    reason: 'JSDoc ejemplo localhost:3017; pre-U00'
  },
  {
    path: 'packages/lib/session-protocol/src/room-session-client.mjs',
    rule: 'ports',
    reason: 'JSDoc ejemplo localhost:3017; pre-U00'
  },
  {
    path: 'packages/lib/app-shell/src/create-app-config.mjs',
    rule: 'ports',
    reason: 'fallback genérico 3000 si no hay mesh; pre-U00'
  },
  {
    path: 'packages/lib/http-contract/src/endpoint.mjs',
    rule: 'ports',
    reason: 'fallback genérico 3000 si appId desconocido; pre-U00'
  },
  {
    path: 'packages/arg/arg-player-mcp/src/index.mjs',
    rule: 'ports',
    reason: 'comentario de cabecera cita :4121/:4122; bind vía env'
  },
  {
    path: 'packages/arg/arg-player-mcp/src/start.mjs',
    rule: 'ports',
    reason: 'comentario de cabecera cita puertos MCP arg; bind vía env'
  },
  {
    path: 'packages/lib/presets-sdk/src/mcp/runtime.mjs',
    rule: 'ports',
    reason: 'JSDoc ejemplo localhost:4101; no es default de bind'
  },
  {
    path: 'packages/lib/test-utils/src/fetch-and-validate.mjs',
    rule: 'ports',
    reason: 'JSDoc ejemplo localhost:3013; util de test helpers'
  },
  {
    path: 'packages/mcp/linea-system/src/lineas.mjs',
    rule: 'ports',
    reason: 'catálogo local de lineas con ports espejo de DEFAULT_ZEUS_MCP; pre-U00'
  },
  {
    path: 'packages/mcp/solar-system/src/bodies.mjs',
    rule: 'ports',
    reason: 'catálogo local de bodies con ports espejo de DEFAULT_ZEUS_MCP; pre-U00'
  },
  {
    path: 'packages/operator-ui/projects/dev-app/src/app/zeus-session-bridge.service.ts',
    rule: 'ports',
    reason: 'comentario TypeScript e.g. localhost:3017; pre-U00'
  },
  {
    path: 'packages/platform/cache-browser/assets/js/cache-browser.js',
    rule: 'ports',
    reason: 'fallback || 3013 en browser asset; pre-U00'
  },
  {
    path: 'scripts/smoke-dual-ui.mjs',
    rule: 'ports',
    reason: 'mensaje de smoke cite :3018/:3020; script de verificación'
  },

  // --- (b) nombres de transición ---
  // Dominio Wikipedia: «oldid» NO es sufijo de transición (-old); se excluye
  // por patrón en el scanner. Aquí van legacy/v2 preexistentes.
  {
    path: 'packages/lib/session-domain/src/manifest.mjs',
    rule: 'transition',
    reason: 'API LegacySessionSnapshot / buildSessionManifest(legacy) pre-U00; ola 3 absorbe'
  },
  {
    path: 'packages/lib/session-protocol/src/projection/project-slice.mjs',
    rule: 'transition',
    reason: 'comentarios SessionManifest v2; versión de protocolo, no carpeta -v2'
  },
  {
    path: 'packages/lib/http-contract/src/envelope.mjs',
    rule: 'transition',
    reason: 'comentario «firehose legacy» en envelope plano; pre-U00'
  },
  {
    path: 'packages/app/player-ui/src/session-machine.mjs',
    rule: 'transition',
    reason: 'variable legacy + comentario v2 snapshot; pre-U00 hasta ola 3'
  },
  {
    path: 'packages/app/player-ui/src/session-transport.mjs',
    rule: 'transition',
    reason: 'comentario histórico cutover; pre-U00'
  },
  {
    path: 'packages/operator-ui/projects/threejs-ui-lib/src/lib/components/threejs-scene-pure.component.spec.ts',
    rule: 'transition',
    reason: 'nombre de test «without legacy AlephScript»; pre-U00'
  },

  // --- (c) imports de packages/arg fuera de arg ---
  {
    path: 'packages/platform/cache-browser/src/server.mjs',
    rule: 'arg-import',
    reason: 'suscripción ARG track vía @zeus/arg-domain; se corta al mover games/ (ola 5)'
  },
  {
    path: 'packages/platform/cache-browser/src/arg-track-subscriber.mjs',
    rule: 'arg-import',
    reason: 'puente mesh→ARG pre-layout games/; ola 5'
  },
  {
    path: 'packages/platform/firehose-browser/src/server.mjs',
    rule: 'arg-import',
    reason: 'suscripción ARG track vía @zeus/arg-domain; ola 5'
  },
  {
    path: 'packages/platform/firehose-browser/src/arg-track-subscriber.mjs',
    rule: 'arg-import',
    reason: 'puente mesh→ARG pre-layout games/; ola 5'
  }
];
