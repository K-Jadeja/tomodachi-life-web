// Beach — soft 3D coastal scene.
// Sky gradient, sun, distant island, ocean with waves, sand, palm tree,
// beach umbrella, towel.

import { Graphics } from 'pixi.js';
import {
  vGradient, drawSoftShadow, drawSphere, drawBox3D, drawCylinder,
  drawCone, drawWater, drawSandFloor, shade
} from '../../../engine/render/world3d';

export function drawBeach(g: Graphics, time: number): void {
  const W = 480;
  const H = 270;
  const groundY = 240;

  vGradient(g, 0, 0, W, groundY, 0x88c4e8, 0xe8f0ff);

  g.ellipse(410, 55, 32, 32).fill({ color: 0xfff0a0, alpha: 0.2 });
  g.ellipse(410, 55, 24, 24).fill({ color: 0xfff8d0, alpha: 0.3 });
  drawSphere(g, 410, 55, 16, 0xffe28a);

  const cloudSpots: [number, number, number][] = [
    [80, 40, 12], [180, 30, 10], [320, 50, 14]
  ];
  for (const [cx, cy, r] of cloudSpots) {
    drawSphere(g, cx, cy, r, 0xffffff);
    drawSphere(g, cx + r * 0.7, cy - 2, r * 0.8, 0xffffff);
    drawSphere(g, cx - r * 0.6, cy + 2, r * 0.7, 0xf0f0f0);
    g.ellipse(cx, cy + r * 0.6, r * 0.9, r * 0.3)
      .fill({ color: 0x000000, alpha: 0.1 });
  }

  g.moveTo(20, 150);
  g.lineTo(60, 130);
  g.lineTo(100, 140);
  g.lineTo(140, 125);
  g.lineTo(180, 138);
  g.lineTo(220, 130);
  g.lineTo(260, 142);
  g.lineTo(300, 132);
  g.lineTo(340, 145);
  g.lineTo(380, 135);
  g.lineTo(420, 140);
  g.lineTo(460, 130);
  g.lineTo(460, 175);
  g.lineTo(20, 175);
  g.closePath();
  g.fill(0x3a6a4a);
  g.moveTo(20, 150);
  g.lineTo(60, 130);
  g.lineTo(100, 140);
  g.lineTo(140, 125);
  g.lineTo(180, 138);
  g.lineTo(220, 130);
  g.lineTo(260, 142);
  g.lineTo(300, 132);
  g.lineTo(340, 145);
  g.lineTo(380, 135);
  g.lineTo(420, 140);
  g.lineTo(460, 130);
  g.lineTo(460, 145);
  g.lineTo(20, 145);
  g.closePath();
  g.fill(0x4a8a5a);

  drawWater(g, 0, 175, W, 65, time);
  drawSandFloor(g, 0, groundY, W, H - groundY);

  g.rect(0, groundY - 1, W, 2).fill(0xa07a3a);
  g.rect(0, groundY - 1, W, 1).fill({ color: 0x000000, alpha: 0.15 });

  const ux = 100, uy = groundY - 90;
  drawCylinder(g, ux - 1.5, uy, 3, 90, 0x6b3a1a);
  drawCone(g, ux, uy, 36, 28, 0xd04848);
  g.moveTo(ux, uy - 28);
  g.lineTo(ux + 36, uy);
  g.lineTo(ux + 18, uy);
  g.closePath();
  g.fill(0xe08838);
  g.moveTo(ux, uy - 28);
  g.lineTo(ux - 6, uy);
  g.lineTo(ux, uy);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.2 });

  drawSoftShadow(g, ux, groundY - 18, 30, 4, 0.3);
  g.ellipse(ux, groundY - 22, 28, 5).fill(0xc8a87a);
  g.ellipse(ux, groundY - 22, 28, 5).stroke({ color: 0x6b3a1a, width: 1 });
  g.ellipse(ux, groundY - 23, 24, 3).fill(0xd8b88a);
  g.rect(ux - 22, groundY - 22, 2, 22).fill(0x6b3a1a);
  g.rect(ux + 20, groundY - 22, 2, 22).fill(0x6b3a1a);

  drawSphere(g, ux - 6, groundY - 26, 4, 0xb88a4a);
  g.rect(ux - 6, groundY - 30, 0.8, 6).fill(0xe8e6e0);

  drawCoconutPalm(g, 420, groundY);

  drawSoftShadow(g, 250, groundY + 12, 50, 4, 0.25);
  drawBox3D(g, 200, groundY + 8, 100, 8, 0x4a8fd6, 2, 0.15);
  g.rect(200, groundY + 8, 100, 2).fill(0xe8e6e0);
  g.rect(200, groundY + 14, 100, 2).fill(0xe8e6e0);
  for (let i = 0; i < 10; i++) {
    g.rect(200 + i * 10, groundY + 16, 1, 2).fill(0x3a6a8a);
  }
}

/** A stylized coconut palm tree. */
function drawCoconutPalm(g: Graphics, cx: number, baseY: number): void {
  const trunkH = 130;
  const trunkW = 8;
  g.moveTo(cx - trunkW / 2, baseY);
  g.quadraticCurveTo(cx - 2, baseY - trunkH * 0.5, cx + 1, baseY - trunkH);
  g.lineTo(cx + 1 + trunkW, baseY - trunkH);
  g.quadraticCurveTo(cx - 2 + trunkW, baseY - trunkH * 0.5, cx + trunkW / 2, baseY);
  g.closePath();
  g.fill(0x6b3a1a);
  for (let i = 0; i < 6; i++) {
    const y = baseY - 20 - i * 18;
    g.ellipse(cx + 1, y, trunkW * 0.6, 1).fill({ color: 0x3a2614, alpha: 0.5 });
  }
  drawSphere(g, cx - 4, baseY - trunkH + 6, 4, 0x3a2614);
  drawSphere(g, cx + 6, baseY - trunkH + 4, 4, 0x3a2614);

  const fronds: [number, number, number][] = [
    [-30, -10, 0],
    [-20, -30, -0.2],
    [20, -30, 0.2],
    [30, -10, 0],
    [-15, 5, -0.1],
    [15, 5, 0.1],
  ];
  for (const [dx, dy, rot] of fronds) {
    drawFrond(g, cx + dx, baseY - trunkH + dy, 28, rot);
  }
}

function drawFrond(g: Graphics, cx: number, cy: number, len: number, rot: number): void {
  // Build the frond in a local sub-graphics so it doesn't mutate the
  // outer Graphics' position/rotation (which would offset the whole
  // background layer).
  const sub = new Graphics();
  sub.ellipse(0, 0, len * 0.3, len).fill(0x3a8a3d);
  sub.ellipse(-len * 0.1, 0, len * 0.15, len * 0.7)
    .fill({ color: 0x6aba5a, alpha: 0.7 });
  sub.rect(-0.5, -len, 1, len * 2).fill({ color: 0x2a6a2a, alpha: 0.4 });
  sub.position.set(cx, cy);
  sub.rotation = rot;
  g.addChild(sub);
}
