import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { createBrowserRoomClient } from '@zeus/room-client-browser/browser';
import {
  createOperatorBridge,
  projectOperatorSlice,
  makeOperatorIntent,
  campanasFromLedger,
  WIRE,
} from '@zeus/operator-bridge';
import type { AlephMessage } from '@zeus/operator-bridge';

import { CampanasAudioService } from './campanas-audio.service';

/** Default entrant base (embajador-kit / startpack-ciudad-v0.1.0). */
export const PUERTA_DEFAULT_STARTPACK_REF = 'startpack-ciudad-v0.1.0';

export interface ZeusOperatorConfig {
  scriptoriumUrl: string;
  room?: string;
  token: string;
  user?: string;
  game?: string;
  puerta?: PuertaSlice;
}

export interface PuertaSlice {
  enabled?: boolean;
  startpack?: {
    id?: string;
    version?: string;
    ref?: string;
    packageName?: string;
  };
  defaultStartpackRef?: string;
  role?: string | null;
  ssbId?: string | null;
  seatOk?: boolean;
}

export type OperatorHudSlice = ReturnType<typeof projectOperatorSlice>;

/**
 * ZeusOperatorBridgeService — host glue for the operator vista.
 *
 * Owns the room connection (@zeus/room-client-browser) and the pure protocol
 * mapping (@zeus/operator-bridge). Exposes bot-hub messages for the gamify-ui
 * scene and emits intents with role `operator`.
 *
 * Puerta: tracks peercard → startpack-ciudad-v0.1.0 entry via
 * `/api/puerta/enter` (kit + E02 seat verify on the Node serve).
 */
@Injectable({ providedIn: 'root' })
export class ZeusOperatorBridgeService {
  private readonly messages = new Subject<AlephMessage>();
  private readonly snapshotSubject = new Subject<any | null>();
  private readonly puertaSubject = new BehaviorSubject<PuertaSlice>({
    enabled: true,
    defaultStartpackRef: PUERTA_DEFAULT_STARTPACK_REF,
    startpack: { ref: PUERTA_DEFAULT_STARTPACK_REF },
    role: null,
    ssbId: null,
    seatOk: false,
  });
  private client: ReturnType<typeof createBrowserRoomClient> | null = null;
  private readonly bridge = createOperatorBridge();
  private lastState: any = null;
  private user = 'operator-ui';
  private game = 'ciudad';
  private unsubs: Array<() => void> = [];

  constructor(private readonly campanas: CampanasAudioService) {}

  /** Live bot-hub message stream to feed `<tjs-threejs-scene-pure [externalMessages$]>`. */
  readonly messages$: Observable<AlephMessage> = this.messages.asObservable();

  /** Latest game state snapshot. */
  readonly snapshot$: Observable<any | null> = this.snapshotSubject.asObservable();

  /** Operator HUD slice derived via projectOperatorSlice. */
  readonly operatorSlice$: Observable<OperatorHudSlice | null> = this.snapshot$.pipe(
    map((state) => (state ? projectOperatorSlice(state) : null)),
  );

  /** Puerta slice: peercard entry + startpack default. */
  readonly puerta$: Observable<PuertaSlice> = this.puertaSubject.asObservable();

  connected = false;

  isLive(): boolean {
    return this.connected;
  }

  puertaSnapshot(): PuertaSlice {
    return this.puertaSubject.value;
  }

  /** Seed puerta from window.__ZEUS__.puerta (serve injects kit default). */
  applyPuertaConfig(cfg?: PuertaSlice | null): void {
    if (!cfg) return;
    this.puertaSubject.next({
      ...this.puertaSubject.value,
      ...cfg,
      defaultStartpackRef: cfg.defaultStartpackRef ?? PUERTA_DEFAULT_STARTPACK_REF,
      startpack: cfg.startpack ?? { ref: PUERTA_DEFAULT_STARTPACK_REF },
    });
  }

  /**
   * Enter via peercard credential (POST /api/puerta/enter on operator-ui serve).
   * Uses real embajador-kit + E02 seat verify on the Node side.
   */
  async enterWithCredencial(
    credencial: unknown,
    opts: { apiBase?: string } = {},
  ): Promise<{ ok: boolean; errors?: string[]; puerta?: PuertaSlice }> {
    const base = (opts.apiBase ?? '').replace(/\/$/, '');
    const url = `${base}/api/puerta/enter`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(credencial),
      });
      const body = await res.json();
      if (!res.ok || !body?.ok) {
        return { ok: false, errors: body?.errors ?? [`http ${res.status}`] };
      }
      const puerta: PuertaSlice = body.puerta ?? {
        enabled: true,
        startpack: body.startpack,
        defaultStartpackRef: PUERTA_DEFAULT_STARTPACK_REF,
        role: body.role ?? null,
        ssbId: body.ssbId ?? null,
        seatOk: body.seatOk === true,
      };
      this.puertaSubject.next(puerta);
      return { ok: true, puerta };
    } catch (err) {
      return {
        ok: false,
        errors: [err instanceof Error ? err.message : String(err)],
      };
    }
  }

  async connect(cfg: ZeusOperatorConfig): Promise<void> {
    if (this.client) return;

    this.user = cfg.user ?? 'operator-ui';
    this.game = cfg.game ?? 'ciudad';
    this.applyPuertaConfig(cfg.puerta);
    const client = createBrowserRoomClient({
      scriptoriumUrl: cfg.scriptoriumUrl,
      room: cfg.room,
      token: cfg.token,
      user: this.user,
      type: 'OperatorUI',
      features: ['operator', 'viewer', this.game, 'puerta'],
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
          const bells = campanasFromLedger(entry);
          if (bells.length) this.campanas.play(bells);
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
