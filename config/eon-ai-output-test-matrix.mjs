/** W605 — output evidence matrix. The matrix is a test contract, not a claim that outputs passed. */
export const EON_AI_OUTPUT_TEST_MATRIX_SCHEMA = 'eonapp.w605.ai-output-test-matrix.v1';

export const EON_AI_OUTPUT_TEST_MATRIX = Object.freeze([
  Object.freeze({ id: 'text-product-grounding', channel: 'text', requires: ['explicit-live-confirmation', 'selected-model'], assertions: ['states-local-vs-connected-truth', 'routes-eonapp-correctly', 'does-not-invent-web-access', 'does-not-request-secrets'], humanReview: ['clarity', 'helpfulness', 'factual-alignment'] }),
  Object.freeze({ id: 'code-output', channel: 'code', requires: ['explicit-live-confirmation', 'selected-model', 'isolated-sandbox'], assertions: ['does-not-embed-secrets', 'build-or-static-check-runs', 'includes-test-or-verification-path'], humanReview: ['correctness', 'maintainability', 'scope-control'] }),
  Object.freeze({ id: 'local-image-output', channel: 'image', requires: ['explicit-high-load-consent', 'user-exported-comfy-api-workflow', 'saved-output-path'], assertions: ['loopback-only', 'prompt-accepted', 'output-file-metadata-present', 'output-not-autoposted'], humanReview: ['prompt-adherence', 'composition', 'artifact-rate', 'legibility'] }),
  Object.freeze({ id: 'local-video-output', channel: 'video', requires: ['explicit-high-load-consent', 'user-exported-comfy-api-workflow', 'saved-output-path'], assertions: ['loopback-only', 'prompt-accepted', 'video-metadata-present', 'output-not-autoposted'], humanReview: ['motion-coherence', 'identity-stability', 'artifact-rate', 'usable-duration'] }),
  Object.freeze({ id: 'creator-edit-output', channel: 'creator-edit', requires: ['authorized-user-owned-input', 'local-editor-proof', 'saved-output-path'], assertions: ['input-authorization-recorded', 'output-metadata-present', 'no-automatic-platform-download-or-post'], humanReview: ['edit-intent-met', 'audio-sync', 'caption-legibility', 'export-quality'] })
]);

export function getEonAiOutputTestCase(id = '') {
  return EON_AI_OUTPUT_TEST_MATRIX.find((row) => row.id === String(id || '').trim()) || null;
}
