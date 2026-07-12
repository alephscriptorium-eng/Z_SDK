import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DemoMessageSimulator } from '@lib/shared/simulation/demo-message-simulator';

/**
 * Host-side demo fallback — activates DemoMessageSimulator only when the zeus
 * session is unreachable (block-13 / AV-K).
 */
@Injectable({ providedIn: 'root' })
export class DemoFallbackService {
  private readonly simulator = inject(DemoMessageSimulator);
  private active = false;

  readonly messages$: Observable<unknown> = this.simulator.messages$;

  enable(): void {
    if (this.active) return;
    this.active = true;
    this.simulator.start();
  }

  disable(): void {
    if (!this.active) return;
    this.simulator.stop();
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }

  toggle(): void {
    if (this.active) {
      this.disable();
    } else {
      this.enable();
    }
  }
}
