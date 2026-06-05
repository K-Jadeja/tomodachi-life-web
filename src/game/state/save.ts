// Typed wrapper over the engine's generic IndexedDB save.
//
// The engine knows nothing about our GameState shape; we own the schema.
// We keep the version gate here (not in the engine) because the engine
// version is for its own on-disk layout, and ours is for GameState.

import { saveToIdb, loadFromIdb, listSlots, deleteSlot } from '../../engine';
import { game, GAME_SAVE_VERSION, GameState } from './state';

export interface GameSave {
  schemaVersion: number;
  state: GameState;
}

const SLOT = 'autosave';

/** Save the current state to IndexedDB. Returns true on success. */
export async function saveGame(): Promise<boolean> {
  const payload: GameSave = {
    schemaVersion: GAME_SAVE_VERSION,
    state: game.get(),
  };
  return saveToIdb<GameSave>(SLOT, payload);
}

/** Try to load the save. Returns true on success and replaces state. */
export async function loadGame(): Promise<boolean> {
  const data = await loadFromIdb<GameSave>(SLOT);
  if (!data) return false;
  if (data.schemaVersion !== GAME_SAVE_VERSION) {
    console.warn('[game/save] schema version mismatch, ignoring', data.schemaVersion);
    return false;
  }
  // Defensive: the engine stores generic objects. Make sure shape matches.
  if (!data.state || !Array.isArray(data.state.tomodachis)) {
    console.warn('[game/save] save shape invalid, ignoring');
    return false;
  }
  game.set(() => data.state);
  return true;
}

export { listSlots, deleteSlot };
