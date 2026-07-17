import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, EMPTY } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService, ModalState } from '../../shared/services/modal.service';
import { DraggableModalComponent } from '../../shared/components/draggable-modal.component';
import { BotListComponent } from '../../features/bot-management/bot-list.component';
import { MessagePanelComponent } from '../../features/message-panel/message-panel.component';
import { HubMessage } from '../../shared/models/message.model';

@Component({
  selector: 'app-modal-manager',
  standalone: true,
  imports: [
    CommonModule,
    DraggableModalComponent,
    BotListComponent,
    MessagePanelComponent,
  ],
  template: `
    <app-draggable-modal
      *ngFor="let modal of openModals; trackBy: trackModal"
      [modalState]="modal"
      (closed)="onModalClosed($event)"
    >
      <app-bot-list *ngIf="modal.id === 'bot-management'" [messages$]="messages$"></app-bot-list>
      <app-message-panel *ngIf="modal.id === 'message-panel'" [messages$]="messages$"></app-message-panel>
      <div *ngIf="modal.id === 'settings'">
        <h4>⚙️ Settings</h4>
        <p>Configure your preferences here.</p>
        <div class="form-group">
          <label>Animation Speed:</label>
          <input type="range" min="0.1" max="2" step="0.1" value="1">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" checked> Enable Particles
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox"> Debug Mode
          </label>
        </div>
      </div>
      
      <div *ngIf="modal.id === 'help'">
        <h4>📖 Help & Controls</h4>
        <div class="help-content">
          <h5>🎮 Controls:</h5>
          <ul>
            <li><strong>Mouse:</strong> Orbit camera around scene</li>
            <li><strong>Scroll:</strong> Zoom in/out</li>
            <li><strong>Drag:</strong> Move modal windows</li>
          </ul>
          
          <h5>🎨 Particle Colors:</h5>
          <ul>
            <li><span class="color-indicator sys"></span> <strong>SYS:</strong> System messages (Red)</li>
            <li><span class="color-indicator app"></span> <strong>APP:</strong> Application messages (Blue)</li>
            <li><span class="color-indicator ui"></span> <strong>UI:</strong> Interface messages (Green)</li>
            <li><span class="color-indicator agent"></span> <strong>AGENT:</strong> Agent messages (Orange)</li>
            <li><span class="color-indicator game"></span> <strong>GAME:</strong> Game messages (Purple)</li>
          </ul>
          
          <h5>⚡ Quick Actions:</h5>
          <ul>
            <li><strong>Start Demo:</strong> Begin message simulation</li>
            <li><strong>Reset Scene:</strong> Clear all particles</li>
            <li><strong>Connect:</strong> Connect to zeus session (host)</li>
          </ul>
        </div>
      </div>
    </app-draggable-modal>

    <!-- Taskbar for minimized windows -->
    <div class="taskbar" *ngIf="minimizedModals.length > 0">
      <div class="taskbar-items">
        <button 
          *ngFor="let modal of minimizedModals"
          class="taskbar-item"
          (click)="restoreModal(modal.id)"
          [title]="modal.config.title"
        >
          <span class="taskbar-icon">🪟</span>
          <span class="taskbar-title">{{ modal.config.title }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .help-content {
      font-size: 14px;
      line-height: 1.5;
    }

    .help-content h5 {
      margin: 16px 0 8px 0;
      color: #3498db;
    }

    .help-content ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .help-content li {
      margin: 4px 0;
    }

    .color-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
      vertical-align: middle;
    }

    .color-indicator.sys { background: #ff4444; }
    .color-indicator.app { background: #4444ff; }
    .color-indicator.ui { background: #44ff44; }
    .color-indicator.agent { background: #ffaa44; }
    .color-indicator.game { background: #aa44ff; }

    .form-group {
      margin: 12px 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .form-group input[type="range"] {
      width: 100%;
      margin: 8px 0;
    }

    .form-group input[type="checkbox"] {
      margin-right: 8px;
    }

    .taskbar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 48px;
      background: rgba(20, 25, 35, 0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 999;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }

    .taskbar-items {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .taskbar-item {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 6px;
      color: #fff;
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      transition: all 0.2s ease;
      max-width: 150px;
    }

    .taskbar-item:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .taskbar-icon {
      font-size: 14px;
    }

    .taskbar-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class ModalManagerComponent implements OnInit, OnDestroy {
  @Input() messages$: Observable<HubMessage> = EMPTY;

  private destroy$ = new Subject<void>();
  
  openModals: ModalState[] = [];
  minimizedModals: ModalState[] = [];

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.modalService.modals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(modals => {
        this.openModals = modals.filter(modal => !modal.isMinimized);
        this.minimizedModals = modals.filter(modal => modal.isMinimized);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackModal(index: number, modal: ModalState): string {
    return modal.id;
  }

  onModalClosed(modalId: string): void {
    console.log(`🪟 Modal closed from manager: ${modalId}`);
  }

  restoreModal(modalId: string): void {
    this.modalService.toggle(modalId);
  }
}
