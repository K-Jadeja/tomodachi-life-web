// Shared engine types. Dependency-free.
//
// These are the public types any host game can use to describe its world:
// Tomodachis (characters), needs, mood, locations, time, events, dialogue.

export type Mood = 'happy' | 'sad' | 'angry' | 'sleepy' | 'hungry' | 'neutral' | 'excited';

export type PartKey = 'head' | 'eyes' | 'mouth' | 'hair' | 'body' | 'outfit' | 'accessory';

export interface TomodachiParts {
  head: number;
  eyes: number;
  mouth: number;
  hair: number;
  body: number;
  outfit: number;
  accessory: number; // 0 = none
}

export interface TomodachiColors {
  skin: number;     // index into SKIN_COLORS
  hair: number;     // index into HAIR_COLORS
  primary: number;  // index into OUTFIT_COLORS
  secondary: number; // index into ACCENT_COLORS
}

export interface TomodachiPersonality {
  openness: number;       // 0-10  curious vs down-to-earth
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface TomodachiNeeds {
  hunger: number;     // 0-10, 10 = full
  happiness: number;  // 0-10
  energy: number;     // 0-10
  social: number;     // 0-10
}

export type TomodachiState =
  | 'idle'
  | 'walking'
  | 'talking'
  | 'sleeping'
  | 'eating'
  | 'sitting';

export interface Tomodachi {
  id: string;
  name: string;
  parts: TomodachiParts;
  colors: TomodachiColors;
  personality: TomodachiPersonality;
  mood: Mood;
  needs: TomodachiNeeds;
  location: string;     // free-form location id
  x: number;        // x in scene pixels (0..480)
  homeX: number;    // resting x position
  y: number;        // ground y in scene pixels
  vx: number;       // current velocity
  facing: 1 | -1;
  state: TomodachiState;
  stateTime: number;
  blinkTimer: number;
  walkPhase: number;
  lastBarkTime: number;
  lastBarkIndex: number;
  createdAt: number;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  totalMinutes: number;
}

export interface GameEvent {
  time: number;
  day: number;
  kind: 'bark' | 'talk' | 'state' | 'thought' | 'system';
  text: string;
  tomodachiId?: string;
}

/** TTS voice picked from the browser, cached for the session. */
export interface TtsVoice {
  voice: SpeechSynthesisVoice;
  pitch: number;       // 1.0-1.7 for Mii feel
  rate: number;
}

/** Active dialogue being shown. */
export interface ActiveDialogue {
  tomodachiId: string;
  text: string;
  streaming: boolean;
  source: 'bark' | 'llm';
  expiresAt: number;
}
