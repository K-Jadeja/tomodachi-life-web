// System prompt construction. Builds a compact character briefing for the LLM
// from a Tomodachi's personality, needs, mood, location, and recent events.
//
// All content (greetings, farewells, style guide) is passed in via
// DialoguePromptConfig — the engine never imports host data.

import { Tomodachi } from '../core/types';
import { describePersonality, shortPersonality } from '../ai/personality';
import { moodDescriptor, needsSummary } from '../ai/mood';
import { recentEventsFor, recentAll } from '../core/events';

export interface DialogueTurn {
  role: 'user' | 'model';
  text: string;
}

export interface DialogueContext {
  time: { day: number; hour: number; minute: number; totalMinutes: number };
  timeContext: string;
}

export interface DialoguePromptConfig {
  /** Get current time / context. */
  context: () => DialogueContext;
  /** Recent events for a given tomodachi (override; defaults to engine's recentEventsFor). */
  recentEvents?: (tomodachiId: string, n?: number) => Array<{ text: string }>;
  /** Recent events globally (override; defaults to engine's recentAll). */
  recentAll?: (n?: number) => Array<{ text: string }>;
  /** Style guide lines that shape the model's voice. */
  styleGuide: string[];
  /** Sample greetings for the model to use as tonal reference. */
  sampleGreetings: string[];
  /** Sample farewells. */
  sampleFarewells: string[];
}

export function buildSystemPrompt(t: Tomodachi, config: DialoguePromptConfig): string {
  const ctx = config.context();
  const recentFn = config.recentEvents ?? ((id: string, n: number) =>
    recentEventsFor(id, n).map((e) => ({ text: e.text })));
  const allFn = config.recentAll ?? ((n: number) =>
    recentAll(n).map((e) => ({ text: e.text })));
  const recent = recentFn(t.id, 4).map((e) => `- ${e.text}`).join('\n') || '— (nothing recent)';
  const allRecent = allFn(6).map((e) => `- ${e.text}`).join('\n') || '—';

  return `You are roleplaying as ${t.name}, ${shortPersonality(t.personality)}.

Personality: ${describePersonality(t.personality)}.
Current mood: ${t.mood} (${moodDescriptor(t.mood)}).
Needs: ${needsSummary(t.needs)}.
You are at the ${t.location} during the ${ctx.timeContext}.
Time: day ${ctx.time.day}, ${ctx.time.hour}:${String(ctx.time.minute).padStart(2, '0')}.

Recent things you said or did:
${recent}

Other things happening nearby:
${allRecent}

Tone guidance:
${config.styleGuide.join('\n')}

Example greetings you might use: ${config.sampleGreetings.slice(0, 3).join(' | ')}
Example farewells: ${config.sampleFarewells.slice(0, 2).join(' | ')}

Reply as ${t.name} in 1-2 short sentences. Do not break character. Do not include quotation marks or speaker labels.`;
}

export function buildFullPrompt(
  t: Tomodachi,
  history: DialogueTurn[],
  userMessage: string,
  config: DialoguePromptConfig
): string {
  const sys = buildSystemPrompt(t, config);
  const convo = history
    .map((h) => `${h.role === 'user' ? 'You' : t.name}: ${h.text}`)
    .join('\n');
  const convoBlock = convo ? `\n\nConversation so far:\n${convo}` : '';
  return `${sys}${convoBlock}\n\nYou: ${userMessage}\n${t.name}:`;
}
