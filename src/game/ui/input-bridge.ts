// Input bridge. Wires the engine's input system to the game's selection
// and dialogue flow.
//
//   click on character → select (HUD shows needs panel)
//   long-press / dblclick → open Tomodachi info panel
//   click on empty world (overworld) →
//     - if click is within a building radius → enter that building
//     - else → set the selected Tomodachi's world target there
//   click on empty space (interior) → deselect

import { attachInput, sfxClick } from '../../engine';
import { setSelected, game, setLocation } from '../state/state';
import { showTomodachiInfo, hideTomodachiInfo } from './tomodachi-info';
import { openDialogue } from './dialogue';
import { setWorldTarget } from '../play/overworld';
import { BUILDING_NODES } from '../content/locations';
import { Tomodachi } from '../../engine';

export function mountInput(canvas: HTMLCanvasElement): () => void {
  return attachInput(canvas, {
    onPick: (ev) => {
      const s = game.get();
      // === Building entry check takes priority on the overworld ===
      // B/W-style: clicking a building's door zone teleports you inside,
      // even if a character is standing in front of it.
      if (s.currentLocation === 'overworld') {
        const hit = pickBuilding(ev.worldX, ev.worldY);
        if (hit) {
          sfxClick();
          setLocation(hit.enters);
          return;
        }
      }
      // === Character pick ===
      if (ev.t) {
        setSelected(ev.t.id);
        return;
      }
      // === Empty-world click ===
      if (s.currentLocation === 'overworld') {
        // Walk the selected Tomodachi (or the first overworld one if
        // nothing is selected yet — Pokémon B/W always has a "player").
        let t: Tomodachi | undefined;
        if (s.selectedId) {
          t = s.tomodachis.find((x) => x.id === s.selectedId);
        }
        if (!t || t.location !== 'overworld') {
          t = s.tomodachis.find((x) => x.location === 'overworld');
          if (t) setSelected(t.id);
        }
        if (t && t.location === 'overworld') {
          setWorldTarget(t, ev.worldX, ev.worldY);
          return;
        }
        // No overworld character to move — just close any open info panel.
        hideTomodachiInfo();
        return;
      }
      // Interior: empty click just deselects and closes the info panel.
      hideTomodachiInfo();
    },
    onDblPick: (t: Tomodachi) => {
      // Long-press / dblclick: open info panel
      setSelected(t.id);
      showTomodachiInfo(t);
    },
    longPressMs: 500,
  });
}

function pickBuilding(x: number, y: number) {
  for (const node of BUILDING_NODES) {
    const dx = x - node.x;
    const dy = y - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius) return node;
  }
  return null;
}

// Convenience: open dialogue for the selected Tomodachi (used by HUD's Talk button).
export function openDialogueForSelected(): void {
  const id = game.get().selectedId;
  if (!id) return;
  const t = game.get().tomodachis.find((x) => x.id === id);
  if (t) openDialogue(t);
}
