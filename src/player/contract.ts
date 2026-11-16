/**
 * The boundary between the Archive and the player.
 *
 * The Archive never builds playback UI. It hands a record to a PlayerAdapter
 * mounted in a reserved 16:9 container, and listens for playback events to
 * keep progress. Today the adapter is a placeholder; later it is the
 * AFTERIMAGE Video.js skin (see INTEGRATION.md). The Archive layout does not
 * change between the two.
 */

export interface PlayerSource {
  recordId: string;
  title: string;
  /** Archive identifier, e.g. "CT-001". */
  archiveId: string;
  /** The drawer's name, for the player's catalogue card. */
  collectionLabel: string;
  kind: 'mp4' | 'hls';
  src: string;
  /** Mux playback ID: lets a Mux media element load the stream and storyboard itself. */
  playbackId?: string;
  storyboard?: string;
  poster?: string;
  /** Seconds, as catalogued (the player reports the real value). */
  duration: number;
}

export type PlayerEvent =
  | { type: 'ready'; recordId: string; duration: number }
  /** `final` marks a position that must be saved now: on pause, before a new record loads, on teardown. */
  | { type: 'timeupdate'; recordId: string; currentTime: number; duration: number; final?: boolean }
  | { type: 'ended'; recordId: string; duration: number }
  | { type: 'error'; recordId: string; message: string };

export interface PlayerAdapter {
  /** Render into the reserved container. Called once per viewing session. */
  mount(container: HTMLElement): void;
  /** Load a record. `startAt` resumes from saved progress (seconds). */
  load(source: PlayerSource, options?: { startAt?: number }): void;
  /** Subscribe to playback events. Returns an unsubscribe function. */
  on(listener: (event: PlayerEvent) => void): () => void;
  /** Tear down: stop playback, remove listeners and DOM. */
  destroy(): void;
}
