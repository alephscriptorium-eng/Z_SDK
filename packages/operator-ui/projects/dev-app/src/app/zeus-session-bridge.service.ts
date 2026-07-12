import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { createBrowserRoomClient } from '@zeus/room-client-browser/browser';
import { createOperatorBridge, AlephMessage } from '@zeus/operator-bridge';
import { projectSlice, SCENE_IDS, OperatorSlice } from '@zeus/session-protocol/projection';

export interface ZeusSessionConfig {
  scriptoriumUrl: string;   // e.g. http://localhost:3017/runtime
  room?: string;
  sessionId?: string;
  token: string;
  user?: string;
}

export type OperatorSessionSlice = OperatorSlice;

/**
 * ZeusSessionBridgeService (block-13 L-serve) — the host-side glue.
 *
 * Owns the zeus session connection (@zeus/room-client-browser) and the pure
 * protocol mapping (@zeus/operator-bridge), and exposes a single stream of
 * bot-hub messages that the gamify-ui scene consumes via its
 * `externalMessages$` input. The lib stays generic; all zeus specifics live here.
 */
@Injectable({ providedIn: 'root' })
export class ZeusSessionBridgeService {
  private readonly messages = new Subject<AlephMessage>();
  private readonly snapshotSubject = new Subject<any | null>();
  private client: ReturnType<typeof createBrowserRoomClient> | null = null;
  private readonly bridge = createOperatorBridge();
  private lastSnapshot: any = null;
  private user = 'operator-ui';

  /** Live bot-hub message stream to feed `<tjs-threejs-scene-pure [externalMessages$]>`. */
  readonly messages$: Observable<AlephMessage> = this.messages.asObservable();

  /** Latest session manifest from SET_STATE (block-14). */
  readonly snapshot$: Observable<any | null> = this.snapshotSubject.asObservable();

  /** Operator HUD slice derived via projectSlice — no domain reconstruction in the UI. */
  readonly operatorSlice$: Observable<OperatorSessionSlice | null> = this.snapshot$.pipe(
    map((snapshot) => (snapshot ? projectSlice(snapshot, SCENE_IDS.operator) : null)),
  );

  connected = false;

  /** Whether a live zeus session is connected (block-13 L-serve). */
  isLive(): boolean {
    return this.connected;
  }

  async connect(cfg: ZeusSessionConfig): Promise<void> {
    if (this.client) return;

    this.user = cfg.user ?? 'operator-ui';
    const client = createBrowserRoomClient({
      scriptoriumUrl: cfg.scriptoriumUrl,
      room: cfg.room,
      sessionId: cfg.sessionId ?? 'default',
      token: cfg.token,
      user: this.user,
      type: 'OperatorUI',
    });
    this.client = client;

    const push = (msgs: AlephMessage[]) => msgs.forEach((m) => this.messages.next(m));

    // room channel events → bridge → bot-hub messages
    client.onRoomEvent('PING', (p) => push(this.bridge.onSessionEvent('PING', p)));
    client.onRoomEvent('PONG', (p) => push(this.bridge.onSessionEvent('PONG', p)));
    client.onRoomEvent('selection:cast', (p) => push(this.bridge.onSessionEvent('selection:cast', p)));
    client.onRoomEvent('presence', (p) => push(this.bridge.onSessionEvent('presence', p)));
    // full snapshots → presence reconciliation + last selection (+ keep for outbound)
    client.onState((snapshot) => {
      this.lastSnapshot = snapshot;
      this.snapshotSubject.next(snapshot);
      push(this.bridge.onSnapshot(snapshot));
    });

    await client.connect();
    this.connected = true;
  }

  /** Pick a target registro from the current deck in the last snapshot. */
  pickTarget(deckId: string): any {
    const deck = this.lastSnapshot?.decks?.[deckId];
    const items = deck?.resolved?.registros?.items ?? deck?.resolved?.items ?? [];
    return items[0]?.oldid ?? items[0]?.id ?? null;
  }

  /** True when deck B (or given deck) has a resolved registro to cast (block-16). */
  canCast(deckId = 'B'): boolean {
    if (!this.client || !this.lastSnapshot) return false;
    const targetId = this.pickTarget(deckId);
    return targetId != null && targetId !== '';
  }

  /** DJ-lite: set playhead year on the session. */
  setPlayhead(year: number): void {
    this.emitToSession('domain:playhead:set', { year });
  }

  /** DJ-lite: cue a deck load on the session. */
  deckLoad(opts: { deckId: string; serverName: string; presetId?: string }): void {
    this.emitToSession('domain:deck:load', opts);
  }

  /**
   * block-13 L-outbound: the operator casts an attributed selection back into
   * the session (same contract bots use — the master records it in
   * snapshot.selections and player-3d-ui animates it). Returns the payload sent.
   */
  cast(opts: { deckId?: string; targetId?: any; label?: string } = {}): any {
    if (!this.client) return null;
    const deckId = opts.deckId ?? 'B';
    const targetId = opts.targetId ?? this.pickTarget(deckId);
    if (targetId == null || targetId === '') {
      return null;
    }
    const payload = {
      actorId: this.user,
      kind: 'registro',
      deckId,
      targetId,
      label: opts.label ?? 'operator pick',
      meta: { source: 'operator-ui' },
    };
    this.client.emit('selection:cast', payload);
    return payload;
  }

  /** Generic outbound: emit any room channel event back to the session. */
  emitToSession(event: string, data: any): void {
    this.client?.emit(event, data);
  }

  disconnect(): void {
    this.client?.disconnect();
    this.client = null;
    this.connected = false;
    this.lastSnapshot = null;
    this.snapshotSubject.next(null);
    this.bridge.reset();
  }
}
