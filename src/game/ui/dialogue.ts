// Speech bubbles and dialogue UI. Renders as DOM elements positioned over
// the canvas, above each Tomodachi. One bubble per active speaker.
//
// LLM (Gemma) is opt-in. If ensureLlm() fails or the player hasn't opted
// in, we fall back to a scripted bark for the Tomodachi.

import { Tomodachi, CHARACTER_HEIGHT, speakForTomo, stopSpeaking, getApp, llm, llmStream, llmPrompts, el, clear } from '../../engine';
import { game, pushEvent, updateTomodachi } from '../state/state';
import { SAMPLE_GREETINGS, SAMPLE_FAREWELLS, STYLE_GUIDE } from '../content/greetings';
import { pickBark } from '../content/barks';
import { dominantMood, shortPersonality, timeContext, describePersonality, moodDescriptor, needsSummary } from '../../engine';
import { topFriends, onTalk } from '../play/relationships';
import { recall } from '../play/memory';
import { TomodachiInternal } from '../play/types';

const activeBubbles = new Map<string, HTMLDivElement>(); // tomodachiId -> bubble
let dialogueHistory: Array<{ role: 'user' | 'model'; tomodachiId: string; text: string }> = [];
let activeDialoguePanel: HTMLDivElement | null = null;
let llmOptedIn = false;

export function setLlmOptIn(v: boolean): void {
  llmOptedIn = v;
}

export function isLlmOptIn(): boolean {
  return llmOptedIn;
}

export function getDialogueHistory(tomodachiId: string) {
  return dialogueHistory.filter((h) => h.tomodachiId === tomodachiId);
}

export function showSpeechBubble(
  t: Tomodachi,
  text: string,
  source: 'bark' | 'llm' = 'bark',
  durationSec = 5
): void {
  let bubble = activeBubbles.get(t.id);
  if (!bubble) {
    bubble = el('div', { class: 'bubble' });
    document.getElementById('ui')!.appendChild(bubble);
    activeBubbles.set(t.id, bubble);
  }
  bubble.innerHTML = '';
  const txt = el('div', { class: 'bubble-text', text });
  bubble.appendChild(txt);
  if (source === 'bark') bubble.classList.add('bubble-bark'); else bubble.classList.add('bubble-llm');

  positionBubble(t, bubble);

  if (source === 'bark') {
    setTimeout(() => {
      if (bubble && bubble.parentElement && bubble.textContent === txt.textContent) {
        bubble.remove();
        activeBubbles.delete(t.id);
      }
    }, durationSec * 1000);
  }
}

export function clearSpeechBubble(tomodachiId: string): void {
  const b = activeBubbles.get(tomodachiId);
  if (b) { b.remove(); activeBubbles.delete(tomodachiId); }
}

export function clearAllBubbles(): void {
  for (const b of activeBubbles.values()) b.remove();
  activeBubbles.clear();
}

function positionBubble(t: Tomodachi, bubble: HTMLDivElement): void {
  const app = getApp();
  if (!app) return;
  const rect = app.canvas.getBoundingClientRect();
  const sx = rect.width / 480;
  const sy = rect.height / 270;
  const px = rect.left + t.x * sx;
  const py = rect.top + (t.y - CHARACTER_HEIGHT) * sy;
  bubble.style.left = `${px}px`;
  bubble.style.top = `${py - 8}px`;
  bubble.style.transform = 'translate(-50%, -100%)';
  bubble.style.position = 'absolute';
}

export function repositionBubbles(): void {
  for (const [id, b] of activeBubbles) {
    const t = game.get().tomodachis.find((x) => x.id === id);
    if (t) positionBubble(t, b);
  }
}

/**
 * Open a full dialogue panel for talking to a Tomodachi.
 *
 * If the LLM is opted in AND supported, we use streamReply. Otherwise
 * we fall back to scripted barks (the AI) — the player can still
 * "talk" but the response is a deterministic in-character line.
 */
export function openDialogue(t: Tomodachi): void {
  if (activeDialoguePanel) activeDialoguePanel.remove();
  const ui = document.getElementById('ui')!;
  const panel = el('div', { class: 'dialogue-panel' });
  const header = el('div', { class: 'dialogue-header' }, [
    el('strong', { text: t.name }),
    el('span', { class: 'dialogue-mood', text: `· ${t.mood}` }),
    el('button', { class: 'secondary', text: '✕', attrs: { 'data-close': '1' } }),
  ]);
  const history = el('div', { class: 'dialogue-history' });
  const inputRow = el('div', { class: 'dialogue-input-row' });
  const input = el('input', {
    attrs: { type: 'text', placeholder: `Say something to ${t.name}…`, maxlength: '120' },
  }) as HTMLInputElement;
  const sendBtn = el('button', { text: 'Send' });
  const speakBtn = el('button', { class: 'secondary', text: '🔊 Hear' });
  const llmToggle = el('button', { class: llmOptedIn ? 'active' : 'secondary', text: llmOptedIn ? '🧠 LLM on' : '🧠 LLM off' });
  inputRow.appendChild(input);
  inputRow.appendChild(sendBtn);
  inputRow.appendChild(speakBtn);
  inputRow.appendChild(llmToggle);

  panel.appendChild(header);
  panel.appendChild(history);
  panel.appendChild(inputRow);

  // Hydrate history
  const turns = getDialogueHistory(t.id);
  for (const h of turns) renderTurn(history, h.role, h.text, t.name);

  ui.appendChild(panel);
  activeDialoguePanel = panel;
  setTimeout(() => input.focus(), 50);

  const close = () => {
    panel.remove();
    activeDialoguePanel = null;
  };
  header.querySelector('[data-close]')?.addEventListener('click', close);

  // Bump talkCount for the wish engine
  const bumpTalk = () => {
    const ext = t as TomodachiInternal;
    updateTomodachi(t.id, { talkCount: (ext.talkCount ?? 0) + 1 } as Partial<Tomodachi>);
    // Co-presence affinity bump
    onTalk(t.id, t.id);
  };

  const askScripted = (userText: string) => {
    if (!userText.trim()) return;
    renderTurn(history, 'user', userText, 'You');
    dialogueHistory.push({ role: 'user', tomodachiId: t.id, text: userText });
    // Pick a bark relevant to the current context. This is a fallback reply.
    const reply = pickBark(['greeting', 'happy', 'thinking', t.mood === 'sad' ? 'sad' : 'happy']);
    setTimeout(() => {
      renderTurn(history, 'model', reply, t.name);
      dialogueHistory.push({ role: 'model', tomodachiId: t.id, text: reply });
      showSpeechBubble(t, reply, 'llm');
      pushEvent({ time: game.get().time.totalMinutes, day: game.get().time.day, kind: 'talk', text: reply, tomodachiId: t.id });
      speakForTomo(t, reply, undefined, undefined).catch(() => { /* ignore */ });
    }, 250);
    bumpTalk();
  };

  const askLlm = async (userText: string) => {
    if (!userText.trim()) return;
    renderTurn(history, 'user', userText, 'You');
    dialogueHistory.push({ role: 'user', tomodachiId: t.id, text: userText });
    input.disabled = true;
    sendBtn.disabled = true;
    const pending = renderTurn(history, 'model', '…thinking…', t.name);

    let acc = '';
    try {
      updateTomodachi(t.id, { state: 'talking', stateTime: 0 });
      const fullHistory = getDialogueHistory(t.id).map((h) => ({ role: h.role, text: h.text }));
      await llm.ensureLlm((pct, status) => {
        pending.textContent = `[loading… ${pct}% ${status}]`;
      });
      const config: llmPrompts.DialoguePromptConfig = {
        context: () => ({
          time: game.get().time,
          timeContext: timeContext(game.get().time.hour),
        }),
        styleGuide: STYLE_GUIDE,
        sampleGreetings: SAMPLE_GREETINGS,
        sampleFarewells: SAMPLE_FAREWELLS,
      };
      await llmStream.streamReply(t, fullHistory, userText, config, {
        onToken: (tok) => {
          if (tok.startsWith('[loading')) return;
          acc += tok;
          pending.textContent = acc;
        },
        onDone: (full) => {
          pending.textContent = full;
          dialogueHistory.push({ role: 'model', tomodachiId: t.id, text: full });
          pushEvent({ time: game.get().time.totalMinutes, day: game.get().time.day, kind: 'talk', text: full, tomodachiId: t.id });
          showSpeechBubble(t, full, 'llm');
          speakForTomo(t, full, undefined, undefined).catch(() => { /* ignore */ });
          history.scrollTop = history.scrollHeight;
          updateTomodachi(t.id, { state: 'idle', stateTime: 0 });
        },
        onError: (e) => {
          pending.textContent = `[error: ${(e as Error).message ?? 'unknown'}]`;
          updateTomodachi(t.id, { state: 'idle', stateTime: 0 });
        },
      });
    } catch (e) {
      pending.textContent = `[error: ${(e as Error).message ?? 'unknown'}]`;
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
    bumpTalk();
  };

  const ask = (userText: string) => {
    if (llmOptedIn) {
      void askLlm(userText);
    } else {
      askScripted(userText);
    }
  };

  const speakLastModel = () => {
    const lastModel = [...dialogueHistory].reverse().find((h) => h.tomodachiId === t.id && h.role === 'model');
    if (lastModel) speakForTomo(t, lastModel.text).catch(() => { /* ignore */ });
  };

  sendBtn.addEventListener('click', () => {
    const v = input.value;
    input.value = '';
    ask(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = input.value;
      input.value = '';
      ask(v);
    }
  });
  speakBtn.addEventListener('click', speakLastModel);
  llmToggle.addEventListener('click', () => {
    llmOptedIn = !llmOptedIn;
    llmToggle.textContent = llmOptedIn ? '🧠 LLM on' : '🧠 LLM off';
    llmToggle.className = llmOptedIn ? 'active' : 'secondary';
  });
}

function renderTurn(parent: HTMLElement, role: 'user' | 'model', text: string, name: string): HTMLDivElement {
  const row = el('div', { class: `dialogue-turn ${role === 'user' ? 'user' : 'model'}` });
  const who = el('div', { class: 'who', text: name });
  const body = el('div', { class: 'body', text });
  row.appendChild(who);
  row.appendChild(body);
  parent.appendChild(row);
  parent.scrollTop = parent.scrollHeight;
  return body;
}

export function stopAllDialogue(): void {
  if (activeDialoguePanel) {
    activeDialoguePanel.remove();
    activeDialoguePanel = null;
  }
  clearAllBubbles();
  stopSpeaking();
}

// Suppress unused warnings
void dominantMood; void shortPersonality; void describePersonality;
void moodDescriptor; void needsSummary; void topFriends; void recall;
void clear;
