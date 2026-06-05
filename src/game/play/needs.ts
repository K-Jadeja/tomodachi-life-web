// Need decay and player actions. The engine doesn't know about needs; we
// own the rate-of-decay table here.
//
// Each tick (assume ~16ms real), we advance a small number of game-minutes
// and decay accordingly. Players can also adjust needs via Feed / Nap / Talk.

import { Tomodachi, TomodachiNeeds, isNight } from '../../engine';
import { game, updateTomodachi } from '../state/state';
import { TomodachiInternal } from './types';

const clamp = (v: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, v));

/** Per game-minute decay rates. */
const RATES = {
  hunger: 0.012,
  happiness: 0.005,
  social: 0.008,
  energyDay: 0.015,
  energyNight: 0.04,
};

/** Pure: given a Tomodachi and elapsed game minutes, return decayed needs. */
export function decayNeeds(t: Tomodachi, dtGameMin: number): TomodachiNeeds {
  const night = isNight(game.get().time.hour);
  const energyRate = night ? RATES.energyNight : RATES.energyDay;
  return {
    hunger: clamp(t.needs.hunger - dtGameMin * RATES.hunger),
    happiness: clamp(t.needs.happiness - dtGameMin * RATES.happiness),
    energy: clamp(t.needs.energy - dtGameMin * energyRate),
    social: clamp(t.needs.social - dtGameMin * RATES.social),
  };
}

export function adjustNeed(t: Tomodachi, key: keyof TomodachiNeeds, delta: number): void {
  const cur = t.needs[key];
  const next = clamp(cur + delta);
  updateTomodachi(t.id, { needs: { ...t.needs, [key]: next } });
}

/** Per-tick: apply decay to all Tomodachis. */
export function needsTick(): void {
  // 16ms real ≈ 16 game-minutes if TIME_SCALE = 60. We use 1/60 to get
  // roughly 0.27 game-min per tick — slow enough to not be aggressive.
  const dtMin = 16 / 1000; // 1ms of real ≈ 0.001 game-min
  for (const t of game.get().tomodachis) {
    const next = decayNeeds(t, dtMin);
    updateTomodachi(t.id, { needs: next });
  }
}

/** Feed: bumps hunger + happiness, sets state to 'eating'. */
export function feed(t: Tomodachi): void {
  adjustNeed(t, 'hunger', 6);
  adjustNeed(t, 'happiness', 1);
  updateTomodachi(t.id, { state: 'eating', stateTime: 0 });
  // Bump feedCount for the wish engine.
  const ext = t as TomodachiInternal;
  updateTomodachi(t.id, { feedCount: (ext.feedCount ?? 0) + 1 } as Partial<Tomodachi>);
}

/** Nap: bumps energy + happiness, sets state to 'sleeping'. */
export function nap(t: Tomodachi): void {
  adjustNeed(t, 'energy', 6);
  adjustNeed(t, 'happiness', 0.5);
  updateTomodachi(t.id, { state: 'sleeping', stateTime: 0 });
}

/** Talk: bumps social + happiness. */
export function socialize(t: Tomodachi, intensity = 1): void {
  adjustNeed(t, 'social', 3 * intensity);
  adjustNeed(t, 'happiness', 1 * intensity);
}
