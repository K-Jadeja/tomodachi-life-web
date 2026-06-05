// Structured memory. Each Tomodachi has a small rolling list of recent
// memories, used to flavor barks and the info panel. Pure functions over
// the in-memory state; no IO.

import { Tomodachi, GameTime } from '../../engine';
import { game, TomodachiExt, MemoryRecord } from '../state/state';
import { TomodachiInternal } from './types';

const MAX_MEMORIES = 12;

/** Read a Tomodachi's memory list (newest first). */
export function recall(t: Tomodachi, n = 5): MemoryRecord[] {
  const ext = t as TomodachiInternal;
  const list = ext.memory ?? [];
  return list.slice(0, n);
}

/** Append a memory. Trims to MAX_MEMORIES. */
export function remember(tomodachiId: string, rec: MemoryRecord): void {
  const all = game.get().tomodachis;
  game.set((s) => ({
    ...s,
    tomodachis: all.map((t) => {
      if (t.id !== tomodachiId) return t;
      const ext = t as TomodachiInternal;
      const list = [rec, ...(ext.memory ?? [])];
      if (list.length > MAX_MEMORIES) list.length = MAX_MEMORIES;
      return { ...t, memory: list } as TomodachiInternal;
    }),
  }));
}

/** Convenience: log a visit to a location. */
export function rememberVisit(t: Tomodachi, location: string, time: GameTime): void {
  remember(t.id, {
    kind: 'visit',
    key: location,
    at: { day: time.day, hour: time.hour, minute: time.minute, totalMinutes: time.totalMinutes },
  });
}

/** Convenience: log a talk session. */
export function rememberTalk(t: Tomodachi, time: GameTime): void {
  remember(t.id, {
    kind: 'talk',
    key: t.id,
    at: { day: time.day, hour: time.hour, minute: time.minute, totalMinutes: time.totalMinutes },
  });
}

/** Convenience: log a feed. */
export function rememberFeed(t: Tomodachi, time: GameTime): void {
  remember(t.id, {
    kind: 'feed',
    key: t.id,
    at: { day: time.day, hour: time.hour, minute: time.minute, totalMinutes: time.totalMinutes },
  });
}

/** Bump the visit counter for a location on a Tomodachi. */
export function bumpLocationCount(t: Tomodachi, location: string, by = 1): void {
  const ext = t as TomodachiInternal;
  const prev = ext.recentLocations ?? {};
  const next: Record<string, number> = { ...prev, [location]: (prev[location] ?? 0) + by };
  game.set((s) => ({
    ...s,
    tomodachis: s.tomodachis.map((x) => (x.id === t.id ? ({ ...x, recentLocations: next } as TomodachiInternal) : x)),
  }));
}
