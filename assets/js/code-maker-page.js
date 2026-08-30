/**
 * EON Code Maker — Browser IDE Page Logic
 * Monaco Editor + Live Preview + AI Code Generation
 */

import { buildDeployManifest, copyDeployManifest, openDeployGuide, prepareDeployBundle, verifyDeployBundle } from './utils/builder-deploy.js';
import { detectLocalProviders, loadAISettings } from './chat/ai-runtime.js';
import { getAIReadiness } from './utils/ai-readiness.js';
import { runMissionEngine } from './utils/mission-engine.js';
import { showToast } from './utils/share.js';

// ── Default starter code ──────────────────────────────────────────────────────
/** @type {{ html: string; css: string; js: string }} */
const DEFAULTS = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>My Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <h1>Hello from EON Code Maker ⚡</h1>
    <p>Edit the HTML, CSS, and JS tabs — then press <strong>Run</strong> to see your changes live.</p>
    <button id="demo-btn" class="btn">Click Me</button>
    <div id="output" class="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,

  css: `/* EON Code Maker — starter styles */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: #0f0f1a;
  color: #e2e8f0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a78bfa, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

p {
  color: rgba(148, 163, 184, 0.85);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.65rem 1.5rem;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn:hover { opacity: 0.9; transform: scale(1.03); }
.btn:active { transform: scale(0.98); }

.output {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.5rem;
  min-height: 3rem;
  font-size: 0.9rem;
  color: #a78bfa;
}`,

  js: `// EON Code Maker — starter script
const btn = document.getElementById('demo-btn');
const output = document.getElementById('output');

let clickCount = 0;

btn.addEventListener('click', () => {
  clickCount++;
  output.textContent = \`✅ Button clicked \${clickCount} time\${clickCount !== 1 ? 's' : ''}! Your code is working.\`;
  btn.style.background = \`linear-gradient(135deg, hsl(\${clickCount * 40 % 360},70%,55%), hsl(\${(clickCount * 40 + 60) % 360},70%,50%))\`;
});

console.log('EON Code Maker script loaded ⚡');`
};

const LS_KEY_PREFIX = 'eon:code-maker:v1:';
/** @type {Record<'html' | 'css' | 'js', { getValue: () => string; setValue: (value: string) => void }>} */
const editors = /** @type {any} */ ({});
/** @type {'html' | 'css' | 'js'} */
let activeFile = 'html';
let monacoReady = false;
/** @typedef {'html' | 'css' | 'js'} CodeFile */

const CODE_OS_STATE = {
  provider: 'guide',
  readiness: 'Guide mode ready',
  localRuntime: 'not-checked',
  localRuntimeCount: 0,
  lastSecretScan: null,
  lastHandoffAt: null,
  voiceSupported: false
};

function setTextById(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(text || '');
}

function getProjectName() {
  return /** @type {HTMLInputElement | null} */ (document.getElementById('cm-project-name'))?.value || 'My Project';
}

function normalizeSecretScanText(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function scanForSecrets() {
  const snapshot = getBuilderCodeSnapshot();
  const patterns = [
    { name: 'OpenAI-style API key', regex: /sk-[A-Za-z0-9_-]{20,}/g },
    { name: 'GitHub token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
    { name: 'JWT token', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
    { name: 'Private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
    { name: 'Seed phrase-like text', regex: /\b(seed phrase|mnemonic|recovery phrase)\b\s*[:=]/ig },
    { name: 'Hardcoded secret assignment', regex: /\b(api[_-]?key|secret|token|private[_-]?key)\b\s*[:=]\s*['"][^'"]{12,}['"]/ig }
  ];  const findings = [];
  for (const [file, content] of Object.entries(snapshot)) {
    const source = normalizeSecretScanText(content);
    for (const pattern of patterns) {
      const matches = source.match(pattern.regex) || [];
      if (matches.length) findings.push({ file, pattern: pattern.name, count: matches.length });
    }
  }
  const result = {
    ok: findings.length === 0,
    findings,
    files: Object.keys(snapshot).length,
    scannedAt: new Date().toISOString()
  };
  CODE_OS_STATE.lastSecretScan = result;
  const summary = result.ok
    ? `Secrets Check passed at ${new Date(result.scannedAt).toLocaleTimeString()}. No common key/token patterns found.`
    : `Secrets Check found ${findings.length} risk group${findings.length === 1 ? '' : 's'}. Remove secrets before export or GitHub handoff.`;
  setTextById('cm-secrets-status', result.ok ? 'Passed. No common secret patterns found.' : 'Review needed. Potential secret patterns found.');
  setTextById('cm-codeos-safety-detail', summary);
  const receipt = document.getElementById('cm-codeos-receipt');
  if (receipt) {
    const findingLines = findings.map((item) => `- ${item.file}: ${item.pattern} × ${item.count}`).join('\n');
    receipt.textContent = result.ok ? summary : `${summary}\n${findingLines}`;
  }
  setStatus(result.ok ? 'Secrets Check passed.' : 'Secrets Check needs review.', !result.ok);
  showToast(result.ok ? 'Secrets Check passed.' : 'Secrets Check found possible secrets.', result.ok ? 'success' : 'warning');
  return result;
}

async function refreshCodeOSRuntimeStatus() {
  const settings = loadAISettings();
  const readiness = getAIReadiness(settings, { surface: 'code-maker' });
  const provider = settings?.provider || settings?.activeProvider || readiness?.mode || 'guide';
  CODE_OS_STATE.provider = provider;
  CODE_OS_STATE.readiness = readiness?.headline || readiness?.trustSummary || 'Guide mode ready';
  setTextById('cm-provider-status', `${CODE_OS_STATE.readiness} Provider route: ${provider}.`);
  setTextById('cm-codeos-runtime-detail', `${CODE_OS_STATE.readiness} Use Vault keys or a detected local runtime for live generation; Guide Mode remains available for product help.`);
  try {
    const local = await detectLocalProviders({ force: true });
    const entries = Object.entries(local || {}).filter(([, value]) => Boolean(value));
    CODE_OS_STATE.localRuntime = entries.length ? 'detected' : 'not-detected';
    CODE_OS_STATE.localRuntimeCount = entries.length;
    const label = entries.length
      ? `Detected ${entries.map(([name]) => name).join(', ')} for private local coding tasks.`
      : 'No local runtime detected yet. Install/start Ollama, LM Studio, or Jan, then refresh the IDE.';
    setTextById('cm-local-runtime-status', label);
  } catch {
    CODE_OS_STATE.localRuntime = 'error';
    setTextById('cm-local-runtime-status', 'Local model discovery could not complete in this browser session.');
  }
  CODE_OS_STATE.voiceSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  window.EONCodeOS = {
    getState: () => ({ ...CODE_OS_STATE }),
    scanForSecrets,
    refreshRuntimeStatus: refreshCodeOSRuntimeStatus,
    createGitHubHandoff
  };
}

function fillTemplatePrompt(type) {
  const textarea = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('cm-ai-prompt'));
  if (!textarea) return;
  const templates = {
    image: 'Create a premium image-ready landing section: include accessible alt-text notes, responsive layout, and clear placeholders for hero image, product cards, and social proof visuals.',
    video: 'Create a video-preview friendly page section with storyboard frames, caption areas, CTA timing, and mobile-safe layout. Keep code self-contained.',
    voice: 'Create a voice-enabled UI pattern with a visible microphone button, transcript state, listening/speaking indicators, and graceful fallback when speech APIs are unavailable.'
  };
  textarea.value = templates[type] || templates.image;
  textarea.focus();
  const drawer = document.getElementById('cm-ai-drawer');
  if (drawer) drawer.hidden = false;
  setStatus(`Loaded ${type || 'asset'} build brief for EONBOT.`);
}

function startVoicePrompt() {
  const SpeechCtor = /** @type {any} */ (window).SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition;
  const textarea = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('cm-ai-prompt'));
  const drawer = document.getElementById('cm-ai-drawer');
  if (drawer) drawer.hidden = false;
  if (!textarea) return;
  if (!SpeechCtor) {
    textarea.value = textarea.value || 'Voice is not available in this browser. Build a polished app interface with clear states, mobile layout, and safe deploy handoff.';
    setStatus('Voice capture is unavailable in this browser. Prompt template inserted instead.', true);
    showToast('Voice capture unavailable. Prompt template inserted.', 'warning');
    return;
  }
  const recognition = new SpeechCtor();
  recognition.lang = document.documentElement.lang || navigator.language || 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => setStatus('Listening for your Code OS prompt...');
  recognition.onerror = () => setStatus('Voice prompt capture failed or was cancelled.', true);
  recognition.onresult = (event) => {
    const transcript = event?.results?.[0]?.[0]?.transcript || '';
    textarea.value = `${textarea.value ? `${textarea.value}\n` : ''}${transcript}`.trim();
    textarea.focus();
    setStatus('Voice prompt captured. Review it, then Generate.');
  };
  recognition.start();
}

function createGitHubHandoff() {
  const secretScan = CODE_OS_STATE.lastSecretScan || scanForSecrets();
  const snapshot = getBuilderCodeSnapshot();
  const projectName = getProjectName();
  const findingLines = secretScan.findings?.length
    ? secretScan.findings.map((item) => `  - ${item.file}: ${item.pattern} × ${item.count}`).join('\n')
    : '  - No common key/token patterns found.';
  const body = [
    '# EON Code OS GitHub / Codex Handoff',
    '',
    `Project: ${projectName}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Runtime',
    `- Provider route: ${CODE_OS_STATE.provider}`,
    `- Readiness: ${CODE_OS_STATE.readiness}`,
    `- Local runtime: ${CODE_OS_STATE.localRuntime} (${CODE_OS_STATE.localRuntimeCount})`,
    '',
    '## Safety',
    `- Secrets Check: ${secretScan.ok ? 'PASS' : 'REVIEW REQUIRED'}`,
    findingLines,
    '',
    '## Files',
    `- index.html: ${snapshot.html.length} chars`,
    `- style.css: ${snapshot.css.length} chars`,
    `- script.js: ${snapshot.js.length} chars`,
    '',
    '## Codex tasks',
    '1. Create or update the GitHub repo files from the exported Code OS project.',
    '2. Keep secrets out of source; use Cloudflare/GitHub environment secrets only.',
    '3. Run lint/build/smoke before deploy.',
    '4. Deploy to Cloudflare Pages or GitHub Pages and paste the live URL into the Vault receipt.',
    '',
    '## Source snapshot',
    '',
    '### index.html',
    '```html',
    snapshot.html,
    '```',
    '',
    '### style.css',
    '```css',
    snapshot.css,
    '```',
    '',
    '### script.js',
    '```js',
    snapshot.js,
    '```',
    ''
  ].join('\n');
  const blob = new Blob([body], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eon-code-os'}-github-handoff.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  CODE_OS_STATE.lastHandoffAt = new Date().toISOString();
  setTextById('cm-ship-status', `GitHub/Codex handoff downloaded at ${new Date(CODE_OS_STATE.lastHandoffAt).toLocaleTimeString()}.`);
  setStatus('GitHub/Codex handoff downloaded.');
  showToast('GitHub handoff downloaded.', 'success');
}

function escapePreviewJson(/** @type {string} */ value) {
  return JSON.stringify(String(value || '')).replace(/</g, '\\u003c');
}

// ── Build combined HTML document for preview ────────────────────────────────
function buildPreviewDocument() {
  const html = editors.html?.getValue() || DEFAULTS.html;
  const css  = editors.css?.getValue()  || DEFAULTS.css;
  const js   = editors.js?.getValue()   || DEFAULTS.js;
  const cleanHtml = html
    .replace(/<link\b[^>]*href=(["'])style\.css\1[^>]*>\s*/ig, '')
    .replace(/<script\b[^>]*src=(["'])script\.js\1[^>]*><\/script>\s*/ig, '');

  const boot = `
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: blob:; media-src data: blob:; style-src 'unsafe-inline'; script-src 'self' blob:; connect-src https:; font-src data: https:; base-uri 'none'; form-action 'none';">
<style id="cm-inline-css"></style>
<script type="application/json" id="cm-css-data">${escapePreviewJson(css)}</script>
<script type="application/json" id="cm-js-data">${escapePreviewJson(js)}</script>
<script src="/code-maker-preview.js" defer></script>`;

  return cleanHtml
    .replace('</head>', `${boot}\n</head>`);
}

function runPreview() {
const frame = /** @type {any} */ (document.getElementById('cm-preview-frame'));
  if (!frame || !monacoReady) return;
  const html = buildPreviewDocument();
  frame.srcdoc = html;
  setStatus('Preview updated.');
  updateCharCount();
}

function setStatus(/** @type {string} */ msg, isError = false) {
  const el = document.getElementById('cm-status-text');
  if (el) { el.textContent = msg; el.style.color = isError ? '#f87171' : ''; }
}

function updateCharCount() {
  const total = Object.values(editors).reduce((n, e) => n + (e?.getValue().length || 0), 0);
  const el = document.getElementById('cm-char-count');
  if (el) el.textContent = `${total.toLocaleString()} chars`;
}

// ── Auto-save to localStorage ─────────────────────────────────────────────────
/**
 * @param {CodeFile} file
 */
function saveFile(file) {
  try { localStorage.setItem(LS_KEY_PREFIX + file, editors[file]?.getValue() || ''); } catch {}
}

/**
 * @param {CodeFile} file
 */
function loadFile(file) {
  try { return localStorage.getItem(LS_KEY_PREFIX + file) || null; } catch { return null; }
}



// Enterprise fallback editor: keeps Code Maker usable when Monaco CDN is slow,
// blocked, or unavailable inside the Workstation iframe.
function initFallbackEditor(reason = 'Monaco editor is unavailable.') {
  if (monacoReady || document.getElementById('cm-fallback-editor')) return;
  const container = document.getElementById('cm-editor-container');
  if (!container) return;
  container.classList.add('cm-fallback-editor-host');
  container.innerHTML = `
    <div class="cm-fallback-editor" id="cm-fallback-editor">
      <div class="cm-fallback-notice">
        <strong>Code Maker fallback editor active.</strong>
        <span>${String(reason || '').replace(/[<>]/g, '')} You can still edit HTML, CSS, JS, run preview, export, and use AI assist.</span>
      </div>
      <textarea class="cm-fallback-pane active" data-fallback-file="html" spellcheck="false" aria-label="HTML editor"></textarea>
      <textarea class="cm-fallback-pane" data-fallback-file="css" spellcheck="false" aria-label="CSS editor"></textarea>
      <textarea class="cm-fallback-pane" data-fallback-file="js" spellcheck="false" aria-label="JavaScript editor"></textarea>
    </div>`;
  document.querySelectorAll('.cm-fallback-pane').forEach((node) => {
    const file = /** @type {CodeFile} */ (node.getAttribute('data-fallback-file') || 'html');
    node.value = loadFile(file) || DEFAULTS[file];
    editors[file] = {
      getValue: () => String(node.value || ''),
      setValue: (value) => { node.value = String(value || ''); saveFile(file); }
    };
    node.addEventListener('input', () => { saveFile(file); updateCharCount(); });
    node.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runPreview();
    });
  });
  document.querySelectorAll('.cm-file-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = /** @type {CodeFile} */ (btn.dataset.file || 'html');
      activeFile = next;
      document.querySelectorAll('.cm-file-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.file === next));
      document.querySelectorAll('.cm-fallback-pane').forEach((pane) => pane.classList.toggle('active', pane.getAttribute('data-fallback-file') === next));
      setStatus(`Editing ${next === 'js' ? 'script.js' : next === 'css' ? 'style.css' : 'index.html'} in fallback editor.`);
      updateCharCount();
    });
  });
  monacoReady = true;
  window._cmGetCode = (/** @type {CodeFile} */ file) => editors[file]?.getValue?.() || DEFAULTS[file];
  window._cmSetCode = (/** @type {CodeFile} */ file, /** @type {string} */ value) => { editors[file]?.setValue?.(value); updateCharCount(); };
  setStatus('Code Maker fallback ready. Press Run or Ctrl+Enter to preview.');
  updateCharCount();
  setTimeout(runPreview, 120);
}

// ── Monaco setup ──────────────────────────────────────────────────────────────
function initMonaco() {
  if (!window.require) {
    initFallbackEditor('Monaco loader was not available.');
    return;
  }

  window.MonacoEnvironment = {
    getWorkerUrl: () => '/monaco-worker.js'
  };

  /** @type {any} */ (window.require).config({
    paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' }
  });

  /** @type {any} */ (window.require)(['vs/editor/editor.main'], function () {
    const monaco = window.monaco;
    if (!monaco) {
      initFallbackEditor('Monaco editor failed to load.');
      return;
    }

    monaco.editor.defineTheme('eon-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
        { token: 'string', foreground: '86efac' },
        { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' },
        { token: 'number', foreground: 'fcd34d' }
      ],
      colors: {
        'editor.background':           '#0f0f1a',
        'editor.foreground':           '#e2e8f0',
        'editorLineNumber.foreground': '#374151',
        'editor.lineHighlightBackground': '#1e1e2e',
        'editorCursor.foreground':     '#a78bfa',
        'editor.selectionBackground':  '#312e5880',
        'editorIndentGuide.background1': '#1e293b'
      }
    });

    /** @type {{ html: 'html'; css: 'css'; js: 'javascript' }} */
    const LANG_MAP = { html: 'html', css: 'css', js: 'javascript' };
    const container = document.getElementById('cm-editor-container');
    if (!container) {
      setStatus('Code Maker editor container missing.', true);
      return;
    }

    const initialLang = LANG_MAP[activeFile];
    const initialValue = loadFile(activeFile) || DEFAULTS[activeFile];

    const mainEditor = monaco.editor.create(container, {
      value:         initialValue,
      language:      initialLang,
      theme:         'eon-dark',
      fontSize:       14,
      fontFamily:    '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
      fontLigatures:  true,
      lineHeight:     22,
      minimap:        { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap:       'on',
      automaticLayout: true,
      tabSize:        2,
      insertSpaces:   true,
      formatOnPaste:  true,
      formatOnType:   false,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      padding:        { top: 12, bottom: 12 }
    });

    // Create hidden models for each file
    /** @type {Record<'html' | 'css' | 'js', any>} */
    const models = /** @type {any} */ ({});
    /** @type {Array<'html' | 'css' | 'js'>} */
    /** @type {readonly ['html', 'css', 'js']} */
    const FILES = ['html', 'css', 'js'];
    FILES.forEach((f) => {
      const lang = LANG_MAP[f];
      const uri  = monaco.Uri.parse(`file:///project/${f === 'js' ? 'script.js' : f === 'css' ? 'style.css' : 'index.html'}`);
      models[f]  = monaco.editor.createModel(loadFile(f) || DEFAULTS[f], lang, uri);
      editors[f] = { getValue: () => models[f].getValue(), setValue: (v) => models[f].setValue(v) };
    });

    // Actually use the main editor's model
    editors.html = { getValue: () => (activeFile === 'html' ? mainEditor.getValue() : (models.html?.getValue() || DEFAULTS.html)), setValue: (v) => { if (activeFile === 'html') mainEditor.setValue(v); else models.html.setValue(v); } };
    editors.css  = { getValue: () => (activeFile === 'css'  ? mainEditor.getValue() : (models.css?.getValue()  || DEFAULTS.css)),  setValue: (v) => { if (activeFile === 'css')  mainEditor.setValue(v); else models.css.setValue(v);  } };
    editors.js   = { getValue: () => (activeFile === 'js'   ? mainEditor.getValue() : (models.js?.getValue()   || DEFAULTS.js)),   setValue: (v) => { if (activeFile === 'js')   mainEditor.setValue(v); else models.js.setValue(v);   } };

    // File-tab switching — swap the model
    document.querySelectorAll('.cm-file-tab').forEach((/** @type {Element} */ btn) => {
      btn.addEventListener('click', () => {
    const newFile = /** @type {CodeFile} */ (btn.dataset.file || 'html');
        // Save current model content to its model
        if (activeFile !== newFile) {
          models[activeFile]?.setValue(mainEditor.getValue());
          saveFile(activeFile);
          activeFile = newFile;
          mainEditor.setModel(models[newFile]);
          mainEditor.focus();
          document.querySelectorAll('.cm-file-tab').forEach((/** @type {Element} */ t) =>
            t.classList.toggle('active', t.dataset.file === newFile)
          );
          setStatus(`Editing ${newFile === 'js' ? 'script.js' : newFile === 'css' ? 'style.css' : 'index.html'}`);
          updateCharCount();
        }
      });
    });

    // Initialize models properly
    mainEditor.setModel(models.html);

    // Auto-save + char count on change
    mainEditor.onDidChangeModelContent(() => {
      models[activeFile]?.setValue(mainEditor.getValue());
      saveFile(activeFile);
      updateCharCount();
    });

    monacoReady = true;
    setStatus('Code Maker ready. Press Run or Ctrl+Enter to preview.');
    updateCharCount();

    // Auto-run initial preview
    setTimeout(runPreview, 300);

    // Ctrl+Enter to run
    mainEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runPreview);

    // Expose for AI assist
    window._cmGetCode = (/** @type {CodeFile} */ file) => (file === activeFile ? mainEditor.getValue() : models[file]?.getValue() || DEFAULTS[file]);
    window._cmSetCode = (/** @type {CodeFile} */ file, /** @type {string} */ value) => {
      if (file === activeFile) mainEditor.setValue(value);
      else models[file]?.setValue(value);
      saveFile(file);
    };
  });
}

// ── Preview device switcher ────────────────────────────────────────────────────
function initDeviceSwitcher() {
  document.querySelectorAll('.cm-device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = btn.dataset.w || '';
      const frame = document.getElementById('cm-preview-frame');
      if (frame) { frame.style.width = w; frame.style.margin = w !== '100%' ? '0 auto' : ''; }
      document.querySelectorAll('.cm-device-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });
}

// ── Resize handle (drag to resize editor/preview split) ───────────────────────
function initResizeHandle() {
  const handle = document.getElementById('cm-resize-handle');
  const editorPane  = document.getElementById('cm-editor-pane');
  const previewPane = document.getElementById('cm-preview-pane');
  if (!handle || !editorPane || !previewPane) return;

  let dragging = false;
  let startX = 0, startW = 0;

  handle.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startW = editorPane.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const totalW = editorPane.parentElement?.getBoundingClientRect().width || 1000;
    const newW = Math.max(240, Math.min(totalW - 240, startW + delta));
    editorPane.style.flex = `0 0 ${newW}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

// ── AI Assist ─────────────────────────────────────────────────────────────────
/**
 * @param {string} prompt
 */
async function runAIAssist(prompt) {
  const outputEl = document.getElementById('cm-ai-output');
  if (!outputEl) return;
  outputEl.hidden = false;
  outputEl.textContent = '⟳ Generating code…';
  setStatus('AI is writing code…');

  try {
    const currentHtml = window._cmGetCode?.('html') || '';
    const currentCss  = window._cmGetCode?.('css')  || '';
    const currentJs   = window._cmGetCode?.('js')   || '';

    const systemPrompt = `You are an expert web developer. Generate complete, working HTML/CSS/JS code.
Return your answer as a JSON object with exactly these keys: {"html":"...","css":"...","js":"..."}.
Do not include backticks or markdown fences — only raw JSON.
Write modern, clean, accessible code. Use CSS custom properties and flexbox/grid.
Never include API keys, private keys, seed phrases, wallet secrets, or provider tokens in source code. Use placeholders and tell the user to store secrets in Vault or environment variables.
Current project files are provided as context.`;

    const userPrompt = `${prompt}

Current code context:
=== index.html ===
${currentHtml.slice(0, 2000)}

=== style.css ===
${currentCss.slice(0, 1500)}

=== script.js ===
${currentJs.slice(0, 1000)}

Generate updated code for all three files. Return only the JSON object.`;

    const reply = await runMissionEngine({
      mode: 'build',
      prompt: userPrompt,
      history: [],
      systemPrompt,
      settings: {
        ...(window.loadAISettings?.() || {})
      },
      taskType: 'build',
      origin: 'code-maker',
      metadata: {
        surface: 'code-maker',
        artifactType: 'website'
      }
    });
    const text  = String(reply?.text || '').trim();

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || text);
    } catch {
      // Fallback: show raw output
      outputEl.textContent = text.slice(0, 1000);
      setStatus('AI responded — review the output above.', false);
      return;
    }

    // Apply generated code
    if (parsed.html) window._cmSetCode('html', parsed.html);
    if (parsed.css)  window._cmSetCode('css',  parsed.css);
    if (parsed.js)   window._cmSetCode('js',   parsed.js);

    outputEl.textContent = '✅ Code generated! Preview updated.';
    setStatus('AI code applied — preview updated.');

    // Dispatch to activity monitor
    document.dispatchEvent(new CustomEvent('eon:ai-action', { detail: { provider: 'AI', action: 'code-generation', detail: prompt.slice(0, 80), outputLength: (parsed.html?.length || 0) + (parsed.css?.length || 0) + (parsed.js?.length || 0) } }));

    setTimeout(runPreview, 100);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    outputEl.textContent = `AI error: ${errorMessage}. Check your API keys in Vault.`;
    setStatus('AI code generation failed.', true);
  }
}

// ── Export as ZIP ─────────────────────────────────────────────────────────────
async function exportProject() {
  const name = /** @type {HTMLInputElement | null} */ (document.getElementById('cm-project-name'))?.value || 'my-project';
  const files = {
    'index.html': window._cmGetCode?.('html') || DEFAULTS.html,
    'style.css':  window._cmGetCode?.('css')  || DEFAULTS.css,
    'script.js':  window._cmGetCode?.('js')   || DEFAULTS.js
  };

  // Create a simple multi-file download (no JSZip needed — just download each)
  // For a real ZIP, use JSZip CDN. For now, create individual downloads:
  for (const [filename, content] of Object.entries(files)) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${name}-${filename}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    await new Promise(r => setTimeout(r, 100));
  }
  setStatus(`Exported ${Object.keys(files).length} files.`);
}

function getBuilderCodeSnapshot() {
  return {
    html: window._cmGetCode?.('html') || DEFAULTS.html,
    css: window._cmGetCode?.('css') || DEFAULTS.css,
    js: window._cmGetCode?.('js') || DEFAULTS.js
  };
}

/**
 * @param {any} bundle
 */
function updateDeployOutput(bundle) {
  const outputEl = document.getElementById('cm-deploy-output');
  if (!outputEl) return;
  const manifest = bundle?.manifest || {};
  const verification = bundle?.verification || verifyDeployBundle({
    manifest,
    html: bundle?.html || window._cmGetCode?.('html') || DEFAULTS.html,
    css: bundle?.css || window._cmGetCode?.('css') || DEFAULTS.css,
    js: bundle?.js || window._cmGetCode?.('js') || DEFAULTS.js
  });
  const files = Array.isArray(manifest?.files) ? manifest.files : [];
  outputEl.hidden = false;
  outputEl.innerHTML = `
    <strong>Deploy receipt ready.</strong><br>
    <span>1.</span> Prepare the files<br>
    <span>2.</span> Copy the manifest or open the guide<br>
    <span>3.</span> Upload to ${manifest.target === 'github-pages' ? 'GitHub Pages' : 'Cloudflare Pages'} and confirm the live URL<br><br>
    <span>Verifier:</span> ${verification.ok ? 'Passed' : 'Review needed'}<br>
    <span>Target:</span> ${manifest.target === 'github-pages' ? 'GitHub Pages' : 'Cloudflare Pages'}<br>
    <span>Project:</span> ${manifest.projectName}<br>
    <span>Route:</span> ${manifest.route || '/'}<br>
    <span>Files:</span> ${files.length ? files.map((/** @type {{ path: string }} */ file) => file.path).join(', ') : 'index.html, style.css, script.js'}<br>
    <span>Status:</span> The browser cockpit has already prepared the deploy handoff.
  `;
  setStatus(verification.ok ? 'Deploy bundle prepared and verified.' : 'Deploy bundle prepared, but review the verifier output.', !verification.ok);
  showToast(verification.ok ? 'Deploy bundle prepared.' : 'Deploy bundle needs review.', verification.ok ? 'success' : 'warning');
  return { manifest, verification };
}

async function prepareDeployFlow() {
  const snapshot = getBuilderCodeSnapshot();
  const projectName = /** @type {HTMLInputElement | null} */ (document.getElementById('cm-project-name'))?.value || 'My Project';
  const target = /** @type {HTMLSelectElement | null} */ (document.getElementById('cm-deploy-target'))?.value || 'cloudflare-pages';
  const route = /** @type {HTMLInputElement | null} */ (document.getElementById('cm-deploy-route'))?.value || '/';
  const bundle = await prepareDeployBundle({
    projectName,
    target,
    route,
    ...snapshot
  });
  updateDeployOutput(bundle);
}

async function copyDeployFlow() {
  const snapshot = getBuilderCodeSnapshot();
  const projectName = document.getElementById('cm-project-name')?.value || 'My Project';
  const target = document.getElementById('cm-deploy-target')?.value || 'cloudflare-pages';
  const route = document.getElementById('cm-deploy-route')?.value || '/';
  const manifest = buildDeployManifest({
    projectName,
    target,
    route,
    ...snapshot
  });
  await copyDeployManifest(manifest);
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMonaco();
setTimeout(() => { if (!monacoReady) initFallbackEditor('Monaco CDN timed out or was blocked.'); }, 4500);
  initDeviceSwitcher();
  initResizeHandle();
  refreshCodeOSRuntimeStatus().catch(() => setTextById('cm-local-runtime-status', 'Local runtime discovery could not complete.'));

  document.getElementById('cm-btn-run')?.addEventListener('click', runPreview);
  document.getElementById('cm-preview-refresh')?.addEventListener('click', runPreview);
  document.getElementById('cm-btn-export')?.addEventListener('click', exportProject);
  document.getElementById('cm-btn-deploy')?.addEventListener('click', () => {
    const drawer = document.getElementById('cm-deploy-drawer');
    if (drawer) drawer.hidden = !drawer.hidden;
  });

  document.getElementById('cm-btn-fullscreen')?.addEventListener('click', () => {
    const pp = document.getElementById('cm-preview-pane');
    pp?.classList.toggle('cm-preview-fullscreen');
  });

  document.getElementById('cm-preview-newwindow')?.addEventListener('click', () => {
    if (!monacoReady) return;
    const html = buildPreviewDocument();
    const win = window.open('', '_blank', 'width=1200,height=800,noopener');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    }
  });

  document.getElementById('cm-btn-open-browser')?.addEventListener('click', () => {
    window.location.href = '/workspace';
  });

  document.getElementById('cm-deploy-drawer-close')?.addEventListener('click', () => {
    const drawer = document.getElementById('cm-deploy-drawer');
    if (drawer) drawer.hidden = true;
  });

  document.getElementById('cm-deploy-prepare')?.addEventListener('click', () => {
    prepareDeployFlow().catch((err) => {
      showToast(err?.message || 'Could not prepare deploy bundle.', 'error');
      setStatus('Deploy bundle preparation failed.', true);
    });
  });

  document.getElementById('cm-deploy-copy')?.addEventListener('click', () => {
    copyDeployFlow().catch((err) => {
      showToast(err?.message || 'Could not copy deploy manifest.', 'error');
    });
  });

  document.getElementById('cm-deploy-guide')?.addEventListener('click', openDeployGuide);

  // AI Assist drawer
  document.getElementById('cm-btn-ai')?.addEventListener('click', () => {
    const drawer = document.getElementById('cm-ai-drawer');
    if (drawer) drawer.hidden = !drawer.hidden;
  });
  document.getElementById('cm-ai-drawer-close')?.addEventListener('click', () => {
    const drawer = document.getElementById('cm-ai-drawer');
    if (drawer) drawer.hidden = true;
  });

  // Quick template buttons
  document.querySelectorAll('.cm-ai-tmpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textarea = document.getElementById('cm-ai-prompt');
      if (textarea) textarea.value = btn.dataset.prompt || '';
      textarea?.focus();
    });
  });

  document.getElementById('cm-ai-submit')?.addEventListener('click', () => {
    const prompt = (document.getElementById('cm-ai-prompt')?.value || '').trim();
    if (prompt) runAIAssist(prompt);
  });



  document.getElementById('cm-btn-secrets')?.addEventListener('click', () => {
    const drawer = document.getElementById('cm-codeos-drawer');
    if (drawer) drawer.hidden = false;
    scanForSecrets();
  });

  document.getElementById('cm-btn-github-handoff')?.addEventListener('click', createGitHubHandoff);
  document.getElementById('cm-btn-voice')?.addEventListener('click', startVoicePrompt);
  document.getElementById('cm-codeos-drawer-close')?.addEventListener('click', () => {
    const drawer = document.getElementById('cm-codeos-drawer');
    if (drawer) drawer.hidden = true;
  });
  document.querySelectorAll('[data-codeos-template]').forEach((button) => {
    button.addEventListener('click', () => fillTemplatePrompt(button.getAttribute('data-codeos-template') || 'image'));
  });

  document.getElementById('cm-ai-prompt')?.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      const prompt = (/** @type {HTMLTextAreaElement} */ (e.target).value || '').trim();
      if (prompt) runAIAssist(prompt);
    }
  });
});
