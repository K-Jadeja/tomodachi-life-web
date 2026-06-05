// Park — soft 3D park scene.
// Sky, rolling hills, trees, pond, bench, flowers, path.

import { Graphics } from 'pixi.js';
import {
  vGradient, drawSoftShadow, drawSphere, drawBox3D, drawCylinder,
  drawTree, drawGrassFloor, shade
} from '../../../engine/render/world3d';

export function drawPark(g: Graphics, time: number): void {
  const W = 480;
  const H = 270;
  const groundY = 240;

  vGradient(g, 0, 0, W, groundY - 30, 0x88c4e8, 0xe8f0ff);

  const cloudSpots: [number, number, number][] = [
    [120, 30, 10], [260, 50, 12], [400, 35, 9]
  ];
  for (const [cx, cy, r] of cloudSpots) {
    drawSphere(g, cx, cy, r, 0xffffff);
    drawSphere(g, cx + r * 0.6, cy - 2, r * 0.7, 0xffffff);
    drawSphere(g, cx - r * 0.5, cy + 1, r * 0.6, 0xf0f0f0);
  }

  g.ellipse(80, 175, 110, 35).fill(0x4a8a4a);
  g.ellipse(80, 168, 110, 25).fill(0x5a9a5a);
  g.ellipse(320, 180, 140, 30).fill(0x4a8a4a);
  g.ellipse(320, 170, 140, 20).fill(0x5a9a5a);

  drawPond(g, 240, 195, 120, 22);

  drawGrassFloor(g, 0, groundY, W, H - groundY);
  for (let i = 0; i < 60; i++) {
    const x = (i * 47) % W;
    const y = groundY + ((i * 31) % (H - groundY));
    g.rect(x, y, 1, 1).fill({ color: 0x2a6a2a, alpha: 0.5 });
  }

  drawTree(g, 60, groundY, 0.8, 0x3a8a3d, 0x6b3a1a);
  drawTree(g, 130, groundY, 1.0, 0x4a9a4a, 0x6b3a1a);
  drawTree(g, 410, groundY, 1.1, 0x3a8a3d, 0x5a2a1a);
  drawTree(g, 460, groundY, 0.7, 0x5aaa5a, 0x6b3a1a);

  drawBench(g, 80, 220);

  const flowerSpots: [number, number, number][] = [
    [40, 252, 0xd04848], [70, 256, 0xe8d34a], [120, 254, 0xe879a9],
    [180, 258, 0x4a8fd6], [220, 252, 0xffffff], [260, 256, 0xd04848],
    [310, 254, 0xe8d34a], [350, 258, 0xe879a9], [380, 252, 0x7a4a8a],
    [430, 256, 0xffffff], [60, 264, 0x4a8fd6], [200, 264, 0xd04848],
  ];
  for (const [fx, fy, fc] of flowerSpots) {
    drawSoftShadow(g, fx, fy + 1, 1.5, 0.6, 0.2);
    g.rect(fx - 0.5, fy - 2, 1, 2).fill(0x3a8a3d);
    drawSphere(g, fx, fy - 2, 1.5, fc);
  }

  drawSoftShadow(g, 150, groundY + 22, 30, 2, 0.2);
  g.ellipse(150, groundY + 22, 12, 3).fill(0xc8b89a);
  g.ellipse(150, groundY + 22, 12, 3).stroke({ color: 0x8a7a5a, width: 0.5 });

  g.ellipse(360, 248, 18, 4).fill(0x6b3a1a);
  g.ellipse(360, 248, 18, 4).stroke({ color: 0x3a2614, width: 0.5 });
  g.ellipse(378, 248, 3, 4).fill(0xc8a87a);
}

function drawPond(g: Graphics, cx: number, cy: number, rx: number, ry: number): void {
  drawSoftShadow(g, cx, cy + 2, rx, ry * 0.5, 0.2);
  g.ellipse(cx, cy, rx, ry).fill(0x3a6a8a);
  g.ellipse(cx, cy, rx * 0.95, ry * 0.95).fill(0x4a7a9a);
  g.ellipse(cx - rx * 0.3, cy - ry * 0.4, rx * 0.4, ry * 0.3)
    .fill({ color: 0xa0d4f0, alpha: 0.4 });
  g.ellipse(cx - 30, cy + 2, 6, 3).fill(0x3a8a3d);
  g.ellipse(cx + 20, cy - 3, 5, 2.5).fill(0x3a8a3d);
  drawSphere(g, cx - 28, cy + 1, 1.5, 0xe879a9);
  g.ellipse(cx + 50, cy, 8, 2).fill({ color: 0xffffff, alpha: 0.2 });
  g.ellipse(cx + 55, cy + 1, 4, 1).fill({ color: 0xffffff, alpha: 0.3 });
}

function drawBench(g: Graphics, x: number, y: number): void {
  drawSoftShadow(g, x + 30, y + 20, 30, 3, 0.3);
  g.rect(x, y, 60, 4).fill(0x6b3a1a);
  g.rect(x, y, 60, 1).fill({ color: 0xffffff, alpha: 0.2 });
  g.rect(x + 4, y - 8, 4, 12).fill(0x3a2614);
  g.rect(x + 52, y - 8, 4, 12).fill(0x3a2614);
  g.rect(x, y + 8, 60, 5).fill(0x8a5a2a);
  g.rect(x, y + 8, 60, 1).fill({ color: 0xffffff, alpha: 0.2 });
  for (let i = 0; i < 5; i++) {
    g.rect(x + i * 12, y + 8, 1, 5).fill({ color: 0x3a2614, alpha: 0.4 });
  }
  g.rect(x + 4, y + 13, 4, 7).fill(0x3a2614);
  g.rect(x + 52, y + 13, 4, 7).fill(0x3a2614);
}
