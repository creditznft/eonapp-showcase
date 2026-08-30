import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_SHARING_CENTER_EXCLUSIONS, EON_SHARING_CENTER_FAMILIES, createEonSharingCenterController, validateEonSharingManifest } from '../assets/js/share/eon-sharing-center.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export async function validateW624jSharingCenterContract() {
  const checks = [];
  const add = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const now = 1_770_200_000_000;
  const signer = async () => ({ link: 'https://eonapp.ch/r/#eon2.test.signature', canonicalLink: 'https://eonapp.ch/r/#eon2.test.signature' });
  const controller = createEonSharingCenterController({ now: () => now, signer });
  add('six-families', EON_SHARING_CENTER_FAMILIES.length === 6, String(EON_SHARING_CENTER_FAMILIES.length));
  add('required-families', ['project-milestone','sanitized-preview','signed-invite','collaboration-invite','city-postcard','platform-fallback'].every((id) => EON_SHARING_CENTER_FAMILIES.some((entry) => entry.id === id)), 'all families');
  add('explicit-prepare', controller.prepare({ family: 'city-postcard' }).reason === 'explicit-user-action-required', 'explicit action');
  const prepared = controller.prepare({ family: 'city-postcard', title: 'Command District postcard', summary: 'A public-safe City milestone.' }, { explicitUserAction: true });
  add('prepare-safe', prepared.ok && prepared.networkRequestCreated === false, prepared.reason || 'prepared');
  add('manifest-valid', validateEonSharingManifest(prepared.manifest).ok, 'schema validated');
  add('exclusions-complete', EON_SHARING_CENTER_EXCLUSIONS.length === 6 && EON_SHARING_CENTER_EXCLUSIONS.every((entry) => prepared.manifest.excluded.includes(entry)), 'six exclusions');
  add('review-required', (await controller.finalize(prepared.manifest.manifestId, 'copy', { explicitUserAction: true })).reason === 'manifest-review-required', 'review first');
  add('explicit-review', controller.review(prepared.manifest.manifestId).reason === 'explicit-review-required', 'explicit review');
  const reviewed = controller.review(prepared.manifest.manifestId, { explicitUserAction: true });
  add('review-safe', reviewed.ok && reviewed.externalActionStarted === false, reviewed.reason || 'reviewed');
  const finalized = await controller.finalize(prepared.manifest.manifestId, 'copy', { explicitUserAction: true });
  add('final-payload-bounded', finalized.ok && finalized.payload.combinedText.includes('Command District') && finalized.trackingCreated === false, finalized.reason || 'finalized');
  const privateRejected = controller.prepare({ family: 'project-milestone', title: 'Safe', summary: 'Safe', rawPrompt: 'private' }, { explicitUserAction: true });
  add('private-fields-rejected', privateRejected.reason === 'private-or-sensitive-fields-rejected', privateRejected.reason);
  const collab = controller.prepare({ family: 'collaboration-invite', title: 'Invite collaborator', summary: 'Review access.' }, { explicitUserAction: true });
  add('collaboration-unavailable-honest', collab.ok && collab.manifest.authorityAvailable === false && collab.manifest.authorityReason === 'collaboration-delivery-not-released', collab.manifest?.authorityReason);
  const preview = controller.prepare({ family: 'sanitized-preview', title: 'Preview', summary: 'Public preview.' }, { explicitUserAction: true });
  add('preview-url-required', preview.ok && preview.manifest.authorityAvailable === false, preview.manifest?.authorityReason);
  const signed = controller.prepare({ family: 'signed-invite', title: 'City invite', summary: 'Explore City.' }, { explicitUserAction: true });
  controller.review(signed.manifest.manifestId, { explicitUserAction: true });
  const signedFinal = await controller.finalize(signed.manifest.manifestId, 'native-share', { explicitUserAction: true });
  add('signed-authority-used-after-review', signedFinal.ok && signedFinal.signedLinkCreated === true && signedFinal.payload.url.includes('eon2.'), signedFinal.reason || 'signed');
  add('controller-disposes', controller.dispose().disposed === true, 'disposed');

  const source = read('assets/js/share/eon-sharing-center.js');
  const city = read('assets/js/city/eon-city-sharing-center.js');
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const runtimeOwner = read('assets/js/city/eon-city-runtime-owner.js');
  add('source-no-tracking', !/analytics|impression|clickTracking|socialPostTracking/i.test(source), 'no share tracking');
  add('source-no-platform-execution', !/navigator(?:\?\.)?\.share\s*\(|clipboard(?:\?\.)?\.writeText\s*\(|window\.open\s*\(|location\.(?:assign|replace)\s*\(/.test(source), 'core only returns payload');
  add('source-no-commercial-mutation', !/grantReward|applyReferral|checkout|billingMutation:\s*true/i.test(source), 'ordinary sharing separate');
  add('city-explicit-platform-action', /data-eon-sharing-final/.test(city) && /executePlatformAction/.test(city), 'reviewed platform action');
  add('city-included-excluded-review', /Never included/.test(city) && /Included/.test(city), 'visible manifest');
  add('station-integration', /bindEonCitySharingCenter/.test(station) && /w624j-sharing-center/.test(station), 'lifecycle-owned');
  add('old-immediate-popover-retired', !/openEonSharePopover/.test(station), 'no immediate invite popover');
  add('css-present', /W624J · review-first Sharing Center/.test(css), 'W624J CSS');
  add('runtime-owner-preserved', /EON_CITY_RUNTIME_OWNER_SCHEMA/.test(runtimeOwner) && !/sharing-center/.test(runtimeOwner), 'W624B owner unchanged');
  add('w624i-preserved', /bindGenuineAgentTheatre/.test(station), 'W624I remains');
  add('w624h-preserved', /bindTruthfulCommandCenter/.test(station), 'W624H remains');

  return Object.freeze({ schema: 'eonapp.contract.w624j-sharing-center.2026-07-11.v1', wave: 'W624J', ok: checks.every((entry) => entry.pass), total: checks.length, passed: checks.filter((entry) => entry.pass).length, checks: Object.freeze(checks) });
}

export default validateW624jSharingCenterContract;
