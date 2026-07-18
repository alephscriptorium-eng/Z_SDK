/**
 * Procedencia: web-rtc-gamify-ui peer-list.component.ts @ 4b9271b
 * Adaptado WP-U89: lista peers del WebRTCEngine Zeus (sin Aleph client).
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface WrtcPeerRow {
  id: string;
  connectionState: string;
}

@Component({
  selector: 'wrtc-peer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="peer-list" data-provenance="peer-list@4b9271b">
      <header>
        <h3>{{ title }} <span>({{ peers.length }})</span></h3>
      </header>
      <ul>
        <li *ngFor="let p of peers">{{ p.id }} · {{ p.connectionState }}</li>
      </ul>
      <p *ngIf="peers.length === 0" class="empty">sin peers</p>
      <button type="button" (click)="select.emit(selectedId)" [disabled]="!selectedId">
        conectar
      </button>
      <input [(ngModel)]="selectedId" name="peerId" placeholder="peer id" />
    </section>
  `
})
export class PeerListComponent {
  @Input() title = 'Participants';
  @Input() peers: WrtcPeerRow[] = [];
  @Output() select = new EventEmitter<string>();
  selectedId = '';
}
