// Apartment — soft 3D living room.
// Cozy cream walls, wood floor, large window, sofa, plant, picture, rug, lamp.

import { Graphics } from 'pixi.js';
import {
  vGradient, drawSoftShadow, drawSphere, drawBox3D, drawCylinder,
  drawWindow, drawPictureFrame, drawSofa, drawPlant, drawRug,
  shade
} from '../../../engine/render/world3d';

export function drawApartment(g: Graphics, time: number): void {
  const W = 480;
  const H = 270;
  const groundY = 240;

  vGradient(g, 0, 0, W, groundY, 0xf5e6c8, 0xd9c298);

  g.rect(0, groundY - 70, W, 2).fill({ color: 0x8a6a3a, alpha: 0.4 });

  vGradient(g, 0, groundY, W, H - groundY, 0x9a6838, 0x4a2810);
  for (let i = 1; i < 4; i++) {
    g.rect(0, groundY + i * 6, W, 1).fill({ color: 0x000000, alpha: 0.18 });
  }

  drawWindow(g, 40, 50, 110, 90, 0x88c4e8, 0xe0f0ff);
  for (let i = 0; i < 3; i++) {
    g.moveTo(60 + i * 30, 140);
    g.lineTo(40 + i * 30, 250);
    g.lineTo(60 + i * 30, 250);
    g.closePath();
    g.fill({ color: 0xfff8d0, alpha: 0.07 });
  }

  drawPictureFrame(g, 200, 70, 80, 60, 0x6b3a1a, 0x88c4e8);
  g.moveTo(208, 120);
  g.lineTo(220, 100);
  g.lineTo(232, 110);
  g.lineTo(244, 95);
  g.lineTo(256, 105);
  g.lineTo(268, 115);
  g.lineTo(268, 124);
  g.lineTo(208, 124);
  g.closePath();
  g.fill(0x4a7a3a);
  drawSphere(g, 252, 86, 4, 0xffe28a);
  g.rect(200, 70, 80, 3).fill({ color: 0xffffff, alpha: 0.15 });

  g.ellipse(380, 80, 18, 18).fill({ color: 0x000000, alpha: 0.15 });
  g.ellipse(380, 78, 17, 17).fill(0xf5e6c8);
  g.ellipse(380, 78, 17, 17).stroke({ color: 0x6b3a1a, width: 2 });
  g.ellipse(380, 78, 2, 2).fill(0x3a2614);
  g.rect(380, 78, 1, -10).fill(0x3a2614);
  g.rect(380, 78, 8, 1).fill(0x3a2614);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.rect(
      380 + Math.cos(a) * 14 - 0.5,
      78 + Math.sin(a) * 14 - 0.5,
      1, 1
    ).fill(0x3a2614);
  }

  drawSoftShadow(g, 458, 244, 14, 3, 0.3);
  g.ellipse(458, 242, 14, 3).fill(0x3a2614);
  drawCylinder(g, 456, 130, 4, 112, 0x2a1a0a);
  g.moveTo(442, 130);
  g.lineTo(474, 130);
  g.lineTo(478, 100);
  g.lineTo(438, 100);
  g.closePath();
  g.fill(0xffd166);
  g.moveTo(442, 100);
  g.lineTo(450, 100);
  g.lineTo(450, 130);
  g.lineTo(442, 130);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.25 });
  g.ellipse(458, 135, 50, 30).fill({ color: 0xffd166, alpha: 0.15 });

  drawSofa(g, 270, 170, 170, 60, 0x3a6a8a, 0x5a8aaa);
  drawPlant(g, 30, 240, 0xb88a4a, 0x3a8a3a);
  drawRug(g, 240, 248, 100, 14, 0xc04a8a, 0xe07aaa);

  g.rect(170, 105, 60, 3).fill(0x6b3a1a);
  const bookColors = [0xc04a8a, 0x4a8fd6, 0x7ab348, 0xd04848, 0xe08838];
  let bx = 174;
  for (let i = 0; i < 5; i++) {
    const bh = 8 + (i % 2) * 3;
    g.rect(bx, 105 - bh, 6, bh).fill(bookColors[i]);
    g.rect(bx, 105 - bh, 1, bh).fill({ color: 0xffffff, alpha: 0.2 });
    bx += 8;
  }
  g.rect(170, 108, 60, 2).fill({ color: 0x000000, alpha: 0.2 });
}
