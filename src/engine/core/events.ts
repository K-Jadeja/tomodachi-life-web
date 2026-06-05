// Event log helpers. The engine doesn't own the event log; the host wires
// sinks/getters once on boot, and all callers use the helpers below.
//
// This decouples the engine from any specific state shape.

import { GameEvent, Tomodachi } from './types';

export type EventSink = (ev: GameEvent) => void;
export type EventGetter = () => GameEvent[];

let sink: EventSink = () => { /* no-op until host wires it */ };
let getter: EventGetter = () => [];

export function setEventSink(fn: EventSink): void { sink = fn; }
export function setEventGetter(fn: EventGetter): void { getter = fn; }

function push(kind: GameEvent['kind'], text: string, tomodachiId?: string): void {
  // Read the current time from the getter if it exposes one. We don't have
  // a clock getter in this minimal API, so we use 0 for time/day as a fallback.
  // Hosts that need accurate timestamps can override setEventSink with a
  // sink that pulls from their own store.
  sink({
    time: 0,
    day: 0,
    kind,
    text,
    tomodachiId,
  });
}

export function logBark(t: Tomodachi, text: string): void {
  push('bark', text, t.id);
}

export function logTalk(t: Tomodachi, text: string): void {
  push('talk', text, t.id);
}

export function logThought(t: Tomodachi, text: string): void {
  push('thought', text, t.id);
}

export function logSystem(text: string): void {
  push('system', text);
}

export function recentEventsFor(tomodachiId: string, n = 6): GameEvent[] {
  return getter().filter((e) => e.tomodachiId === tomodachiId).slice(-n);
}

export function recentAll(n = 10): GameEvent[] {
  return getter().slice(-n);
}
