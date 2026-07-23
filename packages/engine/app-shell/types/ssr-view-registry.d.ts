/** Types for `@zeus/app-shell/ssr-view-registry` (WP-U157). */

export type LogPanelPlacement = 'stage' | 'split';

export interface ViewDef {
  id: string;
  title: string;
  entry: string;
  emoji: string;
  description: string;
  elements: string[];
  hud: {
    fields?: Array<{ id: string; label: string; value?: string }>;
    note?: string;
    logId?: string;
  } | null;
  logPanel: boolean;
  logPanelPlacement: LogPanelPlacement;
  styles: string[];
  defaultRoom: string | null;
  [key: string]: unknown;
}

export function defineView(def: {
  id: string;
  title?: string;
  entry: string;
  emoji?: string;
  description?: string;
  elements?: string[];
  hud?: ViewDef['hud'];
  logPanel?: boolean;
  logPanelPlacement?: LogPanelPlacement;
  styles?: string[];
  defaultRoom?: string | null;
  [key: string]: unknown;
}): ViewDef;

export function createViewRegistry(defs?: ViewDef[]): {
  list: () => ViewDef[];
  get: (id: string) => ViewDef | null;
  has: (id: string) => boolean;
};

export function renderViewLayout(
  view: ViewDef,
  ctx: {
    template: (title: string, content: unknown, opts?: object) => string;
    importMap: object;
    viewerConfig: object;
    themes?: string[];
    currentTheme?: string;
  }
): string;
