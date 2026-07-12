import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { createTrajectoryManager } from '../../../zeus-ui-3d-kit-shim';

/** Angular facade over @zeus/ui-3d-kit createTrajectoryManager. */
@Injectable({ providedIn: 'root' })
export class KitTrajectoryFacade {
  private readonly manager = createTrajectoryManager();

  setScene(scene: THREE.Scene): void {
    this.manager.setScene(scene);
  }

  createMessageParticle(
    id: string,
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    channel = 'app',
    speed = 1.0,
  ): unknown {
    return this.manager.createMessageParticle(id, startPos, endPos, channel, speed);
  }

  createBotToCenterTrajectory(
    botPosition: THREE.Vector3,
    messageId: string,
    channel = 'app',
  ): unknown {
    const centerPosition = new THREE.Vector3(0, 1, 0);
    return this.manager.createMessageParticle(messageId, botPosition, centerPosition, channel, 1.5);
  }

  createCenterToBotTrajectory(
    botPosition: THREE.Vector3,
    messageId: string,
    channel = 'app',
  ): unknown {
    const centerPosition = new THREE.Vector3(0, 1, 0);
    return this.manager.createMessageParticle(messageId, centerPosition, botPosition, channel, 1.0);
  }

  updateParticles(deltaTime: number): void {
    this.manager.updateParticles(deltaTime);
  }

  clearAllParticles(): void {
    this.manager.clearAllParticles();
  }

  getActiveParticleCount(): number {
    return this.manager.getActiveParticleCount();
  }

  dispose(): void {
    this.manager.dispose();
  }
}
