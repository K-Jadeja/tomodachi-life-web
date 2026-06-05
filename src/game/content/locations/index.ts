// All game locations. Hosts call `registerAllLocations()` once on boot.
// Each location registers itself with the engine's locations registry.

import { registerLocation, RegisteredLocation } from '../../../engine/render/locations-registry';
import { drawApartment } from './apartment';
import { drawBeach } from './beach';
import { drawPark } from './park';
import { drawCafe } from './cafe';
import { drawTown } from './town';
import { drawOverworld, OVERWORLD_W, OVERWORLD_H, OVERWORLD_GROUND_Y, BUILDING_NODES } from './overworld';

export type GameLocationId =
  | 'overworld'
  | 'apartment'
  | 'beach'
  | 'park'
  | 'cafe'
  | 'town';

/** Interior location ids (i.e. anything except the overworld). */
export const INTERIOR_IDS: ReadonlyArray<Exclude<GameLocationId, 'overworld'>> = [
  'apartment', 'beach', 'park', 'cafe', 'town',
];

export { BUILDING_NODES, OVERWORLD_W, OVERWORLD_H, OVERWORLD_GROUND_Y };

export const GAME_LOCATIONS: Record<GameLocationId, RegisteredLocation> = {
  overworld: {
    id: 'overworld',
    name: 'Tomo Island',
    groundY: OVERWORLD_GROUND_Y,
    ambientColor: { day: 0xe8f6ff, night: 0x1a1a3a },
    draw: drawOverworld,
    worldWidth: OVERWORLD_W,
    worldHeight: OVERWORLD_H,
  },
  apartment: {
    id: 'apartment',
    name: 'Apartment',
    groundY: 240,
    ambientColor: { day: 0xffffff, night: 0x223052 },
    draw: drawApartment,
  },
  beach: {
    id: 'beach',
    name: 'Beach',
    groundY: 240,
    ambientColor: { day: 0xfff6d0, night: 0x1a1a4a },
    draw: drawBeach,
  },
  park: {
    id: 'park',
    name: 'Park',
    groundY: 240,
    ambientColor: { day: 0xe0ffd0, night: 0x1a2a1a },
    draw: drawPark,
  },
  cafe: {
    id: 'cafe',
    name: 'Café',
    groundY: 240,
    ambientColor: { day: 0xffe8c0, night: 0x3a2a1a },
    draw: drawCafe,
  },
  town: {
    id: 'town',
    name: 'Town Square',
    groundY: 240,
    ambientColor: { day: 0xe0f0ff, night: 0x1a1a3a },
    draw: drawTown,
  },
};

export function registerAllLocations(): void {
  for (const loc of Object.values(GAME_LOCATIONS)) {
    registerLocation(loc);
  }
}
