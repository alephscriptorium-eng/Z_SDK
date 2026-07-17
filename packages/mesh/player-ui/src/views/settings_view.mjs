import { p, section, a } from 'hyperaxe';
import { template, pageContainer, contentSection } from './main_views.mjs';
import { getConfig } from '../config.mjs';
import { resolveSpecToolPorts, resolveZeusHost } from '@zeus/presets-sdk/env';

export function settingsView() {
  const config = getConfig();
  const { studio } = resolveSpecToolPorts();
  const host = resolveZeusHost();
  const studioUrl = `http://${host}:${studio}`;

  return template(
    'Settings',
    pageContainer(
      contentSection(
        'Tablero settings',
        section({ class: 'settings-page' },
          p({}, `Current theme: ${config.theme?.current || 'default'}`),
          p({ class: 'text-muted' },
            'Switch themes from the header selector. Discovery URLs and deck defaults are configured in the Presets Editor settings page.'
          ),
          section({ class: 'settings-docs-links' },
            p({ class: 'settings-section-title' }, 'API & Docs'),
            p({}, a({ href: '/docs', target: '_blank' }, 'Swagger UI — REST API')),
            p({}, a({ href: '/spec/openapi.json', target: '_blank' }, 'OpenAPI JSON')),
            p({}, a({ href: '/spec/asyncapi.json', target: '_blank' }, 'AsyncAPI JSON (session)')),
            p({}, a({ href: '/spec/session-manifest.json', target: '_blank' }, 'Session manifest JSON')),
            p({}, a({ href: studioUrl, target: '_blank', rel: 'noopener noreferrer' }, 'AsyncAPI Studio'))
          )
        )
      )
    ),
    { currentPage: 'settings' }
  );
}
