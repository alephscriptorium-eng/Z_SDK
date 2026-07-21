/**
 * Excepciones justificadas de los gates de prácticas (WP-U00).
 *
 * Regla (PRACTICAS §5): nunca desactivar un gate. Si hace falta una excepción
 * legítima, se anota AQUÍ con comentario de por qué.
 *
 * Formato:
 * - `path` relativo al root del monorepo (con `/`, sin leading `./`) — archivo exacto
 * - `pathPrefix` / `pathPrefixes`: clase de paths (prefijo con `/` final); preferir
 *   CLASE sobre instancia suelta cuando el custodio lo decida (HOTFIX-ARG-1 ← GATES-2)
 * - `rule`: 'ports' | 'transition' | 'arg-import' | 'two-games' | 'google-stun'
 * - `reason`: por qué está permitido (obligatorio)
 * - `line` (opcional): si se omite, aplica a todo el archivo/clase para esa regla
 */

/** @typedef {'ports'|'transition'|'arg-import'|'two-games'|'google-stun'} GateRule */

/**
 * @typedef {object} GateException
 * @property {GateRule} rule
 * @property {string} reason
 * @property {string} [path]
 * @property {string} [pathPrefix]
 * @property {string[]} [pathPrefixes]
 * @property {number} [line]
 */

/**
 * @type {GateException[]}
 */
export const EXCEPTIONS = [
  // --- (a) puertos/URLs hardcodeados fuera de presets-sdk/env ---
  // Fallbacks preexistentes que duplican DEFAULT_ZEUS_* hasta que un WP
  // posterior los retire (no es demolición de U00).
  {
    path: 'packages/mesh/linea-firehose/src/config.mjs',
    rule: 'ports',
    reason: 'DEFAULT_PORT 3008 pre-U00; espejo de DEFAULT_ZEUS_MCP.firehose.disk'
  },
  {
    path: 'packages/mesh/linea-firehose/src/start.mjs',
    rule: 'ports',
    reason: 'comentario de cabecera cita default 3008'
  },
  {
    path: 'packages/editor/editor-ui/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3012 pre-U00; mesh canónico en presets-sdk/env'
  },
  {
    path: 'packages/mesh/player-ui/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3013 pre-U00'
  },
  {
    path: 'packages/mesh/player-ui/src/views/deck_view.mjs',
    rule: 'ports',
    reason: 'fallback scriptorium 3017 si mesh vacío; pre-U00'
  },
  {
    path: 'packages/mesh/player-ui/src/link-recipes/firehose-link-recipes.mjs',
    rule: 'ports',
    reason: 'JSDoc cita :3016; no es bind'
  },
  {
    path: 'packages/mesh/player-ui/src/aleph-routes.mjs',
    rule: 'ports',
    reason: 'resolveAppPort fallback 3015 pre-U00'
  },
  {
    path: 'packages/mesh/player-3d-ui/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3018 pre-U00'
  },
  {
    path: 'examples/ping-pong-bots/launch.mjs',
    rule: 'ports',
    reason: 'fallback ZEUS_SCRIPTORIUM_URL localhost:3017 en log; pre-U00'
  },
  {
    path: 'packages/mesh/cache-browser/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3015 pre-U00'
  },
  {
    path: 'packages/mesh/firehose-browser/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3016 pre-U00'
  },
  {
    path: 'packages/mesh/firehose-browser/src/views/firehose_view.mjs',
    rule: 'ports',
    reason: 'texto UI menciona MCP :3008; no es bind'
  },
  {
    path: 'packages/mesh/3d-monitor/src/server.mjs',
    rule: 'ports',
    reason: 'fallback ?? 3019 pre-U00'
  },
  {
    path: 'packages/mesh/console-monitor/src/config.mjs',
    rule: 'ports',
    reason: 'fallback scriptorium 3017 si mesh vacío; pre-U00'
  },
  {
    path: 'packages/engine/rooms/src/config.mjs',
    rule: 'ports',
    reason: 'fallback ZEUS_SCRIPTORIUM_URL localhost:3017; pre-U00'
  },
  {
    path: 'packages/engine/room-client-browser/src/index.mjs',
    rule: 'ports',
    reason: 'fallback scriptorium 3017 si mesh vacío; pre-U00'
  },
  {
    path: 'packages/engine/room-client-browser/browser/dev-room-config.mjs',
    rule: 'ports',
    reason: 'config de desarrollo con URL de ejemplo; pre-U00'
  },
  {
    path: 'packages/engine/room-client-browser/browser/room-client.browser.mjs',
    rule: 'ports',
    reason: 'JSDoc ejemplo localhost:3017; pre-U00'
  },
  {
    path: 'packages/engine/app-shell/src/create-app-config.mjs',
    rule: 'ports',
    reason: 'fallback genérico 3000 si no hay mesh; pre-U00'
  },
  {
    path: 'packages/engine/http-contract/src/endpoint.mjs',
    rule: 'ports',
    reason: 'fallback genérico 3000 si appId desconocido; pre-U00'
  },
  {
    path: 'packages/engine/presets-sdk/src/mcp/runtime.mjs',
    rule: 'ports',
    reason: 'JSDoc ejemplo localhost:4101; no es default de bind'
  },
  {
    path: 'packages/engine/test-utils/src/fetch-and-validate.mjs',
    rule: 'ports',
    reason: 'JSDoc ejemplo localhost:3013; util de test helpers'
  },
  {
    path: 'packages/mesh/linea-system/src/lineas.mjs',
    rule: 'ports',
    reason: 'catálogo local de lineas con ports espejo de DEFAULT_ZEUS_MCP; pre-U00'
  },
  {
    path: 'packages/mesh/solar-system/src/bodies.mjs',
    rule: 'ports',
    reason: 'catálogo local de bodies con ports espejo de DEFAULT_ZEUS_MCP; pre-U00'
  },
  {
    path: 'packages/mesh/operator-ui/projects/dev-app/src/app/zeus-operator-bridge.service.ts',
    rule: 'ports',
    reason: 'comentario TypeScript e.g. localhost:3017; pre-U00'
  },
  {
    path: 'packages/mesh/cache-browser/assets/js/cache-browser.js',
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
    path: 'packages/engine/http-contract/src/envelope.mjs',
    rule: 'transition',
    reason: 'comentario «firehose legacy» en envelope plano; pre-U00'
  },
  {
    path: 'packages/mesh/operator-ui/projects/threejs-ui-lib/src/lib/components/threejs-scene-pure.component.spec.ts',
    rule: 'transition',
    reason: 'nombre de test «without legacy AlephScript»; pre-U00'
  },

  // (c) arg-import: post-U61 sin imports estáticos @zeus/arg-* en monorepo

  // (d) two-games: catálogo canónico de puertos de juego en presets-sdk/env
  // (BACKLOG WP-U109; precedente argPlayer). No meter conceptos de juego
  // fuera de este catálogo.
  {
    path: 'packages/engine/presets-sdk/src/env/index.mjs',
    rule: 'two-games',
    reason:
      'WP-U109: slots pozoPlayer/pozoView en catálogo env (BACKLOG); espejo de argPlayer'
  },

  // HOTFIX-ARG-1 (2026-07-21) ← lección GATES-2: excepción por CLASE, no
  // instancia suelta. Token `\bdelta\b` del gate two-games (D-8) choca con el
  // léxico genérico state-delta / GAME_STATE_DELTA (protocolo v0.2, Z05-f1) y
  // con usos derivados en kits de lectura (ParteDeCiudad.delta / DeltaBarrio /
  // state-patch). No es el nombre del juego «delta»; no se reabre Z05-f1 ni
  // A01/A03; no se renombra el contrato. Gate intacto: pathPrefixes de clase,
  // no desactivación.
  {
    pathPrefixes: [
      'packages/engine/protocol/',
      'packages/engine/authority-kit/',
      'packages/engine/parte-kit/'
    ],
    rule: 'two-games',
    reason:
      'D-8/clase (HOTFIX-ARG-1←GATES-2): «delta» = léxico state-delta / kits de lectura derivados del protocolo; no nombre de juego'
  },
  {
    path: 'packages/engine/game-engine/src/map-engine.mjs',
    rule: 'two-games',
    reason:
      'D-8: «Delta» en JSDoc de getDelta = diff de snapshot map-engine, no juego delta'
  }
];
