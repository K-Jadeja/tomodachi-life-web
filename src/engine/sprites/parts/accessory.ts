// Accessory overlays. 0 = none.

import { Container, Graphics } from 'pixi.js';

export type AccessoryStyle = 0 | 1 | 2 | 3 | 4;

export function drawAccessory(
  style: AccessoryStyle,
  g: Container,
  t: { secondary: number; outline: number; white: number; primary: number }
): void {
  if (style === 0) return;

  const cx = 20;
  const cy = 18;
  const accG = new Graphics();

  switch (style) {
    case 1: {
      accG.ellipse(cx - 4, cy, 3, 3).stroke({ color: t.secondary, width: 1.5 });
      accG.ellipse(cx + 4, cy, 3, 3).stroke({ color: t.secondary, width: 1.5 });
      accG.rect(cx - 2, cy - 0.5, 4, 1).fill(t.secondary);
      accG.rect(cx - 7, cy - 0.3, 1, 0.6).fill(t.secondary);
      accG.rect(cx + 6, cy - 0.3, 1, 0.6).fill(t.secondary);
      accG.ellipse(cx - 4, cy - 1, 1, 0.5).fill({ color: t.white, alpha: 0.4 });
      accG.ellipse(cx + 4, cy - 1, 1, 0.5).fill({ color: t.white, alpha: 0.4 });
      break;
    }
    case 2: {
      accG.ellipse(cx, cy - 13, 9, 1.5).fill(t.secondary);
      accG.rect(cx - 7, cy - 21, 14, 9).fill(t.secondary);
      accG.ellipse(cx, cy - 12, 7, 1).fill(t.secondary);
      accG.rect(cx - 7, cy - 14, 14, 1.5).fill(t.outline);
      accG.rect(cx - 5, cy - 20, 2, 6).fill({ color: t.white, alpha: 0.2 });
      break;
    }
    case 3: {
      accG.ellipse(cx + 12, cy - 4, 1.5, 1.5).fill(t.secondary);
      accG.moveTo(cx + 12, cy - 4);
      accG.lineTo(cx + 16, cy - 7);
      accG.lineTo(cx + 16, cy - 1);
      accG.closePath();
      accG.fill(t.secondary);
      accG.moveTo(cx + 12, cy - 4);
      accG.lineTo(cx + 8, cy - 7);
      accG.lineTo(cx + 8, cy - 1);
      accG.closePath();
      accG.fill(t.secondary);
      accG.ellipse(cx + 14, cy - 5, 1, 0.5).fill({ color: t.white, alpha: 0.3 });
      break;
    }
    case 4: {
      accG.ellipse(cx, cy - 4, 11, 5).fill(t.secondary);
      accG.ellipse(cx - 11, cy + 2, 3, 4).fill(t.secondary);
      accG.ellipse(cx - 11, cy + 2, 2, 3).fill(t.outline);
      accG.ellipse(cx + 11, cy + 2, 3, 4).fill(t.secondary);
      accG.ellipse(cx + 11, cy + 2, 2, 3).fill(t.outline);
      accG.ellipse(cx - 4, cy - 8, 4, 1.5).fill({ color: t.white, alpha: 0.3 });
      break;
    }
  }

  g.addChild(accG);
}
