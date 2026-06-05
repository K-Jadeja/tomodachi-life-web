// Engine-only demo. Verifies the engine compiles & runs without any game
// code. Add `?demo=1` to the URL to run it.
//
// What it does:
//   1. Creates the PixiJS app.
//   2. Registers a single "demo" location with a sky gradient + ground line.
//   3. Builds a tiny in-memory state and scene source.
//   4. Spawns a single default Tomodachi.
//   5. Runs the engine's update() every frame.
//   6. Renders 4 need bars in plain DOM.

import { createApp } from './render/app';
import {
  initScene,
  update,
} from './render/scene';
import { attachInput } from './ui/input';
import { el, clear } from './ui/dom';
import { createStore } from './core/store';
import { startClock, tickTime } from './core/time';
import { setEventSink, setEventGetter } from './core/events';
import { registerLocation } from './render/locations-registry';
import { dominantMood } from './ai/mood';
import { Tomodachi, GameEvent } from './core/types';
import { Graphics } from 'pixi.js';

const BASE_W = 480;
const BASE_H = 270;

/** Demo-only state shape. The engine doesn't ship a GameState type; hosts
 *  define their own and pass it to createStore. */
interface DemoState {
  tomodachis: Tomodachi[];
  time: { day: number; hour: number; minute: number; totalMinutes: number };
  currentLocation: string;
  events: GameEvent[];
  createdAt: number;
  version: number;
}

function makeDemoSource(store: ReturnType<typeof createStore<DemoState>>) {
  return {
    getCurrentLocation: () => store.get().currentLocation,
    getTomodachis: () => store.get().tomodachis,
    getHour: () => store.get().time.hour,
  };
}

function makeDemoTomo(): Tomodachi {
  return {
    id: 'demo-1',
    name: 'Demo',
    parts: { head: 0, eyes: 0, mouth: 0, hair: 0, body: 0, outfit: 0, accessory: 0 },
    colors: { skin: 3, hair: 4, primary: 7, secondary: 0 },
    personality: { openness: 6, conscientiousness: 5, extraversion: 5, agreeableness: 7, neuroticism: 3 },
    mood: 'happy',
    needs: { hunger: 8, happiness: 7, energy: 8, social: 6 },
    location: 'demo',
    x: 240,
    homeX: 240,
    y: 240,
    vx: 0,
    facing: 1,
    state: 'idle',
    stateTime: 0,
    blinkTimer: 2,
    walkPhase: 0,
    lastBarkTime: 0,
    lastBarkIndex: -1,
    createdAt: Date.now(),
  };
}

function drawDemoLocation(g: Graphics, _t: number): void {
  for (let y = 0; y < 240; y += 4) {
    const t = y / 240;
    const r = Math.round(0x88 * (1 - t) + 0xe8 * t);
    const gr = Math.round(0xc4 * (1 - t) + 0xf0 * t);
    const b = Math.round(0xe8 * (1 - t) + 0xff * t);
    const col = (r << 16) | (gr << 8) | b;
    g.rect(0, y, BASE_W, 4).fill(col);
  }
  g.rect(0, 240, BASE_W, 30).fill(0x6a8a3a);
  g.rect(0, 238, BASE_W, 2).fill({ color: 0x000000, alpha: 0.15 });
  g.ellipse(380, 50, 20, 20).fill(0xfff0a0);
}

export async function startDemo(host: HTMLElement, ui: HTMLElement): Promise<void> {
  const events: GameEvent[] = [];
  setEventSink((ev) => events.push(ev));
  setEventGetter(() => events);

  const store = createStore<DemoState>({
    tomodachis: [makeDemoTomo()],
    time: { day: 1, hour: 9, minute: 0, totalMinutes: 9 * 60 },
    currentLocation: 'demo',
    events,
    createdAt: Date.now(),
    version: 1,
  });

  registerLocation({
    id: 'demo',
    name: 'Demo',
    groundY: 240,
    ambientColor: { day: 0xffffff, night: 0x223052 },
    draw: drawDemoLocation,
  });

  const app = await createApp({ host });
  initScene(app, { state: makeDemoSource(store) });

  const clock = startClock(store.get().time.totalMinutes);

  // Need bars (pure DOM)
  const wrap = el('div', { class: 'demo-ui' });
  const bars = el('div', { class: 'demo-bars' });
  wrap.appendChild(bars);
  ui.appendChild(wrap);

  // Input
  attachInput(app.canvas, {
    onPick: (ev) => {
      if (!ev.t) return;
      const s = store.get();
      const next = s.tomodachis.map((x: Tomodachi) => x.id === ev.t!.id ? { ...x, mood: dominantMood(x) } : x);
      store.set((cur) => ({ ...cur, tomodachis: next }));
    },
  });

  // Main loop
  const loop = () => {
    const next = tickTime(clock);
    store.set((s) => ({ ...s, time: next }));
    update();
    renderBars(bars, store.get().tomodachis[0]);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function renderBars(host: HTMLElement, t: Tomodachi | undefined): void {
  if (!t) return;
  clear(host);
  for (const k of ['hunger', 'happiness', 'energy', 'social'] as const) {
    const v = t.needs[k];
    const row = el('div', { class: 'need-row' });
    row.appendChild(el('div', { class: 'need-label', text: k }));
    const bar = el('div', { class: 'need-bar' });
    const fill = el('div', { class: 'need-fill' });
    fill.style.width = `${Math.round((v / 10) * 100)}%`;
    bar.appendChild(fill);
    row.appendChild(bar);
    row.appendChild(el('div', { class: 'need-val', text: `${v.toFixed(1)}/10` }));
    host.appendChild(row);
  }
}
