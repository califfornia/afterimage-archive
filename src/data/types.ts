/**
 * Archive data model, two levels:
 *
 *   Archive → Collection (drawer) → Record (one video)
 *
 * Content lives in archive.ts; nothing in the UI hard-codes it.
 */

export type PlaybackStatus = 'unviewed' | 'in-progress' | 'completed';

/** Where a record's video lives and how to load it. */
export interface VideoSource {
  /** Mux playback ID (public playback policy). */
  playbackId: string;
  /** How the player must load it. Mux delivers HLS. */
  kind: 'mp4' | 'hls';
  src: string;
  /** WebVTT storyboard for thumbnails in the player's frame index. */
  storyboard: string;
  /** A still from the video at a given second. */
  thumbnail: (seconds: number, width?: number) => string;
  /** Seconds (read from the Mux storyboard; the player reports the exact value). */
  duration: number;
}

export interface ArchiveRecord {
  /** Unique archive identifier, e.g. "CT-001". */
  id: string;
  title: string;
  collectionId: string;
  media: VideoSource;
  /** Where in the video the record's still is taken (seconds). */
  stillAt: number;
}

export interface ArchiveCollection {
  id: string;
  /** Short code, e.g. "CT". */
  code: string;
  /** Drawer number in the cabinet, e.g. "01". */
  drawer: string;
  name: string;
  summary: string;
  recordIds: string[];
}

export interface Archive {
  collections: ArchiveCollection[];
  records: Record<string, ArchiveRecord>;
}
