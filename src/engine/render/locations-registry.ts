// Location registry. Hosts register their own locations on boot. The engine's
// scene manager looks up the active location through this registry, so it
// never has to know what locations exist.
//
// This is the critical inversion: without it, the engine would have to
// import game content (locations) to know how to draw a scene, leaking
// game IP into the engine. With it, the engine stays content-agnostic.

import { Graphics } from 'pixi.js';

export type LocationDrawFn = (g: Graphics, timeSec: number) => void;

export interface RegisteredLocation {
  id: string;
  name: string;
  /** Y coordinate where characters' feet sit. */
  groundY: number;
  ambientColor: { day: number; night: number };
  /** Render the background. Receives the scene Graphics and the wall-clock seconds. */
  draw: LocationDrawFn;
  /** Optional world width. Defaults to 480 (the base canvas). If larger, the camera can pan. */
  worldWidth?: number;
  /** Optional world height. Defaults to 270 (the base canvas). If larger, the camera can pan. */
  worldHeight?: number;
}

const registry = new Map<string, RegisteredLocation>();

/** Register a location. Call once per location at boot. */
export function registerLocation(loc: RegisteredLocation): void {
  registry.set(loc.id, loc);
}

/** Look up a location by id. */
export function getRegisteredLocation(id: string): RegisteredLocation | null {
  return registry.get(id) ?? null;
}

/** All registered locations (in insertion order). */
export function listRegisteredLocations(): RegisteredLocation[] {
  return Array.from(registry.values());
}

/** Wipe the registry. Used by tests. */
export function clearLocationsRegistry(): void {
  registry.clear();
}
