import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildEonCityW709MasterRoomPlan,
  getEonCityW709MasterRoomTruth,
  getEonCityW709MasterStationReview,
  validateEonCityW709MasterRoomPlan
} from '../../assets/js/city/w709/eon-city-w709-command-centre-master-room.js';
import { getEonCityCommandRoomModel, renderEonCityCommandRoomMarkup, validateEonCityCommandRoomModel } from '../../assets/js/city/eon-city-command-room.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W709 builds one central command table and eight reviewed master stations', () => {
  const plan = buildEonCityW709MasterRoomPlan({ districtCount: 9 });
  assert.equal(plan.stations.length, 8);
  assert.equal(new Set(plan.stations.map((entry) => entry.id)).size, 8);
  assert.equal(plan.commandTable.id, 'master-command-table');
  assert.equal(validateEonCityW709MasterRoomPlan(plan).ok, true);
  assert.deepEqual(new Set(plan.stations.map((entry) => entry.id)), new Set(['living-nexus','projects','approvals','atlas','providers','eonbot-dock','city-monitor','vault']));
});

test('W709 master stations preserve local controls and second-click native routes', () => {
  const nexus = getEonCityW709MasterStationReview('living-nexus');
  const atlas = getEonCityW709MasterStationReview('atlas');
  assert.equal(nexus.ok, true);
  assert.equal(nexus.local, true);
  assert.equal(nexus.review.action, 'living-nexus-panel');
  assert.equal(atlas.ok, true);
  assert.equal(atlas.local, false);
  assert.equal(atlas.review.route, '/?nexus=atlas');
  assert.equal(atlas.review.confirmationRequired, true);
  assert.equal(atlas.review.transfersCityContent, false);
});

test('W709 existing Command Room carries and validates the master-room authority', () => {
  const model = getEonCityCommandRoomModel();
  assert.equal(model.masterRoom.schema, 'eon.city.command-centre-master-room.w709.v1');
  assert.equal(validateEonCityCommandRoomModel(model).ok, true);
  const markup = renderEonCityCommandRoomMarkup(model);
  assert.match(markup, /data-eon-command-room-master/);
  assert.equal((markup.match(/data-eon-command-room-master-station=/g) || []).length, 8);
  assert.match(markup, /Live 3D NEXUS/);
  assert.match(markup, /Project Atlas Wall/);
});

test('W709 station binding reviews first and supports the in-City Living Nexus control', () => {
  const source = read('assets/js/eon-city-play-station.js');
  assert.match(source, /getEonCityW709MasterStationReview/);
  assert.match(source, /data-eon-command-room-master-station/);
  assert.match(source, /renderMasterStationReview/);
  assert.match(source, /living-nexus-panel/);
  assert.match(source, /data-eon-play-open-living-nexus/);
  assert.match(source, /second visible action/);
});

test('W709 master-room presentation is responsive and visibly central', () => {
  const css = read('assets/css/eon-city-play.css');
  assert.match(css, /W709 — Command Centre master room/);
  assert.match(css, /\.eon-command-room-master-grid/);
  assert.match(css, /repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /max-width: 640px/);
  assert.match(css, /prefers-reduced-motion/);
});

test('W709 truth keeps one NEXUS, one EONBOT and no hidden work', () => {
  const truth = getEonCityW709MasterRoomTruth();
  assert.equal(truth.allInOneCommandCentre, true);
  assert.equal(truth.eightReviewedStations, true);
  assert.equal(truth.oneEonbotIdentity, true);
  assert.equal(truth.oneNexusState, true);
  assert.equal(truth.readsPrivateWork, false);
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.autoNavigate, false);
});
