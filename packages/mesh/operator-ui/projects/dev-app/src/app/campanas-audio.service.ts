import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  CAMPANA_HZ,
  readCampanasMuted,
  writeCampanasMuted,
  scheduleCampanas,
} from './campanas-audio';

export type ClaseCampana = 'despertar' | 'degradar' | 'roto';

/**
 * Plays plaza campanas (Web Audio oscillators). Mute persists in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class CampanasAudioService {
  private ctx: AudioContext | null = null;
  private readonly mutedSubject = new BehaviorSubject<boolean>(
    typeof localStorage !== 'undefined' ? readCampanasMuted(localStorage) : false,
  );

  readonly muted$ = this.mutedSubject.asObservable();

  isMuted(): boolean {
    return this.mutedSubject.value;
  }

  setMuted(muted: boolean): void {
    this.mutedSubject.next(!!muted);
    if (typeof localStorage !== 'undefined') {
      writeCampanasMuted(localStorage, !!muted);
    }
  }

  toggleMute(): void {
    this.setMuted(!this.isMuted());
  }

  /**
   * Ring one tone per campana event (no-op if muted or empty).
   * @param {Array<{ clase: ClaseCampana, titular?: string }>} events
   */
  play(events: Array<{ clase: ClaseCampana; titular?: string }>): void {
    const plan = scheduleCampanas(events, this.isMuted());
    if (plan.length === 0) return;

    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const t0 = ctx.currentTime;
    for (const step of plan) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = step.hz;
      gain.gain.setValueAtTime(0.0001, t0 + step.atMs / 1000);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + step.atMs / 1000 + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        t0 + (step.atMs + step.durMs) / 1000,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + step.atMs / 1000);
      osc.stop(t0 + (step.atMs + step.durMs) / 1000 + 0.02);
    }
  }

  /** Dev helper: ring a single class (also respects mute). */
  playClase(clase: ClaseCampana): void {
    this.play([{ clase }]);
  }

  private ensureCtx(): AudioContext | null {
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
      return null;
    }
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }
}

export { CAMPANA_HZ, scheduleCampanas, readCampanasMuted, writeCampanasMuted };
