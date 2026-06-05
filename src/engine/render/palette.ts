// Color palettes. All colors are 24-bit RGB hex values for PixiJS.

export const SKIN_COLORS = [
  0xfde7d3, // pale
  0xf8d4a8, // light
  0xeec097, // fair
  0xe2a574, // peach
  0xcc8b5a, // tan
  0xa86b3e, // olive
  0x7d4d2a, // brown
  0x553218, // deep
];

export const HAIR_COLORS = [
  0x1a1a1a, // black
  0x3a2614, // dark brown
  0x6b3e1f, // brown
  0x8b3a1e, // auburn
  0xd6a93f, // blonde
  0xe8d999, // platinum
  0xc33b22, // red
  0xe879a9, // pink
  0x4a6cc2, // blue
  0x3a8a4d, // green
  0xe8e6e0, // white
  0x5b3a8a, // purple
];

export const OUTFIT_COLORS = [
  0xd04848, // tomato
  0xe08838, // orange
  0xd4a73a, // mustard
  0xe6d34a, // lemon
  0x7ab348, // lime
  0x3a8a4d, // forest
  0x3a9a8a, // teal
  0x4a8fd6, // sky
  0x2a4a7a, // navy
  0x7a4a8a, // plum
  0xc04a8a, // magenta
  0xe87aaa, // pink
];

export const ACCENT_COLORS = [
  0xf0e2c2, // cream
  0xc8a87a, // tan
  0x888880, // stone
  0x3a3a3a, // charcoal
  0xe8e8e0, // white
  0x1a1a1a, // black
];

export const OUTLINE = 0x0a0a14;

/** Convenience: pick a stable random index in [0, n) using a seed string. */
export function pickIndex(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % n;
}

/** Pick from one of the palettes, wrapping safely. */
export function pickColor(
  palette: number[],
  index: number
): number {
  return palette[((index % palette.length) + palette.length) % palette.length];
}
