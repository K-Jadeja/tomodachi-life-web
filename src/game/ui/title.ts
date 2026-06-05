// Title screen. A fullscreen DOM panel with a friendly welcome, a "New
// Island" button, and a "Continue" button if a save exists.

import { el, clear } from './dom';
import { game } from '../state/state';
import { loadGame } from '../state/save';
import { sfxClick, sfxSelect, unlockAudio } from '../../engine';
import { seedNewIsland } from '../state/seed';

let root: HTMLDivElement | null = null;

export async function showTitle(host: HTMLElement): Promise<void> {
  if (root) root.remove();
  root = el('div', { class: 'title' });
  host.appendChild(root);
  await render();
}

export function hideTitle(): void {
  if (root) { root.remove(); root = null; }
}

export async function showBootStatus(text: string, pct?: number): Promise<void> {
  const boot = document.getElementById('boot');
  const status = document.getElementById('boot-status');
  const bar = document.getElementById('boot-progress');
  if (status) status.textContent = text;
  if (bar && pct != null) (bar as HTMLElement).style.width = `${Math.max(0, Math.min(100, pct))}%`;
  if (boot && pct === 100) {
    setTimeout(() => boot.classList.add('hidden'), 200);
  }
}

async function render(): Promise<void> {
  if (!root) return;
  clear(root);
  const wrap = el('div', { class: 'title-wrap' });
  wrap.appendChild(el('h1', { text: 'TOMO ISLAND' }));
  wrap.appendChild(el('p', { class: 'title-sub', text: 'Build little characters. Help them find what their hearts wish for.' }));
  const buttons = el('div', { class: 'title-buttons' });

  const newBtn = el('button', { text: '✨ New Island' });
  newBtn.addEventListener('click', () => {
    sfxClick();
    unlockAudio();
    seedNewIsland();
    window.dispatchEvent(new CustomEvent('tomo:start'));
  });
  buttons.appendChild(newBtn);

  // Try to load save
  const hasSave = await loadGame();
  if (hasSave) {
    const continueBtn = el('button', { class: 'secondary', text: '↻ Continue' });
    continueBtn.addEventListener('click', () => {
      sfxClick();
      unlockAudio();
      window.dispatchEvent(new CustomEvent('tomo:start'));
    });
    buttons.appendChild(continueBtn);
  }

  wrap.appendChild(buttons);
  wrap.appendChild(el('p', { class: 'title-foot', text: 'Built on a tiny 2D engine · runs offline once loaded' }));
  root.appendChild(wrap);

  // Avoid unused warning
  void game;
}
