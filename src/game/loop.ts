// Main game loop. Single requestAnimationFrame driver. Each tick:
// 1. advance time
// 2. update AI (behavior, needs decay, barks)
// 3. update LLM (process any active stream)
// 4. update render (scene + UI)

import { game } from './state/state';
import { startClock, tickTime, update as updateScene } from '../engine';
import { tickBehavior, tryBark } from './play/behavior';
import { needsTick } from './play/needs';
import { updateUI } from './ui/hud';

let raf = 0;
let running = false;
let clock: ReturnType<typeof startClock> | null = null;

/** Set the time-source clock. Call once when the game starts. */
export function setLoopClock(c: ReturnType<typeof startClock>): void {
  clock = c;
}

export function startLoop(): void {
  if (running) return;
  if (!clock) clock = startClock(game.get().time.totalMinutes);
  running = true;
  const loop = () => {
    if (!running || !clock) return;
    const next = tickTime(clock);
    game.set((s) => ({ ...s, time: next }));
    needsTick();
    tickBehavior();
    tryBark();
    updateScene();
    updateUI();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

export function stopLoop(): void {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}
