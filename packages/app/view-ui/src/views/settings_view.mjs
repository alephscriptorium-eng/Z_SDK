import { p, section, a } from 'hyperaxe';
import { template, pageContainer, contentSection } from './main_views.mjs';
import { getConfig } from '../config.mjs';

export function settingsView() {
  const config = getConfig();

  return template(
    'Settings',
    pageContainer(
      contentSection(
        'Cache Explorer settings',
        section({ class: 'settings-page' },
          p({}, `Current theme: ${config.theme?.current || 'default'}`),
          p({}, `Default línea: ${config.defaultLinea || 'espana'}`),
          p({ class: 'text-muted' },
            'Switch themes from the header selector. Viewer handlers and discovery are configured in config.json or the Presets Editor.'
          ),
          section({ class: 'settings-docs-links' },
            p({ class: 'settings-section-title' }, 'API & Docs'),
            p({}, a({ href: '/docs', target: '_blank' }, 'Swagger UI — REST API')),
            p({}, a({ href: '/spec/openapi.json', target: '_blank' }, 'OpenAPI JSON'))
          )
        )
      )
    ),
    { currentPage: 'settings' }
  );
}
