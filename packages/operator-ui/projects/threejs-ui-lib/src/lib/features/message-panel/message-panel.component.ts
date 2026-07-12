import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, EMPTY } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Message, HubMessage } from '../../shared/models/message.model';

@Component({
  selector: 'app-message-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.css']
})
export class MessagePanelComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messageContainer', { static: false }) messageContainer!: ElementRef;
  @Input() messages$: Observable<HubMessage> = EMPTY;
  
  private destroy$ = new Subject<void>();
  
  messages: Message[] = [];
  filteredMessages: Message[] = [];
  
  filters = {
    sys: true,
    app: true,
    ui: true,
    agent: true,
    game: true,
  };

  maxMessages = 500;
  autoScroll = true;
  
  messageStats = {
    total: 0,
    sys: 0,
    app: 0,
    ui: 0
  };

  ngOnInit() {
    this.messages$.pipe(takeUntil(this.destroy$)).subscribe((hubMsg) => {
      this.addHubMessage(hubMsg);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private addHubMessage(hubMsg: HubMessage): void {
    const message: Message = {
      id: hubMsg.id,
      timestamp: new Date(hubMsg.timestamp ?? Date.now()),
      channel: hubMsg.channel,
      content: hubMsg.content ?? `${hubMsg.fromBot} → ${hubMsg.toBot}`,
      type: hubMsg.type ?? 'hub',
      source: hubMsg.fromBot,
      target: hubMsg.toBot,
    };

    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    this.updateStats();
    this.applyFilters();
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private updateStats(): void {
    this.messageStats = {
      total: this.messages.length,
      sys: this.messages.filter((m) => m.channel === 'sys').length,
      app: this.messages.filter((m) => m.channel === 'app').length,
      ui: this.messages.filter((m) => m.channel === 'ui').length
    };
  }

  private applyFilters(): void {
    this.filteredMessages = this.messages.filter((message) => {
      return this.filters[message.channel as keyof typeof this.filters] ?? true;
    });
  }

  toggleFilter(channel: string): void {
    this.filters[channel as keyof typeof this.filters] = !this.filters[channel as keyof typeof this.filters];
    this.applyFilters();
  }

  clearMessages(): void {
    this.messages = [];
    this.filteredMessages = [];
    this.updateStats();
  }

  private scrollToBottom(): void {
    if (this.messageContainer && this.autoScroll) {
      try {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Error scrolling to bottom:', err);
      }
    }
  }

  toggleAutoScroll(): void {
    this.autoScroll = !this.autoScroll;
  }

  getChannelClass(channel: string): string {
    const channelClasses: { [key: string]: string } = {
      'sys': 'channel-sys',
      'app': 'channel-app',
      'ui': 'channel-ui',
      'agent': 'channel-agent',
      'game': 'channel-game',
    };
    return channelClasses[channel] || 'channel-default';
  }

  getFilteredCount(): number {
    return this.filteredMessages.length;
  }

  isFilterActive(channel: string): boolean {
    return this.filters[channel as keyof typeof this.filters];
  }

  showAllFilters(): void {
    Object.keys(this.filters).forEach((k) => {
      this.filters[k as keyof typeof this.filters] = true;
    });
    this.applyFilters();
  }

  clearAllFilters(): void {
    Object.keys(this.filters).forEach((k) => {
      this.filters[k as keyof typeof this.filters] = false;
    });
    this.applyFilters();
  }

  trackMessage(index: number, message: Message): string {
    return message.id;
  }

  onMessageClick(message: Message): void {
    console.log('Message clicked:', message);
  }

  getTimeString(timestamp: Date): string {
    return timestamp.toLocaleTimeString();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
