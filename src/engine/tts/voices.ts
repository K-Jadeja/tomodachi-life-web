// TTS voice picker. Chrome loads voices asynchronously; we expose a promise
// that resolves once voices are available.

export interface VoiceChoice {
  voice: SpeechSynthesisVoice;
  pitch: number;
  rate: number;
  label: string;
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const existing = speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const handler = () => {
      const v = speechSynthesis.getVoices();
      if (v.length > 0) {
        speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(v);
      }
    };
    speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      const v = speechSynthesis.getVoices();
      if (v.length > 0) resolve(v);
      else resolve([]);
    }, 1500);
  });
  return voicesPromise;
}

export async function pickDefaultVoice(): Promise<VoiceChoice | null> {
  const voices = await getVoices();
  if (voices.length === 0) return null;
  const preferred =
    voices.find((v) => /Google US English/i.test(v.name)) ||
    voices.find((v) => /Google UK English Female/i.test(v.name)) ||
    voices.find((v) => /Microsoft.*(David|Mark|Aria|Jenny)/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0];
  return {
    voice: preferred,
    pitch: 1.4,
    rate: 1.05,
    label: preferred.name,
  };
}

export function pitchForTomo(seed: number): number {
  return 1.2 + (Math.abs(Math.sin(seed * 12.9898)) % 1) * 0.5;
}

export function speak(
  text: string,
  voice: VoiceChoice | null,
  onEnd?: () => void,
  onStart?: () => void
): void {
  if (!text.trim()) {
    onEnd?.();
    return;
  }
  try {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (voice) {
      utt.voice = voice.voice;
      utt.pitch = voice.pitch;
      utt.rate = voice.rate;
    } else {
      utt.pitch = 1.4;
      utt.rate = 1.05;
    }
    utt.onstart = () => onStart?.();
    utt.onend = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    speechSynthesis.speak(utt);
  } catch (e) {
    console.warn('[tts] failed', e);
    onEnd?.();
  }
}

export function cancelSpeak(): void {
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
}
