import { allRecords, getRecord } from '../data/archive';
import type { ArchiveRecord, PlaybackStatus } from '../data/types';

/**
 * Viewing progress, stored in this browser only (localStorage). There is no
 * account or backend: clearing site data resets it.
 *
 * The player integration calls `reportPlayback()` and `reportEnded()`; the
 * archive UI only reads `progressOf()`.
 */

const STORAGE_KEY = 'afterimage-archive:progress:v1';
/** At or past this share of the duration, a record counts as completed. */
export const COMPLETE_AT = 0.95;
/** Below this, a record still counts as unviewed (a glance is not a view). */
const STARTED_AT = 0.02;

export interface RecordProgress {
  /** 0–1 */
  fraction: number;
  /** Last known position in seconds, for resuming. */
  position: number;
  status: PlaybackStatus;
  updatedAt?: number;
}

type Stored = Record<string, { position: number; duration: number; completed?: boolean; updatedAt: number }>;

let stored: Stored = read();
const listeners = new Set<() => void>();

function read(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
}

function write() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* private mode or full storage: progress lives for this session only */
  }
  for (const listener of listeners) listener();
}

export function statusFor(fraction: number, completed = false): PlaybackStatus {
  if (completed || fraction >= COMPLETE_AT) return 'completed';
  if (fraction >= STARTED_AT) return 'in-progress';
  return 'unviewed';
}

export function progressOf(record: ArchiveRecord): RecordProgress {
  const entry = stored[record.id];
  if (entry) {
    const fraction = entry.completed ? 1 : entry.duration > 0 ? Math.min(1, entry.position / entry.duration) : 0;
    return { fraction, position: entry.position, status: statusFor(fraction, entry.completed), updatedAt: entry.updatedAt };
  }
  return { fraction: 0, position: 0, status: 'unviewed' };
}

/** Called by the player with its clock. Throttled by the caller (e.g. every few seconds). */
export function reportPlayback(recordId: string, position: number, duration: number) {
  if (!getRecord(recordId) || !(duration > 0)) return;
  const previous = stored[recordId];
  stored[recordId] = {
    position,
    duration,
    completed: previous?.completed || position / duration >= COMPLETE_AT,
    updatedAt: Date.now(),
  };
  write();
}

/** Called by the player when the media ends. */
export function reportEnded(recordId: string, duration: number) {
  if (!getRecord(recordId)) return;
  stored[recordId] = { position: duration, duration, completed: true, updatedAt: Date.now() };
  write();
}

/** Archive actions on a record card. */
export function markCompleted(recordId: string) {
  reportEnded(recordId, getRecord(recordId)?.media.duration ?? 1);
}

export function resetProgress(recordId: string) {
  const duration = getRecord(recordId)?.media.duration ?? 1;
  stored[recordId] = { position: 0, duration, completed: false, updatedAt: Date.now() };
  write();
}

export function onProgressChange(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Totals for a set of records: counts per status and overall fraction viewed. */
export function summarise(records: ArchiveRecord[]) {
  const counts: Record<PlaybackStatus, number> = { unviewed: 0, 'in-progress': 0, completed: 0 };
  let fraction = 0;
  for (const record of records) {
    const p = progressOf(record);
    counts[p.status] += 1;
    fraction += p.fraction;
  }
  return { counts, total: records.length, fraction: records.length ? fraction / records.length : 0 };
}

export const archiveSummary = () => summarise(allRecords());

export const STATUS_LABEL: Record<PlaybackStatus, string> = {
  unviewed: 'Unviewed',
  'in-progress': 'In progress',
  completed: 'Completed',
};
