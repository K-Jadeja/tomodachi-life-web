// Wish lifecycle. Owns the active wish attached to each Tomodachi. Pure
// functions for assign/check/hint/fulfill. The behavior tick (and any
// other system) calls into this module to update wish state.

import { Tomodachi, GameTime, TomodachiNeeds } from '../../engine';
import { game, ActiveWishState, WishProgress } from '../state/state';
import { WISHES, Wish, WishContext } from '../content/wishes';
import { ARCHETYPES, ArchetypeId } from '../content/archetypes';
import { TomodachiInternal } from './types';

/** Find the wish that matches a Tomodachi's archetype. */
function findWishFor(archetype: ArchetypeId): Wish | null {
  return WISHES.find((w) => w.archetype === archetype) ?? null;
}

/** Initialize an active wish for a Tomodachi. Idempotent. */
export function assignWishTo(t: Tomodachi, archetype: ArchetypeId, time: GameTime): void {
  const w = findWishFor(archetype);
  if (!w) return;
  const ext = t as TomodachiInternal;
  if (ext.wish && ext.wish.wishId === w.id) return; // already assigned

  const wish: ActiveWishState = {
    wishId: w.id,
    archetype,
    status: 'active',
    progress: {
      counts: {},
      hintsRevealed: 0,
      startedAt: { day: time.day, hour: time.hour, minute: time.minute },
    },
  };
  game.set((s) => ({
    ...s,
    tomodachis: s.tomodachis.map((x) => (x.id === t.id ? ({ ...x, archetypeId: archetype, wish } as TomodachiInternal) : x)),
  }));
}

/** Build a WishContext from a Tomodachi and current game time. */
function buildContext(t: Tomodachi, time: GameTime): WishContext {
  const ext = t as TomodachiInternal;
  return {
    time,
    needs: t.needs,
    recentLocations: ext.recentLocations ?? {},
    talkCount: ext.talkCount ?? 0,
    feedCount: ext.feedCount ?? 0,
  };
}

/** Get the current hints unlocked for a Tomodachi's wish. */
export function revealedHints(t: Tomodachi): string[] {
  const ext = t as TomodachiInternal;
  if (!ext.wish) return [];
  const w = WISHES.find((x) => x.id === ext.wish!.wishId);
  if (!w) return [];
  const n = ext.wish.progress.hintsRevealed;
  return w.hints.slice(0, n);
}

/** Get the wish title (or hidden title if not yet discovered). */
export function wishTitle(t: Tomodachi): string {
  const ext = t as TomodachiInternal;
  if (!ext.wish) return '???';
  const w = WISHES.find((x) => x.id === ext.wish!.wishId);
  if (!w) return '???';
  if (ext.wish.status === 'active' && ext.wish.progress.hintsRevealed < 3) return '???';
  return w.title;
}

/** Reveal one hint if the player has met the unlock condition. */
function maybeRevealHint(t: Tomodachi, time: GameTime): TomodachiInternal {
  const ext = t as TomodachiInternal;
  if (!ext.wish) return ext;
  if (ext.wish.progress.hintsRevealed >= 4) return ext;
  if (ext.wish.status !== 'active') return ext;

  const w = WISHES.find((x) => x.id === ext.wish!.wishId);
  if (!w) return ext;

  const n = ext.wish.progress.hintsRevealed;
  // Each hint unlocks when a simple condition is met:
  //   hint 0: assigned (free)
  //   hint 1: visitCount >= 1
  //   hint 2: talkCount >= 2 (or feedCount for foodie)
  //   hint 3: status became 'discovered' (i.e. 3+ hints revealed)
  // The 4th hint is implied at discovery time.
  const ctx = buildContext(t, time);
  const visitSum = Object.values(ctx.recentLocations).reduce((a, b) => a + b, 0);
  const shouldReveal =
    (n === 0) ||
    (n === 1 && visitSum >= 1) ||
    (n === 2 && (ctx.talkCount + ctx.feedCount) >= 2);
  if (!shouldReveal) return ext;

  const next: TomodachiInternal = {
    ...ext,
    wish: {
      ...ext.wish,
      progress: { ...ext.wish.progress, hintsRevealed: n + 1 },
    },
  };
  // Promote to 'discovered' once 3+ hints are revealed.
  if (next.wish!.progress.hintsRevealed >= 3 && next.wish!.status === 'active') {
    next.wish = { ...next.wish!, status: 'discovered' };
  }
  return next;
}

/** Check whether the wish should be fulfilled, and fulfill it. Returns true on fulfillment. */
function maybeFulfill(t: Tomodachi, time: GameTime): { t: TomodachiInternal; fulfilled: boolean } {
  const ext = t as TomodachiInternal;
  if (!ext.wish) return { t: ext, fulfilled: false };
  if (ext.wish.status === 'fulfilled') return { t: ext, fulfilled: false };

  const w = WISHES.find((x) => x.id === ext.wish!.wishId);
  if (!w) return { t: ext, fulfilled: false };

  const ctx = buildContext(t, time);
  if (!w.fulfillTest(t, ctx)) return { t: ext, fulfilled: false };

  const next: TomodachiInternal = {
    ...ext,
    wish: {
      ...ext.wish,
      status: 'fulfilled',
      progress: {
        ...ext.wish.progress,
        fulfilledAt: { day: time.day, hour: time.hour, minute: time.minute },
      },
      flavorBark: w.flavorBark,
    },
  };
  // Apply reward to personality (small permanent buff)
  if (w.reward) {
    const r = w.reward as Partial<TomodachiNeeds>;
    // We re-purpose the reward to slightly raise needs + a mood.
    next.needs = {
      ...next.needs,
      happiness: Math.min(10, next.needs.happiness + (r.happiness ?? 0)),
    };
    next.mood = 'happy';
  }
  return { t: next, fulfilled: true };
}

/** Per-tick: process hints and fulfillment for all Tomodachis. */
export function tickWishes(time: GameTime): void {
  let anyFulfilled = false;
  let changed = false;
  const updated: TomodachiInternal[] = [];
  for (const t of game.get().tomodachis) {
    let cur = t as TomodachiInternal;
    // Reveal hints first
    const hinted = maybeRevealHint(cur, time);
    if (hinted !== cur) { cur = hinted; changed = true; }
    // Then check fulfillment
    const f = maybeFulfill(cur, time);
    if (f.fulfilled) { cur = f.t; changed = true; anyFulfilled = true; }
    updated.push(cur);
  }
  if (changed) {
    game.set((s) => ({ ...s, tomodachis: updated }));
  }
  if (anyFulfilled) {
    // Emit a system event for any fulfilled wishes
    for (const t of updated) {
      const w = t.wish;
      if (w && w.status === 'fulfilled' && w.progress.fulfilledAt) {
        const def = WISHES.find((x) => x.id === w.wishId);
        if (def) {
          game.set((s) => ({
            ...s,
            events: [
              ...s.events,
              {
                time: time.totalMinutes,
                day: time.day,
                kind: 'system' as const,
                text: `${t.name}'s wish "${def.title}" was fulfilled!`,
                tomodachiId: t.id,
              },
            ].slice(-200),
          }));
        }
      }
    }
  }
}

/** Player action: bumps a counter on the wish. The wish fulfillTest reads these. */
export function recordProgress(t: Tomodachi, kind: string, by = 1): void {
  const ext = t as TomodachiInternal;
  if (!ext.wish) return;
  const counts = { ...(ext.wish.progress.counts) };
  counts[kind] = (counts[kind] ?? 0) + by;
  game.set((s) => ({
    ...s,
    tomodachis: s.tomodachis.map((x) => {
      if (x.id !== t.id) return x;
      const xi = x as TomodachiInternal;
      return {
        ...xi,
        wish: { ...xi.wish!, progress: { ...xi.wish!.progress, counts } },
      } as TomodachiInternal;
    }),
  }));
}

/** Get a wish's full definition (for the info panel). */
export function getWishDef(t: Tomodachi): Wish | null {
  const ext = t as TomodachiInternal;
  if (!ext.wish) return null;
  return WISHES.find((w) => w.id === ext.wish!.wishId) ?? null;
}

/** Get archetype name for a Tomodachi. */
export function archetypeName(t: Tomodachi): string {
  const ext = t as TomodachiInternal;
  if (!ext.archetypeId) return '—';
  return ARCHETYPES[ext.archetypeId]?.name ?? '—';
}
