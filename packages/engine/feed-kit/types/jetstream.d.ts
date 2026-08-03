/**
 * ATProto jetstream → DISK_01/FIREHOSE (stream family reference producer).
 * Manifest writes are OUT OF SCOPE: sync only records state (WP-U204).
 */

export declare const DEFAULT_JETSTREAM_URL: string;
export declare const FIREHOSE_VOLUME_ID: 'firehose';

/** Sample jetstream posts used by fixture sync. Shape is open (validated at write). */
export declare const SAMPLE_POSTS: readonly Record<string, unknown>[];

export interface FirehoseVolumeRoot {
  firehoseRoot: string;
  volumeId: string;
  /** Corpus entries as declared in the volumes manifest — open objects. */
  corpora: unknown[];
}

export type WriteJetstreamPostResult =
  | { ok: false; error: string }
  | {
      ok: true;
      filePath: string;
      absPath: string;
      text: unknown;
    };

export interface JetstreamSyncResult {
  ok: true;
  mode: 'fixture' | 'live';
  written: number;
  files: string[];
  syncedAt?: unknown;
  corpora?: unknown;
  url?: string;
}

export declare function resolveFirehoseVolumeRoot(
  volumesRoot: string,
  opts?: { volumeId?: string }
): FirehoseVolumeRoot;

export declare function writeJetstreamPost(
  firehoseRoot: string,
  raw: unknown,
  opts?: { corpus?: string; batch?: string }
): WriteJetstreamPostResult;

export declare function refreshFirehoseCorpusCounts(
  volumesRoot: string
): unknown | null;

export declare function recordFirehoseSync(
  volumesRoot: string,
  opts?: {
    volumeId?: string;
    syncedAt?: string;
    source?: Record<string, unknown>;
  }
): unknown;

export declare function syncJetstreamFixture(opts: {
  volumesRoot: string;
  posts?: unknown[];
  corpus?: string;
  batch?: string;
}): JetstreamSyncResult;

export declare function syncJetstreamLive(opts: {
  volumesRoot: string;
  url?: string;
  maxPosts?: number;
  durationMs?: number;
  corpus?: string;
  batch?: string;
  logger?: Console;
  WebSocketImpl?: unknown;
}): Promise<JetstreamSyncResult>;

export declare function runJetstreamSync(opts: {
  volumesRoot: string;
  fixture?: boolean;
  url?: string;
  maxPosts?: number;
  durationMs?: number;
  logger?: Console;
}): Promise<JetstreamSyncResult>;
