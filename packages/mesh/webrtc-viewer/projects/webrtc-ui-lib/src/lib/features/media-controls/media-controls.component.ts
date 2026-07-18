/**
 * Procedencia: web-rtc-gamify-ui media-controls @ 4b9271b
 * Adaptado WP-U89: llamar / compartir / colgar → WebRTCEngine.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'wrtc-media-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="media-controls" data-provenance="media-controls@4b9271b">
      <video *ngIf="localStream" [srcObject]="localStream" autoplay playsinline muted></video>
      <video *ngIf="remoteStream" [srcObject]="remoteStream" autoplay playsinline></video>
      <div class="btns">
        <button type="button" (click)="call.emit()">llamar</button>
        <button type="button" (click)="share.emit()">compartir</button>
        <button type="button" (click)="hangup.emit()">colgar</button>
      </div>
    </section>
  `
})
export class MediaControlsComponent {
  @Input() localStream: MediaStream | null = null;
  @Input() remoteStream: MediaStream | null = null;
  @Output() call = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() hangup = new EventEmitter<void>();
}
