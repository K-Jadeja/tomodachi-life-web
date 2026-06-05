// Tomo Island overworld — TRUE Pokémon Black/White style.
//
// Reference: B/W's Nuvema Town / Route 1. Camera looks down at ~45°:
//   - You see the TOPS of grass, roofs, and the SOUTH/EAST walls of buildings.
//   - Buildings are drawn as 3D-projected boxes using a 45° iso projection
//     baked into the geometry (front wall rect + right side parallelogram
//     + roof parallelogram + gable triangle). The worldLayer is NOT squished
//     — the iso projection lives in this file.
//   - Path is a flat tan/cream DIRT strip, no cobble, no elevation.
//   - Top of the screen has a row of cone-shaped (Christmas-tree) trees
//     forming a border.
//   - Bottom of the screen has a strip of blue water with a wooden bridge.
//   - Each building has a wooden signpost in front of it (B/W style).
//   - No sky band, no lamps, no flowers, no fences. Clean and minimal.
//
// The world is 480x272. Camera fixed (no scrolling). 5 buildings visible
// at once. Camera follows the selected Tomodachi on the overworld.

import { Graphics } from 'pixi.js';
import { drawSoftShadow, shade } from '../../../engine/render/world3d';

// World is laid out on a 16×16 tile grid (B/W standard).
export const OVERWORLD_TILE = 16;
export const OVERWORLD_W = 480;                          // 30 tiles
export const OVERWORLD_H = 272;                          // 17 tiles
export const OVERWORLD_W_TILES = OVERWORLD_W / OVERWORLD_TILE; // 30
export const OVERWORLD_H_TILES = OVERWORLD_H / OVERWORLD_TILE; // 17
export const OVERWORLD_GROUND_Y = 200;

// === Collision mask ============================================================
// 0 = walkable, 1 = wall. Indexed as WALLS[ty][tx].
// Hand-painted to match the visual buildings + water.
const WALLS: number[][] = (() => {
  const g: number[][] = [];
  for (let ty = 0; ty < OVERWORLD_H_TILES; ty++) {
    g.push(new Array(OVERWORLD_W_TILES).fill(0));
  }
  const wall = (tx: number, ty: number): void => {
    if (tx < 0 || ty < 0 || tx >= OVERWORLD_W_TILES || ty >= OVERWORLD_H_TILES) return;
    g[ty][tx] = 1;
  };
  const fill = (x0: number, y0: number, x1: number, y1: number): void => {
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) wall(tx, ty);
  };
  // Apartment (cx=60, baseY=200) — walls in 2×2 around (3, 11); approach tile (3, 12) is walkable
  fill(2, 10, 5, 11);
  // Café (cx=140, baseY=165) — walls in 2×2 around (8, 9); approach tiles 10-11 walkable
  fill(7, 8, 10, 9);
  // Park gate (cx=240, baseY=200) — walls at 3×1 front, approach tile 12 walkable
  fill(13, 10, 17, 11);
  // Town building (cx=340, baseY=100) — walls 3×4 (tall, at the back); approach tile 6 walkable
  fill(19, 2, 22, 5);
  // Beach sign (cx=420, baseY=195) — walls 2×2; approach tile 12 walkable
  fill(24, 10, 28, 11);
  // Cone trees at the top (border)
  const topTrees: Array<[number, number]> = [
    [0, 0], [1, 0], [2, 0],
    [5, 0], [6, 0],
    [9, 0], [10, 0],
    [13, 0], [14, 0],
    [17, 0], [18, 0],
    [22, 0], [23, 0],
    [26, 0], [27, 0],
    [28, 0], [29, 0],
  ];
  for (const [tx, ty] of topTrees) wall(tx, ty);
  // Water strip at the bottom
  for (let tx = 0; tx < OVERWORLD_W_TILES; tx++) {
    wall(tx, 16);
  }
  // A few background trees (single tile blockers)
  const bgTrees: Array<[number, number]> = [
    [3, 4], [8, 4], [16, 3], [25, 4],
  ];
  for (const [tx, ty] of bgTrees) wall(tx, ty);
  return g;
})();

/** True if the tile at (tx, ty) is walkable. */
export function isTileWalkable(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= OVERWORLD_W_TILES || ty >= OVERWORLD_H_TILES) return false;
  return WALLS[ty][tx] === 0;
}

/** True if the world point (x, y) is walkable (checks the tile under the feet). */
export function isWalkable(x: number, y: number): boolean {
  return isTileWalkable(worldToTileX(x), worldToTileY(y));
}

/** World x → tile x. */
export function worldToTileX(x: number): number {
  return Math.floor(x / OVERWORLD_TILE);
}
/** World y → tile y. */
export function worldToTileY(y: number): number {
  return Math.floor(y / OVERWORLD_TILE);
}
/** Tile x → world x (center of the tile). */
export function tileToWorldX(tx: number): number {
  return tx * OVERWORLD_TILE + OVERWORLD_TILE / 2;
}
/** Tile y → world y (center of the tile). */
export function tileToWorldY(ty: number): number {
  return ty * OVERWORLD_TILE + OVERWORLD_TILE / 2;
}

/** Snap a world point to the nearest walkable tile center. */
export function snapToWalkable(x: number, y: number): { x: number; y: number } {
  let tx = worldToTileX(x);
  let ty = worldToTileY(y);
  if (isTileWalkable(tx, ty)) return { x: tileToWorldX(tx), y: tileToWorldY(ty) };
  for (let r = 1; r <= 3; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        if (isTileWalkable(tx + dx, ty + dy)) {
          return { x: tileToWorldX(tx + dx), y: tileToWorldY(ty + dy) };
        }
      }
    }
  }
  return { x: tileToWorldX(tx), y: tileToWorldY(ty) };
}

/** One clickable building on the overworld. */
export interface BuildingNode {
  enters: 'apartment' | 'beach' | 'park' | 'cafe' | 'town';
  label: string;
  x: number;
  y: number;
  radius: number;
}

/** All 5 building entry points. Positions match the draw function. */
export const BUILDING_NODES: BuildingNode[] = [
  { enters: 'apartment', label: 'Home',  x:  60, y: 200, radius: 28 },
  { enters: 'cafe',      label: 'Café',  x: 140, y: 165, radius: 26 },
  { enters: 'park',      label: 'Park',  x: 240, y: 200, radius: 28 },
  { enters: 'town',      label: 'Town',  x: 340, y: 100, radius: 30 },
  { enters: 'beach',     label: 'Beach', x: 420, y: 195, radius: 28 },
];

/** Default spawn for new tomodachis on the overworld. On a tile center. */
export const OVERWORLD_SPAWN = { x: 88, y: 200 };

// === Iso projection helpers ====================================================
// 45° camera: depth `d` maps to screen offset (+d*0.707, -d*0.707).
// (Right and up — the building extends back-up-right from its front face.)
const ISO_C = 0.7071;

export function drawOverworld(g: Graphics, time: number): void {
  // === Layer 1: Grass field (the entire floor, no sky band) ===
  g.rect(0, 0, OVERWORLD_W, OVERWORLD_H).fill(0x7ab348);
  // Subtle grass texture
  for (let i = 0; i < 220; i++) {
    const x = ((i * 53) % OVERWORLD_W);
    const y = ((i * 29) % OVERWORLD_H);
    g.rect(x, y, 1, 1).fill({ color: 0x4a8a2a, alpha: 0.4 });
  }
  for (let i = 0; i < 90; i++) {
    const x = ((i * 71 + 13) % OVERWORLD_W);
    const y = ((i * 41 + 7) % OVERWORLD_H);
    g.rect(x, y, 1, 1).fill({ color: 0x9bc05a, alpha: 0.4 });
  }
  // Darker grass "patches" for variety
  for (let i = 0; i < 12; i++) {
    const cx = 20 + ((i * 41) % 440);
    const cy = 30 + ((i * 23) % 200);
    g.ellipse(cx, cy, 14, 6).fill({ color: 0x5a9a3a, alpha: 0.4 });
  }

  // === Layer 2: Cone tree border at the top (B/W Christmas tree style) ===
  drawConeTreeBorder(g);

  // === Layer 3: Background (north-of-buildings) trees ===
  drawBgTree(g,  60,  58, 1.0);
  drawBgTree(g, 200,  60, 1.0);
  drawBgTree(g, 285,  56, 1.0);
  drawBgTree(g, 460,  62, 0.9);

  // === Layer 4: Smooth tan dirt path (no cobble dots, no stone) ===
  drawDirtPath(g);

  // === Layer 5: Buildings (back-to-front, north to south) ===
  drawTown(g, 340, 100);
  drawCafe(g, 140, 165);
  drawApartment(g, 60, 200);
  drawParkGate(g, 240, 200);
  drawBeachSign(g, 420, 195);

  // === Layer 6: Wooden sign posts in front of each building ===
  for (const node of BUILDING_NODES) {
    drawSignpost(g, node.x + 2, node.y + 4, node.label);
  }

  // === Layer 7: Water strip at the bottom (ocean/pond) ===
  drawWater(g, 0, 252, OVERWORLD_W, 20);
  // Wooden bridge in the middle, spanning the water strip
  drawWoodenBridge(g, 220, 252, 50);

  void time; // reserved for water animation
}

// === Cone tree border (B/W style) =============================================

function drawConeTreeBorder(g: Graphics): void {
  // A row of small cone-shaped trees along the very top of the screen.
  const positions: Array<[number, number, number]> = [
    [ 12, 36, 1.0],
    [ 44, 38, 0.9],
    [ 76, 36, 1.0],
    [108, 40, 0.85],
    [140, 36, 1.0],
    [172, 38, 0.95],
    [204, 36, 1.0],
    [236, 40, 0.85],
    [268, 36, 1.0],
    [300, 38, 0.95],
    [332, 36, 1.0],
    [364, 40, 0.85],
    [396, 36, 1.0],
    [428, 38, 0.95],
    [460, 36, 1.0],
  ];
  for (const [x, baseY, scale] of positions) {
    drawConeTree(g, x, baseY, 9 * scale, 22 * scale, 0x3a8a4a);
  }
}

/** A single B/W-style cone tree: triangular foliage + small trunk. */
function drawConeTree(
  g: Graphics,
  cx: number,
  baseY: number,
  halfW: number,
  height: number,
  color: number
): void {
  // Ground shadow
  drawSoftShadow(g, cx, baseY + 1, halfW * 0.7, 1.5, 0.3);
  // Trunk (small brown nub at the base)
  g.rect(cx - 1, baseY - 3, 2, 3).fill(0x5a3a1a);
  // Bottom layer (widest)
  g.moveTo(cx, baseY - 8);
  g.lineTo(cx + halfW, baseY - 2);
  g.lineTo(cx - halfW, baseY - 2);
  g.closePath();
  g.fill(color);
  // Middle layer
  g.moveTo(cx, baseY - 14);
  g.lineTo(cx + halfW * 0.75, baseY - 8);
  g.lineTo(cx - halfW * 0.75, baseY - 8);
  g.closePath();
  g.fill(shade(color, 0.05));
  // Top layer (narrowest, pointed)
  g.moveTo(cx, baseY - height);
  g.lineTo(cx + halfW * 0.45, baseY - 14);
  g.lineTo(cx - halfW * 0.45, baseY - 14);
  g.closePath();
  g.fill(shade(color, 0.1));
  // Small highlight on the left side of the bottom layer
  g.moveTo(cx, baseY - 8);
  g.lineTo(cx - halfW * 0.4, baseY - 2);
  g.lineTo(cx - halfW * 0.2, baseY - 2);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.18 });
}

function drawBgTree(g: Graphics, cx: number, baseY: number, scale: number): void {
  // A larger cone tree (background, behind the buildings)
  drawConeTree(g, cx, baseY, 14 * scale, 32 * scale, 0x2a6a3a);
}

// === Dirt path =================================================================

function drawDirtPath(g: Graphics): void {
  // Main horizontal path along y=200, full width. Smooth tan, no cobble dots.
  const pathY = 200;
  const pathH = 14;
  // Soft shadow on the south edge of the path
  drawSoftShadow(g, OVERWORLD_W / 2, pathY + pathH / 2 + 2, OVERWORLD_W / 2, 1, 0.15);
  // Main path body (smooth tan)
  g.rect(0, pathY - pathH / 2, OVERWORLD_W, pathH).fill(0xd8b890);
  // Slight color variation (subtle, no cobble)
  g.rect(0, pathY - pathH / 2, OVERWORLD_W, 2).fill({ color: 0xe8c8a0, alpha: 0.6 });
  g.rect(0, pathY + pathH / 2 - 2, OVERWORLD_W, 2).fill({ color: 0xb89870, alpha: 0.6 });
  // Fork north to the town building (vertical strip from path to town)
  g.rect(336, 110, 8, pathY - 110 - pathH / 2).fill(0xd8b890);
  g.rect(336, 110, 8, 1).fill({ color: 0xe8c8a0, alpha: 0.6 });
}

// === Water + bridge ===========================================================

function drawWater(g: Graphics, x: number, y: number, w: number, h: number): void {
  // Sandy edge on the top of the water (beach strip)
  g.rect(x, y - 1, w, 2).fill(0xe8c98a);
  // Water body (solid B/W blue, no gradients)
  g.rect(x, y, w, h).fill(0x4a8fc8);
  // Darker bottom band
  g.rect(x, y + h - 3, w, 3).fill(0x2a5a8a);
  // A few small white wave tick marks
  for (let i = 0; i < 8; i++) {
    const wx = x + 20 + i * 56 + (i % 2) * 12;
    const wy = y + 4 + (i % 2) * 6;
    g.rect(wx, wy, 4, 1).fill({ color: 0xffffff, alpha: 0.6 });
  }
}

function drawWoodenBridge(g: Graphics, x: number, y: number, w: number): void {
  // A small wooden bridge spanning the water (B/W style).
  const bridgeH = 10;
  // Shadow under the bridge
  drawSoftShadow(g, x + w / 2, y + bridgeH + 2, w / 2, 1, 0.3);
  // Planks
  g.rect(x, y, w, bridgeH).fill(0x8a5a2a);
  // Plank lines (horizontal seams)
  g.rect(x, y + 2, w, 1).fill({ color: 0x5a3a1a, alpha: 0.5 });
  g.rect(x, y + 5, w, 1).fill({ color: 0x5a3a1a, alpha: 0.5 });
  g.rect(x, y + 8, w, 1).fill({ color: 0x5a3a1a, alpha: 0.5 });
  // Side rails (low posts on each side)
  g.rect(x, y - 1, 2, bridgeH + 1).fill(0x6b3a1a);
  g.rect(x + w - 2, y - 1, 2, bridgeH + 1).fill(0x6b3a1a);
  // Top highlight
  g.rect(x + 2, y, w - 4, 1).fill({ color: 0xc8a070, alpha: 0.7 });
}

// === Buildings (true 45° iso-projected 3D boxes) =============================

/**
 * Draw a B/W-style iso house. The "front" face is at (cx, baseY) — center
 * of the building's front wall on the ground. The "back" of the building
 * is offset by (+d*0.707, -d*0.707) so the right side wall and roof
 * slope up-and-right.
 */
function drawIsoBox(
  g: Graphics,
  cx: number,           // center x of the front face
  baseY: number,        // ground y of the front face
  width: number,        // front wall width
  wallH: number,        // wall height
  depth: number,        // how far back the building extends
  wallColor: number,
  roofColor: number,
  roofH: number = 8,    // gable peak height
): void {
  // Iso offsets (depth projects up-and-right at 45°)
  const dx = depth * ISO_C;
  const dy = depth * ISO_C;

  const halfW = width / 2;
  const frontX0 = cx - halfW;
  const frontX1 = cx + halfW;
  const wallTopY = baseY - wallH;
  const backX0 = frontX0 + dx;
  const backX1 = frontX1 + dx;
  const backTopY = wallTopY - dy;
  const peakY = wallTopY - roofH;
  const backPeakY = backTopY - roofH;

  // Soft ground shadow
  drawSoftShadow(g, cx + dx / 2, baseY + 1, width * 0.55, 2, 0.3);

  // === 1. Right side wall (parallelogram, in shadow) ===
  g.moveTo(frontX1, wallTopY);
  g.lineTo(backX1, backTopY);
  g.lineTo(backX1, baseY - dy);
  g.lineTo(frontX1, baseY);
  g.closePath();
  g.fill(shade(wallColor, -0.18));

  // === 2. Front wall (rectangle, solid color) ===
  g.rect(frontX0, wallTopY, width, wallH).fill(wallColor);

  // === 3. Right roof slope (parallelogram) ===
  g.moveTo(frontX1, wallTopY);
  g.lineTo(cx, peakY);
  g.lineTo(cx + dx, backPeakY);
  g.lineTo(backX1, backTopY);
  g.closePath();
  g.fill(roofColor);

  // === 4. Front gable face (triangle above front wall) ===
  g.moveTo(frontX0, wallTopY);
  g.lineTo(cx, peakY);
  g.lineTo(frontX1, wallTopY);
  g.closePath();
  g.fill(shade(roofColor, -0.1));

  // === 5. Subtle outline (the "line art" of B/W) ===
  g.moveTo(frontX0, baseY);
  g.lineTo(frontX1, baseY);
  g.stroke({ color: 0x000000, alpha: 0.18, width: 0.5 });
  g.moveTo(frontX1, wallTopY);
  g.lineTo(frontX1, baseY);
  g.stroke({ color: 0x000000, alpha: 0.18, width: 0.5 });
  g.moveTo(frontX0, wallTopY);
  g.lineTo(cx, peakY);
  g.lineTo(cx + dx, backPeakY);
  g.lineTo(backX1, backTopY);
  g.stroke({ color: 0x000000, alpha: 0.25, width: 0.5 });
}

// === Specific buildings =======================================================

function drawApartment(g: Graphics, cx: number, baseY: number): void {
  // A small, friendly home: warm cream walls, red roof, blue door.
  drawIsoBox(g, cx, baseY, 38, 28, 14, 0xf0d8a0, 0xc04040, 7);
  // Door (centered on front wall)
  const doorW = 7;
  const doorH = 12;
  g.rect(cx - doorW / 2, baseY - doorH, doorW, doorH).fill(0x6b4a2a);
  g.ellipse(cx + 1, baseY - doorH / 2, 0.7, 0.7).fill(0xe8d999);
  // Windows (2 on front wall)
  for (const wx of [cx - 12, cx + 6]) {
    g.rect(wx, baseY - 22, 6, 6).fill(0x88c4e8);
    g.rect(wx, baseY - 22, 6, 1).fill({ color: 0xffffff, alpha: 0.4 });
    g.rect(wx + 2.5, baseY - 22, 1, 6).fill(0xf0d8a0);
  }
  // Chimney
  g.rect(cx + 12, baseY - 30, 4, 8).fill(0x6b3a1a);
  g.rect(cx + 12, baseY - 30, 4, 1).fill({ color: 0xffffff, alpha: 0.2 });
}

function drawCafe(g: Graphics, cx: number, baseY: number): void {
  // Café: cream walls, blue roof, striped awning over the shop window.
  drawIsoBox(g, cx, baseY, 36, 26, 12, 0xfff0d0, 0x4078a8, 6);
  // Awning (red/white stripes) on the lower front wall
  const awY = baseY - 12;
  for (let i = 0; i < 6; i++) {
    g.rect(cx - 18 + i * 6, awY, 6, 4)
      .fill(i % 2 === 0 ? 0xd04848 : 0xffffff);
  }
  // Door (right side)
  g.rect(cx + 6, baseY - 14, 8, 14).fill(0x6b4a2a);
  g.ellipse(cx + 11, baseY - 7, 0.7, 0.7).fill(0xe8d999);
  // Big shop window (left side)
  g.rect(cx - 16, baseY - 22, 12, 10).fill(0x88c4e8);
  g.rect(cx - 16, baseY - 22, 12, 1).fill({ color: 0xffffff, alpha: 0.4 });
  g.rect(cx - 10, baseY - 22, 1, 10).fill(0xfff0d0);
  // Small coffee-cup icon above the door
  g.ellipse(cx + 10, baseY - 16, 2.5, 1.5).fill(0xfff8e0);
  g.rect(cx + 8, baseY - 18, 4, 2).fill(0xfff8e0);
}

function drawParkGate(g: Graphics, cx: number, baseY: number): void {
  // Park: an archway entrance with a green sign on top.
  const w = 48;
  const h = 30;
  const x = cx - w / 2;
  const y = baseY - h;
  // Stone columns (left + right) drawn as iso boxes
  drawIsoBox(g, x + 4, baseY, 6, h, 6, 0xa0a0a8, 0x808088, 0);
  drawIsoBox(g, x + w - 4, baseY, 6, h, 6, 0xa0a0a8, 0x808088, 0);
  // Horizontal arch beam on top
  g.rect(x, y, w, 6).fill(0x6a6a72);
  g.rect(x, y, w, 1).fill({ color: 0xffffff, alpha: 0.3 });
  // Green park sign across the beam
  g.rect(x + 6, y + 6, w - 12, 8).fill(0x3a8a3d);
  g.rect(x + 6, y + 6, w - 12, 1).fill({ color: 0xffffff, alpha: 0.4 });
  // "PARK" text suggestion (2 white horizontal lines)
  g.rect(x + 10, y + 9, w - 20, 1).fill({ color: 0xfff0c0, alpha: 0.7 });
  g.rect(x + 10, y + 12, w - 20, 1).fill({ color: 0xfff0c0, alpha: 0.5 });
  // Park glimpse through the arch
  g.rect(x + 8, y + 16, w - 16, h - 16).fill(0x6ab85a);
  drawConeTree(g, cx - 6, baseY - 4, 5, 12, 0x4a9a4a);
  drawConeTree(g, cx + 8, baseY - 4, 4, 10, 0x3a8a3d);
}

function drawTown(g: Graphics, cx: number, baseY: number): void {
  // Town: tall clock-tower-style building with a spire.
  const wallH = 56;
  drawIsoBox(g, cx, baseY, 36, wallH, 12, 0xc8b890, 0x804020, 8);
  // Clock face on the upper third of the front wall
  g.ellipse(cx, baseY - wallH + 14, 6, 6).fill(0xfff0a0);
  g.ellipse(cx, baseY - wallH + 14, 5, 5).fill(0xfff8e0);
  g.rect(cx - 0.4, baseY - wallH + 8, 0.8, 6).fill(0x1a1a1a);
  g.rect(cx, baseY - wallH + 14, 4, 0.7).fill(0x1a1a1a);
  g.ellipse(cx, baseY - wallH + 14, 0.8, 0.8).fill(0x1a1a1a);
  // Spire on top of the roof (a small cone)
  g.moveTo(cx, baseY - wallH - 16);
  g.lineTo(cx + 5, baseY - wallH - 8);
  g.lineTo(cx - 5, baseY - wallH - 8);
  g.closePath();
  g.fill(0x6a4a4a);
  g.ellipse(cx, baseY - wallH - 16, 0.8, 0.8).fill(0xe8d999);
  // Door at the base
  g.rect(cx - 5, baseY - 14, 10, 14).fill(0x6b4a2a);
  g.ellipse(cx + 2, baseY - 7, 0.8, 0.8).fill(0xe8d999);
}

function drawBeachSign(g: Graphics, cx: number, baseY: number): void {
  // Beach: a driftwood sign on a sandy patch with a beach umbrella.
  const w = 32;
  const h = 24;
  const x = cx - w / 2;
  const y = baseY - h;
  // Sandy patch on the ground
  g.ellipse(cx, baseY + 1, w / 2 + 4, 4).fill(0xe8c98a);
  g.ellipse(cx, baseY, w / 2 + 2, 3).fill(0xfff0c0);
  // Two posts
  g.rect(x + 6, y + 10, 3, h - 10).fill(0x6b3a1a);
  g.rect(x + w - 9, y + 10, 3, h - 10).fill(0x6b3a1a);
  // Sign plate
  g.rect(x + 2, y + 4, w - 4, 12).fill(0x8a5a2a);
  g.rect(x + 2, y + 4, w - 4, 1).fill({ color: 0xfff0c0, alpha: 0.6 });
  g.rect(x + 2, y + 15, w - 4, 1).fill({ color: 0x5a3a1a, alpha: 0.6 });
  // Two horizontal "lines" of text
  g.rect(x + 6, y + 8, w - 12, 1).fill({ color: 0xfff0c0, alpha: 0.7 });
  g.rect(x + 6, y + 12, w - 12, 1).fill({ color: 0xfff0c0, alpha: 0.5 });
  // Beach umbrella behind (a red cone)
  g.moveTo(cx + 12, y + 6);
  g.lineTo(cx + 20, y + 18);
  g.lineTo(cx + 4, y + 18);
  g.closePath();
  g.fill(0xd04848);
  g.moveTo(cx + 12, y + 6);
  g.lineTo(cx + 4, y + 18);
  g.lineTo(cx + 8, y + 18);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.2 });
  g.rect(cx + 11, y + 18, 1, h - 18).fill(0x8a5a2a);
  // Surfboard leaning against the sign
  g.roundRect(cx - 8, y + 4, 3, h - 6, 1.5).fill(0xe8e0d0);
  g.roundRect(cx - 8, y + 4, 3, h - 6, 1.5).stroke({ color: 0x4a8fc8, width: 0.5 });
}

// === Wooden sign post (in front of each building) =============================

function drawSignpost(g: Graphics, cx: number, baseY: number, label: string): void {
  void label; // label rendered as text overlay in the HUD layer
  // Post
  drawSoftShadow(g, cx, baseY + 1, 4, 1, 0.2);
  g.rect(cx - 0.5, baseY - 8, 1, 8).fill(0x6b3a1a);
  // Sign plate
  g.rect(cx - 7, baseY - 14, 14, 6).fill(0xc8a070);
  g.rect(cx - 7, baseY - 14, 14, 1).fill({ color: 0xffffff, alpha: 0.3 });
  g.rect(cx - 7, baseY - 9, 14, 1).fill({ color: 0x5a3a1a, alpha: 0.5 });
  // Small red dot
  g.ellipse(cx, baseY - 11, 0.8, 0.8).fill(0xd04848);
}
