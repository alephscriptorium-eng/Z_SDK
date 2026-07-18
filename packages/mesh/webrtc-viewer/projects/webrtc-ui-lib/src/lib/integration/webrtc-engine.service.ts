/**
 * Procedencia: web-rtc-gamify-ui WebRTCEngine @ 4b9271b
 * Wrapper Angular sobre el motor ESM (`src/core/webrtc-engine.mjs`).
 * Señalización: BrowserSocketSignalingService (nombres wire U88 completos).
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebRtcEngineService {
  /** Runtime engine instance injected by the host (ESM WebRTCEngine). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attach(engine: any) {
    this.engine = engine;
  }
}
