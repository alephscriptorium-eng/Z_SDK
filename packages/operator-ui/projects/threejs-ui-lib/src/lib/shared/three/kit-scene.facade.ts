import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import * as THREE from 'three';
import { createSceneManager } from '../../../zeus-ui-3d-kit-shim';

/**
 * Angular facade over @zeus/ui-3d-kit createSceneManager.
 * Adds operator-hub content (central hub + bot position markers).
 */
@Injectable({ providedIn: 'root' })
export class KitSceneFacade {
  private manager: ReturnType<typeof createSceneManager> | null = null;
  private centralHub: THREE.Mesh | null = null;
  private botPositions: THREE.Mesh[] = [];
  private hubClock = new THREE.Clock();
  private beforeRenderUnsub: (() => void) | null = null;
  private fpsUnsub: (() => void) | null = null;

  private readonly fps$ = new BehaviorSubject<number>(0);
  readonly fps = this.fps$.asObservable();
  readonly onBeforeRender = new Subject<number>();

  async initialize(container: HTMLElement): Promise<void> {
    if (this.manager) return;

    if (container.clientWidth === 0 || container.clientHeight === 0) {
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minHeight = '400px';
    }

    this.manager = createSceneManager({ axes: true });
    this.manager.init(container);
    this.addHubContent();

    this.fpsUnsub = this.manager.onFps((fps: number) => this.fps$.next(fps));
    this.beforeRenderUnsub = this.manager.onBeforeRender((dt: number) => {
      this.animateHub(dt);
      this.onBeforeRender.next(dt);
    });

    this.manager.startRenderLoop();
    this.hubClock.start();
  }

  private addHubContent(): void {
    const scene = this.manager?.getScene();
    if (!scene) return;

    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      emissive: 0x1a5490,
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.2,
    });
    this.centralHub = new THREE.Mesh(geometry, material);
    this.centralHub.position.set(0, 0, 0);
    this.centralHub.castShadow = true;
    this.centralHub.userData = { type: 'central_hub' };
    scene.add(this.centralHub);

    const glowGeometry = new THREE.SphereGeometry(2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.1,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.centralHub.add(glow);

    const cardinals = [
      { name: 'North', angle: 0 },
      { name: 'East', angle: Math.PI / 2 },
      { name: 'South', angle: Math.PI },
      { name: 'West', angle: (3 * Math.PI) / 2 },
    ];

    cardinals.forEach((cardinal, cardinalIndex) => {
      for (let i = 0; i < 2; i++) {
        const radius = 5 + i * 2;
        const angle = cardinal.angle + i * 0.3;
        const height = i * 0.5;
        const position = new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        );

        const botGeometry = new THREE.ConeGeometry(0.3, 1.2, 8);
        const botMaterial = new THREE.MeshStandardMaterial({
          color: 0x95a5a6,
          metalness: 0.3,
          roughness: 0.7,
        });
        const botMesh = new THREE.Mesh(botGeometry, botMaterial);
        botMesh.position.copy(position);
        botMesh.castShadow = true;
        botMesh.receiveShadow = true;
        botMesh.userData = {
          type: 'bot_position',
          botId: `bot_${cardinal.name.toLowerCase()}_${i + 1}`,
          position: position.clone(),
        };
        this.botPositions.push(botMesh);
        scene.add(botMesh);

        const ringGeometry = new THREE.RingGeometry(0.8, 1.2, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x34495e,
          transparent: true,
          opacity: 0.3,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(position);
        ring.position.y = 0.1;
        scene.add(ring);
      }
    });
  }

  private animateHub(deltaTime: number): void {
    const elapsed = this.hubClock.elapsedTime;
    if (this.centralHub) {
      this.centralHub.rotation.y += deltaTime * 0.5;
      const pulse = Math.sin(elapsed * 2) * 0.1;
      this.centralHub.scale.setScalar(1 + pulse * 0.05);
    }
    this.botPositions.forEach((bot, index) => {
      const baseY = bot.userData['position'].y as number;
      const bobOffset = Math.sin(elapsed * 1.5 + index * 0.3) * 0.1;
      bot.position.y = baseY + bobOffset;
      bot.rotation.y = elapsed * 0.2 + index * 0.5;
    });
  }

  getScene(): THREE.Scene | null {
    return this.manager?.getScene() ?? null;
  }

  getRenderer(): THREE.WebGLRenderer | null {
    return (this.manager?.getRenderer() as THREE.WebGLRenderer) ?? null;
  }

  getCamera(): THREE.PerspectiveCamera | null {
    return (this.manager?.getCamera() as THREE.PerspectiveCamera) ?? null;
  }

  reset(): void {
    this.manager?.reset();
    this.botPositions.forEach((bot) => {
      const material = bot.material as THREE.MeshStandardMaterial;
      material.color.setHex(0x95a5a6);
      material.emissive.setHex(0x000000);
    });
    this.hubClock.start();
  }

  dispose(): void {
    this.beforeRenderUnsub?.();
    this.fpsUnsub?.();
    this.beforeRenderUnsub = null;
    this.fpsUnsub = null;
    this.manager?.dispose();
    this.manager = null;
    this.centralHub = null;
    this.botPositions = [];
    this.fps$.complete();
    this.onBeforeRender.complete();
  }
}
