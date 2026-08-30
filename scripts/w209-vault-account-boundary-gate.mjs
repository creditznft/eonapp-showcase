/** W209 source gate: Vault account boundary, encrypted backup and restore safety. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const mustContain = (source, pattern, label) => {
  if (!pattern.test(source)) throw new Error(`W209 gate missing ${label}`);
};
const mustNotContain = (source, pattern, label) => {
  if (pattern.test(source)) throw new Error(`W209 gate found unsafe ${label}`);
};

const lifecycle = read('assets/js/vault/eon-vault-lifecycle.js');
const vault = read('assets/js/utils/vault.js');
const home = read('vault.html');
const backup = read('vault-backup.html');
const runtime = read('assets/js/vault/eon-vault-backup-page.js');
const redirects = read('_redirects');
const routeContract = read('config/route-contract.mjs');

mustContain(lifecycle, /EON_VAULT_CLEAR_CONFIRMATION/, 'typed clear-data confirmation');
mustContain(lifecycle, /BACKUP_ALLOWED_PREFIXES/, 'explicit portable-backup allowlist');
mustContain(lifecycle, /isEonAppBackupEligibleKey/, 'portable-backup eligibility boundary');
mustContain(lifecycle, /BACKUP_KEY_SENSITIVE_RE/, 'credential-like key exclusion');
mustContain(lifecycle, /unrelatedBrowserStoragePreserved: true/, 'unrelated-storage preservation receipt');
mustContain(lifecycle, /mode === 'replace-eonapp'/, 'explicit replace mode');
mustContain(lifecycle, /migrateKnownLegacyProviderStorage/, 'known legacy migration');
mustNotContain(lifecycle, /console\.log\([^)]*secret/i, 'secret logging');
mustContain(vault, /collectEonAppOwnedStorage/, 'owned storage export scope');
mustContain(vault, /mode: options\.mode \|\| 'merge'/, 'merge default import');
mustContain(home, /Full encrypted Vault backup/, 'Vault home backup link');
mustContain(home, /Secure legacy provider storage/, 'Vault migration action');
mustContain(backup, /Encrypted Vault backup/, 'backup page');
mustContain(backup, /Merge restore/, 'merge-restore explanation');
mustContain(runtime, /inspectVaultImportFile/, 'restore preflight');
mustContain(runtime, /clearEonAppOwnedStorage/, 'clear-data safety');
if (!/^\/vault\/backup \/vault-backup\.html 200/m.test(redirects)) {
  mustContain(routeContract, /\{ id: 'vault-backup', from: '\/vault\/backup', to: '\/vault-backup\.html', status: 200, file: 'vault-backup\.html'/, 'clean backup route contract');
}

const stats = {
  schema: 'eonapp.w209.vault-account-boundary.v1',
  generatedAt: new Date().toISOString(),
  ok: true,
  localOnly: true,
  checks: [
    'allowlisted EONAPP workspace backup scope',
    'raw provider, wallet, exchange and recovery records excluded from portable backup',
    'merge default restore',
    'replace EONAPP-only restore',
    'unrelated same-origin storage preservation',
    'typed local-data clear confirmation',
    'legacy provider migration receipt without raw values',
    'encrypted backup UI and clean route'
  ],
  externalProofStillRequired: [
    'real device encrypted export and restore',
    'Cloudflare Preview update persistence evidence',
    'human recovery-flow review'
  ]
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w209-vault-account-boundary-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
console.log(JSON.stringify(stats, null, 2));
