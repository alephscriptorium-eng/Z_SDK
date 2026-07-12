import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, EMPTY } from 'rxjs';

import { ThreeJSScenePureComponent, ThreeJSSceneConfig } from './threejs-scene-pure.component';
import { ThreeJSControlsComponent, ThreeJSControlsState, ThreeJSControlsEvents } from './threejs-controls.component';
import { ThreeJSHeaderComponent, ThreeJSHeaderState } from './threejs-header.component';
import { ThreeJSSidebarLeftComponent } from './threejs-sidebar-left.component';
import { ThreeJSSidebarRightComponent } from './threejs-sidebar-right.component';
import { ModalManagerComponent } from '../shared/components/modal-manager.component';
import { ModalService } from '../shared/services/modal.service';
import { HubMessage } from '../shared/models/message.model';

export interface ThreeJSLayoutConfig {
  gameTitle: string;
  sceneConfig: ThreeJSSceneConfig;
  showHeader?: boolean;
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
  showControls?: boolean;
  controlsPosition?: 'bottom' | 'top' | 'floating';
}

@Component({
  selector: 'tjs-threejs-layout',
  standalone: true,
  imports: [
    CommonModule,
    ThreeJSScenePureComponent,
    ThreeJSControlsComponent,
    ThreeJSHeaderComponent,
    ThreeJSSidebarLeftComponent,
    ThreeJSSidebarRightComponent,
    ModalManagerComponent
  ],
  template: `
    <div class="threejs-layout-container" [class]="layoutClass">
      <div class="layout-header" *ngIf="config.showHeader !== false">
        <tjs-threejs-header [state]="headerState"></tjs-threejs-header>
      </div>

      <div class="layout-main">
        <div class="layout-sidebar layout-sidebar-left" 
             *ngIf="config.showLeftSidebar !== false">
          <tjs-threejs-sidebar-left 
            (toggleBotManagement)="handleToggleBotManagement()">
          </tjs-threejs-sidebar-left>
        </div>

        <div class="layout-scene">
          <div class="layout-controls layout-controls-top" 
               *ngIf="config.showControls !== false && config.controlsPosition === 'top'">
            <tjs-threejs-controls 
              [state]="controlsState" 
              [events]="controlsEvents">
            </tjs-threejs-controls>
          </div>

          <div class="scene-wrapper">
            <tjs-threejs-scene-pure
              #sceneComponent
              [config]="config.sceneConfig"
              [externalMessages$]="externalMessages$"
              [enableDemoFallback]="enableDemoFallback"
              (sceneReady)="handleSceneReady()"
              (connectionStatusChange)="handleConnectionStatusChange($event)"
              (sceneError)="handleSceneError($event)"
              (fpsUpdate)="handleFpsUpdate($event)"
              (particleCountUpdate)="handleParticleCountUpdate($event)"
              (animationCountUpdate)="handleAnimationCountUpdate($event)">
            </tjs-threejs-scene-pure>
          </div>

          <div class="layout-controls layout-controls-bottom" 
               *ngIf="config.showControls !== false && (config.controlsPosition === 'bottom' || !config.controlsPosition)">
            <tjs-threejs-controls 
              [state]="controlsState" 
              [events]="controlsEvents">
            </tjs-threejs-controls>
          </div>
        </div>

        <div class="layout-sidebar layout-sidebar-right" 
             *ngIf="config.showRightSidebar !== false">
          <tjs-threejs-sidebar-right 
            (toggleMessagePanel)="handleToggleMessagePanel()">
          </tjs-threejs-sidebar-right>
        </div>
      </div>

      <div class="layout-controls layout-controls-floating" 
           *ngIf="config.showControls !== false && config.controlsPosition === 'floating'">
        <tjs-threejs-controls 
          [state]="controlsState" 
          [events]="controlsEvents">
        </tjs-threejs-controls>
      </div>

      <app-modal-manager [messages$]="externalMessages$"></app-modal-manager>
    </div>
  `,
  styleUrls: ['./threejs-layout.component.css']
})
export class ThreeJSLayoutComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('sceneComponent') sceneComponent!: ThreeJSScenePureComponent;
  @Input() config!: ThreeJSLayoutConfig;
  @Input() externalMessages$: Observable<HubMessage> = EMPTY;
  @Input() enableDemoFallback = false;
  /** Host-driven connection status (zeus bridge connect/disconnect). */
  @Input() set operatorConnectionStatus(status: string | undefined) {
    if (status == null) return;
    this.headerState.connectionStatus = status;
    this.controlsState.connectionStatus = status;
    this.controlsState.isLoading = status === 'connecting';
    this.cdr.detectChanges();
  }
  /** When false, Send One (selection:cast) is disabled — deck B has no resolved target. */
  @Input() set operatorCastEnabled(enabled: boolean) {
    this.controlsState.operatorCastEnabled = enabled;
    this.cdr.detectChanges();
  }
  /** Outbound selection:cast — host calls zeusBridge.cast(). */
  @Output() operatorCast = new EventEmitter<void>();
  @Output() operatorConnect = new EventEmitter<void>();
  @Output() operatorDisconnect = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  public headerState: ThreeJSHeaderState = {
    gameTitle: '',
    connectionStatus: 'disconnected'
  };

  public controlsState: ThreeJSControlsState = {
    isDemoRunning: false,
    demoPhase: 'idle',
    demoSpeed: 'normal',
    demoChannel: 'app',
    demoMessagesCount: 0,
    isWireframeMode: false,
    currentFPS: 0,
    particleCount: 0,
    animationCount: 0,
    connectionStatus: 'disconnected',
    isLoading: false,
    isOfflineMode: false,
    operatorCastEnabled: false,
    liveSessionMode: false,
  };

  public controlsEvents: { [K in keyof ThreeJSControlsEvents]: any } = {
    toggleDemo: { emit: () => this.handleToggleDemo() },
    phaseChange: { emit: (phase: string) => this.handlePhaseChange(phase) },
    speedChange: { emit: (speed: string) => this.handleSpeedChange(speed) },
    channelChange: { emit: (channel: string) => this.handleChannelChange(channel) },
    singleMessage: { emit: () => this.handleSingleMessage() },
    burst: { emit: () => this.handleBurst() },
    resetDemo: { emit: () => this.handleResetDemo() },
    toggleWireframe: { emit: () => this.handleToggleWireframe() },
    resetCamera: { emit: () => this.handleResetCamera() },
    takeScreenshot: { emit: () => this.handleTakeScreenshot() },
    resetScene: { emit: () => this.handleResetScene() },
    connect: { emit: () => this.handleConnect() },
    disconnect: { emit: () => this.handleDisconnect() },
    toggleOffline: { emit: () => this.handleToggleOffline() },
    openSettings: { emit: () => this.handleOpenSettings() },
    openHelp: { emit: () => this.handleOpenHelp() },
    openAdvanced: { emit: () => this.handleOpenAdvanced() }
  };

  public get layoutClass(): string {
    const classes = ['layout'];
    if (this.config.showLeftSidebar !== false) classes.push('with-left-sidebar');
    if (this.config.showRightSidebar !== false) classes.push('with-right-sidebar');
    if (this.config.showHeader !== false) classes.push('with-header');
    if (this.config.showControls !== false) classes.push('with-controls');
    return classes.join(' ');
  }

  constructor(
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.config) {
      throw new Error('ThreeJSLayoutComponent requires config input');
    }
    this.headerState.gameTitle = this.config.gameTitle;
    this.controlsState.liveSessionMode = !this.enableDemoFallback;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enableDemoFallback']) {
      this.controlsState.liveSessionMode = !this.enableDemoFallback;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleSceneReady() {}

  handleConnectionStatusChange(status: string) {
    // block-16: host owns zeus session status; scene only reports when offline demo fallback
    if (!this.enableDemoFallback) return;
    this.headerState.connectionStatus = status;
    this.controlsState.connectionStatus = status;
    this.cdr.detectChanges();
  }

  handleSceneError(error: Error) {
    console.error('Scene error in layout:', error);
  }

  handleFpsUpdate(fps: number) {
    this.controlsState.currentFPS = fps;
  }

  handleParticleCountUpdate(count: number) {
    this.controlsState.particleCount = count;
  }

  handleAnimationCountUpdate(count: number) {
    this.controlsState.animationCount = count;
  }

  handleToggleDemo() {
    if (!this.sceneComponent) return;
    if (this.enableDemoFallback) {
      if (this.controlsState.isDemoRunning) {
        this.sceneComponent.stopDemo();
        this.controlsState.isDemoRunning = false;
      } else {
        this.sceneComponent.startDemo();
        this.controlsState.isDemoRunning = true;
      }
      return;
    }
    // block-16: live zeus — Send One casts without starting the offline demo simulator
    this.controlsState.isDemoRunning = !this.controlsState.isDemoRunning;
  }

  handlePhaseChange(phase: string) {
    this.sceneComponent?.setDemoPhase(phase);
    this.controlsState.demoPhase = phase;
  }

  handleSpeedChange(speed: string) {
    this.sceneComponent?.setDemoSpeed(speed);
    this.controlsState.demoSpeed = speed;
  }

  handleChannelChange(channel: string) {
    this.sceneComponent?.setDemoChannel(channel);
    this.controlsState.demoChannel = channel;
  }

  handleSingleMessage() {
    this.controlsState.demoMessagesCount++;
    if (this.enableDemoFallback) {
      this.sceneComponent?.sendSingleDemoMessage();
    } else {
      this.operatorCast.emit();
    }
  }

  handleBurst() {
    this.sceneComponent?.sendDemoBurst();
    this.controlsState.demoMessagesCount += 5;
  }

  handleResetDemo() {
    this.sceneComponent?.resetDemoSimulator();
    this.controlsState.demoMessagesCount = 0;
    this.controlsState.isDemoRunning = false;
  }

  handleToggleWireframe() {
    this.sceneComponent?.toggleWireframe();
    this.controlsState.isWireframeMode = !this.controlsState.isWireframeMode;
  }

  handleResetCamera() {
    this.sceneComponent?.resetCamera();
  }

  handleTakeScreenshot() {
    this.sceneComponent?.takeScreenshot();
  }

  handleResetScene() {
    this.sceneComponent?.resetScene();
  }

  handleConnect() {
    this.operatorConnect.emit();
  }

  handleDisconnect() {
    this.operatorDisconnect.emit();
  }

  handleToggleOffline() {
    this.controlsState.isOfflineMode = !this.controlsState.isOfflineMode;
  }

  handleOpenSettings() {
    this.modalService.open({
      id: 'settings',
      title: '⚙️ Settings',
      position: { x: 300, y: 150 },
      size: { width: 400, height: 500 },
      draggable: true,
      resizable: true,
      closable: true,
      minimizable: true
    });
  }

  handleOpenHelp() {
    this.modalService.open({
      id: 'help',
      title: '📖 Help & Controls',
      position: { x: 150, y: 100 },
      size: { width: 500, height: 600 },
      draggable: true,
      resizable: true,
      closable: true,
      minimizable: true
    });
  }

  handleOpenAdvanced() {
    this.modalService.open({
      id: 'demo-controls',
      title: '🎛️ Advanced Demo Controls',
      position: { x: 100, y: 150 },
      size: { width: 500, height: 600 },
      draggable: true,
      resizable: true,
      closable: true,
      minimizable: true
    });
  }

  handleToggleBotManagement() {
    this.modalService.open({
      id: 'bot-management',
      title: '🤖 Bot Management',
      position: { x: 50, y: 120 },
      size: { width: 350, height: 500 },
      draggable: true,
      resizable: true,
      closable: true,
      minimizable: true
    });
  }

  handleToggleMessagePanel() {
    this.modalService.open({
      id: 'message-panel',
      title: '💬 Message Stream',
      position: { x: window.innerWidth - 400, y: 120 },
      size: { width: 380, height: 500 },
      draggable: true,
      resizable: true,
      closable: true,
      minimizable: true
    });
  }
}
