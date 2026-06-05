// Mood calculation. Combines needs, personality, and recent events into a
// single dominant mood for filtering barks and shaping LLM behavior.

import { Mood, Tomodachi, TomodachiNeeds } from '../core/types';

export function dominantMood(t: Tomodachi): Mood {
  const n = t.needs;
  if (n.energy <= 2) return 'sleepy';
  if (n.hunger <= 3) return 'hungry';
  if (n.happiness <= 3) return 'sad';
  if (n.social <= 3 && t.personality.extraversion >= 6) return 'sad';

  if (n.happiness >= 8 && n.energy >= 6) return t.personality.extraversion >= 6 ? 'excited' : 'happy';
  if (n.happiness <= 5) return 'sad';

  return t.mood;
}

export function moodDescriptor(m: Mood): string {
  switch (m) {
    case 'happy': return 'feeling cheerful';
    case 'sad': return 'a bit down';
    case 'angry': return 'annoyed';
    case 'sleepy': return 'drowsy';
    case 'hungry': return 'hungry';
    case 'excited': return 'pumped up';
    case 'neutral':
    default: return 'just kinda there';
  }
}

export function needsSummary(n: TomodachiNeeds): string {
  return `hunger ${n.hunger}/10, happiness ${n.happiness}/10, energy ${n.energy}/10, social ${n.social}/10`;
}
