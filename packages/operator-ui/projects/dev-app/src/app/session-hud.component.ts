import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { ZeusSessionBridgeService, OperatorSessionSlice } from './zeus-session-bridge.service';

type SelectionEntry = NonNullable<OperatorSessionSlice>['selections']['log'][number];

@Component({
  selector: 'app-session-hud',
  imports: [AsyncPipe],
  template: `
    @if (slice$ | async; as slice) {
      <aside class="session-hud" aria-label="Session HUD">
        <header class="session-hud__title">Sesión</header>
        <dl class="session-hud__grid">
          <div>
            <dt>Fase</dt>
            <dd>{{ slice.phase ?? '—' }}</dd>
          </div>
          <div>
            <dt>Playhead</dt>
            <dd>
              {{ slice.playhead?.year ?? '—' }}
              <span class="session-hud__pill" [class.session-hud__pill--on]="slice.playhead?.playing">
                {{ slice.playhead?.playing ? '▶' : '⏸' }}
              </span>
            </dd>
          </div>
          <div>
            <dt>Decks</dt>
            <dd>A {{ slice.decks?.A ?? '—' }} · B {{ slice.decks?.B ?? '—' }} · C {{ slice.decks?.C ?? '—' }}</dd>
          </div>
          <div>
            <dt>Última selección</dt>
            <dd>
              @if (slice.selectionLast; as sel) {
                <span class="session-hud__selection">{{ sel.actorId }} → {{ sel.label ?? sel.targetId }}</span>
              } @else {
                —
              }
            </dd>
          </div>
        </dl>

        @if (byActorEntries(slice).length) {
          <section class="session-hud__section" aria-label="Selecciones por actor">
            <h3 class="session-hud__subtitle">Por actor</h3>
            <ul class="session-hud__list">
              @for (entry of byActorEntries(slice); track entry.actorId) {
                <li>
                  <span class="session-hud__actor">{{ entry.actorId }}</span>
                  → {{ entry.label ?? entry.targetId }}
                  <span class="session-hud__meta">deck {{ entry.deckId ?? '?' }}</span>
                </li>
              }
            </ul>
          </section>
        }

        @if (recentLog(slice).length) {
          <section class="session-hud__section" aria-label="Log de selecciones">
            <h3 class="session-hud__subtitle">Log (últimas {{ recentLog(slice).length }})</h3>
            <ul class="session-hud__list session-hud__list--log">
              @for (entry of recentLog(slice); track $index) {
                <li>
                  <span class="session-hud__actor">{{ entry.actorId }}</span>
                  → {{ entry.label ?? entry.targetId }}
                </li>
              }
            </ul>
          </section>
        }

        @if (bridge.isLive()) {
          <section class="session-hud__controls" aria-label="Controles operador">
            <h3 class="session-hud__subtitle">DJ-lite</h3>
            <div class="session-hud__row">
              <label class="session-hud__label" for="hud-year">Año</label>
              <div class="session-hud__stepper">
                <button type="button" (click)="bumpYear(slice, -1)" aria-label="Año anterior">−</button>
                <input
                  id="hud-year"
                  type="number"
                  [value]="slice.playhead?.year ?? yearDraft"
                  (change)="onYearInput($event)"
                />
                <button type="button" (click)="bumpYear(slice, 1)" aria-label="Año siguiente">+</button>
              </div>
            </div>
            <div class="session-hud__row session-hud__deck-row">
              <button type="button" (click)="cueDeck('A', 'linea-espana')">Cue A</button>
              <button type="button" (click)="cueDeck('B', 'linea-wp-historia')">Cue B</button>
              <button type="button" (click)="cueDeck('C', 'linea-firehose')">Cue C</button>
            </div>
          </section>
        }
      </aside>
    } @else {
      <aside class="session-hud session-hud--empty" aria-label="Session HUD">
        <span>Sin snapshot de sesión</span>
      </aside>
    }
  `,
  styles: `
    .session-hud {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 20;
      min-width: 14rem;
      max-width: 24rem;
      max-height: calc(100vh - 1.5rem);
      overflow-y: auto;
      padding: 0.65rem 0.75rem;
      border: 1px solid rgba(120, 180, 255, 0.35);
      border-radius: 0.5rem;
      background: rgba(8, 12, 24, 0.82);
      color: #d8e8ff;
      font: 12px/1.35 system-ui, sans-serif;
      pointer-events: none;
      backdrop-filter: blur(6px);
    }

    .session-hud--empty {
      opacity: 0.65;
      font-style: italic;
    }

    .session-hud__title {
      margin: 0 0 0.4rem;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7eb8ff;
    }

    .session-hud__subtitle {
      margin: 0.5rem 0 0.25rem;
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #6a90b8;
      font-weight: 600;
    }

    .session-hud__grid {
      margin: 0;
      display: grid;
      gap: 0.35rem;
    }

    .session-hud__grid div {
      display: grid;
      grid-template-columns: 5.5rem 1fr;
      gap: 0.35rem;
      align-items: baseline;
    }

    .session-hud__grid dt {
      margin: 0;
      color: #8aa0c0;
    }

    .session-hud__grid dd {
      margin: 0;
      word-break: break-word;
    }

    .session-hud__section {
      margin-top: 0.35rem;
      border-top: 1px solid rgba(120, 180, 255, 0.15);
      padding-top: 0.35rem;
    }

    .session-hud__list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.2rem;
    }

    .session-hud__list--log {
      font-size: 11px;
      opacity: 0.9;
    }

    .session-hud__actor {
      color: #9ec8ff;
      font-weight: 500;
    }

    .session-hud__meta {
      margin-left: 0.25rem;
      color: #6a8098;
      font-size: 10px;
    }

    .session-hud__pill {
      display: inline-block;
      margin-left: 0.25rem;
      padding: 0 0.25rem;
      border-radius: 0.2rem;
      background: rgba(255, 255, 255, 0.08);
      opacity: 0.55;
    }

    .session-hud__pill--on {
      background: rgba(80, 200, 120, 0.25);
      opacity: 1;
    }

    .session-hud__selection {
      color: #ffe08a;
    }

    .session-hud__controls {
      pointer-events: auto;
      margin-top: 0.35rem;
      border-top: 1px solid rgba(120, 180, 255, 0.2);
      padding-top: 0.35rem;
    }

    .session-hud__row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.3rem;
    }

    .session-hud__label {
      flex: 0 0 2.5rem;
      color: #8aa0c0;
    }

    .session-hud__stepper {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .session-hud__stepper input {
      width: 4.5rem;
      padding: 0.15rem 0.3rem;
      border: 1px solid rgba(120, 180, 255, 0.35);
      border-radius: 0.25rem;
      background: rgba(0, 0, 0, 0.35);
      color: #d8e8ff;
      font: inherit;
    }

    .session-hud__deck-row {
      flex-wrap: wrap;
    }

    .session-hud__controls button {
      padding: 0.2rem 0.45rem;
      border: 1px solid rgba(120, 180, 255, 0.4);
      border-radius: 0.25rem;
      background: rgba(30, 50, 80, 0.6);
      color: #d8e8ff;
      font: inherit;
      cursor: pointer;
    }

    .session-hud__controls button:hover {
      background: rgba(50, 80, 120, 0.75);
    }
  `,
})
export class SessionHudComponent {
  protected readonly bridge = inject(ZeusSessionBridgeService);
  protected readonly slice$ = this.bridge.operatorSlice$;
  protected yearDraft = new Date().getFullYear();

  recentLog(slice: OperatorSessionSlice): SelectionEntry[] {
    const log = slice?.selections?.log ?? [];
    return log.slice(-5).reverse();
  }

  byActorEntries(slice: OperatorSessionSlice): Array<SelectionEntry & { actorId: string }> {
    const byActor = slice?.selections?.byActor ?? {};
    return Object.entries(byActor).map(([actorId, sel]) => ({ actorId, ...sel }));
  }

  bumpYear(slice: OperatorSessionSlice, delta: number): void {
    const base = slice.playhead?.year ?? this.yearDraft;
    this.bridge.setPlayhead(base + delta);
  }

  onYearInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const year = Number(raw);
    if (!Number.isFinite(year)) return;
    this.yearDraft = year;
    this.bridge.setPlayhead(year);
  }

  cueDeck(deckId: string, serverName: string): void {
    this.bridge.deckLoad({ deckId, serverName });
  }
}
