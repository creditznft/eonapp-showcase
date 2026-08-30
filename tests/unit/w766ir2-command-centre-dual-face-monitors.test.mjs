import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../../assets/js/city/w750/eon-city-w750-command-centre.js', import.meta.url), 'utf8');

test('W766IR2-C replaces every double-sided W750 text plane with two front-only faces', () => {
  assert.match(source, /id: 'front', positionZ: faceOffset, rotationY: 0/);
  assert.match(source, /id: 'rear', positionZ: -faceOffset, rotationY: Math\.PI/);
  assert.match(source, /w750-wall-screen-\$\{id\}-\$\{faceSpec\.id\}/);
  assert.match(source, /sideOrientation: 0/);
  assert.match(source, /material\.backFaceCulling = true/);
  assert.match(source, /material\.twoSidedLighting = false/);
  assert.doesNotMatch(source, /sideOrientation: 2/);
  assert.doesNotMatch(source, /material\.backFaceCulling = false/);
});

test('W766IR2-C gives front and rear faces independent textures and the same maintained interaction', () => {
  assert.match(source, /w750-command-wall-\$\{id\}-\$\{faceSpec\.id\}-texture/);
  assert.match(source, /w750-command-wall-\$\{id\}-\$\{faceSpec\.id\}-material/);
  assert.match(source, /independentTextures:/);
  assert.match(source, /independentMaterials:/);
  assert.match(source, /sameWorkspaceInteraction:/);
  assert.match(source, /commandWallId: face\.screen\?\.metadata\?\.commandWallId/);
  assert.match(source, /monitorFace: faceSpec\.id/);
});

test('W766IR2-C paints asymmetric rendered calibration on both independent faces', () => {
  assert.match(source, /const leftCalibration = '◀ LEFT'/);
  assert.match(source, /RIGHT ▶ · \$\{String\(face\?\.id/);
  assert.match(source, /asymmetricCalibration: true/);
  assert.match(source, /expectedNormal: 'anchor-forward'/);
  assert.match(source, /expectedNormal: 'anchor-rearward'/);
});
