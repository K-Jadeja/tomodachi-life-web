// Engine public API barrel.
// Hosts import from this single entry point.
//
// Re-exports are organized by sub-module; each sub-module is also
// individually importable if a host wants a more targeted dependency.

// Core
export * from './core/types';
export * from './core/store';
export * from './core/time';
export * from './core/events';

// Render
export { createApp, getApp, BASE_W, BASE_H } from './render/app';
export type { CreateAppOptions } from './render/app';
export * from './render/effects';
export * from './render/palette';
export * from './render/pixel';
export * from './render/world3d';
export {
  registerLocation,
  getRegisteredLocation,
  listRegisteredLocations,
  clearLocationsRegistry,
} from './render/locations-registry';
export type { RegisteredLocation, LocationDrawFn } from './render/locations-registry';
export {
  initScene,
  update,
  pickCharacterAt,
  getRootContainer,
  refreshLocation,
  screenToWorld,
} from './render/scene';
export type { InitSceneOptions, SceneStateSource } from './render/scene';

// Sprites
export {
  buildCharacter,
  drawEyesState,
  drawMouthState,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
  CHAR_W,
  CHAR_H,
} from './sprites/character';
export type { CharacterRig } from './sprites/character';
export {
  drawHead, HEAD_VARIANTS, HEAD_WIDTH, HEAD_HEIGHT,
} from './sprites/parts/head';
export type { HeadStyle } from './sprites/parts/head';
export { drawEye, EYE_VARIANTS } from './sprites/parts/eyes';
export type { EyeState, EyeStyle } from './sprites/parts/eyes';
export { drawMouth, MOUTH_VARIANTS } from './sprites/parts/mouth';
export type { MouthState, MouthStyle } from './sprites/parts/mouth';
export { drawHair, HAIR_VARIANTS, HAIR_WIDTH, HAIR_HEIGHT } from './sprites/parts/hair';
export type { HairStyle } from './sprites/parts/hair';
export { drawOutfit } from './sprites/parts/outfit';
export type { OutfitStyle } from './sprites/parts/outfit';
export { drawAccessory } from './sprites/parts/accessory';
export type { AccessoryStyle } from './sprites/parts/accessory';

// Audio
export {
  sfxClick, sfxSelect, sfxBark, sfxLoad, sfxDone, unlockAudio,
} from './audio/sfx';

// TTS
export {
  warmTts, speakForTomo, stopSpeaking,
} from './tts/speech';
export {
  getVoices, pickDefaultVoice, pitchForTomo, speak, cancelSpeak,
} from './tts/voices';
export type { VoiceChoice } from './tts/voices';

// AI (pure helpers)
export {
  traitLevel, describePersonality, shortPersonality,
  TRAIT_LABELS, TRAIT_SHORT,
} from './ai/personality';
export type { Trait } from './ai/personality';
export { dominantMood, moodDescriptor, needsSummary } from './ai/mood';

// Storage
export {
  saveToIdb, loadFromIdb, listSlots, deleteSlot,
} from './storage/save';

// UI
export { el, clear, on } from './ui/dom';
export { attachInput } from './ui/input';
export type { InputOptions } from './ui/input';

// LLM (opt-in)
import * as llm from './llm/loader';
import * as llmStream from './llm/stream';
import * as llmPrompts from './llm/prompts';
export { llm, llmStream, llmPrompts };
export type { LoadProgressFn } from './llm/loader';
export type { StreamOptions } from './llm/stream';
export type {
  DialogueTurn, DialogueContext, DialoguePromptConfig,
} from './llm/prompts';
