// Engine-level input. The engine just translates canvas pixel coordinates
// into world coordinates and finds which Tomodachi (if any) was clicked.
// Hosts wire this to their own dialogue / selection systems.

import { screenToWorld, pickCharacterAt } from '../render/scene';
import { Tomodachi } from '../core/types';

/** Coords reported to hosts on every click. The Tomodachi may be null if the
 * click landed on empty world (e.g. on the overworld to walk a character). */
export interface PickEvent {
  /** The picked Tomodachi, or null if the click was on empty world. */
  t: Tomodachi | null;
  /** World-space coords of the click. Always present. */
  worldX: number;
  worldY: number;
}

export interface InputOptions {
  onPick?: (ev: PickEvent) => void;
  onDblPick?: (t: Tomodachi) => void;
  /** Long-press threshold in ms. Defaults to 600. Set 0 to disable. */
  longPressMs?: number;
}

export function attachInput(
  canvas: HTMLCanvasElement,
  opts: InputOptions
): () => void {
  const handleClick = (clientX: number, clientY: number, withCharacter: boolean): void => {
    const world = screenToWorld(clientX, clientY);
    if (!world) return;
    if (withCharacter && opts.onPick) {
      const t = pickCharacterAt(world.x, world.y);
      opts.onPick({ t, worldX: world.x, worldY: world.y });
    } else if (opts.onPick) {
      opts.onPick({ t: null, worldX: world.x, worldY: world.y });
    }
  };
  const onClick = (e: MouseEvent) => {
    handleClick(e.clientX, e.clientY, true);
  };
  const onDblClick = (e: MouseEvent) => {
    if (!opts.onDblPick) return;
    const world = screenToWorld(e.clientX, e.clientY);
    if (!world) return;
    const t = pickCharacterAt(world.x, world.y);
    if (t) opts.onDblPick(t);
  };
  let longPressTimer: number | null = null;
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    if (!opts.onDblPick) return;
    const ms = opts.longPressMs ?? 600;
    if (ms <= 0) return;
    const touch = e.touches[0];
    longPressTimer = window.setTimeout(() => {
      const world = screenToWorld(touch.clientX, touch.clientY);
      if (!world) return;
      const t = pickCharacterAt(world.x, world.y);
      if (t) opts.onDblPick!(t);
    }, ms);
  };
  const cancelLong = () => {
    if (longPressTimer != null) { clearTimeout(longPressTimer); longPressTimer = null; }
  };

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', cancelLong);
  canvas.addEventListener('touchmove', cancelLong);

  return () => {
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('dblclick', onDblClick);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', cancelLong);
    canvas.removeEventListener('touchmove', cancelLong);
  };
}
