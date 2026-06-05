// HUD: day/time clock, location nav buttons, current Tomodachi's needs
// (when one is selected), and general control buttons.

import { el, clear } from './dom';
import { game, setLocation, setSelected } from '../state/state';
import { Tomodachi, timeContext, listRegisteredLocations, sfxClick, sfxSelect } from '../../engine';
import { feed, nap } from '../play/needs';

let hudRoot: HTMLDivElement | null = null;

let lastLocation: string | null = null;

export function mountHud(host: HTMLElement): void {
  hudRoot = el('div', { class: 'hud' });
  host.appendChild(hudRoot);
  renderHud();
  lastLocation = game.get().currentLocation;
  // Re-render the nav row whenever the player navigates between locations,
  // so the Island/Back buttons stay in sync without a full re-render.
  game.subscribe((s) => {
    if (s.currentLocation !== lastLocation) {
      lastLocation = s.currentLocation;
      renderNavRow();
    }
  });
  window.addEventListener('resize', renderHud);
}

export function updateUI(): void {
  if (!hudRoot) return;
  const s = game.get();
  const clock = hudRoot.querySelector('.hud-clock') as HTMLElement | null;
  if (clock) {
    clock.textContent = `Day ${s.time.day} · ${String(s.time.hour).padStart(2, '0')}:${String(s.time.minute).padStart(2, '0')} · ${timeContext(s.time.hour)}`;
  }
  const sel = s.selectedId;
  if (sel) {
    const t = s.tomodachis.find((x) => x.id === sel);
    if (t) renderSelected(t);
  }
}

/** Re-renders just the bottom nav row (Island / Back / interior buttons). */
function renderNavRow(): void {
  if (!hudRoot) return;
  const old = hudRoot.querySelector('.hud-bottom');
  if (!old) return;
  const next = buildBottomBar();
  hudRoot.replaceChild(next, old);
}

function renderHud(): void {
  if (!hudRoot) return;
  clear(hudRoot);
  const s = game.get();

  // Top bar: clock + location
  const top = el('div', { class: 'hud-top' });
  const clock = el('div', { class: 'hud-clock', text: `Day ${s.time.day} · ${String(s.time.hour).padStart(2, '0')}:${String(s.time.minute).padStart(2, '0')}` });
  top.appendChild(clock);
  hudRoot.appendChild(top);

  // Bottom bar: location nav + global actions
  hudRoot.appendChild(buildBottomBar());

  // Selected panel
  const sel = s.selectedId;
  if (sel) {
    const t = s.tomodachis.find((x) => x.id === sel);
    if (t) {
      const panel = el('div', { class: 'hud-selected' });
      panel.appendChild(renderSelected(t));
      hudRoot.appendChild(panel);
    }
  }
}

/** Build the bottom bar (location nav + global actions). Pure builder. */
function buildBottomBar(): HTMLDivElement {
  const bottom = el('div', { class: 'hud-bottom' });
  const s = game.get();
  const nav = el('div', { class: 'hud-nav' });
  // Island button (always first).
  const islandBtn = el('button', {
    class: s.currentLocation === 'overworld' ? 'active' : '',
    text: '🏝️ Island',
  });
  islandBtn.addEventListener('click', () => {
    sfxSelect();
    setLocation('overworld');
  });
  nav.appendChild(islandBtn);
  // Back button when inside an interior.
  if (s.currentLocation !== 'overworld') {
    const backBtn = el('button', { class: 'secondary', text: '← Island' });
    backBtn.addEventListener('click', () => {
      sfxSelect();
      setLocation('overworld');
    });
    nav.appendChild(backBtn);
  }
  for (const loc of listRegisteredLocations()) {
    if (!['apartment', 'beach', 'park', 'cafe', 'town'].includes(loc.id)) continue;
    const btn = el('button', {
      class: loc.id === s.currentLocation ? 'active' : '',
      text: loc.name,
    });
    btn.addEventListener('click', () => {
      sfxSelect();
      setLocation(loc.id);
    });
    nav.appendChild(btn);
  }
  bottom.appendChild(nav);
  // Buttons: add character, open editor, save
  const actions = el('div', { class: 'hud-actions' });
  const addBtn = el('button', { text: '+ Tomodachi' });
  addBtn.addEventListener('click', () => {
    sfxClick();
    window.dispatchEvent(new CustomEvent('tomo:open-editor'));
  });
  const saveBtn = el('button', { text: '💾 Save' });
  saveBtn.addEventListener('click', () => {
    sfxClick();
    window.dispatchEvent(new CustomEvent('tomo:save'));
  });
  actions.appendChild(addBtn);
  actions.appendChild(saveBtn);
  bottom.appendChild(actions);
  return bottom;
}

function renderSelected(t: Tomodachi): HTMLDivElement {
  const wrap = el('div', { class: 'hud-selected-inner' });
  const head = el('div', { class: 'hud-selected-head' });
  head.appendChild(el('strong', { text: t.name }));
  head.appendChild(el('span', { class: 'mood', text: `· ${t.mood}` }));
  const close = el('button', { class: 'secondary', text: '✕' });
  close.addEventListener('click', () => setSelected(null));
  head.appendChild(close);
  wrap.appendChild(head);

  wrap.appendChild(needBar('hunger', t.needs.hunger, 0xd04848));
  wrap.appendChild(needBar('happiness', t.needs.happiness, 0xffd166));
  wrap.appendChild(needBar('energy', t.needs.energy, 0x4a8fd6));
  wrap.appendChild(needBar('social', t.needs.social, 0xe87aaa));

  const actions = el('div', { class: 'hud-selected-actions' });
  const talkBtn = el('button', { text: '💬 Talk' });
  talkBtn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('tomo:talk', { detail: t.id })));
  const feedBtn = el('button', { text: '🍙 Feed' });
  feedBtn.addEventListener('click', () => {
    feed(t);
    sfxSelect();
  });
  const napBtn = el('button', { text: '😴 Nap' });
  napBtn.addEventListener('click', () => {
    nap(t);
    sfxSelect();
  });
  const infoBtn = el('button', { class: 'secondary', text: 'ℹ️ Info' });
  infoBtn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('tomo:info', { detail: t.id })));
  actions.appendChild(talkBtn);
  actions.appendChild(feedBtn);
  actions.appendChild(napBtn);
  actions.appendChild(infoBtn);
  wrap.appendChild(actions);

  return wrap;
}

function needBar(label: string, value: number, color: number): HTMLElement {
  const row = el('div', { class: 'need-row' });
  row.appendChild(el('div', { class: 'need-label', text: label }));
  const bar = el('div', { class: 'need-bar' });
  const fill = el('div', { class: 'need-fill' });
  fill.style.width = `${Math.round((value / 10) * 100)}%`;
  fill.style.background = `#${color.toString(16).padStart(6, '0')}`;
  bar.appendChild(fill);
  row.appendChild(bar);
  row.appendChild(el('div', { class: 'need-val', text: `${value.toFixed(1)}/10` }));
  return row;
}
