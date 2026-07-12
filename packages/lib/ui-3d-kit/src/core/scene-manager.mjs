/**
 * SceneManager — generic three.js scene bootstrap for Zeus 3D viewers.
 *
 * Ported from gea-sdk threejs-gamify-ui `ThreeSceneService` (Angular):
 *   - `@Injectable` removed → plain factory `createSceneManager(options)`.
 *   - RxJS `fps$` BehaviorSubject → `onFps(cb)` plain callback.
 *   - RxJS `onBeforeRender` Subject → `onBeforeRender(cb)` plain callback.
 *   - Demo scene content (central hub, bot positions) NOT ported — the kit
 *     ships no scene; consumers add their own objects.
 *
 * Browser-safe: `three` / `three/addons/*` resolve via import map.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * @param {object} [options]
 * @param {number} [options.background=0x0a0a0a] scene background color
 * @param {boolean|{near:number,far:number}} [options.fog=true]
 * @param {boolean} [options.grid=true] add a GridHelper floor
 * @param {boolean} [options.axes=false] add an AxesHelper (dev)
 * @param {boolean} [options.lights=true] add the default light rig
 * @param {{fov:number,near:number,far:number,position:[number,number,number]}} [options.camera]
 * @param {{minDistance:number,maxDistance:number,maxPolarAngle:number}} [options.controls]
 */
export function createSceneManager(options = {}) {
  const opts = {
    background: 0x0a0a0a,
    fog: true,
    grid: true,
    axes: false,
    lights: true,
    camera: { fov: 75, near: 0.1, far: 1000, position: [0, 8, 12] },
    controls: { minDistance: 3, maxDistance: 50, maxPolarAngle: Math.PI / 2 },
    ...options,
  };

  let scene = null;
  let camera = null;
  let renderer = null;
  let controls = null;
  let gridHelper = null;

  let animationId = null;
  let resizeObserver = null;
  let fpsIntervalId = null;
  const clock = new THREE.Clock();

  let isInitialized = false;
  let frameCount = 0;

  const fpsCallbacks = new Set();
  const beforeRenderCallbacks = new Set();

  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.2);
    fillLight.position.set(-10, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8844, 0.1);
    rimLight.position.set(0, -10, 10);
    scene.add(rimLight);
  }

  function createEnvironment() {
    if (opts.grid) {
      gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.3;
      scene.add(gridHelper);
    }
    if (opts.axes) {
      const axesHelper = new THREE.AxesHelper(3);
      axesHelper.material.transparent = true;
      axesHelper.material.opacity = 0.5;
      scene.add(axesHelper);
    }
  }

  function setupResizeHandler(container) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (camera && renderer && width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    frameCount += 1;

    for (const cb of beforeRenderCallbacks) {
      cb(deltaTime);
    }

    if (controls) controls.update();
    if (scene && camera && renderer) renderer.render(scene, camera);
  }

  const manager = {
    /**
     * Initialize scene, camera, renderer, controls, lights and helpers,
     * and attach the canvas to `container`.
     * @param {HTMLElement} container
     */
    init(container) {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(opts.background);
      if (opts.fog) {
        const fog = typeof opts.fog === 'object' ? opts.fog : { near: 10, far: 100 };
        scene.fog = new THREE.Fog(opts.background, fog.near, fog.far);
      }

      const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      camera = new THREE.PerspectiveCamera(
        opts.camera.fov,
        aspect,
        opts.camera.near,
        opts.camera.far,
      );
      camera.position.set(...opts.camera.position);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      container.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = opts.controls.minDistance;
      controls.maxDistance = opts.controls.maxDistance;
      controls.maxPolarAngle = opts.controls.maxPolarAngle;

      if (opts.lights) setupLighting();
      createEnvironment();
      setupResizeHandler(container);

      isInitialized = true;
      return manager;
    },

    /** Start the requestAnimationFrame render loop + 1 Hz FPS reporting. */
    startRenderLoop() {
      if (!isInitialized) return;
      if (animationId !== null) return;
      clock.start();
      animate();
      fpsIntervalId = setInterval(() => {
        const fps = frameCount;
        frameCount = 0;
        for (const cb of fpsCallbacks) cb(fps);
      }, 1000);
    },

    /** Stop the render loop (scene stays alive; call startRenderLoop to resume). */
    stopRenderLoop() {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (fpsIntervalId !== null) {
        clearInterval(fpsIntervalId);
        fpsIntervalId = null;
      }
    },

    /**
     * Subscribe to FPS samples (one per second). Returns an unsubscribe fn.
     * (Replaces the Angular service's `fps` observable.)
     * @param {(fps: number) => void} cb
     */
    onFps(cb) {
      fpsCallbacks.add(cb);
      return () => fpsCallbacks.delete(cb);
    },

    /**
     * Subscribe to before-render ticks with deltaTime in seconds.
     * Returns an unsubscribe fn.
     * (Replaces the Angular service's `onBeforeRender` Subject.)
     * @param {(deltaSec: number) => void} cb
     */
    onBeforeRender(cb) {
      beforeRenderCallbacks.add(cb);
      return () => beforeRenderCallbacks.delete(cb);
    },

    /** Reset camera + controls to their initial state. */
    reset() {
      if (camera && controls) {
        camera.position.set(...opts.camera.position);
        controls.reset();
      }
      clock.start();
    },

    getScene() {
      return scene;
    },

    getCamera() {
      return camera;
    },

    getRenderer() {
      return renderer;
    },

    getControls() {
      return controls;
    },

    /** Tear down loop, observers, renderer, geometries and materials. */
    dispose() {
      manager.stopRenderLoop();
      fpsCallbacks.clear();
      beforeRenderCallbacks.clear();

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      if (controls) controls.dispose();

      scene?.traverse((object) => {
        if (object.isMesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });

      scene = null;
      camera = null;
      renderer = null;
      controls = null;
      gridHelper = null;
      isInitialized = false;
    },
  };

  return manager;
}
