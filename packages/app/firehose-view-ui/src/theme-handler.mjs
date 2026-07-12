import { createThemeHandler } from '@zeus/app-shell';
import { getAppConfig, setTheme, getDefaultTheme } from './config.mjs';

export const ThemeHandler = createThemeHandler({ getAppConfig, setTheme, getDefaultTheme });
