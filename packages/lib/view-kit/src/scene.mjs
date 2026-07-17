/**
 * View kit · bootstrap del stage 3D.
 *
 * Envuelve el scene manager de ui-3d-kit con las convenciones compartidas:
 * montar en #viewer-stage, ocultar el canvas placeholder, escenario oscuro
 * con grid, y una pequeña superficie frame/dispose. Expone sceneManager
 * entero (cámaras chase / inspección orbital).
 *
 * NOTA: `three` / `@zeus/ui-3d-kit` resuelven en el NAVEGADOR vía import map.
 */

import { createSceneManager } from '@zeus/ui-3d-kit';

const DEFAULT_CAMERA = { fov: 60, near: 0.1, far: 500, position: [0, 14, 18] };
const DEFAULT_CONTROLS = { minDistance: 4, maxDistance: 120, maxPolarAngle: Math.PI / 2 };

/**
 * @param {object} [options]
 * @param {number} [options.background]
 * @param {object} [options.camera]
 * @param {object} [options.controls]
 * @returns {{ sceneManager: object, scene: object, camera: object, controls: object, onFrame: (cb:(dt:number)=>void)=>void, start: ()=>void, dispose: ()=>void }}
 */
export function createViewerScene(options = {}) {
  const container = document.getElementById(options.containerId || 'viewer-stage');
  const placeholder = document.getElementById(options.canvasId || 'viewer-canvas');

  const sceneManager = createSceneManager({
    background: options.background ?? 0x05050a,
    grid: options.grid ?? true,
    fog: options.fog ?? true,
    camera: { ...DEFAULT_CAMERA, ...options.camera },
    controls: { ...DEFAULT_CONTROLS, ...options.controls }
  });
  if (placeholder) placeholder.style.display = 'none';
  sceneManager.init(container);

  return {
    sceneManager,
    scene: sceneManager.getScene(),
    camera: sceneManager.getCamera(),
    controls: sceneManager.getControls(),
    onFrame: (cb) => sceneManager.onBeforeRender(cb),
    start: () => sceneManager.startRenderLoop(),
    dispose: () => sceneManager.dispose()
  };
}
