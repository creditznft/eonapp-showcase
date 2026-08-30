import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectEonCityDeviceProfile } from '../../assets/js/city/eon-city-access-station.js';
import { resolveEonCityQualityAuthority } from '../../assets/js/city/eon-city-quality-authority.js';

const profile = ({ search = '', memory = 8, cores = 16, renderer = 'NVIDIA GeForce RTX 4070' } = {}) => inspectEonCityDeviceProfile({
  navigatorRef: { deviceMemory: memory, hardwareConcurrency: cores, connection: { saveData: false, effectiveType: '4g' } },
  documentRef: { createElement: () => ({ getContext: (kind) => kind === 'webgl2' ? { RENDERER: 'renderer', getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 'renderer' }), getParameter: () => renderer } : null }) },
  matchMediaImpl: () => ({ matches: false }),
  locationRef: { search }
});

test('W765R1 preserves a supported explicit Cinematic preference through quality authority resolution', () => {
  const deviceProfile = profile({ search: '?cityQuality=cinematic' });
  const authority = resolveEonCityQualityAuthority({
    locationRef: { hostname: 'eonapp.ch', search: '?cityQuality=cinematic' },
    detectedQuality: deviceProfile.quality,
    deviceProfile
  });
  assert.equal(deviceProfile.quality, 'cinematic');
  assert.equal(deviceProfile.selection, 'query-preference');
  assert.equal(authority.effective, 'cinematic');
  assert.equal(authority.source, 'automatic');
  assert.equal(authority.rejectionReason, 'host-not-eligible');
});

test('W765R1 keeps certification overrides unavailable on production and records the exact reason', () => {
  const authority = resolveEonCityQualityAuthority({
    locationRef: { hostname: 'eonapp.ch', search: '?eon-city-certification=1&eon-city-quality=cinematic' },
    detectedQuality: 'lite', deviceProfile: profile({ memory: 4, cores: 4, renderer: 'SwiftShader' })
  });
  assert.equal(authority.overrideAccepted, false);
  assert.equal(authority.effective, 'lite');
  assert.equal(authority.rejectionReason, 'host-not-eligible');
});
