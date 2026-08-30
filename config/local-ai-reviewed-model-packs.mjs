/** RT90 reviewed starter packs. Downloads always require explicit user approval. */
export const EON_LOCAL_AI_MODEL_PACK_SCHEMA = 'eon.local-ai.reviewed-model-pack.rt90.v1';

const rows = [
  {
    id: 'ollama-gemma3-270m',
    runtimeId: 'ollama',
    label: 'Gemma 3 270M · Starter',
    model: 'gemma3:270m',
    approximateDownloadMb: 292,
    minimumMemoryGb: 2,
    license: 'Gemma Terms of Use',
    sourceUrl: 'https://ollama.com/library/gemma3:270m',
    command: Object.freeze({ executable: 'ollama', args: Object.freeze(['pull', 'gemma3:270m']) })
  },
  {
    id: 'ollama-gemma3-1b',
    runtimeId: 'ollama',
    label: 'Gemma 3 1B · Compact',
    model: 'gemma3:1b',
    approximateDownloadMb: 815,
    minimumMemoryGb: 6,
    license: 'Gemma Terms of Use',
    sourceUrl: 'https://ollama.com/library/gemma3:1b',
    command: Object.freeze({ executable: 'ollama', args: Object.freeze(['pull', 'gemma3:1b']) })
  },
  {
    id: 'lmstudio-qwen2.5-0.5b-q4',
    runtimeId: 'lmstudio',
    label: 'Qwen2.5 0.5B Instruct · Q4',
    model: 'lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF',
    quantization: 'Q4_K_M',
    approximateDownloadMb: 398,
    minimumMemoryGb: 3,
    license: 'Apache-2.0',
    sourceUrl: 'https://huggingface.co/lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF',
    command: Object.freeze({ executable: 'lms', args: Object.freeze(['get', 'lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF@Q4_K_M', '--gguf']) })
  },
  {
    id: 'comfyui-sd15-fp16-starter',
    runtimeId: 'comfyui',
    capability: 'image',
    label: 'Stable Diffusion 1.5 FP16 · Image Starter',
    model: 'v1-5-pruned-emaonly-fp16.safetensors',
    approximateDownloadMb: 2130,
    minimumMemoryGb: 8,
    minimumVramGb: 4,
    license: 'CreativeML Open RAIL-M',
    sourceUrl: 'https://huggingface.co/Comfy-Org/stable-diffusion-v1-5-archive/blob/main/v1-5-pruned-emaonly-fp16.safetensors',
    installStrategy: 'comfy-cli-selected-workspace',
    preflight: Object.freeze({ executable: 'comfy', args: Object.freeze(['which']) }),
    command: Object.freeze({ executable: 'comfy', args: Object.freeze(['model', 'download', '--url', 'https://huggingface.co/Comfy-Org/stable-diffusion-v1-5-archive/resolve/main/v1-5-pruned-emaonly-fp16.safetensors', '--relative-path', 'models/checkpoints']) })
  },
];

export const EON_LOCAL_AI_REVIEWED_MODEL_PACKS = Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export function getEonLocalAiReviewedModelPack(id = '') {
  return EON_LOCAL_AI_REVIEWED_MODEL_PACKS.find((row) => row.id === String(id || '').trim()) || null;
}

export function chooseEonLocalAiStarterPack(runtimeId = '', profile = {}) {
  const runtime = String(runtimeId || '').trim().toLowerCase();
  const memoryGb = Number(profile.memoryGB || profile.memoryGb || 0) || 0;
  if (runtime === 'lmstudio') return getEonLocalAiReviewedModelPack('lmstudio-qwen2.5-0.5b-q4');
  if (runtime === 'ollama') return getEonLocalAiReviewedModelPack(memoryGb >= 6 ? 'ollama-gemma3-1b' : 'ollama-gemma3-270m');
  return null;
}

export function chooseEonLocalImageStarterPack(profile = {}) {
  const memoryGb = Number(profile.memoryGB || profile.memoryGb || 0) || 0;
  const vramGb = Number(profile.vramGB || profile.vramGb || 0) || 0;
  const pack = getEonLocalAiReviewedModelPack('comfyui-sd15-fp16-starter');
  if (!pack) return null;
  if (memoryGb > 0 && memoryGb < pack.minimumMemoryGb) return null;
  if (vramGb > 0 && vramGb < pack.minimumVramGb) return null;
  return pack;
}

export function publicEonLocalAiModelPack(row = null) {
  if (!row) return null;
  return Object.freeze({
    schema: EON_LOCAL_AI_MODEL_PACK_SCHEMA,
    id: row.id,
    runtimeId: row.runtimeId,
    capability: row.capability || 'text',
    label: row.label,
    model: row.model,
    quantization: row.quantization || '',
    approximateDownloadMb: row.approximateDownloadMb,
    minimumMemoryGb: row.minimumMemoryGb,
    minimumVramGb: row.minimumVramGb || 0,
    license: row.license,
    sourceUrl: row.sourceUrl,
    installStrategy: row.installStrategy || 'runtime-native-reviewed-command'
  });
}
