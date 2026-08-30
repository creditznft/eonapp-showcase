import { deriveEonExpanseW767PDynamicEventPresentation } from './eon-expanse-w767p-dynamic-event-presentation.js';
import { buildEonExpanseR06WorldAtlas } from '../r06/eon-expanse-r06-flagship-experience.js';

const freeze = (value) => Object.freeze(value);
export const EON_EXPANSE_W766G_PRESENTATION_SCHEMA = 'eon.city.expanse.presentation.w766g.v1';
export const EON_EXPANSE_W766G_QUALITY_PROFILES = freeze({
  lite: freeze({ activeSectors: 5, skylineTowers: 10, particles: 24, npcCap: 4, shadowCasters: 2, weatherDensity: 0.25, textureScale: 0.65, transitTrailSegments: 8 }),
  balanced: freeze({ activeSectors: 9, skylineTowers: 18, particles: 72, npcCap: 8, shadowCasters: 5, weatherDensity: 0.65, textureScale: 1, transitTrailSegments: 16 }),
  cinematic: freeze({ activeSectors: 13, skylineTowers: 28, particles: 140, npcCap: 12, shadowCasters: 8, weatherDensity: 1, textureScale: 1, transitTrailSegments: 28 })
});

export const EON_EXPANSE_W766G_AUDIO_ZONES = freeze({
  'gateway-overlook': freeze({ ambience: 'frontier-wind', music: 'signal-frontier-arrival', intensity: 0.35 }),
  'beacon-fields': freeze({ ambience: 'beacon-hum', music: 'first-light', intensity: 0.5 }),
  'archive-ruins': freeze({ ambience: 'archive-whispers', music: 'echoes-in-the-archive', intensity: 0.42 }),
  'transit-scar': freeze({ ambience: 'broken-rail', music: 'the-broken-line', intensity: 0.58 }),
  'horizon-vault': freeze({ ambience: 'vault-resonance', music: 'horizon-reconnected', intensity: 0.7 })
});

export function resolveEonExpanseW766GQualityProfile(profile = 'balanced', { mobile = false, reducedMotion = false } = {}) {
  const id = mobile && profile === 'cinematic' ? 'balanced' : (EON_EXPANSE_W766G_QUALITY_PROFILES[profile] ? profile : 'balanced');
  const base = EON_EXPANSE_W766G_QUALITY_PROFILES[id];
  return freeze({ id, ...base, particles: reducedMotion ? 0 : base.particles, transitTrailSegments: reducedMotion ? 0 : base.transitTrailSegments, mobile, reducedMotion });
}

export function projectEonExpanseW766GRestoration({ milestones = [], currentZone = 'gateway-overlook', quality = 'balanced', mobile = false, reducedMotion = false } = {}) {
  const set = new Set((milestones || []).map(String));
  const profile = resolveEonExpanseW766GQualityProfile(quality, { mobile, reducedMotion });
  const beaconOne = set.has('beacon-one-repaired'); const beaconTwo = set.has('beacon-two-repaired'); const transit = set.has('regional-transit-restored'); const horizon = set.has('regional-core-synchronized'); const vault = set.has('campaign:signal-restoration:complete');
  return freeze({ schema: EON_EXPANSE_W766G_PRESENTATION_SCHEMA, profile, currentZone, audio: EON_EXPANSE_W766G_AUDIO_ZONES[currentZone] || EON_EXPANSE_W766G_AUDIO_ZONES['gateway-overlook'],
    zones: freeze({
      'gateway-overlook': freeze({ powered: true, fog: vault ? 0.12 : 0.3, population: vault ? 1 : 0.55 }),
      'beacon-fields': freeze({ powered: beaconOne, circuitIntensity: beaconOne ? 1 : 0.18, fog: beaconOne ? 0.22 : 0.55 }),
      'archive-ruins': freeze({ powered: beaconTwo, archiveGlow: beaconTwo ? 1 : 0.14, fog: beaconTwo ? 0.28 : 0.62 }),
      'transit-scar': freeze({ powered: transit, railIntensity: transit ? 1 : 0.08, movingTransitLights: transit && !reducedMotion }),
      'horizon-vault': freeze({ powered: horizon, vaultOpen: set.has('vault-route-opened') || vault, celebration: vault && !reducedMotion })
    }),
    global: freeze({ restorationPercent: Math.round(([beaconOne, beaconTwo, transit, horizon, vault].filter(Boolean).length / 5) * 100), musicPhase: vault ? 'post-campaign' : horizon ? 'finale' : transit ? 'restoring' : 'frontier', weatherEnabled: profile.weatherDensity > 0, returnRouteAlwaysAvailable: true })
  });
}

export function buildEonExpanseW766GMissionBoardView({ campaignBoard = null, contentSummary = null, map = null, guidance = null, openWorld = null } = {}) {
  const active = campaignBoard?.activeMission;
  const availableMissions = freeze((campaignBoard?.availableMissions || []).map((mission) => freeze({ id: mission.id, label: mission.label, xp: Number(mission.xp || 0) })));
  const activeFrontier = contentSummary?.activeFrontierContract || null;
  const retention = openWorld?.retentionMatrix || null;
  const dynamicEvent = deriveEonExpanseW767PDynamicEventPresentation(contentSummary?.activeEvent || null, { at: Date.now(), playerZoneId: map?.currentZone || '' });
  return freeze({
    schema: `${EON_EXPANSE_W766G_PRESENTATION_SCHEMA}.mission-board.v2`,
    title: 'SIGNAL FRONTIER MISSIONS',
    level: Number(campaignBoard?.currentLevel || 1),
    totalXp: Number(campaignBoard?.totalXp || 0),
    campaign: freeze({ completed: Number(campaignBoard?.completion?.completed || 0), total: Number(campaignBoard?.completion?.total || 7), complete: Boolean(campaignBoard?.completion?.campaignComplete) }),
    active: active ? freeze({ id: active.id, label: active.label, objective: active.currentObjective, guidance: active.guidance?.label || '', prompt: guidance?.prompt || '' }) : null,
    availableMissions,
    sideActivities: Number(contentSummary?.sideCompleted || 0),
    productiveActivities: Number(contentSummary?.productiveCompleted || 0),
    dynamicEvent,
    discoveries: freeze({ completed: Number(contentSummary?.discoveries || 0), total: Number(contentSummary?.discoveryTotal || 0), procedural: Number(contentSummary?.proceduralDiscoveryCount || 0) }),
    frontier: freeze({
      activeContract: activeFrontier ? freeze({
        id: activeFrontier.id,
        label: activeFrontier.label,
        objective: activeFrontier.objective,
        purpose: activeFrontier.purpose,
        family: activeFrontier.family || 'survey',
        rarity: activeFrontier.rarity,
        xp: Number(activeFrontier.xp || 0),
        steps: freeze((activeFrontier.steps || []).map((step) => freeze({ id: step.id, label: step.label, action: step.action }))),
        completedStepIds: freeze([...(activeFrontier.completedStepIds || [])]),
        nextStep: (activeFrontier.steps || [])[Number(activeFrontier.completedStepIds?.length || 0)] || null,
        progress: `${Number(activeFrontier.completedStepIds?.length || 0)}/${Number(activeFrontier.steps?.length || 0)}`
      }) : null,
      completedContracts: Number(contentSummary?.completedFrontierContractCount || 0),
      regionFamilies: Number(retention?.regionArchetypes || 0),
      buildingForms: Number(retention?.buildingForms || 0),
      mountedSectors: Number(openWorld?.mountedSectorCount || 0),
      hardWorldEdgeShown: false
    }),
    mapCompletion: Number(map?.completionPercent || 0),
    reward: campaignBoard?.reward || null,
    receiptConfirmed: Boolean(campaignBoard?.campaignReceipt),
    controls: freeze({ enterExpanse: !campaignBoard?.completion?.campaignComplete, startMission: availableMissions.length > 0, returnToObjective: Boolean(active), openMap: true, close: true })
  });
}

export function buildEonExpanseW766GMapPresentation(map = {}, openWorld = null) {
  const retention = openWorld?.retentionMatrix || null;
  return freeze({
    schema: `${EON_EXPANSE_W766G_PRESENTATION_SCHEMA}.map-presentation.v2`,
    title: 'SIGNAL FRONTIER',
    completionPercent: Number(map.completionPercent || 0),
    hardWorldEdgeShown: false,
    returnRouteVisible: true,
    atlas: buildEonExpanseR06WorldAtlas(map),
    zones: freeze((map.zones || []).map((zone) => freeze({ ...zone, marker: zone.current ? 'PLAYER' : zone.transitUnlocked ? 'TRANSIT' : zone.discovered ? 'DISCOVERED' : 'UNKNOWN', truthfulLabel: zone.discovered ? zone.label : 'Undiscovered Signal' }))),
    outskirts: freeze({
      label: 'Living Frontier',
      marker: openWorld ? 'STREAMING' : 'DEFERRED',
      mountedSectors: Number(openWorld?.mountedSectorCount || 0),
      regionFamilies: Number(retention?.regionArchetypes || 0),
      buildingForms: Number(retention?.buildingForms || 0),
      visibleHardBorder: false,
      truthfulLabel: openWorld ? 'Deterministic frontier sectors continue beyond Signal Frontier' : 'Frontier sectors load after confirmed Expanse entry'
    })
  });
}
