/**
 * View kit · 3D stage bootstrap.
 *
 * Wraps the ui-3d-kit scene manager with the conventions every monitor view
 * shares: mount on #viewer-stage, hide the placeholder canvas, dark grid
 * stage, and a small frame/dispose surface.
 *
 * NOTE: `three` / `@zeus/ui-3d-kit` resolve in the BROWSER via the page
 * import map — `node --check` parses without resolving imports.
 */

import { createSceneManager } from '@zeus/ui-3d-kit';

const DEFAULT_CAMERA = { fov: 60, near: 0.1, far: 500, position: [0, 14, 18] };
const DEFAULT_CONTROLS = { minDistance: 4, maxDistance: 120, maxPolarAngle: Math.PI / 2 };

/**
 * @param {object} [options]
 * @param {number} [options.background]
 * @param {object} [options.camera]
 * @param {object} [options.controls]
 * @returns {{ sceneManager: object, scene: object, onFrame: (cb: (dt:number)=>void)=>void, start: ()=>void, dispose: ()=>void }}
 */
export function createViewerScene(options = {}) {
  const container = document.getElementById(options.containerId || 'viewer-stage');
  const placeholder = document.getElementById(options.canvasId || 'viewer-canvas');

  const sceneManager = createSceneManager({
    background: options.background ?? 0x05050a,
    grid: options.grid ?? true,
    camera: { ...DEFAULT_CAMERA, ...options.camera },
    controls: { ...DEFAULT_CONTROLS, ...options.controls }
  });
  if (placeholder) placeholder.style.display = 'none';
  sceneManager.init(container);

  return {
    sceneManager,
    scene: sceneManager.getScene(),
    onFrame: (cb) => sceneManager.onBeforeRender(cb),
    start: () => sceneManager.startRenderLoop(),
    dispose: () => sceneManager.dispose()
  };
}
