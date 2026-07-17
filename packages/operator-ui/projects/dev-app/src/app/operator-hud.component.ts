import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { ZeusOperatorBridgeService, OperatorHudSlice } from './zeus-operator-bridge.service';

@Component({
  selector: 'app-operator-hud',
  imports: [AsyncPipe],
  template: `
    @if (slice$ | async; as slice) {
      <aside class="operator-hud" aria-label="Operator HUD">
        <header class="operator-hud__title">Operador</header>
        <dl class="operator-hud__grid">
          <div>
            <dt>Escena</dt>
            <dd>{{ slice.sceneId ?? '—' }}</dd>
          </div>
          <div>
            <dt>Gamemap</dt>
            <dd>{{ slice.gamemapId ?? '—' }}</dd>
          </div>
          <div>
            <dt>Actores</dt>
            <dd>{{ slice.actorCount }}</dd>
          </div>
          <div>
            <dt>Objetivo</dt>
            <dd>
              @if (objetivoOf(slice); as obj) {
                label {{ obj.labeled[0] }}/{{ obj.labeled[1] }}
                · excav {{ obj.excavated[0] }}/{{ obj.excavated[1] }}
              } @else {
                —
              }
            </dd>
          </div>
        </dl>

        @if (actorEntries(slice).length) {
          <section class="operator-hud__section" aria-label="Actores en room">
            <h3 class="operator-hud__subtitle">Actores</h3>
            <ul class="operator-hud__list">
              @for (entry of actorEntries(slice); track entry.id) {
                <li>
                  <span class="operator-hud__actor">{{ entry.id }}</span>
                  <span class="operator-hud__meta">{{ entry.zone ?? entry.kind ?? '?' }}</span>
                </li>
              }
            </ul>
          </section>
        }

        @if (bridge.isLive()) {
          <section class="operator-hud__controls" aria-label="Controles operador">
            <h3 class="operator-hud__subtitle">Inspect</h3>
            <div class="operator-hud__row">
              <button type="button" (click)="runInspect(slice)">Inspect spawn</button>
            </div>
          </section>
        }
      </aside>
    } @else {
      <aside class="operator-hud operator-hud--empty" aria-label="Operator HUD">
        <span>Sin snapshot de estado</span>
      </aside>
    }
  `,
  styles: `
    .operator-hud {
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

    .operator-hud--empty {
      opacity: 0.65;
      font-style: italic;
    }

    .operator-hud__title {
      margin: 0 0 0.4rem;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7eb8ff;
    }

    .operator-hud__subtitle {
      margin: 0.5rem 0 0.25rem;
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #6a90b8;
      font-weight: 600;
    }

    .operator-hud__grid {
      margin: 0;
      display: grid;
      gap: 0.35rem;
    }

    .operator-hud__grid div {
      display: grid;
      grid-template-columns: 5.5rem 1fr;
      gap: 0.35rem;
      align-items: baseline;
    }

    .operator-hud__grid dt {
      margin: 0;
      color: #8aa0c0;
    }

    .operator-hud__grid dd {
      margin: 0;
      word-break: break-word;
    }

    .operator-hud__section {
      margin-top: 0.35rem;
      border-top: 1px solid rgba(120, 180, 255, 0.15);
      padding-top: 0.35rem;
    }

    .operator-hud__list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.2rem;
    }

    .operator-hud__actor {
      color: #9ec8ff;
      font-weight: 500;
    }

    .operator-hud__meta {
      margin-left: 0.25rem;
      color: #6a8098;
      font-size: 10px;
    }

    .operator-hud__controls {
      pointer-events: auto;
      margin-top: 0.35rem;
      border-top: 1px solid rgba(120, 180, 255, 0.2);
      padding-top: 0.35rem;
    }

    .operator-hud__row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.3rem;
    }

    .operator-hud__controls button {
      padding: 0.2rem 0.45rem;
      border: 1px solid rgba(120, 180, 255, 0.4);
      border-radius: 0.25rem;
      background: rgba(30, 50, 80, 0.6);
      color: #d8e8ff;
      font: inherit;
      cursor: pointer;
    }

    .operator-hud__controls button:hover {
      background: rgba(50, 80, 120, 0.75);
    }
  `,
})
export class OperatorHudComponent {
  protected readonly bridge = inject(ZeusOperatorBridgeService);
  protected readonly slice$ = this.bridge.operatorSlice$;
  private inspectCount = 0;

  actorEntries(slice: OperatorHudSlice): Array<{ id: string; zone?: string; kind?: string }> {
    const actors = slice?.actors ?? {};
    return Object.entries(actors).map(([id, a]) => ({
      id,
      zone: (a as { zone?: string })?.zone,
      kind: (a as { kind?: string })?.kind,
    }));
  }

  objetivoOf(
    slice: OperatorHudSlice,
  ): { labeled: [number, number | string]; excavated: [number, number | string] } | null {
    const obj = slice?.objetivo as
      | { labeled?: number[]; excavated?: number[] }
      | null
      | undefined;
    if (!obj || !Array.isArray(obj.labeled) || !Array.isArray(obj.excavated)) return null;
    return {
      labeled: [obj.labeled[0] ?? 0, obj.labeled[1] ?? '—'],
      excavated: [obj.excavated[0] ?? 0, obj.excavated[1] ?? '—'],
    };
  }

  runInspect(slice: OperatorHudSlice): void {
    this.inspectCount += 1;
    const firstActor = this.actorEntries(slice)[0]?.id;
    this.bridge.inspect({
      targetId: firstActor ?? 'spawn',
      label: `operator inspect #${this.inspectCount}`,
    });
  }
}
