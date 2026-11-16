import { getCollection, getRecord } from '../data/archive';
import type { PlaybackStatus } from '../data/types';

/**
 * Hash routes, so the browser's back button, reloads and shared links all
 * keep the archive context:
 *
 *   #/                                 archive (the cabinet)
 *   #/c/cats                           a drawer, opened: its records
 *   #/c/cats?status=completed          …filtered by playback status
 *   #/r/CT-001                         a record on the viewing table
 *   #/search?q=horse&status=unviewed   search results
 */

export type StatusFilter = PlaybackStatus | 'all';

export type Route =
  | { view: 'overview' }
  | { view: 'collection'; collectionId: string; status: StatusFilter }
  | { view: 'record'; recordId: string }
  | { view: 'search'; query: string; status: StatusFilter };

const STATUSES: StatusFilter[] = ['all', 'unviewed', 'in-progress', 'completed'];
const asStatus = (value: string | null): StatusFilter =>
  STATUSES.includes(value as StatusFilter) ? (value as StatusFilter) : 'all';

export function parse(hash: string): Route {
  const [path, queryString = ''] = hash.replace(/^#/, '').split('?');
  const query = new URLSearchParams(queryString);
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);

  if (parts[0] === 'c' && parts[1] && getCollection(parts[1])) {
    return { view: 'collection', collectionId: parts[1], status: asStatus(query.get('status')) };
  }
  if (parts[0] === 'r' && parts[1] && getRecord(parts[1])) {
    return { view: 'record', recordId: parts[1] };
  }
  if (parts[0] === 'search') {
    return { view: 'search', query: query.get('q') ?? '', status: asStatus(query.get('status')) };
  }
  return { view: 'overview' };
}

export function href(route: Route): string {
  switch (route.view) {
    case 'overview':
      return '#/';
    case 'collection':
      return `#/c/${route.collectionId}${route.status !== 'all' ? `?status=${route.status}` : ''}`;
    case 'record':
      return `#/r/${encodeURIComponent(route.recordId)}`;
    case 'search': {
      const params = new URLSearchParams();
      if (route.query) params.set('q', route.query);
      if (route.status !== 'all') params.set('status', route.status);
      const qs = params.toString();
      return `#/search${qs ? `?${qs}` : ''}`;
    }
  }
}

export const collectionRoute = (collectionId: string, status: StatusFilter = 'all'): Route => ({
  view: 'collection',
  collectionId,
  status,
});

export function navigate(route: Route, { replace = false } = {}) {
  const target = href(route);
  if (location.hash === target) return;
  if (replace) history.replaceState(null, '', target);
  else location.hash = target;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}
