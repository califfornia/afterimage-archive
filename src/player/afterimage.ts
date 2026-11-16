import '@videojs/html/video/player';
import '@videojs/html/media/mux-video';
import '../vendor/afterimage-skin';
import '../styles/player-theme.css';
import type { PlayerAdapter, PlayerEvent, PlayerSource } from './contract';

/** The parts of <mux-video> the adapter uses. */
type MuxVideoElement = HTMLMediaElement & {
  source: { playbackId?: string; poster?: { time?: number; width?: number } } | null;
};

/**
 * The AFTERIMAGE player: Video.js 10 + the AFTERIMAGE skin + Mux.
 *
 * The skin runs in its overlay layout so it fills the Archive's reserved 16:9
 * frame exactly. The Archive keeps the record's title and catalogue on the
 * page; the skin's own catalogue card (shown in fullscreen) gets the same data.
 * Playback events go back to the Archive through the PlayerAdapter contract.
 */
export function createAfterimagePlayer(): PlayerAdapter {
  let root: HTMLElement | null = null;
  let media: MuxVideoElement | null = null;
  let catalogue: HTMLElement | null = null;
  let current: PlayerSource | null = null;
  let pendingStart = 0;
  const abort = new AbortController();
  const listeners = new Set<(event: PlayerEvent) => void>();

  const emit = (event: PlayerEvent) => {
    for (const listener of listeners) listener(event);
  };

  /** Report the current position immediately (pause, record switch, teardown). */
  const flush = () => {
    if (!media || !current || !(media.currentTime > 0)) return;
    const duration = Number.isFinite(media.duration) ? media.duration : current.duration;
    emit({ type: 'timeupdate', recordId: current.recordId, currentTime: media.currentTime, duration, final: true });
  };

  return {
    mount(container) {
      root = document.createElement('div');
      root.className = 'player';
      root.innerHTML = `
        <video-player>
          <afterimage-skin layout="overlay" viewer="off">
            <mux-video crossorigin="anonymous" playsinline preload="metadata"></mux-video>
            <afterimage-catalogue></afterimage-catalogue>
          </afterimage-skin>
        </video-player>`;
      container.replaceChildren(root);
      media = root.querySelector<MuxVideoElement>('mux-video');
      catalogue = root.querySelector('afterimage-catalogue');

      const { signal } = abort;
      const duration = () => (Number.isFinite(media!.duration) ? media!.duration : current?.duration ?? 0);
      media!.addEventListener(
        'loadedmetadata',
        () => {
          if (!current) return;
          if (pendingStart > 0 && pendingStart < duration() - 1) media!.currentTime = pendingStart;
          pendingStart = 0;
          emit({ type: 'ready', recordId: current.recordId, duration: duration() });
        },
        { signal },
      );
      media!.addEventListener(
        'timeupdate',
        () => current && emit({ type: 'timeupdate', recordId: current.recordId, currentTime: media!.currentTime, duration: duration() }),
        { signal },
      );
      media!.addEventListener('pause', flush, { signal });
      media!.addEventListener('ended', () => current && emit({ type: 'ended', recordId: current.recordId, duration: duration() }), {
        signal,
      });
      media!.addEventListener(
        'error',
        () => current && emit({ type: 'error', recordId: current.recordId, message: media!.error?.message ?? 'Playback error' }),
        { signal },
      );
    },

    load(source, options = {}) {
      if (!media || !catalogue) return;
      flush();
      current = source;
      pendingStart = options.startAt ?? 0;

      // The skin's catalogue card (fullscreen) mirrors the Archive record.
      catalogue.setAttribute('title', source.title);
      catalogue.setAttribute('archive-id', source.archiveId);
      catalogue.setAttribute('collection', source.collectionLabel);
      catalogue.setAttribute('format', 'HLS · Mux');
      catalogue.textContent = '';

      if (source.playbackId) {
        // <mux-video> builds the stream, poster and storyboard from the playback ID.
        media.source = { playbackId: source.playbackId };
      } else {
        media.src = source.src;
      }
      if (source.poster) media.setAttribute('poster', source.poster);
    },

    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    destroy() {
      flush();
      abort.abort();
      listeners.clear();
      media?.pause();
      root?.remove();
      root = null;
      media = null;
      catalogue = null;
      current = null;
    },
  };
}
