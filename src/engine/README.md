# tomo-engine

A small, dependency-light 2D character-simulation engine. Designed to be
embedded in a host game.

## What's in the box

- **PixiJS renderer** (480×270 base canvas, integer-scaled, WebGL).
- **Procedural sprite composer** (head, eyes, mouth, hair, body, outfit,
  accessory — drawn live from Graphics primitives; no PNGs needed).
- **3D-look drawing helpers** (gradients, soft shadows, fake sphere/box/
  cylinder, water, road, building, plant, sofa, pendant light, …).
- **Day/night overlay + time helpers** (`startClock`, `tickTime`,
  `isNight`, `timeContext`).
- **Locations registry** — hosts register their own locations on boot;
  the engine stays content-agnostic.
- **Pub/sub state store** (generic over `T`).
- **Generic IndexedDB save** (`saveToIdb<T>(slot, payload)`, `loadFromIdb`,
  `listSlots`, `deleteSlot`).
- **TTS coordinator** (Web Speech API, per-character pitch variance).
- **Procedural Web Audio SFX** (clicks, barks, load/done).
- **Personality + mood helpers** (pure functions on numeric OCEAN traits).
- **Opt-in LLM module** (MediaPipe + Gemma). Engine never loads it at top
  level — call `engine.llm.ensureLlm()` only when the user wants to chat.

## Hard rules

- **No game-specific data** (no archetypes, no wishes, no IP names).
- **No knowledge of host game screens** — the engine exposes primitives;
  hosts build their own UI on top.
- **LLM is opt-in** — the `@mediapipe/tasks-genai` package is only fetched
  the first time `ensureLlm()` is called. Hosts that don't want the LLM
  pay nothing for it (the import is dynamic).
- **No imports from `src/game/`** — this is verified before any release
  (`grep -R "from '\.\./game" src/engine/` must return nothing).

## Minimal demo (~70 LOC, see `src/engine/demo.ts`)

1. `createApp({ host })` + `initScene(app, { state })`.
2. `registerLocation({ id, name, groundY, ambientColor, draw: yourFn })`.
3. `createStore<GameState>(initial)`, push a `Tomodachi` into it.
4. `startClock(initialGameMin)`, then `tickTime(clock)` every frame.
5. `attachInput(canvas, { onPick, onDblPick })`.
6. Render need bars in plain DOM.

The demo runs by appending `?demo=1` to the URL. It proves the engine is
bootable end-to-end with no game code in the import graph.

## Public API

The canonical entry point is `src/engine/index.ts`. Hosts typically do:

```ts
import * as engine from './engine';
import { registerLocation, createApp, /* … */ } from './engine';
```

Sub-modules can also be imported individually when you want a tighter
dependency surface (e.g. `import { createStore } from './engine/core/store'`).

## License

MIT.
