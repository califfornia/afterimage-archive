import { archive, getRecord, recordsInCollection } from '../data/archive';
import { progressOf } from '../state/progress';
import { href } from '../state/router';
import type { AppState } from '../state/store';
import { html, plural, toString } from './html';
import { icons } from './icons';
import { statusBadge } from './status';

/**
 * The archive navigator: the whole cabinet as a tree (drawer → record) in a
 * modal dialog, so another record can be chosen from anywhere without leaving
 * the viewing table. Opens on the current record's drawer.
 */
export function createNavigator(dialog: HTMLDialogElement) {
  function render(state: AppState) {
    const current = state.selectedRecordId ? getRecord(state.selectedRecordId) : null;
    dialog.innerHTML = toString(html`
      <div class="navigator__panel">
        <header class="navigator__head">
          <div>
            <p class="eyebrow">Cabinet A</p>
            <h2 class="navigator__title" id="navigator-title">Browse the archive</h2>
          </div>
          <button type="button" class="icon-button" data-action="close-navigator" aria-label="Close">${icons.close()}</button>
        </header>
        <nav class="navigator__tree" aria-labelledby="navigator-title">
          <ul>
            ${archive.collections.map((c) => {
              // A small cabinet: every drawer starts open.
              return html`<li>
                <details class="tree-drawer" open>
                  <summary>
                    <span class="tree-drawer__code">D${c.drawer}</span>
                    <span class="tree-drawer__name">${c.name}</span>
                    <span class="tree-drawer__count">${plural(recordsInCollection(c.id).length, 'record')}</span>
                  </summary>
                  <ol>
                    ${recordsInCollection(c.id).map((r) => {
                      const isCurrent = r.id === current?.id;
                      return html`<li>
                        <a class="tree-record" href="${href({ view: 'record', recordId: r.id })}" ${isCurrent ? html`aria-current="true"` : ''}>
                          <span class="tree-record__id">${r.id}</span>
                          <span class="tree-record__title">${r.title}</span>
                          ${statusBadge(progressOf(r).status, { compact: true })}
                        </a>
                      </li>`;
                    })}
                  </ol>
                </details>
              </li>`;
            })}
          </ul>
        </nav>
      </div>`);
  }

  dialog.addEventListener('click', (event) => {
    // Clicking the backdrop (the dialog box itself, outside the panel) closes it.
    if (event.target === dialog) dialog.close();
    if ((event.target as Element).closest('[data-action="close-navigator"]')) dialog.close();
  });

  return {
    open(state: AppState) {
      render(state);
      dialog.showModal();
      const current = dialog.querySelector<HTMLElement>('[aria-current="true"]');
      (current ?? dialog.querySelector<HTMLElement>('summary'))?.focus();
      current?.scrollIntoView({ block: 'center' });
    },
    close() {
      if (dialog.open) dialog.close();
    },
  };
}
