#!/usr/bin/env node
/** W555A source gate — app-wide cooperative browser workload governance. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const required = Object.freeze([
  'assets/js/runtime/eon-workload-governor.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'assets/js/chat/ai-runtime.js',
  'assets/js/utils/agent-executor.js',
  'assets/js/utils/video-lab.js',
  'assets/js/utils/music-lab.js',
  'assets/js/tool-page.js',
  'tests/unit/w555a-workload-governor.test.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const governor = exists(required[0]) ? read(required[0]) : '';
const babylon = exists(required[1]) ? read(required[1]) : '';
const station = exists(required[2]) ? read(required[2]) : '';
const aiRuntime = exists(required[3]) ? read(required[3]) : '';
const agentExecutor = exists(required[4]) ? read(required[4]) : '';
const videoLab = exists(required[5]) ? read(required[5]) : '';
const musicLab = exists(required[6]) ? read(required[6]) : '';
const toolPage = exists(required[7]) ? read(required[7]) : '';
const unit = exists(required[8]) ? read(required[8]) : '';

function need(text, expression, code) {
  if (!expression.test(text)) errors.push(code);
}
function forbid(text, expression, code) {
  if (expression.test(text)) errors.push(code);
}

need(governor, /eonapp\.workload-governor\.w555a\.v1/, 'governor-schema-missing');
need(governor, /CITY_RENDER: 'city-render'/, 'governor-city-workload-missing');
need(governor, /LOCAL_TEXT_AI: 'local-text-ai'/, 'governor-local-ai-workload-missing');
need(governor, /VIDEO_GENERATION: 'video-generation'/, 'governor-video-generation-workload-missing');
need(governor, /MEDIA_EXPORT: 'media-export'/, 'governor-media-export-workload-missing');
need(governor, /AUDIO_PLAYBACK: 'audio-playback'/, 'governor-audio-workload-missing');
need(governor, /AGENT_ACTION: 'agent-action'/, 'governor-agent-workload-missing');
need(governor, /remoteTelemetry: false/, 'governor-truth-must-forbid-telemetry');
need(governor, /readsPrompts: false/, 'governor-truth-must-forbid-prompt-reading');
need(governor, /startsModels: false/, 'governor-truth-must-forbid-model-starting');
need(governor, /deviceThermalMeasurement: false/, 'governor-truth-must-not-claim-thermal-sensor');
need(governor, /needs-user-choice/, 'governor-heavy-preemption-choice-missing');
need(governor, /city:pause/, 'governor-city-pause-advisory-missing');
need(governor, /background:defer/, 'governor-agent-defer-advisory-missing');
forbid(governor, /(?:localStorage|sessionStorage|indexedDB)\s*[.(]/i, 'governor-must-remain-session-memory-only');

need(babylon, /workloadGovernor\.recordFrame\(deltaMs\)/, 'city-render-loop-must-report-frame-pressure');
need(babylon, /applyWorkloadProtection/, 'city-runtime-must-expose-reversible-workload-protection');
need(station, /EON_WORKLOAD_KINDS\.CITY_RENDER/, 'city-station-must-declare-render-workload');
need(station, /cityWorkloadLeases/, 'city-station-must-release-render-workload');
need(station, /city:reduce-quality/, 'city-station-must-honour-quality-advice');
need(station, /city:pause/, 'city-station-must-honour-confirmed-pause-advice');
need(aiRuntime, /acquireAiWorkloadLease/, 'ai-runtime-must-declare-request-workloads');
need(aiRuntime, /eonbot-reply-complete/, 'ai-runtime-must-release-reply-workload');
need(aiRuntime, /eonbot-stream-complete/, 'ai-runtime-must-release-stream-workload');
need(agentExecutor, /EON_WORKLOAD_KINDS\.AGENT_ACTION/, 'agent-executor-must-declare-workload');
need(agentExecutor, /_runJobWithinWorkloadLease/, 'agent-executor-must-wrap-existing-job-runner');
need(agentExecutor, /state: 'queued'/, 'agent-executor-must-defer-instead-of-faking-completion');
need(videoLab, /EON_WORKLOAD_KINDS\.VIDEO_EDIT/, 'video-playback-must-declare-workload');
need(videoLab, /EON_WORKLOAD_KINDS\.MEDIA_EXPORT/, 'video-export-must-declare-workload');
need(videoLab, /confirmPreemptCity/, 'video-lab-must-require-explicit-heavy-preemption-confirmation');
need(musicLab, /EON_WORKLOAD_KINDS\.AUDIO_PLAYBACK/, 'music-playback-must-declare-workload');
need(musicLab, /EON_WORKLOAD_KINDS\.MEDIA_EXPORT/, 'music-export-must-declare-workload');
need(musicLab, /confirmPreemptCity/, 'music-export-must-require-explicit-heavy-preemption-confirmation');
need(toolPage, /confirmCityPreemption/, 'tool-ui-must-offer-visible-preemption-choice');
need(toolPage, /EON City is active\. Pause City and continue/, 'tool-ui-must-explain-preemption-choice');
need(unit, /W555A makes a small local text request coexist with City/, 'w555a-unit-coverage-missing');
need(unit, /W555A refuses to silently begin a heavy local media task over City/, 'w555a-unit-preemption-coverage-missing');
need(unit, /W555A keeps background agents deferred/, 'w555a-unit-pressure-coverage-missing');

const CHECK_COUNT = 40;
const report = Object.freeze({
  wave: 'W555A',
  ok: errors.length === 0,
  checks: CHECK_COUNT - errors.length,
  required: required.length,
  errors: Object.freeze(errors)
});
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w555a-universal-workload-governor-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
