import type { PlayerAdapter, PlayerEvent, PlayerSource } from './contract';
import { formatDuration } from '../ui/html';

/**
 * Stand-in for the AFTERIMAGE player. It occupies the player's reserved
 * 16:9 frame and says what will play there. It does not play anything and
 * has no playback controls; it never emits playback events.
 */
export function createPlaceholderPlayer(): PlayerAdapter {
  let root: HTMLElement | null = null;
  const listeners = new Set<(event: PlayerEvent) => void>();

  return {
    mount(container) {
      root = document.createElement('div');
      root.className = 'placeholder';
      root.innerHTML = `
        <img class="placeholder__still" alt="" decoding="async" />
        <span class="placeholder__reg placeholder__reg--tl" aria-hidden="true"></span>
        <span class="placeholder__reg placeholder__reg--tr" aria-hidden="true"></span>
        <span class="placeholder__reg placeholder__reg--bl" aria-hidden="true"></span>
        <span class="placeholder__reg placeholder__reg--br" aria-hidden="true"></span>
        <div class="placeholder__plate">
          <p class="placeholder__reserved">Reserved · AFTERIMAGE player</p>
          <p class="placeholder__id"></p>
          <p class="placeholder__title"></p>
          <p class="placeholder__spec"></p>
          <p class="placeholder__note">The Video.js player mounts in this frame. Playback is not connected yet.</p>
        </div>
        <span class="placeholder__ratio" aria-hidden="true">16 : 9</span>`;
      root.setAttribute('role', 'img');
      container.replaceChildren(root);
    },

    load(source: PlayerSource) {
      if (!root) return;
      root.setAttribute('aria-label', `Player area reserved for ${source.title} (${source.archiveId}). The player is not connected yet.`);
      const still = root.querySelector<HTMLImageElement>('.placeholder__still')!;
      if (source.poster) {
        still.hidden = false;
        still.src = source.poster;
      } else {
        still.hidden = true;
      }
      root.querySelector('.placeholder__id')!.textContent = source.archiveId;
      root.querySelector('.placeholder__title')!.textContent = source.title;
      root.querySelector('.placeholder__spec')!.textContent = [
        source.kind === 'hls' ? 'HLS · Mux' : 'MP4',
        formatDuration(source.duration),
        source.collectionLabel,
      ]
        .filter(Boolean)
        .join(' · ');
    },

    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    destroy() {
      listeners.clear();
      root?.remove();
      root = null;
    },
  };
}
