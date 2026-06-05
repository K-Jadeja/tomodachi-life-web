// 3D-look drawing helpers.
// We fake 3D with rounded shapes, stacked gradient layers, and soft drop
// shadows. All primitives are pure PixiJS Graphics — no textures, no meshes.
//
// Conventions:
//   - The "ground line" is roughly y=240 (in the 480x270 base canvas)
//   - Objects further back should be drawn first (z-order via call order)
//   - Every on-ground object should have a soft drop shadow below it
//   - Lit from upper-left: highlights go top-left, shadows bottom-right
//
// All functions append to an existing Graphics object. They do not return
// new ones — call them in render order on your background Graphics.

import { Graphics } from 'pixi.js';

/** Fill a vertical gradient rect using stacked thin horizontal bands. */
export function vGradient(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  top: number,
  bottom: number
): void {
  // 4 stacked bands of decreasing size = smooth-enough gradient at 270px
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const col = lerpColor(top, bottom, t);
    const bandY = y + (h * i) / bands;
    const bandH = h / bands + 0.5;
    g.rect(x, bandY, w, bandH).fill(col);
  }
}

/** Fill a radial gradient (concentric ellipses, lighter on top). */
export function radialGradient(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  center: number,
  edge: number
): void {
  // 6 concentric ellipses
  const bands = 6;
  for (let i = bands - 1; i >= 0; i--) {
    const t = i / (bands - 1);
    const col = lerpColor(edge, center, t);
    const er = lerpF(0.2, 1.0, t);
    g.ellipse(cx, cy, rx * er, ry * er).fill(col);
  }
}

/** Filled sphere: a radial gradient ellipse with a small highlight. */
export function drawSphere(
  g: Graphics,
  cx: number,
  cy: number,
  r: number,
  color: number,
  highlight: number = 0xffffff
): void {
  // Base (darker at edges)
  g.ellipse(cx, cy, r, r).fill(shade(color, -0.25));
  // Mid
  g.ellipse(cx, cy, r * 0.95, r * 0.95).fill(color);
  // Highlight (top-left)
  g.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.35, r * 0.25)
    .fill({ color: highlight, alpha: 0.6 });
}

/** Soft drop shadow: a flat ellipse with low alpha. */
export function drawSoftShadow(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha: number = 0.25
): void {
  // Two ellipses, larger and fainter, for soft falloff
  g.ellipse(cx, cy, rx * 1.0, ry * 1.0).fill({ color: 0x000000, alpha: alpha * 0.6 });
  g.ellipse(cx, cy, rx * 0.7, ry * 0.7).fill({ color: 0x000000, alpha: alpha * 0.4 });
}

/** A 3D-looking rounded box (cushion, building, etc.). */
export function drawBox3D(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  radius: number = 4,
  sideShade: number = 0.2
): void {
  // Back/shadow edge (right side darker)
  g.roundRect(x, y, w, h, radius).fill(shade(color, -sideShade));
  // Main face, slightly inset on the right
  g.roundRect(x, y, w - 1, h - 1, radius).fill(color);
  // Top highlight band
  g.roundRect(x, y, w - 1, Math.max(2, h * 0.18), radius * 0.6)
    .fill({ color: 0xffffff, alpha: 0.18 });
}

/** A 3D-looking cylinder (pole, trunk). */
export function drawCylinder(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number
): void {
  // Main body with vertical gradient
  vGradient(g, x, y, w, h, shade(color, 0.15), shade(color, -0.25));
  // Left highlight stripe
  g.rect(x, y, Math.max(1, w * 0.2), h)
    .fill({ color: 0xffffff, alpha: 0.18 });
  // Right shadow stripe
  g.rect(x + w * 0.8, y, Math.max(1, w * 0.2), h)
    .fill({ color: 0x000000, alpha: 0.18 });
  // Top ellipse cap
  g.ellipse(x + w / 2, y, w / 2, Math.max(1, w * 0.2)).fill(shade(color, 0.25));
  // Bottom ellipse cap (darker)
  g.ellipse(x + w / 2, y + h, w / 2, Math.max(1, w * 0.2))
    .fill(shade(color, -0.15));
}

/** Cone (umbrella, roof). */
export function drawCone(
  g: Graphics,
  cx: number,
  baseY: number,
  radius: number,
  height: number,
  color: number
): void {
  // Body (triangular path with rounded tip)
  g.moveTo(cx, baseY - height);
  g.lineTo(cx + radius, baseY);
  g.lineTo(cx - radius, baseY);
  g.closePath();
  g.fill({ color, alpha: 1 });
  // Bottom rim shadow
  g.ellipse(cx, baseY, radius, radius * 0.25).fill(shade(color, -0.3));
  // Highlight stripe on the left
  g.moveTo(cx, baseY - height);
  g.lineTo(cx - radius * 0.4, baseY);
  g.lineTo(cx - radius * 0.2, baseY);
  g.lineTo(cx + radius * 0.1, baseY - height);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.15 });
}

/** A fluffy tree (3 stacked spheres + trunk). */
export function drawTree(
  g: Graphics,
  cx: number,
  baseY: number,
  scale: number,
  leafColor: number,
  trunkColor: number = 0x6b3a1a
): void {
  // Trunk
  const trunkW = 6 * scale;
  const trunkH = 24 * scale;
  drawCylinder(g, cx - trunkW / 2, baseY - trunkH, trunkW, trunkH, trunkColor);
  // Foliage: 3 overlapping spheres
  const r1 = 22 * scale;
  const r2 = 18 * scale;
  const r3 = 16 * scale;
  const y1 = baseY - trunkH - r1 * 0.4;
  const y2 = baseY - trunkH - r1 * 0.4 - r2 * 0.5;
  const y3 = baseY - trunkH - r1 * 0.4 - r2 * 0.5 - r3 * 0.4;
  drawSphere(g, cx - 6 * scale, y1, r1, shade(leafColor, -0.1));
  drawSphere(g, cx + 8 * scale, y2, r2, leafColor);
  drawSphere(g, cx, y3, r3, shade(leafColor, 0.1));
  // Extra dark accent on the right (ambient occlusion)
  g.ellipse(cx + 6 * scale, y1 + 4 * scale, 10 * scale, 6 * scale)
    .fill({ color: 0x000000, alpha: 0.2 });
}

/** A 3D rounded wall (back wall, room interior). */
export function drawWall(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number
): void {
  // Main with vertical gradient
  vGradient(g, x, y, w, h, color, shade(color, -0.12));
}

/** A 3D floor: warm wood-like with perspective. */
export function drawWoodFloor(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  // Base wood
  vGradient(g, x, y, w, h, 0x8a5a2a, 0x4a2810);
  // Planks: subtle horizontal lines, alternating slightly different shades
  const plankH = 8;
  for (let py = 0; py < h; py += plankH) {
    const tone = (py / plankH) % 2 === 0 ? 0x6b3a1a : 0x7a4824;
    g.rect(x, y + py, w, 1).fill({ color: 0x000000, alpha: 0.15 });
    g.rect(x, y + py + 1, w, plankH - 1).fill({ color: tone, alpha: 0.4 });
  }
}

/** A 3D grass floor: green gradient. */
export function drawGrassFloor(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  vGradient(g, x, y, w, h, 0x7ab348, 0x3a8a3d);
}

/** A 3D sand floor: warm tan gradient. */
export function drawSandFloor(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  vGradient(g, x, y, w, h, 0xe8c98a, 0xc89a5a);
  // Tiny speckle for grain
  for (let i = 0; i < 30; i++) {
    const sx = x + ((i * 73) % w);
    const sy = y + ((i * 41) % h);
    g.rect(sx, sy, 1, 1).fill({ color: 0x8a5a2a, alpha: 0.4 });
  }
}

/** A 3D water surface: blue with subtle wave lines. */
export function drawWater(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number
): void {
  vGradient(g, x, y, w, h, 0x4a8fc8, 0x1a4a7a);
  // Wave lines (animated by time)
  for (let i = 0; i < 5; i++) {
    const wy = y + 8 + i * 7;
    const offset = Math.sin(time * 0.001 + i) * 4;
    g.rect(x + 20 + offset, wy, w - 40, 1)
      .fill({ color: 0xa0d4f0, alpha: 0.4 });
    g.rect(x + 40 - offset, wy + 2, w - 80, 1)
      .fill({ color: 0xe0f0ff, alpha: 0.25 });
  }
}

/** A 3D road: gray with dashed center line. */
export function drawRoad(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  vGradient(g, x, y, w, h, 0x6a6a72, 0x3a3a44);
  // Center dashes
  for (let dx = 0; dx < w; dx += 16) {
    g.rect(x + dx, y + h * 0.45, 8, 1).fill(0xfff0a0);
  }
}

/** A 3D rug on the floor: oval with pattern. */
export function drawRug(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  base: number,
  accent: number
): void {
  // Soft shadow
  drawSoftShadow(g, cx, cy + 2, rx, ry * 0.4, 0.25);
  // Base
  g.ellipse(cx, cy, rx, ry).fill(base);
  // Border
  g.ellipse(cx, cy, rx * 0.95, ry * 0.95).fill({ color: shade(base, 0.2) });
  // Center pattern: rows of small rounded rects
  const innerRX = rx * 0.7;
  const innerRY = ry * 0.6;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const px = cx + (dx / 3) * innerRX;
      const py = cy + (dy / 2) * innerRY;
      if (Math.hypot((dx / 3) * innerRX, (dy / 2) * innerRY) < Math.min(innerRX, innerRY) * 0.8) {
        g.roundRect(px - 4, py - 3, 8, 5, 1.5).fill(accent);
      }
    }
  }
}

/** A 3D window with light streaming in. */
export function drawWindow(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  skyTop: number = 0xa0d4f0,
  skyBottom: number = 0xe0f0ff
): void {
  // Recess shadow
  g.roundRect(x - 2, y - 2, w + 4, h + 4, 4).fill({ color: 0x000000, alpha: 0.3 });
  // Sky gradient in the window
  vGradient(g, x, y, w, h, skyTop, skyBottom);
  // Frame: 4 thick rounded rects
  g.roundRect(x - 3, y - 3, w + 6, 6, 2).fill(0x8a5a2a);
  g.roundRect(x - 3, y + h - 3, w + 6, 6, 2).fill(0x6b3a1a);
  g.roundRect(x - 3, y - 3, 6, h + 6, 2).fill(0x8a5a2a);
  g.roundRect(x + w - 3, y - 3, 6, h + 6, 2).fill(0x6b3a1a);
  // Mullion (vertical)
  g.rect(x + w / 2 - 1, y, 2, h).fill(0x8a5a2a);
  // Mullion (horizontal)
  g.rect(x, y + h / 2 - 1, w, 2).fill(0x8a5a2a);
}

/** A 3D picture frame on a wall. */
export function drawPictureFrame(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  frameColor: number = 0x6b3a1a,
  artColor: number = 0x88c4e8
): void {
  // Shadow
  g.roundRect(x + 2, y + 2, w, h, 2).fill({ color: 0x000000, alpha: 0.2 });
  // Outer frame
  g.roundRect(x, y, w, h, 2).fill(frameColor);
  // Inner canvas
  g.roundRect(x + 3, y + 3, w - 6, h - 6, 1).fill(artColor);
}

/** A 3D sofa with cushions. */
export function drawSofa(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  bodyColor: number,
  cushionColor: number
): void {
  // Soft shadow
  drawSoftShadow(g, x + w / 2, y + h + 2, w * 0.5, 6, 0.3);
  // Backrest
  drawBox3D(g, x, y, w, h * 0.7, shade(bodyColor, -0.1), 6, 0.2);
  // Seat base
  drawBox3D(g, x + 4, y + h * 0.55, w - 8, h * 0.45, bodyColor, 4, 0.2);
  // Cushions (2 or 3)
  const cushionW = (w - 16) / 2;
  for (let i = 0; i < 2; i++) {
    const cx = x + 6 + i * (cushionW + 4);
    drawBox3D(g, cx, y + h * 0.62, cushionW, h * 0.28, cushionColor, 4, 0.15);
  }
  // Armrests
  drawBox3D(g, x, y + h * 0.3, 8, h * 0.7, shade(bodyColor, -0.15), 4, 0.2);
  drawBox3D(g, x + w - 8, y + h * 0.3, 8, h * 0.7, shade(bodyColor, -0.15), 4, 0.2);
}

/** A 3D plant in a pot. */
export function drawPlant(
  g: Graphics,
  cx: number,
  baseY: number,
  potColor: number = 0xb88a4a,
  leafColor: number = 0x3a8a3a
): void {
  const potW = 24;
  const potH = 18;
  // Soft shadow
  drawSoftShadow(g, cx, baseY + 2, potW * 0.7, 4, 0.25);
  // Pot (cylinder, slightly tapered)
  const potTop = baseY - potH;
  g.moveTo(cx - potW / 2, potTop);
  g.lineTo(cx - potW / 2 + 2, baseY);
  g.lineTo(cx + potW / 2 - 2, baseY);
  g.lineTo(cx + potW / 2, potTop);
  g.closePath();
  g.fill(potColor);
  // Pot rim
  g.ellipse(cx, potTop, potW / 2, 3).fill(shade(potColor, 0.15));
  g.ellipse(cx, potTop, potW / 2 - 1, 2.5).fill(shade(potColor, -0.1));
  // Leaves: clusters of small ellipses
  drawLeafCluster(g, cx, potTop - 2, leafColor);
}

/** Helper for plant leaves. */
function drawLeafCluster(
  g: Graphics,
  cx: number,
  baseY: number,
  color: number
): void {
  // Stem
  g.rect(cx - 1, baseY - 8, 2, 8).fill(0x3a6a2a);
  // 6 leaf "blades" fanning out
  const blades: [number, number, number][] = [
    [-12, -10, -0.3],
    [-7, -18, -0.1],
    [0, -22, 0.2],
    [7, -18, 0.4],
    [12, -10, 0.5],
    [-2, -14, 0.1],
  ];
  for (const [dx, dy, lighten] of blades) {
    g.ellipse(cx + dx, baseY + dy, 4, 9).fill(shade(color, lighten));
    // Highlight
    g.ellipse(cx + dx - 1, baseY + dy - 1, 2, 4)
      .fill({ color: 0xffffff, alpha: 0.25 });
  }
}

/** A 3D pendant light bulb hanging from a wire. */
export function drawPendantLight(
  g: Graphics,
  cx: number,
  y: number,
  wireLen: number,
  bulbColor: number = 0xfff0a0
): void {
  // Wire
  g.rect(cx - 0.5, y, 1, wireLen).fill(0x222222);
  // Bulb (sphere)
  const bulbR = 6;
  drawSphere(g, cx, y + wireLen + bulbR, bulbR, bulbColor);
  // Glow halo
  g.ellipse(cx, y + wireLen + bulbR, bulbR * 2.5, bulbR * 2)
    .fill({ color: bulbColor, alpha: 0.2 });
  g.ellipse(cx, y + wireLen + bulbR, bulbR * 1.6, bulbR * 1.2)
    .fill({ color: bulbColor, alpha: 0.3 });
}

/** A 3D counter (café, kitchen). */
export function drawCounter(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  bodyColor: number,
  topColor: number
): void {
  // Shadow
  drawSoftShadow(g, x + w / 2, y + h + 2, w * 0.5, 4, 0.25);
  // Body
  drawBox3D(g, x, y, w, h, bodyColor, 4, 0.2);
  // Counter top (lighter, thinner)
  drawBox3D(g, x - 2, y - 4, w + 4, 6, topColor, 2, 0.15);
}

/** A simple 3D building (town skyline). */
export function drawBuilding(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  wallColor: number,
  roofColor?: number
): void {
  // Shadow on the right
  g.rect(x + w, y + 4, 3, h).fill({ color: 0x000000, alpha: 0.2 });
  // Wall (with vertical gradient)
  vGradient(g, x, y, w, h, shade(wallColor, 0.1), shade(wallColor, -0.15));
  // Windows: grid
  const cols = Math.max(2, Math.floor(w / 16));
  const rows = Math.max(2, Math.floor(h / 20));
  const winW = (w - 4) / cols - 2;
  const winH = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 2 + c * (winW + 2);
      const wy = y + 4 + r * 14;
      // Lit/unlit: deterministic by (r + c) parity
      const lit = ((r * 7 + c * 11) % 3) !== 0;
      g.rect(wx, wy, winW, winH).fill(
        lit ? 0xfff0a0 : 0x4a4a52
      );
    }
  }
  // Door at the bottom
  g.rect(x + w / 2 - 4, y + h - 12, 8, 12).fill(0x3a2614);
  g.ellipse(x + w / 2 + 2, y + h - 6, 0.7, 0.7).fill(0xe8d999);
  // Optional roof
  if (roofColor != null) {
    drawCone(g, x + w / 2, y, w / 2 + 4, 12, roofColor);
  }
}

/** A streetlight: pole + lamp head. */
export function drawStreetlight(
  g: Graphics,
  cx: number,
  baseY: number,
  lampColor: number = 0xfff0a0
): void {
  // Pole
  const poleH = 70;
  drawCylinder(g, cx - 2, baseY - poleH, 4, poleH, 0x2a2a2a);
  // Arm
  g.rect(cx, baseY - poleH, 12, 2).fill(0x2a2a2a);
  // Lamp head
  const lx = cx + 12;
  const ly = baseY - poleH;
  drawSphere(g, lx, ly + 3, 4, lampColor);
  // Glow
  g.ellipse(lx, ly + 3, 10, 12).fill({ color: lampColor, alpha: 0.15 });
  // Base
  g.roundRect(cx - 5, baseY - 3, 10, 4, 1).fill(0x4a4a4a);
}

/** Helper: shade a color. factor in [-1, 1]; positive = lighter, negative = darker. */
export function shade(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const lerp = (c: number) => {
    if (factor >= 0) return c + Math.round((255 - c) * factor);
    return c + Math.round(c * factor);
  };
  return (lerp(r) << 16) | (lerp(g) << 8) | lerp(b);
}

/** Helper: linear interpolate between two colors. */
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const gg = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (gg << 8) | bl;
}

/** Helper: linear interpolate between two floats. */
function lerpF(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
