import { allRecords, getCollection } from '../data/archive';
import type { ArchiveRecord } from '../data/types';
import { progressOf, summarise } from '../state/progress';
import type { StatusFilter } from '../state/router';
import type { AppState } from '../state/store';
import { breadcrumbs, emptyState, recordEntry, statusFilter } from './common';
import { html, plural } from './html';

const normalise = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Matches title, archive ID and collection; every word must match. */
export function searchRecords(query: string): ArchiveRecord[] {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  if (!words.length) return allRecords();
  return allRecords().filter((record) => {
    const haystack = normalise(
      [record.title, record.id, record.id.replace(/-/g, ''), getCollection(record.collectionId)?.name].join(' '),
    );
    return words.every((w) => haystack.includes(w.replace(/-/g, '')) || haystack.includes(w));
  });
}

export function searchView(state: AppState, query: string, status: StatusFilter) {
  const matches = searchRecords(query);
  const visible = status === 'all' ? matches : matches.filter((r) => progressOf(r).status === status);
  const counts = { all: matches.length, ...summarise(matches).counts };

  return html`<section class="search-view" aria-labelledby="view-heading">
    ${breadcrumbs([{ label: 'Archive', route: { view: 'overview' } }, { label: 'Search' }])}
    <header class="search-view__head">
      <p class="eyebrow">Index search</p>
      <h1 class="search-view__title" id="view-heading" tabindex="-1">
        ${query ? html`Records matching <q>${query}</q>` : 'Every record'}
      </h1>
      <p class="search-view__count" role="status">${plural(visible.length, 'record')}${status !== 'all' ? ' with this status' : ''}</p>
    </header>

    <div class="index-head">
      <h2 class="sr-only">Filter</h2>
      ${statusFilter(status, (s) => ({ view: 'search', query, status: s }), counts)}
    </div>

    ${visible.length
      ? html`<ol class="entries" aria-label="Search results">
          ${visible.map((r) => recordEntry(r, { selected: r.id === state.selectedRecordId, showPath: true }))}
        </ol>`
      : emptyState(
          'Nothing filed under that',
          'Search by title, by archive ID (for example CT-001), or by drawer name.',
          { label: 'Back to the archive', route: state.archiveRoute },
        )}
  </section>`;
}
