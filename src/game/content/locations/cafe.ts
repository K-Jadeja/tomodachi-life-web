// Café — soft 3D interior.
// Wall, menu board, pendant lights, counter, espresso machine, pastry case,
// tables and chairs.

import { Graphics } from 'pixi.js';
import {
  vGradient, drawSoftShadow, drawSphere, drawBox3D, drawCylinder,
  drawPendantLight, drawCounter, shade
} from '../../../engine/render/world3d';

export function drawCafe(g: Graphics, time: number): void {
  const W = 480;
  const H = 270;
  const groundY = 240;

  vGradient(g, 0, 0, W, groundY, 0xf5e6c8, 0xd9c298);

  g.rect(0, groundY - 60, W, 2).fill({ color: 0x8a6a3a, alpha: 0.4 });
  vGradient(g, 0, groundY - 58, W, 58, 0xe6c8a0, 0xc8a87a);

  vGradient(g, 0, groundY, W, H - groundY, 0xa87a4a, 0x6b4a2a);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 16; col++) {
      const tx = col * 30 + (row % 2) * 15;
      const ty = groundY + row * 8;
      g.rect(tx, ty, 1, 8).fill({ color: 0x4a2a1a, alpha: 0.4 });
    }
    g.rect(0, groundY + row * 8, W, 1).fill({ color: 0x4a2a1a, alpha: 0.4 });
  }

  drawSoftShadow(g, 80, 92, 60, 2, 0.3);
  g.roundRect(60, 50, 130, 90, 4).fill(0x3a2614);
  g.roundRect(64, 54, 122, 82, 2).fill(0x1a2a1a);
  const menuItems = ['☕ Espresso    3.50', '☕ Latte       4.00', '☕ Mocha       4.50', '🍵 Matcha      4.50', '🧁 Cupcake     3.00', '🍪 Cookie      2.00'];
  for (let i = 0; i < menuItems.length; i++) {
    for (let j = 0; j < 14; j++) {
      g.rect(72 + j * 8, 64 + i * 11, 4, 1).fill(0xfff8d0);
    }
  }

  for (let i = 0; i < 3; i++) {
    const lx = 280 + i * 70;
    const ly = 0;
    drawPendantLight(g, lx, ly, 30, 0xfff0a0);
  }

  drawCounter(g, 60, 180, 200, 60, 0x6b3a1a, 0x8a5a2a);
  g.rect(58, 178, 204, 2).fill({ color: 0xffffff, alpha: 0.3 });
  g.rect(58, 180, 204, 1).fill({ color: 0x000000, alpha: 0.2 });

  drawEspressoMachine(g, 80, 130);
  drawPastryCase(g, 160, 150);

  drawSoftShadow(g, 400, groundY - 6, 32, 5, 0.3);
  g.ellipse(400, groundY - 10, 32, 8).fill(0x8a5a2a);
  g.ellipse(400, groundY - 10, 32, 8).stroke({ color: 0x3a2614, width: 1 });
  g.ellipse(400, groundY - 12, 28, 6).fill(0xa87a4a);
  g.rect(398, groundY - 6, 4, 6).fill(0x3a2614);

  drawCoffeeCup(g, 400, groundY - 16);

  for (let i = 0; i < 2; i++) {
    const sx = 396 + i * 8;
    const sy = groundY - 22 - i * 4;
    g.ellipse(sx, sy, 2, 4).fill({ color: 0xffffff, alpha: 0.3 });
  }
}

function drawEspressoMachine(g: Graphics, x: number, y: number): void {
  drawBox3D(g, x, y, 60, 50, 0xc8c8d0, 4, 0.15);
  drawBox3D(g, x + 10, y - 18, 40, 20, 0x9a9aa4, 3, 0.15);
  g.rect(x + 30, y - 5, 3, 18).fill(0x6a6a72);
  g.ellipse(x + 31, y + 13, 4, 2).fill(0x3a3a44);
  g.ellipse(x + 15, y + 30, 6, 3).fill(0x3a3a44);
  g.ellipse(x + 15, y + 30, 4, 2).fill(0x9a9aa4);
  for (let i = 0; i < 3; i++) {
    drawSphere(g, x + 15 + i * 12, y - 8, 2, 0xd04848);
  }
  g.rect(x + 5, y + 45, 50, 4).fill(0x3a3a44);
  g.rect(x + 25, y + 18, 10, 4).fill(0x6a6a72);
}

function drawPastryCase(g: Graphics, x: number, y: number): void {
  drawBox3D(g, x, y + 30, 90, 30, 0x8a5a2a, 3, 0.15);
  drawBox3D(g, x + 4, y, 82, 35, 0x4a5a6a, 2, 0.1);
  g.moveTo(x + 8, y + 3);
  g.lineTo(x + 14, y + 3);
  g.lineTo(x + 10, y + 30);
  g.lineTo(x + 6, y + 30);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.3 });
  g.rect(x + 2, y - 2, 86, 4).fill(0x6b3a1a);
  const pastries: [number, number, number][] = [
    [x + 12, y + 18, 0xd04848],
    [x + 28, y + 18, 0xe8d34a],
    [x + 44, y + 18, 0xe879a9],
    [x + 60, y + 18, 0xc04a8a],
    [x + 76, y + 18, 0x6b3a1a],
    [x + 20, y + 8, 0xc8a87a],
    [x + 40, y + 8, 0xfff0a0],
    [x + 60, y + 8, 0xe08838],
  ];
  for (const [px, py, pc] of pastries) {
    drawSphere(g, px, py, 4, pc);
  }
}

function drawCoffeeCup(g: Graphics, x: number, y: number): void {
  g.ellipse(x, y + 4, 8, 2).fill(0xe8e6e0);
  g.ellipse(x, y + 4, 8, 2).stroke({ color: 0x888880, width: 0.5 });
  g.moveTo(x - 5, y - 4);
  g.lineTo(x + 5, y - 4);
  g.lineTo(x + 4, y + 4);
  g.lineTo(x - 4, y + 4);
  g.closePath();
  g.fill(0xe8e6e0);
  g.moveTo(x - 5, y - 4);
  g.lineTo(x + 5, y - 4);
  g.lineTo(x + 4, y + 4);
  g.lineTo(x - 4, y + 4);
  g.closePath();
  g.stroke({ color: 0x888880, width: 0.5 });
  g.ellipse(x, y - 4, 4, 1.5).fill(0x6b3a1a);
  g.ellipse(x - 1, y - 4, 1.5, 0.5).fill({ color: 0xc8a87a, alpha: 0.4 });
  g.ellipse(x + 5, y - 1, 1.5, 2).stroke({ color: 0xe8e6e0, width: 1 });
}
