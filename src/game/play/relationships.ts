// Pairwise affinity. Each Tomodachi has a map of `affinity` keyed by another
// Tomodachi's id, score 0..100. Starts neutral at 50. Bumped by co-presence
// (when two Tomodachis are at the same location) and player interactions.

import { Tomodachi } from '../../engine';
import { game } from '../state/state';
import { TomodachiInternal } from './types';

const NEUTRAL = 50;
const MIN = 0;
const MAX = 100;
const CO_PRESENCE_BUMP = 0.5;     // per co-presence tick
const TALK_BUMP = 4;              // per player talk
const FEED_BUMP = 1;              // per player feed (small)

function clamp(n: number, lo = MIN, hi = MAX): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Get affinity score between two Tomodachis (a → b). */
export function getAff(aId: string, bId: string): number {
  const a = game.get().tomodachis.find((t) => t.id === aId) as TomodachiInternal | undefined;
  if (!a) return NEUTRAL;
  return a.affinity?.[bId] ?? NEUTRAL;
}

/** Mutate affinity by `by` points. */
export function bumpAff(aId: string, bId: string, by: number): void {
  if (aId === bId) return;
  const a = game.get().tomodachis.find((t) => t.id === aId) as TomodachiInternal | undefined;
  if (!a) return;
  const prev = a.affinity ?? {};
  const next = clamp((prev[bId] ?? NEUTRAL) + by);
  const updated = { ...prev, [bId]: next };
  game.set((s) => ({
    ...s,
    tomodachis: s.tomodachis.map((t) =>
      t.id === aId ? ({ ...t, affinity: updated } as TomodachiInternal) : t
    ),
  }));
}

/** Symmetric bump (both directions, slightly different weight). */
export function bumpBoth(aId: string, bId: string, by: number): void {
  bumpAff(aId, bId, by);
  bumpAff(bId, aId, by * 0.85);
}

/** Top N friends of a Tomodachi, sorted by affinity desc. */
export function topFriends(tomoId: string, n = 3): Array<{ id: string; name: string; score: number }> {
  const t = game.get().tomodachis.find((x) => x.id === tomoId) as TomodachiInternal | undefined;
  if (!t) return [];
  const aff = t.affinity ?? {};
  const all = game.get().tomodachis;
  const out: Array<{ id: string; name: string; score: number }> = [];
  for (const [k, v] of Object.entries(aff)) {
    const other = all.find((x) => x.id === k);
    if (!other) continue;
    out.push({ id: k, name: other.name, score: v });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, n);
}

/** Per-tick: bump affinity between Tomodachis at the same location. */
export function tickRelationships(): void {
  const list = game.get().tomodachis;
  // Group by location
  const byLoc = new Map<string, Tomodachi[]>();
  for (const t of list) {
    if (!byLoc.has(t.location)) byLoc.set(t.location, []);
    byLoc.get(t.location)!.push(t);
  }
  for (const group of byLoc.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        bumpBoth(group[i].id, group[j].id, CO_PRESENCE_BUMP);
      }
    }
  }
}

/** Player action: talking. */
export function onTalk(aId: string, bId: string): void {
  bumpBoth(aId, bId, TALK_BUMP);
}

/** Player action: feeding someone. */
export function onFeed(tomoId: string): void {
  // Tiny boost to affinity with the player is implicit; we just bump the talkCount-equivalent counter.
  // For affinity, we boost toward all co-located Tomodachis.
  const t = game.get().tomodachis.find((x) => x.id === tomoId);
  if (!t) return;
  for (const other of game.get().tomodachis) {
    if (other.id === tomoId) continue;
    if (other.location === t.location) bumpAff(other.id, tomoId, FEED_BUMP * 0.5);
  }
}
