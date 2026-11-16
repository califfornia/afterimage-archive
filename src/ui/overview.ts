import { allRecords, archive, getCollection, getRecord, recordsInCollection } from '../data/archive';
import { archiveSummary, progressOf } from '../state/progress';
import { href } from '../state/router';
import type { AppState } from '../state/store';
import { formatTotal, html, percent, plural } from './html';
import { icons } from './icons';
import { indexMeter, statusBadge, summaryText } from './status';

/** View A — the cabinet: the whole archive, one drawer per collection. */
export function overviewView(state: AppState) {
  const records = allRecords();
  const summary = archiveSummary();
  const totalSeconds = records.reduce((sum, r) => sum + r.media.duration, 0);
  const selected = state.selectedRecordId ? getRecord(state.selectedRecordId) : null;

  return html`<section class="overview" aria-labelledby="view-heading">
    <div class="overview__intro">
      <p class="eyebrow">Index · AA/01</p>
      <h1 class="overview__title" id="view-heading" tabindex="-1">The archive</h1>
      <p class="overview__lede">
        ${archive.collections.length} drawers of moving images, filed by subject. Open a drawer and put a record on the
        viewing table.
      </p>

      <dl class="ledger">
        <div><dt>Drawers</dt><dd>${archive.collections.length}</dd></div>
        <div><dt>Records</dt><dd>${records.length}</dd></div>
        <div><dt>Running time</dt><dd>${formatTotal(totalSeconds)}</dd></div>
        <div><dt>Completed</dt><dd>${summary.counts.completed}</dd></div>
        <div><dt>In progress</dt><dd>${summary.counts['in-progress']}</dd></div>
        <div><dt>Viewed</dt><dd>${percent(summary.fraction)}</dd></div>
      </dl>

      ${selected
        ? html`<a class="resume" href="${href({ view: 'record', recordId: selected.id })}">
            <span class="resume__label">On the viewing table</span>
            <span class="resume__id">${selected.id}</span>
            <span class="resume__title">${selected.title}</span>
            <span class="resume__meta">${getCollection(selected.collectionId)?.name} · ${statusBadge(progressOf(selected).status)}</span>
            <span class="resume__go">Return to record ${icons.arrowRight()}</span>
          </a>`
        : ''}

      <p class="legend" aria-label="Status key">
        ${statusBadge('unviewed')} ${statusBadge('in-progress')} ${statusBadge('completed')}
      </p>
      <p class="note">Progress is kept in this browser only.</p>
    </div>

    <div class="cabinet" role="list" aria-label="Collections">
      <div class="cabinet__plate" aria-hidden="true">
        <span>AFTERIMAGE ARCHIVE</span><span>Cabinet A</span>
      </div>
      ${archive.collections.map((c) => {
        const collectionRecords = recordsInCollection(c.id);
        return html`<div class="cabinet__slot" role="listitem">
          <a class="drawer" href="${href({ view: 'collection', collectionId: c.id, status: 'all' })}"
            aria-label="Open drawer ${c.drawer}, ${c.name}: ${plural(collectionRecords.length, 'record')}. ${summaryText(collectionRecords)}.">
            <span class="drawer__tabs" aria-hidden="true">
              ${collectionRecords.map((r, i) => html`<span class="drawer__tab" style="--i: ${i}">${r.id}</span>`)}
            </span>
            <span class="drawer__front">
              <span class="drawer__number">Drawer ${c.drawer}</span>
              <span class="drawer__counts">${c.code} · ${plural(collectionRecords.length, 'record')} · ${formatTotal(collectionRecords.reduce((s, r) => s + r.media.duration, 0))}</span>
              <span class="drawer__label">
                <span class="drawer__label-code">${c.code}</span>
                <span class="drawer__label-name">${c.name}</span>
              </span>
              <span class="drawer__handle"></span>
              <span class="drawer__foot">
                ${indexMeter(collectionRecords)}
                <span class="drawer__summary">${summaryText(collectionRecords)}</span>
                <span class="drawer__open">Open ${icons.arrowRight()}</span>
              </span>
            </span>
          </a>
        </div>`;
      })}
    </div>
  </section>`;
}
