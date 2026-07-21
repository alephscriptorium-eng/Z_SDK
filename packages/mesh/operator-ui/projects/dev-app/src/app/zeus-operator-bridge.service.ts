import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { createBrowserRoomClient } from '@zeus/room-client-browser/browser';
import {
  createOperatorBridge,
  projectOperatorSlice,
  makeOperatorIntent,
  WIRE,
} from '@zeus/operator-bridge';
import type { AlephMessage } from '@zeus/operator-bridge';

export interface ZeusOperatorConfig {
  scriptoriumUrl: string;
  room?: string;
  token: string;
  user?: string;
  game?: string;
}

export type OperatorHudSlice = ReturnType<typeof projectOperatorSlice>;

/**
 * ZeusOperatorBridgeService — host glue for the operator vista.
 *
 * Owns the room connection (@zeus/room-client-browser) and the pure protocol
 * mapping (@zeus/operator-bridge). Exposes bot-hub messages for the gamify-ui
 * scene and emits intents with role `operator`.
 */
@Injectable({ providedIn: 'root' })
export class ZeusOperatorBridgeService {
  private readonly messages = new Subject<AlephMessage>();
  private readonly snapshotSubject = new Subject<any | null>();
  private client: ReturnType<typeof createBrowserRoomClient> | null = null;
  private readonly bridge = createOperatorBridge();
  private lastState: any = null;
  private user = 'operator-ui';
  private game = 'ciudad';
  private unsubs: Array<() => void> = [];

  /** Live bot-hub message stream to feed `<tjs-threejs-scene-pure [externalMessages$]>`. */
  readonly messages$: Observable<AlephMessage> = this.messages.asObservable();

  /** Latest game state snapshot. */
  readonly snapshot$: Observable<any | null> = this.snapshotSubject.asObservable();

  /** Operator HUD slice derived via projectOperatorSlice. */
  readonly operatorSlice$: Observable<OperatorHudSlice | null> = this.snapshot$.pipe(
    map((state) => (state ? projectOperatorSlice(state) : null)),
  );

  connected = false;

  isLive(): boolean {
    return this.connected;
  }

  async connect(cfg: ZeusOperatorConfig): Promise<void> {
    if (this.client) return;

    this.user = cfg.user ?? 'operator-ui';
    this.game = cfg.game ?? 'ciudad';
    const client = createBrowserRoomClient({
      scriptoriumUrl: cfg.scriptoriumUrl,
      room: cfg.room,
      token: cfg.token,
      user: this.user,
      type: 'OperatorUI',
      features: ['operator', 'viewer', this.game],
    });
    this.client = client;

    const push = (msgs: AlephMessage[]) => msgs.forEach((m) => this.messages.next(m));

    this.unsubs.push(
      client.onState((state: any) => {
        this.lastState = state;
        this.snapshotSubject.next(state);
        push(this.bridge.onState(state));
      }),
    );

    for (const ev of WIRE.LEDGER) {
      this.unsubs.push(
        client.onRoomEvent(ev, (entry: any) => {
          push(this.bridge.onLedger(entry));
        }),
      );
    }

    await client.connect();
    this.connected = true;
  }

  /**
   * Emit an operator intent (default `inspect`) into the game room.
   * Returns the payload sent, or null if not connected.
   */
  inspect(opts: { targetId?: any; label?: string } = {}): any {
    return this.emitOperatorIntent('inspect', {
      ...(opts.targetId != null ? { targetId: opts.targetId } : {}),
      ...(opts.label != null ? { label: opts.label } : {}),
    });
  }

  /** Generic outbound: intent with role `operator`. */
  emitOperatorIntent(intent: string, args: Record<string, unknown> = {}): any {
    if (!this.client) return null;
    const payload = makeOperatorIntent(this.user, intent, args, {
      game: this.game,
      from: this.user,
    });
    for (const ev of WIRE.INTENT) {
      this.client.emit(ev, payload);
    }
    return payload;
  }

  disconnect(): void {
    for (const off of this.unsubs) off();
    this.unsubs = [];
    this.client?.disconnect();
    this.client = null;
    this.connected = false;
    this.lastState = null;
    this.snapshotSubject.next(null);
    this.bridge.reset();
  }
}
