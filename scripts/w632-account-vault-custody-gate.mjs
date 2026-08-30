#!/usr/bin/env node
import fs from 'node:fs';
import { validateW632AccountVaultContract, EON_W632_APPROVED_SECRET_CUSTODY, EON_W632_DATA_DOMAINS } from '../assets/js/account/eon-account-vault-custody.js';

const config = JSON.parse(fs.readFileSync(new URL('../config/w632-account-vault-custody-contract.json', import.meta.url), 'utf8'));
const pages = ['vault.html', 'profile.html', 'settings.html'].map((name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));
const report = validateW632AccountVaultContract();
const checks = [
  ['contract-valid', report.ok],
  ['five-domains', Object.keys(EON_W632_DATA_DOMAINS).length === 5 && config.domains.length === 5],
  ['approved-custody', EON_W632_APPROVED_SECRET_CUSTODY.join(',') === config.approvedSecretCustody.join(',')],
  ['identity-not-backup', config.boundaries.identityIsBackup === false],
  ['no-generic-localstorage-secrets', config.boundaries.genericLocalStorageForSecrets === false],
  ['secret-not-readable-exportable', config.boundaries.providerSecretReadableByUi === false && config.boundaries.providerSecretExportable === false],
  ['restore-review-first', config.boundaries.restoreRequiresPreview && config.boundaries.restoreRequiresConflictReview && config.boundaries.automaticRestore === false],
  ['account-pages-load-panel', pages.every((source) => source.includes('/assets/js/account/eon-account-vault-custody.js'))]
];
for (const [id, pass] of checks) console.log(`[W632] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W632] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
