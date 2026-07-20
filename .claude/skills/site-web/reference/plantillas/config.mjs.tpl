import { defineConfig } from 'vitepress';

/**
 * Plantilla skill site-web.
 * Sustituir {{TITLE}} {{DESC}} {{BASE_ENV}}.
 * Guard MSYS = frágil #2.
 */
function resolveDocsBase() {
  const raw = process.env.{{BASE_ENV}}?.trim();
  if (raw) {
    if (/^[A-Za-z]:[\\/]/.test(raw)) return '/';
    const cleaned = raw.replace(/^\/+|\/+$/g, '');
    return cleaned ? `/${cleaned}/` : '/';
  }
  return '/';
}

export default defineConfig({
  title: '{{TITLE}}',
  description: '{{DESC}}',
  lang: 'es',
  base: resolveDocsBase(),
  cleanUrls: true,
  ignoreDeadLinks: false,
  themeConfig: {
    nav: [{ text: 'Portada', link: '/' }],
    sidebar: [
      {
        text: '{{TITLE}}',
        items: [{ text: 'Portada', link: '/' }]
      }
    ],
    outline: { level: [2, 3] },
    search: { provider: 'local' }
  }
});
