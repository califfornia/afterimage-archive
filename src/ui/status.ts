import type { ArchiveRecord, PlaybackStatus } from '../data/types';
import { progressOf, STATUS_LABEL, summarise } from '../state/progress';
import { html, percent, plural } from './html';

/** Status mark + label. Never colour alone: each status has its own shape. */
export function statusBadge(status: PlaybackStatus, { compact = false } = {}) {
  return html`<span class="status" data-status="${status}">
    <span class="status__mark" aria-hidden="true"></span>
    <span class="status__label${compact ? ' sr-only' : ''}">${STATUS_LABEL[status]}</span>
  </span>`;
}

/** Thin progress rule for one record. */
export function progressRule(record: ArchiveRecord) {
  const p = progressOf(record);
  return html`<span class="rule" data-status="${p.status}" style="--fraction: ${p.fraction}" aria-hidden="true">
    <span class="rule__fill"></span>
  </span>`;
}

/**
 * The index meter: one tick per record, in order, shaded by status — like the
 * edge of a card index seen from above. Visual; the text summary carries it.
 */
export function indexMeter(records: ArchiveRecord[]) {
  return html`<span class="meter" aria-hidden="true">
    ${records.map((r) => html`<span class="meter__tick" data-status="${progressOf(r).status}"></span>`)}
  </span>`;
}

/** "3 completed · 2 in progress · 11 unviewed" */
export function summaryText(records: ArchiveRecord[]) {
  const { counts } = summarise(records);
  const parts = [
    counts.completed && `${counts.completed} completed`,
    counts['in-progress'] && `${counts['in-progress']} in progress`,
    counts.unviewed && `${counts.unviewed} unviewed`,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function viewedText(records: ArchiveRecord[]) {
  const { counts, total, fraction } = summarise(records);
  return `${counts.completed}/${plural(total, 'record')} completed · ${percent(fraction)} viewed`;
}
