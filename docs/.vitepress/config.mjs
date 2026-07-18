import { defineConfig } from 'vitepress';

/**
 * Zeus SDK docs portal — layout objetivo engine / editor / mesh / games.
 * El move físico de carpetas es WP-U51; aquí documentamos el mapa conceptual.
 *
 * base Pages (proyecto Z_SDK): `/Z_SDK/` en GitHub Actions.
 * Local / docs:dev: `/`. Override opcional ZEUS_DOCS_BASE=Z_SDK (sin slash
 * inicial: Git Bash/MSYS reescribe rutas tipo `/Z_SDK/`).
 */
function resolveDocsBase() {
  const raw = process.env.ZEUS_DOCS_BASE?.trim();
  if (raw) {
    // MSYS path conversion → `C:/Program Files/Git/...` — no es un base válido
    if (/^[A-Za-z]:[\\/]/.test(raw)) return '/Z_SDK/';
    const cleaned = raw.replace(/^\/+|\/+$/g, '');
    return cleaned ? `/${cleaned}/` : '/';
  }
  if (process.env.GITHUB_ACTIONS === 'true') return '/Z_SDK/';
  return '/';
}

export default defineConfig({
  title: 'Zeus SDK',
  description:
    'SDK para crear juegos: contrato único, autoridad, MCP por actor, playbook CASOS',
  lang: 'es',
  base: resolveDocsBase(),
  cleanUrls: true,
  ignoreDeadLinks: false,
  themeConfig: {
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Guía', link: '/guide/getting-started' },
      { text: 'Contratos', link: '/contracts/asyncapi' },
      { text: 'Playbook', link: '/playbook/' },
      {
        text: 'API HTML',
        items: [
          { text: 'AsyncAPI (protocol)', link: '/api/protocol/' },
          { text: 'OpenAPI · Editor UI', link: '/api/editor-ui.html' },
          { text: 'OpenAPI · Player UI', link: '/api/player-ui.html' },
          { text: 'OpenAPI · Cache Browser', link: '/api/cache-browser.html' },
          { text: 'OpenAPI · Firehose Browser', link: '/api/firehose-browser.html' },
          { text: 'OpenAPI · MCP HTTP', link: '/api/mcp-http.html' }
        ]
      }
    ],
    sidebar: [
      {
        text: 'Guía',
        items: [
          { text: 'Arranque rápido', link: '/guide/getting-started' },
          { text: 'Mapa del monorepo', link: '/guide/layout' },
          { text: 'Dos juegos (D-8)', link: '/guide/two-games' },
          { text: 'Handshake externo', link: '/guide/external-handshake' }
        ]
      },
      {
        text: 'Engine',
        items: [
          { text: 'Visión', link: '/engine/' },
          { text: 'Contrato único', link: '/engine/protocol' },
          { text: 'Authority kit', link: '/engine/authority-kit' },
          { text: 'Player MCP kit', link: '/engine/player-mcp-kit' },
          { text: 'Playbook kit', link: '/engine/playbook-kit' },
          { text: 'View kit', link: '/engine/view-kit' },
          { text: 'HTTP contract', link: '/engine/http-contract' },
          { text: 'Rooms y presets', link: '/engine/rooms-presets' }
        ]
      },
      {
        text: 'Editor',
        items: [{ text: 'Mundo A — crear', link: '/editor/' }]
      },
      {
        text: 'Mesh',
        items: [{ text: 'Mundo B — operar', link: '/mesh/' }]
      },
      {
        text: 'Games',
        items: [
          { text: 'Visión', link: '/games/' },
          { text: 'delta (ARG)', link: '/games/delta' },
          { text: 'pozo', link: '/games/pozo' }
        ]
      },
      {
        text: 'Contratos generados',
        items: [
          { text: 'AsyncAPI', link: '/contracts/asyncapi' },
          { text: 'OpenAPI / Redoc', link: '/contracts/openapi' },
          { text: 'Resources MCP', link: '/contracts/mcp-resources' }
        ]
      },
      {
        text: 'Método',
        items: [{ text: 'Playbook CASOS', link: '/playbook/' }]
      }
    ],
    socialLinks: [],
    outline: { level: [2, 3] },
    search: { provider: 'local' },
    footer: {
      message: 'Animus Iocandi AIPLv1',
      copyright: 'Scriptorium · Zeus SDK'
    }
  }
});
