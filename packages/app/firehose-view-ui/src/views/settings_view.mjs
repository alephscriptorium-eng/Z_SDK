import { p, section, a } from 'hyperaxe';
import { template, pageContainer, contentSection } from './main_views.mjs';
import { getConfig } from '../config.mjs';

export function settingsView() {
  const config = getConfig();

  return template(
    'Settings',
    pageContainer(
      contentSection(
        'Firehose settings',
        section({ class: 'settings-page' },
          p({}, `Current theme: ${config.theme?.current || 'default'}`),
          p({ class: 'text-muted' },
            'Switch themes from the header selector. Volume and corpus defaults are configured in config.json.'
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
