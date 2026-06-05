// Small DOM helpers.

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts: { class?: string; text?: string; html?: string; attrs?: Record<string, string> } = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text) node.textContent = opts.text;
  if (opts.html) node.innerHTML = opts.html;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  for (const c of children) {
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function on<K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void
): () => void {
  node.addEventListener(event, handler);
  return () => node.removeEventListener(event, handler);
}
