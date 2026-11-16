import type { Archive, ArchiveCollection, ArchiveRecord, VideoSource } from './types';

/**
 * The archive's content: three drawers, seven records, each its own video on Mux.
 *
 * To add a record, add a line with its Mux playback ID (public policy), its
 * title and its duration in seconds. Durations here come from each video's
 * Mux storyboard; the player reports the exact value when it plays.
 *
 * Titles are provisional, written from what each video shows.
 */

interface RecordOutline {
  title: string;
  playbackId: string;
  duration: number;
}

interface CollectionOutline {
  code: string;
  name: string;
  summary: string;
  records: RecordOutline[];
}

const outline: CollectionOutline[] = [
  {
    code: 'CT',
    name: 'Cats',
    summary: 'Short studies of cats at rest and at play.',
    records: [
      { title: 'Two cats in the afternoon sun', playbackId: 'kymgdOKEpjAwxocX2Kh2mN00q3tzt8HMhn4IFueUeTRw', duration: 21.76 },
      { title: 'Kitten in the long grass', playbackId: 'GcS02pNNIMbh2gn02waQQ6Edf8HADcuZcvQAFX01a5UdL4', duration: 11.92 },
    ],
  },
  {
    code: 'DG',
    name: 'Dogs',
    summary: 'Dogs outdoors: wet paths, field edges and summer grass.',
    records: [
      { title: 'A walk in the autumn rain', playbackId: 'DrgJE2cGpFSJk1Zx4AObPofFQUwmT2DsJcVF01v1rX02g', duration: 10.5 },
      { title: 'Along the edge of the field', playbackId: 'fyX2bbYquS4DVQq00J00Jug3yheDdMHPcLxu00nqCllF54', duration: 7.26 },
      { title: 'Summer meadow', playbackId: 'Xbh6Fnq7d1LMVArHKGAr6Ok0138ooT9c4G4qmpYndSfM', duration: 13.31 },
    ],
  },
  {
    code: 'HR',
    name: 'Horses',
    summary: 'Horses in pasture and paddock, in low evening light and full sun.',
    records: [
      { title: 'Two horses grazing at dusk', playbackId: 'UME4t00Pk2nzKCqy2nmkFn4j7OY02caeTcl94dPeWYG3o', duration: 15.92 },
      { title: 'Grey horse in the paddock', playbackId: 'u946022xfHKiWG1ndoKgalNFVMRmQEvmVfFs8gmHXuoQ', duration: 11.27 },
    ],
  },
];

/** Everything Mux serves for a public playback ID, without API keys. */
export function muxSource(playbackId: string, duration: number): VideoSource {
  return {
    playbackId,
    kind: 'hls',
    src: `https://stream.mux.com/${playbackId}.m3u8`,
    storyboard: `https://image.mux.com/${playbackId}/storyboard.vtt`,
    thumbnail: (seconds, width = 480) =>
      `https://image.mux.com/${playbackId}/thumbnail.webp?width=${width}&time=${Math.max(0, Math.round(seconds * 10) / 10)}`,
    duration,
  };
}

const pad = (n: number, length = 2) => String(n).padStart(length, '0');
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function build(): Archive {
  const collections: ArchiveCollection[] = [];
  const records: Record<string, ArchiveRecord> = {};

  outline.forEach((c, ci) => {
    const collectionId = slug(c.name);
    const collection: ArchiveCollection = {
      id: collectionId,
      code: c.code,
      drawer: pad(ci + 1),
      name: c.name,
      summary: c.summary,
      recordIds: [],
    };
    c.records.forEach((r, ri) => {
      const id = `${c.code}-${pad(ri + 1, 3)}`;
      // The still is taken a third of the way in: past any fade, before the end.
      records[id] = { id, title: r.title, collectionId, media: muxSource(r.playbackId, r.duration), stillAt: r.duration / 3 };
      collection.recordIds.push(id);
    });
    collections.push(collection);
  });

  return { collections, records };
}

export const archive: Archive = build();

/* ---------- Lookups ---------- */

export const getCollection = (id: string) => archive.collections.find((c) => c.id === id);
export const getRecord = (id: string) => archive.records[id];
export const recordsInCollection = (collectionId: string) => getCollection(collectionId)?.recordIds.map(getRecord) ?? [];
export const allRecords = () => archive.collections.flatMap((c) => recordsInCollection(c.id));
