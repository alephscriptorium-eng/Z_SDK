import { defineConfig } from 'vitepress';

/**
 * Zeus SDK docs portal — mapa conceptual engine / editor / mesh / games.
 *
 * base Pages (custom domain z-sdk.escrivivir.co): `/` también en Actions.
 * Local / docs:dev: `/`. Override opcional ZEUS_DOCS_BASE (sin slash
 * inicial: Git Bash/MSYS reescribe rutas tipo `/foo/`).
 */
function resolveDocsBase() {
  const raw = process.env.ZEUS_DOCS_BASE?.trim();
  if (raw) {
    // MSYS path conversion → `C:/Program Files/Git/...` — no es un base válido
    if (/^[A-Za-z]:[\\/]/.test(raw)) return '/';
    const cleaned = raw.replace(/^\/+|\/+$/g, '');
    return cleaned ? `/${cleaned}/` : '/';
  }
  return '/';
}

/**
 * Back-links del mundo (fuente única · WP-U152 / handoff Punto 3).
 * No duplicar estas URLs en páginas markdown.
 */
const SITE_BACK = {
  repo: 'https://github.com/alephscriptorium-eng/Z_SDK',
  registry: 'https://npm.scriptorium.escrivivir.co',
  ci: 'https://github.com/alephscriptorium-eng/Z_SDK/actions'
};

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
      { text: 'Proyecto', link: '/proyecto' },
      { text: 'Contratos', link: '/contracts/asyncapi' },
      { text: 'Playbook', link: '/playbook/' },
      {
        text: 'API HTML',
        // Assets estáticos en public/api (Redoc/OpenAPI) — no páginas
        // VitePress. target/_blank evita que el router SPA + cleanUrls
        // reescriban .html y 404een (U138 / D-29).
        items: [
          {
            text: 'AsyncAPI (protocol)',
            link: '/api/protocol/',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          {
            text: 'OpenAPI · Editor UI',
            link: '/api/editor-ui.html',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          {
            text: 'OpenAPI · Player UI',
            link: '/api/player-ui.html',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          {
            text: 'OpenAPI · Cache Browser',
            link: '/api/cache-browser.html',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          {
            text: 'OpenAPI · Firehose Browser',
            link: '/api/firehose-browser.html',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          {
            text: 'OpenAPI · MCP HTTP',
            link: '/api/mcp-http.html',
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        ]
      }
    ],
    sidebar: [
      {
        text: 'Guía',
        items: [
          { text: 'Arranque rápido', link: '/guide/getting-started' },
          { text: 'Mapa del monorepo', link: '/guide/layout' },
          { text: 'Juegos de referencia', link: '/guide/two-games' },
          { text: 'Handshake externo', link: '/guide/external-handshake' },
          { text: 'Publicar la web', link: '/guide/publicar-la-web' },
          { text: 'Estado del swarm', link: '/guide/estado' },
          { text: 'Proyecto (back)', link: '/proyecto' }
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
    socialLinks: [{ icon: 'github', link: SITE_BACK.repo }],
    outline: { level: [2, 3] },
    search: { provider: 'local' },
    footer: {
      message: [
        'Back:',
        `<a href="${SITE_BACK.repo}">repo</a>`,
        '·',
        `<a href="${SITE_BACK.registry}">registry</a>`,
        '·',
        `<a href="${SITE_BACK.ci}">CI</a>`,
        '·',
        '<a href="/proyecto">proyecto</a>',
        '· Animus Iocandi AIPLv1'
      ].join(' '),
      copyright: 'Scriptorium · Zeus SDK'
    }
  }
});
