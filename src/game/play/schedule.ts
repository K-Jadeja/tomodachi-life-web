// Daily schedule. Each Tomodachi's archetype maps to a per-time-of-day
// location. Each hour, behavior moves any Tomodachi whose archetype's
// preferred location for the current time differs from where they are.

import { Tomodachi, GameTime } from '../../engine';
import { game } from '../state/state';
import { ARCHETYPES, ArchetypeId } from '../content/archetypes';
import { GameLocationId, BUILDING_NODES } from '../content/locations';
import { TomodachiInternal } from './types';
import { bumpLocationCount, rememberVisit } from './memory';
import { setWorldTarget, leaveBuilding } from './overworld';

void ARCHETYPES;

/**
 * Default daily schedule (time of day → location) for each archetype.
 * Time buckets: morning (6-11), day (11-17), evening (17-20), night (20-6).
 * Returns the location a Tomodachi "should" be at for the given hour.
 */
export function scheduledLocation(archetype: ArchetypeId, hour: number): GameLocationId {
  // Simple slot rules. Override with archetype-specific quirks:
  switch (archetype) {
    case 'loner':
      if (hour < 8) return 'apartment';
      if (hour < 12) return 'apartment';
      if (hour < 14) return 'cafe';
      if (hour < 17) return 'park';
      if (hour < 20) return 'apartment';
      return 'apartment';
    case 'performer':
      if (hour < 8) return 'apartment';
      if (hour < 11) return 'town';
      if (hour < 14) return 'cafe';
      if (hour < 17) return 'town';
      if (hour < 22) return 'town';
      return 'apartment';
    case 'foodie':
      if (hour < 9) return 'apartment';
      if (hour < 11) return 'cafe';
      if (hour < 14) return 'cafe';
      if (hour < 17) return 'park';
      if (hour < 21) return 'cafe';
      return 'apartment';
    case 'scholar':
      if (hour < 9) return 'apartment';
      if (hour < 12) return 'apartment';
      if (hour < 14) return 'cafe';
      if (hour < 17) return 'park';
      if (hour < 20) return 'apartment';
      return 'apartment';
    case 'adventurer':
      if (hour < 8) return 'apartment';
      if (hour < 11) return 'park';
      if (hour < 14) return 'beach';
      if (hour < 17) return 'town';
      if (hour < 20) return 'beach';
      return 'apartment';
    case 'romantic':
      if (hour < 9) return 'apartment';
      if (hour < 12) return 'cafe';
      if (hour < 14) return 'park';
      if (hour < 17) return 'beach';
      if (hour < 20) return 'beach';
      return 'apartment';
  }
}

/** Where should this Tomodachi be right now? */
export function scheduledFor(t: Tomodachi, time: GameTime): GameLocationId | null {
  const ext = t as TomodachiInternal;
  if (!ext.archetypeId) return null;
  return scheduledLocation(ext.archetypeId, time.hour);
}

/**
 * Once per in-game hour, route Tomodachis toward their scheduled location.
 *
 * If the character is already in the target interior — no-op.
 * If on the overworld — set a worldTarget to the matching building, and
 *   they'll walk there and auto-enter.
 * If in a different interior — exit to the overworld and start walking.
 */
export function tickSchedule(prev: GameTime, next: GameTime): void {
  if (prev.hour === next.hour) return;
  const all = game.get().tomodachis;
  for (const t of all) {
    const target = scheduledFor(t, next);
    if (!target) continue;
    if (t.location === target) continue;

    if (t.location === 'overworld') {
      const node = BUILDING_NODES.find((n) => n.enters === target);
      if (node) setWorldTarget(t, node.x, node.y, target);
      continue;
    }

    // Currently in a different interior: exit, then walk.
    leaveBuilding(t);
    const fresh = game.get().tomodachis.find((x) => x.id === t.id);
    if (!fresh) continue;
    const node = BUILDING_NODES.find((n) => n.enters === target);
    if (node) setWorldTarget(fresh, node.x, node.y, target);
  }
  game.set((s) => ({ ...s, lastScheduleTickHour: next.hour }));
}

/**
 * Player action: "Send to <location>". When sent to an interior building,
 * the character walks across the overworld first (or teleports out of a
 * different interior and walks). Recorded as a visit at journey start so
 * the wish system sees it immediately.
 */
export function sendTo(t: Tomodachi, location: GameLocationId, time: GameTime): void {
  if (t.location === location) return;
  // Bookkeeping: record intent up-front so the wish engine reacts to the
  // player's action even before the character physically arrives.
  rememberVisit(t, location, time);
  bumpLocationCount(t, location, 1);

  if (location === 'overworld') {
    // Player wants the character on the island; just leave the current building.
    leaveBuilding(t);
    return;
  }

  if (t.location === 'overworld') {
    const node = BUILDING_NODES.find((n) => n.enters === location);
    if (node) setWorldTarget(t, node.x, node.y, location);
    return;
  }

  // In a different interior: pop out then walk over.
  leaveBuilding(t);
  const fresh = game.get().tomodachis.find((x) => x.id === t.id);
  if (!fresh) return;
  const node = BUILDING_NODES.find((n) => n.enters === location);
  if (node) setWorldTarget(fresh, node.x, node.y, location);
}
