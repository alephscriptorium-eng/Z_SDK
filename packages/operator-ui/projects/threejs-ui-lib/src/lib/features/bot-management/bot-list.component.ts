import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, EMPTY } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Bot } from '../../shared/models/bot.model';
import { HubMessage } from '../../shared/models/message.model';

@Component({
  selector: 'app-bot-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bot-list.component.html',
  styleUrls: ['./bot-list.component.css']
})
export class BotListComponent implements OnInit, OnDestroy {
  @Input() messages$: Observable<HubMessage> = EMPTY;

  private destroy$ = new Subject<void>();
  
  bots: Bot[] = [];
  selectedBotIds = new Set<string>();

  ngOnInit() {
    this.initializeBots();

    this.messages$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      this.trackBotActivity(msg);
    });
  }

  private initializeBots(): void {
    const cardinals = [
      { name: 'North', angle: 0, positions: 2 },
      { name: 'East', angle: Math.PI / 2, positions: 2 },
      { name: 'South', angle: Math.PI, positions: 2 },
      { name: 'West', angle: 3 * Math.PI / 2, positions: 2 }
    ];

    this.bots = [];
    
    cardinals.forEach((cardinal) => {
      for (let i = 0; i < cardinal.positions; i++) {
        const botId = `bot_${cardinal.name.toLowerCase()}_${i + 1}`;
        const radius = 5 + (i * 2);
        const angle = cardinal.angle + (i * 0.3);
        
        const bot: Bot = {
          id: botId,
          name: `${cardinal.name} Bot ${i + 1}`,
          status: 'offline',
          position: {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius
          },
          lastActive: null,
          messageCount: 0
        };
        
        this.bots.push(bot);
      }
    });
  }

  private trackBotActivity(msg: HubMessage): void {
    const botNames = new Set([msg.fromBot, msg.toBot].filter((n) => n && n !== 'CentralHub'));
    botNames.forEach((name) => {
      const bot = this.bots.find((b) => b.name === name || b.id === name);
      if (bot) {
        bot.status = 'online';
        bot.messageCount += 1;
        bot.lastActive = new Date(msg.timestamp ?? Date.now());
      }
    });
  }

  onBotClick(bot: Bot): void {
    if (this.selectedBotIds.has(bot.id)) {
      this.selectedBotIds.delete(bot.id);
    } else {
      this.selectedBotIds.add(bot.id);
    }
  }

  startBot(bot: Bot, event: Event): void {
    event.stopPropagation();
    console.log('Starting bot:', bot.id);
  }

  stopBot(bot: Bot, event: Event): void {
    event.stopPropagation();
    console.log('Stopping bot:', bot.id);
  }

  resetBot(bot: Bot, event: Event): void {
    event.stopPropagation();
    console.log('Resetting bot:', bot.id);
  }

  startAllSelected(): void {
    this.selectedBotIds.forEach((botId) => console.log('Starting bot:', botId));
  }

  stopAllSelected(): void {
    this.selectedBotIds.forEach((botId) => console.log('Stopping bot:', botId));
  }

  selectAll(): void {
    this.selectedBotIds.clear();
    this.bots.forEach((bot) => this.selectedBotIds.add(bot.id));
  }

  deselectAll(): void {
    this.selectedBotIds.clear();
  }

  isSelected(bot: Bot): boolean {
    return this.selectedBotIds.has(bot.id);
  }

  getSelectedCount(): number {
    return this.selectedBotIds.size;
  }

  trackBot(index: number, bot: Bot): string {
    return bot.id;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
