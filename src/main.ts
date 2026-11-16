import '@fontsource-variable/archivo/standard.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/cabinet.css';
import './styles/collection.css';
import './styles/entries.css';
import './styles/viewing.css';
import './styles/navigator.css';

import { getRecord } from './data/archive';
import { createAfterimagePlayer } from './player/afterimage';
import { markCompleted, onProgressChange, resetProgress } from './state/progress';
import { href, navigate, type Route } from './state/router';
import { store, type AppState } from './state/store';
import { collectionView } from './ui/collection';
import { toString } from './ui/html';
import { createNavigator } from './ui/navigator';
import { overviewView } from './ui/overview';
import { searchView } from './ui/search';
import { createViewingTable } from './ui/viewing';

const view = document.querySelector<HTMLElement>('#view')!;
const search = document.querySelector<HTMLInputElement>('#search')!;
const searchForm = document.querySelector<HTMLFormElement>('#search-form')!;
const resume = document.querySelector<HTMLAnchorElement>('#resume')!;
const navigator = createNavigator(document.querySelector<HTMLDialogElement>('#navigator')!);

/**
 * The player adapter: the AFTERIMAGE Video.js player. The placeholder
 * (./player/placeholder) implements the same contract and can stand in.
 */
const createPlayer = createAfterimagePlayer;

let viewing: ReturnType<typeof createViewingTable> | null = null;

/** A key that changes when the view needs a fresh render (and focus move). */
const viewKey = (route: Route) => {
  switch (route.view) {
    case 'overview':
      return 'overview';
    case 'collection':
      return `c:${route.collectionId}`;
    case 'record':
      return 'record';
    case 'search':
      return 'search';
  }
};

function render(state: AppState, previous?: AppState) {
  const { route } = state;
  document.body.dataset.view = route.view;
  // Re-rendering the same view (a filter, a progress change) keeps focus on the same link.
  const active = document.activeElement;
  const focusHref = active instanceof HTMLAnchorElement && view.contains(active) ? active.getAttribute('href') : null;

  if (route.view === 'record') {
    if (!viewing) {
      view.replaceChildren();
      viewing = createViewingTable(view, createPlayer);
    }
    viewing.show(route.recordId);
    document.title = `${getRecord(route.recordId).title} — AFTERIMAGE ARCHIVE`;
  } else {
    viewing?.destroy();
    viewing = null;
    let markup;
    switch (route.view) {
      case 'overview':
        markup = overviewView(state);
        document.title = 'AFTERIMAGE ARCHIVE';
        break;
      case 'collection':
        markup = collectionView(state, route.collectionId, route.status);
        break;
      case 'search':
        markup = searchView(state, route.query, route.status);
        document.title = 'Search — AFTERIMAGE ARCHIVE';
        break;
    }
    view.innerHTML = toString(markup);
    if (route.view === 'collection') {
      document.title = `${view.querySelector('#view-heading')?.textContent?.trim()} — AFTERIMAGE ARCHIVE`;
    }
  }

  // Header: search mirrors the route; the resume link points at the record on the table.
  if (route.view === 'search') {
    if (document.activeElement !== search) search.value = route.query;
  } else if (document.activeElement !== search) {
    search.value = '';
  }
  const selected = state.selectedRecordId ? getRecord(state.selectedRecordId) : null;
  resume.hidden = !selected || route.view === 'record';
  if (selected) {
    resume.href = href({ view: 'record', recordId: selected.id });
    resume.querySelector('.resume-chip__id')!.textContent = selected.id;
  }

  const restore = () => {
    if (!focusHref || document.activeElement !== document.body) return;
    view.querySelector<HTMLElement>(`a[href="${CSS.escape(focusHref)}"]`)?.focus({ preventScroll: true });
  };

  if (!previous) return;
  navigator.close();

  // Focus: a new view moves focus to its heading. Returning from the viewer
  // lands on the record that was on the table, so the reader keeps their place.
  const keyChanged = viewKey(previous.route) !== viewKey(route) || (route.view === 'record' && previous.route.view !== 'record');
  const sameRecordSwitch = route.view === 'record' && previous.route.view === 'record';
  if (route.view === 'search' && previous.route.view === 'search') return restore(); // typing keeps focus in the field
  if (keyChanged || sameRecordSwitch) {
    const back =
      previous.route.view === 'record' && route.view !== 'record'
        ? view.querySelector<HTMLElement>(`[data-record-id="${previous.route.recordId}"] a`)
        : null;
    if (back) {
      back.focus({ preventScroll: true });
      back.scrollIntoView({ block: 'center' });
    } else if (document.activeElement !== search) {
      view.querySelector<HTMLElement>('#view-heading')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    }
  } else {
    restore();
  }
}

store.subscribe(render);
render(store.get());

// Progress changes re-render archive views (the viewer refreshes its own regions).
onProgressChange(() => {
  if (store.get().route.view !== 'record') render(store.get());
});

/* ---------- Search: live, into the #/search route ---------- */

let searchTimer = 0;
search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    const query = search.value.trim();
    const { route, archiveRoute } = store.get();
    if (query) {
      navigate({ view: 'search', query, status: route.view === 'search' ? route.status : 'all' }, { replace: route.view === 'search' });
    } else if (route.view === 'search') {
      navigate(archiveRoute, { replace: true });
    }
  }, 160);
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  view.querySelector<HTMLElement>('.entry__link')?.focus();
});

search.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && search.value) {
    event.preventDefault();
    search.value = '';
    search.dispatchEvent(new Event('input'));
  }
});

// "/" jumps to search from anywhere outside a text field.
document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (event.key !== '/' || event.metaKey || event.ctrlKey || target.closest('input, textarea, [contenteditable]')) return;
  event.preventDefault();
  search.focus();
  search.select();
});

/* ---------- Actions ---------- */

document.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!button) return;
  const recordId = button.dataset.record;
  switch (button.dataset.action) {
    case 'open-navigator':
      navigator.open(store.get());
      break;
    case 'mark-completed':
      if (recordId) markCompleted(recordId);
      break;
    case 'reset-progress':
      if (recordId) resetProgress(recordId);
      break;
  }
});
