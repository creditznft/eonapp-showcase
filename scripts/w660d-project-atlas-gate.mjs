#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_NEXUS_PROJECT_ATLAS_LIMITS,
  getEonNexusProjectAtlasTruth,
  projectEonNexusProjectAtlas
} from '../assets/js/nexus/eon-nexus-project-atlas.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = Object.freeze([
  'assets/js/nexus/eon-nexus-project-atlas.js',
  'assets/js/nexus/eon-nexus-state-contract.js',
  'assets/js/nexus/eon-nexus-privacy-projection.js',
  'assets/js/nexus/eon-nexus-live.js',
  'assets/css/eon-nexus-live.css',
  'tests/unit/w660d-project-atlas.test.mjs',
  'docs/W660D_PROJECT_ATLAS_SOURCE_RECEIPT_2026-07-19.md'
]);
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));

const atlasSource = read('assets/js/nexus/eon-nexus-project-atlas.js');
const stateSource = read('assets/js/nexus/eon-nexus-state-contract.js');
const projectionSource = read('assets/js/nexus/eon-nexus-privacy-projection.js');
const liveSource = read('assets/js/nexus/eon-nexus-live.js');
const css = read('assets/css/eon-nexus-live.css');
const executable = `${atlasSource}\n${stateSource}\n${projectionSource}\n${liveSource}`
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

add('selected-project-only', /cleanId\(record\.id\) !== projectId/.test(atlasSource) && /selectedProjectOnly:\s*true/.test(atlasSource));
add('same-state-contract-domain', /atlas:\s*normalizeAtlas/.test(stateSource) && /atlas,\s*\n\s*updatedAt/.test(projectionSource));
add('live-same-adapter-integration', /mountEonNexusProjectAtlas\(\{[\s\S]*?adapter,/.test(liveSource));
add('bounded-records', EON_NEXUS_PROJECT_ATLAS_LIMITS.tasks === 12 && EON_NEXUS_PROJECT_ATLAS_LIMITS.activity === 8 && /slice\(0, EON_NEXUS_PROJECT_ATLAS_LIMITS\.tasks\)/.test(atlasSource));
add('privacy-redacted-defaults', /detailsOpened && cleanText\(task\.title/.test(atlasSource) && /`Task \$\{index \+ 1\}`/.test(atlasSource) && /Project item \$\{index \+ 1\}/.test(atlasSource));
add('exact-project-activity-filter', /cleanId\(row\?\.projectId\) === projectId/.test(atlasSource));
add('missing-links-explicit', /No durable conversation-to-project link/.test(atlasSource) && /no distinct milestone records/i.test(atlasSource) && /no first-class linked file records/i.test(atlasSource));
add('deterministic-next-action', /deriveNextAction/.test(atlasSource) && /review-needed/.test(atlasSource) && /continue-task/.test(atlasSource));
add('readable-atlas-sections', /Related conversations/.test(atlasSource) && /Tasks and milestones/.test(atlasSource) && /Generated content and files/.test(atlasSource) && /Previous agent activity/.test(atlasSource));
add('accessible-open-close', /aria-labelledby/.test(atlasSource)
  && /Close Atlas/.test(atlasSource)
  && /\['atlas', '(?:Project )?Atlas'\]/.test(liveSource)
  && /if \(next === 'atlas'\) \{ projectAtlas\.open\?\.\(\);/.test(liveSource)
  && /onClose\(\) \{ tabButtons\.get\('atlas'\)\?\.focus/.test(liveSource));
add('mobile-atlas-css', /@media \(max-width: 560px\)[\s\S]*?\.eon-nexus-atlas__spatial/.test(css)
  && /@media \(max-width: 560px\)[\s\S]*?\.eon-nexus-atlas__summary/.test(css)
  && /@media \(max-width: 560px\)[\s\S]*?\.eon-nexus-atlas__header/.test(css));
add('no-raw-project-content', !/\.summary\b|\.note\b|\.content\b/.test(atlasSource));
add('no-second-store', !/localStorage\.|sessionStorage\.|indexedDB|createEonNexusStore/.test(atlasSource));
add('no-automatic-effects', !/fetch\s*\(|getUserMedia\s*(?:\?\.)?\s*\(|SpeechRecognition\s*\(|createAIReplyStream|approveEonbotActionProposal/.test(executable));
add('no-whole-account-galaxy', !/all projects|whole account galaxy|account-wide galaxy/i.test(executable));

const projected = projectEonNexusProjectAtlas({
  activeProjectContext: { projectId: 'project_1', route: '/projects' },
  project: {
    id: 'project_1',
    title: 'Private title',
    tasks: [{ id: 'task_1', title: 'Private task', status: 'todo' }],
    artifacts: [{ id: 'artifact_1', title: 'Private artifact', type: 'output' }]
  }
});
add('runtime-redaction-proof', projected.selected === true && projected.projectLabel === 'Active project' && projected.tasks[0]?.label === 'Task 1' && !JSON.stringify(projected).includes('Private title'));

const truth = getEonNexusProjectAtlasTruth();
add('truth-boundaries', truth.selectedProjectOnly === true
  && truth.ownsProjectStore === false
  && truth.ownsConversationStore === false
  && truth.ownsTaskRuntime === false
  && truth.labelsRedactedByDefault === true
  && truth.missingRelationshipsInvented === false
  && truth.startsAiWork === false
  && truth.externalEffect === false);

const failed = checks.filter((check) => !check.pass);
const report = {
  wave: 'W660D',
  scope: 'selected-project-atlas',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  claims: {
    projectAtlasSourceImplemented: failed.length === 0,
    selectedProjectOnly: true,
    usesSameEonbotStateContract: true,
    browserCertified: false,
    productionCertified: false,
    focusedAdaptersImplemented: false,
    eonCityNexusImplemented: false
  }
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
