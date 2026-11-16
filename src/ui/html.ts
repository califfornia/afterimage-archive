/** Tiny HTML templating: values are escaped unless wrapped in raw(). */

const RAW = Symbol('raw');
export interface Raw {
  [RAW]: string;
}

export const raw = (value: string): Raw => ({ [RAW]: value });

const escape = (value: unknown) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type Value = string | number | boolean | null | undefined | Raw | Value[];

function serialise(value: Value): string {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(serialise).join('');
  if (typeof value === 'object' && RAW in value) return value[RAW];
  return escape(value);
}

export function html(strings: TemplateStringsArray, ...values: Value[]): Raw {
  let out = strings[0];
  values.forEach((value, i) => {
    out += serialise(value) + strings[i + 1];
  });
  return raw(out);
}

export const toString = (value: Raw) => value[RAW];

/* ---------- Formatting ---------- */

const pad = (n: number) => String(n).padStart(2, '0');

/** 10:30 · 1:02:03 */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Totals: "1:32" under ten minutes, then "24 min", "1 h 24 min". */
export function formatTotal(seconds: number): string {
  if (seconds < 600) return formatDuration(seconds);
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
