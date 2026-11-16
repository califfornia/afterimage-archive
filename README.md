# AFTERIMAGE ARCHIVE

A system for exploring moving images: a curated video collection presented as a filing cabinet. **Archive → drawer (collection) → record (video).** Opening a drawer shows its videos.

```sh
npm install
npm run dev      # http://localhost:5173 (or the port Vite prints)
npm run build
npm run sync:skin  # copy the latest skin from ../video player/src/skin
```

HTML + Vite + TypeScript, no framework. Fonts: Archivo (sans) and Space Mono (archive IDs, time, metadata), self-hosted through Fontsource.

## Views (hash routes)

| Route | View |
| --- | --- |
| `#/` | The cabinet: every drawer, with counts and an index meter per record |
| `#/c/dogs?status=unviewed` | A drawer opened: its records as index entries, filterable by status |
| `#/r/DG-001` | The viewing table: reserved player frame, catalogue card, previous/next, drawer index, archive navigator |
| `#/search?q=horse&status=completed` | Search by title, archive ID or drawer |

Back/forward, reloads and shared links keep the context. The record on the viewing table is remembered (also across reloads) and shown in the masthead and on the cabinet.

Keys: `/` search, `Escape` clears search or closes the navigator.

## Code

| Path | Role |
| --- | --- |
| `src/data/` | Data model (`types.ts`) and content (`archive.ts`): drawers, records and their Mux playback IDs |
| `src/state/` | Router, app store, viewing progress (localStorage) |
| `src/player/` | The player boundary: `contract.ts`, the AFTERIMAGE adapter (`afterimage.ts`) and a placeholder |
| `src/vendor/afterimage-skin/` | Copy of the AFTERIMAGE Video.js skin. Edit it in `../video player`, then `npm run sync:skin`. |
| `src/ui/` | Views and shared parts, rendered from data |
| `src/styles/` | `--ax-*` tokens and styles; `player-theme.css` maps them onto the player skin |
| `INTEGRATION.md` | How the AFTERIMAGE player is wired in |

## Content

- **Videos live on Mux.** Each record has its own public playback ID; Mux serves the HLS stream, stills and storyboard from it, with no API keys in the app. To add a record, add a line in `src/data/archive.ts` with the playback ID, a title and the duration.
- **Titles are provisional**, written from what each video shows. Durations come from each video's Mux storyboard.
- The Mux encodes top out at 480p.
- **Progress** is kept **in this browser only**. There is no account or backend. The player reports it as you watch (and resumes where you left off); "Mark completed" / "Mark unviewed" change it by hand.
