/**
 * The 3d-monitor view catalog. Each view is a layout that combines the SSR
 * registry (`@zeus/app-shell/ssr-view-registry`: stage, HUD, ring, markers,
 * log panel) with its own business logic (the browser entry under
 * /assets/js/views/).
 *
 * To add a view: defineView(...) here + write its browser entry. The portal,
 * routing and local nav pick it up from this registry.
 */

import { defineView, createViewRegistry, renderViewLayout } from '@zeus/app-shell/ssr-view-registry';
import { template, IMPORT_MAP } from './shell.mjs';

const CONN_FIELD = { id: 'hud-conn', label: 'conn', value: '…' };

export const VIEWS = [
  defineView({
    id: 'default',
    title: 'Default · room traffic',
    emoji: '🛰️',
    description: 'Vista radial original: cada cliente de la room en un círculo, cada evento una partícula hacia el hub.',
    entry: '/assets/js/views/default.mjs',
    elements: ['stage 3D', 'HUD', 'ring layout', 'markers', 'trayectorias', 'room wiring'],
    hud: {
      fields: [
        CONN_FIELD,
        { id: 'hud-room', label: 'room' },
        { id: 'hud-phase', label: 'phase' },
        { id: 'hud-seq', label: 'seq' },
        { id: 'hud-heartbeat', label: 'heartbeat', value: '0' },
        { id: 'hud-clients', label: 'clients', value: '0' },
        { id: 'hud-events', label: 'events', value: '0' }
      ],
      note: 'Última selección:',
      logId: 'hud-selection-log'
    }
  }),
  defineView({
    id: 'ecosystem',
    title: 'Ecosystem · bots & agujeros negros',
    emoji: '🕸️',
    description: 'Rabbits, spiders y horses como actores con forma propia; canales federados (RNFP) como arcos entre pares; el tráfico sin clasificar y los pares silenciosos caen al agujero negro.',
    entry: '/assets/js/views/ecosystem.mjs',
    elements: ['stage 3D', 'HUD', 'ring layout', 'markers por rol', 'agujero negro', 'arcos de canal', 'trayectorias', 'room wiring'],
    hud: {
      fields: [
        CONN_FIELD,
        { id: 'hud-room', label: 'room' },
        { id: 'hud-rabbits', label: 'rabbits', value: '0' },
        { id: 'hud-spiders', label: 'spiders', value: '0' },
        { id: 'hud-horses', label: 'horses', value: '0' },
        { id: 'hud-channels', label: 'canales federados', value: '0' },
        { id: 'hud-swallowed', label: 'agujero negro', value: '0' },
        { id: 'hud-events', label: 'events', value: '0' }
      ],
      note: 'Último canal:',
      logId: 'hud-channel-log'
    }
  }),
  defineView({
    id: 'flux',
    title: 'Flux · estación de clientes',
    emoji: '🌌',
    description: 'Estación orbital: cada cliente es un nodo etiquetado ubicado por su identidad y rol; el tráfico corre por tuberías con pulsos (ping↔pong, malla de descubrimiento rabbit, canales federados spider, RPC horse); el agujero negro se FORMA del buffer de announces y los horses despliegan su forja de tools.',
    entry: '/assets/js/views/flux.mjs',
    elements: ['stage 3D', 'HUD', 'labels sprite', 'tuberías con pulsos', 'buffer de announces → agujero negro', 'forja horse (tool satellites)', 'ubicación determinista por identidad', 'room wiring'],
    hud: {
      fields: [
        CONN_FIELD,
        { id: 'hud-room', label: 'room' },
        { id: 'hud-clients', label: 'clients', value: '0' },
        { id: 'hud-pipes', label: 'tuberías', value: '0' },
        { id: 'hud-buffer', label: 'buffer announces', value: '0' },
        { id: 'hud-hole', label: 'agujero negro', value: 'latente (0/8)' },
        { id: 'hud-horses', label: 'horses', value: '0' },
        { id: 'hud-tools', label: 'tools', value: '0' },
        { id: 'hud-events', label: 'events', value: '0' }
      ],
      note: 'Bitácora:',
      logId: 'hud-flux-log'
    }
  }),
  defineView({
    id: 'gamemap',
    title: 'Gamemap · demo:game en vivo',
    emoji: '🗺️',
    description: 'El tablero real de npm run demo:game: la escena vaivén-dos-nodos (plataformas, corredor, anclas) con el robot como puppet GLB dirigido por los GAME_STATE de la autoridad; cada GAME_INTENT del walk driver corre como fantasma por el corredor antes que el robot, con estela de movimiento y ocupación de anclas.',
    entry: '/assets/js/views/gamemap.mjs',
    elements: ['stage 3D', 'HUD', 'node platforms + link corridor + anchors (ui-3d-kit)', 'puppet GLB con poses', 'dead reckoning', 'intent ghosts', 'estela de movimiento', 'labels sprite', 'room wiring'],
    defaultRoom: 'PUBLIC_ROOM',
    hud: {
      fields: [
        CONN_FIELD,
        { id: 'hud-room', label: 'room' },
        { id: 'hud-scene', label: 'escena' },
        { id: 'hud-tick', label: 'tick' },
        { id: 'hud-reason', label: 'reason' },
        { id: 'hud-actor', label: 'actor' },
        { id: 'hud-pose', label: 'pose' },
        { id: 'hud-zone', label: 'zona' },
        { id: 'hud-progress', label: 'progress' },
        { id: 'hud-intents', label: 'intents', value: '0' },
        { id: 'hud-states', label: 'states', value: '0' }
      ],
      note: 'Bitácora:',
      logId: 'hud-game-log'
    }
  }),
  defineView({
    id: 'bots-log',
    title: 'Bots Log · demo:bots por roles',
    emoji: '🏓',
    description: 'Log visual de npm run demo:bots: una columna 3D por rol (ping, pong, rabbit, spider, horse) que crece con su actividad, y un log DOM coloreado con el detalle de cada evento.',
    entry: '/assets/js/views/bots-log.mjs',
    elements: ['stage 3D', 'HUD', 'columnas por rol', 'trayectorias', 'log panel DOM', 'room wiring'],
    logPanel: true,
    logPanelPlacement: 'split',
    hud: {
      fields: [
        CONN_FIELD,
        { id: 'hud-room', label: 'room' },
        { id: 'hud-ping', label: '🏓 ping', value: '0' },
        { id: 'hud-pong', label: '🏓 pong', value: '0' },
        { id: 'hud-rabbit', label: '🐰 rabbit', value: '0' },
        { id: 'hud-spider', label: '🕷️ spider', value: '0' },
        { id: 'hud-horse', label: '🐴 horse', value: '0' },
        { id: 'hud-master', label: '🧭 master', value: '0' },
        { id: 'hud-other', label: '▫️ other', value: '0' }
      ]
    }
  })
];

export const viewRegistry = createViewRegistry(VIEWS);

/**
 * Render a registered view page.
 * @param {string} id
 * @param {{viewerConfig: object, themes?: string[], currentTheme?: string}} ctx
 * @returns rendered shell element or null when the view does not exist
 */
export function renderView(id, ctx) {
  const view = viewRegistry.get(id);
  if (!view) return null;
  return renderViewLayout(view, { template, importMap: IMPORT_MAP, ...ctx });
}
