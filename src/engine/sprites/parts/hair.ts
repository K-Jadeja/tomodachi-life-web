// Hair variants. Each is a stylized shape on top of the head.

import { Container, Graphics } from 'pixi.js';

export type HairStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function drawHair(
  style: HairStyle,
  g: Container,
  t: { hair: number; hairDark: number; outline: number; white: number }
): void {
  const cx = 20;
  const cy = 18;
  const hairG = new Graphics();

  switch (style) {
    case 0: {
      hairG.ellipse(cx, cy - 4, 14, 8).fill(t.hair);
      hairG.rect(cx - 14, cy - 1, 2, 5).fill(t.hair);
      hairG.rect(cx + 12, cy - 1, 2, 5).fill(t.hair);
      hairG.ellipse(cx - 4, cy - 7, 4, 2).fill({ color: t.white, alpha: 0.2 });
      break;
    }
    case 1: {
      hairG.ellipse(cx, cy - 2, 15, 12).fill(t.hair);
      hairG.ellipse(cx - 14, cy + 6, 4, 12).fill(t.hair);
      hairG.ellipse(cx + 14, cy + 6, 4, 12).fill(t.hair);
      hairG.ellipse(cx, cy - 5, 12, 5).fill(t.hair);
      hairG.ellipse(cx - 5, cy - 8, 4, 2).fill({ color: t.white, alpha: 0.2 });
      hairG.ellipse(cx - 14, cy + 9, 2, 8).fill(t.hairDark);
      hairG.ellipse(cx + 14, cy + 9, 2, 8).fill(t.hairDark);
      break;
    }
    case 2: {
      hairG.ellipse(cx, cy - 4, 14, 8).fill(t.hair);
      hairG.ellipse(cx + 8, cy + 10, 6, 14).fill(t.hair);
      hairG.ellipse(cx + 8, cy + 10, 6, 14).fill(t.hair);
      hairG.ellipse(cx + 9, cy + 14, 4, 10).fill(t.hairDark);
      hairG.ellipse(cx, cy - 5, 12, 4).fill(t.hair);
      hairG.ellipse(cx - 3, cy - 7, 4, 2).fill({ color: t.white, alpha: 0.2 });
      break;
    }
    case 3: {
      hairG.ellipse(cx, cy - 2, 15, 11).fill(t.hair);
      hairG.rect(cx - 13, cy - 2, 26, 5).fill(t.hair);
      hairG.rect(cx - 13, cy + 3, 26, 1).fill(t.hairDark);
      hairG.ellipse(cx - 4, cy - 8, 5, 2).fill({ color: t.white, alpha: 0.2 });
      break;
    }
    case 4: {
      hairG.ellipse(cx - 4, cy - 6, 6, 5).fill(t.hair);
      hairG.ellipse(cx + 4, cy - 8, 6, 5).fill(t.hair);
      hairG.ellipse(cx, cy - 10, 5, 4).fill(t.hair);
      hairG.ellipse(cx - 9, cy - 3, 5, 4).fill(t.hair);
      hairG.ellipse(cx + 9, cy - 3, 5, 4).fill(t.hair);
      hairG.ellipse(cx, cy - 4, 14, 7).fill(t.hair);
      hairG.ellipse(cx + 6, cy - 4, 4, 5).fill(t.hairDark);
      hairG.ellipse(cx - 3, cy - 8, 2, 1).fill({ color: t.white, alpha: 0.3 });
      hairG.ellipse(cx + 4, cy - 10, 2, 1).fill({ color: t.white, alpha: 0.3 });
      break;
    }
    case 5: {
      break;
    }
    case 6: {
      hairG.ellipse(cx, cy - 4, 13, 7).fill(t.hair);
      hairG.ellipse(cx, cy - 5, 12, 4).fill(t.hair);
      hairG.ellipse(cx - 14, cy + 4, 5, 10).fill(t.hair);
      hairG.ellipse(cx - 14, cy + 4, 4, 8).fill(t.hair);
      hairG.ellipse(cx - 14, cy + 9, 3, 6).fill(t.hairDark);
      hairG.ellipse(cx + 14, cy + 4, 5, 10).fill(t.hair);
      hairG.ellipse(cx + 14, cy + 4, 4, 8).fill(t.hair);
      hairG.ellipse(cx + 14, cy + 9, 3, 6).fill(t.hairDark);
      hairG.ellipse(cx - 3, cy - 7, 4, 2).fill({ color: t.white, alpha: 0.2 });
      break;
    }
    case 7: {
      hairG.ellipse(cx, cy - 4, 14, 8).fill(t.hair);
      hairG.moveTo(cx, cy - 12);
      hairG.lineTo(cx - 4, cy - 4);
      hairG.lineTo(cx + 1, cy - 4);
      hairG.closePath();
      g.addChild(hairG);
      return;
    }
  }

  g.addChild(hairG);
}

export const HAIR_VARIANTS = 8;
export const HAIR_WIDTH = 32;
export const HAIR_HEIGHT = 24;
