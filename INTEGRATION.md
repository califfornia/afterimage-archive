# The AFTERIMAGE player in the Archive

The Archive renders no playback UI of its own. The viewing table (`src/ui/viewing.ts`) mounts a **PlayerAdapter** in a reserved 16:9 frame (`[data-player-slot]`) and hands it records. The adapter in use is the AFTERIMAGE player (`src/player/afterimage.ts`); the placeholder (`src/player/placeholder.ts`) implements the same contract and can stand in.

## How it is wired

```
Archive (record, progress, navigation)
  └─ PlayerAdapter (src/player/afterimage.ts)
       └─ <video-player>                         Video.js 10 player (state)
            └─ <afterimage-skin layout="overlay" viewer="off">
                 ├─ <mux-video>                  Mux HLS stream, poster, storyboard
                 └─ <afterimage-catalogue>       the record's data, for the skin's fullscreen card
```

- **Skin source:** `src/vendor/afterimage-skin/` is a copy of `../video player/src/skin/`. **Do not edit it here.** Change the skin in its own project, then run `npm run sync:skin`.
- **Overlay layout:** the skin's controls float over the picture, so the player fills the 16:9 frame exactly. Its header and catalogue card appear only in fullscreen; on the page, the Archive shows the title and catalogue. In a small frame (phones), the skin goes compact: play, time, frame stepper, fullscreen.
- **Theme:** `src/styles/player-theme.css` sets the skin's `--ai-*` tokens from the Archive's `--ax-*` tokens, so one palette drives both.

## The contract (`src/player/contract.ts`)

```ts
interface PlayerAdapter {
  mount(container: HTMLElement): void;
  load(source: PlayerSource, options?: { startAt?: number }): void;
  on(listener: (event: PlayerEvent) => void): () => void;
  destroy(): void;
}
```

- **Archive → player:** `load()` gets the record's Mux playback ID, title, archive ID, drawer and poster. `startAt` resumes an in-progress record.
- **Player → Archive:** `timeupdate` (saved at most every 5 s while playing, and at once on pause, on switching records and on leaving the viewer) and `ended` (marks the record completed) update progress in `src/state/progress.ts`.
- **Context** (selected record, drawer, route) stays in the Archive's store; the player never sees it.

## Known limits

- **Frame rate** is measured from the native `<video>` inside `<mux-video>` during playback. Until then, frame numbers use 24 fps, labelled *assumed*.
- **Resolution:** the current Mux encodes top out at 480p.
- **Progress** lives in this browser's localStorage only.
