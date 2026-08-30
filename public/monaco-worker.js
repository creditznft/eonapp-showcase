// Same-origin Monaco worker bootstrap to avoid blob: worker CSP violations.
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min'
};

importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/base/worker/workerMain.js');
