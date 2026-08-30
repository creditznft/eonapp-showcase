import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('Signal Frontier completed interactions always advertise the next physical action', () => {
  assert.match(runtime, /EONBOT scan complete\. Next: recover the loose signal core → approach it and press E \/ tap Use\./);
  assert.match(runtime, /Signal core recovered\. Next: return to dormant EONBOT and press E \/ tap Use to restore the companion link\./);
  assert.match(runtime, /Companion link restored\.[\s\S]*Next: follow the active Signal marker and press E \/ tap Use\./);
  assert.match(runtime, /Signal Frontier map activated\. Next: review the panorama, then follow the active marker and press E \/ tap Use\./);
});

test('My Frontier build milestones always advertise a truthful next useful action', () => {
  assert.match(runtime, /planned for[\s\S]*Next: open Review required work/);
  assert.match(runtime, /foundation constructed\.[\s\S]*Next: use its building terminal, review Upgrade district when eligible, or walk to another plot/);
  assert.match(runtime, /upgraded to operational level\.[\s\S]*Next: use its building terminal, invite an eligible resident, or walk to another plot/);
});

test('Storm Sector objective and completion feedback never dead-ends', () => {
  assert.match(runtime, /Next: \$\{result\.view\.nextObjective\?\.label \|\| 'follow the active Storm objective'\} · follow the marker and press E \/ tap Use\./);
  assert.match(runtime, /Storm Sector restored\. Next: explore, talk to a patrol, open EONBOT, or open Worlds to switch regions\./);
  assert.match(runtime, /Next: \$\{view\.nextObjective\.label\} · follow the marker and press E \/ tap Use\./);
});


test('completed story regions keep useful voluntary loops instead of dead-ending', () => {
  assert.match(runtime, /Signal Restoration complete\.[\s\S]*Next: open Worlds to build in My Frontier, explore Storm when available, keep exploring Signal, or open EONBOT to continue real work\./);
  assert.match(runtime, /Storm Sector restored\. Next: explore, talk to a patrol, open EONBOT, or open Worlds to switch regions\./);
});


test('My Frontier keeps the next build action persistently visible on its board', () => {
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(overlay, /const nextBuildAction = readiness\?\.action\?\.type === 'open-maintained-workspace'/);
  assert.match(overlay, /'Next: Review required work'/);
  assert.match(overlay, /'Next: Construct foundation'/);
  assert.match(overlay, /'Next: Upgrade district'/);
  assert.match(overlay, /'Next: use a building terminal or walk to another plot and Plan'/);
  assert.match(overlay, /'Next: walk to a plot → E \/ tap Use → choose a building → Plan'/);
  assert.match(overlay, /setText\(myFrontierObjective,nextBuildAction\)/);
});

test('Storm Sector keeps its current physical action persistently visible on the field panel', () => {
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(overlay, /const stormNextAction = stormSector\.complete \? 'Storm Sector restored · Next: explore, talk to a patrol, open EONBOT, or open Worlds'/);
  assert.match(overlay, /`Next: \$\{stormSector\.activeObjective\.label\} · follow the marker → E \/ tap Use`/);
  assert.match(overlay, /'Next: follow the active Storm marker → E \/ tap Use'/);
  assert.match(overlay, /setText\(stormSectorSummary, `\$\{stormNextAction\}/);
});

test('Signal HUD keeps the physical E/tap Use instruction visible for physical objectives', () => {
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(overlay, /const physicalUseHint = !\['my-frontier','storm-sector'\]\.includes/);
  assert.match(overlay, /campaignObjectiveAuthority\?\.physical === true \? ' · E \/ tap Use' : ''/);
  assert.match(overlay, /setText\(hudObjective, `\$\{objectiveLabel\}\$\{physicalUseHint\}`\)/);
});
