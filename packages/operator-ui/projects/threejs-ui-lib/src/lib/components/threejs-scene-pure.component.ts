import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, EMPTY } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as THREE from 'three';

import { KitSceneFacade } from '../shared/three/kit-scene.facade';
import { KitAnimationFacade } from '../shared/three/kit-animation.facade';
import { KitTrajectoryFacade } from '../shared/three/kit-trajectory.facade';
import { DemoMessageSimulator } from '../shared/simulation/demo-message-simulator';
import { HubMessage } from '../shared/models/message.model';

export interface ThreeJSSceneConfig {
  debugMode?: boolean;
}

@Component({
  selector: 'tjs-threejs-scene-pure',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="threejs-scene-container">
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
      <div class="canvas-container" #canvasContainer></div>
    </div>
  `,
  styleUrls: ['./threejs-scene-pure.component.css']
})
export class ThreeJSScenePureComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef;
  @Input() config: ThreeJSSceneConfig = {};
  @Input() loadingMessage = 'Initializing 3D Scene...';
  @Input() isDemoRunning = false;
  @Input() demoSpeed = 'normal';
  @Input() demoChannel = 'app';
  /** Primary live message stream (canonical API — block-13 / AV-J). */
  @Input() externalMessages$: Observable<HubMessage> = EMPTY;
  /** When true and no external stream is bound, run internal demo simulator. */
  @Input() enableDemoFallback = false;

  @Output() sceneReady = new EventEmitter<void>();
  @Output() connectionStatusChange = new EventEmitter<string>();
  @Output() sceneError = new EventEmitter<Error>();
  @Output() fpsUpdate = new EventEmitter<number>();
  @Output() particleCountUpdate = new EventEmitter<number>();
  @Output() animationCountUpdate = new EventEmitter<number>();

  public isLoading = true;
  public connectionStatus = 'disconnected';
  public currentFPS = 0;

  private readonly kitScene = inject(KitSceneFacade);
  private readonly kitAnimation = inject(KitAnimationFacade);
  private readonly kitTrajectory = inject(KitTrajectoryFacade);
  private readonly demoSimulator = inject(DemoMessageSimulator);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();
  private demoFallbackActive = false;

  ngOnInit(): void {
    this.connectionStatusChange.emit(this.connectionStatus);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isDemoRunning']) {
      const current = changes['isDemoRunning'].currentValue;
      const previous = changes['isDemoRunning'].previousValue;
      if (current && !previous) {
        this.startDemo();
      } else if (!current && previous) {
        this.stopDemo();
      }
    }
  }

  ngAfterViewInit(): void {
    if (!this.canvasContainer) {
      this.sceneError.emit(new Error('Canvas container not available'));
      return;
    }
    void this.initializeThreeScene();
  }

  ngOnDestroy(): void {
    this.stopDemo();
    this.destroy$.next();
    this.destroy$.complete();
    this.kitTrajectory.dispose();
    this.kitAnimation.dispose();
    this.kitScene.dispose();
  }

  private async initializeThreeScene(): Promise<void> {
    try {
      await this.kitScene.initialize(this.canvasContainer.nativeElement);

      const scene = this.kitScene.getScene();
      if (scene) {
        this.kitTrajectory.setScene(scene);
      }

      this.kitAnimation.start();
      this.kitScene.onBeforeRender
        .pipe(takeUntil(this.destroy$))
        .subscribe((dt) => {
          this.kitAnimation.update();
          this.kitTrajectory.updateParticles(dt);
          this.particleCountUpdate.emit(this.kitTrajectory.getActiveParticleCount());
          this.animationCountUpdate.emit(this.kitAnimation.getActiveAnimationCount());
        });

      this.kitScene.fps.pipe(takeUntil(this.destroy$)).subscribe((fps) => {
        this.currentFPS = Math.round(fps);
        this.fpsUpdate.emit(this.currentFPS);
      });

      this.bindMessageStream();

      this.isLoading = false;
      this.sceneReady.emit();
      this.cdr.detectChanges();
    } catch (error) {
      this.isLoading = false;
      this.sceneError.emit(error as Error);
      this.cdr.detectChanges();
    }
  }

  private bindMessageStream(): void {
    const external = this.externalMessages$;
    if (external) {
      external.pipe(takeUntil(this.destroy$)).subscribe((message) => {
        this.handleIncomingMessage(message);
      });
    }

    if (this.enableDemoFallback && !this.demoFallbackActive) {
      this.startDemoFallback();
    }
  }

  private startDemoFallback(): void {
    this.demoFallbackActive = true;
    this.demoSimulator.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => this.handleIncomingMessage(message));
    this.connectionStatus = 'demo';
    this.connectionStatusChange.emit('demo');
  }

  private handleIncomingMessage(message: HubMessage): void {
    this.createMessageVisualization(message);
  }

  private createMessageVisualization(message: HubMessage): void {
    if (!message.fromBot || !message.toBot) {
      return;
    }

    if (!message.type) {
      if (message.fromBot === 'CentralHub') {
        message.type = 'center-to-bot';
      } else if (message.toBot === 'CentralHub') {
        message.type = 'bot-to-center';
      } else {
        message.type = 'bot-to-bot';
      }
    }

    let startPosition: THREE.Vector3;
    let endPosition: THREE.Vector3;

    if (message.type === 'bot-to-center') {
      startPosition = this.getBotPosition(message.fromBot);
      endPosition = new THREE.Vector3(0, 1, 0);
    } else if (message.type === 'center-to-bot') {
      startPosition = new THREE.Vector3(0, 1, 0);
      endPosition = this.getBotPosition(message.toBot);
    } else if (message.type === 'bot-to-bot') {
      startPosition = this.getBotPosition(message.fromBot);
      endPosition = this.getBotPosition(message.toBot);
    } else {
      startPosition = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 2 + 1, (Math.random() - 0.5) * 8);
      endPosition = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 2 + 1, (Math.random() - 0.5) * 8);
    }

    const particleId = `particle_${message.id || Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.kitTrajectory.createMessageParticle(
      particleId,
      startPosition,
      endPosition,
      message.channel || 'app',
      1.5,
    );
  }

  private getBotPosition(botName: string): THREE.Vector3 {
    const botPositions = [
      new THREE.Vector3(4, 1, 0),
      new THREE.Vector3(3, 1, 3),
      new THREE.Vector3(0, 1, 4),
      new THREE.Vector3(-3, 1, 3),
      new THREE.Vector3(-4, 1, 0),
      new THREE.Vector3(-3, 1, -3),
      new THREE.Vector3(0, 1, -4),
      new THREE.Vector3(3, 1, -3),
    ];
    let hash = 0;
    for (let i = 0; i < botName.length; i++) {
      hash += botName.charCodeAt(i);
    }
    return botPositions[hash % botPositions.length];
  }

  public resetScene(): void {
    this.kitTrajectory.clearAllParticles();
    this.kitScene.reset();
  }

  public resetCamera(): void {
    this.kitScene.reset();
  }

  public toggleWireframe(): void {
    // placeholder — hub scene has no wireframe toggle yet
  }

  public takeScreenshot(): string {
    const renderer = this.kitScene.getRenderer();
    return renderer ? renderer.domElement.toDataURL('image/png') : '';
  }

  public getActiveParticleCount(): number {
    return this.kitTrajectory.getActiveParticleCount();
  }

  public getActiveAnimationCount(): number {
    return this.kitAnimation.getActiveAnimationCount();
  }

  public isWireframeMode(): boolean {
    return false;
  }

  public startDemo(): void {
    if (this.demoSimulator) {
      this.demoSimulator.start();
      // block-16: demo simulator ≠ session connection — only offline fallback updates status
      if (this.enableDemoFallback) {
        this.connectionStatus = 'demo';
        this.connectionStatusChange.emit('demo');
      }
    }
  }

  public stopDemo(): void {
    this.demoSimulator?.stop();
  }

  public sendSingleDemoMessage(): void {
    this.demoSimulator?.sendTestMessage();
  }

  public sendDemoBurst(): void {
    for (let i = 0; i < 5; i++) {
      this.demoSimulator?.sendTestMessage();
    }
  }

  public resetDemoSimulator(): void {
    this.stopDemo();
  }

  public setDemoPhase(_phase: string): void {}
  public setDemoSpeed(_speed: string): void {}
  public setDemoChannel(_channel: string): void {}
}
