// Time progression. Pure functions. The host owns the clock state and
// decides how to plumb the derived GameTime into its state.

import { GameTime } from './types';

export const TIME_SCALE = 1; // 1 real minute = 1 game minute
export const MIN_PER_GAME_DAY = 24 * 60;
export const START_GAME_MIN = 8 * 60; // 8:00 AM on day 1

export interface GameClock {
  startReal: number;
  startGameMin: number;
}

/** Begin a new clock anchored to performance.now() at the given in-game minute. */
export function startClock(initialGameMin: number = START_GAME_MIN): GameClock {
  return { startReal: performance.now(), startGameMin: initialGameMin };
}

/** Derive the current GameTime from a clock and the current real-time now(). */
export function tickTime(clock: GameClock, now: number = performance.now()): GameTime {
  const realMs = now - clock.startReal;
  const gameMinElapsed = (realMs / 60_000) * TIME_SCALE;
  const total = clock.startGameMin + gameMinElapsed;
  return deriveTime(total);
}

/** Convert raw total in-game minutes into a GameTime struct. */
export function deriveTime(totalMinutes: number): GameTime {
  const dayLen = MIN_PER_GAME_DAY;
  const safe = Math.max(0, totalMinutes);
  const day = 1 + Math.floor(safe / dayLen);
  const rem = safe - Math.floor(safe / dayLen) * dayLen;
  const hour = Math.floor(rem / 60);
  const minute = Math.floor(rem % 60);
  return { day, hour, minute, totalMinutes: safe };
}

export function isNight(hour: number): boolean {
  return hour < 6 || hour >= 20;
}

export type TimeContext = 'morning' | 'day' | 'evening' | 'night';

export function timeContext(hour: number): TimeContext {
  if (hour < 6) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 17) return 'day';
  if (hour < 20) return 'evening';
  return 'night';
}
