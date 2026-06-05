// TTS coordinator. Maps a Tomodachi → voice + pitch. Provides high-level
// `speakForTomo()` that handles the voice pick automatically.

import { Tomodachi } from '../core/types';
import { pickDefaultVoice, speak, VoiceChoice, pitchForTomo, cancelSpeak } from './voices';

const voiceCache = new Map<string, VoiceChoice>();
let defaultVoice: VoiceChoice | null = null;

export async function warmTts(): Promise<void> {
  if (!defaultVoice) {
    defaultVoice = await pickDefaultVoice();
  }
}

export async function speakForTomo(
  t: Tomodachi,
  text: string,
  onEnd?: () => void,
  onStart?: () => void
): Promise<void> {
  if (!defaultVoice) {
    defaultVoice = await pickDefaultVoice();
  }
  let v = voiceCache.get(t.id);
  if (!v && defaultVoice) {
    v = { ...defaultVoice, pitch: pitchForTomo(hashString(t.id)) };
    voiceCache.set(t.id, v);
  }
  speak(text, v ?? defaultVoice, onEnd, onStart);
}

export function stopSpeaking(): void {
  cancelSpeak();
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
