// Procedural SFX via Web Audio API. Tiny sounds for clicks, barks, etc.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

export function unlockAudio(): void {
  // Some browsers need a user gesture before AudioContext can play.
  const c = getCtx();
  if (c && c.state === 'suspended') {
    c.resume().catch(() => { /* ignore */ });
  }
}

function tone(
  freq: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  gain = 0.06,
  attack = 5,
  release = 30
): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + attack / 1000);
  g.gain.linearRampToValueAtTime(0, c.currentTime + (attack + durationMs + release) / 1000);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + (attack + durationMs + release) / 1000);
}

export function sfxClick(): void { tone(880, 40, 'square', 0.04); }
export function sfxSelect(): void { tone(660, 80, 'sine', 0.05); }
export function sfxBark(): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(420, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(280, c.currentTime + 0.18);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.22);
}
export function sfxLoad(): void { tone(440, 80, 'sine', 0.05); tone(660, 80, 'sine', 0.05, 60); }
export function sfxDone(): void {
  tone(523, 80, 'sine', 0.05);
  tone(659, 80, 'sine', 0.05, 60);
  tone(784, 120, 'sine', 0.05, 120);
}
