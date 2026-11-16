import { getCollection, getRecord, recordsInCollection } from '../data/archive';
import type { ArchiveRecord } from '../data/types';
import type { PlayerAdapter, PlayerSource } from '../player/contract';
import { COMPLETE_AT, onProgressChange, progressOf, reportEnded, reportPlayback, STATUS_LABEL } from '../state/progress';
import { collectionRoute, href } from '../state/router';
import { breadcrumbs, recordEntry } from './common';
import { formatDuration, html, percent, plural, toString } from './html';
import { icons } from './icons';
import { progressRule, statusBadge } from './status';

/** What the player is given for a record. */
export function toPlayerSource(record: ArchiveRecord): PlayerSource {
  const media = record.media;
  return {
    recordId: record.id,
    archiveId: record.id,
    title: record.title,
    collectionLabel: getCollection(record.collectionId)?.name ?? '',
    kind: media.kind,
    src: media.src,
    playbackId: media.playbackId,
    storyboard: media.storyboard,
    poster: media.thumbnail(record.stillAt, 1280),
    duration: media.duration,
  };
}

/**
 * View D — the viewing table. The player frame is mounted once and kept while
 * moving between records, so switching records only loads a new source; the
 * record card and the drawer index around it re-render.
 */
export function createViewingTable(root: HTMLElement, createPlayer: () => PlayerAdapter) {
  let player: PlayerAdapter | null = null;
  let recordId: string | null = null;
  let unsubscribePlayer: (() => void) | null = null;
  let lastReport = 0;

  root.innerHTML = `
    <section class="viewing" aria-labelledby="view-heading">
      <div data-region="crumbs"></div>
      <div class="viewing__grid">
        <div class="viewing__main">
          <div class="stage"><div class="player-slot" data-player-slot></div></div>
          <div data-region="card"></div>
        </div>
        <aside class="viewing__aside" data-region="drawer" aria-label="Drawer contents"></aside>
      </div>
    </section>`;

  const slot = root.querySelector<HTMLElement>('[data-player-slot]')!;
  const regions = {
    crumbs: root.querySelector<HTMLElement>('[data-region="crumbs"]')!,
    card: root.querySelector<HTMLElement>('[data-region="card"]')!,
    drawer: root.querySelector<HTMLElement>('[data-region="drawer"]')!,
  };

  const stopProgress = onProgressChange(() => renderRegions());

  function renderRegions() {
    if (!recordId) return;
    const record = getRecord(recordId);
    const collection = getCollection(record.collectionId)!;
    const siblings = recordsInCollection(collection.id);
    const index = siblings.findIndex((r) => r.id === record.id);
    const prev = siblings[index - 1];
    const next = siblings[index + 1];
    const p = progressOf(record);
    const drawerRoute = collectionRoute(collection.id);

    regions.crumbs.innerHTML = toString(
      breadcrumbs([
        { label: 'Archive', route: { view: 'overview' } },
        { label: collection.name, code: `D${collection.drawer}`, route: drawerRoute },
        { label: record.title, code: record.id },
      ]),
    );

    regions.card.innerHTML = toString(html`
      <article class="record-card">
        <header class="record-card__head">
          <p class="record-card__path">
            <a href="${href(drawerRoute)}">Drawer ${collection.drawer} · ${collection.name}</a>
          </p>
          <h1 class="record-card__title" id="view-heading" tabindex="-1">${record.title}</h1>
        </header>

        <div class="record-card__status">
          ${statusBadge(p.status)}
          ${progressRule(record)}
          <span class="record-card__pct">${percent(p.fraction)} viewed</span>
        </div>

        <dl class="catalogue">
          <div><dt>Archive ID</dt><dd class="mono">${record.id}</dd></div>
          <div><dt>Duration</dt><dd class="mono">${formatDuration(record.media.duration)}</dd></div>
          <div><dt>Collection</dt><dd>${collection.name} <span class="mono muted">D${collection.drawer}</span></dd></div>
          <div><dt>Position</dt><dd class="mono">${index + 1} / ${siblings.length}</dd></div>
          <div><dt>Status</dt><dd>${STATUS_LABEL[p.status]}</dd></div>
          <div><dt>Format</dt><dd class="mono">HLS · Mux</dd></div>
          <div class="catalogue__wide"><dt>Playback ID</dt><dd class="mono catalogue__id">${record.media.playbackId}</dd></div>
        </dl>

        <div class="record-card__actions">
          ${p.status === 'completed'
            ? html`<button type="button" class="button button--quiet" data-action="reset-progress" data-record="${record.id}">${icons.reset()} Mark unviewed</button>`
            : html`<button type="button" class="button button--quiet" data-action="mark-completed" data-record="${record.id}">${icons.check()} Mark completed</button>`}
          <span class="note">Progress is kept in this browser only.</span>
        </div>

        <nav class="stepper" aria-label="Records in this drawer">
          ${prev
            ? html`<a class="stepper__link" href="${href({ view: 'record', recordId: prev.id })}" rel="prev">
                <span class="stepper__dir">${icons.arrowLeft()} Previous</span>
                <span class="stepper__id">${prev.id}</span>
                <span class="stepper__title">${prev.title}</span>
              </a>`
            : html`<span class="stepper__link stepper__link--end"><span class="stepper__dir">${icons.arrowLeft()} Previous</span><span class="stepper__title">First record in ${collection.name}</span></span>`}
          ${next
            ? html`<a class="stepper__link stepper__link--next" href="${href({ view: 'record', recordId: next.id })}" rel="next">
                <span class="stepper__dir">Next ${icons.arrowRight()}</span>
                <span class="stepper__id">${next.id}</span>
                <span class="stepper__title">${next.title}</span>
              </a>`
            : html`<span class="stepper__link stepper__link--next stepper__link--end"><span class="stepper__dir">Next ${icons.arrowRight()}</span><span class="stepper__title">Last record in ${collection.name}</span></span>`}
        </nav>
      </article>`);

    regions.drawer.innerHTML = toString(html`
      <div class="aside-head">
        <span class="aside-head__tab">Drawer ${collection.drawer}</span>
        <p class="aside-head__title">${collection.name}</p>
        <p class="aside-head__meta">${plural(siblings.length, 'record')}</p>
      </div>
      <ol class="entries entries--compact" aria-label="Records in ${collection.name}">
        ${siblings.map((r) => recordEntry(r, { selected: r.id === record.id, compact: true }))}
      </ol>
      <div class="aside-actions">
        <a class="button button--quiet" href="${href(drawerRoute)}">${icons.cabinet()} Back to ${collection.name}</a>
        <button type="button" class="button" data-action="open-navigator">${icons.cabinet()} Browse the archive</button>
      </div>`);
  }

  return {
    show(id: string) {
      const changed = id !== recordId;
      recordId = id;
      if (!player) {
        player = createPlayer();
        player.mount(slot);
        // Playback events keep progress: written at most every 5 s while playing,
        // and at once on pause, on switching records and on leaving the viewer.
        unsubscribePlayer = player.on((event) => {
          if (event.type === 'timeupdate') {
            const now = Date.now();
            if (event.final || now - lastReport > 5000 || event.currentTime / event.duration >= COMPLETE_AT) {
              lastReport = now;
              reportPlayback(event.recordId, event.currentTime, event.duration);
            }
          } else if (event.type === 'ended') {
            reportEnded(event.recordId, event.duration);
          }
        });
      }
      if (changed) {
        const record = getRecord(id);
        const p = progressOf(record);
        player.load(toPlayerSource(record), { startAt: p.status === 'in-progress' ? p.position : 0 });
      }
      renderRegions();
      // Keep the current record visible in the drawer list.
      regions.drawer.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
    },
    destroy() {
      stopProgress();
      unsubscribePlayer?.();
      player?.destroy();
      player = null;
      recordId = null;
    },
  };
}
