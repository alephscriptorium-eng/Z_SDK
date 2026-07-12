import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { merge, Observable, Subscription } from 'rxjs';
import { ZeusSessionBridgeService, ZeusSessionConfig } from './zeus-session-bridge.service';
import { DemoFallbackService } from './demo-fallback.service';
import { SessionHudComponent } from './session-hud.component';
import {
  ThreeJSLayoutComponent,
  ThreeJSLayoutConfig,
  HubMessage,
} from '@zeus/threejs-ui-lib';
import { DEV_ROOM_CLIENT_CONFIG } from '@zeus/room-client-browser';

@Component({
  selector: 'app-root',
  imports: [ThreeJSLayoutComponent, SessionHudComponent],
  template: `
    <div class="operator-host">
      <app-session-hud />
      <tjs-threejs-layout
        [config]="layoutConfig"
        [externalMessages$]="sceneMessages$"
        [enableDemoFallback]="enableDemoFallback"
        [operatorConnectionStatus]="connectionStatus"
        [operatorCastEnabled]="operatorCastEnabled"
        (operatorCast)="handleOperatorCast()"
        (operatorConnect)="handleConnect()"
        (operatorDisconnect)="handleDisconnect()">
      </tjs-threejs-layout>
    </div>
  `,
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly zeusBridge = inject(ZeusSessionBridgeService);
  private readonly demoFallback = inject(DemoFallbackService);
  private sliceSub: Subscription | null = null;

  /** Merged live zeus + offline demo streams feeding the hub scene. */
  readonly sceneMessages$: Observable<HubMessage> = merge(
    this.zeusBridge.messages$,
    this.demoFallback.messages$ as Observable<HubMessage>,
  );

  layoutConfig: ThreeJSLayoutConfig = {
    gameTitle: 'ZEUS Operator',
    sceneConfig: { debugMode: true },
    showHeader: true,
    showLeftSidebar: true,
    showRightSidebar: true,
    showControls: true,
    controlsPosition: 'bottom',
  };

  connectionStatus = 'disconnected';
  enableDemoFallback = true;
  operatorCastEnabled = false;
  private castCount = 0;

  async ngOnInit(): Promise<void> {
    this.sliceSub = this.zeusBridge.operatorSlice$.subscribe(() => {
      this.operatorCastEnabled = this.zeusBridge.canCast('B');
    });
    await this.tryAutoConnect();
  }

  ngOnDestroy(): void {
    this.sliceSub?.unsubscribe();
  }

  private zeusConfig(): ZeusSessionConfig {
    const cfg = (globalThis as { __ZEUS__?: ZeusSessionConfig }).__ZEUS__;
    return {
      scriptoriumUrl: cfg?.scriptoriumUrl ?? DEV_ROOM_CLIENT_CONFIG.scriptoriumUrl,
      room: cfg?.room,
      sessionId: cfg?.sessionId ?? DEV_ROOM_CLIENT_CONFIG.sessionId,
      token: cfg?.token ?? DEV_ROOM_CLIENT_CONFIG.token,
      user: cfg?.user ?? 'operator-ui',
    };
  }

  private async tryAutoConnect(): Promise<void> {
    this.setConnectionStatus('connecting');
    try {
      await this.zeusBridge.connect(this.zeusConfig());
      this.demoFallback.disable();
      this.setConnectionStatus('connected');
    } catch (err) {
      console.warn('[operator-ui] zeus session not reachable, demo-only mode:', err);
      this.demoFallback.enable();
      this.setConnectionStatus('demo');
    }
  }

  private setConnectionStatus(status: string): void {
    this.connectionStatus = status;
    this.enableDemoFallback = !this.zeusBridge.isLive();
  }

  async handleConnect(): Promise<void> {
    if (this.zeusBridge.isLive()) return;
    this.setConnectionStatus('connecting');
    try {
      await this.zeusBridge.connect(this.zeusConfig());
      this.demoFallback.disable();
      this.setConnectionStatus('connected');
    } catch (err) {
      console.warn('[operator-ui] connect failed:', err);
      this.demoFallback.enable();
      this.setConnectionStatus('demo');
    }
  }

  handleDisconnect(): void {
    this.zeusBridge.disconnect();
    this.demoFallback.enable();
    this.setConnectionStatus('disconnected');
  }

  handleOperatorCast(): void {
    this.castCount++;
    if (!this.zeusBridge.isLive()) return;
    if (!this.zeusBridge.canCast('B')) {
      console.warn('[operator-ui] cast skipped — cue deck B and wait for registros (lineas required)');
      return;
    }
    const cast = this.zeusBridge.cast({ label: `operator pick #${this.castCount}` });
    if (cast) {
      console.log('📤 [operator-ui] → selection:cast', cast);
    }
  }
}
