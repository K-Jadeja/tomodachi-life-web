// Compose a Tomodachi into a PixiJS Container.
//
// Mii-style proportions: a big round head on a small egg-shaped body, with
// stub arms. Eyes are large with white sclera + black pupil + a single white
// highlight dot. Hair wraps around the top of the head.

import { Container, Graphics } from 'pixi.js';
import {
  HAIR_COLORS, OUTFIT_COLORS, ACCENT_COLORS,
  OUTLINE, pickColor, SKIN_COLORS,
} from '../render/palette';
import { drawEye, EyeState, EyeStyle } from './parts/eyes';
import { drawMouth, MouthState, MouthStyle } from './parts/mouth';
import { drawHair, HairStyle } from './parts/hair';
import { drawHead, HeadStyle } from './parts/head';
import { drawOutfit, OutfitStyle } from './parts/outfit';
import { drawAccessory, AccessoryStyle } from './parts/accessory';
import { shade } from '../render/world3d';
import { Tomodachi } from '../core/types';

// Character frame is 40 wide, 56 tall.
export const CHAR_W = 40;
export const CHAR_H = 56;
export const CHARACTER_WIDTH = CHAR_W;
export const CHARACTER_HEIGHT = CHAR_H;

// Anchor positions within the 40x56 frame
const HEAD_CX = 20;
const HEAD_CY = 18;
const HEAD_RX = 14;   // half-width
const HEAD_RY = 14;   // half-height

const BODY_CX = 20;
const BODY_CY = 44;
const BODY_RX = 10;
const BODY_RY = 10;

const EYE_Y = 16;
const MOUTH_Y = 25;

function buildTints(tomo: Tomodachi) {
  return {
    skin: pickColor(SKIN_COLORS, tomo.colors.skin),
    skinDark: shade(pickColor(SKIN_COLORS, tomo.colors.skin), -0.15),
    hair: pickColor(HAIR_COLORS, tomo.colors.hair),
    hairDark: shade(pickColor(HAIR_COLORS, tomo.colors.hair), -0.2),
    primary: pickColor(OUTFIT_COLORS, tomo.colors.primary),
    primaryDark: shade(pickColor(OUTFIT_COLORS, tomo.colors.primary), -0.15),
    secondary: pickColor(ACCENT_COLORS, tomo.colors.secondary),
    outline: OUTLINE,
    white: 0xffffff,
    pupil: 0x1a1a1a,
    mouth: 0x3a1010,
    tongue: 0xc05060,
    cheek: 0xff8aa3,
  };
}

export interface CharacterRig {
  container: Container;
  eyesL: Graphics;
  eyesR: Graphics;
  mouthG: Graphics;
  shadow: Graphics;
}

/** Build a full character container. Caller can re-draw eyes/mouth. */
export function buildCharacter(tomo: Tomodachi): CharacterRig {
  const container = new Container();
  container.label = `tomo:${tomo.id}`;
  const t = buildTints(tomo);

  // Soft ground shadow
  const shadow = new Graphics();
  shadow.ellipse(CHAR_W / 2, CHAR_H - 1, 14, 3.5)
    .fill({ color: 0x000000, alpha: 0.18 });
  shadow.ellipse(CHAR_W / 2, CHAR_H - 1, 10, 2.5)
    .fill({ color: 0x000000, alpha: 0.15 });
  container.addChild(shadow);

  // Body (drawn first, behind head)
  drawBody(container, t);

  // Outfit
  drawOutfit(tomo.parts.outfit as OutfitStyle, container, t);

  // Arms (tiny stubs at the sides)
  drawArms(container, t);

  // Head (with subtle face shading)
  drawHead(tomo.parts.head as HeadStyle, container, t);

  // Hair (behind accessories)
  drawHair(tomo.parts.hair as HairStyle, container, t);

  // Eyes (dynamic)
  const eyesL = new Graphics();
  const eyesR = new Graphics();
  container.addChild(eyesL);
  container.addChild(eyesR);

  // Mouth (dynamic)
  const mouthG = new Graphics();
  container.addChild(mouthG);

  // Accessory (top of stack)
  drawAccessory(tomo.parts.accessory as AccessoryStyle, container, t);

  return { container, eyesL, eyesR, mouthG, shadow };
}

/** Draw the egg-shaped body. */
function drawBody(g: Container, t: ReturnType<typeof buildTints>): void {
  // Body shadow side (right)
  const bodyG = new Graphics();
  bodyG.ellipse(BODY_CX + 2, BODY_CY, BODY_RX, BODY_RY).fill(t.skinDark);
  // Body main
  bodyG.ellipse(BODY_CX, BODY_CY, BODY_RX, BODY_RY).fill(t.skin);
  // Body highlight (left)
  bodyG.ellipse(BODY_CX - 4, BODY_CY - 4, 4, 3)
    .fill({ color: t.white, alpha: 0.15 });
  // Body bottom shadow (on the ground)
  bodyG.ellipse(BODY_CX, BODY_CY + BODY_RY - 1, BODY_RX - 1, 2)
    .fill({ color: 0x000000, alpha: 0.15 });
  g.addChild(bodyG);
}

/** Stub arms tucked at the sides of the body. */
function drawArms(g: Container, t: ReturnType<typeof buildTints>): void {
  const arms = new Graphics();
  // Left arm
  arms.ellipse(BODY_CX - BODY_RX + 1, BODY_CY, 3, 5).fill(t.skinDark);
  arms.ellipse(BODY_CX - BODY_RX + 1, BODY_CY, 2.5, 4.5).fill(t.skin);
  // Right arm
  arms.ellipse(BODY_CX + BODY_RX - 1, BODY_CY, 3, 5).fill(t.skinDark);
  arms.ellipse(BODY_CX + BODY_RX - 1, BODY_CY, 2.5, 4.5).fill(t.skin);
  g.addChild(arms);
}

/** Redraw the eyes in a given state. */
export function drawEyesState(
  eyesL: Graphics,
  eyesR: Graphics,
  tomo: Tomodachi,
  state: EyeState
): void {
  eyesL.clear();
  eyesR.clear();
  const t = buildTints(tomo);
  // Each eye is centered around (cx, EYE_Y). 2px gap between them.
  const cxL = 16;
  const cxR = 24;
  drawEye(tomo.parts.eyes as EyeStyle, eyesL, cxL, EYE_Y, state, t);
  drawEye(tomo.parts.eyes as EyeStyle, eyesR, cxR, EYE_Y, state, t);
}

/** Redraw the mouth in a given state. */
export function drawMouthState(
  mouthG: Graphics,
  tomo: Tomodachi,
  state: MouthState
): void {
  mouthG.clear();
  const t = buildTints(tomo);
  drawMouth(tomo.parts.mouth as MouthStyle, mouthG, 20, MOUTH_Y, state, t);
}
