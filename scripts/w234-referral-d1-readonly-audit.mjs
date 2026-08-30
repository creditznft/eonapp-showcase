#!/usr/bin/env node
/**
 * W234 — source-only audit of the retired Cloudflare D1 referral template.
 *
 * R3-F1 intentionally moved the old cloud referral module out of active
 * source. This audit verifies that archival boundary and the current
 * fail-closed replacement; it must never restore the historical module merely
 * to make an old audit pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEonInviteArchitectureContract } from '../config/eon-invite-architecture.mjs';
import { getW393ALeanHandoverStatus } from '../config/w393a-lean-handover-integrity-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const errors = [];
const warnings = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const HISTORICAL_ORIGINAL = 'assets/js/utils/referral-cloud-storage.js';
const ARCHIVE_MANIFEST = 'archive/retired-value-systems/MANIFEST.json';
const wrangler = read('platform-backend/wrangler.toml');
const historicalMigration = read('migrations/0001_referral_storage.sql');
const futureMigration = read('platform-backend/migrations/future/0100_eon_invite_access_milestones_schema.DISABLED.sql');
const referralRuntime = read('assets/js/utils/referral-par.js');
const architecture = validateEonInviteArchitectureContract();
const leanHandover = getW393ALeanHandoverStatus();
const archiveManifestPresent = exists(ARCHIVE_MANIFEST);
let archiveEntry = null;
if (archiveManifestPresent) {
  try {
    const manifest = JSON.parse(read(ARCHIVE_MANIFEST));
    archiveEntry = Array.isArray(manifest?.entries)
      ? manifest.entries.find((entry) => entry?.originalPath === HISTORICAL_ORIGINAL) || null
      : null;
  } catch (error) {
    errors.push(`Unable to read retired referral archive manifest: ${error.message}`);
  }
}
const archivedCloudStorage = archiveEntry?.archivePath && exists(archiveEntry.archivePath) ? read(archiveEntry.archivePath) : '';

assert(architecture.ok, architecture.errors.join(' '));
assert(/database_id\s*=\s*"replace-with-real-d1-database-id"/.test(wrangler), 'platform-backend must retain a placeholder D1 id in this read-only source handover.');
assert(!exists('functions/api/referrals'), 'Pages referral API directory must stay absent while the invite program is inactive.');
assert(!/\/api\/referrals/.test(referralRuntime), 'Canonical referral runtime must not call a server referral API.');
assert(/no_active_referral_or_reward_program/.test(referralRuntime), 'Canonical referral runtime must fail closed for settlement.');
assert(!exists(HISTORICAL_ORIGINAL), 'Historical cloud referral module must remain absent from active source.');
if (archiveManifestPresent) {
  assert(Boolean(archiveEntry?.archivePath && archiveEntry?.sha256), 'Historical cloud referral module must be recorded in the R3-F1 hash manifest when that archive is present.');
  assert(Boolean(archiveEntry?.archivePath && exists(archiveEntry.archivePath)), 'Historical cloud referral module must remain physically archived when that archive is present.');
  assert(/Cloudflare D1 binding REFERRALS_DB/.test(archivedCloudStorage), 'Archived cloud referral module must remain identifiable for historical review.');
} else {
  warnings.push('R3-F1 archive evidence is not packaged in this lean continuation handover; only the current inactive referral boundary is certified.');
  assert(leanHandover.historicArchiveVerification === 'not-certified-by-this-handover', 'Lean handover contract must disclose that historic archive verification is unavailable.');
}
assert(/FUTURE-ONLY \/ NOT DEPLOYED/.test(futureMigration), 'Future migration must be visibly non-deployed.');
assert(!/amount|exchange_rate|wallet|payout|coin|token|pool_points|commission/i.test(futureMigration), 'Future D1 schema must not encode financial, token or commission fields.');
assert(/milestone_reversed/.test(futureMigration) && /milestone_expired/.test(futureMigration), 'Future D1 schema must contain reversal and expiry states.');
assert(/CREATE TABLE IF NOT EXISTS referral_events/i.test(historicalMigration), 'Historical migration must remain identifiable for archival context.');
if (/database_name\s*=\s*"eonapp-platform"/.test(wrangler)) warnings.push('A historical platform-backend D1 template exists; it is not proof of an active Pages binding.');
warnings.push('Historical referral cloud code is archive-only. It must not be restored to active source to satisfy this audit.');

const report = {
  schema: 'eonapp.w234.referral-d1-readonly-audit.v2',
  ok: errors.length === 0,
  mode: archiveManifestPresent ? 'read-only-archive-audit' : 'lean-current-source-audit',
  checkedAt: new Date().toISOString(),
  findings: {
    platformBackendTemplatePresent: true,
    d1DatabaseIdPlaceholder: /replace-with-real-d1-database-id/.test(wrangler),
    activePagesReferralFunctionsPresent: exists('functions/api/referrals'),
    canonicalReferralRuntimeUsesNetwork: /\/api\/referrals/.test(referralRuntime),
    historicalCloudReferralModuleActive: exists(HISTORICAL_ORIGINAL),
    historicalArchiveEvidencePresent: archiveManifestPresent,
    historicalCloudReferralModuleArchived: Boolean(archiveEntry?.archivePath && exists(archiveEntry.archivePath)),
    historicalCloudReferralArchivePath: archiveEntry?.archivePath || '',
    historicalCloudReferralHashVerified: false,
    futureSchemaDeferred: /FUTURE-ONLY \/ NOT DEPLOYED/.test(futureMigration)
  },
  warnings,
  errors
};

fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W234_REFERRAL_D1_READONLY_AUDIT_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`[W234] ${report.ok ? 'PASS' : 'FAIL'}: ${report.mode}; active Pages endpoints=${report.findings.activePagesReferralFunctionsPresent}; historical archive evidence=${report.findings.historicalArchiveEvidencePresent ? 'present' : 'not-packaged'}.`);
if (warnings.length) warnings.forEach((warning) => console.warn(`[W234] warning: ${warning}`));
if (!report.ok) errors.forEach((error) => console.error(`[W234] ${error}`));
process.exitCode = report.ok ? 0 : 1;
