/**
 * Procedencia: web-rtc-gamify-ui chat.component.ts @ 4b9271b
 * Adaptado WP-U89: chat vía DataChannel del WebRTCEngine (no estado de juego).
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface WrtcChatLine {
  from: string;
  text: string;
  own?: boolean;
}

@Component({
  selector: 'wrtc-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="chat" data-provenance="chat@4b9271b">
      <h3>Chat</h3>
      <div class="log">
        <div *ngFor="let m of messages" [class.own]="m.own">{{ m.from }}: {{ m.text }}</div>
      </div>
      <form (ngSubmit)="send()">
        <input [(ngModel)]="draft" name="draft" placeholder="mensaje…" />
        <button type="submit">enviar</button>
      </form>
    </section>
  `
})
export class ChatComponent {
  @Input() messages: WrtcChatLine[] = [];
  @Output() sendText = new EventEmitter<string>();
  draft = '';

  send() {
    const text = this.draft.trim();
    if (!text) return;
    this.sendText.emit(text);
    this.draft = '';
  }
}
