// Wishes. Each archetype has a single hidden wish assigned at creation.
// The player discovers the wish by observing the Tomodachi and meeting
// conditions; fulfilling it grants a small permanent reward (a buff +
// a bark).

import { ArchetypeId } from './archetypes';
import { Tomodachi, TomodachiNeeds, GameTime } from '../../engine/core/types';

export interface WishContext {
  time: GameTime;
  needs: TomodachiNeeds;
  /** Map of recent location visits, keyed by location id. */
  recentLocations: Record<string, number>;
  /** Number of times the player has talked to this Tomodachi. */
  talkCount: number;
  /** Number of times the player has fed this Tomodachi. */
  feedCount: number;
}

export interface Wish {
  id: string;
  archetype: ArchetypeId;
  /** Shown after the wish is fully discovered. */
  title: string;
  /** A flavor hint shown pre-discovery. */
  hiddenTitle: string;
  /** 4 hints that unlock progressively. */
  hints: string[];
  /** Returns true if the wish should be fulfilled now. */
  fulfillTest: (t: Tomodachi, ctx: WishContext) => boolean;
  /** Bark spoken on fulfillment. */
  flavorBark: string;
  /** Small reward (a buff) applied to the Tomodachi's personality on fulfillment. */
  reward?: Partial<{ happiness: number; extraversion: number; openness: number }>;
}

const WISH_DEFS: Wish[] = [
  // Loner — wants a quiet day by themselves, then a real connection
  {
    id: 'loner-solitude-then-friend',
    archetype: 'loner',
    title: 'A Quiet Friend',
    hiddenTitle: '???',
    hints: [
      'They seem calmer in quiet places.',
      'They avoid big crowds, but talk to one close friend more than anyone.',
      'They brighten up after a long talk.',
      'A single heart-to-heart is what they really need.',
    ],
    fulfillTest: (_t, ctx) => ctx.talkCount >= 5 && ctx.needs.social >= 7,
    flavorBark: '…thanks for being there.',
    reward: { happiness: 1 },
  },
  // Performer — wants an audience
  {
    id: 'performer-showcase',
    archetype: 'performer',
    title: 'Standing Ovation',
    hiddenTitle: '???',
    hints: [
      'They talk a lot in busy places.',
      'They love being in the center of things.',
      'They are happiest when someone listens to them.',
      'What they really want is an audience.',
    ],
    fulfillTest: (_t, ctx) => ctx.talkCount >= 8 && ctx.recentLocations['town'] >= 2,
    flavorBark: 'Hey! Did you see that?!',
    reward: { happiness: 1, extraversion: 1 },
  },
  // Foodie — wants to try everything
  {
    id: 'foodie-tour',
    archetype: 'foodie',
    title: 'A Full Belly',
    hiddenTitle: '???',
    hints: [
      'They get grumpy when they are hungry.',
      'They keep going back to the café.',
      'Feeding them helps a lot.',
      'They just want a proper meal and good company.',
    ],
    fulfillTest: (_t, ctx) => ctx.feedCount >= 3 && ctx.needs.hunger >= 9,
    flavorBark: 'Mmm, that hit the spot!',
    reward: { happiness: 1 },
  },
  // Scholar — wants to learn something
  {
    id: 'scholar-curiosity',
    archetype: 'scholar',
    title: 'A New Idea',
    hiddenTitle: '???',
    hints: [
      'They like being at home, alone with a thought.',
      'They ask a lot of questions.',
      'They go quiet when they are tired.',
      'They want to learn something new today.',
    ],
    fulfillTest: (_t, ctx) => ctx.talkCount >= 4 && ctx.needs.energy >= 7,
    flavorBark: 'Oh! That\'s interesting!',
    reward: { openness: 1, happiness: 0.5 },
  },
  // Adventurer — wants to explore a new place
  {
    id: 'adventurer-visit-all',
    archetype: 'adventurer',
    title: 'Wanderer',
    hiddenTitle: '???',
    hints: [
      'They never stay in one place for long.',
      'They like the outdoors.',
      'They visit every spot on the island.',
      'What they want is to see it all.',
    ],
    fulfillTest: (_t, ctx) => {
      const locs = ['apartment', 'beach', 'park', 'cafe', 'town'] as const;
      return locs.every((l) => (ctx.recentLocations[l] ?? 0) >= 1);
    },
    flavorBark: 'Where to next?',
    reward: { happiness: 1, openness: 1 },
  },
  // Romantic — wants a meaningful moment
  {
    id: 'romantic-moment',
    archetype: 'romantic',
    title: 'A Real Moment',
    hiddenTitle: '???',
    hints: [
      'They like soft places with a view.',
      'They open up at sunset.',
      'They feel lonely late at night.',
      'A quiet moment with someone they trust is what they want.',
    ],
    fulfillTest: (_t, ctx) => {
      const hour = ctx.time.hour;
      return ctx.talkCount >= 3 && (hour >= 17 || hour < 6) && ctx.needs.social >= 6;
    },
    flavorBark: '…this is nice.',
    reward: { happiness: 1 },
  },
];

export const WISHES: ReadonlyArray<Wish> = WISH_DEFS;
export function wishById(id: string): Wish | null {
  return WISHES.find((w) => w.id === id) ?? null;
}
export function wishesForArchetype(id: ArchetypeId): Wish[] {
  return WISHES.filter((w) => w.archetype === id);
}
