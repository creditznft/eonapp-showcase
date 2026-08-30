export const EON_LOCAL_LITE_WORKER_SCHEMA = 'eon.local-ai.browser-lite.worker.rt90.v1';
export const EON_LOCAL_LITE_WORKER_TYPES = Object.freeze(['prepare', 'generate', 'benchmark', 'reset']);

// Worker assets are emitted independently by the production builder. Keep the
// reviewed public model pack beside the worker protocol so it never relies on
// a source-tree-only config import at runtime. The consumer contract test
// asserts this value stays exactly aligned with the app-wide Local Lite pack.
export const EON_LOCAL_LITE_WORKER_PACK = Object.freeze({
  task: 'text-generation',
  model: 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA',
  libraryModuleUrl: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm',
  preferredWebGpuDtype: 'q4f16',
  wasmDtype: 'q4'
});
export const EON_LOCAL_LITE_WORKER_MAX = Object.freeze({
  requestIdChars: 80,
  inputChars: 4200,
  totalInputChars: 15000,
  systemChars: 5200,
  historyMessages: 6,
  outputTokens: 192,
  outputChars: 12000
});

export function isEonLocalLiteWorkerMessage(value = {}) {
  return Boolean(
    value
    && typeof value === 'object'
    && value.schema === EON_LOCAL_LITE_WORKER_SCHEMA
    && typeof value.type === 'string'
    && typeof value.requestId === 'string'
  );
}
