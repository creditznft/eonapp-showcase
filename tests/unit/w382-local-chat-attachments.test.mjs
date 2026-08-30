import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  addLocalAttachments,
  clearQueuedLocalAttachments,
  getQueuedLocalAttachmentRequest,
  isSensitiveLocalAttachmentName,
  listQueuedLocalAttachments,
  MAX_LOCAL_ATTACHMENT_BYTES
} from '../../assets/js/chat/local-attachments.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function fakeFile({ name, type = 'text/plain', content = '', size = null, lastModified = 1 } = {}) {
  const payload = String(content);
  return {
    name,
    type,
    size: size ?? Buffer.byteLength(payload),
    lastModified,
    async text() { return payload; },
    slice() { return this; }
  };
}

test('W382 accepts local code text without persisting raw contents in chat metadata', async () => {
  clearQueuedLocalAttachments();
  const result = await addLocalAttachments([fakeFile({ name: 'landing-page.tsx', content: 'export const Hero = () => <main>Hello</main>;' })]);
  assert.equal(result.accepted.length, 1);
  const queued = listQueuedLocalAttachments();
  assert.equal(queued.length, 1);
  assert.equal(queued[0].textIncluded, true);
  assert.doesNotMatch(JSON.stringify(queued), /Hello/);
  const request = getQueuedLocalAttachmentRequest();
  assert.match(request.context, /BEGIN LOCAL FILE: landing-page\.tsx/);
  assert.match(request.context, /Hello/);
  clearQueuedLocalAttachments();
});

test('W382 blocks likely secrets before a file can enter the local request queue', async () => {
  clearQueuedLocalAttachments();
  assert.equal(isSensitiveLocalAttachmentName('.env'), true);
  assert.equal(isSensitiveLocalAttachmentName('deploy-private.pem'), true);
  const nameBlocked = await addLocalAttachments([fakeFile({ name: '.env', content: 'API_KEY=example' })]);
  assert.equal(nameBlocked.accepted.length, 0);
  assert.equal(nameBlocked.rejected[0].reason, 'sensitive-file');
  const contentBlocked = await addLocalAttachments([fakeFile({ name: 'notes.txt', content: 'sk-proj_abcdefghijklmnopqrstuvwxyz123456' })]);
  assert.equal(contentBlocked.accepted.length, 0);
  assert.equal(contentBlocked.rejected[0].reason, 'sensitive-content');
  clearQueuedLocalAttachments();
});

test('W382 keeps file limits explicit and image/pdf content local in this first wave', async () => {
  clearQueuedLocalAttachments();
  const tooLarge = await addLocalAttachments([fakeFile({ name: 'too-large.txt', size: MAX_LOCAL_ATTACHMENT_BYTES + 1 })]);
  assert.equal(tooLarge.rejected[0].reason, 'file-too-large');
  const accepted = await addLocalAttachments([
    fakeFile({ name: 'moodboard.png', type: 'image/png', content: 'binary' }),
    fakeFile({ name: 'brief.pdf', type: 'application/pdf', content: 'binary' })
  ]);
  assert.equal(accepted.accepted.length, 2);
  const request = getQueuedLocalAttachmentRequest();
  assert.match(request.context, /local image preview only/);
  assert.match(request.context, /local PDF preview only/);
  assert.equal(request.hasTextContext, false);
  clearQueuedLocalAttachments();
});

test('W382 wires a local attachment picker, direct drop zone, and chat message receipts', () => {
  const html = read('index.html');
  const home = read('assets/js/eonbot-home.js');
  const chat = read('assets/js/chat-page.js');
  assert.match(html, /id="chat-attach"/);
  assert.match(html, /id="chat-attachment-input"/);
  assert.match(html, /data-eonbot-file-drop-zone/);
  assert.match(home, /addLocalAttachments/);
  assert.match(home, /document\.addEventListener\('drop'/);
  assert.match(chat, /consumeQueuedLocalAttachmentRequest/);
  assert.match(chat, /renderChatAttachments/);
  assert.match(chat, /attachments: attachmentRequest\.attachments/);
});
