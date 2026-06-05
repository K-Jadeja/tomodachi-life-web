// Outfit variants — drawn as the top portion of the body.

import { Container, Graphics } from 'pixi.js';

export type OutfitStyle = 0 | 1 | 2 | 3 | 4 | 5;

export function drawOutfit(
  style: OutfitStyle,
  g: Container,
  t: { primary: number; primaryDark: number; secondary: number; outline: number; white: number; mouth: number }
): void {
  const cx = 20;
  const cy = 44;
  const rx = 10;
  const ry = 10;
  const outfitG = new Graphics();

  switch (style) {
    case 0: {
      outfitG.ellipse(cx, cy, rx, ry * 0.7).fill(t.primary);
      outfitG.ellipse(cx - rx + 1, cy - 1, 3, 4).fill(t.primary);
      outfitG.ellipse(cx + rx - 1, cy - 1, 3, 4).fill(t.primary);
      outfitG.moveTo(cx - 2, cy - ry * 0.7);
      outfitG.lineTo(cx, cy - ry * 0.7 + 3);
      outfitG.lineTo(cx + 2, cy - ry * 0.7);
      g.addChild(outfitG);
      outfitG.ellipse(cx, cy - 2, 4, 3).fill({ color: t.white, alpha: 0.2 });
      outfitG.ellipse(cx, cy + ry * 0.7, rx, 1).fill(t.secondary);
      break;
    }
    case 1: {
      outfitG.ellipse(cx, cy - ry * 0.4, rx + 1, 6).fill(t.secondary);
      outfitG.ellipse(cx, cy, rx + 1, ry * 0.75).fill(t.primary);
      outfitG.ellipse(cx - rx, cy - 1, 3, 4).fill(t.primary);
      outfitG.ellipse(cx + rx, cy - 1, 3, 4).fill(t.primary);
      outfitG.ellipse(cx, cy + 3, 5, 3).fill(t.secondary);
      outfitG.rect(cx - 2, cy - ry * 0.4, 1, 4).fill(t.secondary);
      outfitG.rect(cx + 1, cy - ry * 0.4, 1, 4).fill(t.secondary);
      outfitG.ellipse(cx - 3, cy - 2, 3, 2).fill({ color: t.white, alpha: 0.2 });
      g.addChild(outfitG);
      break;
    }
    case 2: {
      outfitG.ellipse(cx, cy - 2, rx, 4).fill(t.primary);
      outfitG.moveTo(cx - rx, cy + 1);
      outfitG.lineTo(cx - rx - 4, cy + ry + 2);
      outfitG.lineTo(cx + rx + 4, cy + ry + 2);
      outfitG.lineTo(cx + rx, cy + 1);
      g.addChild(outfitG);
      outfitG.closePath();
      outfitG.fill(t.primary);
      outfitG.ellipse(cx, cy, rx, 1.5).fill(t.secondary);
      outfitG.ellipse(cx, cy + ry + 2, rx + 4, 1).fill(t.secondary);
      outfitG.ellipse(cx - 3, cy - 1, 3, 2).fill({ color: t.white, alpha: 0.2 });
      break;
    }
    case 3: {
      outfitG.ellipse(cx - rx + 1, cy - 2, 4, 3).fill(t.secondary);
      outfitG.ellipse(cx + rx - 1, cy - 2, 4, 3).fill(t.secondary);
      outfitG.ellipse(cx, cy, rx, ry * 0.7).fill(t.primary);
      outfitG.moveTo(cx - 2, cy - ry * 0.6);
      outfitG.lineTo(cx, cy - ry * 0.6 + 4);
      outfitG.lineTo(cx - 1, cy + 1);
      g.addChild(outfitG);
      outfitG.closePath();
      outfitG.fill(t.secondary);
      outfitG.moveTo(cx + 2, cy - ry * 0.6);
      outfitG.lineTo(cx, cy - ry * 0.6 + 4);
      outfitG.lineTo(cx + 1, cy + 1);
      outfitG.closePath();
      outfitG.fill(t.secondary);
      outfitG.rect(cx - 1, cy - ry * 0.6, 2, ry).fill(0xffffff);
      outfitG.moveTo(cx - 1, cy - ry * 0.6 + 4);
      outfitG.lineTo(cx + 1, cy - ry * 0.6 + 4);
      outfitG.lineTo(cx + 2, cy - 1);
      outfitG.lineTo(cx, cy + 2);
      outfitG.lineTo(cx - 2, cy - 1);
      outfitG.closePath();
      outfitG.fill(0xb33a3a);
      outfitG.ellipse(cx - 4, cy - 1, 2, 1).fill({ color: t.white, alpha: 0.2 });
      break;
    }
    case 4: {
      outfitG.ellipse(cx, cy, rx + 1, ry * 0.8).fill(t.primary);
      outfitG.ellipse(cx - rx, cy - 1, 3, 4).fill(t.primary);
      outfitG.ellipse(cx + rx, cy - 1, 3, 4).fill(t.primary);
      outfitG.ellipse(cx, cy + 1, rx, 1.5).fill(t.secondary);
      outfitG.ellipse(cx - 3, cy - 2, 2, 1).fill({ color: t.white, alpha: 0.15 });
      g.addChild(outfitG);
      break;
    }
    case 5: {
      outfitG.moveTo(cx - rx - 2, cy - 1);
      outfitG.lineTo(cx - rx - 2, cy + ry + 2);
      outfitG.lineTo(cx + rx + 2, cy + ry + 2);
      outfitG.lineTo(cx + rx + 2, cy - 1);
      g.addChild(outfitG);
      outfitG.closePath();
      outfitG.fill(t.primary);
      outfitG.ellipse(cx, cy, rx, ry * 0.5).fill(t.primary);
      outfitG.ellipse(cx, cy + 2, rx, 2).fill(t.secondary);
      const sx = cx, sy = cy + 5;
      outfitG.ellipse(sx, sy, 1.5, 1.5).fill(t.secondary);
      outfitG.ellipse(cx - 4, cy - 2, 2, 1).fill({ color: t.white, alpha: 0.2 });
      break;
    }
  }
}
