// Eye variants — drawn as ellipses with black pupil + white highlight.

import { Graphics } from 'pixi.js';

export type EyeState = 0 | 1 | 2; // 0=open, 1=half, 2=closed
export type EyeStyle = 0 | 1 | 2 | 3 | 4;

interface EyeSpec {
  openW: number;
  openH: number;
  pupilScale: number;
  highlightDx: number;
  highlightDy: number;
  highlightR: number;
  name: string;
}

const EYE_SPECS: EyeSpec[] = [
  { openW: 4, openH: 5, pupilScale: 0.7, highlightDx: -0.8, highlightDy: -1, highlightR: 0.9, name: 'round' },
  { openW: 3.5, openH: 4.5, pupilScale: 0.7, highlightDx: -0.6, highlightDy: -0.8, highlightR: 0.8, name: 'dot' },
  { openW: 5, openH: 5, pupilScale: 0.65, highlightDx: -1, highlightDy: -1, highlightR: 1, name: 'big' },
  { openW: 4.5, openH: 3.5, pupilScale: 0.7, highlightDx: -0.8, highlightDy: -0.5, highlightR: 0.9, name: 'sleepy' },
  { openW: 4, openH: 4, pupilScale: 0.4, highlightDx: 0, highlightDy: 0, highlightR: 0, name: 'o' },
];

export function drawEye(
  style: EyeStyle,
  g: Graphics,
  cx: number,
  cy: number,
  state: EyeState,
  t: { white: number; pupil: number; skin: number; outline: number; hair: number; primary: number; secondary: number; cheek: number }
): void {
  const spec = EYE_SPECS[style] ?? EYE_SPECS[0];

  if (state === 2) {
    g.moveTo(cx - spec.openW / 2, cy);
    g.quadraticCurveTo(cx, cy + 1.5, cx + spec.openW / 2, cy);
    g.stroke({ color: t.outline, width: 1 });
    return;
  }

  const w = spec.openW;
  const h = state === 1 ? spec.openH * 0.4 : spec.openH;

  g.ellipse(cx, cy, w / 2, h / 2).fill(t.white);

  if (style === 4) {
    g.ellipse(cx, cy, w * 0.2, h * 0.3).fill(t.pupil);
    return;
  }

  const pw = w * spec.pupilScale;
  const ph = h * spec.pupilScale;
  g.ellipse(cx, cy + 0.5, pw / 2, ph / 2).fill(t.pupil);

  if (spec.highlightR > 0) {
    g.ellipse(
      cx + spec.highlightDx,
      cy + spec.highlightDy,
      spec.highlightR, spec.highlightR
    ).fill(t.white);
  }

  if (state === 0) {
    g.ellipse(cx, cy + h / 2 - 0.3, w / 2 - 0.3, 0.5)
      .fill({ color: t.outline, alpha: 0.2 });
  }
}

export const EYE_VARIANTS = EYE_SPECS.length;
