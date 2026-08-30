import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('RT88 Vault explains safe encrypted-recovery outcomes without rendering key material', () => {
  const source = read('assets/js/vault/eon-vault-page.js');
  assert.match(source, /ApiKeyVault\.diagnoseRetrieve\(providerId/);
  for (const stage of ['passphrase-required', 'provider-entry-missing', 'envelope-malformed', 'decrypt-failed', 'operation-timeout']) {
    assert.match(source, new RegExp(`'${stage}'`));
  }
  assert.match(source, /passphraseInput\) passphraseInput\.value = ''/);
  assert.doesNotMatch(source, /JSON\.stringify\(diagnostic\)/);
});

test('RT88 Providers navigation sends users to Vault rather than the empty profile anchor', () => {
  for (const relative of [
    'assets/js/eon-app-shell.js',
    'assets/js/command/eon-command-registry.js',
    'assets/js/work-surface/adapters/eon-productivity-panel.js'
  ]) {
    const source = read(relative);
    assert.match(source, /\/vault#provider-check/);
    assert.doesNotMatch(source, /\/profile#profile-providers/);
  }
  assert.match(read('assets/js/eon-app-shell.js'), /AI &amp; Providers/);
  assert.match(read('assets/js/command/eon-command-registry.js'), /AI & Providers/);
});
