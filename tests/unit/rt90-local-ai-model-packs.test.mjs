import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { chooseEonLocalAiStarterPack, chooseEonLocalImageStarterPack, getEonLocalAiReviewedModelPack, publicEonLocalAiModelPack } from '../../config/local-ai-reviewed-model-packs.mjs';
import { startEonLocalAiReviewedModelPack, validateEonLocalAiModelPackManager } from '../../tools/eon-local-bridge/model-pack-manager.mjs';

test('RT90 reviewed model packs are fixed and device-aware', () => {
  assert.deepEqual(validateEonLocalAiModelPackManager(), []);
  assert.equal(chooseEonLocalAiStarterPack('ollama', { memoryGB: 4 }).id, 'ollama-gemma3-270m');
  assert.equal(chooseEonLocalAiStarterPack('ollama', { memoryGB: 8 }).id, 'ollama-gemma3-1b');
  assert.equal(chooseEonLocalAiStarterPack('lmstudio', { memoryGB: 4 }).id, 'lmstudio-qwen2.5-0.5b-q4');
  const publicPack = publicEonLocalAiModelPack(getEonLocalAiReviewedModelPack('ollama-gemma3-270m'));
  assert.equal(publicPack.approximateDownloadMb, 292);
  assert.equal('command' in publicPack, false);
  assert.equal(chooseEonLocalImageStarterPack({ vramGb: 4 }).id, 'comfyui-sd15-fp16-starter');
  assert.equal(chooseEonLocalImageStarterPack({ vramGb: 2 }), null);
  const imagePack = publicEonLocalAiModelPack(getEonLocalAiReviewedModelPack('comfyui-sd15-fp16-starter'));
  assert.equal(imagePack.capability, 'image');
  assert.equal(imagePack.approximateDownloadMb, 2130);
  assert.equal(imagePack.license, 'CreativeML Open RAIL-M');
  assert.equal('command' in imagePack, false);
});

test('RT90 pack manager never accepts browser supplied commands or unknown pack IDs', () => {
  assert.equal(startEonLocalAiReviewedModelPack('powershell --evil').error, 'model-pack-not-allowlisted');
});

test('RT90 pack manager executes only the fixed reviewed executable and arguments', async () => {
  const calls = [];
  const child = new EventEmitter();
  child.kill = () => true;
  const result = startEonLocalAiReviewedModelPack('ollama-gemma3-270m', {
    spawnImpl: (exe, args, options) => {
      calls.push({ exe, args, options });
      queueMicrotask(() => child.emit('exit', 0));
      return child;
    }
  });
  assert.equal(result.status, 'downloading');
  assert.deepEqual(calls[0].exe, 'ollama');
  assert.deepEqual(calls[0].args, ['pull', 'gemma3:270m']);
  assert.equal(calls[0].options.shell, false);
});


test('RT90 reviewed image starter resolves the Comfy workspace before the fixed download', async () => {
  const calls = [];
  const result = startEonLocalAiReviewedModelPack('comfyui-sd15-fp16-starter', {
    spawnImpl: (exe, args, options) => {
      calls.push({ exe, args, options });
      const child = new EventEmitter();
      child.kill = () => true;
      if (options.stdio?.[1] === 'pipe') {
        child.stdout = new PassThrough();
        child.stderr = new PassThrough();
        queueMicrotask(() => {
          child.stdout.end('C:\\Users\\Example\\ComfyUI\n');
          child.emit('exit', 0);
        });
      } else {
        queueMicrotask(() => child.emit('exit', 0));
      }
      return child;
    }
  });
  assert.equal(result.status, 'checking-runtime');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 2);
  assert.equal(calls[0].exe, 'comfy');
  assert.deepEqual(calls[0].args, ['which']);
  assert.deepEqual(calls[0].options.stdio, ['ignore', 'pipe', 'pipe']);
  assert.equal(calls[1].exe, 'comfy');
  assert.deepEqual(calls[1].args.slice(0, 3), ['model', 'download', '--url']);
  assert.match(calls[1].args[3], /^https:\/\/huggingface\.co\/Comfy-Org\/stable-diffusion-v1-5-archive\/resolve\/main\/v1-5-pruned-emaonly-fp16\.safetensors$/);
  assert.deepEqual(calls[1].args.slice(4), ['--relative-path', 'models/checkpoints']);
  assert.equal(calls[1].options.shell, false);
});

test('RT90 image starter fails closed when Comfy CLI cannot resolve a workspace', async () => {
  const result = startEonLocalAiReviewedModelPack('comfyui-sd15-fp16-starter', {
    spawnImpl: (_exe, _args, options) => {
      const child = new EventEmitter();
      child.kill = () => true;
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => child.emit('exit', options.stdio?.[1] === 'pipe' ? 1 : 0));
      return child;
    }
  });
  assert.equal(result.status, 'checking-runtime');
  await new Promise((resolve) => setImmediate(resolve));
  const { readEonLocalAiReviewedModelPackJob } = await import('../../tools/eon-local-bridge/model-pack-manager.mjs');
  const final = readEonLocalAiReviewedModelPackJob(result.jobId);
  assert.equal(final.status, 'failed');
  assert.equal(final.error, 'comfyui-workspace-unresolved');
});
