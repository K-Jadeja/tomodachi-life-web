// Generic pub/sub state store.
// Hosts can use this directly, or build their own state store on top of it.
// The store is intentionally minimal: get / set / subscribe.

export type StoreListener<T> = (state: T) => void;

export interface Store<T> {
  get(): T;
  set(updater: (s: T) => T): void;
  subscribe(fn: StoreListener<T>): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<StoreListener<T>>();
  return {
    get() { return state; },
    set(updater) {
      state = updater(state);
      for (const fn of listeners) fn(state);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
  };
}
