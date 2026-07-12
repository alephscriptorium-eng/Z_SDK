import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';
import { ErrorPlain } from '@zeus/http-contract';

const ThemeConfig = z.object({
  theme: z.unknown()
});

const ThemesList = z.object({
  themes: z.array(z.unknown()),
  current: z.string()
});

const ThemeCurrent = z.object({
  current: z.string()
});

const ThemeSwitchBody = z.object({
  theme: z.string().min(1)
});

const ThemeSwitchResult = z.object({
  success: z.boolean().optional(),
  current: z.string().optional(),
  previous: z.string().optional()
});

/**
 * Theme routes mounted at `/api` by Zeus UIs.
 * @param {{ prefix?: string, includeConfig?: boolean }} [opts]
 */
export function THEME_ROUTES(opts = {}) {
  const prefix = opts.prefix ?? '';
  const routes = [];

  if (opts.includeConfig !== false) {
    routes.push({
      id: 'theme.config',
      method: 'GET',
      path: `${prefix}/config`,
      summary: 'Public theme slice of app config',
      tags: ['theme'],
      responses: { 200: ThemeConfig },
      envelope: 'plain'
    });
  }

  routes.push(
    {
      id: 'theme.list',
      method: 'GET',
      path: `${prefix}/themes`,
      summary: 'List available themes',
      tags: ['theme'],
      responses: { 200: ThemesList },
      envelope: 'plain'
    },
    {
      id: 'theme.current',
      method: 'GET',
      path: `${prefix}/theme`,
      summary: 'Current theme name',
      tags: ['theme'],
      responses: { 200: ThemeCurrent },
      envelope: 'plain'
    },
    {
      id: 'theme.switch',
      method: 'POST',
      path: `${prefix}/theme/switch`,
      summary: 'Switch active theme',
      tags: ['theme'],
      request: { body: ThemeSwitchBody },
      responses: { 200: ThemeSwitchResult },
      envelope: 'plain'
    }
  );

  return defineRoutes('ui-kit', routes);
}

export const ThemeSchemas = {
  ThemeConfig,
  ThemesList,
  ThemeCurrent,
  ThemeSwitchBody,
  ThemeSwitchResult,
  ErrorPlain
};
