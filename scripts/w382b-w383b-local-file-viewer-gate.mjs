#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W382B_W383B_LOCAL_FILE_VIEWER_CONTRACT, validateW382BW383BLocalFileViewerContract } from '../config/w382b-w383b-local-file-viewer-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW382BW383BLocalFileViewer() {
  const attachments = read('assets/js/chat/local-attachments.js');
  const viewer = read('assets/js/chat/local-file-viewer.js');
  const home = read('assets/js/eonbot-home.js');
  const html = read('index.html');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  check('contract-valid', validateW382BW383BLocalFileViewerContract().length === 0, 'file viewer contract has no violations');
  check('types', /AUDIO_EXTENSIONS/.test(attachments) && /VIDEO_EXTENSIONS/.test(attachments) && /OFFICE_EXTENSIONS/.test(attachments), 'attachment registry distinguishes media and Office files');
  check('viewer-kinds', /getLocalAttachmentViewerKind/.test(attachments) && /office-metadata/.test(viewer) && /parseLocalDelimitedText/.test(viewer), 'viewer supports truthful local preview kinds');
  check('preview-memory-only', /file: attachment\.file \|\| null/.test(attachments) && /listQueuedLocalAttachments intentionally omits it/.test(attachments), 'raw File stays in current-page memory only');
  check('blob-cleanup', /URL\.revokeObjectURL/.test(viewer) && /dialog\.remove\(\)/.test(viewer), 'blob previews are revoked and transient viewer is removed');
  check('nonexecuting', !/innerHTML\s*=\s*.*textContext|eval\s*\(|new Function|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(viewer), 'viewer does not execute or transmit uploaded content');
  check('chat-preview', /openLocalFileViewer/.test(home) && /eonbot-attachment-preview/.test(home), 'chat attachment tray exposes a local Preview action');
  check('picker-types', /audio\/\*,video\/\*/.test(html) && /\.xlsx/.test(html) && /\.pptx/.test(html), 'native/PWA picker accepts declared media and Office types');
  return Object.freeze({ schema: 'eonapp.w382b.w383b.local-file-viewer-gate.v1', waves: W382B_W383B_LOCAL_FILE_VIEWER_CONTRACT.waves, status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'PDF/media rendering depends on local browser codec and viewer support.', 'Office files are metadata-only until a separate safe parser is approved.']) });
}

export function runW382BW383BLocalFileViewerGate({ writeArtifact = true } = {}) {
  const result = inspectW382BW383BLocalFileViewer();
  if (writeArtifact) { const directory = path.join(root, 'artifacts', 'w382b-w383b-local-file-viewer-gate'); mkdirSync(directory, { recursive: true }); writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); }
  return result;
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW382BW383BLocalFileViewerGate(); process.stdout.write(`W382B/W383B local file viewer gate passed (${result.checkCount}/${result.checkCount}).\n`); }
