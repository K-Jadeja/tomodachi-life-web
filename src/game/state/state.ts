// Game state. Uses the engine's generic pub/sub store so that:
//   - The engine owns the store primitive.
//   - The game owns the shape of GameState and its updates.
//   - There is no framework dependency.
//
// All mutations go through `update()` so subscribers fire consistently.

import { createStore, Store, GameEvent, Tomodachi, GameTime } from '../../engine';
import { randomName } from '../content/names';
import { ArchetypeId } from '../content/archetypes';

export type { ArchetypeId } from '../content/archetypes';

/** Save schema version. Bump when GameState shape changes. */
export const GAME_SAVE_VERSION = 2;

/** Wish progress entry — bumped by player actions. */
export interface WishProgress {
  /** Generic counters keyed by event kind. */
  counts: Record<string, number>;
  /** Hint indexes that have been revealed (0..3). */
  hintsRevealed: number;
  /** When the wish was first seen. */
  startedAt: { day: number; hour: number; minute: number };
  /** Fulfilled at (if fulfilled). */
  fulfilledAt?: { day: number; hour: number; minute: number };
}

/** Per-tomodachi active wish state. */
export interface ActiveWishState {
  wishId: string;
  archetype: ArchetypeId;
  status: 'active' | 'discovered' | 'fulfilled' | 'failed';
  progress: WishProgress;
  /** Last bark said on fulfillment. */
  flavorBark?: string;
}

/** Structured memory record for a Tomodachi. */
export interface MemoryRecord {
  kind: 'visit' | 'talk' | 'gift' | 'feed' | 'companion' | 'observe';
  /** Free-form key, e.g. 'beach' or 'Mika' */
  key: string;
  at: { day: number; hour: number; minute: number; totalMinutes: number };
  note?: string;
}

export interface TomodachiExt {
  archetypeId?: ArchetypeId;
  wish?: ActiveWishState;
  /** Recent memory (newest first). */
  memory?: MemoryRecord[];
  /** Map of recent location visits, keyed by location id. */
  recentLocations?: Record<string, number>;
  /** Number of times the player has talked to this Tomodachi. */
  talkCount?: number;
  /** Number of times the player has fed this Tomodachi. */
  feedCount?: number;
  /** Per-partner affinity (0..100). Keyed by other Tomodachi id. */
  affinity?: Record<string, number>;
  /** Overworld position (used when location === 'overworld'). */
  worldX?: number;
  worldY?: number;
  /** Target the character is walking toward on the overworld. */
  worldTarget?: { x: number; y: number; enters?: 'apartment' | 'beach' | 'park' | 'cafe' | 'town' } | null;
  /** Last interior position, so re-entering an interior puts them back where they were. */
  lastInteriorX?: number;
}

export interface GameState {
  tomodachis: Tomodachi[];
  time: GameTime;
  /** The location the player is currently viewing. */
  currentLocation: string;
  /** The id of the currently selected/highlighted Tomodachi (HUD panel). */
  selectedId: string | null;
  /** Event log. Trimmed to the last N entries. */
  events: GameEvent[];
  /** Wall-clock time of game creation (for save metadata). */
  createdAt: number;
  /** Save schema version. */
  version: number;
  /** Hour (game-time) when schedule last updated. */
  lastScheduleTickHour: number;
}

const events: GameEvent[] = [];
const store: Store<GameState> = createStore<GameState>({
  tomodachis: [],
  time: { day: 1, hour: 8, minute: 0, totalMinutes: 8 * 60 },
  currentLocation: 'overworld',
  selectedId: null,
  events,
  createdAt: Date.now(),
  version: GAME_SAVE_VERSION,
  lastScheduleTickHour: 8,
});

/** Subscribe-free get for hot paths. */
export const game = {
  get: () => store.get(),
  set: (updater: (s: GameState) => GameState) => store.set(updater),
  subscribe: (fn: (s: GameState) => void) => store.subscribe(fn),
};

/** Build the initial empty state. */
export function makeInitialState(): GameState {
  return {
    tomodachis: [],
    time: { day: 1, hour: 8, minute: 0, totalMinutes: 8 * 60 },
    currentLocation: 'overworld',
    selectedId: null,
    events: [],
    createdAt: Date.now(),
    version: GAME_SAVE_VERSION,
    lastScheduleTickHour: 8,
  };
}

/** Create a default Tomodachi. */
export function createTomodachi(
  opts: Partial<Tomodachi> & { name?: string; archetypeId?: ArchetypeId } = {}
): Tomodachi {
  const id = opts.id ?? crypto.randomUUID();
  const name = opts.name ?? randomName();
  const personality = opts.personality ?? {
    openness: 5 + Math.floor(Math.random() * 5),
    conscientiousness: 4 + Math.floor(Math.random() * 6),
    extraversion: 4 + Math.floor(Math.random() * 6),
    agreeableness: 5 + Math.floor(Math.random() * 5),
    neuroticism: 2 + Math.floor(Math.random() * 6),
  };
  return {
    id,
    name,
    parts: opts.parts ?? {
      head: 0, eyes: 0, mouth: 0, hair: 0,
      body: 0, outfit: 0, accessory: 0,
    },
    colors: opts.colors ?? {
      skin: Math.floor(Math.random() * 8),
      hair: Math.floor(Math.random() * 12),
      primary: Math.floor(Math.random() * 12),
      secondary: Math.floor(Math.random() * 6),
    },
    personality,
    mood: 'neutral',
    needs: { hunger: 8, happiness: 7, energy: 8, social: 6 },
    location: opts.location ?? 'apartment',
    x: 200 + Math.random() * 80,
    homeX: 240,
    y: 240,
    vx: 0,
    facing: 1,
    state: 'idle',
    stateTime: 0,
    blinkTimer: 2 + Math.random() * 3,
    walkPhase: 0,
    lastBarkTime: 0,
    lastBarkIndex: -1,
    createdAt: Date.now(),
  };
}

/** Add a Tomodachi to the roster. */
export function addTomodachi(t: Tomodachi): void {
  game.set((s) => ({ ...s, tomodachis: [...s.tomodachis, t] }));
}

/** Remove a Tomodachi by id. */
export function removeTomodachi(id: string): void {
  game.set((s) => ({ ...s, tomodachis: s.tomodachis.filter((t) => t.id !== id) }));
}

/** Patch a Tomodachi. */
export function updateTomodachi(id: string, patch: Partial<Tomodachi>): void {
  game.set((s) => ({
    ...s,
    tomodachis: s.tomodachis.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }));
}

/** Set the currently viewed location. */
export function setLocation(loc: string): void {
  game.set((s) => ({ ...s, currentLocation: loc }));
}

/** Set the clock. */
export function setTime(t: GameTime): void {
  game.set((s) => ({ ...s, time: t }));
}

/** Set the selected Tomodachi. */
export function setSelected(id: string | null): void {
  game.set((s) => ({ ...s, selectedId: id }));
}

/** Push an event to the rolling log. Trims to 200. */
export function pushEvent(ev: GameEvent): void {
  game.set((s) => {
    // Reuse the same backing array so external references stay live.
    s.events.push(ev);
    if (s.events.length > 200) s.events.splice(0, s.events.length - 200);
    return { ...s };
  });
}

/** Reset the entire state to a clean default. Does NOT touch storage. */
export function resetGame(): void {
  game.set(() => makeInitialState());
}

/** Replace the whole state. Used by save/load. */
export function replaceState(next: GameState): void {
  // If the incoming events array is empty, keep ours so the log stays live.
  if (next.events.length === 0) next.events = game.get().events;
  game.set(() => next);
}
