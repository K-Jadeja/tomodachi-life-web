// Streaming wrapper around the LLM. Calls generateResponse with a callback
// to surface tokens as they arrive, and resolves when the model finishes.

import type { LlmInference } from '@mediapipe/tasks-genai';
import { ensureLlm, getCachedLlm } from './loader';
import { buildFullPrompt, DialogueTurn, DialoguePromptConfig } from './prompts';
import { Tomodachi } from '../core/types';

export interface StreamOptions {
  onToken: (partial: string) => void;
  onDone: (full: string) => void;
  onError: (e: unknown) => void;
  signal?: AbortSignal;
}

let currentRun: { aborted: boolean } | null = null;

export async function streamReply(
  t: Tomodachi,
  history: DialogueTurn[],
  userMessage: string,
  config: DialoguePromptConfig,
  opts: StreamOptions
): Promise<void> {
  const llm = await ensureLlm((pct, status) => {
    opts.onToken(`[loading… ${pct}% ${status}]`);
  });

  if (opts.signal?.aborted) return;

  const prompt = buildFullPrompt(t, history, userMessage, config);
  const run = { aborted: false };
  currentRun = run;
  opts.signal?.addEventListener('abort', () => { run.aborted = true; });

  let buffer = '';
  let firstTokenSeen = false;

  await new Promise<void>((resolve) => {
    (llm as LlmInference).generateResponse(
      prompt,
      (partial: string, done: boolean) => {
        if (run.aborted) {
          resolve();
          return;
        }
        if (partial) {
          if (!firstTokenSeen && !partial.startsWith('[loading')) {
            firstTokenSeen = true;
            buffer = '';
          }
          buffer += partial;
          opts.onToken(partial);
        }
        if (done) {
          if (!firstTokenSeen) {
            buffer = '';
          } else {
            buffer = buffer.replace(/\[loading[^\]]*\]\s*/g, '');
          }
          opts.onDone(buffer.trim());
          resolve();
        }
      }
    );
  });

  if (currentRun === run) currentRun = null;
}

export function abortCurrent(): void {
  if (currentRun) currentRun.aborted = true;
}

export function isReady(): boolean {
  return getCachedLlm() !== null;
}
