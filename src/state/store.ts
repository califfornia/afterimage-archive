import { getRecord } from '../data/archive';
import { parse, type Route } from './router';

/**
 * Application state: the current route, the record on the viewing table, and
 * the last place visited in the archive (so "back to the archive" returns
 * there, not to the top).
 */

export interface AppState {
  route: Route;
  /** The selected record survives navigation between the archive and the viewer. */
  selectedRecordId: string | null;
  /** The last non-viewer route, for returning from the viewer and from search. */
  archiveRoute: Route;
}

const SELECTED_KEY = 'afterimage-archive:selected';

function readSelected(): string | null {
  try {
    const id = localStorage.getItem(SELECTED_KEY);
    return id && getRecord(id) ? id : null;
  } catch {
    return null;
  }
}

type Listener = (state: AppState, previous: AppState) => void;

const initialRoute = parse(location.hash);
let state: AppState = {
  route: initialRoute,
  selectedRecordId: initialRoute.view === 'record' ? initialRoute.recordId : readSelected(),
  archiveRoute: initialRoute.view === 'record' || initialRoute.view === 'search' ? { view: 'overview' } : initialRoute,
};

const listeners = new Set<Listener>();

export const store = {
  get: () => state,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setRoute(route: Route) {
    const previous = state;
    const selectedRecordId = route.view === 'record' ? route.recordId : state.selectedRecordId;
    const archiveRoute = route.view === 'record' || route.view === 'search' ? state.archiveRoute : route;
    state = { route, selectedRecordId, archiveRoute };
    if (selectedRecordId !== previous.selectedRecordId && selectedRecordId) {
      try {
        localStorage.setItem(SELECTED_KEY, selectedRecordId);
      } catch {
        /* ignore */
      }
    }
    for (const listener of listeners) listener(state, previous);
  },
};

window.addEventListener('hashchange', () => store.setRoute(parse(location.hash)));
