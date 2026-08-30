import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || globalThis;
globalThis.document = globalThis.document || {
  documentElement: { setAttribute() {} },
  createElement() { return {}; },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
globalThis.localStorage = globalThis.localStorage || {
  getItem() { return null; },
  setItem() {},
  removeItem() {},
  clear() {}
};
if (!globalThis.navigator) {
  Object.defineProperty(globalThis, 'navigator', {
    value: {},
    configurable: true
  });
}

const { normalizeSocialContent } = await import('../../assets/js/utils/social-publisher.js');

test('normalizeSocialContent preserves media bundle fields', () => {
  const bundle = normalizeSocialContent({
    title: 'Launch day',
    text: 'Watch the new product demo',
    mediaUrl: 'https://cdn.example.com/video.mp4',
    kind: 'short video',
    attachments: [
      { url: 'https://cdn.example.com/image.png', type: 'image', label: 'Hero image' },
      { url: '', type: 'ignore' }
    ]
  });

  assert.equal(bundle.title, 'Launch day');
  assert.equal(bundle.text, 'Watch the new product demo');
  assert.equal(bundle.mediaUrl, 'https://cdn.example.com/video.mp4');
  assert.equal(bundle.kind, 'short video');
  assert.equal(bundle.attachments.length, 1);
  assert.equal(bundle.attachments[0].url, 'https://cdn.example.com/image.png');
  assert.equal(bundle.attachments[0].type, 'image');
});
