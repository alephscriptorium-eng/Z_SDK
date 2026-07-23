/** Types for `@zeus/view-kit` (WP-U157). */

export function createViewerScene(options?: Record<string, unknown>): ViewerScene;
export function setText(el: Element | null, text: string): void;
export function createCounters(root: Element | null): CountersApi;
export function readViewerConfig(elementId?: string): Record<string, unknown>;
export function connectRoom(
  cfg: Record<string, unknown>,
  handlers?: Record<string, unknown>
): unknown;
export function onChannelEvent(
  client: unknown,
  eventName: string,
  handler: (payload: unknown, meta?: unknown) => void
): () => void;
export function createLabelSprite(
  text: string,
  opts?: Record<string, unknown>
): unknown;
export function createGlowSprite(opts?: Record<string, unknown>): unknown;
export function createLogPanel(opts?: Record<string, unknown>): LogPanelApi;

export function basePose(): StickPose;
export function additivePose(a: StickPose, b: StickPose, weight?: number): StickPose;
export function blendPose(a: StickPose, b: StickPose, t: number): StickPose;
export function zeroPose(): StickPose;
export function emoteWeight(name: string, t: number): number;
export const STICK_POSES: Readonly<Record<string, StickPose>>;
export const STICK_EMOTES: Readonly<Record<string, unknown>>;
export const EMOTE_DURATION_SEC: number;

export function createStickPuppet(opts?: Record<string, unknown>): StickPuppetApi;
export function colorForActorId(actorId: string): number | string;
export function createActorsLayer(opts?: Record<string, unknown>): ActorsLayerApi;
export function createHorseClient(opts?: Record<string, unknown>): HorseClientApi;
export function resolvePresetOfferBrowser(
  offer: unknown,
  opts?: Record<string, unknown>
): unknown;

export function renderContactMenu(
  root: Element,
  state: Record<string, unknown>,
  opts?: Record<string, unknown>
): void;
export function bindContactMenu(
  root: Element,
  handlers: Record<string, unknown>
): () => void;
export function formatContactLive(live: unknown): string;
export function setContactLive(root: Element, live: unknown): void;

export function renderCloakInventory(
  root: Element,
  state: Record<string, unknown>,
  opts?: Record<string, unknown>
): void;
export function bindCloakInventory(
  root: Element,
  handlers: Record<string, unknown>
): () => void;
export function fetchPresetSummaries(
  opts?: Record<string, unknown>
): Promise<unknown[]>;

export function createPanel(opts?: Record<string, unknown>): PanelApi;
export function panelStorageKey(id: string): string;
export function loadPanelState(id: string): Record<string, unknown> | null;
export function savePanelState(id: string, state: Record<string, unknown>): void;
export function clampToBounds(
  x: number,
  y: number,
  bounds: { width: number; height: number; maxX?: number; maxY?: number }
): { x: number; y: number };

export function createWidgetRegistry(
  entries?: Record<string, WidgetRenderFn>
): WidgetRegistry;
export function createDefaultWidgetRegistry(): WidgetRegistry;
export const CAST_TABLE_WIDGET_IDS: readonly string[];
export function renderCastTableWidget(
  root: Element,
  state: Record<string, unknown>,
  opts?: Record<string, unknown>
): void;
export function mountStoryWidgets(
  root: Element,
  registry: WidgetRegistry,
  state: Record<string, unknown>,
  opts?: Record<string, unknown>
): () => void;

export type StickPose = Record<string, number>;
export type WidgetRenderFn = (
  root: Element,
  state: Record<string, unknown>,
  opts?: Record<string, unknown>
) => void;

export interface WidgetRegistry {
  get(id: string): WidgetRenderFn | undefined;
  set(id: string, render: WidgetRenderFn): void;
  ids(): string[];
}

export interface ViewerScene {
  dispose?(): void;
  [key: string]: unknown;
}

export interface CountersApi {
  set(id: string, value: string | number): void;
  [key: string]: unknown;
}

export interface LogPanelApi {
  append(line: string): void;
  clear?(): void;
  [key: string]: unknown;
}

export interface StickPuppetApi {
  dispose?(): void;
  [key: string]: unknown;
}

export interface ActorsLayerApi {
  dispose?(): void;
  [key: string]: unknown;
}

export interface HorseClientApi {
  dispose?(): void;
  [key: string]: unknown;
}

export interface PanelApi {
  el: HTMLElement;
  open(): void;
  close(): void;
  toggle(): void;
  dispose?(): void;
  [key: string]: unknown;
}
