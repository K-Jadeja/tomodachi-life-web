// Day/night overlay tint. We use a single fullscreen Graphics with a color
// whose alpha depends on the time of day.

import { Graphics } from 'pixi.js';

export function dayNightAlpha(hour: number): number {
  // 0 = full day (no tint), 1 = full night.
  if (hour < 6) return 0.65;
  if (hour < 8) return 0.4;
  if (hour < 18) return 0.0;
  if (hour < 20) return 0.25;
  return 0.55;
}

export function dayNightColor(hour: number): number {
  if (hour < 6 || hour >= 20) return 0x1a1f4a; // deep night
  if (hour < 8) return 0x4a3a5a; // dawn
  if (hour < 18) return 0xffffff; // day (no tint)
  return 0x6a3a3a; // sunset
}

export function applyDayNight(g: Graphics, hour: number): void {
  g.clear();
  const alpha = dayNightAlpha(hour);
  if (alpha <= 0) return;
  g.rect(0, 0, 480, 270).fill({ color: dayNightColor(hour), alpha });
}
