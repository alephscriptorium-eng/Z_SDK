/** Types for `@zeus/ui-kit/theme-contract` (WP-U157). */

import type { RouteEntry, ZodTypeAny } from '@zeus/http-contract';

export function THEME_ROUTES(opts?: {
  prefix?: string;
  includeConfig?: boolean;
}): RouteEntry[];

export const ThemeSchemas: {
  ThemeConfig: ZodTypeAny;
  ThemesList: ZodTypeAny;
  ThemeCurrent: ZodTypeAny;
  ThemeSwitchBody: ZodTypeAny;
  ThemeSwitchResult: ZodTypeAny;
  ErrorPlain: ZodTypeAny;
};
