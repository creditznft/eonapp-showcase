import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function importBrowserModule(repoRoot, entry, files) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'eon-browser-module-'));
  for (const file of files) {
    const sourcePath = path.join(repoRoot, file);
    const destRel = file.replace(/\.js$/, '.mjs');
    const destPath = path.join(temp, destRel);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    let source = await fs.readFile(sourcePath, 'utf8');
    source = source.replace(/(from\s+['"]|import\s*\(\s*['"])([^'"]+)\.js(['"])/g, '$1$2.mjs$3');
    await fs.writeFile(destPath, source);
  }
  const entryPath = path.join(temp, entry.replace(/\.js$/, '.mjs'));
  return import(`${pathToFileURL(entryPath).href}?v=${Date.now()}`);
}

export function installStoragePolyfill() {
  class Storage {
    #map = new Map();
    getItem(key) { return this.#map.has(String(key)) ? this.#map.get(String(key)) : null; }
    setItem(key, value) { this.#map.set(String(key), String(value)); }
    removeItem(key) { this.#map.delete(String(key)); }
    clear() { this.#map.clear(); }
  }
  globalThis.localStorage = new Storage();
  globalThis.sessionStorage = new Storage();
  globalThis.location = new URL('https://eonapp.ch/');
}
