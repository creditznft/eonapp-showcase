/* EON Code Maker Monaco worker bootstrap. Served locally so the editor never
   requests a missing /monaco-worker.js asset. If the CDN is unavailable, the
   page-level fallback editor remains fully usable. */
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/'
};
try {
  importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/base/worker/workerMain.js');
} catch (error) {
  self.postMessage({ type: 'eon-monaco-worker-unavailable', message: String(error?.message || error || '') });
}
