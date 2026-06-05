// Mouth variants — drawn as paths (smiles, O shapes).

import { Graphics } from 'pixi.js';

export type MouthState = 0 | 1 | 2 | 3 | 4; // 0=closed, 1=open1, 2=open2, 3=sad, 4=o
export type MouthStyle = 0 | 1 | 2 | 3;

interface MouthSpec {
  name: string;
  drawClosed(g: Graphics, cx: number, cy: number, t: { outline: number; mouth: number; tongue: number }): void;
  drawOpen1(g: Graphics, cx: number, cy: number, t: { outline: number; mouth: number; tongue: number }): void;
  drawOpen2(g: Graphics, cx: number, cy: number, t: { outline: number; mouth: number; tongue: number }): void;
  drawSad(g: Graphics, cx: number, cy: number, t: { outline: number; mouth: number; tongue: number }): void;
  drawO(g: Graphics, cx: number, cy: number, t: { outline: number; mouth: number; tongue: number }): void;
}

const SMILE: MouthSpec = {
  name: 'smile',
  drawClosed(g, cx, cy, t) {
    g.moveTo(cx - 4, cy);
    g.quadraticCurveTo(cx - 2, cy + 2, cx, cy + 2);
    g.quadraticCurveTo(cx + 2, cy + 2, cx + 4, cy);
    g.stroke({ color: t.outline, width: 1.2 });
  },
  drawOpen1(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 3, 1.5).fill(t.mouth);
    g.ellipse(cx, cy + 1, 3, 1.5).stroke({ color: t.outline, width: 0.5 });
    g.ellipse(cx, cy + 1.5, 2, 0.5).fill(t.tongue);
  },
  drawOpen2(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 3.5, 2).fill(t.mouth);
    g.ellipse(cx, cy + 1, 3.5, 2).stroke({ color: t.outline, width: 0.5 });
    g.ellipse(cx, cy + 2, 2.5, 0.7).fill(t.tongue);
  },
  drawSad(g, cx, cy, t) {
    g.moveTo(cx - 4, cy + 2);
    g.quadraticCurveTo(cx - 2, cy, cx, cy);
    g.quadraticCurveTo(cx + 2, cy, cx + 4, cy + 2);
    g.stroke({ color: t.outline, width: 1.2 });
  },
  drawO(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 1.5, 2).fill(t.mouth);
    g.ellipse(cx, cy + 1, 1.5, 2).stroke({ color: t.outline, width: 0.5 });
  },
};

const FLAT: MouthSpec = {
  name: 'flat',
  drawClosed(g, cx, cy, t) {
    g.rect(cx - 3, cy, 6, 1).fill(t.outline);
  },
  drawOpen1(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 3, 1.5).fill(t.mouth);
    g.ellipse(cx, cy + 1, 3, 1.5).stroke({ color: t.outline, width: 0.5 });
  },
  drawOpen2(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 3.5, 2).fill(t.mouth);
    g.ellipse(cx, cy + 1, 3.5, 2).stroke({ color: t.outline, width: 0.5 });
  },
  drawSad(g, cx, cy, t) {
    g.rect(cx - 3, cy + 1, 6, 1).fill(t.outline);
  },
  drawO(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 1.5, 2).fill(t.mouth);
    g.ellipse(cx, cy + 1, 1.5, 2).stroke({ color: t.outline, width: 0.5 });
  },
};

const SOFT: MouthSpec = {
  name: 'soft',
  drawClosed(g, cx, cy, t) {
    g.moveTo(cx - 3, cy);
    g.quadraticCurveTo(cx, cy + 2, cx + 3, cy);
    g.stroke({ color: t.outline, width: 1.2 });
  },
  drawOpen1(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 2.5, 1.5).fill(t.mouth);
    g.ellipse(cx, cy + 1, 2.5, 1.5).stroke({ color: t.outline, width: 0.5 });
  },
  drawOpen2(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 3, 2).fill(t.mouth);
    g.ellipse(cx, cy + 1, 3, 2).stroke({ color: t.outline, width: 0.5 });
    g.ellipse(cx, cy + 1.8, 2, 0.5).fill(t.tongue);
  },
  drawSad(g, cx, cy, t) {
    g.moveTo(cx - 3, cy + 2);
    g.quadraticCurveTo(cx, cy, cx + 3, cy + 2);
    g.stroke({ color: t.outline, width: 1.2 });
  },
  drawO(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 1.2, 1.5).fill(t.mouth);
    g.ellipse(cx, cy + 1, 1.2, 1.5).stroke({ color: t.outline, width: 0.5 });
  },
};

const SMIRK: MouthSpec = {
  name: 'smirk',
  drawClosed(g, cx, cy, t) {
    g.moveTo(cx - 3, cy + 0.5);
    g.quadraticCurveTo(cx - 1, cy + 2, cx + 3, cy);
    g.stroke({ color: t.outline, width: 1.2 });
  },
  drawOpen1(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 3, 1.5).fill(t.mouth);
    g.ellipse(cx, cy + 1, 3, 1.5).stroke({ color: t.outline, width: 0.5 });
  },
  drawOpen2(g, cx, cy, t) {
    g.ellipse(cx, cy + 1, 3, 1.8).fill(t.mouth);
    g.ellipse(cx, cy + 1, 3, 1.8).stroke({ color: t.outline, width: 0.5 });
  },
  drawSad(g, cx, cy, t) {
    g.moveTo(cx - 3, cy + 2);
    g.quadraticCurveTo(cx - 1, cy, cx + 3, cy + 1);
    g.stroke({ color: t.outline, width: 1.2 });
  },
  drawO(g, cx, cy, t) {
    g.ellipse(cx + 0.5, cy + 1, 1.2, 1.5).fill(t.mouth);
    g.ellipse(cx + 0.5, cy + 1, 1.2, 1.5).stroke({ color: t.outline, width: 0.5 });
  },
};

const MOUTHES: MouthSpec[] = [SMILE, FLAT, SOFT, SMIRK];

export function drawMouth(
  style: MouthStyle,
  g: Graphics,
  cx: number,
  cy: number,
  state: MouthState,
  t: { outline: number; mouth: number; tongue: number }
): void {
  const spec = MOUTHES[style] ?? MOUTHES[0];
  switch (state) {
    case 1: spec.drawOpen1(g, cx, cy, t); break;
    case 2: spec.drawOpen2(g, cx, cy, t); break;
    case 3: spec.drawSad(g, cx, cy, t); break;
    case 4: spec.drawO(g, cx, cy, t); break;
    case 0:
    default: spec.drawClosed(g, cx, cy, t); break;
  }
}

export const MOUTH_VARIANTS = MOUTHES.length;
