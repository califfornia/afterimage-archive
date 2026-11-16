import { getCollection } from '../data/archive';
import type { ArchiveRecord } from '../data/types';
import { progressOf } from '../state/progress';
import { href, type Route, type StatusFilter } from '../state/router';
import { formatDuration, html, percent, type Raw } from './html';
import { progressRule, statusBadge } from './status';

/* ---------- Breadcrumbs ---------- */

export interface Crumb {
  label: string;
  code?: string;
  route?: Route;
}

export function breadcrumbs(crumbs: Crumb[]) {
  return html`<nav class="crumbs" aria-label="Breadcrumb">
    <ol>
      ${crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        const body = html`${c.code ? html`<span class="crumbs__code">${c.code}</span>` : ''}<span>${c.label}</span>`;
        return html`<li>
          ${last || !c.route
            ? html`<span class="crumbs__here" aria-current="${last ? 'page' : 'false'}">${body}</span>`
            : html`<a href="${href(c.route)}">${body}</a>`}
        </li>`;
      })}
    </ol>
  </nav>`;
}

/* ---------- Status filter (links, so the filter is in the URL) ---------- */

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unviewed', label: 'Unviewed' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export function statusFilter(current: StatusFilter, routeFor: (status: StatusFilter) => Route, counts: Record<string, number>) {
  return html`<nav class="filter" aria-label="Filter by playback status">
    ${FILTERS.map(
      (f) => html`<a class="filter__option" href="${href(routeFor(f.value))}" ${current === f.value ? html`aria-current="true"` : ''}>
        ${f.value !== 'all' ? html`<span class="status__mark" data-status="${f.value}" aria-hidden="true"></span>` : ''}
        <span>${f.label}</span>
        <span class="filter__count">${counts[f.value] ?? 0}</span>
      </a>`,
    )}
  </nav>`;
}

/* ---------- Record entry: one line of the index ---------- */

export function recordEntry(
  record: ArchiveRecord,
  { selected = false, showPath = false, compact = false }: { selected?: boolean; showPath?: boolean; compact?: boolean } = {},
): Raw {
  const p = progressOf(record);
  const collection = getCollection(record.collectionId);
  const still = record.media.thumbnail(record.stillAt, compact ? 160 : 240);
  const duration = formatDuration(record.media.duration);
  const statusText = p.status === 'in-progress' ? `In progress, ${percent(p.fraction)}` : p.status === 'completed' ? 'Completed' : 'Unviewed';

  return html`<li class="entry${compact ? ' entry--compact' : ''}" data-record-id="${record.id}" ${selected ? html`data-selected` : ''}>
    <a class="entry__link" href="${href({ view: 'record', recordId: record.id })}" ${selected ? html`aria-current="true"` : ''}
      aria-label="${record.title}, ${record.id}, ${duration}, ${statusText}${selected ? ', on the viewing table' : ''}">
      <span class="entry__id">${record.id}</span>
      <span class="entry__still"><img src="${still}" alt="" loading="lazy" decoding="async" width="160" height="90" /></span>
      <span class="entry__body">
        <span class="entry__title">${record.title}</span>
        ${showPath ? html`<span class="entry__path">${collection?.name}</span>` : ''}
      </span>
      <span class="entry__duration">${duration}</span>
      <span class="entry__status">
        ${statusBadge(p.status, { compact })}
        ${p.status === 'in-progress' ? html`<span class="entry__pct">${percent(p.fraction)}</span>` : ''}
      </span>
      ${progressRule(record)}
      ${selected ? html`<span class="entry__flag" aria-hidden="true">On the table</span>` : ''}
    </a>
  </li>`;
}

/** Empty state for filters and search. */
export function emptyState(title: string, detail: string, action?: { label: string; route: Route }) {
  return html`<div class="empty">
    <p class="empty__title">${title}</p>
    <p class="empty__detail">${detail}</p>
    ${action ? html`<a class="button" href="${href(action.route)}">${action.label}</a>` : ''}
  </div>`;
}
