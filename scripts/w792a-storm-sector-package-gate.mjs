import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE,
  validateEonExpanseW792AStormSectorPackage
} from '../assets/js/city/w792/eon-expanse-w792a-storm-sector-authored-package.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const failures = [...validateEonExpanseW792AStormSectorPackage().errors];
const records = [
  ...EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.heroAssets.flatMap((entry) => entry.lods),
  ...EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.audioFamilies
];
for (const record of records) {
  const local = path.join(root, String(record.url).replace(/^\//, ''));
  try {
    const bytes = await readFile(local);
    const meta = await stat(local);
    if (meta.size !== record.bytes) failures.push(`byte-size:${record.url}`);
    if (digest(bytes) !== record.sha256) failures.push(`sha256:${record.url}`);
  } catch {
    failures.push(`missing:${record.url}`);
  }
}
const jsonPath = path.join(root, 'assets/city/future-regions/storm-sector/storm-sector-package.json');
try {
  const manifest = JSON.parse(await readFile(jsonPath, 'utf8'));
  if (manifest.packageDigest !== EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.packageDigest) failures.push('manifest-digest-mismatch');
} catch {
  failures.push('manifest-unreadable');
}
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    regionId: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.regionId,
    packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.packageDigest,
    fileCount: records.length,
    totalBytes: records.reduce((sum, entry) => sum + entry.bytes, 0),
    certificationState: 'candidate-visible-validation-required'
  }, null, 2));
}
