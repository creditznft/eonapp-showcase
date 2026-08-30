import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonResponsiveInputSnapshot } from '../assets/js/utils/responsive-accessibility-input.js';
import { COMPATIBILITY_ROUTES, INFORMATIONAL_ROUTES, PRIMARY_APP_ROUTES } from './route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = Object.freeze(JSON.parse(fs.readFileSync(path.join(root, 'config/w634-responsive-accessibility-input-contract.json'), 'utf8')));

export const W634_RESPONSIVE_ACCESSIBILITY_INPUT_CONTRACT = contract;
export const W634_ROUTE_LAYOUT_OWNERS = Object.freeze({
  conversational: Object.freeze(['index.html', 'create.html', 'projects.html', 'library.html']),
  workbench: Object.freeze(['workspace.html', 'forge.html', 'automations.html', 'local-ai.html', 'realm-studio.html', 'market.html']),
  immersive: Object.freeze(['eoncity.html']),
  records: Object.freeze(['trade.html', 'profile.html', 'vault.html', 'capsule.html', 'billing.html', 'eon-keys.html', 'rewards.html']),
  informational: Object.freeze([
    'about.html', 'advertising-disclosure.html', 'editorial-policy.html', 'privacy.html', 'terms.html', 'legal.html', 'settings.html', 'help.html', 'status.html', 'install.html', 'archive.html',
    'guides/index.html',
    'guides/ai-api-cost-calculator.html',
    'guides/ai-api-cost-optimization.html',
    'guides/ai-api-pricing-guide.html',
    'guides/ai-automation-small-business.html',
    'guides/ai-chatbot-cost-small-business.html',
    'guides/ai-for-small-business.html',
    'guides/ai-tools-for-freelancers.html',
    'guides/byok-ai-guide.html',
    'guides/laptop-for-local-ai.html',
    'guides/local-ai-hardware-checker.html',
    'guides/local-ai-on-android.html',
    'guides/local-ai-ram-guide.html',
    'guides/local-ai-vram-guide.html',
    'guides/local-ai-vs-cloud-ai.html',
    'guides/private-ai-guide.html',
    'guides/webgpu-local-ai.html'
  ]),
  compact: Object.freeze(['telegram.html', 'referral.html', 'realm-profile.html'])
});

export function getW634PublicFiles() {
  const rows = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES.filter((row) => Number(row.status) === 200)];
  return Object.freeze([...new Set(rows.map((row) => row.file).filter(Boolean))].sort());
}

function environmentForProfile(profile) {
  const active = new Set();
  if (profile.coarsePointer) active.add('(pointer: coarse)');
  if (profile.coarsePointer) active.add('(hover: none)');
  if (profile.standalone) active.add('(display-mode: standalone)');
  return Object.freeze({
    innerWidth: profile.width,
    innerHeight: profile.height,
    navigator: Object.freeze({ standalone: Boolean(profile.standalone) }),
    matchMedia: (query) => Object.freeze({ matches: active.has(query) })
  });
}

export function validateW634ResponsiveAccessibilityInputContract() {
  const checks = [];
  const add = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  add('identity', contract.wave === 'W634' && /w634-responsive-accessibility-input/.test(contract.schema), contract.schema);
  add('ten-requirements', Array.isArray(contract.requirements) && contract.requirements.length === 10, `${contract.requirements?.length || 0}/10`);
  add('device-profile-count', Array.isArray(contract.deviceProfiles) && contract.deviceProfiles.length === 8, `${contract.deviceProfiles?.length || 0}/8`);
  add('physical-evidence-explicit', Array.isArray(contract.physicalEvidenceRequired) && contract.physicalEvidenceRequired.length === 8, `${contract.physicalEvidenceRequired?.length || 0}/8`);
  const publicFiles = getW634PublicFiles();
  const ownedFiles = Object.values(W634_ROUTE_LAYOUT_OWNERS).flat().sort();
  add('route-owner-complete', JSON.stringify(ownedFiles) === JSON.stringify(publicFiles), `${ownedFiles.length}/${publicFiles.length}`);
  add('route-owner-unique', new Set(ownedFiles).size === ownedFiles.length, `${new Set(ownedFiles).size}/${ownedFiles.length}`);
  for (const profile of contract.deviceProfiles || []) {
    const snapshot = getEonResponsiveInputSnapshot(environmentForProfile(profile));
    const pass = snapshot.layout === profile.expectedLayout
      && snapshot.orientation === profile.expectedOrientation
      && snapshot.displayMode === (profile.standalone ? 'standalone' : 'browser')
      && snapshot.shortLandscape === Boolean(profile.shortLandscape)
      && snapshot.physicalDeviceCertified === false;
    add(`profile-${profile.id}`, pass, `${snapshot.layout}/${snapshot.orientation}/${snapshot.displayMode}/short:${snapshot.shortLandscape}`);
  }
  return Object.freeze({
    schema: 'eonapp.validation.w634-responsive-accessibility-input.2026-07-11.v1',
    wave: 'W634',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks: Object.freeze(checks),
    publicFileCount: publicFiles.length,
    layoutOwnerCount: Object.keys(W634_ROUTE_LAYOUT_OWNERS).length,
    physicalEvidenceCertified: false
  });
}
