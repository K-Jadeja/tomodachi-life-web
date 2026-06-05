// Head variants. Drawn as ellipses with subtle shape variations.

import { Container, Graphics } from 'pixi.js';

export type HeadStyle = 0 | 1 | 2 | 3 | 4 | 5;

interface HeadSpec {
  rx: number;
  ry: number;
  chinPull: number;
  highlightX: number;
  highlightY: number;
}

const HEADS: HeadSpec[] = [
  { rx: 14, ry: 14, chinPull: 0, highlightX: -0.35, highlightY: -0.4 },
  { rx: 14, ry: 14, chinPull: -0.15, highlightX: -0.35, highlightY: -0.4 },
  { rx: 14, ry: 14, chinPull: 0.2, highlightX: -0.3, highlightY: -0.5 },
  { rx: 12, ry: 15, chinPull: 0, highlightX: -0.3, highlightY: -0.4 },
  { rx: 15, ry: 13, chinPull: 0, highlightX: -0.3, highlightY: -0.4 },
  { rx: 13, ry: 14, chinPull: 0.1, highlightX: -0.35, highlightY: -0.4 },
];

/** Draw the head shape onto a Container at the standard position. */
export function drawHead(
  style: HeadStyle,
  g: Container,
  t: { skin: number; skinDark: number; white: number; outline: number; pupil: number; cheek: number }
): void {
  const spec = HEADS[style] ?? HEADS[0];
  const cx = 20;
  const cy = 18;
  const headG = new Graphics();

  // Cheek blush (behind head, pokes out)
  headG.ellipse(cx - 8, cy + 3, 2.5, 1.5).fill({ color: t.cheek, alpha: 0.6 });
  headG.ellipse(cx + 8, cy + 3, 2.5, 1.5).fill({ color: t.cheek, alpha: 0.6 });

  // Main head shape
  headG.ellipse(cx, cy, spec.rx, spec.ry).fill(t.skin);

  // Right side shadow (fake 3D)
  headG.ellipse(cx + 4, cy, spec.rx * 0.6, spec.ry * 0.9)
    .fill({ color: t.skinDark, alpha: 0.35 });

  // Top-left highlight (skin glow)
  headG.ellipse(
    cx + spec.highlightX * spec.rx,
    cy + spec.highlightY * spec.ry,
    spec.rx * 0.4, spec.ry * 0.3
  ).fill({ color: t.white, alpha: 0.25 });

  // Tiny nose dot (subtle)
  headG.ellipse(cx, cy + 5, 0.8, 0.6).fill(t.skinDark);

  g.addChild(headG);
}

export const HEAD_VARIANTS = HEADS.length;
export const HEAD_WIDTH = 28;
export const HEAD_HEIGHT = 28;
