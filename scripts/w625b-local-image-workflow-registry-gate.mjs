#!/usr/bin/env node
import { COMFYUI_IMAGE_DEVICE_PROFILES, COMFYUI_IMAGE_WORKFLOWS, getComfyUiImageWorkflowRegistryTruth, resolveComfyUiImageRecipe } from '../assets/js/local-ai/comfyui-image-workflow-registry.js';

const truth = getComfyUiImageWorkflowRegistryTruth();
const recipe = resolveComfyUiImageRecipe({ checkpoint: 'v1-5-pruned.safetensors', proofMode: true });
const allowed = new Set(['CheckpointLoaderSimple', 'CLIPTextEncode', 'EmptyLatentImage', 'KSampler', 'VAEDecode', 'SaveImage']);
const checks = [
  ['one-allowlisted-workflow', COMFYUI_IMAGE_WORKFLOWS.length === 1 && COMFYUI_IMAGE_WORKFLOWS[0].status === 'allowlisted', 'one EONAPP-authored workflow is allowlisted'],
  ['standard-nodes-only', COMFYUI_IMAGE_WORKFLOWS[0].nodeTypes.every((name) => allowed.has(name)), 'workflow uses only six built-in nodes'],
  ['proof-recipe-fixed', recipe.width === 512 && recipe.height === 512 && recipe.steps === 12 && recipe.batchSize === 1, 'first proof is 512×512, 12 steps, batch one'],
  ['profiles-bounded', COMFYUI_IMAGE_DEVICE_PROFILES.length === 3 && COMFYUI_IMAGE_DEVICE_PROFILES.every((row) => row.queueConcurrency === 1 && row.maximumDimension <= 1024), 'device profiles are bounded and sequential'],
  ['no-automatic-install', !truth.automaticWorkflowImport && !truth.automaticModelInstall && !truth.automaticNodeInstall, 'no workflow, checkpoint or node is installed automatically'],
  ['no-network-expansion', !truth.lanOrPublicRuntime && !truth.cloudFallback, 'registry cannot expand to LAN/public/cloud execution'],
  ['video-disabled', truth.laterTasks.video === 'disabled-in-w625a-w625c', 'video remains outside this wave']
];
for (const [id, pass, detail] of checks) console.log(`[W625B] ${pass ? 'PASS' : 'FAIL'} ${id}: ${detail}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W625B] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
