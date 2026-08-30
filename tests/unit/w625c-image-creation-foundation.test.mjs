import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveComfyUiImageRecipe } from '../../assets/js/local-ai/comfyui-image-workflow-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W625C creator recipe supports bounded aspect, quality and deterministic seed after proof', () => {
  const recipe = resolveComfyUiImageRecipe({ checkpoint: 'v1-5.safetensors', profileId: 'medium', aspectId: 'story', qualityId: 'balanced', proofMode: false, seed: 12345 });
  assert.equal(recipe.aspectId, 'story');
  assert.equal(recipe.qualityId, 'balanced');
  assert.equal(recipe.seed, 12345);
  assert.equal(recipe.width % 64, 0);
  assert.equal(recipe.height % 64, 0);
  assert.ok(recipe.width <= 768 && recipe.height <= 768);
  assert.equal(recipe.batchSize, 1);
});

test('W625C UI gates creator controls behind matching save/reopen proof', () => {
  const lab = read('assets/js/local-ai/comfyui-image-lab.js');
  assert.match(lab, /Creator controls unlock after save \+ matching reopen/);
  assert.match(lab, /data-comfy-aspect/);
  assert.match(lab, /data-comfy-quality/);
  assert.match(lab, /data-comfy-seed/);
  assert.match(lab, /Session-only creation history/);
  assert.match(lab, /Export redacted proof receipt/);
});

test('W625C keeps unsupported edit workflows visibly unavailable rather than silently activating them', () => {
  const lab = read('assets/js/local-ai/comfyui-image-lab.js');
  assert.match(lab, /Reference images, inpaint, outpaint and upscale remain unavailable/);
  assert.match(lab, /A working image setup does not imply local video is ready/);
  assert.match(lab, /video only after its own model, workflow, device and real-output checks pass/);
  assert.doesNotMatch(lab, /data-comfy-inpaint|data-comfy-outpaint|data-comfy-upscale|data-comfy-video-generate/);
});
