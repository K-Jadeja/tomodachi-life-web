// Internal game types that extend the engine's Tomodachi with private fields
// the engine doesn't know about. We use a single "TomodachiInternal" alias
// internally to keep the code clear.

import { Tomodachi } from '../../engine';
import { ArchetypeId, ActiveWishState, MemoryRecord, TomodachiExt } from '../state/state';

export interface TomodachiInternal extends Tomodachi, TomodachiExt {
  archetypeId?: ArchetypeId;
  wish?: ActiveWishState;
  memory?: MemoryRecord[];
  recentLocations?: Record<string, number>;
  talkCount?: number;
  feedCount?: number;
  affinity?: Record<string, number>;
}

/** Type guard. */
export function isInternal(t: Tomodachi): t is TomodachiInternal {
  return true; // All tomodachis are now internal — kept for clarity
}
