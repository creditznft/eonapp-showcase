import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FILES = ['index.html', 'onboarding.html', 'vault.html', 'subscription.html', 'reward-access.html'];
const CSS = '<link rel="stylesheet" href="/assets/css/telegram-growth.css" />';
const JS = '<script type="module" src="/assets/js/telegram-growth-widget.js"></script>';

function insertBeforeClose(source, closeTag, snippet) {
  if (source.includes(snippet)) return source;
  const idx = source.toLowerCase().lastIndexOf(closeTag.toLowerCase());
  if (idx === -1) return `${source}\n${snippet}\n`;
  return `${source.slice(0, idx)}  ${snippet}\n${source.slice(idx)}`;
}

const touched = [];
for (const file of FILES) {
  const path = join(ROOT, file);
  if (!existsSync(path)) continue;
  let source = readFileSync(path, 'utf8');
  const before = source;
  source = insertBeforeClose(source, '</head>', CSS);
  source = insertBeforeClose(source, '</body>', JS);
  if (source !== before) {
    writeFileSync(path, source);
    touched.push(file);
  }
}

console.log(JSON.stringify({ ok: true, hook: 'telegram-growth-widget', files: FILES, touched }, null, 2));
