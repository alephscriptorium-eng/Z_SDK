import { Injectable } from '@angular/core';
import { createAnimationController } from '../../../zeus-ui-3d-kit-shim';

/** Angular facade over @zeus/ui-3d-kit createAnimationController. */
@Injectable({ providedIn: 'root' })
export class KitAnimationFacade {
  private readonly controller = createAnimationController();

  setScene(_scene: unknown): void {
    // kit controller animates arbitrary object refs — no scene binding required
  }

  start(): void {
    this.controller.start();
  }

  stop(): void {
    this.controller.stop();
  }

  update(_deltaTime?: number): void {
    this.controller.update();
  }

  createAnimation(
    id: string,
    targets: unknown[],
    config?: Record<string, unknown>,
  ): unknown {
    return this.controller.createAnimation(id, targets as never[], config as never);
  }

  getActiveAnimationCount(): number {
    return this.controller.getActiveAnimations().length;
  }

  dispose(): void {
    this.controller.dispose();
  }
}
