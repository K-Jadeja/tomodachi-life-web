// Pixel-draw helpers. We compose sprites from string grids for easy authoring.
// Each character in the grid maps to a "key" (e.g. "skin", "hair"), and each
// key gets a concrete color from the per-frame tint object.

import { Graphics } from 'pixi.js';

export type TintMap = Record<string, number>;
export type KeyMap = Record<string, string>;

export interface PixelSheet {
  width: number;
  height: number;
  keys: KeyMap;
  rows: string[];
}

const SPACE_CHARS = new Set([' ', '.']);

/**
 * Draw a pixel-art sheet onto a Pixi Graphics, resolving keys to colors via
 * the tint map. Skips transparent cells. Horizontally adjacent same-color
 * pixels are coalesced into a single rect for performance.
 */
export function drawSheet(
  g: Graphics,
  sheet: PixelSheet,
  x0: number,
  y0: number,
  tints: TintMap
): void {
  for (let row = 0; row < sheet.rows.length; row++) {
    const r = sheet.rows[row];
    let runColor: number | null = null;
    let runStart = 0;
    let runLen = 0;

    const flush = () => {
      if (runColor != null && runLen > 0) {
        g.rect(x0 + runStart, y0 + row, runLen, 1).fill(runColor);
      }
      runColor = null;
      runLen = 0;
    };

    for (let col = 0; col < r.length; col++) {
      const ch = r[col];
      let color: number | null = null;
      if (!SPACE_CHARS.has(ch)) {
        const key = sheet.keys[ch];
        if (key && tints[key] != null) {
          color = tints[key];
        }
      }
      if (color === runColor) {
        runLen++;
      } else {
        flush();
        runColor = color;
        runStart = col;
        runLen = color == null ? 0 : 1;
      }
    }
    flush();
  }
}

/** Helper to make a key map. */
export function keys(map: Record<string, string>): KeyMap {
  return map;
}

/**
 * Build a small PixelSheet from a multi-line string template.
 * Each unique non-space character must be mapped via `keyMap`.
 */
export function sheet(
  keyMap: KeyMap,
  rows: string[]
): PixelSheet {
  let width = 0;
  for (const r of rows) {
    if (r.length > width) width = r.length;
  }
  return { width, height: rows.length, keys: keyMap, rows };
}

/** Simple solid rectangle fill (used for backgrounds, UI panels). */
export function fillRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number
): void {
  g.rect(x, y, w, h).fill(color);
}

/** Filled ellipse approximation via many thin rects (fast enough at small sizes). */
export function fillEllipse(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number
): void {
  // Use Pixi's built-in ellipse for clean look.
  g.ellipse(cx, cy, rx, ry).fill(color);
}

/** Stroke around an ellipse. */
export function strokeEllipse(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number,
  width = 1
): void {
  g.ellipse(cx, cy, rx, ry).stroke({ color, width });
}
