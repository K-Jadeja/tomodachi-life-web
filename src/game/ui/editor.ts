// Character editor. Fullscreen DOM panel with a live Pixi preview of the
// Tomodachi being built, plus sliders/dropdowns for each part and color.

import { el, clear } from './dom';
import { Application, Graphics, Container } from 'pixi.js';
import {
  createApp,
  buildCharacter, drawEyesState, drawMouthState,
  CHARACTER_WIDTH, CHARACTER_HEIGHT,
  HAIR_VARIANTS, HEAD_VARIANTS, EYE_VARIANTS, MOUTH_VARIANTS,
  SKIN_COLORS, HAIR_COLORS, OUTFIT_COLORS, ACCENT_COLORS,
  sfxClick, sfxSelect, unlockAudio,
} from '../../engine';
import { Tomodachi, TomodachiParts, TomodachiColors } from '../../engine';
import { addTomodachi, createTomodachi } from '../state/state';
import { assignWishTo } from '../play/wishes';
import { game } from '../state/state';
import { randomName } from '../content/names';
import { ARCHETYPES, ArchetypeId } from '../content/archetypes';

let root: HTMLDivElement | null = null;
let previewApp: Application | null = null;
let previewRig: ReturnType<typeof buildCharacter> | null = null;
let current: Tomodachi | null = null;
let activeTicker: (() => void) | null = null;
let activeApp: Application | null = null;

export async function showEditor(host: HTMLElement, existing?: Tomodachi): Promise<void> {
  if (root) root.remove();
  current = existing ? { ...existing } : createTomodachi({ name: 'New' });
  current.x = 100;
  current.y = 200;

  root = el('div', { class: 'editor' });
  host.appendChild(root);
  await render();
}

export function hideEditor(): void {
  if (root) { root.remove(); root = null; }
  if (previewApp) {
    try { previewApp.destroy(true, { children: true }); } catch { /* ignore */ }
    previewApp = null;
    previewRig = null;
  }
}

async function render(): Promise<void> {
  if (!root || !current) return;
  clear(root);

  const wrap = el('div', { class: 'editor-wrap' });
  const head = el('div', { class: 'editor-head' });
  head.appendChild(el('h2', { text: 'Tomodachi Creator' }));
  const close = el('button', { class: 'secondary', text: '✕' });
  close.addEventListener('click', () => window.dispatchEvent(new CustomEvent('tomo:close-editor')));
  head.appendChild(close);
  wrap.appendChild(head);

  const body = el('div', { class: 'editor-body' });

  const previewHost = el('div', { class: 'editor-preview' });
  body.appendChild(previewHost);
  await initPreview(previewHost);

  const controls = el('div', { class: 'editor-controls' });

  // Name
  const nameRow = el('div', { class: 'row' });
  nameRow.appendChild(el('label', { text: 'Name' }));
  const nameInput = el('input', { attrs: { type: 'text', maxlength: '16' } }) as HTMLInputElement;
  nameInput.value = current.name;
  nameInput.addEventListener('input', () => { current!.name = nameInput.value || 'Anon'; });
  nameRow.appendChild(nameInput);
  controls.appendChild(nameRow);

  // Archetype picker
  const archRow = el('div', { class: 'row' });
  archRow.appendChild(el('label', { text: 'Archetype' }));
  const archPicker = el('div', { class: 'part-picker' });
  let selectedArch: ArchetypeId | null = null;
  const archIds = Object.keys(ARCHETYPES) as ArchetypeId[];
  for (const id of archIds) {
    const btn = el('button', { text: ARCHETYPES[id].name });
    btn.addEventListener('click', () => {
      sfxClick();
      archPicker.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedArch = id;
      const def = ARCHETYPES[id];
      current!.personality = { ...def.defaultPersonality };
    });
    archPicker.appendChild(btn);
  }
  archRow.appendChild(archPicker);
  controls.appendChild(archRow);

  // Part pickers
  controls.appendChild(partPicker('Head', 'head', HEAD_VARIANTS, current.parts.head, (v) => {
    current!.parts.head = v; refreshPreview();
  }));
  controls.appendChild(partPicker('Eyes', 'eyes', EYE_VARIANTS, current.parts.eyes, (v) => {
    current!.parts.eyes = v; refreshPreview();
  }));
  controls.appendChild(partPicker('Mouth', 'mouth', MOUTH_VARIANTS, current.parts.mouth, (v) => {
    current!.parts.mouth = v; refreshPreview();
  }));
  controls.appendChild(partPicker('Hair', 'hair', HAIR_VARIANTS, current.parts.hair, (v) => {
    current!.parts.hair = v; refreshPreview();
  }));
  controls.appendChild(partPicker('Body', 'body', 4, current.parts.body, (v) => {
    current!.parts.body = v; refreshPreview();
  }));
  controls.appendChild(partPicker('Outfit', 'outfit', 6, current.parts.outfit, (v) => {
    current!.parts.outfit = v; refreshPreview();
  }));
  controls.appendChild(partPicker('Accessory', 'accessory', 5, current.parts.accessory, (v) => {
    current!.parts.accessory = v; refreshPreview();
  }));

  // Color pickers
  controls.appendChild(colorPicker('Skin', SKIN_COLORS, current.colors.skin, (v) => {
    current!.colors.skin = v; refreshPreview();
  }));
  controls.appendChild(colorPicker('Hair color', HAIR_COLORS, current.colors.hair, (v) => {
    current!.colors.hair = v; refreshPreview();
  }));
  controls.appendChild(colorPicker('Outfit primary', OUTFIT_COLORS, current.colors.primary, (v) => {
    current!.colors.primary = v; refreshPreview();
  }));
  controls.appendChild(colorPicker('Outfit accent', ACCENT_COLORS, current.colors.secondary, (v) => {
    current!.colors.secondary = v; refreshPreview();
  }));

  // Personality randomization
  const pRow = el('div', { class: 'row' });
  pRow.appendChild(el('label', { text: 'Personality' }));
  const randBtn = el('button', { class: 'secondary', text: '🎲 Reroll' });
  randBtn.addEventListener('click', () => {
    sfxClick();
    current!.personality = {
      openness: 1 + Math.floor(Math.random() * 9),
      conscientiousness: 1 + Math.floor(Math.random() * 9),
      extraversion: 1 + Math.floor(Math.random() * 9),
      agreeableness: 1 + Math.floor(Math.random() * 9),
      neuroticism: 1 + Math.floor(Math.random() * 9),
    };
  });
  pRow.appendChild(randBtn);
  controls.appendChild(pRow);

  // Save / add
  const actions = el('div', { class: 'editor-actions' });
  const saveBtn = el('button', { text: '💾 Save & Add' });
  saveBtn.addEventListener('click', () => {
    sfxSelect();
    unlockAudio();
    if (!current!.name) current!.name = randomName();
    const t = { ...current!, x: 200 + Math.random() * 80, homeX: 240, y: 240, location: 'apartment' as const };
    addTomodachi(t);
    // Assign a wish based on picked archetype, or random if none
    const arch = selectedArch ?? archIds[Math.floor(Math.random() * archIds.length)];
    assignWishTo(t, arch, game.get().time);
    window.dispatchEvent(new CustomEvent('tomo:close-editor'));
  });
  actions.appendChild(saveBtn);
  controls.appendChild(actions);

  body.appendChild(controls);
  wrap.appendChild(body);
  root.appendChild(wrap);

  refreshPreview();
}

async function initPreview(host: HTMLElement): Promise<void> {
  if (previewApp) {
    try { previewApp.destroy(true, { children: true }); } catch { /* ignore */ }
    previewApp = null;
    previewRig = null;
  }
  const app = await createApp({ host });
  app.renderer.background.color = 0xfde7d3;
  previewApp = app;
  const stage = app.stage;
  const rig = buildCharacter(current!);
  rig.container.position.set(480 / 2 - CHARACTER_WIDTH / 2, 270 - CHARACTER_HEIGHT + 4);
  stage.addChild(rig.container);
  previewRig = rig;
  drawEyesState(rig.eyesL, rig.eyesR, current!, 0);
  drawMouthState(rig.mouthG, current!, 0);

  bindTickerToRig(app, rig);
}

function refreshPreview(): void {
  if (!previewApp || !previewRig || !current) return;
  const stage = previewApp.stage;
  const old = previewRig;
  stage.removeChild(old.container);
  old.container.destroy({ children: true });
  const rig = buildCharacter(current);
  rig.container.position.set(480 / 2 - CHARACTER_WIDTH / 2, 270 - CHARACTER_HEIGHT + 4);
  stage.addChild(rig.container);
  previewRig = rig;
  drawEyesState(rig.eyesL, rig.eyesR, current, 0);
  drawMouthState(rig.mouthG, current, 0);
  if (activeTicker) activeApp?.ticker.remove(activeTicker);
  bindTickerToRig(previewApp, rig);
}

function bindTickerToRig(app: Application, rig: ReturnType<typeof buildCharacter>): void {
  let t = 0;
  const fn = () => {
    t += 0.016;
    if (!previewRig || rig !== previewRig) return;
    rig.container.position.y = (270 - CHARACTER_HEIGHT + 4) + Math.sin(t * 2) * 2;
    drawEyesState(rig.eyesL, rig.eyesR, current!, Math.sin(t * 0.7) > 0.98 ? 2 : 0);
    drawMouthState(rig.mouthG, current!, Math.floor(t * 2) % 2 === 0 ? 0 : 1);
  };
  app.ticker.add(fn);
  activeTicker = fn;
  activeApp = app;
}

function partPicker(
  label: string,
  key: keyof TomodachiParts,
  count: number,
  initial: number,
  onChange: (v: number) => void
): HTMLElement {
  const row = el('div', { class: 'row' });
  row.appendChild(el('label', { text: label }));
  const wrap = el('div', { class: 'part-picker' });
  for (let i = 0; i < count; i++) {
    const btn = el('button', { class: i === initial ? 'active' : '', text: String(i) });
    btn.addEventListener('click', () => {
      sfxClick();
      wrap.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(i);
    });
    wrap.appendChild(btn);
  }
  row.appendChild(wrap);
  return row;
}

function colorPicker(
  label: string,
  palette: number[],
  initial: number,
  onChange: (v: number) => void
): HTMLElement {
  const row = el('div', { class: 'row' });
  row.appendChild(el('label', { text: label }));
  const wrap = el('div', { class: 'color-picker' });
  for (let i = 0; i < palette.length; i++) {
    const swatch = el('button', {
      class: i === initial ? 'active' : '',
      attrs: { style: `background:#${palette[i].toString(16).padStart(6, '0')};` },
    });
    swatch.addEventListener('click', () => {
      sfxClick();
      wrap.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      swatch.classList.add('active');
      onChange(i);
    });
    wrap.appendChild(swatch);
  }
  row.appendChild(wrap);
  return row;
}

// Suppress unused warnings for Graphics/Container (kept for future use)
void Graphics; void Container;
