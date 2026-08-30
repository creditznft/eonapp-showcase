/** EONAPP W210 — browser-local device readiness and human evidence preparation. This check does not send hardware data. */
import { getEonPwaState, getEonPwaInstallGuidance } from '../eon-pwa-manager.js';
import { getLocalEncryptedExportTruth } from '../local-first/eon-local-encrypted-export.js';
import { listRuntimeErrors } from '../utils/runtime-error-telemetry.js';

const root = typeof document !== 'undefined' ? document.getElementById('eon-device-check-root') : null;
function escapeHtml(value = '') { return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
function checkWebGl() {
  try { const canvas = document.createElement('canvas'); return { webgl2: Boolean(canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })), webgl: Boolean(canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) || canvas.getContext('experimental-webgl')) }; }
  catch { return { webgl: false, webgl2: false }; }
}
function platformFromUserAgent(value = '') {
  const ua = String(value || '').toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iPhone/iPad Safari';
  if (/android/.test(ua)) return 'Android browser';
  if (/edg\//.test(ua)) return 'Desktop Edge';
  if (/chrome\//.test(ua)) return 'Desktop Chrome';
  return 'Current browser';
}

export function assessEonDevice(options = {}) {
  const nav = options.navigator || globalThis.navigator || {};
  const media = options.matchMedia || globalThis.matchMedia;
  const gl = options.webgl || checkWebGl();
  const memory = Number(nav.deviceMemory || 0);
  const cores = Number(nav.hardwareConcurrency || 0);
  const saveData = Boolean(nav.connection?.saveData);
  const touch = Number(nav.maxTouchPoints || 0) > 0;
  const standalone = Boolean(media?.('(display-mode: standalone)')?.matches || nav.standalone === true);
  const webgpu = Boolean(nav.gpu);
  const platform = platformFromUserAgent(nav.userAgent || '');
  const mobile = /Android|iPhone\/iPad/.test(platform);
  const cityQuality = !gl.webgl || saveData || mobile || (memory > 0 && memory <= 3) || (cores > 0 && cores <= 3)
    ? '2D recommended'
    : gl.webgl2 && memory >= 6 && cores >= 6 ? '3D Pro candidate after an explicit test' : '3D Standard candidate after an explicit test';
  const localAi = mobile
    ? 'Start with EON Local Lite when this mobile browser passes its capability check; desktop runtimes and Companion installers are not offered on phones or tablets.'
    : memory >= 6 && cores >= 4
      ? 'Choose Make Local AI ready for a reviewed Local Lite or desktop-runtime recommendation.'
      : 'Use EON Offline Tools or a connected provider; do not force a slow local model.';
  return Object.freeze({
    schema: 'eon.device.readiness.v2', at: new Date(Number(options.now || Date.now())).toISOString(), platform,
    memory: memory || null, cores: cores || null, webgl: Boolean(gl.webgl), webgl2: Boolean(gl.webgl2), webgpu, saveData, touch,
    online: nav.onLine !== false, standalone, mobile, cityDefault: cityQuality === '2D recommended', cityRecommendation: cityQuality, localAiRecommendation: localAi,
    localModelBrowserInstaller: false
  });
}

export function buildEonDeviceEvidenceMatrix() {
  return Object.freeze([
    { id: 'android-4gb', label: '4 GB Android', expected: '2D City default; no browser-side local LLM installation claim; EON Offline Tools or connected provider.', required: ['portrait Chat composer', '2D City tap targets', 'offline fallback', 'no WebGL crash'] },
    { id: 'android-mid', label: 'Mid-range Android', expected: '2D City default in portrait; optional 3D only after an explicit device check and landscape choice.', required: ['PWA install path', 'City 2D', 'optional 3D exit', 'safe-area navigation'] },
    { id: 'iphone-safari', label: 'iPhone Safari', expected: 'Safari Add to Home Screen instructions; 2D City default; Local Lite only when the real browser capability test passes; no desktop runtime/Companion promise.', required: ['Add to Home Screen', 'Local Lite capability + real generation', 'portrait composer', 'offline/reopen truth', 'no keyboard overlap'] },
    { id: 'mac-safari', label: 'Mac Safari / Apple Silicon', expected: 'Local Lite or a supported installed runtime may be used after proof; a Mac Companion is shown only after Developer ID signing, notarization and device certification.', required: ['Local Lite capability', 'runtime self-test', 'no silent provider fallback', 'City coexistence', 'Companion release truth'] },
    { id: 'desktop-chrome', label: 'Desktop Chrome', expected: 'PWA install prompt if offered; Local AI may recommend a local runtime after an explicit check.', required: ['install/update', 'Ollama detection', 'local self-test', '3D explicit entry'] },
    { id: 'desktop-edge', label: 'Desktop Edge', expected: 'Browser/PWA shell remains coherent; local-runtime path is optional and explicit.', required: ['install/update', 'Chat', 'Portable Capsule', 'City 2D/3D return'] },
    { id: 'slow-network-offline', label: 'Slow network / offline', expected: 'Cached shell and offline page must never claim cloud AI, live trade, web research, publishing, or sending is available.', required: ['offline page', 'cached shell', 'no false cloud status', 'clear reconnect path'] },
    { id: 'no-webgl', label: 'No WebGL', expected: '2D City only; no forced 3D or broken loading state.', required: ['2D City', 'return to Chat', 'no 3D auto-launch'] }
  ]);
}

function downloadReport(report) {
  const payload = { ...report, pwa: getEonPwaState(), installGuidance: getEonPwaInstallGuidance(), localEncryptedExport: getLocalEncryptedExportTruth(), localRuntimeErrors: listRuntimeErrors(), evidenceMatrix: buildEonDeviceEvidenceMatrix(), truth: 'This is a local readiness record, not proof that all named devices were tested.' };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `eonapp-device-readiness-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function render() {
  if (!root) return;
  const report = assessEonDevice(); const pwa = getEonPwaState(); const matrix = buildEonDeviceEvidenceMatrix();
  const checks = [
    { pass: report.online, label: report.online ? 'Network is available for current web features.' : 'Offline: cloud features are unavailable. Cached pages may still open only if they were visited online first.' },
    { pass: report.webgl, label: report.webgl ? 'WebGL is available. Optional 3D can be tested only after an explicit launch.' : 'WebGL is unavailable. Use the 2D Operator Map only.' },
    { pass: !report.saveData, label: report.saveData ? 'Data Saver is on. EONAPP should prefer lighter experiences.' : 'Data Saver is not reported by this browser.' },
    { pass: report.standalone, label: report.standalone ? 'EONAPP is running as an installed app in this browser profile.' : 'EONAPP is running in a browser profile. Installation remains optional.' }
  ];
  root.innerHTML = `<section class="eon-device-card"><h2>This browser</h2><div class="eon-device-recommendation"><span aria-hidden="true">◌</span><div><strong>${escapeHtml(report.cityDefault ? '2D default · 2D recommended' : report.cityRecommendation)}</strong><br><span>${escapeHtml(report.localAiRecommendation)}</span></div></div><div class="eon-device-grid"><div class="eon-device-metric"><span>Platform</span><strong>${escapeHtml(report.platform)}</strong></div><div class="eon-device-metric"><span>WebGL</span><strong>${report.webgl2 ? 'WebGL 2' : report.webgl ? 'WebGL 1' : 'Unavailable'}</strong></div><div class="eon-device-metric"><span>WebGPU</span><strong>${report.webgpu ? 'Available' : 'Not reported'}</strong></div><div class="eon-device-metric"><span>Memory hint</span><strong>${report.memory ? `${report.memory} GB` : 'Not reported'}</strong></div><div class="eon-device-metric"><span>CPU cores</span><strong>${report.cores || 'Not reported'}</strong></div><div class="eon-device-metric"><span>PWA state</span><strong>${pwa.standalone ? 'Installed' : 'Browser'}</strong></div></div><ul class="eon-device-list">${checks.map((check) => `<li class="${check.pass ? 'is-pass' : 'is-warn'}">${escapeHtml(check.label)}</li>`).join('')}</ul><p class="eon-device-install-note">${escapeHtml(pwa.installGuidance || getEonPwaInstallGuidance())}</p><div class="eon-device-actions"><a href="/local-ai#eonbot-local-ai-setup">Make Local AI ready</a><a href="/eoncity">Open EON City</a><button type="button" data-export-device-report>Export local readiness report</button></div></section><section class="eon-device-card"><h2>Physical-device evidence checklist</h2><p>This is a test plan, not completed device evidence. Export the readiness report after each real-device run.</p><div class="eon-device-evidence-grid">${matrix.map((entry) => `<article><h3>${escapeHtml(entry.label)}</h3><p>${escapeHtml(entry.expected)}</p><ul>${entry.required.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>`).join('')}</div></section>`;
  root.querySelector('[data-export-device-report]')?.addEventListener('click', () => downloadReport(report));
}
if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true }); else render(); }
