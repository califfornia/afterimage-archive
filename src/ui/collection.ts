import { getCollection, recordsInCollection } from '../data/archive';
import { progressOf, summarise } from '../state/progress';
import type { StatusFilter } from '../state/router';
import type { AppState } from '../state/store';
import { breadcrumbs, emptyState, recordEntry, statusFilter } from './common';
import { formatTotal, html, percent, plural } from './html';
import { indexMeter } from './status';

/** View B — a drawer pulled open: its label card beside the index of its records. */
export function collectionView(state: AppState, collectionId: string, status: StatusFilter) {
  const collection = getCollection(collectionId)!;
  const records = recordsInCollection(collectionId);
  const summary = summarise(records);
  const visible = status === 'all' ? records : records.filter((r) => progressOf(r).status === status);
  const seconds = records.reduce((s, r) => s + r.media.duration, 0);
  const counts = { all: records.length, ...summary.counts };

  return html`<section class="collection-view" aria-labelledby="view-heading">
    ${breadcrumbs([
      { label: 'Archive', route: { view: 'overview' } },
      { label: collection.name, code: `D${collection.drawer}` },
    ])}

    <div class="collection-view__grid">
      <aside class="collection-card" aria-label="Drawer">
        <span class="collection-card__tab">Drawer ${collection.drawer}</span>
        <div class="collection-card__body">
          <span class="collection-card__label">
            <span class="drawer__label-code">${collection.code}</span>
            <h1 class="collection-card__title" id="view-heading" tabindex="-1">${collection.name}</h1>
          </span>
          <p class="collection-card__summary">${collection.summary}</p>
          <dl class="ledger ledger--stack">
            <div><dt>Records</dt><dd>${records.length}</dd></div>
            <div><dt>Running time</dt><dd>${formatTotal(seconds)}</dd></div>
            <div><dt>Viewed</dt><dd>${percent(summary.fraction)}</dd></div>
          </dl>
          ${indexMeter(records)}
        </div>
      </aside>

      <div class="collection-view__index">
        <div class="index-head">
          <h2 class="index-head__title">Index <span class="index-head__count">${plural(visible.length, 'record')}</span></h2>
          ${statusFilter(status, (s) => ({ view: 'collection', collectionId, status: s }), counts)}
        </div>

        <div class="columns" aria-hidden="true">
          <span>ID</span><span></span><span>Title</span><span>Length</span><span>Status</span>
        </div>

        ${visible.length
          ? html`<ol class="entries" aria-label="Records in ${collection.name}">
              ${visible.map((r) => recordEntry(r, { selected: r.id === state.selectedRecordId }))}
            </ol>`
          : emptyState('No records with this status', `Every record in ${collection.name} is filed under another status.`, {
              label: 'Show all records',
              route: { view: 'collection', collectionId, status: 'all' },
            })}
      </div>
    </div>
  </section>`;
}
