// Idle AI behavior. Each Tomodachi:
//   - has a state (idle, walking, talking, sleeping, eating, sitting)
//   - picks a new state occasionally
//   - walks between home position and a random offset
//   - occasionally barks (random mood/contextual line)
//
// Scripted AI only. Player dialogue goes through the LLM (opt-in) in
// game/ui/dialogue.ts.

import { Tomodachi, TomodachiState, timeContext } from '../../engine';
import { game, updateTomodachi, pushEvent } from '../state/state';
import { pickBark, BarkContext } from '../content/barks';
import { dominantMood } from '../../engine';
import { tickSchedule } from './schedule';
import { tickWishes } from './wishes';
import { tickRelationships } from './relationships';
import { tickOverworld } from './overworld';
import { TomodachiInternal } from './types';

const MIN_STATE_DURATION_S = 2;
const MAX_STATE_DURATION_S = 8;
const BARK_MIN_INTERVAL_S = 6;
const BARK_MAX_INTERVAL_S = 18;
const WALK_SPEED = 20; // pixels per second

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickNewState(t: Tomodachi): TomodachiState {
  const tired = t.needs.energy < 3;
  const hungry = t.needs.hunger < 4;
  const social = t.needs.social < 3;
  const intro = t.personality.extraversion < 4;

  const options: TomodachiState[] = ['idle', 'walking'];
  if (tired) options.push('sleeping');
  if (hungry) options.push('eating');
  if (!intro && t.personality.extraversion >= 6 && Math.random() < 0.3) options.push('talking');
  if (intro && Math.random() < 0.2) options.push('sitting');

  return options[Math.floor(Math.random() * options.length)];
}

/** Per-tick: advance timers, state transitions, walking, blinking, mood. */
export function tickBehavior(): void {
  const now = game.get().time;
  // Schedule tick: only when the hour actually changes (uses game state's lastScheduleTickHour)
  const lastHour = game.get().lastScheduleTickHour;
  if (lastHour !== now.hour) {
    const prev: typeof now = { ...now, hour: lastHour };
    tickSchedule(prev, now);
  }
  tickWishes(now);
  // Per-tick: relationships
  tickRelationships();

  const dt = 16 / 1000;
  for (const t of game.get().tomodachis) {
    // Overworld characters walk toward their world target (set by schedule
    // ticks, the player "Send to" action, or a free click on the map).
    // tickOverworld handles its own state, position, and auto-entry into
    // a building on arrival.
    if (t.location === 'overworld') {
      tickOverworld(t, dt);
      continue;
    }

    const next: Tomodachi = { ...t };
    next.stateTime += dt;

    if (next.state === 'walking') {
      next.walkPhase += 0.2;
      const offset = Math.sin(next.walkPhase * 0.1) * 40;
      const desired = next.homeX + offset;
      const dx = desired - next.x;
      if (Math.abs(dx) < 0.5) {
        next.x = desired;
        next.vx = 0;
      } else {
        next.vx = Math.sign(dx) * WALK_SPEED;
        next.x += next.vx * dt;
        next.facing = dx > 0 ? 1 : -1;
      }
    } else if (next.state === 'eating') {
      if (next.stateTime > 4) { next.state = 'idle'; next.stateTime = 0; }
    } else if (next.state === 'sleeping') {
      if (next.stateTime > 8) { next.state = 'idle'; next.stateTime = 0; }
    } else if (next.state === 'talking') {
      if (next.stateTime > 3) { next.state = 'idle'; next.stateTime = 0; }
    }

    if (next.stateTime > rand(MIN_STATE_DURATION_S, MAX_STATE_DURATION_S)) {
      const ns = pickNewState(next);
      next.state = ns;
      next.stateTime = 0;
    }

    next.blinkTimer -= dt;
    if (next.blinkTimer < 0) next.blinkTimer = rand(2, 5);

    // Mood update
    const m = dominantMood(next);
    if (m !== next.mood) next.mood = m;

    updateTomodachi(next.id, next);
  }
}

/** Try to fire a bark for each Tomodachi, based on interval. */
export function tryBark(): void {
  const now = game.get().time.totalMinutes;
  for (const t of game.get().tomodachis) {
    const interval = rand(BARK_MIN_INTERVAL_S, BARK_MAX_INTERVAL_S);
    if (now - t.lastBarkTime < interval) continue;
    if (t.state === 'sleeping' || t.state === 'eating') continue;
    const contexts = contextFor(t);
    const text = pickBark(contexts);
    t.lastBarkTime = now;
    pushEvent({
      time: now,
      day: game.get().time.day,
      kind: 'bark',
      text,
      tomodachiId: t.id,
    });
    // Fire the speech bubble via window event (HUD subscribes).
    window.dispatchEvent(new CustomEvent('tomo:bark', { detail: { t, text } }));
  }
}

export function contextFor(t: Tomodachi): BarkContext[] {
  const out: BarkContext[] = ['idle'];
  // location & state are in the BarkContext union
  if (['apartment', 'beach', 'park', 'cafe', 'town'].includes(t.location)) {
    out.push(t.location as BarkContext);
  }
  if (['idle', 'walking', 'talking', 'sleeping', 'eating', 'sitting'].includes(t.state)) {
    out.push(t.state as BarkContext);
  }
  if (t.mood === 'happy' || t.mood === 'excited') out.push('happy');
  if (t.mood === 'sad') out.push('sad');
  if (t.mood === 'hungry') out.push('hungry');
  if (t.mood === 'sleepy') out.push('sleepy');
  const hour = game.get().time.hour;
  const tc = timeContext(hour);
  out.push(tc);
  return out;
}
