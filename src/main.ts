// Tomo Island — entry point.
// Boot order:
//   1. show boot screen
//   2. register game content (locations) with the engine
//   3. wire engine event sinks to game state
//   4. create PixiJS app, mount scene
//   5. mount HUD + input bridge
//   6. show title (New / Continue)
//   7. start game loop on `tomo:start`
//   8. wire global events (save, editor, talk, close, info, bark)

import {
  createApp, BASE_W, BASE_H,
  initScene, refreshLocation, getApp,
  attachInput as _attachInput,
  warmTts,
  setEventSink, setEventGetter,
  startClock,
} from './engine';
import { game, setSelected, pushEvent } from './game/state/state';
import { saveGame } from './game/state/save';
import { registerAllLocations } from './game/content/locations';
import { mountHud } from './game/ui/hud';
import { mountInput } from './game/ui/input-bridge';
import { showTitle, hideTitle, showBootStatus } from './game/ui/title';
import { showEditor, hideEditor } from './game/ui/editor';
import { openDialogue, repositionBubbles, stopAllDialogue, showSpeechBubble } from './game/ui/dialogue';
import { showTomodachiInfo, hideTomodachiInfo } from './game/ui/tomodachi-info';
import { startLoop, stopLoop, setLoopClock } from './game/loop';
import { Tomodachi } from './engine';

// === Game scene source ===
// The engine's scene manager only needs read-only hooks. We give it our store.
//
// Filtering:
//   - Only Tomodachis whose `location` matches `currentLocation` are visible.
//     The overworld is a wide 960x540 world; each interior is its own scene.
//   - The camera follows the selected Tomodachi on the overworld (B/W feel).
//   - Tilt is 0.5 on the overworld, 0 on interiors (flat 2D).
function makeSceneSource() {
  return {
    getCurrentLocation: () => game.get().currentLocation,
    getTomodachis: () => {
      const cur = game.get().currentLocation;
      return game.get().tomodachis.filter((t) => t.location === cur);
    },
    getHour: () => game.get().time.hour,
    getFollowTargetId: () => {
      // Camera follow only makes sense on the overworld.
      if (game.get().currentLocation !== 'overworld') return null;
      return game.get().selectedId;
    },
    getTilt: () => {
      // Overworld does its own 3/4 projection in the draw function (B/W style),
      // so the worldLayer is NOT squished here. Interiors are flat 2D.
      return 0;
    },
    getZoom: () => 1,
  };
}

async function boot() {
  await showBootStatus('Starting up…', 5);

  const host = document.getElementById('canvas-host') as HTMLElement;
  const ui = document.getElementById('ui') as HTMLElement;
  if (!host || !ui) throw new Error('Missing #canvas-host or #ui');

  // Register all game locations with the engine
  registerAllLocations();
  await showBootStatus('Locations registered.', 12);

  // Wire engine event sink to game store
  setEventSink((ev) => pushEvent(ev));
  setEventGetter(() => game.get().events);

  await showBootStatus('Initializing renderer…', 18);
  const app = await createApp({ host });
  initScene(app, { state: makeSceneSource() });
  await showBootStatus('Renderer ready.', 35);

  // HUD + input
  mountHud(ui);
  mountInput(app.canvas);
  await showBootStatus('UI ready.', 50);

  // TTS warm-up (in background)
  void warmTts();

  // Title screen
  await showTitle(ui);
  await showBootStatus('Ready!', 100);

  // Window resize handler
  window.addEventListener('resize', () => {
    repositionBubbles();
  });

  // === Event wiring ===
  window.addEventListener('tomo:start', () => {
    hideTitle();
    refreshLocation();
    // Anchor time to current in-game clock
    const cur = game.get().time;
    setLoopClock(startClock(cur.totalMinutes || cur.hour * 60 + cur.minute));
    // Auto-save every 30s
    setInterval(() => { void saveGame(); }, 30_000);
    // Save on close
    window.addEventListener('beforeunload', () => { void saveGame(); });
    startLoop();
  });

  window.addEventListener('tomo:open-editor', () => {
    stopAllDialogue();
    hideTomodachiInfo();
    void showEditor(ui);
  });
  window.addEventListener('tomo:close-editor', () => {
    hideEditor();
  });
  window.addEventListener('tomo:talk', (ev) => {
    const e = ev as CustomEvent<string>;
    const t = game.get().tomodachis.find((x) => x.id === e.detail);
    if (t) {
      openDialogue(t);
    }
  });
  window.addEventListener('tomo:info', (ev) => {
    const e = ev as CustomEvent<string>;
    const t = game.get().tomodachis.find((x) => x.id === e.detail);
    if (t) {
      setSelected(t.id);
      showTomodachiInfo(t);
    }
  });
  window.addEventListener('tomo:save', () => {
    void saveGame();
  });
  // Behavior bark → speech bubble
  window.addEventListener('tomo:bark', (ev) => {
    const e = ev as CustomEvent<{ t: Tomodachi; text: string }>;
    if (e.detail?.t) showSpeechBubble(e.detail.t, e.detail.text, 'bark', 4);
  });

  // Expose for debugging
  (window as unknown as { tomo: unknown }).tomo = { game, app };
}

void boot().catch((e) => {
  console.error('[tomo] boot failed', e);
  const boot = document.getElementById('boot');
  if (boot) {
    boot.innerHTML = `<div style="text-align:center;color:#ff8a5b"><h2>Boot error</h2><pre style="text-align:left;max-width:600px;margin:0 auto;font-size:12px;opacity:0.7">${(e as Error).stack ?? String(e)}</pre></div>`;
  }
});

// Suppress unused warning for the re-exported attachInput — the game uses its own input-bridge.
void _attachInput; void BASE_W; void BASE_H;
