// Lazy LLM loader. We don't import @mediapipe/tasks-genai until the user
// actually wants to talk to a Tomodachi, so the initial bundle is small and
// the engine starts fast.

import type { LlmInference, FilesetResolver } from '@mediapipe/tasks-genai';

export type LoadProgressFn = (pct: number, status: string) => void;

let llm: LlmInference | null = null;
let loadingPromise: Promise<LlmInference> | null = null;

const MODEL_URL =
  'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-int4-web.litertlm';

const MODEL_FALLBACKS = [
  'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-int4-web.task',
  'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-int4-web.litertlm',
];

async function importGenai(): Promise<{
  FilesetResolver: typeof FilesetResolver;
  LlmInference: typeof LlmInference;
}> {
  const mod = await import('@mediapipe/tasks-genai');
  return mod as unknown as {
    FilesetResolver: typeof FilesetResolver;
    LlmInference: typeof LlmInference;
  };
}

async function probeUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function isLlmSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if ('gpu' in navigator) {
    try {
      const gpu = (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu;
      const adapter = await gpu.requestAdapter();
      if (adapter) return true;
    } catch { /* fall through */ }
  }
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export async function ensureLlm(onProgress?: LoadProgressFn): Promise<LlmInference> {
  if (llm) return llm;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onProgress?.(5, 'Loading model runtime…');
    const { FilesetResolver, LlmInference } = await importGenai();

    onProgress?.(15, 'Resolving WebAssembly runtime…');
    const genai = await FilesetResolver.forGenAiTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm'
    );

    onProgress?.(25, 'Looking up model file…');
    const candidates = [MODEL_URL, ...MODEL_FALLBACKS];
    let chosen: string | null = null;
    for (const url of candidates) {
      if (await probeUrl(url)) { chosen = url; break; }
    }
    if (!chosen) {
      throw new Error('Could not find a Gemma 4 LiteRT model at any known URL.');
    }

    onProgress?.(40, 'Downloading model (one-time, ~1-2 GB)…');

    llm = await LlmInference.createFromOptions(genai, {
      baseOptions: { modelAssetPath: chosen },
      maxTokens: 80,
      topK: 40,
      temperature: 0.9,
      randomSeed: 42,
    });

    onProgress?.(100, 'Ready.');
    return llm;
  })();

  try {
    return await loadingPromise;
  } catch (e) {
    loadingPromise = null;
    throw e;
  }
}

export function getCachedLlm(): LlmInference | null {
  return llm;
}

export function clearLlm(): void {
  llm = null;
  loadingPromise = null;
}
