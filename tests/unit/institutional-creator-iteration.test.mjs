import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildCreatorVariationPrompt, getCreatorIterationPlannerTruth } from '../../assets/js/creator/eon-creator-iteration-planner.js';
import { getDirectMediaStudioTruth } from '../../assets/js/direct-byok/eon-direct-media-studio.js';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const sliceBetween = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0, `missing start marker ${start}`);
  assert.ok(to > from, `missing end marker ${end}`);
  return source.slice(from, to);
};

test('Creator variation planner is bounded, session-only and never grants compute or budget authority', () => {
  const plan = buildCreatorVariationPrompt({ mediaKind: 'image', prompt: 'Portrait of a calm astronaut in a neon city', iteration: 2, maxChars: 180 });
  assert.equal(plan.ok, true);
  assert.ok(plan.prompt.length <= 240, 'planner enforces its documented minimum safe budget rather than returning an unbounded prompt');
  assert.match(plan.prompt, /distinct variation/i);
  assert.equal(plan.sourceMediaRead, false);
  assert.equal(plan.promptPersisted, false);
  assert.equal(plan.providerCalled, false);
  assert.equal(plan.localRuntimeCalled, false);
  assert.equal(plan.generationStarted, false);
  assert.equal(plan.budgetApprovalGranted, false);
});

test('Video variation truth never masquerades as media extension', () => {
  const plan = buildCreatorVariationPrompt({ mediaKind: 'video', prompt: 'Slow push through a futuristic plaza', iteration: 1, maxChars: 500 });
  assert.equal(plan.ok, true);
  assert.match(plan.prompt, /new generation, not an extension/i);
  const truth = getCreatorIterationPlannerTruth();
  assert.equal(truth.mediaExtensionClaimed, false);
  assert.equal(truth.separateGenerateActionRequired, true);
});

test('Hosted Image/Video variation remains local planning and requires a fresh Generate approval', () => {
  const source = read('assets/js/direct-byok/eon-direct-media-studio.js');
  const handler = sliceBetween(source, "host.querySelector('[data-direct-media-variation]')", "host.querySelector('[data-direct-media-remix]')");
  assert.match(handler, /buildCreatorVariationPrompt/);
  assert.match(handler, /separately approve one new provider job/);
  assert.doesNotMatch(handler, /submitDirectJob|readDirectJob\(|buildDirectJobRequest/);
  assert.match(source, /data-direct-media-budget/);
  assert.match(source, /state\.prompt = prompt\.slice/);
  const truth = getDirectMediaStudioTruth();
  assert.equal(truth.variationPlanningLocalOnly, true);
  assert.equal(truth.variationRequiresSeparateGenerateAction, true);
  assert.equal(truth.promptSessionMemoryOnly, true);
});

test('Local Image/Video variation buttons never submit ComfyUI work', () => {
  const image = read('assets/js/local-ai/comfyui-image-lab.js');
  const imageHandler = sliceBetween(image, "root?.querySelector?.('[data-comfy-variation]')", "root?.querySelector?.('[data-comfy-share]')");
  assert.match(imageHandler, /buildCreatorVariationPrompt/);
  assert.match(imageHandler, /No ComfyUI job started/);
  assert.doesNotMatch(imageHandler, /generateComfyUiImage|cancelComfyUiJob/);

  const video = read('assets/js/local-ai/comfyui-video-lab.js');
  const videoHandler = sliceBetween(video, "root?.querySelector?.('[data-video-variation]')", "root?.querySelector?.('[data-video-share]')");
  assert.match(videoHandler, /buildCreatorVariationPrompt/);
  assert.match(videoHandler, /new generation, not a media extension/i);
  assert.doesNotMatch(videoHandler, /generateComfyUiVideo|cancelComfyUiVideoJob/);
});

test('Local and hosted Music variation buttons prepare prompts but cannot generate or spend', () => {
  const source = read('assets/js/create/eon-music-studio.js');
  const localHandler = sliceBetween(source, "studio.querySelector('[data-music-acestep-variation]')", "studio.querySelector('[data-music-acestep-share]')");
  assert.match(localHandler, /buildCreatorVariationPrompt/);
  assert.match(localHandler, /press Generate local track separately/);
  assert.doesNotMatch(localHandler, /generateAceStepLocalMusic|submitDirectJob/);

  const hostedHandler = sliceBetween(source, "studio.querySelector('[data-music-hosted-variation]')", "studio.querySelector('[data-music-hosted-share]')");
  assert.match(hostedHandler, /buildCreatorVariationPrompt/);
  assert.match(hostedHandler, /re-approve the one-job budget checkbox/);
  assert.doesNotMatch(hostedHandler, /generateAceStepLocalMusic|submitDirectJob|buildDirectJobRequest/);
});
