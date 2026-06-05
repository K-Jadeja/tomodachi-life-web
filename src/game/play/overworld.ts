// Overworld navigation. TRUE Pokémon Black/White style:
//
//   - The world is a 16×16 tile grid.
//   - Characters move 1 tile at a time with a smooth lerp between cells.
//   - Walking snaps to one of 4 directions (or no movement) — no diagonals.
//   - Each step is checked against a hand-painted collision mask.
//   - Billboard sprites (no facing flip) — the engine handles that.
//   - The camera tilts the world at 45° on the overworld (set in main.ts).
//
// API:
//   - setWorldTarget(t, x, y, enters?) — start walking toward a tile center.
//   - tickOverworld(t, dt) — lerp the character one cell at a time.
//   - enterBuilding(t, buildingId) — teleport from overworld to an interior.
//   - leaveBuilding(t) — return from an interior to the overworld.

import { Tomodachi } from '../../engine';
import { game, updateTomodachi, pushEvent } from '../state/state';
import { TomodachiInternal } from './types';
import {
  BUILDING_NODES, OVERWORLD_W, OVERWORLD_H, OVERWORLD_GROUND_Y,
  OVERWORLD_TILE, OVERWORLD_W_TILES, OVERWORLD_H_TILES,
  isTileWalkable, isWalkable, worldToTileX, worldToTileY,
  tileToWorldX, tileToWorldY, snapToWalkable,
} from '../content/locations/overworld';
import { GameLocationId } from '../content/locations';
import { rememberVisit, bumpLocationCount } from './memory';

/**
 * Tiles per second. B/W's player walks about 2.5 tiles/sec. Slower looks nicer
 * in our low-res viewport.
 */
export const OVERWORLD_WALK_TILES_PER_SEC = 3.5;
const OVERWORLD_WALK_SPEED = OVERWORLD_WALK_TILES_PER_SEC * OVERWORLD_TILE; // px/sec
const ARRIVAL_THRESHOLD_PX = 4;

/**
 * Two-position model (Nanousis / Pokémon pattern). Each character has a
 * "from" cell and a "to" cell. The visual position lerps between them.
 *
 * We keep these on TomodachiInternal so the engine doesn't have to know.
 */
interface OverworldMove {
  fromX: number; fromY: number;  // last tile center
  toX: number;   toY: number;    // tile center we're walking to
  /** 0..1 — how far we've lerped from `from` to `to`. */
  t: number;
  /** 4-direction facing while walking this step. 0 = no movement. */
  dir: 0 | 1 | 2 | 3 | 4; // 1=right, 2=left, 3=down, 4=up
}

type MoveBag = { _ovMove?: OverworldMove };
const setMove = (ext: TomodachiInternal, m: OverworldMove | undefined): void => {
  (ext as unknown as MoveBag)._ovMove = m;
};
const clearMove = (ext: TomodachiInternal): void => {
  (ext as unknown as MoveBag)._ovMove = undefined;
};

/** Set the world target for a Tomodachi. Pass `enters` to auto-enter on arrival. */
export function setWorldTarget(
  t: Tomodachi,
  x: number,
  y: number,
  enters?: GameLocationId,
): void {
  const ext = t as TomodachiInternal;
  const clampedX = Math.max(OVERWORLD_TILE / 2, Math.min(OVERWORLD_W - OVERWORLD_TILE / 2, x));
  const clampedY = Math.max(OVERWORLD_TILE / 2, Math.min(OVERWORLD_H - OVERWORLD_TILE / 2, y));
  // If the requested tile is a wall, snap to the nearest walkable tile.
  const snapped = snapToWalkable(clampedX, clampedY);
  const ent: TomodachiInternal['worldTarget'] = {
    x: snapped.x,
    y: snapped.y,
    enters: enters && enters !== 'overworld' ? enters : undefined,
  };
  updateTomodachi(t.id, { state: 'walking' } as Partial<Tomodachi>);
  ext.worldTarget = ent;
  ext.worldX = snapped.x;
  ext.worldY = snapped.y;
  // Also persist into the store-held copy.
  game.set((s) => ({
    ...s,
    tomodachis: s.tomodachis.map((x2) => {
      if (x2.id !== t.id) return x2;
      const x2ext = x2 as TomodachiInternal;
      x2ext.worldTarget = ent;
      x2ext.worldX = snapped.x;
      x2ext.worldY = snapped.y;
      return x2;
    }),
  }));
}

/** Per-frame: step the character one cell at a time toward its world target. */
export function tickOverworld(t: Tomodachi, dt: number): void {
  const ext = t as TomodachiInternal;
  const target = ext.worldTarget;
  const move: OverworldMove | undefined = (ext as unknown as MoveBag)._ovMove;

  // No target → idle. Clear any in-flight move and stop the walk animation.
  if (!target) {
    if (move) clearMove(ext);
    if (t.state === 'walking') {
      updateTomodachi(t.id, { state: 'idle', stateTime: 0, vx: 0 } as Partial<Tomodachi>);
    }
    return;
  }

  // === In-flight move: advance the lerp ===
  if (move) {
    move.t += dt * OVERWORLD_WALK_TILES_PER_SEC;
    if (move.t >= 1) {
      // Snap to the destination cell, then decide the next step (or arrive).
      const arrivedX = move.toX;
      const arrivedY = move.toY;
      t.x = arrivedX;
      t.y = arrivedY;
      ext.worldX = arrivedX;
      ext.worldY = arrivedY;
      // Check arrival at the world target (in pixels; the target is a tile center).
      const dx = target.x - arrivedX;
      const dy = target.y - arrivedY;
      if (Math.hypot(dx, dy) < ARRIVAL_THRESHOLD_PX) {
        // Arrived at the target.
        const enters = target.enters;
        clearMove(ext);
        ext.worldTarget = null;
        if (enters) {
          ext.worldX = arrivedX;
          ext.worldY = arrivedY;
          enterBuilding(t, enters);
        } else {
          updateTomodachi(t.id, {
            x: arrivedX, y: arrivedY, state: 'idle', stateTime: 0, vx: 0,
          } as Partial<Tomodachi>);
          ext.worldX = arrivedX;
          ext.worldY = arrivedY;
        }
        return;
      }
      // Pick the next cell along the path.
      const next = pickNextStep(arrivedX, arrivedY, target.x, target.y);
      if (!next) {
        // Stuck. Treat as arrival.
        clearMove(ext);
        ext.worldTarget = null;
        updateTomodachi(t.id, {
          x: arrivedX, y: arrivedY, state: 'idle', stateTime: 0, vx: 0,
        } as Partial<Tomodachi>);
        return;
      }
      move.fromX = arrivedX;
      move.fromY = arrivedY;
      move.toX = next.x;
      move.toY = next.y;
      move.t = 0;
      move.dir = next.dir;
      // Persist immediately so a save mid-step is consistent.
      updateTomodachi(t.id, {
        x: arrivedX, y: arrivedY,
        state: 'walking', vx: OVERWORLD_WALK_SPEED,
        facing: facingFor(next.dir),
      } as Partial<Tomodachi>);
    }
    // Visual lerp from (fromX, fromY) toward (toX, toY).
    const u = Math.min(1, move.t);
    t.x = move.fromX + (move.toX - move.fromX) * u;
    t.y = move.fromY + (move.toY - move.fromY) * u;
    ext.worldX = t.x;
    ext.worldY = t.y;
    updateTomodachi(t.id, { x: t.x, y: t.y } as Partial<Tomodachi>);
    return;
  }

  // === Not moving: try to start a new step toward the target ===
  const startX = t.x;
  const startY = t.y;
  const next = pickNextStep(startX, startY, target.x, target.y);
  if (!next) {
    // Already adjacent or stuck — clear target.
    ext.worldTarget = null;
    updateTomodachi(t.id, { state: 'idle', stateTime: 0, vx: 0 } as Partial<Tomodachi>);
    return;
  }
  const newMove: OverworldMove = {
    fromX: startX, fromY: startY,
    toX: next.x, toY: next.y,
    t: 0,
    dir: next.dir,
  };
  setMove(ext, newMove);
  updateTomodachi(t.id, {
    state: 'walking', vx: OVERWORLD_WALK_SPEED,
    facing: facingFor(next.dir),
  } as Partial<Tomodachi>);
}

/**
 * Pick the next cell to walk into, given a current tile-center position and
 * a target tile-center. Returns null if we're already at the target or stuck.
 *
 * Greedy 4-direction with wall-slide:
 *   1. If the primary axis (larger delta) cell is free, step there.
 *   2. Otherwise try the secondary axis (slide along the wall).
 *   3. Otherwise try the opposite of the secondary (back-step — allows escape).
 *   4. Otherwise null (truly stuck; give up).
 */
function pickNextStep(
  fromX: number, fromY: number,
  toX: number, toY: number,
): { x: number; y: number; dir: 1 | 2 | 3 | 4 } | null {
  const tx = worldToTileX(fromX);
  const ty = worldToTileY(fromY);
  const targetTx = worldToTileX(toX);
  const targetTy = worldToTileY(toY);
  const dx = targetTx - tx;
  const dy = targetTy - ty;

  if (dx === 0 && dy === 0) return null;

  // Step size = 1 tile in the chosen direction.
  type Dir = 1 | 2 | 3 | 4; // 1=right, 2=left, 3=down, 4=up
  const tryStep = (stepTx: number, stepTy: number, dir: Dir): { x: number; y: number; dir: Dir } | null => {
    if (!isTileWalkable(stepTx, stepTy)) return null;
    return { x: tileToWorldX(stepTx), y: tileToWorldY(stepTy), dir };
  };

  // 1. Greedy primary axis
  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
    const r = tryStep(tx + Math.sign(dx), ty, dx > 0 ? 1 : 2);
    if (r) return r;
    // 2. Slide along Y
    if (dy !== 0) {
      const s = tryStep(tx, ty + Math.sign(dy), dy > 0 ? 3 : 4);
      if (s) return s;
    }
    // 3. Back-step along Y (allows escape from a dead-end corner)
    if (dy !== 0) {
      const b = tryStep(tx, ty - Math.sign(dy), dy > 0 ? 4 : 3);
      if (b) return b;
    }
  } else if (dy !== 0) {
    const r = tryStep(tx, ty + Math.sign(dy), dy > 0 ? 3 : 4);
    if (r) return r;
    if (dx !== 0) {
      const s = tryStep(tx + Math.sign(dx), ty, dx > 0 ? 1 : 2);
      if (s) return s;
    }
    if (dx !== 0) {
      const b = tryStep(tx - Math.sign(dx), ty, dx > 0 ? 2 : 1);
      if (b) return b;
    }
  }

  // 4. No path found.
  return null;
}

function facingFor(dir: 0 | 1 | 2 | 3 | 4): 1 | -1 {
  if (dir === 1) return 1;   // right
  if (dir === 2) return -1;  // left
  return 1;                  // up/down keeps previous facing
}

/** Enter an interior from the overworld. Snaps the character to the interior. */
export function enterBuilding(t: Tomodachi, building: GameLocationId): void {
  const ext = t as TomodachiInternal;
  const interiorX = ext.lastInteriorX ?? 240;
  updateTomodachi(t.id, {
    location: building,
    x: interiorX,
    y: 240,
    homeX: interiorX,
    state: 'idle',
    stateTime: 0,
    vx: 0,
  } as Partial<Tomodachi>);
  rememberVisit(t, building, game.get().time);
  bumpLocationCount(t, building, 1);
  pushEvent({
    time: game.get().time.totalMinutes,
    day: game.get().time.day,
    kind: 'system',
    text: `${t.name} entered the ${building}.`,
    tomodachiId: t.id,
  });
}

/** Leave an interior back to the overworld at the matching building's door. */
export function leaveBuilding(t: Tomodachi): void {
  const ext = t as TomodachiInternal;
  // Save the interior x so re-entering puts them back near the same spot.
  ext.lastInteriorX = t.x;
  // Find the building node we came from.
  const node = BUILDING_NODES.find((n) => n.enters === t.location);
  const wx = node?.x ?? ext.worldX ?? 240;
  const wy = node?.y ?? ext.worldY ?? OVERWORLD_GROUND_Y;
  // Snap to walkable so we don't spawn inside a wall.
  const snapped = snapToWalkable(wx, wy);
  updateTomodachi(t.id, {
    location: 'overworld',
    x: snapped.x,
    y: snapped.y,
    homeX: snapped.x,
    state: 'idle',
    stateTime: 0,
    vx: 0,
  } as Partial<Tomodachi>);
  ext.worldX = snapped.x;
  ext.worldY = snapped.y;
  ext.worldTarget = null;
  clearMove(ext);
}

/** Player-issued: send a Tomodachi toward a building. Wraps setWorldTarget. */
export function sendToBuilding(t: Tomodachi, building: GameLocationId): void {
  const node = BUILDING_NODES.find((n) => n.enters === building);
  if (!node) return;
  // If on the overworld, walk there and auto-enter.
  if (t.location === 'overworld') {
    setWorldTarget(t, node.x, node.y, building);
    return;
  }
  // If currently inside another interior, exit first then walk.
  if (t.location !== building) {
    leaveBuilding(t);
    setWorldTarget(t, node.x, node.y, building);
    return;
  }
  // Already in the requested interior — no-op.
}
