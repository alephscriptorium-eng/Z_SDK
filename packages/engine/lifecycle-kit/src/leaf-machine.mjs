/**
 * Leaf lifecycle machine (XState 5 setup + createMachine).
 * Actuators injected via `.provide({ actors })` — kit never spawns processes.
 *
 * States: parada → arrancando → viva ⇄ degradada → parando → parada · rota
 */

import { setup, assign, fromPromise, fromCallback } from 'xstate';

/** Default stubs — composition must provide real actuators. */
const stubLaunch = fromPromise(async () => {
  throw new Error('lifecycle-kit: provide actors.launchEffect');
});
const stubStop = fromPromise(async () => {
  throw new Error('lifecycle-kit: provide actors.stopEffect');
});
const stubWatch = fromCallback(({ sendBack }) => {
  // no-op watch; composition provides health polling
  return () => {};
});

export const leafMachine = setup({
  types: {
    context: /** @type {{
      catalogId: string,
      maxRestarts: number,
      restartCount: number,
      intentionalStop: boolean,
      diagnosis: string | null,
      healthIdentity: { pid?: number|null, healthUrl?: string|null } | null,
      backoffMs: number,
      autoRestart: boolean
    }} */ ({}),
    events: /** @type {{
      | { type: 'ARRANQUE_SOLICITADO' }
      | { type: 'PROCESO_VIVO', health?: object, identity?: object }
      | { type: 'SALUD_FALLIDA', diagnosis?: string }
      | { type: 'PARADA_SOLICITADA' }
      | { type: 'PROCESO_TERMINADO' }
      | { type: 'DEPENDENCIA_FALLIDA', diagnosis?: string }
    }} */ ({})
  },
  actors: {
    launchEffect: stubLaunch,
    stopEffect: stubStop,
    healthWatch: stubWatch
  },
  guards: {
    canRetry: ({ context }) =>
      context.autoRestart &&
      !context.intentionalStop &&
      context.restartCount < context.maxRestarts,
    retriesExhausted: ({ context }) =>
      !context.autoRestart ||
      context.intentionalStop ||
      context.restartCount >= context.maxRestarts,
    alreadyLive: ({ context }) => Boolean(context.healthIdentity)
  },
  actions: {
    clearIntent: assign({ intentionalStop: false, diagnosis: null }),
    markIntentStop: assign({ intentionalStop: true }),
    bumpRestart: assign({
      restartCount: ({ context }) => context.restartCount + 1,
      backoffMs: ({ context }) => Math.min(context.backoffMs * 2, 8_000)
    }),
    resetRestarts: assign({ restartCount: 0, backoffMs: 400 }),
    assignAlive: assign({
      healthIdentity: ({ event }) => event.identity ?? event.health ?? { ok: true },
      diagnosis: null
    }),
    assignDiagnosis: assign({
      diagnosis: ({ event }) =>
        event.diagnosis || 'salud_fallida',
      healthIdentity: null
    }),
    assignDepDiagnosis: assign({
      diagnosis: ({ event }) =>
        event.diagnosis || 'dependencia_no_responde',
      healthIdentity: ({ context }) => context.healthIdentity
    })
  },
  delays: {
    backoff: ({ context }) => context.backoffMs
  }
}).createMachine({
  id: 'leaf',
  initial: 'parada',
  context: ({ input }) => ({
    catalogId: input?.catalogId ?? '',
    maxRestarts: input?.maxRestarts ?? 3,
    restartCount: 0,
    intentionalStop: false,
    diagnosis: null,
    healthIdentity: null,
    backoffMs: input?.backoffMs ?? 400,
    autoRestart: input?.autoRestart !== false
  }),
  states: {
    parada: {
      on: {
        ARRANQUE_SOLICITADO: [
          {
            guard: 'alreadyLive',
            target: 'viva',
            actions: 'clearIntent'
          },
          {
            target: 'arrancando',
            actions: ['clearIntent', 'resetRestarts']
          }
        ]
      }
    },
    arrancando: {
      invoke: {
        src: 'launchEffect',
        input: ({ context }) => ({ catalogId: context.catalogId }),
        onDone: {
          target: 'viva',
          actions: assign({
            healthIdentity: ({ event }) =>
              event.output?.identity ??
              event.output?.health ??
              { ok: true, adopted: event.output?.adopted },
            diagnosis: null
          })
        },
        onError: [
          {
            guard: 'canRetry',
            target: 'degradada',
            actions: [
              'bumpRestart',
              assign({
                diagnosis: ({ event }) =>
                  String(event.error?.message || event.error || 'launch_failed')
              })
            ]
          },
          {
            target: 'rota',
            actions: assign({
              diagnosis: ({ event }) =>
                String(event.error?.message || event.error || 'launch_failed')
            })
          }
        ]
      },
      on: {
        PROCESO_VIVO: { target: 'viva', actions: 'assignAlive' },
        SALUD_FALLIDA: [
          {
            guard: 'canRetry',
            target: 'degradada',
            actions: ['bumpRestart', 'assignDiagnosis']
          },
          { target: 'rota', actions: 'assignDiagnosis' }
        ],
        PARADA_SOLICITADA: { target: 'parando', actions: 'markIntentStop' }
      }
    },
    viva: {
      invoke: {
        src: 'healthWatch',
        input: ({ context }) => ({ catalogId: context.catalogId })
      },
      on: {
        ARRANQUE_SOLICITADO: {
          // adopción idempotente: ya viva
          actions: assign({
            healthIdentity: ({ context, event }) =>
              event.identity ?? context.healthIdentity
          })
        },
        SALUD_FALLIDA: { target: 'degradada', actions: 'assignDiagnosis' },
        DEPENDENCIA_FALLIDA: {
          target: 'degradada',
          actions: 'assignDepDiagnosis'
        },
        PROCESO_TERMINADO: { target: 'degradada', actions: 'assignDiagnosis' },
        PARADA_SOLICITADA: { target: 'parando', actions: 'markIntentStop' }
      }
    },
    degradada: {
      invoke: {
        src: 'healthWatch',
        input: ({ context }) => ({ catalogId: context.catalogId })
      },
      after: {
        backoff: [
          {
            guard: 'canRetry',
            target: 'arrancando',
            actions: 'bumpRestart'
          },
          {
            guard: 'retriesExhausted',
            target: 'rota'
          }
        ]
      },
      on: {
        PROCESO_VIVO: { target: 'viva', actions: ['assignAlive', 'resetRestarts'] },
        SALUD_FALLIDA: { actions: 'assignDiagnosis' },
        DEPENDENCIA_FALLIDA: { actions: 'assignDepDiagnosis' },
        REINTENTOS_AGOTADOS: { target: 'rota' },
        PARADA_SOLICITADA: { target: 'parando', actions: 'markIntentStop' }
      }
    },
    parando: {
      invoke: {
        src: 'stopEffect',
        input: ({ context }) => ({ catalogId: context.catalogId }),
        onDone: {
          target: 'parada',
          actions: assign({
            healthIdentity: null,
            diagnosis: null,
            restartCount: 0
          })
        },
        onError: {
          target: 'parada',
          actions: assign({
            healthIdentity: null,
            diagnosis: ({ event }) =>
              String(event.error?.message || 'stop_error')
          })
        }
      },
      on: {
        PROCESO_TERMINADO: {
          target: 'parada',
          actions: assign({ healthIdentity: null, diagnosis: null })
        },
        // intentionalStops: absorb exit — no auto-restart from here
        SALUD_FALLIDA: undefined,
        ARRANQUE_SOLICITADO: undefined
      }
    },
    rota: {
      on: {
        ARRANQUE_SOLICITADO: {
          target: 'arrancando',
          actions: ['clearIntent', 'resetRestarts']
        }
      }
    }
    // note: retries from degradada → arrancando keep restartCount (no reset)
  }
});

/**
 * @param {{
 *   catalogId: string,
 *   maxRestarts?: number,
 *   autoRestart?: boolean,
 *   backoffMs?: number,
 *   launch: (catalogId: string) => Promise<object>,
 *   stop: (catalogId: string) => Promise<object>,
 *   watch?: (input: { catalogId: string }, sendBack: Function) => () => void
 * }} opts
 */
export function provideLeafActors(opts) {
  return {
    actors: {
      launchEffect: fromPromise(async ({ input }) => opts.launch(input.catalogId)),
      stopEffect: fromPromise(async ({ input }) => opts.stop(input.catalogId)),
      healthWatch: fromCallback(({ input, sendBack }) => {
        if (typeof opts.watch === 'function') {
          return opts.watch(input, sendBack);
        }
        return () => {};
      })
    }
  };
}
