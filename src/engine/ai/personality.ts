// Personality trait helpers. Maps numeric traits (0-10) to short descriptive
// phrases used in system prompts and bark filtering.

import { TomodachiPersonality } from '../core/types';

export type Trait = keyof TomodachiPersonality;

export const TRAIT_LABELS: Record<Trait, string> = {
  openness: 'curious/imaginative',
  conscientiousness: 'organized/cautious',
  extraversion: 'outgoing/energetic',
  agreeableness: 'kind/cooperative',
  neuroticism: 'anxious/sensitive',
};

export const TRAIT_SHORT: Record<Trait, string> = {
  openness: 'openness',
  conscientiousness: 'conscientiousness',
  extraversion: 'extraversion',
  agreeableness: 'agreeableness',
  neuroticism: 'neuroticism',
};

export function traitLevel(value: number): 'low' | 'medium' | 'high' {
  if (value < 4) return 'low';
  if (value < 7) return 'medium';
  return 'high';
}

export function describePersonality(p: TomodachiPersonality): string {
  return Object.entries(p)
    .map(([k, v]) => `${TRAIT_LABELS[k as Trait]}: ${traitLevel(v)}`)
    .join(', ');
}

export function shortPersonality(p: TomodachiPersonality): string {
  const parts: string[] = [];
  if (p.extraversion >= 7) parts.push('outgoing');
  else if (p.extraversion <= 3) parts.push('quiet');
  if (p.agreeableness >= 7) parts.push('kind');
  else if (p.agreeableness <= 3) parts.push('blunt');
  if (p.openness >= 7) parts.push('curious');
  else if (p.openness <= 3) parts.push('practical');
  if (p.conscientiousness >= 7) parts.push('reliable');
  else if (p.conscientiousness <= 3) parts.push('spontaneous');
  if (p.neuroticism >= 7) parts.push('anxious');
  else if (p.neuroticism <= 3) parts.push('calm');
  if (parts.length === 0) parts.push('average');
  return 'a ' + parts.join(', ') + ' person';
}
