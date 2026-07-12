import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoControlsComponent } from '../shared/components/demo-controls.component';
import { VisualControlsComponent } from '../shared/components/visual-controls.component';

export interface ThreeJSControlsState {
  // Demo state
  isDemoRunning: boolean;
  demoPhase: string;
  demoSpeed: string; // Changed from number to string ("slow", "normal", "fast")
  demoChannel: string;
  demoMessagesCount: number;
  
  // Visual state
  isWireframeMode: boolean;
  currentFPS: number;
  particleCount: number;
  animationCount: number;
  
  // Connection state
  connectionStatus: string;
  isLoading: boolean;
  isOfflineMode: boolean;
  /** Live session: Send One enabled when deck has a cast target (block-16). */
  operatorCastEnabled?: boolean;
  /** Live zeus host — Send One does not require demo Start (block-16). */
  liveSessionMode?: boolean;
}

export interface ThreeJSControlsEvents {
  // Demo events
  toggleDemo: void;
  phaseChange: string;
  speedChange: string; // Changed from number to string
  channelChange: string;
  singleMessage: void;
  burst: void;
  resetDemo: void;
  
  // Visual events
  toggleWireframe: void;
  resetCamera: void;
  takeScreenshot: void;
  resetScene: void;
  
  // Connection events
  connect: void;
  disconnect: void;
  toggleOffline: void;
  
  // Modal events
  openSettings: void;
  openHelp: void;
  openAdvanced: void;
}

@Component({
  selector: 'tjs-threejs-controls',
  standalone: true,
  imports: [
    CommonModule,
    DemoControlsComponent,
    VisualControlsComponent
  ],
  template: `
    <div class="threejs-controls-container">
      <!-- Demo Controls Section -->
      <div class="control-section">
        <demo-controls 
          [state]="{
            isRunning: state.isDemoRunning,
            phase: state.demoPhase,
            speed: state.demoSpeed,
            channel: state.demoChannel,
            messagesCount: state.demoMessagesCount,
            castEnabled: state.operatorCastEnabled ?? false,
            liveSessionMode: state.liveSessionMode ?? false
          }"
          (toggle)="events.toggleDemo.emit()"
          (phaseChange)="events.phaseChange.emit($event)"
          (speedChange)="events.speedChange.emit($event)"
          (channelChange)="events.channelChange.emit($event)"
          (singleMessage)="events.singleMessage.emit()"
          (burst)="events.burst.emit()"
          (reset)="events.resetDemo.emit()">
        </demo-controls>
      </div>

      <!-- Visual Controls Section -->
      <div class="control-section">
        <visual-controls 
          [state]="{
            isWireframeMode: state.isWireframeMode,
            currentFPS: state.currentFPS,
            particleCount: state.particleCount,
            animationCount: state.animationCount
          }"
          (toggleWireframe)="events.toggleWireframe.emit()"
          (resetCamera)="events.resetCamera.emit()"
          (takeScreenshot)="events.takeScreenshot.emit()"
          (resetScene)="events.resetScene.emit()">
        </visual-controls>
      </div>

      <!-- Modal Controls Section -->
      <div class="control-section">
        <div class="modal-controls">
          <h4>🪟 Windows</h4>
          <div class="modal-button-grid">
            <button class="btn btn-secondary modal-btn" (click)="events.openSettings.emit()">
              ⚙️ Settings
            </button>
            <button class="btn btn-secondary modal-btn" (click)="events.openHelp.emit()">
              📖 Help
            </button>
            <button class="btn btn-secondary modal-btn" (click)="events.openAdvanced.emit()">
              🎛️ Advanced
            </button>
          </div>
        </div>
      </div>

      <!-- Connection Controls Section -->
      <div class="control-section">
        <div class="connection-controls">
          <h4>🔗 Connection</h4>
          <div class="connection-button-grid">
            <button class="btn btn-primary" 
                    *ngIf="state.connectionStatus === 'disconnected' || state.connectionStatus === 'error'"
                    (click)="events.connect.emit()">
              {{ state.isLoading ? 'Connecting...' : '🔌 Connect' }}
            </button>
            
            <button class="btn btn-danger" 
                    *ngIf="state.connectionStatus === 'connected'"
                    (click)="events.disconnect.emit()">
              🔌 Disconnect
            </button>
            
            <button class="btn btn-warning" 
                    (click)="events.toggleOffline.emit()">
              {{ state.isOfflineMode ? '🔄 Try Reconnect' : '📴 Offline Mode' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./threejs-controls.component.css']
})
export class ThreeJSControlsComponent {
  @Input() state!: ThreeJSControlsState;
  @Input() events!: {
    [K in keyof ThreeJSControlsEvents]: EventEmitter<ThreeJSControlsEvents[K]>
  };
}
