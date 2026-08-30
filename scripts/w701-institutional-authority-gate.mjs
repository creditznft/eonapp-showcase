#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const exists = (relative) => fs.existsSync(path.join(root, relative));

export function inspectW701InstitutionalAuthority() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const authority = readJson('config/w701-institutional-authority.json');
  const register = readJson('config/w701-defect-register.json');
  const required = [
    'config/w701-institutional-authority.json',
    'config/w701-defect-register.json',
    'docs/institutional/W701_DEFECT_AND_EVIDENCE_LEDGER_2026-07-25.md',
    'docs/institutional/W701_RUNTIME_AUTHORITY_MAP_2026-07-25.md'
  ];
  add('required-authorities', required.every(exists), 'machine-readable authority, register, evidence ledger and runtime map exist');
  add('exact-verified-w700-tree', authority.sourceAuthority.verifiedW700SourceTree === 'c07ad6ba78b486a89d5381640bc12b195ddf2c3a', 'verified source tree is frozen');
  let sourceCommitExists = false;
  let sourceTreeMatches = false;
  try {
    sourceCommitExists = execFileSync('git', ['cat-file', '-t', authority.sourceAuthority.verifiedW700SourceCommit], { cwd: root, encoding: 'utf8' }).trim() === 'commit';
    sourceTreeMatches = execFileSync('git', ['show', '-s', '--format=%T', authority.sourceAuthority.verifiedW700SourceCommit], { cwd: root, encoding: 'utf8' }).trim() === authority.sourceAuthority.verifiedW700SourceTree;
  } catch {}
  add('verified-source-object', sourceCommitExists && sourceTreeMatches, 'local Git history retains the certified W700 source commit and tree');
  add('live-release-authority', /^[a-f0-9]{40}$/.test(authority.sourceAuthority.liveW700ReleaseCommit) && /^[a-f0-9]{64}$/.test(authority.sourceAuthority.liveCandidateDigest), 'live W700.9 commit and candidate digest are explicit');
  add('release-delta-chain', authority.sourceAuthority.releaseDeltaCommits.length === 7 && authority.sourceAuthority.releaseDeltaCommits.every((sha) => /^[a-f0-9]{40}$/.test(sha)), 'narrow W700 production repair chain is frozen for later reconciliation');
  add('no-false-live-reconstruction-claim', authority.sourceAuthority.localReleaseDeltaApplied === false && authority.sourceAuthority.candidateFreezeBlockedUntilLiveDeltaReconciled === true, 'local W701 work does not falsely claim exact W700.9 source equivalence');
  add('local-only-boundary', authority.releaseBoundaries.githubActionsAllowed === false && authority.releaseBoundaries.cloudflareMutationAllowed === false && authority.releaseBoundaries.productionMutationAllowed === false, 'W701-W703 cannot trigger hosted CI or deployment');
  add('p0-register', register.defects.filter((entry) => entry.severity === 'P0').length >= 4 && register.defects.every((entry) => entry.id && entry.ownerWave), 'institutional blocker register has owners and wave authority');
  const docs = `${read(required[2])}\n${read(required[3])}`;
  add('truth-language', /no GitHub Actions/i.test(docs) && /no storage or execution/i.test(docs) && /one protected Babylon renderer/i.test(docs), 'evidence and runtime documents preserve release, state and renderer boundaries');
  return Object.freeze({ schema: 'eonapp.w701.institutional-authority-gate.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks) });
}

const report = inspectW701InstitutionalAuthority();
for (const check of report.checks) console.log(`[W701] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W701] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
