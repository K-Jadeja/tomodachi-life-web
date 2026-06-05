// PixiJS Application wrapper. WebGL is preferred — WebGPU on PixiJS v8 hits
// a bind group limit when many Graphics are in the scene (location bgs +
// character rigs can exceed it). WebGL is rock-solid for 2D Graphics.

import { Application } from 'pixi.js';

export const BASE_W = 480;
export const BASE_H = 270;

let app: Application | null = null;

export interface CreateAppOptions {
  host: HTMLElement;
  onReady?: (app: Application) => void;
  onError?: (e: unknown) => void;
}

export async function createApp(opts: CreateAppOptions): Promise<Application> {
  const a = new Application();
  await a.init({
    width: BASE_W,
    height: BASE_H,
    background: 0x0e1726,
    antialias: false,
    resolution: 1,
    autoDensity: true,
    preference: 'webgl',
    hello: false,
  });
  opts.host.appendChild(a.canvas);
  a.canvas.style.width = '100%';
  a.canvas.style.height = '100%';
  a.canvas.style.imageRendering = 'pixelated';
  a.canvas.style.objectFit = 'contain';

  app = a;
  opts.onReady?.(a);
  return a;
}

export function getApp(): Application | null {
  return app;
}
