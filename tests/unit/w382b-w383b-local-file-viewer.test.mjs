import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalAttachmentViewerKind } from '../../assets/js/chat/local-attachments.js';
import { formatLocalJsonPreview, normalizeLocalViewerText, parseLocalDelimitedText } from '../../assets/js/chat/local-file-viewer.js';
import { validateW382BW383BLocalFileViewerContract } from '../../config/w382b-w383b-local-file-viewer-contract.mjs';
import { inspectW382BW383BLocalFileViewer } from '../../scripts/w382b-w383b-local-file-viewer-gate.mjs';

test('W382B/W383B classifies preview surfaces truthfully', () => {
  assert.deepEqual(validateW382BW383BLocalFileViewerContract(), []);
  assert.equal(getLocalAttachmentViewerKind({ name: 'shot.mp4', kind: 'video' }), 'video');
  assert.equal(getLocalAttachmentViewerKind({ name: 'brief.pdf', kind: 'pdf' }), 'pdf');
  assert.equal(getLocalAttachmentViewerKind({ name: 'data.csv', kind: 'text' }), 'table');
  assert.equal(getLocalAttachmentViewerKind({ name: 'deck.pptx', kind: 'office' }), 'office-metadata');
});

test('W382B/W383B formats local JSON and bounded CSV tables without markup execution', () => {
  assert.equal(formatLocalJsonPreview('{\"a\":1}'), '{\n  \"a\": 1\n}');
  assert.deepEqual(parseLocalDelimitedText('name,role\nAsha,creator\nMira,builder'), [['name', 'role'], ['Asha', 'creator'], ['Mira', 'builder']]);
  assert.match(normalizeLocalViewerText('<img src=x onerror=alert(1)>'), /onerror/);
});

test('W382B/W383B gate remains local-only and explicit about Office limitation', () => {
  const report = inspectW382BW383BLocalFileViewer({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 8);
  assert.match(report.limitations.join(' '), /Office files are metadata-only/i);
});
