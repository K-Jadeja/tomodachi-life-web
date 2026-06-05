// Archetype definitions. Each archetype is a personality "preset" that
// shapes where a Tomodachi likes to be, what barks it gets, and which
// wish it gets assigned.

import { TomodachiPersonality } from '../../engine';
import { GameLocationId } from './locations';

export type ArchetypeId =
  | 'loner'
  | 'performer'
  | 'foodie'
  | 'scholar'
  | 'adventurer'
  | 'romantic';

export interface Archetype {
  id: ArchetypeId;
  name: string;
  /** Default OCEAN trait defaults (each 1-10). */
  defaultPersonality: TomodachiPersonality;
  /** Locations this archetype gravitates toward. */
  preferredLocations: GameLocationId[];
  /** Description for the info panel. */
  blurb: string;
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  loner: {
    id: 'loner',
    name: 'Loner',
    defaultPersonality: { openness: 4, conscientiousness: 7, extraversion: 2, agreeableness: 5, neuroticism: 6 },
    preferredLocations: ['apartment', 'park'],
    blurb: 'Quiet, thoughtful, and a little anxious. Likes the apartment best.',
  },
  performer: {
    id: 'performer',
    name: 'Performer',
    defaultPersonality: { openness: 8, conscientiousness: 4, extraversion: 9, agreeableness: 6, neuroticism: 4 },
    preferredLocations: ['town', 'cafe'],
    blurb: 'Outgoing, dramatic, and loud. Lives for the spotlight.',
  },
  foodie: {
    id: 'foodie',
    name: 'Foodie',
    defaultPersonality: { openness: 7, conscientiousness: 5, extraversion: 5, agreeableness: 7, neuroticism: 3 },
    preferredLocations: ['cafe', 'town'],
    blurb: 'Always hungry, always curious about new flavors.',
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    defaultPersonality: { openness: 9, conscientiousness: 8, extraversion: 3, agreeableness: 6, neuroticism: 5 },
    preferredLocations: ['apartment', 'park'],
    blurb: 'Reads everything. Asks lots of questions.',
  },
  adventurer: {
    id: 'adventurer',
    name: 'Adventurer',
    defaultPersonality: { openness: 8, conscientiousness: 5, extraversion: 7, agreeableness: 5, neuroticism: 3 },
    preferredLocations: ['beach', 'park', 'town'],
    blurb: 'Restless, curious, and always up for something new.',
  },
  romantic: {
    id: 'romantic',
    name: 'Romantic',
    defaultPersonality: { openness: 7, conscientiousness: 5, extraversion: 5, agreeableness: 9, neuroticism: 6 },
    preferredLocations: ['beach', 'park', 'cafe'],
    blurb: 'Soft-hearted, sentimental, and easily moved.',
  },
};

export function archetypeById(id: ArchetypeId): Archetype {
  return ARCHETYPES[id];
}
