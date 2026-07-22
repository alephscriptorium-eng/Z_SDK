import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { merge, Observable, Subscription } from 'rxjs';
import { ZeusOperatorBridgeService, ZeusOperatorConfig } from './zeus-operator-bridge.service';
import { DemoFallbackService } from './demo-fallback.service';
import { OperatorHudComponent } from './operator-hud.component';
import {
  ThreeJSLayoutComponent,
  ThreeJSLayoutConfig,
  HubMessage,
} from '@zeus/threejs-ui-lib';
import { DEV_ROOM_CLIENT_CONFIG } from '@zeus/room-client-browser/dev-config';

@Component({
  selector: 'app-root',
  imports: [ThreeJSLayoutComponent, OperatorHudComponent],
  template: `
    <div class="operator-host">
      <app-operator-hud />
      <tjs-threejs-layout
        [config]="layoutConfig"
        [externalMessages$]="sceneMessages$"
        [enableDemoFallback]="enableDemoFallback"
        [operatorConnectionStatus]="connectionStatus"
        [operatorCastEnabled]="operatorInspectEnabled"
        (operatorCast)="handleOperatorInspect()"
        (operatorConnect)="handleConnect()"
        (operatorDisconnect)="handleDisconnect()">
      </tjs-threejs-layout>
    </div>
  `,
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly zeusBridge = inject(ZeusOperatorBridgeService);
  private readonly demoFallback = inject(DemoFallbackService);
  private sliceSub: Subscription | null = null;

  /** Merged live zeus + offline demo streams feeding the hub scene. */
  readonly sceneMessages$: Observable<HubMessage> = merge(
    this.zeusBridge.messages$,
    this.demoFallback.messages$ as Observable<HubMessage>,
  );

  layoutConfig: ThreeJSLayoutConfig = {
    gameTitle: 'Operator · ciudad',
    sceneConfig: { debugMode: true },
    showHeader: true,
    showLeftSidebar: true,
    showRightSidebar: true,
    showControls: true,
    controlsPosition: 'bottom',
  };

  connectionStatus = 'disconnected';
  enableDemoFallback = true;
  operatorInspectEnabled = false;
  private inspectCount = 0;

  async ngOnInit(): Promise<void> {
    const cfg = this.zeusConfig();
    this.zeusBridge.applyPuertaConfig(cfg.puerta);
    this.layoutConfig = {
      ...this.layoutConfig,
      gameTitle: cfg.game === 'ciudad' ? 'Operator · ciudad' : `Operator · ${cfg.game}`,
    };
    this.sliceSub = this.zeusBridge.operatorSlice$.subscribe((slice) => {
      this.operatorInspectEnabled = this.zeusBridge.isLive() && slice != null;
    });
    await this.tryAutoConnect();
  }

  ngOnDestroy(): void {
    this.sliceSub?.unsubscribe();
  }

  private zeusConfig(): ZeusOperatorConfig {
    const cfg = (globalThis as { __ZEUS__?: ZeusOperatorConfig }).__ZEUS__;
    const game = cfg?.game ?? 'ciudad';
    const roomFallback = game === 'ciudad' ? 'CIUDAD_DEMO' : DEV_ROOM_CLIENT_CONFIG.room;
    return {
      scriptoriumUrl: cfg?.scriptoriumUrl ?? DEV_ROOM_CLIENT_CONFIG.scriptoriumUrl,
      room: cfg?.room ?? roomFallback,
      token: cfg?.token ?? DEV_ROOM_CLIENT_CONFIG.token,
      user: cfg?.user ?? 'operator-ui',
      game,
      puerta: cfg?.puerta,
    };
  }

  private async tryAutoConnect(): Promise<void> {
    this.setConnectionStatus('connecting');
    try {
      await this.zeusBridge.connect(this.zeusConfig());
      this.demoFallback.disable();
      this.setConnectionStatus('connected');
    } catch (err) {
      console.warn('[operator-ui] game room not reachable, demo-only mode:', err);
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

  handleOperatorInspect(): void {
    this.inspectCount++;
    if (!this.zeusBridge.isLive()) return;
    const cast = this.zeusBridge.inspect({
      targetId: 'spawn',
      label: `operator inspect #${this.inspectCount}`,
    });
    if (cast) {
      console.log('📤 [operator-ui] → intent inspect', cast);
    }
  }
}
