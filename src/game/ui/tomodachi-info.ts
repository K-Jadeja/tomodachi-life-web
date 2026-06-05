// Tomodachi info panel. A detailed modal that shows:
//   - name, mood, archetype, current state & location
//   - 4 need bars (compact)
//   - Active Wish: hidden until 3 hints are revealed, then title + hints
//   - Top 3 friends
//   - Recent memory strip (last 3 records)
//   - Actions: Send to <location>, Talk, Feed, Nap
//
// The panel is the player's main observation tool for discovering wishes.

import { Tomodachi, GameTime, el, clear, timeContext, listRegisteredLocations, sfxSelect } from '../../engine';
import { game, setLocation } from '../state/state';
import { TomodachiInternal } from '../play/types';
import { revealedHints, wishTitle, getWishDef, archetypeName } from '../play/wishes';
import { topFriends } from '../play/relationships';
import { recall } from '../play/memory';
import { sendTo as sendToLoc } from '../play/schedule';
import { feed, nap } from '../play/needs';

let root: HTMLDivElement | null = null;

export function showTomodachiInfo(t: Tomodachi, host: HTMLElement = document.getElementById('ui')!): void {
  hideTomodachiInfo();
  root = el('div', { class: 'tomo-info' });
  host.appendChild(root);
  render();
}

export function hideTomodachiInfo(): void {
  if (root) { root.remove(); root = null; }
}

function render(): void {
  if (!root) return;
  clear(root);
  const s = game.get();
  const t = s.tomodachis.find((x) => x.id === s.selectedId);
  if (!t) { hideTomodachiInfo(); return; }

  const ext = t as TomodachiInternal;
  const time = s.time;

  const wrap = el('div', { class: 'tomo-info-wrap' });
  const head = el('div', { class: 'tomo-info-head' });
  head.appendChild(el('h2', { text: t.name }));
  head.appendChild(el('span', { class: 'tomo-arch', text: archetypeName(t) }));
  const close = el('button', { class: 'secondary', text: '✕' });
  close.addEventListener('click', () => hideTomodachiInfo());
  head.appendChild(close);
  wrap.appendChild(head);

  // Status row
  const status = el('div', { class: 'tomo-info-status' });
  status.appendChild(el('span', { class: 'pill', text: `Mood: ${t.mood}` }));
  status.appendChild(el('span', { class: 'pill', text: `State: ${t.state}` }));
  status.appendChild(el('span', { class: 'pill', text: `Location: ${t.location}` }));
  status.appendChild(el('span', { class: 'pill', text: `Day ${time.day} · ${timeContext(time.hour)}` }));
  wrap.appendChild(status);

  // Needs (compact)
  const needs = el('div', { class: 'tomo-info-needs' });
  needs.appendChild(needBar('hunger', t.needs.hunger, 0xd04848));
  needs.appendChild(needBar('happiness', t.needs.happiness, 0xffd166));
  needs.appendChild(needBar('energy', t.needs.energy, 0x4a8fd6));
  needs.appendChild(needBar('social', t.needs.social, 0xe87aaa));
  wrap.appendChild(needs);

  // Wish panel
  const wish = ext.wish;
  const wishSection = el('div', { class: 'tomo-info-section tomo-info-wish' });
  wishSection.appendChild(el('h3', { text: 'Heart\'s Wish' }));
  if (!wish) {
    wishSection.appendChild(el('p', { class: 'muted', text: 'No wish yet.' }));
  } else {
    const w = getWishDef(t);
    wishSection.appendChild(el('div', { class: 'tomo-wish-title', text: wishTitle(t) }));
    if (w) {
      const hints = w.hints;
      const revealed = wish.progress.hintsRevealed;
      const list = el('ol', { class: 'tomo-wish-hints' });
      for (let i = 0; i < hints.length; i++) {
        const li = el('li', {
          class: i < revealed ? 'revealed' : 'locked',
          text: i < revealed ? hints[i] : '???',
        });
        list.appendChild(li);
      }
      wishSection.appendChild(list);
      if (wish.status === 'fulfilled') {
        wishSection.appendChild(el('p', { class: 'tomo-wish-fulfilled', text: '✦ Fulfilled! A small permanent boost to happiness.' }));
      } else if (wish.status === 'discovered') {
        wishSection.appendChild(el('p', { class: 'muted', text: 'Title revealed. Help them reach the goal.' }));
      } else {
        wishSection.appendChild(el('p', { class: 'muted', text: 'Find 3 hints to discover the wish.' }));
      }
    }
  }
  wrap.appendChild(wishSection);

  // Friends
  const friends = topFriends(t.id, 3);
  const friendsSection = el('div', { class: 'tomo-info-section tomo-info-friends' });
  friendsSection.appendChild(el('h3', { text: 'Friends' }));
  if (friends.length === 0) {
    friendsSection.appendChild(el('p', { class: 'muted', text: 'No close friends yet. Spend time together.' }));
  } else {
    const list = el('ul', { class: 'tomo-friends-list' });
    for (const f of friends) {
      const li = el('li', {});
      const bar = el('div', { class: 'friend-bar' });
      const fill = el('div', { class: 'friend-fill' });
      fill.style.width = `${f.score}%`;
      bar.appendChild(fill);
      li.appendChild(el('span', { text: f.name }));
      li.appendChild(bar);
      li.appendChild(el('span', { class: 'friend-score', text: `${f.score}` }));
      list.appendChild(li);
    }
    friendsSection.appendChild(list);
  }
  wrap.appendChild(friendsSection);

  // Recent memory
  const memories = recall(t, 4);
  const memSection = el('div', { class: 'tomo-info-section tomo-info-memory' });
  memSection.appendChild(el('h3', { text: 'Recent memories' }));
  if (memories.length === 0) {
    memSection.appendChild(el('p', { class: 'muted', text: 'Nothing notable yet.' }));
  } else {
    const list = el('ul', { class: 'tomo-memory-list' });
    for (const m of memories) {
      const li = el('li', { text: memoryText(m) });
      list.appendChild(li);
    }
    memSection.appendChild(list);
  }
  wrap.appendChild(memSection);

  // Actions
  const actions = el('div', { class: 'tomo-info-actions' });
  const talkBtn = el('button', { text: '💬 Talk' });
  talkBtn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('tomo:talk', { detail: t.id })));
  const feedBtn = el('button', { text: '🍙 Feed' });
  feedBtn.addEventListener('click', () => { feed(t); sfxSelect(); });
  const napBtn = el('button', { text: '😴 Nap' });
  napBtn.addEventListener('click', () => { nap(t); sfxSelect(); });
  actions.appendChild(talkBtn);
  actions.appendChild(feedBtn);
  actions.appendChild(napBtn);

  // Send-to buttons
  const sendRow = el('div', { class: 'tomo-info-send' });
  sendRow.appendChild(el('span', { class: 'muted', text: 'Send to: ' }));
  for (const loc of listRegisteredLocations()) {
    if (!['apartment', 'beach', 'park', 'cafe', 'town'].includes(loc.id)) continue;
    const b = el('button', {
      class: loc.id === t.location ? 'active' : '',
      text: loc.name,
    });
    b.addEventListener('click', () => {
      sendToLoc(t, loc.id as 'apartment' | 'beach' | 'park' | 'cafe' | 'town', time);
      // If we're viewing another location, also switch.
      if (game.get().currentLocation !== loc.id) setLocation(loc.id);
      sfxSelect();
    });
    sendRow.appendChild(b);
  }
  actions.appendChild(sendRow);
  wrap.appendChild(actions);

  root.appendChild(wrap);
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

function memoryText(m: ReturnType<typeof recall>[number]): string {
  const when = `Day ${m.at.day} ${String(m.at.hour).padStart(2, '0')}:${String(m.at.minute).padStart(2, '0')}`;
  switch (m.kind) {
    case 'visit': return `${when} · visited ${m.key}`;
    case 'talk': return `${when} · talked with someone`;
    case 'feed': return `${when} · was fed`;
    case 'gift': return `${when} · received a gift`;
    case 'companion': return `${when} · spent time with ${m.key}`;
    case 'observe': return `${when} · ${m.note ?? 'something interesting'}`;
  }
}

// GameTime is a type; no runtime reference needed.
