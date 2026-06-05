// Starter seed. Builds the initial cast of Tomodachis and assigns each
// an archetype + wish. The Title screen calls this when starting a new
// game. Two starters keep the demo focused.

import { Tomodachi, GameTime } from '../../engine';
import { game, addTomodachi, createTomodachi, ActiveWishState, resetGame } from './state';
import { TomodachiInternal } from '../play/types';
import { assignWishTo } from '../play/wishes';
import { randomName } from '../content/names';
import { ARCHETYPES, ArchetypeId } from '../content/archetypes';
import { OVERWORLD_SPAWN, OVERWORLD_GROUND_Y } from '../content/locations/overworld';

const STARTERS: Array<{
  name: string;
  archetype: ArchetypeId;
  parts: Tomodachi['parts'];
  colors: Tomodachi['colors'];
  worldX: number;
  worldY: number;
}> = [
  {
    name: 'Mika',
    archetype: 'loner',
    parts: { head: 0, eyes: 1, mouth: 0, hair: 5, body: 0, outfit: 1, accessory: 1 },
    colors: { skin: 2, hair: 4, primary: 7, secondary: 0 },
    worldX: OVERWORLD_SPAWN.x,
    worldY: OVERWORLD_GROUND_Y,
  },
  {
    name: 'Riku',
    archetype: 'performer',
    parts: { head: 2, eyes: 0, mouth: 0, hair: 6, body: 0, outfit: 0, accessory: 0 },
    colors: { skin: 5, hair: 6, primary: 2, secondary: 4 },
    worldX: OVERWORLD_SPAWN.x + 60,
    worldY: OVERWORLD_GROUND_Y,
  },
];

/** Build a starter Tomodachi with archetype-shaped personality. */
function buildStarter(spec: typeof STARTERS[number]): Tomodachi {
  const t = createTomodachi({
    name: spec.name,
    parts: spec.parts,
    colors: spec.colors,
    location: 'overworld',
  });
  // Apply archetype's default personality (small jitter so each cast feels fresh)
  const arch = ARCHETYPES[spec.archetype];
  const jitter = (n: number) => Math.max(1, Math.min(10, n + (Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1))));
  t.personality = {
    openness: jitter(arch.defaultPersonality.openness),
    conscientiousness: jitter(arch.defaultPersonality.conscientiousness),
    extraversion: jitter(arch.defaultPersonality.extraversion),
    agreeableness: jitter(arch.defaultPersonality.agreeableness),
    neuroticism: jitter(arch.defaultPersonality.neuroticism),
  };
  t.x = spec.worldX;
  t.y = spec.worldY;
  t.homeX = spec.worldX;
  // Mark overworld bookkeeping fields on the ext.
  (t as TomodachiInternal).worldX = spec.worldX;
  (t as TomodachiInternal).worldY = spec.worldY;
  (t as TomodachiInternal).lastInteriorX = 240;
  return t;
}

/** Reset the state, seed the starter cast, assign wishes. */
export function seedNewIsland(): void {
  resetGame();
  const time = game.get().time;
  for (const spec of STARTERS) {
    const t = buildStarter(spec);
    addTomodachi(t);
    assignWishTo(t, spec.archetype, time);
  }
  game.set((s) => ({ ...s, currentLocation: 'overworld' }));
}

/** Add a single new Tomodachi (player-created via the editor). */
export function addPlayerTomodachi(name?: string): Tomodachi {
  const t = createTomodachi({ name: name ?? randomName(), location: 'overworld' });
  t.x = OVERWORLD_SPAWN.x + Math.floor(Math.random() * 40 - 20);
  t.y = OVERWORLD_GROUND_Y;
  t.homeX = t.x;
  (t as TomodachiInternal).worldX = t.x;
  (t as TomodachiInternal).worldY = t.y;
  (t as TomodachiInternal).lastInteriorX = 240;
  // Pick a random archetype
  const ids = Object.keys(ARCHETYPES) as ArchetypeId[];
  const arch = ids[Math.floor(Math.random() * ids.length)];
  const def = ARCHETYPES[arch];
  t.personality = { ...def.defaultPersonality };
  addTomodachi(t);
  assignWishTo(t, arch, game.get().time);
  return t;
}
