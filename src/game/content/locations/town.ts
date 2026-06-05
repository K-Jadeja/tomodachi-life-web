// Town Square — soft 3D city street.
// Sky, distant skyscrapers, mid-rise building fronts, sidewalk, streetlights,
// shop signs, road.

import { Graphics } from 'pixi.js';
import {
  vGradient, drawSoftShadow, drawSphere, drawBox3D, drawCylinder,
  drawBuilding, drawStreetlight, drawRoad, shade
} from '../../../engine/render/world3d';

export function drawTown(g: Graphics, time: number): void {
  const W = 480;
  const H = 270;
  const groundY = 240;

  vGradient(g, 0, 0, W, 80, 0x88c4e8, 0xe8f0ff);

  const skyLineY = 80;
  const skyBuildings: [number, number, number, number][] = [
    [10, 16, 28, 0x6a7a8a], [42, 8, 40, 0x8a8a9a], [82, 22, 32, 0x5a6a7a],
    [120, 12, 36, 0x7a7a8a], [160, 18, 30, 0x6a6a7a], [200, 8, 44, 0x8a8a9a],
    [250, 14, 28, 0x5a5a6a], [290, 10, 40, 0x7a7a8a], [340, 22, 32, 0x6a6a7a],
    [380, 14, 36, 0x8a8a9a], [420, 18, 30, 0x5a6a7a], [455, 10, 30, 0x7a7a8a],
  ];
  for (const [bx, bh, bw, bc] of skyBuildings) {
    drawBuilding(g, bx, skyLineY - bh, bw, bh, bc);
  }

  g.rect(0, skyLineY - 5, W, 5).fill({ color: 0xc0d0e0, alpha: 0.5 });

  const midY = 175;
  vGradient(g, 0, midY - 90, 70, 90, 0xc8a87a, 0x8a6a3a);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const lit = (row + col) % 2 === 0;
      g.rect(8 + col * 20, midY - 80 + row * 18, 12, 10)
        .fill(lit ? 0xfff0a0 : 0x4a4a52);
    }
  }
  for (let i = 0; i < 7; i++) {
    g.rect(i * 10, midY - 100, 10, 12).fill(i % 2 === 0 ? 0xd04848 : 0xe8e6e0);
  }
  g.rect(0, midY - 102, 70, 3).fill(0x6b3a1a);
  g.rect(25, midY - 30, 20, 30).fill(0x3a2614);
  g.ellipse(40, midY - 15, 1, 1).fill(0xe8d999);

  vGradient(g, 75, midY - 100, 80, 100, 0x9a7a4a, 0x6b4a2a);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const lit = (row * 2 + col) % 3 === 0;
      g.rect(82 + col * 22, midY - 92 + row * 17, 14, 10)
        .fill(lit ? 0xfff0a0 : 0x3a3a44);
    }
  }
  drawStreetlight(g, 115, midY);

  vGradient(g, 160, midY - 110, 90, 110, 0xb8a890, 0x7a6a5a);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const lit = (row + col * 2) % 2 === 1;
      g.rect(168 + col * 24, midY - 100 + row * 18, 16, 12)
        .fill(lit ? 0xfff0a0 : 0x4a4a52);
    }
  }
  g.rect(170, midY - 30, 70, 30).fill(0x2a3a4a);
  g.rect(170, midY - 30, 70, 2).fill({ color: 0xffffff, alpha: 0.4 });
  g.moveTo(170, midY - 30);
  g.lineTo(180, midY - 5);
  g.lineTo(180, midY - 30);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.2 });
  g.rect(165, midY - 38, 80, 8).fill(0x3a3a44);
  for (let i = 0; i < 8; i++) {
    g.rect(170 + i * 9, midY - 35, 6, 2).fill(0xfff0a0);
  }

  vGradient(g, 255, midY - 95, 70, 95, 0xa89a8a, 0x6a5a4a);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const lit = (row * 3 + col) % 2 === 0;
      g.rect(265 + col * 30, midY - 85 + row * 18, 20, 12)
        .fill(lit ? 0xfff0a0 : 0x4a4a52);
    }
  }
  drawTrashCan(g, 280, midY);

  vGradient(g, 330, midY - 105, 70, 105, 0x8a7a6a, 0x4a3a2a);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 2; col++) {
      const lit = (row + col) % 2 === 1;
      g.rect(340 + col * 30, midY - 95 + row * 17, 20, 10)
        .fill(lit ? 0xfff0a0 : 0x3a3a44);
    }
  }
  g.rect(355, midY - 30, 20, 30).fill(0x3a2614);
  g.ellipse(370, midY - 15, 1, 1).fill(0xe8d999);

  vGradient(g, 405, midY - 88, 75, 88, 0xc8b89a, 0x8a6a4a);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const lit = (row * 2 + col * 3) % 4 < 2;
      g.rect(412 + col * 22, midY - 78 + row * 16, 14, 10)
        .fill(lit ? 0xfff0a0 : 0x4a4a52);
    }
  }
  g.rect(430, midY - 30, 20, 30).fill(0x3a2614);
  g.ellipse(445, midY - 15, 1, 1).fill(0xe8d999);

  vGradient(g, 0, midY, W, 12, 0xc8b89a, 0x8a7a5a);
  for (let i = 0; i < 8; i++) {
    g.rect(i * 60, midY, 1, 12).fill({ color: 0x6a5a4a, alpha: 0.4 });
  }

  drawRoad(g, 0, midY + 12, W, 18);
  g.rect(0, midY + 12, W, 1).fill(0xfff0a0);
  g.rect(0, midY + 30, W, 1).fill(0xfff0a0);
}

function drawTrashCan(g: Graphics, x: number, y: number): void {
  drawSoftShadow(g, x, y + 1, 6, 1.5, 0.3);
  g.roundRect(x - 5, y - 14, 10, 14, 1).fill(0x2a5a3a);
  g.rect(x - 4, y - 13, 1, 12).fill({ color: 0xffffff, alpha: 0.2 });
  g.ellipse(x, y - 14, 5, 1.5).fill(0x3a6a4a);
  g.rect(x - 1, y - 17, 2, 3).fill(0x3a6a4a);
}
