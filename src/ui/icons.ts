import { raw, type Raw } from './html';

/** One set: 18 × 18 grid, 1.5 stroke, square caps — the same grammar as the AFTERIMAGE player icons. */
const svg = (body: string, size = 18): Raw =>
  raw(
    `<svg class="icon" viewBox="0 0 18 18" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${body}</svg>`,
  );

export const icons = {
  search: () => svg('<circle cx="7.75" cy="7.75" r="4.75"/><path d="m11.5 11.5 3.75 3.75"/>'),
  close: () => svg('<path d="m4.25 4.25 9.5 9.5m0-9.5-9.5 9.5"/>'),
  arrowLeft: () => svg('<path d="M15 9H3.5M7.5 5 3.5 9l4 4"/>'),
  arrowRight: () => svg('<path d="M3 9h11.5M10.5 5l4 4-4 4"/>'),
  chevron: () => svg('<path d="M7 4.5 11.5 9 7 13.5"/>'),
  /** The cabinet: browse the whole archive. */
  cabinet: () => svg('<path d="M3.25 2.75h11.5v12.5H3.25zM3.25 9h11.5M7.5 5.75h3M7.5 12h3"/>'),
  folder: () => svg('<path d="M2.75 5.25h4l1.25-1.5h7.25v10.5H2.75z"/>'),
  /** Reserved frame: the player's place. */
  frame: () => svg('<path d="M2.75 4.25h12.5v9.5H2.75z"/><path d="m7.5 6.75 3.5 2.25-3.5 2.25z" fill="currentColor" stroke="none"/>'),
  check: () => svg('<path d="m3.75 9.5 3.25 3.25 7.25-7.75"/>'),
  reset: () => svg('<path d="M3.75 9a5.25 5.25 0 1 0 1.54-3.71"/><path d="M3.75 2.75v3h3"/>'),
};
