# Changelog

All notable changes to **Tomo Island** are documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
and the project does **not** follow Semantic Versioning.

---

## [Unreleased] — 2026-06-05

### Overworld — Pokémon Black/White visual rebuild

The overworld was rebuilt to look like **real** Pokémon Black & White (B/W)
Nuvema Town / Route 1, not a "B/W inspired" top-down rendition. Reference:
[mjakeman's Substack article on B/W](https://mjakeman.substack.com/) and
[Bulbapedia's Nuvema Town screenshots](https://bulbapedia.bulbagarden.net/wiki/Nuvema_Town).

The earlier version was a **flat 2D top-down** world with stone-cobble paths,
lampposts, flowers, fences, and a sky band. That isn't how B/W looks. B/W uses
a **true 45° isometric projection** with **3D-projected box buildings**,
**cone-shaped (Christmas-tree) trees**, a **smooth tan dirt path**, and a
**water strip with a wooden bridge** at the bottom of the screen. This rewrite
matches that look.

#### Visual changes

| Before (B/W-inspired top-down)         | After (real B/W)                                    |
|----------------------------------------|-----------------------------------------------------|
| Sky band at the top of the screen      | **No sky band** — green grass fills the whole frame |
| Stone / cobble path with dot pattern   | **Smooth tan dirt path** (no cobble, no stone)      |
| Buildings: rounded 3D "cushion" boxes  | **3D-projected iso boxes** (front wall + right side parallelogram + roof parallelogram + gable peak) |
| Lamps, flowers, fences scattered       | **Removed** — clean, minimal scene                  |
| Lampposts along the path               | **No lampposts**                                    |
| `worldLayer` was vertically squished (`scaleY = 1 - tilt*0.45`) to *fake* 3/4 | **`scaleY = 1`** — the iso projection is **baked into the drawing code** |
| Trees were fluffy 3D-sphere clusters    | **Cone-shaped Christmas trees** (3 stacked triangles) |
| Bottom of screen was more grass         | **Blue water strip with a wooden bridge** at the bottom |

#### Iso projection

The new `drawIsoBox` helper in `src/game/content/locations/overworld.ts` draws
a 3D box using a 45° camera baked into the geometry:

- **Front wall** — a solid rectangle (the "south" face of the building)
- **Right side wall** — a parallelogram, offset from the front by `(+d*0.707, -d*0.707)`
- **Roof slope** — a parallelogram on the right side, with a small **gable triangle**
  filling the space above the front wall up to the ridge

Because the iso math is in the drawing code (not in a `worldLayer` transform),
the rest of the engine (character sprites, HUD, dialogue bubbles) keeps working
unchanged.

#### Camera

`getTilt()` in `src/main.ts` was changed from `0.55` to `0`. With the iso
projection baked into the geometry, the worldLayer no longer needs to be
squished. This also fixes the overworld-vs-interior mismatch where the
overworld was being squished and the interiors were flat.

#### Character positioning

The character rig was positioned with `rig.container.position.set(t.x, t.y - CHARACTER_HEIGHT + 4)`,
which put the feet 4 px below `t.y`. This made the feet land *south* of the
intended position, so the character appeared to be standing on the grass
in front of the path instead of on the path itself.

Changed to `rig.container.position.set(t.x, t.y - CHARACTER_HEIGHT)`, so the
feet are exactly at `(t.x, t.y)`. The starter spawn (`OVERWORLD_SPAWN`) and
`OVERWORLD_GROUND_Y` were both moved to `y = 200`, which is the center of the
new horizontal dirt path. Walkers now visibly stand on the path.

#### Cone tree border (B/W signature element)

The **top of the screen** in B/W has a row of small cone-shaped trees forming
a border. This is one of the strongest visual signatures of the game's
overworld. Implemented in `drawConeTreeBorder` + `drawConeTree`:

- 15 small cone trees, varying scale 0.85–1.0, spaced 32 px apart
- 3 stacked triangles per tree (Christmas-tree silhouette)
- A small brown trunk nub at the base
- A subtle white highlight on the bottom-left of the bottom layer
- Tall, larger cone trees scattered in the *background* (north of the
  buildings) for depth

#### Water + wooden bridge

A solid blue water strip at the very bottom of the screen with:

- A **sandy beach edge** (1 px tan) on the top of the water
- A **darker blue band** at the bottom (depth)
- A few **white wave tick marks** scattered across
- A **wooden bridge** in the middle of the strip (planks + rails + highlight)

This is the B/W "the town is on a coast" feel. The collision mask makes the
water tiles unwalkable, so the player can't wade in.

#### Wooden sign posts

Each building has a small wooden signpost on the path in front of it, with
a tiny red dot. This matches the wooden signs B/W uses outside every
building's door.

#### Collision mask

The collision mask was tightened so the player can walk **up to** a building's
door without being blocked. The approach tile (the tile just south of the
building's footprint) is always walkable, so the path runs continuously
through the world. The cone-tree border and the water strip are blocked.

#### Files changed

- `src/game/content/locations/overworld.ts` — **complete rewrite** of the
  `drawOverworld` function and the 5 building draw functions. Adds
  `drawIsoBox`, `drawConeTree`, `drawConeTreeBorder`, `drawDirtPath`,
  `drawWater`, `drawWoodenBridge`, `drawSignpost`. Removes `drawDistantHills`,
  `drawPathStrip`, `drawTopDownTree`, `drawApartmentBuilding`,
  `drawCafeBuilding`, `drawParkGate`, `drawTownBuilding`, `drawBeachSign`,
  `drawFence`, `drawFlower`, `drawStreetlight`, `drawDistantHills`, and
  the old cobble-path network.

- `src/main.ts` — `getTilt()` returns `0` (was `0.55` on the overworld).
  The overworld now does its own iso projection; the worldLayer is not
  squished.

- `src/engine/render/scene.ts` — the character rig is positioned with
  `rig.container.position.set(t.x, t.y - CHARACTER_HEIGHT)` so the feet
  are exactly at `(t.x, t.y)`. The previous `+ 4` offset put the feet
  4 px south of the intended position.

#### Verification

- `npm run build` — type-check + Vite build, **clean** (~6.5 s, no errors).
- Visual screenshot in the dev server confirms:
  - 15 cone trees at the top
  - 5 iso-projected buildings arranged back-to-front
  - A tan dirt path connecting them
  - A water strip with a wooden bridge at the bottom
  - The starter Tomodachis (Mika, Riku) standing on the path

### Engine / Game split (from prior session)

The codebase was reorganized from one flat `src/` tree into two:

- `src/engine/` — open-source, reusable 2D character-simulation engine.
  No game-specific imports. Pure PixiJS, no game data.
- `src/game/` — private IP. Depends on the engine, never the reverse.
  Contains Tomodachi data, content, AI, screens, and the heart's-wishes
  system.

The engine exposes a tiny registration API: `registerLocation(id, drawFn, def)`.
The game calls this in `src/game/content/locations/index.ts` for each of its
5 locations on boot.

See `src/engine/README.md` for the engine's public API and demo.

### Heart's Wishes (game-design hook)

Every Tomodachi has a hidden **Heart's Wish** that the player must discover
through observation and fulfill. See `src/game/content/wishes.ts` for the
6 starter wishes (1 per archetype: Loner, Performer, Foodie, Scholar,
Adventurer, Romantic).
