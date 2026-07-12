/** Ambient types for @zeus/session-protocol workspace .mjs imports (block-14). */
declare module '@zeus/session-protocol/projection' {
  export const SCENE_IDS: {
    readonly tablero: string;
    readonly player3d: string;
    readonly firehose: string;
    readonly viewUi: string;
    readonly operator: string;
  };

  export interface OperatorPlayhead {
    year: number | null;
    playing: boolean;
  }

  export interface OperatorDeckPhases {
    A: string | null;
    B: string | null;
    C: string | null;
  }

  export interface OperatorSelection {
    actorId?: string;
    deckId?: string;
    targetId?: unknown;
    label?: string;
  }

  export interface OperatorSlice {
    sceneId: string;
    phase: string | null;
    playhead: OperatorPlayhead;
    decks: OperatorDeckPhases;
    selections: {
      last: OperatorSelection | null;
      byActor: Record<string, OperatorSelection>;
      log: OperatorSelection[];
    };
    selectionLast: OperatorSelection | null;
  }

  export function projectSlice(session: unknown, sceneId: string): OperatorSlice;
}
