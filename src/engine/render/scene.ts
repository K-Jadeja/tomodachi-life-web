// Scene manager. Owns the PixiJS Application, the background, the characters,
// and the day/night overlay. Each frame:
//   - rebuilds background if the active location changed
//   - updates each character's animated parts (eyes, mouth, position)
//   - reorders by y for fake depth
//   - updates the camera transform (follow + tilt)
//
// The scene manager is location-agnostic — it reads from the locations
// registry. Hosts register their locations on boot.
//
// Camera model:
//   The world layer (bg + fg) is wrapped in a single Container with a
//   center pivot. The camera position drives that container's position so
//   the camera's target sits at the screen center. The day/night overlay
//   stays on the root (it's a screen-space tint), not the world.
//
//   A "tilt" value (0..1) vertically compresses the world to fake a
//   Pokémon B/W-style downward camera. 0 = flat 2D, 1 = ~30% compression.

import { Application, Container, Graphics } from 'pixi.js';
import { Tomodachi } from '../core/types';
import { getRegisteredLocation } from './locations-registry';
import { buildCharacter, drawEyesState, drawMouthState, CHARACTER_WIDTH, CHARACTER_HEIGHT } from '../sprites/character';
import { applyDayNight } from './effects';
import { BASE_W, BASE_H } from './app';

/** Hook the scene needs to read state. Provided by the host. */
export interface SceneStateSource {
  getCurrentLocation(): string;
  getTomodachis(): Tomodachi[];
  /** Optional. If present, the scene applies a day/night overlay using this hour. */
  getHour?(): number;
  /** Optional. ID of the Tomodachi the camera should follow. Null = no follow. */
  getFollowTargetId?(): string | null;
  /** Optional. 0..1 camera tilt (downward perspective compression). Default 0. */
  getTilt?(): number;
  /** Optional. World zoom factor. <1 zooms out, >1 zooms in. Default 1. */
  getZoom?(): number;
}

let app: Application | null = null;
let root: Container | null = null;
let worldLayer: Container | null = null;
let bgLayer: Graphics | null = null;
let fgLayer: Container | null = null;
let overlayLayer: Graphics | null = null;
let lastLocation: string | null = null;
let source: SceneStateSource | null = null;
const characterRigs = new Map<string, ReturnType<typeof buildCharacter>>();

// Camera state. Smooth-lerped toward target each frame.
const camera = { x: BASE_W / 2, y: BASE_H / 2 };
const cameraTarget = { x: BASE_W / 2, y: BASE_H / 2 };
const CAMERA_LERP = 0.15;

export interface InitSceneOptions {
  state: SceneStateSource;
}

export function initScene(application: Application, opts: InitSceneOptions): void {
  app = application;
  source = opts.state;
  root = application.stage;

  worldLayer = new Container();
  worldLayer.label = 'world';
  bgLayer = new Graphics();
  fgLayer = new Container();
  worldLayer.addChild(bgLayer);
  worldLayer.addChild(fgLayer);

  overlayLayer = new Graphics();
  root.addChild(worldLayer);
  root.addChild(overlayLayer);
}

export function update(): void {
  if (!app || !worldLayer || !bgLayer || !fgLayer || !overlayLayer || !source) return;
  const s = source;
  const location = s.getCurrentLocation();
  const loc = getRegisteredLocation(location);
  const groundY = loc?.groundY ?? 240;
  const worldW = loc?.worldWidth ?? BASE_W;
  const worldH = loc?.worldHeight ?? BASE_H;

  if (location !== lastLocation) {
    bgLayer.clear();
    // Clear any leftover child graphics (e.g. sub-graphics added by
    // helpers that wrap a rotated/translated shape via addChild).
    while (bgLayer.children.length > 0) {
      bgLayer.removeChildAt(0).destroy();
    }
    if (loc) {
      loc.draw(bgLayer, performance.now() / 1000);
    } else {
      // No location registered: draw a soft fallback so the canvas is never empty.
      bgLayer.rect(0, 0, worldW, worldH).fill(0x1a2030);
    }
    lastLocation = location;
    // Re-place characters with new groundY only for static locations
    // (overworld characters manage their own y via worldY → y).
    if (worldW <= BASE_W && worldH <= BASE_H) {
      for (const t of s.getTomodachis()) {
        t.y = groundY;
      }
    }
    // Snap the camera so we don't lerp across locations on a teleport.
    snapCameraToTarget();
  }

  // Ensure each Tomodachi has a rig
  const seenIds = new Set<string>();
  for (const t of s.getTomodachis()) {
    seenIds.add(t.id);
    if (!characterRigs.has(t.id)) {
      const rig = buildCharacter(t);
      rig.container.position.set(t.x, t.y - CHARACTER_HEIGHT + 4);
      fgLayer.addChild(rig.container);
      characterRigs.set(t.id, rig);
    }
  }
  // Remove rigs for deleted Tomodachis
  for (const [id, rig] of characterRigs) {
    if (!seenIds.has(id)) {
      fgLayer.removeChild(rig.container);
      rig.container.destroy({ children: true });
      characterRigs.delete(id);
    }
  }

  // Update each character
  const time = performance.now() / 1000;
  for (const t of s.getTomodachis()) {
    const rig = characterRigs.get(t.id);
    if (!rig) continue;
    // Position the rig so its feet are at (t.x, t.y). The rig frame is drawn
    // from y=0 (top of head) to y=CHARACTER_HEIGHT (bottom of feet).
    rig.container.position.set(t.x, t.y - CHARACTER_HEIGHT);
    // B/W billboard: never flip the sprite. The character faces the camera.
    // (The Tomodachi.facing field is still tracked for dialogue/UI hints but
    // is not used to flip the rig on the overworld.)

    // Eyes
    const eyeState: 0 | 1 | 2 = t.state === 'sleeping' ? 2 : t.blinkTimer < 0.1 ? 2 : 0;
    drawEyesState(rig.eyesL, rig.eyesR, t, eyeState);

    // Mouth: closed smile by default, talking animation when active
    let mouth: 0 | 1 | 2 | 3 | 4 = 0;
    if (t.state === 'talking') {
      mouth = (Math.floor(time * 8) % 2) === 0 ? 1 : 2;
    } else if (t.mood === 'sad') {
      mouth = 3;
    } else if (t.state === 'sleeping') {
      mouth = 0;
    } else {
      mouth = 0;
    }
    drawMouthState(rig.mouthG, t, mouth);
  }

  // Day/night: optional. Hosts that expose getHour() get the tint effect.
  overlayLayer.clear();
  const hour = source.getHour?.();
  if (typeof hour === 'number') {
    applyDayNight(overlayLayer, hour);
  }

  // Depth ordering
  fgLayer.children.sort((a, b) => (a.y + 0) - (b.y + 0));

  // === Camera ===
  // Resolve target.
  const followId = s.getFollowTargetId?.() ?? null;
  if (followId) {
    const t = s.getTomodachis().find((x) => x.id === followId);
    if (t) {
      cameraTarget.x = t.x;
      cameraTarget.y = t.y - CHARACTER_HEIGHT / 2;
    }
  } else {
    cameraTarget.x = worldW / 2;
    cameraTarget.y = worldH / 2;
  }

  // Clamp so camera does not show outside the world bounds.
  // The view is BASE_W x BASE_H centered on (camera.x, camera.y).
  const halfW = BASE_W / 2;
  const halfH = BASE_H / 2;
  cameraTarget.x = Math.max(halfW, Math.min(worldW - halfW, cameraTarget.x));
  cameraTarget.y = Math.max(halfH, Math.min(worldH - halfH, cameraTarget.y));
  // For worlds smaller than the view, lock to world center.
  if (worldW <= BASE_W) cameraTarget.x = worldW / 2;
  if (worldH <= BASE_H) cameraTarget.y = worldH / 2;

  // Lerp.
  camera.x += (cameraTarget.x - camera.x) * CAMERA_LERP;
  camera.y += (cameraTarget.y - camera.y) * CAMERA_LERP;

  // Apply transform.
  const tilt = clamp01(s.getTilt?.() ?? 0);
  const zoom = Math.max(0.1, s.getZoom?.() ?? 1);
  // B/W-style 3/4 camera: a strong vertical compression on the world layer
  // simulates a 45° downward-looking camera. At tilt=1 we'd squish by 0.5;
  // we cap at 0.55 in the host so the world still reads as walkable ground.
  const scaleY = (1 - tilt * 0.45) * zoom;
  const scaleX = zoom;
  worldLayer.pivot.set(camera.x, camera.y);
  worldLayer.position.set(BASE_W / 2, BASE_H / 2 + tilt * 12);
  worldLayer.scale.set(scaleX, scaleY);
}

function snapCameraToTarget(): void {
  camera.x = cameraTarget.x;
  camera.y = cameraTarget.y;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Click handler: find which character (if any) was clicked. */
export function pickCharacterAt(worldX: number, worldY: number): Tomodachi | null {
  if (!source) return null;
  const all = source.getTomodachis();
  // Iterate in reverse so the front character wins
  for (let i = all.length - 1; i >= 0; i--) {
    const t = all[i];
    const x0 = t.x - CHARACTER_WIDTH / 2;
    const x1 = t.x + CHARACTER_WIDTH / 2;
    const y0 = t.y - CHARACTER_HEIGHT;
    const y1 = t.y;
    if (worldX >= x0 && worldX <= x1 && worldY >= y0 && worldY <= y1) {
      return t;
    }
  }
  return null;
}

export function getApp(): Application | null { return app; }
export function getRootContainer(): Container | null { return root; }

export function refreshLocation(): void {
  lastLocation = null;
}

/** Map a screen pixel to a world pixel (after camera transform). */
export function screenToWorld(screenX: number, screenY: number): { x: number; y: number } | null {
  if (!app) return null;
  const rect = app.canvas.getBoundingClientRect();
  // Screen → base canvas (480x270)
  const cx = (screenX - rect.left) * (BASE_W / rect.width);
  const cy = (screenY - rect.top) * (BASE_H / rect.height);
  // Base canvas → world (undo the worldLayer transform).
  // worldLayer.position is (BASE_W/2, BASE_H/2), pivot is (camera.x, camera.y),
  // scale is (1, scaleY). The forward map is:
  //   screen = (world - pivot) * scale + position
  // Inverse:
  //   world  = (screen - position) / scale + pivot
  if (!worldLayer) return { x: cx, y: cy };
  const sx = worldLayer.scale.x || 1;
  const sy = worldLayer.scale.y || 1;
  const wx = (cx - BASE_W / 2) / sx + camera.x;
  const wy = (cy - BASE_H / 2) / sy + camera.y;
  return { x: wx, y: wy };
}
