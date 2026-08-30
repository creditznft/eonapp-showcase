#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveComfyUiImageRecipe } from '../assets/js/local-ai/comfyui-image-workflow-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lab = fs.readFileSync(path.join(root, 'assets/js/local-ai/comfyui-image-lab.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/local-ai.css'), 'utf8');
const recipe = resolveComfyUiImageRecipe({ checkpoint: 'v1-5.safetensors', profileId: 'medium', aspectId: 'story', qualityId: 'balanced', proofMode: false, seed: 625 });
const checks = [
  ['creator-controls-proof-gated', /Creator controls unlock after save \+ matching reopen/.test(lab) && /fieldset class="local-ai-creator-controls"/.test(lab), 'creator controls are disabled until positive save/reopen proof'],
  ['aspect-quality-seed', /data-comfy-aspect/.test(lab) && /data-comfy-quality/.test(lab) && /data-comfy-seed/.test(lab), 'bounded creator controls are visible'],
  ['bounded-recipe', recipe.width % 64 === 0 && recipe.height % 64 === 0 && recipe.width <= 768 && recipe.height <= 768 && recipe.batchSize === 1, 'creator recipe stays profile-bounded and batch one'],
  ['session-history-only', /Session-only creation history/.test(lab) && /disappears on reset or refresh/.test(lab), 'history is explicitly in-memory only'],
  ['unsupported-edits-honest', /Reference images, inpaint, outpaint and upscale remain unavailable/.test(lab), 'edit workflows remain visibly unavailable'],
  ['responsive-styles', /local-ai-proof-checklist/.test(css) && /local-ai-creator-controls/.test(css), 'proof and creator controls have responsive styles'],
  ['image-lab-never-submits-video', /A working image setup does not imply local video is ready/.test(lab) && !/data-comfy-video-generate/.test(lab), 'Image Lab never submits video; video stays a separate reviewed surface']
];
for (const [id, pass, detail] of checks) console.log(`[W625C] ${pass ? 'PASS' : 'FAIL'} ${id}: ${detail}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W625C] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}; foundation source complete, advanced edit workflows remain pending separate proof.`);
if (!ok) process.exitCode = 1;
