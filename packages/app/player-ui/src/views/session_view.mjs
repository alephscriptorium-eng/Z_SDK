/**
 * Session debug page — focus-based object explorer.
 */

import { div, h2, p, span, section, a } from 'hyperaxe';
import { template, pageContainer, contentSection } from './main_views.mjs';
import { getConfig } from '../config.mjs';
import { getAlephConfig } from '../aleph-bridge.mjs';
import { resolveSpecToolPorts, resolveZeusHost, resolvePlayerDebugEndpoint } from '@zeus/presets-sdk/env';

/**
 * @param {object} [viewData]
 * @param {string[]} [viewData.themes]
 * @param {string} [viewData.currentTheme]
 * @param {boolean} [viewData.debugEnabled]
 */
export function sessionView(viewData = {}) {
  const config = getConfig();
  const aleph = getAlephConfig(config);
  const { studio } = resolveSpecToolPorts();
  const host = resolveZeusHost();
  const studioUrl = `http://${host}:${studio}`;
  const debugMonitorPort = resolvePlayerDebugEndpoint().port;
  const {
    themes = [],
    currentTheme = config.theme?.current,
    debugEnabled = config.debug === true
  } = viewData;

  return template(
    'Sesión debug',
    pageContainer(
      div({ class: 'session-page' },
        section({ class: 'session-header' },
          div({ class: 'session-header-row action-row' },
            div({ class: 'session-header-titles' },
              h2({ class: 'session-title' }, 'Sesión debug'),
              p({ class: 'session-tag' }, 'Explorador en vivo · socket /session')
            ),
            a({ href: '/', class: 'btn btn-outline' }, 'Volver al Tablero')
          ),
          div({ class: 'session-status-bar action-row' },
            span({ class: 'state-badge', id: 'session-phase-badge', 'data-state': 'idle' }, 'idle'),
            span({ class: 'session-meta', id: 'session-playhead-meta' }, 'año —'),
            span({ class: 'session-meta', id: 'session-sync-meta' }, 'sync —'),
            span({
              class: 'state-badge',
              id: 'session-debug-mode-badge',
              'data-state': debugEnabled ? 'playing' : 'loading',
              hidden: debugEnabled ? undefined : 'hidden'
            }, debugEnabled ? 'debug on' : '')
          ),
          div({ class: 'session-docs-links action-row' },
            a({ href: '/docs', class: 'btn btn-outline btn-small', target: '_blank' }, 'Swagger UI'),
            a({
              href: studioUrl,
              class: 'btn btn-outline btn-small',
              target: '_blank',
              rel: 'noopener noreferrer'
            }, 'AsyncAPI Studio'),
            a({
              href: '/spec/asyncapi.json',
              class: 'btn btn-outline btn-small',
              target: '_blank'
            }, 'AsyncAPI JSON')
          )
        ),
        contentSection(null,
          div({ id: 'session-explorer', class: 'session-explorer-host' })
        ),
        contentSection('Session console',
          div({ id: 'session-console-host' })
        ),
        section({ class: 'mcp-monitor-section' },
          div({
            id: 'mcp-monitor-host',
            'data-debug-mcp-port': String(debugMonitorPort)
          })
        )
      )
    ),
    {
      currentPage: 'session',
      theme: currentTheme || aleph.theme || 'Scriptorium-Skins',
      themes,
      styles: [
        '/assets/styles/object-explorer.css',
        '/assets/styles/mcp-monitor.css',
        '/assets/styles/session.css'
      ],
      scripts: [
        '/assets/js/json-path.js',
        '/assets/js/object-explorer.js',
        '/assets/js/mcp-monitor.js',
        { src: '/assets/js/session-console.js', type: 'module' },
        { src: '/assets/js/session.js', type: 'module' }
      ]
    }
  );
}
