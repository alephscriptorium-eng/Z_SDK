export function createSceneManager(options?: Record<string, unknown>): SceneManager;
export function createAnimationController(): AnimationControllerKit;
export function createTrajectoryManager(options?: Record<string, unknown>): TrajectoryManagerKit;

export interface SceneManager {
  init(container: HTMLElement): SceneManager;
  startRenderLoop(): void;
  stopRenderLoop(): void;
  onFps(cb: (fps: number) => void): () => void;
  onBeforeRender(cb: (deltaSec: number) => void): () => void;
  reset(): void;
  getScene(): import('three').Scene | null;
  getCamera(): import('three').PerspectiveCamera | null;
  getRenderer(): import('three').WebGLRenderer | null;
  getControls(): unknown;
  dispose(): void;
}

export interface TrajectoryManagerKit {
  setScene(scene: import('three').Scene): void;
  createMessageParticle(
    id: string,
    startPos: import('three').Vector3,
    endPos: import('three').Vector3,
    channel?: string,
    speed?: number
  ): unknown;
  updateParticles(deltaTime: number): void;
  clearAllParticles(): void;
  getActiveParticleCount(): number;
  dispose(): void;
}

export interface AnimationControllerKit {
  start(): void;
  stop(): void;
  update(): void;
  dispose(): void;
  getActiveAnimations(): unknown[];
  createAnimation(id: string, targets: unknown[], config?: Record<string, unknown>): unknown;
}
