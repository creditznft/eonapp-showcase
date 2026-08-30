/**
 * W731–W734 — one launch runtime for the compact EON City Command Hub.
 *
 * One Engine, one Scene, one render loop and one bounded playable space.
 * Productive work opens through the shared City Dock by default, with an explicit Focus Workspace mode.
 * Old district-belt, Living Nexus realm and Expanse layers are intentionally
 * absent from this import graph.
 */
import { Engine } from '@babylonjs/core/Engines/engine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Ray } from '@babylonjs/core/Culling/ray.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { createEonCityCameraOcclusionController } from '../eon-city-camera-occlusion.js';
import { buildEonCityL95RuntimePerformanceBudget } from '../l95/eon-city-l95-runtime-performance-budget.js';
import { deriveEonCityL95AdaptiveSceneDetail } from '../l95/eon-city-l95-adaptive-scene-detail.js';
import { createEonCityL95WorldPerformanceLedger } from '../l95/eon-city-l95-world-performance-ledger.js';
import { EON_CITY_W765R7_INTERACTION_MATRIX, validateEonCityW765R7InteractionMatrix } from '../w765/eon-city-w765r7-interaction-matrix.js';
import { createEonCityW766AReturnSnapshot, createEonCityW766AWorldModeController } from '../w766/eon-city-w766a-world-mode-controller.js';
import { createEonExpanseW766AInitialState, createEonExpanseW766AMapView, createEonExpanseW766APersistence, createEonExpanseW766AWorldSeed, sanitizeEonExpanseW766APlayerPosition, EON_EXPANSE_W766A_REGION_KITS } from '../w766/eon-expanse-w766a-foundation.js';
import { mountEonExpanseW766AGatewayOverlook } from '../w766/eon-expanse-w766a-gateway-overlook.js';
import { deriveEonExpanseW767ACompanionState, EON_EXPANSE_W767A_RESCUE_POSE } from '../w766/eon-expanse-w767a-companion-continuity.js';
import { createEonExpanseW766DTransitController } from '../w766/eon-expanse-w766d-npc-transit.js';
import { buildEonExpanseW766EMissionBoard, createEonExpanseW766EInitialLedger, createEonExpanseW766EMissionRuntime } from '../w766/eon-expanse-w766e-mission-runtime.js';
import { buildEonExpanseW766HGuidance, createEonExpanseW766HTransitJourney, validateEonExpanseW766HPrimaryRoutes } from '../w766/eon-expanse-w766h-playability-core.js';
import {
  arbitrateEonExpanseW767BLabels,
  createEonExpanseW767BGuideController,
  formatEonExpanseW767BInteractionLabel,
  getEonExpanseW767BInteractionTargetId,
  getEonExpanseW767BLabelIdentity
} from '../w766/eon-expanse-w767b-guidance-director.js';
import { serializeEonExpanseW767DAssetTruthReport } from '../w766/eon-expanse-w767d-asset-diagnostics.js';
import { createEonExpanseW767FOnboardingDirector } from '../w766/eon-expanse-w767f-onboarding-director.js';
import { createEonExpanseW767GCompanionBehaviorDirector, getEonExpanseW767GCompanionBehaviorLabel } from '../w766/eon-expanse-w767g-companion-behavior.js';
import { validateEonExpanseW767IInteractionDispatch } from '../w766/eon-expanse-w767i-touch-interaction.js';
import { createEonExpanseW767JAssetRecoveryController } from '../w766/eon-expanse-w767j-asset-recovery.js';
import { buildEonExpanseW767NAssetRepairFocus } from '../w766/eon-expanse-w767n-asset-repair-focus.js';
import { deriveEonExpanseW767PDynamicEventPresentation } from '../w766/eon-expanse-w767p-dynamic-event-presentation.js';
import { deriveEonExpanseW767RRestorationStatus } from '../w766/eon-expanse-w767r-restoration-status.js';
import { deriveEonExpanseW767SCaptureMoment, validateEonExpanseW767SCaptureRequest } from '../w766/eon-expanse-w767s-capture-moment.js';
import { deriveEonExpanseW767TLivingActivityBoard } from '../w766/eon-expanse-w767t-living-activity-board.js';
import { deriveEonExpanseW767UActivityAction, validateEonExpanseW767UActivityAction } from '../w766/eon-expanse-w767u-activity-action.js';
import { shouldClearEonExpanseW767VActivityGuidance } from '../w766/eon-expanse-w767v-guidance-lifecycle.js';
import { deriveEonExpanseW767WProductiveReceipt, validateEonExpanseW767WProductiveReceipt } from '../w766/eon-expanse-w767w-productive-receipt-bridge.js';
import { deriveEonExpanseW767XVerifiedResultAction, validateEonExpanseW767XVerifiedResultAction } from '../w766/eon-expanse-w767x-verified-result-action.js';
import { deriveEonExpanseW767YDailySignal, validateEonExpanseW767YDailySignalSelection } from '../w766/eon-expanse-w767y-daily-signal.js';
import { createEonExpanseW768BMyFrontierState } from '../w768/eon-expanse-w768b-my-frontier-state.js';
import { EON_EXPANSE_W768C_CONSTRUCTION_POLICIES, deriveEonExpanseW768CConstructionPermit, listEonExpanseW768CConstructionAvailability, validateEonExpanseW768CConstructionPermit } from '../w768/eon-expanse-w768c-my-frontier-construction-permit.js';
import { createEonExpanseW768DConstructionLedger } from '../w768/eon-expanse-w768d-my-frontier-construction-ledger.js';
import { deriveEonExpanseW768FMyFrontierPlanningView, validateEonExpanseW768FPlanningAction } from '../w768/eon-expanse-w768f-my-frontier-planning-view.js';
import { deriveEonExpanseW768GBuildingChoiceModel, validateEonExpanseW768GBuildingChoiceAction } from '../w768/eon-expanse-w768g-my-frontier-building-choice.js';
import { deriveEonExpanseW768HMyFrontierReadiness, validateEonExpanseW768HReadinessAction } from '../w768/eon-expanse-w768h-my-frontier-readiness.js';
import { mountEonExpanseW768IMyFrontierRenderer } from '../w768/eon-expanse-w768i-my-frontier-renderer.js';
import { deriveEonExpanseW768KPlotInspection, validateEonExpanseW768KPlotInspection } from '../w768/eon-expanse-w768k-my-frontier-plot-inspection.js';
import { deriveEonExpanseW768OConstructionAction } from '../w768/eon-expanse-w768o-my-frontier-construction-action.js';
import { deriveEonExpanseW768PMyFrontierNavigation, validateEonExpanseW768PNavigationAction } from '../w768/eon-expanse-w768p-my-frontier-navigation.js';
import { deriveEonExpanseW768QConstructionSite, validateEonExpanseW768QConstructionSite } from '../w768/eon-expanse-w768q-my-frontier-construction-site.js';
import { deriveEonExpanseW768RBuildingTerminal, validateEonExpanseW768RBuildingTerminal } from '../w768/eon-expanse-w768r-my-frontier-building-terminal.js';
import { deriveEonExpanseW768UResidentInspection, validateEonExpanseW768UResidentInspection } from '../w768/eon-expanse-w768u-my-frontier-resident-inspection.js';
import { deriveEonExpanseW768VResidentReceipt, validateEonExpanseW768VResidentReceipt } from '../w768/eon-expanse-w768v-my-frontier-resident-authority.js';
import { deriveEonExpanseW768WResidentInvitationView, validateEonExpanseW768WResidentInvitationAction } from '../w768/eon-expanse-w768w-my-frontier-resident-invitation.js';
import { deriveEonExpanseW769AResidentReleaseView, validateEonExpanseW769AResidentReleaseAction } from '../w769/eon-expanse-w769a-my-frontier-resident-release.js';
import { deriveEonExpanseW769BThemeChoice, validateEonExpanseW769BThemeAction } from '../w769/eon-expanse-w769b-my-frontier-theme.js';
import { deriveEonExpanseW770EBuildingPresentationView } from '../w770/eon-expanse-w770e-my-frontier-building-presentation-view.js';
import { createEonExpanseW770FCompositionRecoveryController } from '../w770/eon-expanse-w770f-my-frontier-composition-recovery.js';
import { createEonExpanseW772AZoneArrivalDirector } from '../w772/eon-expanse-w772a-zone-arrival-director.js';
import { deriveEonExpanseW772CCurrentObjectiveAuthority } from '../w772/eon-expanse-w772c-campaign-objective-authority.js';
import { createEonExpanseW772EObjectiveCompletionDirector } from '../w772/eon-expanse-w772e-objective-completion-director.js';
import { deriveEonExpanseW772GPersistentNextAction } from '../w772/eon-expanse-w772g-persistent-next-action.js';
import { deriveEonExpanseW773AZoneRestorationBoard } from '../w773/eon-expanse-w773a-zone-restoration-board.js';
import { createEonExpanseW773CMyFrontierCaptureDirector } from '../w773/eon-expanse-w773c-my-frontier-capture-director.js';
import { buildEonExpanseW775ACaptureHandoff, validateEonExpanseW775ACaptureHandoff } from '../w775/eon-expanse-w775a-capture-handoff-package.js';
import { deriveEonExpanseW776AZoneAudioState } from '../w776/eon-expanse-w776a-zone-audio-state.js';
import { createEonExpanseW777ARestorationAudioCueDirector } from '../w777/eon-expanse-w777a-restoration-audio-cue-director.js';
import { deriveEonExpanseW779APostCampaignProgression } from '../w779/eon-expanse-w779a-post-campaign-progression.js';
import { deriveEonExpanseW780BFutureRegionProgramme } from '../w780/eon-expanse-w780b-future-region-programme.js';
import { auditEonExpanseW781AOpenWorldArt } from '../w781/eon-expanse-w781a-open-world-art-audit.js';
import { deriveEonExpanseW781BFutureRegionReleaseGate } from '../w781/eon-expanse-w781b-future-region-release-gate.js';
import { deriveEonExpanseW782APerformanceReadiness } from '../w782/eon-expanse-w782a-performance-readiness.js';
import { deriveEonExpanseW783AProgrammeReviewAction, validateEonExpanseW783AProgrammeReviewAction, confirmEonExpanseW783AProgrammeReview } from '../w783/eon-expanse-w783a-future-region-programme-review.js';
import { deriveEonExpanseW785BRegionPackageReadiness } from '../w785/eon-expanse-w785b-region-package-readiness.js';
import { deriveEonExpanseW786AFutureRegionReleaseMatrix } from '../w786/eon-expanse-w786a-future-region-release-matrix.js';
import { createEonExpanseW787AReleaseEvidence, serializeEonExpanseW787AReleaseEvidence } from '../w787/eon-expanse-w787a-release-evidence-export.js';
import { deriveEonExpanseW788AReleaseReviewAction, validateEonExpanseW788AReleaseReviewAction, confirmEonExpanseW788AReleaseReview } from '../w788/eon-expanse-w788a-future-region-release-review.js';
import { sanitizeEonExpanseW789ARegionPackageCertification, validateEonExpanseW789ARegionPackageCertificationState } from '../w789/eon-expanse-w789a-region-package-certification-state.js';
import { sanitizeEonExpanseW790APerformanceEvidence, validateEonExpanseW790APerformanceEvidence } from '../w790/eon-expanse-w790a-performance-certification-evidence.js';
import { sanitizeEonExpanseW793AOwnerAuthorization, deriveEonExpanseW793AActivationAction, validateEonExpanseW793AActivationAction, confirmEonExpanseW793AActivation } from '../w793/eon-expanse-w793a-future-region-activation.js';
import { createEonExpanseW794AStormSectorJourney } from '../w794/eon-expanse-w794a-storm-sector-journey.js';
import { mountEonExpanseW792CStormSectorPresenter } from '../w792/eon-expanse-w792c-storm-sector-presenter.js';
import { createEonExpanseW795AStormMissionRuntime } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { mountEonExpanseW795BStormSectorInteractionPresenter } from '../w795/eon-expanse-w795b-storm-sector-interaction-presenter.js';
import { mountEonExpanseW796BStormNpcPresenter } from '../w796/eon-expanse-w796b-storm-sector-npc-presenter.js';
import { createEonExpanseW797AStormTransitController } from '../w797/eon-expanse-w797a-storm-sector-transit.js';
import { mountEonExpanseW797BStormTransitPresenter } from '../w797/eon-expanse-w797b-storm-sector-transit-presenter.js';
import { deriveEonExpanseW798AStormBoard } from '../w798/eon-expanse-w798a-storm-sector-board.js';
import { resolveEonExpanseW792BStormSectorZone } from '../w792/eon-expanse-w792b-storm-sector-layout.js';
import { mountEonExpanseW799BStormTransformationPresenter } from '../w799/eon-expanse-w799b-storm-sector-transformation-presenter.js';
import { createEonExpanseW800AStormCaptureDirector } from '../w800/eon-expanse-w800a-storm-sector-capture-director.js';
import { createEonCityRt91RuntimeIntegration } from '../rt91/eon-city-rt91-runtime-integration.js';
import { createEonCityRt91ProductiveReceiptAdapter } from '../rt91/eon-city-rt91-productive-receipt-adapter.js';
import { buildEonCityRt92GrandArtPlan, validateEonCityRt92GrandArtPlan } from '../rt92/eon-city-rt92-grand-art-bible.js';
import { createEonCityRt92SharedArtRuntime } from '../rt92/eon-city-rt92-shared-art-runtime.js';
import { buildEonCityRt92CommandHubGoldMasterPlan, validateEonCityRt92CommandHubGoldMasterPlan } from '../rt92/command-hub/eon-city-rt92-command-hub-gold-master.js';
import { mountEonCityRt92EnvironmentalLifeArt } from '../rt92/eon-city-rt92-environmental-life-art.js';
import { mountEonCityRt92CinematicVfxArt } from '../rt92/eon-city-rt92-cinematic-vfx-art.js';
import { deriveEonCityL95StormReviewActivation, projectEonCityL95OwnerReviewAvailability } from '../l95/eon-city-l95-owner-world-review.js';
import { deriveEonExpanseW769DDistrictUpgrade, validateEonExpanseW769DDistrictUpgradeAction } from '../w769/eon-expanse-w769d-my-frontier-district-upgrade.js';
import { createEonExpanseW769EUpgradeLedger } from '../w769/eon-expanse-w769e-my-frontier-upgrade-ledger.js';
import { deriveEonExpanseW769IUpgradeSite, validateEonExpanseW769IUpgradeSite } from '../w769/eon-expanse-w769i-my-frontier-upgrade-site.js';
import { createEonExpanseW767KLostPlayerAssistanceDirector } from '../w766/eon-expanse-w767k-lost-player-assistance.js';
import { validateEonExpanseW767LCompanionDockRequest } from '../w766/eon-expanse-w767l-companion-dock.js';
import { mountEonExpanseW766HObjectiveMarker } from '../w766/eon-expanse-w766h-objective-marker.js';
import { createEonExpanseW766FLivingContent } from '../w766/eon-expanse-w766f-living-content.js';
import { buildEonExpanseW766GMapPresentation, buildEonExpanseW766GMissionBoardView, projectEonExpanseW766GRestoration } from '../w766/eon-expanse-w766g-presentation-director.js';
import { createEonExpanseW766GAudioDirector } from '../w766/eon-expanse-w766g-audio-director.js';
import { mountEonExpanseW766GVisualDirector } from '../w766/eon-expanse-w766g-visual-director.js';
import { createEonExpanseW766HRuntimeHealth } from '../w766/eon-expanse-w766h-runtime-health.js';
import { mountEonExpanseW766HUiOverlay } from '../w766/eon-expanse-w766h-ui-overlay.js';
import { mountEonExpanseW766HTransitPresenter } from '../w766/eon-expanse-w766h-transit-presenter.js';
import { EON_EXPANSE_W766B_ZONES } from '../w766/eon-expanse-w766b-signal-frontier.js';
import {
  createEonCityW766IR2InputLockLeaseManager,
  getEonCityW766IR2OrphanedInputLockOwners
} from '../w766/eon-city-w766ir2-input-lock-leases.js';
import { deriveEonExpanseW766WorldProgress } from '../w766/eon-expanse-w766-region-contract.js';
import '@babylonjs/core/Collisions/collisionCoordinator.js';
import { getEonCityProductiveRpgPlan } from '../eon-city-productive-rpg-loop.js';
import { createEonCityW731MovementRenderRecovery } from './eon-city-w731-movement-render-recovery.js';
import { resolveEonCityCameraRelativeMovement } from '../eon-city-camera-relative-movement.js';
import { applyEonCityRt96CameraInputPolicy, deriveEonCityRt96CameraInputPolicy } from '../eon-city-mobile-camera-policy.js';
import { getEonCityObjectIdentity } from '../eon-city-runtime-identity.js';
import { createEonCityW695LocomotionTruthController } from '../w695/eon-city-w695-character-motion-truth.js';
import { resolveEonCityW719KeyboardCode } from '../w719/eon-city-w719-input-authority.js';
import {
  EON_CITY_R02_VIEWPORT_SCHEMA,
  createEonCityR02ViewportDirector,
  recomposeEonCityR02CameraRadius
} from '../r02/eon-city-r02-viewport-director.js';
import {
  EON_CITY_R03_SURFACE_SCHEMA,
  EON_CITY_R03_SURFACE_STATE_EVENT,
  createEonCityR03SurfaceManager
} from '../r03/eon-city-r03-surface-manager.js';
import {
  resolveEonCityR04LabelBudget,
  resolveEonCityR04MeshInteraction
} from '../r04/eon-city-r04-interaction-resolver.js';
import { evaluateEonCityR11RuntimeGate, publishEonCityR11RuntimeGate } from '../r11/eon-city-r11-runtime-gate.js';
import { applyEonCityL95HudSafeZone, clearEonCityL95HudSafeZone } from '../l95/eon-city-l95-hud-safe-zone.js';
import { inspectEonCityAssetCache } from '../eon-city-asset-cache-policy.js';
import { observeEonCityL95AssetTransfer, describeEonCityL95AssetTransferObservation } from '../l95/eon-city-l95-asset-transfer-observation.js';
import {
  EON_CITY_R07_OPEN_WORLD_AVAILABILITY_SCHEMA,
  deriveEonCityR07OpenWorldAvailability
} from '../r07/eon-city-r07-open-world-availability.js';
import {
  EON_CITY_R08_LOCOMOTION_SCHEMA,
  deriveEonCityR08Locomotion,
  isEonCityR08SprintKeyboardCode
} from '../r08/eon-city-r08-locomotion.js';
import {
  deriveEonCityR08MyFrontierEntry,
  deriveEonCityR08MyFrontierStarterReceipt,
  deriveEonCityR08MyFrontierUnlockReceipt,
  verifyEonCityR08MyFrontierUnlockReceipt
} from '../r08/eon-city-r08-my-frontier-access.js';
import {
  EON_CITY_W747_ARRIVAL_CORRIDOR,
  EON_CITY_W747_CAMERA_POSES,
  EON_CITY_W747_FIVE_WING_ANCHORS,
  EON_CITY_W747_HERO_ZONE,
  EON_CITY_W747_OPERATIONS_CRESCENT,
  EON_CITY_W747_SPATIAL_SCHEMA,
  createEonCityW747SpatialDiagnostics,
  inspectEonCityW747CameraFloorSafety,
  sanitizeEonCityW747WorldPoint,
  validateEonCityW747SpatialFoundation
} from '../w747/eon-city-w747-spatial-foundation.js';
import {
  createEonCityW748InteractionRegistry,
  getEonCityW748DefaultInteraction,
  getEonCityW748StationInteraction,
  validateEonCityW748InteractionRegistry
} from '../w748/eon-city-w748-interaction-registry.js';
import {
  createEonCityW748WorkspacePresenter,
  validateEonCityW748WorkspacePresenterContract
} from '../w748/eon-city-w748-workspace-presenter.js';
import { createEonNexusCityProjectionAdapter, readEonNexusCityContinuityProjection } from '../../contracts/nexus/eon-nexus-city-projection.js';
import {
  EON_CITY_W749_LIVING_NEXUS_SCHEMA,
  EON_CITY_W749_RING_IDS,
  EON_CITY_W749_VIEW_EVENT,
  createEonCityW749LivingNexus,
  validateEonCityW749LivingNexusContract
} from '../w749/eon-city-w749-living-nexus.js';
import {
  createEonCityTruthfulCommandCenterController,
  validateEonCityTruthfulCommandCenterSnapshot
} from '../eon-city-truthful-command-center.js';
import {
  createEonCityGenuineAgentTheatreController,
  validateEonCityGenuineAgentTheatreSnapshot
} from '../eon-city-genuine-agent-theatre.js';
import {
  EON_CITY_W750_COMMAND_CENTRE_SCHEMA,
  EON_CITY_W750_WALL_IDS,
  createEonCityW750CommandCentre,
  validateEonCityW750CommandCentreContract
} from '../w750/eon-city-w750-command-centre.js';
import {
  EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
  createEonCityW751ProductiveStations,
  validateEonCityW751ProductiveStations
} from '../w751/eon-city-w751-productive-stations.js';
import {
  EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
  projectEonCityW765R5StationMonitor
} from '../w765/eon-city-w765r5-station-monitor.js';
import {
  createEonCityW765R7WallDisplay,
  EON_CITY_W765R7_WALL_DISPLAY_SCHEMA,
  validateEonCityW765R7WallDisplayContract
} from '../w765/eon-city-w765r7-wall-display-gallery.js';
import {
  EON_CITY_W752_SCHEMA,
  createEonCityW752MissionsProgression,
  validateEonCityW752MissionsProgression
} from '../w752/eon-city-w752-missions-progression.js';
import {
  EON_CITY_W756_SCHEMA,
  buildEonCityW756ExperiencePlan,
  createEonCityW756SemanticNavigationController,
  validateEonCityW756ExperiencePlan
} from '../w756/eon-city-w756-onboarding-navigation-accessibility.js';
import {
  EON_CITY_W757_SCHEMA,
  buildEonCityW757ReliabilityPlan,
  createEonCityW757ReliabilityController,
  validateEonCityW757ReliabilityPlan
} from '../w757/eon-city-w757-performance-reliability.js';
import {
  EON_CITY_W755_SCHEMA,
  buildEonCityW755EnvironmentPlan,
  createEonCityW755EnvironmentController,
  resolveEonCityW755LocalTimeProfile,
  validateEonCityW755EnvironmentPlan
} from '../w755/eon-city-w755-environment-art-audio.js';
import {
  EON_CITY_W754_SCHEMA,
  EON_CITY_W754_CAPSULE_ID,
  EON_CITY_W754_CAPSULE_FORWARD_AXIS,
  buildEonCityW754CastPlan,
  buildEonCityW754NpcSchedulePlan,
  createEonCityW754NpcScheduleController,
  createEonCityW754TransitController,
  resolveEonCityW754EonbotSafeTarget,
  validateEonCityW754Contract
} from '../w754/eon-city-w754-cast-eonbot-npc-transit.js';
import {
  EON_CITY_W731_COMMAND_HUB_SCHEMA,
  EON_CITY_W731_RUNTIME_OWNER_SCHEMA,
  EON_CITY_W731_RESUME_KEY,
  EON_CITY_W731_STATIONS,
  EON_CITY_W737_DISCOVERIES,
  EON_CITY_W731_FUTURE_GATEWAYS,
  EON_CITY_W731_WORLD_BOUNDS,
  EON_CITY_W731_SPAWN,
  EON_CITY_W731_EONBOT_DOCK,
  EON_CITY_W743_ARRIVAL_CAMERA,
  clampEonCityW731Position,
  getEonCityW731Station,
  getEonCityW737Discovery,
  resolveEonCityW731NearestStation,
  resolveEonCityW737NearestDiscovery,
  inspectEonCityW743ArrivalCamera,
  validateEonCityW731CommandHubContract
} from './eon-city-w731-command-hub-contract.js';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  EON_CITY_W757_RUNTIME_PROVENANCE,
  validateEonCityW731LaunchAssetManifest
} from './eon-city-w731-launch-asset-manifest.js';
import {
  EON_CITY_W744_STATION_COMPLETION_SCHEMA,
  EON_CITY_W744_STATION_BLUEPRINTS,
  getEonCityW744StationBlueprint,
  validateEonCityW744StationCompletion
} from './eon-city-w744-station-completion-contract.js';
import {
  EON_CITY_W745_HERO_PRESENTATION_SCHEMA,
  createEonCityW745HeroPresentationDirector,
  getEonCityW745HeroPresentationTruth
} from './eon-city-w745-hero-companion-polish.js';
import {
  EON_CITY_W737_MISSIONS,
  buildEonCityW737MissionView,
  getEonCityW737MissionForStation,
  getEonCityW737MissionForDiscovery,
  writeEonCityW737MissionState,
  validateEonCityW737MissionContract
} from '../w737/eon-city-w737-missions.js';
import {
  EON_CITY_W765R6_CANOPY_SUPPORTS,
  EON_CITY_W765R6_ROUTE_VISUAL_POLICY,
  EON_CITY_W765R6_SPATIAL_REPAIR_SCHEMA,
  EON_CITY_W765R6_PLAYER_COLLISION_RADIUS,
  createEonCityW765R6NpcExclusionZones,
  createEonCityW765R6PlayerCollisionZones,
  resolveEonCityW765R6PlayerCollision,
  findEonCityW765R6NearestSafePosition,
  validateEonCityW765R6DiscoveryPolicy
} from '../w765/eon-city-w765r6-spatial-control-repair.js';
import {
  EON_CITY_W760_W765_SCHEMA,
  EON_CITY_W760_SCENE_PROFILE,
  EON_CITY_W761_CHARACTER_PROFILE,
  EON_CITY_W763_MENU_ORDER,
  createEonCityW762NexusReactionController,
  createEonCityW764RewardReactionController,
  auditEonCityW763InteractionCompleteness,
  validateEonCityW760W765Convergence
} from '../w760/eon-city-w760-w765-command-core-convergence.js';
import { validateEonCityC08CommandHubConvergence } from '../c08/eon-city-c08-command-hub-convergence.js';
import { validateEonCityC09SignalFrontierSummit } from '../c09/eon-city-c09-signal-frontier-summit.js';
import { validateEonCityC10FrontierRegionGovernance } from '../c10/eon-city-c10-frontier-region-governance.js';

// Preserve the maintained W759 runtime identity; W760-W765 capability is
// advertised by EON_CITY_W765_CONVERGENCE_SCHEMA rather than by forking the core runtime.
// Historical W757 source-gate checkpoint: EON_CITY_CORE_RUNTIME_SCHEMA = 'eon.city.command-centre-runtime.w757.v1'
export const EON_CITY_CORE_RUNTIME_SCHEMA = 'eon.city.command-centre-runtime.w759.v1';
export const EON_CITY_BOOT_TRACE_KEY = 'eon:city:boot-trace:w737:v1';
// R01: preserve the legacy nine-screen gallery implementation without mounting
// it in the default Hub. The purposeful Command Centre live monitors remain.
export const EON_CITY_R01_OUTER_WALL_GALLERY_ENABLED = false;
const freeze = (value) => Object.freeze(value);
const TAU = Math.PI * 2;
const STATIONARY_NPC_GESTURES = freeze(['talk', 'wave', 'interact']);
const EON_CITY_W760_CAMERA_POSES = freeze({
  arrival: freeze({ ...EON_CITY_W747_CAMERA_POSES.arrival, ...EON_CITY_W760_SCENE_PROFILE.camera.arrival, id: 'w760-arrival', target: freeze({ ...EON_CITY_W760_SCENE_PROFILE.camera.arrival.target }) }),
  return: freeze({ ...EON_CITY_W747_CAMERA_POSES.return, ...EON_CITY_W760_SCENE_PROFILE.camera.return, id: 'w760-return', target: freeze({ ...EON_CITY_W760_SCENE_PROFILE.camera.return.target }) }),
  nexusFocus: freeze({ ...EON_CITY_W747_CAMERA_POSES.nexusFocus, ...EON_CITY_W760_SCENE_PROFILE.camera.nexusFocus, id: 'w760-nexus-focus', target: freeze({ ...EON_CITY_W760_SCENE_PROFILE.camera.nexusFocus.target }) }),
  commandWall: freeze({
    id: 'w765r4-command-wall-focus', alpha: Math.PI / 2, beta: 1.08, radius: 11.4,
    target: freeze({ x: -13.5, y: 3.37, z: -12.6 }),
    lowerRadiusLimit: 8.5, upperRadiusLimit: 15.5, lowerBetaLimit: 0.72, upperBetaLimit: 1.34
  }),
  follow: EON_CITY_W747_CAMERA_POSES.follow
});

const PALETTES = freeze({
  graphite: freeze({ background: '#070a08', floor: '#111612', surface: '#1a211c', structure: '#313b33', accent: '#9bb29f', accent2: '#c8d5ca', warm: '#d5c6a8', text: '#f1f4f1' }),
  obsidian: freeze({ background: '#020303', floor: '#090a0b', surface: '#111315', structure: '#2c3034', accent: '#d9dde2', accent2: '#aab2bc', warm: '#e6e2d8', text: '#fbfcfd' }),
  ember: freeze({ background: '#0d0806', floor: '#17100c', surface: '#251813', structure: '#513528', accent: '#c77d48', accent2: '#e3b181', warm: '#ffd0a2', text: '#fff6ec' })
});

const KEY_TO_DIRECTION = freeze({
  KeyW: 'forward', ArrowUp: 'forward', KeyS: 'backward', ArrowDown: 'backward',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right'
});

const LEGACY_LANDMARK_TO_STATION = freeze({
  orientation: 'eonbot-nexus', 'orientation-hall': 'eonbot-nexus', command: 'command-console', 'command-centre': 'command-console',
  creator: 'create-forge', 'creator-atrium': 'create-forge', forge: 'create-forge', 'forge-basilica': 'create-forge',
  archive: 'project-atlas', 'archive-canopy': 'project-atlas', vault: 'library-vault', 'vault-station': 'library-vault',
  trade: 'plans-access', 'trade-dome': 'plans-access',
  agent: 'automation-theatre', 'agent-theatre': 'automation-theatre'
});

function now() {
  return globalThis.performance?.now?.() || Date.now();
}

function safeText(value = '') {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function isEonCityW759PresentationReady(loaded) {
  return loaded?.ok === true && loaded?.presentation?.ready === true;
}

function isEonCityW759NodeEnabled(node) {
  if (!node) return false;
  try { return node.isEnabled?.(true) !== false; } catch { return false; }
}

function summarizeEonCityW759LoadedPresentation(loaded) {
  const presentation = loaded?.presentation || null;
  return freeze({
    loaded: loaded?.ok === true,
    ready: isEonCityW759PresentationReady(loaded),
    alias: String(loaded?.entry?.alias || ''),
    role: String(loaded?.entry?.role || ''),
    variantName: String(loaded?.variantName || ''),
    targetHeight: Number(loaded?.entry?.targetHeight || 0),
    actualHeight: presentation?.actualHeight ?? null,
    heightRatio: presentation?.heightRatio ?? null,
    horizontalOffset: presentation?.horizontalOffset ?? null,
    groundOffset: presentation?.groundOffset ?? null,
    worldRadius: presentation?.worldRadius ?? null,
    renderableMeshes: Number(presentation?.renderableMeshes || 0),
    enabledMeshes: Number(presentation?.enabledMeshes || 0),
    visibleMeshes: Number(presentation?.visibleMeshes || 0),
    reasons: presentation?.reasons || freeze([]),
    bounds: loaded?.bounds || null
  });
}

function trace(host, startedAt, stage, detail = '') {
  const record = freeze({ stage, detail: String(detail || '').slice(0, 120), elapsedMs: Math.max(0, Math.round(now() - startedAt)), at: new Date().toISOString() });
  const root = host?.closest?.('[data-eon-city-play-root]') || host?.parentElement;
  if (root?.dataset) {
    root.dataset.eonCityBootStage = stage;
    root.dataset.eonCityBootElapsedMs = String(record.elapsedMs);
  }
  try {
    const prior = JSON.parse(globalThis.sessionStorage?.getItem(EON_CITY_BOOT_TRACE_KEY) || '[]');
    globalThis.sessionStorage?.setItem(EON_CITY_BOOT_TRACE_KEY, JSON.stringify([...(Array.isArray(prior) ? prior : []), record].slice(-32)));
  } catch {}
  try { console.info(`[CITY_W737_${stage}]`, record); } catch {}
  return record;
}

function themePalette(documentRef = globalThis.document) {
  const id = String(documentRef?.documentElement?.dataset?.theme || 'graphite').toLowerCase();
  return PALETTES[id] || PALETTES.graphite;
}

function color(value, fallback = '#ffffff') {
  try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); }
}

function makeMaterial(scene, name, { diffuse, emissive = diffuse, emissiveIntensity = 0.12, alpha = 1, specular = '#080808' } = {}) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color(diffuse, '#111111');
  material.emissiveColor = color(emissive, diffuse || '#111111').scale(Math.max(0, Number(emissiveIntensity || 0)));
  material.specularColor = color(specular, '#080808');
  material.alpha = Math.max(0.04, Math.min(1, Number(alpha || 1)));
  material.backFaceCulling = material.alpha > 0.96;
  return material;
}

function makePbrMaterial(scene, name, { base = '#111111', emissive = '#000000', emissiveIntensity = 0, metallic = 0.45, roughness = 0.48, alpha = 1 } = {}) {
  const material = new PBRMaterial(name, scene);
  material.albedoColor = color(base, '#111111');
  material.emissiveColor = color(emissive, '#000000').scale(Math.max(0, Number(emissiveIntensity || 0)));
  material.metallic = Math.max(0, Math.min(1, Number(metallic || 0)));
  material.roughness = Math.max(0.04, Math.min(1, Number(roughness || 0.48)));
  material.alpha = Math.max(0.04, Math.min(1, Number(alpha || 1)));
  material.backFaceCulling = material.alpha > 0.96;
  return material;
}

function applyW755EnvironmentPlan({ scene, hemisphere, direction, world, plan }) {
  if (!scene || !plan) return freeze({ ok: false, reason: 'environment-unavailable' });
  scene.clearColor = new Color4(...color(plan.lighting.clearColor).asArray(), 1);
  scene.ambientColor = color(plan.lighting.ambientColor);
  scene.fogColor = color(plan.lighting.fogColor);
  scene.fogDensity = Number(plan.lighting.fogDensity || 0.0052);
  if (scene.imageProcessingConfiguration) {
    scene.imageProcessingConfiguration.exposure = Number(plan.lighting.exposure || 1);
    scene.imageProcessingConfiguration.contrast = Number(plan.lighting.contrast || 1.08);
  }
  if (hemisphere) {
    hemisphere.diffuse = color(plan.lighting.hemisphereColor);
    hemisphere.groundColor = color(plan.lighting.groundColor);
    hemisphere.intensity = plan.quality === 'lite' ? 0.78 : 0.92;
  }
  if (direction) {
    direction.diffuse = color(plan.lighting.keyColor);
    direction.intensity = Number(plan.lighting.keyIntensity || 0.62);
  }
  const weather = world?.environment?.weather;
  if (weather?.rainRoot) weather.rainRoot.setEnabled?.(plan.weather.particleCount > 0);
  if (weather?.mistRoot) weather.mistRoot.setEnabled?.(plan.weatherProfile === 'mist');
  if (Array.isArray(weather?.puddles)) {
    weather.puddles.forEach((mesh, index) => mesh?.setEnabled?.(index < Number(plan.weather.puddleCueCount || 0)));
  }
  return freeze({ ok: true, schema: EON_CITY_W755_SCHEMA, timeProfile: plan.timeProfile, weatherProfile: plan.weatherProfile, visualAmbienceOnly: true, realWeather: false });
}

function stationMetadata(station, extra = {}) {
  const part = extra.interactionRole === 'npc' || extra.part === 'npc'
    ? 'npc'
    : extra.interactionRole === 'terminal' || String(extra.part || '').includes('terminal')
      ? 'terminal'
      : 'structure';
  const interaction = getEonCityW748StationInteraction(station.id, part);
  return freeze({
    kind: 'w748-command-hub-interaction', stationId: station.id, surface: station.surface, label: station.label,
    interactionId: interaction?.id || `station:${station.id}`, interactionPart: part,
    accessibilityLabel: interaction?.accessibilityLabel || `Open ${station.label}`,
    truthBoundary: interaction?.truthBoundary || '', primaryAction: interaction?.primaryAction || null,
    interactive: true, explicitUserActionRequired: true, automaticExecution: false, automaticNavigation: false,
    privateDataRead: false, checkoutAutomatic: false, ...extra
  });
}

function createPath(scene, parent, from, to, material, id) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.max(0.5, Math.hypot(dx, dz));
  const path = MeshBuilder.CreateBox(`w731-path-${id}`, { width: Math.min(1.15, EON_CITY_W765R6_ROUTE_VISUAL_POLICY.maximumTraceWidth * 9.5), height: 0.035, depth: length }, scene);
  path.parent = parent;
  path.position.set((from.x + to.x) / 2, 0.035, (from.z + to.z) / 2);
  path.rotation.y = Math.atan2(dx, dz);
  path.material = material;
  path.isPickable = false;
  path.metadata = freeze({ kind: 'w765r6-floor-route', id, localOnly: true, floorOnly: true, cameraCorridorSafe: true, maximumRaisedDecorationY: EON_CITY_W765R6_ROUTE_VISUAL_POLICY.maximumRaisedDecorationY });
  return path;
}

function createProceduralPerson(scene, parent, id, materials, { accent = false, style = 0 } = {}) {
  const root = new TransformNode(`w731-person-${id}`, scene);
  root.parent = parent;
  const proceduralStyles = [
    { ...EON_CITY_W761_CHARACTER_PROFILE.proceduralCitizenStyles[0], body: materials.cyan, limbs: materials.structure, skin: materials.skin },
    { ...EON_CITY_W761_CHARACTER_PROFILE.proceduralCitizenStyles[1], body: materials.violet, limbs: materials.secondaryBase, skin: materials.skinWarm },
    { ...EON_CITY_W761_CHARACTER_PROFILE.proceduralCitizenStyles[2], body: materials.amber, limbs: materials.structure, skin: materials.skinDeep },
    { ...EON_CITY_W761_CHARACTER_PROFILE.proceduralCitizenStyles[3], body: materials.magenta, limbs: materials.secondaryBase, skin: materials.skinLight }
  ];
  // W759R2 baseline checkpoint: head.material = materials.skin; W761 extends this to bounded finished skin variants.
  const selectedStyle = proceduralStyles[Math.abs(Number(style || 0)) % proceduralStyles.length];
  root.metadata = freeze({ kind: 'w761-finished-procedural-citizen', citizenId: id, styleId: selectedStyle.id, untextured: false, animated: true });
  const bodyMaterial = accent ? selectedStyle.body : materials.structure;
  const limbMaterial = accent ? selectedStyle.limbs : materials.secondaryBase;
  const body = MeshBuilder.CreateCapsule(`w731-person-${id}-body`, { height: 1.05, radius: 0.25, tessellation: 10, subdivisions: 2 }, scene);
  body.parent = root;
  body.position.y = 1;
  body.material = bodyMaterial;
  body.isPickable = false;
  const head = MeshBuilder.CreateSphere(`w731-person-${id}-head`, { diameter: 0.42, segments: 12 }, scene);
  head.parent = root;
  head.position.y = 1.68;
  head.material = selectedStyle.skin;
  head.isPickable = false;
  const chest = MeshBuilder.CreateBox(`w731-person-${id}-chest`, { width: 0.24, height: 0.05, depth: 0.06 }, scene);
  chest.parent = root;
  chest.position.set(0, 1.13, -0.24);
  chest.material = materials.signal;
  chest.isPickable = false;

  const makeLimb = (kind, side, x, y, height, radius) => {
    const pivot = new TransformNode(`w731-person-${id}-${side}-${kind}-pivot`, scene);
    pivot.parent = root;
    pivot.position.set(x, y, 0);
    const mesh = MeshBuilder.CreateCapsule(`w731-person-${id}-${side}-${kind}`, { height, radius, tessellation: 8, subdivisions: 1 }, scene);
    mesh.parent = pivot;
    mesh.position.y = -(height * 0.43);
    mesh.material = limbMaterial;
    mesh.isPickable = false;
    return freeze({ pivot, mesh });
  };
  const leftArm = makeLimb('arm', 'left', -0.32, 1.28, 0.65, 0.085);
  const rightArm = makeLimb('arm', 'right', 0.32, 1.28, 0.65, 0.085);
  const leftLeg = makeLimb('leg', 'left', -0.14, 0.58, 0.72, 0.105);
  const rightLeg = makeLimb('leg', 'right', 0.14, 0.58, 0.72, 0.105);
  leftArm.pivot.rotation.z = -0.08;
  rightArm.pivot.rotation.z = 0.08;
  return freeze({
    root,
    nodes: freeze([body, head, chest, leftArm.mesh, rightArm.mesh, leftLeg.mesh, rightLeg.mesh]),
    rig: freeze({ body, head, chest, leftArm: leftArm.pivot, rightArm: rightArm.pivot, leftLeg: leftLeg.pivot, rightLeg: rightLeg.pivot })
  });
}

function stationAccentMaterial(station, materials) {
  const map = {
    'living-nexus': materials.cyan,
    forge: materials.amber,
    atlas: materials.cyan,
    vault: materials.mint,
    signal: materials.magenta,
    console: materials.warm,
    theatre: materials.amber,
    lab: materials.cyan,
    portal: materials.violet,
    access: materials.warm
  };
  return map[station.visual] || materials.accent;
}

function discoveryMetadata(discovery, extra = {}) {
  const interaction = getEonCityW748DefaultInteraction(`discovery:${discovery.id}`);
  return freeze({
    kind: 'w748-city-discovery-interaction', discoveryId: discovery.id, label: discovery.label,
    interactionId: interaction?.id || `discovery:${discovery.id}`,
    accessibilityLabel: interaction?.accessibilityLabel || `Inspect ${discovery.label}`,
    truthBoundary: interaction?.truthBoundary || '', primaryAction: interaction?.primaryAction || null,
    missionId: discovery.missionId, interactive: true, explicitUserActionRequired: true,
    automaticNavigation: false, privateDataRead: false, ...extra
  });
}

function createStation(scene, parent, station, materials) {
  const blueprint = getEonCityW744StationBlueprint(station.id);
  if (!blueprint) throw new Error(`w744-station-blueprint-missing:${station.id}`);
  const root = new TransformNode(`w744-station-${station.id}`, scene);
  root.parent = parent;
  root.position.set(station.position.x, station.position.y, station.position.z);
  root.metadata = stationMetadata(station, { root: true, zone: station.zone, completionSchema: 'w744' });
  const visualRoot = new TransformNode(`w744-station-visual-${station.id}`, scene);
  visualRoot.parent = root;
  const detailRoot = new TransformNode(`w744-station-details-${station.id}`, scene);
  detailRoot.parent = root;
  const terminalAnchor = new TransformNode(`w744-terminal-anchor-${station.id}`, scene);
  terminalAnchor.parent = root;
  terminalAnchor.position.set(blueprint.terminalOffset.x, blueprint.terminalOffset.y, blueprint.terminalOffset.z);
  terminalAnchor.rotation.y = Math.atan2(-terminalAnchor.position.x, -terminalAnchor.position.z);
  terminalAnchor.metadata = stationMetadata(station, { part: 'terminal-anchor', interactionRole: 'terminal', blueprintAssetId: blueprint.terminalAssetId });
  const terminalVisualRoot = new TransformNode(`w744-terminal-fallback-${station.id}`, scene);
  terminalVisualRoot.parent = terminalAnchor;
  const fallbackVisualNodes = [];
  const terminalFallbackNodes = [];
  const stationDetailNodes = [];
  const animated = [];
  const accentMaterial = stationAccentMaterial(station, materials);
  const add = (mesh, { part = 'structure', material = accentMaterial, position = null, rotation = null, pickable = true } = {}) => {
    mesh.parent = visualRoot;
    if (position) mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.material = material;
    mesh.isPickable = pickable;
    mesh.checkCollisions = pickable && !['signal', 'halo', 'light'].includes(part);
    if (pickable) mesh.metadata = stationMetadata(station, { part, interactionRole: 'structure', blueprintAssetId: blueprint.structureAssetId });
    fallbackVisualNodes.push(mesh);
    return mesh;
  };
  const addDetail = (mesh, { part = 'architectural-light', material = accentMaterial, position = null, rotation = null, animatedKind = '' } = {}) => {
    mesh.parent = detailRoot;
    if (position) mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.material = material;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.metadata = freeze({ kind: 'w744-station-detail', stationId: station.id, part, portalMode: blueprint.portalMode, interactive: false });
    stationDetailNodes.push(mesh);
    if (animatedKind) animated.push({ node: mesh, kind: animatedKind, phase: station.priority * 0.41 });
    return mesh;
  };
  const addTerminal = (mesh, { part = 'terminal', material = materials.structure, position = null, rotation = null } = {}) => {
    mesh.parent = terminalVisualRoot;
    if (position) mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.material = material;
    mesh.isPickable = true;
    mesh.checkCollisions = false;
    mesh.metadata = stationMetadata(station, { part, interactionRole: 'terminal', blueprintAssetId: blueprint.terminalAssetId });
    terminalFallbackNodes.push(mesh);
    return mesh;
  };

  const base = add(MeshBuilder.CreateCylinder(`w744-${station.id}-base`, {
    diameter: station.ring === 'inner' ? 3.5 : 3.05, height: 0.24, tessellation: 36
  }, scene), { part: 'structure-base', material: station.ring === 'inner' ? materials.stationBase : materials.secondaryBase, position: { y: 0.12 } });
  const selectionRing = MeshBuilder.CreateTorus(`w748-${station.id}-selection-outline`, {
    diameter: Math.max(3.2, Number(station.footprintRadius || 1.8) * 2.12), thickness: 0.055, tessellation: 64
  }, scene);
  selectionRing.parent = root;
  selectionRing.position.y = 0.2;
  selectionRing.rotation.x = Math.PI / 2;
  selectionRing.material = materials.cyan;
  selectionRing.isPickable = false;
  selectionRing.checkCollisions = false;
  selectionRing.metadata = freeze({ kind: 'w748-contextual-selection-outline', interactionId: `station:${station.id}`, decorativeOnly: true, interactive: false });
  selectionRing.setEnabled(false);

  let focusNode = base;
  if (station.visual === 'living-nexus') {
    add(MeshBuilder.CreateCylinder(`w744-${station.id}-pedestal`, { diameterTop: 1.7, diameterBottom: 2.25, height: 0.7, tessellation: 36 }, scene), { part: 'nexus-pedestal', material: materials.structure, position: { y: 0.48 } });
    const core = add(MeshBuilder.CreatePolyhedron(`w744-${station.id}-core`, { type: 2, size: 0.72 }, scene), { part: 'nexus-core', position: { y: 1.72 } });
    const haloA = add(MeshBuilder.CreateTorus(`w744-${station.id}-halo-a`, { diameter: 1.72, thickness: 0.055, tessellation: 48 }, scene), { part: 'halo', material: materials.cyan, position: { y: 1.72 }, rotation: { x: Math.PI / 2.65 }, pickable: false });
    const haloB = add(MeshBuilder.CreateTorus(`w744-${station.id}-halo-b`, { diameter: 2.05, thickness: 0.035, tessellation: 48 }, scene), { part: 'halo', material: materials.warm, position: { y: 1.72 }, rotation: { z: Math.PI / 2.45 }, pickable: false });
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * TAU;
      addDetail(MeshBuilder.CreateBox(`w744-${station.id}-status-ribbon-${index}`, { width: 0.92, height: 0.48, depth: 0.055 }, scene), {
        part: 'nexus-status-ribbon', material: index === 1 ? materials.warm : materials.glass,
        position: { x: Math.sin(angle) * 1.52, y: 1.18 + (index % 2) * 0.24, z: Math.cos(angle) * 1.52 },
        rotation: { y: angle + Math.PI }, animatedKind: 'pulse'
      });
    }
    focusNode = core;
    animated.push({ node: core, kind: 'float', baseY: 1.72, phase: 0.2 }, { node: haloA, kind: 'ring-a' }, { node: haloB, kind: 'ring-b' });
  } else if (station.visual === 'forge') {
    const bench = add(MeshBuilder.CreateBox(`w744-${station.id}-bench`, { width: 1.65, height: 0.62, depth: 1.15 }, scene), { part: 'forge-structure', material: materials.structure, position: { y: 0.56 } });
    add(MeshBuilder.CreateBox(`w744-${station.id}-fin-left`, { width: 0.22, height: 1.7, depth: 0.5 }, scene), { part: 'forge-structure', position: { x: -0.72, y: 1.35 }, rotation: { z: -0.24 } });
    add(MeshBuilder.CreateBox(`w744-${station.id}-fin-right`, { width: 0.22, height: 1.7, depth: 0.5 }, scene), { part: 'forge-structure', position: { x: 0.72, y: 1.35 }, rotation: { z: 0.24 } });
    const signal = add(MeshBuilder.CreateCylinder(`w744-${station.id}-forge-signal`, { diameter: 0.42, height: 0.14, tessellation: 24 }, scene), { part: 'signal', material: materials.amber, position: { y: 1.05 }, pickable: false });
    focusNode = bench;
    animated.push({ node: signal, kind: 'pulse', phase: 0.5 });
  } else if (station.visual === 'atlas') {
    const table = add(MeshBuilder.CreateCylinder(`w744-${station.id}-table`, { diameter: 2.15, height: 0.72, tessellation: 40 }, scene), { part: 'atlas-structure', material: materials.structure, position: { y: 0.48 } });
    const map = add(MeshBuilder.CreateCylinder(`w744-${station.id}-map`, { diameter: 1.55, height: 0.055, tessellation: 40 }, scene), { part: 'signal', material: materials.cyan, position: { y: 1.15 }, pickable: false });
    const halo = add(MeshBuilder.CreateTorus(`w744-${station.id}-map-halo`, { diameter: 1.5, thickness: 0.04, tessellation: 44 }, scene), { part: 'halo', material: materials.warm, position: { y: 1.42 }, rotation: { x: Math.PI / 2 }, pickable: false });
    focusNode = table;
    animated.push({ node: map, kind: 'float', baseY: 1.15, phase: 1.1 }, { node: halo, kind: 'ring-a' });
  } else if (station.visual === 'vault') {
    add(MeshBuilder.CreateBox(`w744-${station.id}-pillar-left`, { width: 0.42, height: 2.2, depth: 0.62 }, scene), { part: 'vault-structure', material: materials.structure, position: { x: -0.82, y: 1.22 } });
    add(MeshBuilder.CreateBox(`w744-${station.id}-pillar-right`, { width: 0.42, height: 2.2, depth: 0.62 }, scene), { part: 'vault-structure', material: materials.structure, position: { x: 0.82, y: 1.22 } });
    const crown = add(MeshBuilder.CreateBox(`w744-${station.id}-crown`, { width: 2.05, height: 0.38, depth: 0.72 }, scene), { part: 'vault-structure', material: materials.mint, position: { y: 2.3 } });
    const key = add(MeshBuilder.CreatePolyhedron(`w744-${station.id}-key`, { type: 1, size: 0.42 }, scene), { part: 'signal', material: materials.mint, position: { y: 1.42 }, pickable: false });
    focusNode = crown;
    animated.push({ node: key, kind: 'float', baseY: 1.42, phase: 1.7 });
  } else if (station.visual === 'signal') {
    add(MeshBuilder.CreateBox(`w744-${station.id}-mast-left`, { width: 0.22, height: 2.0, depth: 0.28 }, scene), { part: 'share-structure', material: materials.structure, position: { x: -0.78, y: 1.15 } });
    add(MeshBuilder.CreateBox(`w744-${station.id}-mast-right`, { width: 0.22, height: 2.0, depth: 0.28 }, scene), { part: 'share-structure', material: materials.structure, position: { x: 0.78, y: 1.15 } });
    const frame = add(MeshBuilder.CreateBox(`w744-${station.id}-capture-frame`, { width: 1.35, height: 1.05, depth: 0.08 }, scene), { part: 'share-structure', material: materials.magenta, position: { y: 1.38 } });
    const beacon = add(MeshBuilder.CreateSphere(`w744-${station.id}-beacon`, { diameter: 0.28, segments: 16 }, scene), { part: 'signal', material: materials.warm, position: { y: 2.28 }, pickable: false });
    focusNode = frame;
    animated.push({ node: beacon, kind: 'pulse', phase: 2.2 });
  } else if (station.visual === 'theatre') {
    const stage = add(MeshBuilder.CreateCylinder(`w744-${station.id}-stage`, { diameter: 2.3, height: 0.58, tessellation: 40 }, scene), { part: 'automation-structure', material: materials.structure, position: { y: 0.42 } });
    const crown = add(MeshBuilder.CreateTorus(`w744-${station.id}-open-crown`, { diameter: 2.25, thickness: 0.085, tessellation: 48 }, scene), { part: 'halo', material: materials.amber, position: { y: 1.7 }, rotation: { x: Math.PI / 2 }, pickable: false });
    focusNode = stage;
    animated.push({ node: crown, kind: 'ring-a' });
  } else if (station.visual === 'portal') {
    const portal = add(MeshBuilder.CreateTorus(`w744-${station.id}-portal`, { diameter: 2.65, thickness: 0.16, tessellation: 52 }, scene), { part: 'portal-structure', material: materials.violet, position: { y: 1.55 }, rotation: { y: Math.PI / 2 } });
    add(MeshBuilder.CreateBox(`w744-${station.id}-threshold`, { width: 2.35, height: 0.14, depth: 0.75 }, scene), { part: 'portal-structure', material: materials.warm, position: { y: 0.18 } });
    focusNode = portal;
    animated.push({ node: portal, kind: 'ring-a' });
  } else {
    const pedestal = add(MeshBuilder.CreateBox(`w744-${station.id}-pedestal`, { width: station.visual === 'lab' ? 1.35 : 1.6, height: station.visual === 'lab' ? 1.65 : 1.05, depth: 1.05 }, scene), { part: `${station.visual}-structure`, material: materials.structure, position: { y: station.visual === 'lab' ? 0.95 : 0.68 } });
    const screenCount = station.visual === 'console' ? 3 : 1;
    for (let index = 0; index < screenCount; index += 1) {
      const screen = add(MeshBuilder.CreateBox(`w744-${station.id}-screen-${index}`, { width: screenCount > 1 ? 0.55 : 1.12, height: 0.64, depth: 0.07 }, scene), { part: `${station.visual}-structure`, material: accentMaterial, position: { x: (index - (screenCount - 1) / 2) * 0.62, y: station.visual === 'lab' ? 1.55 : 1.2, z: -0.56 } });
      animated.push({ node: screen, kind: 'pulse', phase: station.priority * 0.32 + index });
    }
    if (station.visual === 'lab') {
      const coil = add(MeshBuilder.CreateTorus(`w744-${station.id}-coil`, { diameter: 1.35, thickness: 0.06, tessellation: 40 }, scene), { part: 'halo', material: materials.cyan, position: { y: 1.95 }, rotation: { x: Math.PI / 2 }, pickable: false });
      animated.push({ node: coil, kind: 'ring-b' });
    }
    focusNode = pedestal;
  }

  // Every station keeps its visual identity after the authored structure loads:
  // a light frame, threshold/portal cue and local beacons remain active.
  if (blueprint.portalMode !== 'none') {
    if (blueprint.portalMode === 'real-portal') {
      addDetail(MeshBuilder.CreateTorus(`w744-${station.id}-detail-portal`, { diameter: 3.05, thickness: 0.055, tessellation: 52 }, scene), {
        part: 'portal-light', material: materials.violet, position: { y: 1.58 }, rotation: { y: Math.PI / 2 }, animatedKind: 'ring-a'
      });
    } else {
      addDetail(MeshBuilder.CreateBox(`w744-${station.id}-threshold-left`, { width: 0.07, height: 2.15, depth: 0.08 }, scene), { part: 'threshold-light', position: { x: -1.3, y: 1.18, z: -0.65 } });
      addDetail(MeshBuilder.CreateBox(`w744-${station.id}-threshold-right`, { width: 0.07, height: 2.15, depth: 0.08 }, scene), { part: 'threshold-light', position: { x: 1.3, y: 1.18, z: -0.65 } });
      addDetail(MeshBuilder.CreateBox(`w744-${station.id}-threshold-crown`, { width: 2.67, height: 0.07, depth: 0.08 }, scene), { part: 'threshold-light', position: { y: 2.25, z: -0.65 } });
    }
  }
  const beaconCount = Math.max(2, Number(blueprint.lighting.beacons || 2));
  for (let index = 0; index < beaconCount; index += 1) {
    const angle = (index / beaconCount) * TAU + station.priority * 0.17;
    const radius = station.ring === 'inner' ? 1.72 : 1.5;
    addDetail(MeshBuilder.CreateCylinder(`w744-${station.id}-beacon-post-${index}`, { diameter: 0.06, height: 0.72, tessellation: 10 }, scene), {
      part: 'beacon-post', material: materials.structure, position: { x: Math.sin(angle) * radius, y: 0.46, z: Math.cos(angle) * radius }
    });
    addDetail(MeshBuilder.CreateSphere(`w744-${station.id}-beacon-light-${index}`, { diameter: 0.13, segments: 8 }, scene), {
      part: 'beacon-light', material: accentMaterial, position: { x: Math.sin(angle) * radius, y: 0.84, z: Math.cos(angle) * radius }, animatedKind: 'pulse'
    });
  }

  // Dedicated usable terminal fallback. Authored terminal assets replace this
  // mesh set independently from the station building.
  addTerminal(MeshBuilder.CreateBox(`w744-${station.id}-terminal-body`, { width: 0.92, height: 0.86, depth: 0.72 }, scene), { position: { y: 0.48 } });
  addTerminal(MeshBuilder.CreateBox(`w744-${station.id}-terminal-screen`, { width: 0.78, height: 0.48, depth: 0.055 }, scene), { material: accentMaterial, position: { y: 1.08, z: -0.31 }, rotation: { x: -0.16 } });
  addTerminal(MeshBuilder.CreateBox(`w744-${station.id}-terminal-strip`, { width: 0.58, height: 0.055, depth: 0.08 }, scene), { part: 'terminal-control', material: materials.warm, position: { y: 0.83, z: -0.39 } });

  const npcAnchor = new TransformNode(`w744-npc-anchor-${station.id}`, scene);
  npcAnchor.parent = root;
  const home = new Vector3(station.ring === 'inner' ? 1.75 : 1.55, 0, station.ring === 'inner' ? 0.42 : 0.25);
  npcAnchor.position.copyFrom(home);
  npcAnchor.rotation.y = Math.atan2(-npcAnchor.position.x, -npcAnchor.position.z);
  npcAnchor.metadata = freeze({
    kind: 'w744-role-npc', stationId: station.id, ...station.npc, npcAlias: blueprint.npcAlias,
    zone: station.zone, motionPolicy: blueprint.npcRoute.enabled ? 'bounded-station-route' : 'nexus-companion',
    locomotionAllowed: blueprint.npcRoute.enabled, routeRadius: blueprint.npcRoute.radius,
    interactive: true, fakeWork: false, walkingInPlaceAllowed: false
  });
  const fallbackNpc = createProceduralPerson(scene, npcAnchor, station.npc.id, materials, { accent: station.ring === 'inner' });
  // Production rule: an NPC is an authored 3D character or it is not shown.
  // Procedural figures remain disabled as an internal recovery object only.
  fallbackNpc.root.setEnabled(false);
  const npcHitTarget = MeshBuilder.CreateCapsule(`w744-${station.id}-npc-interaction`, { height: 1.95, radius: 0.42, tessellation: 8, subdivisions: 1 }, scene);
  npcHitTarget.parent = npcAnchor;
  npcHitTarget.position.y = 0.95;
  npcHitTarget.material = materials.glass;
  npcHitTarget.visibility = 0.012;
  npcHitTarget.isPickable = true;
  npcHitTarget.checkCollisions = false;
  npcHitTarget.metadata = stationMetadata(station, { part: 'npc', interactionRole: 'npc', npcName: station.npc.name, npcAlias: blueprint.npcAlias });
  // Do not expose an invisible or procedural NPC interaction before the real
  // authored character has loaded. The terminal remains the station fallback.
  npcHitTarget.setEnabled(false);

  const toTerminal = new Vector3(blueprint.terminalOffset.x, 0, blueprint.terminalOffset.z).subtract(home);
  const distance = Math.max(0.001, toTerminal.length());
  const terminalPosition = home.add(toTerminal.scale(Math.min(blueprint.npcRoute.radius || 0, distance) / distance));
  const routeEnabled = blueprint.npcRoute.enabled && terminalPosition.subtract(home).length() > 0.2;
  const routeState = {
    enabled: routeEnabled,
    radius: blueprint.npcRoute.radius,
    speed: blueprint.npcRoute.speed,
    dwellMs: blueprint.npcRoute.dwellMs,
    terminalDwellMs: blueprint.npcRoute.terminalDwellMs,
    home: home.clone(), terminal: terminalPosition.clone(), phase: 'dwell-home', phaseUntil: 3_000 + station.priority * 430,
    lastAt: 0, moving: false, animationState: 'idle', suspendedUntil: 0, actualDistanceTravelled: 0
  };

  return {
    station, blueprint, root, visualRoot, detailRoot, terminalAnchor, terminalVisualRoot,
    base, selectionRing, focusNode, npcAnchor, fallbackNpc, npcHitTarget,
    fallbackVisualNodes: freeze(fallbackVisualNodes), terminalFallbackNodes: freeze(terminalFallbackNodes),
    stationDetailNodes: freeze(stationDetailNodes), animated: freeze(animated), npcRoute: routeState,
    activationPulseUntil: 0, loadedNpc: null, loadedWorld: null, loadedTerminal: null,
    npcGestureState: 'idle', npcGestureUntil: 0, nextNpcGestureAt: 3_500 + station.priority * 1_150
  };
}

function createDiscovery(scene, parent, discovery, materials) {
  const root = new TransformNode(`w737-discovery-${discovery.id}`, scene);
  root.parent = parent;
  root.position.set(discovery.position.x, discovery.position.y, discovery.position.z);
  root.metadata = discoveryMetadata(discovery, { root: true });
  const visualRoot = new TransformNode(`w737-discovery-visual-${discovery.id}`, scene);
  visualRoot.parent = root;
  const selectionRing = MeshBuilder.CreateTorus(`w748-${discovery.id}-selection-outline`, { diameter: 3.7, thickness: 0.05, tessellation: 56 }, scene);
  selectionRing.parent = root;
  selectionRing.position.y = 0.18;
  selectionRing.rotation.x = Math.PI / 2;
  selectionRing.material = materials.warm;
  selectionRing.isPickable = false;
  selectionRing.checkCollisions = false;
  selectionRing.metadata = freeze({ kind: 'w748-contextual-selection-outline', interactionId: `discovery:${discovery.id}`, decorativeOnly: true, interactive: false });
  selectionRing.setEnabled(false);
  const nodes = [];
  const add = (mesh, material, position = {}, rotation = {}) => {
    mesh.parent = visualRoot;
    mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
    mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.material = material;
    mesh.isPickable = true;
    mesh.checkCollisions = true;
    mesh.metadata = discoveryMetadata(discovery, { part: 'landmark' });
    nodes.push(mesh);
    return mesh;
  };
  add(MeshBuilder.CreateCylinder(`w737-${discovery.id}-base`, { diameter: 3.1, height: 0.22, tessellation: 36 }, scene), materials.secondaryBase, { y: 0.11 });
  let focusNode;
  if (discovery.id === 'expanse-gate') {
    focusNode = add(MeshBuilder.CreateTorus(`w737-${discovery.id}-gate`, { diameter: 3.5, thickness: 0.18, tessellation: 56 }, scene), materials.violet, { y: 1.85 }, { y: Math.PI / 2 });
    const threshold = add(MeshBuilder.CreatePlane(`w737-${discovery.id}-threshold`, { width: 2.62, height: 2.72, sideOrientation: 0 }, scene), materials.glass, { y: 1.55 });
    threshold.checkCollisions = false;
  } else {
    focusNode = add(MeshBuilder.CreateCylinder(`w737-${discovery.id}-beacon`, { diameterTop: 0.32, diameterBottom: 0.7, height: 2.55, tessellation: 28 }, scene), discovery.id === 'forge-overlook' ? materials.amber : materials.cyan, { y: 1.38 });
    const ring = add(MeshBuilder.CreateTorus(`w737-${discovery.id}-ring`, { diameter: 1.55, thickness: 0.055, tessellation: 40 }, scene), materials.warm, { y: 2.2 }, { x: Math.PI / 2 });
    ring.checkCollisions = false;
  }
  return { discovery, root, visualRoot, selectionRing, focusNode, fallbackVisualNodes: freeze(nodes), loadedWorld: null };
}

function createCommandCentreArchitecture(scene, parent, materials) {
  const root = new TransformNode('w744-command-centre-architecture', scene);
  root.parent = parent;
  const centralFloor = MeshBuilder.CreateCylinder('w744-command-centre-floor', { diameter: EON_CITY_W731_WORLD_BOUNDS.commandCentreRadius * 2, height: 0.18, tessellation: 72 }, scene);
  centralFloor.parent = root; centralFloor.position.y = 0.01; centralFloor.material = materials.stationBase; centralFloor.isPickable = false;
  centralFloor.metadata = freeze({ kind: 'w744-command-centre-floor', designed: true, interactive: false });

  // Microchip/circuit floor language: concentric buses, radial traces and chip
  // nodes visually bind every station to the Living Nexus without adding a
  // second runtime or decorative fake work.
  const circuitRoot = new TransformNode('w744-command-centre-circuit-floor', scene);
  circuitRoot.parent = root;
  const circuitNodes = [];
  const circuitPulses = [];
  const addCircuit = (mesh, material = materials.cyan) => {
    mesh.parent = circuitRoot;
    mesh.material = material;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.metadata = freeze({ kind: 'w744-command-centre-circuit-floor', interactive: false, decorativeOnly: true });
    circuitNodes.push(mesh);
    return mesh;
  };
  for (const diameter of [5.7, 12.6, 20.8]) {
    const ring = addCircuit(MeshBuilder.CreateTorus(`w744-circuit-ring-${diameter}`, { diameter, thickness: diameter < 8 ? 0.055 : 0.035, tessellation: 72 }, scene), diameter < 8 ? materials.warm : materials.cyan);
    ring.position.y = 0.125;
    ring.rotation.x = Math.PI / 2;
  }
  for (const station of EON_CITY_W731_STATIONS.filter((entry) => entry.id !== 'eonbot-nexus')) {
    const dx = station.position.x;
    const dz = station.position.z + 1.3;
    const length = Math.max(1, Math.hypot(dx, dz) - 1.5);
    const trace = addCircuit(MeshBuilder.CreateBox(`w744-circuit-trace-${station.id}`, { width: (station.ring === 'inner' ? 0.1 : 0.065) * EON_CITY_W760_SCENE_PROFILE.floor.traceWidthMultiplier, height: 0.025, depth: length }, scene), stationAccentMaterial(station, materials));
    const scale = length / Math.max(0.001, Math.hypot(dx, dz));
    trace.position.set(dx * scale * 0.5, 0.135, 1.3 + dz * scale * 0.5);
    trace.rotation.y = Math.atan2(dx, dz);
    for (const fraction of [0.34, 0.7]) {
      const pad = addCircuit(MeshBuilder.CreateBox(`w744-circuit-node-${station.id}-${fraction}`, { width: 0.28, height: 0.035, depth: 0.28 }, scene), fraction < 0.5 ? materials.warm : stationAccentMaterial(station, materials));
      pad.position.set(dx * scale * fraction, 0.145, 1.3 + dz * scale * fraction);
      pad.rotation.y = trace.rotation.y;
    }
    const pulse = MeshBuilder.CreateSphere(`w745-circuit-data-pulse-${station.id}`, { diameter: station.ring === 'inner' ? 0.14 : 0.11, segments: 8 }, scene);
    pulse.parent = circuitRoot;
    pulse.material = stationAccentMaterial(station, materials);
    pulse.isPickable = false;
    pulse.checkCollisions = false;
    pulse.metadata = freeze({ kind: 'w745-command-centre-data-pulse', stationId: station.id, decorativeOnly: true, interactive: false });
    circuitPulses.push(freeze({
      node: pulse,
      from: freeze({ x: 0, y: 0.19, z: 1.3 }),
      to: freeze({ x: dx * scale, y: 0.19, z: 1.3 + dz * scale }),
      phase: station.priority * 0.113,
      speed: (station.ring === 'inner' ? 0.16 : 0.11) * EON_CITY_W760_SCENE_PROFILE.floor.pulseSpeedMultiplier
    }));
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * TAU;
    const chip = addCircuit(MeshBuilder.CreateBox(`w744-nexus-chip-pad-${index}`, { width: index % 3 === 0 ? 0.48 : 0.28, height: 0.035, depth: 0.18 }, scene), index % 3 === 0 ? materials.warm : materials.signal);
    chip.position.set(Math.sin(angle) * 3.42, 0.15, 1.2 + Math.cos(angle) * 3.42);
    chip.rotation.y = angle;
  }

  const canopy = MeshBuilder.CreateTorus('w744-command-centre-canopy', { diameter: EON_CITY_W747_OPERATIONS_CRESCENT.canopy.radius * 2, thickness: 0.22, tessellation: 72 }, scene);
  canopy.parent = root; canopy.position.y = EON_CITY_W747_OPERATIONS_CRESCENT.canopy.height; canopy.rotation.x = Math.PI / 2; canopy.material = materials.structure; canopy.isPickable = false;
  for (const [index, support] of EON_CITY_W765R6_CANOPY_SUPPORTS.entries()) {
    const column = MeshBuilder.CreateBox(`w765r6-command-column-${support.id}`, { width: support.width, height: support.height, depth: support.depth }, scene);
    column.parent = root;
    column.position.set(Math.sin(support.angle) * support.radius, support.height / 2, Math.cos(support.angle) * support.radius);
    column.rotation.y = support.angle;
    column.material = index % 2 ? materials.structure : materials.secondaryBase;
    column.isPickable = false;
    column.checkCollisions = true;
    column.metadata = freeze({ kind: 'w765r6-essential-canopy-support', supportId: support.id, cameraCorridorSafe: true, decorativeOnly: false, interactive: false });
  }
  const commandTable = MeshBuilder.CreateCylinder('w744-master-command-table', { diameter: 3.2, height: 0.68, tessellation: 48 }, scene);
  const commandTableMetadata = stationMetadata(getEonCityW731Station('command-console'), {
    part: 'command-wall:work', interactionRole: 'structure', commandWallId: 'work', authored: false,
    accessibilityLabel: 'Open the live Work command monitor'
  });
  commandTable.parent = root; commandTable.position.set(EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.position.x, EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.position.y, EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.position.z); commandTable.material = materials.structure; commandTable.isPickable = true; commandTable.metadata = commandTableMetadata;
  const tableGlass = MeshBuilder.CreateCylinder('w744-master-command-table-glass', { diameter: 2.72, height: 0.055, tessellation: 48 }, scene);
  tableGlass.parent = root; tableGlass.position.set(EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.position.x, EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.position.y + 0.38, EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.position.z); tableGlass.material = materials.glass; tableGlass.isPickable = true; tableGlass.metadata = commandTableMetadata;

  // Four bounded real lights provide readable faces and silhouettes while the
  // per-station emissive beacons carry identity without a costly light per prop.
  const commandLights = [];
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * TAU + Math.PI / 4;
    const light = new PointLight(`w744-command-light-${index}`, new Vector3(Math.sin(angle) * 6.8, 3.7, Math.cos(angle) * 6.8), scene);
    light.parent = root;
    light.diffuse = index % 2 ? color('#e7bd78') : color('#79dfd4');
    light.specular = color('#20231f');
    light.intensity = 0.34;
    light.range = 11.5;
    commandLights.push(light);
    const fixture = MeshBuilder.CreateSphere(`w744-command-light-fixture-${index}`, { diameter: 0.24, segments: 10 }, scene);
    fixture.parent = root; fixture.position.copyFrom(light.position); fixture.material = index % 2 ? materials.warm : materials.cyan; fixture.isPickable = false;
  }

  const environmentAnchors = new Map();
  const anchor = (id, x, y, z, rotationY = 0) => {
    const node = new TransformNode(`w744-environment-anchor-${id}`, scene);
    node.parent = root; node.position.set(x, y, z); node.rotation.y = rotationY; environmentAnchors.set(id, node); return node;
  };
  anchor('command-seat', EON_CITY_W747_OPERATIONS_CRESCENT.commandSeat.position.x, EON_CITY_W747_OPERATIONS_CRESCENT.commandSeat.position.y, EON_CITY_W747_OPERATIONS_CRESCENT.commandSeat.position.z, EON_CITY_W747_OPERATIONS_CRESCENT.commandSeat.rotationY);
  anchor('district-hologram', EON_CITY_W747_OPERATIONS_CRESCENT.districtHologram.position.x, EON_CITY_W747_OPERATIONS_CRESCENT.districtHologram.position.y, EON_CITY_W747_OPERATIONS_CRESCENT.districtHologram.position.z, EON_CITY_W747_OPERATIONS_CRESCENT.districtHologram.rotationY);
  anchor('eonbot-dock', EON_CITY_W731_EONBOT_DOCK.x, EON_CITY_W731_EONBOT_DOCK.y, EON_CITY_W731_EONBOT_DOCK.z, EON_CITY_W747_OPERATIONS_CRESCENT.eonbotDock.rotationY);
  return { root, commandTable, tableGlass, canopy, columns: freeze([...root.getChildMeshes(false)].filter((mesh) => mesh.name.startsWith('w765r6-command-column-'))), environmentAnchors, circuitRoot, circuitNodeCount: circuitNodes.length, circuitPulses: freeze(circuitPulses), commandLights };
}

function createExteriorMap(scene, parent, materials) {
  const root = new TransformNode('w737-command-horizon-exterior-map', scene);
  root.parent = parent;
  const ring = MeshBuilder.CreateTorus('w737-exterior-discovery-ring', { diameter: 41.5, thickness: 0.72, tessellation: 96 }, scene);
  ring.parent = root; ring.position.y = 0.04; ring.rotation.x = Math.PI / 2; ring.material = materials.lane; ring.isPickable = false;
  const streetLampAnchors = [];
  const proceduralLampPosts = [];
  const lampGlows = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * TAU;
    const x = Math.sin(angle) * 20.5;
    const z = Math.cos(angle) * 20.5;
    const anchor = new TransformNode(`w744-authored-street-lamp-anchor-${index}`, scene);
    anchor.parent = root;
    anchor.position.set(x, 0, z);
    anchor.rotation.y = angle + Math.PI;
    anchor.metadata = freeze({ kind: 'w744-authored-street-lamp-anchor', index, ambientOnly: true, interactive: false });
    streetLampAnchors.push(anchor);
    const lamp = MeshBuilder.CreateCylinder(`w737-exterior-light-${index}`, { diameter: 0.16, height: 1.85, tessellation: 12 }, scene);
    lamp.parent = root; lamp.position.set(x, 0.95, z); lamp.material = materials.structure; lamp.isPickable = false;
    proceduralLampPosts.push(lamp);
    const glow = MeshBuilder.CreateSphere(`w737-exterior-light-glow-${index}`, { diameter: 0.22, segments: 10 }, scene);
    glow.parent = root; glow.position.set(x, 1.86, z); glow.material = index % 4 === 0 ? materials.warm : materials.cyan; glow.isPickable = false;
    lampGlows.push(glow);
  }
  return {
    root,
    streetLampAnchors: freeze(streetLampAnchors),
    proceduralLampPosts: freeze(proceduralLampPosts),
    lampGlows: freeze(lampGlows),
    authoredStreetLamp: null,
    authoredStreetLampClones: []
  };
}

function createExteriorAmbientCitizens(scene, parent) {
  const root = new TransformNode('w742-exterior-ambient-citizens', scene);
  root.parent = parent;
  // Every roaming citizen uses one of the authored, animated character GLBs.
  // When a quality budget or load failure prevents that asset from resolving,
  // the anchor remains empty: no stick-figure or capsule substitute is shown.
  const profiles = [
    { id: 'citizen-north', assetAlias: 'ambient-citizen-north', radius: 23.2, startAngle: 0.18, direction: 1, speed: 1.15, motion: 'walk' },
    { id: 'citizen-east', assetAlias: 'ambient-citizen-east', radius: 23.8, startAngle: 1.62, direction: -1, speed: 1.38, motion: 'walk' },
    { id: 'citizen-south', assetAlias: 'ambient-citizen-south', radius: 24.2, startAngle: 3.2, direction: 1, speed: 2.35, motion: 'run' },
    { id: 'citizen-west', assetAlias: 'ambient-citizen-west', radius: 23.5, startAngle: 4.72, direction: -1, speed: 1.05, motion: 'walk' }
  ];
  return freeze(profiles.map((profile, index) => {
    const anchor = new TransformNode(`w742-exterior-citizen-anchor-${profile.id}`, scene);
    anchor.parent = root;
    anchor.metadata = freeze({
      kind: 'w765r4-authored-exterior-citizen-anchor',
      citizenId: profile.id,
      assetAlias: profile.assetAlias,
      zone: 'exterior',
      motion: profile.motion,
      locomotionAllowed: true,
      authoredCharacterRequired: true,
      noProceduralFallback: true,
      ambientOnly: true,
      interactive: false,
      fakeWork: false
    });
    return { ...profile, anchor, loaded: null, phase: index * 1.7, animationState: '' };
  }));
}

function createW744AmbientActors(scene, parent, materials) {
  const root = new TransformNode('w744-authored-ambient-actors', scene);
  root.parent = parent;

  const transitAnchor = new TransformNode('w744-transit-capsule-anchor', scene);
  transitAnchor.parent = root;
  transitAnchor.position.set(-18, 2.55, -3.5);
  transitAnchor.metadata = freeze({ kind: 'w754-bounded-transit-capsule', capsuleId: EON_CITY_W754_CAPSULE_ID, forwardAxis: EON_CITY_W754_CAPSULE_FORWARD_AXIS, ambientOnly: false, passengerTravelAutomatic: false, interactive: true, explicitUserActionRequired: true, transitCapsule: true });
  const transitBody = MeshBuilder.CreateCapsule('w744-transit-capsule-fallback', { height: 2.8, radius: 0.56, tessellation: 16, subdivisions: 2 }, scene);
  transitBody.parent = transitAnchor; transitBody.rotation.z = Math.PI / 2; transitBody.material = materials.structure; transitBody.isPickable = true; transitBody.metadata = transitAnchor.metadata;
  const transitRing = MeshBuilder.CreateTorus('w744-transit-capsule-ring', { diameter: 1.65, thickness: 0.08, tessellation: 32 }, scene);
  transitRing.parent = transitAnchor; transitRing.rotation.y = Math.PI / 2; transitRing.material = materials.cyan; transitRing.isPickable = false; transitRing.metadata = freeze({ ...transitAnchor.metadata, interactive: false, decorativeOnly: true });
  const transitLight = MeshBuilder.CreateSphere('w744-transit-capsule-light', { diameter: 0.24, segments: 10 }, scene);
  transitLight.parent = transitAnchor; transitLight.position.x = 1.35; transitLight.material = materials.warm; transitLight.isPickable = false; transitLight.metadata = freeze({ ...transitAnchor.metadata, interactive: false, decorativeOnly: true });

  const maintenanceAnchor = new TransformNode('w744-maintenance-worker-anchor', scene);
  maintenanceAnchor.parent = root;
  maintenanceAnchor.position.set(-17.2, 0, 16.9);
  maintenanceAnchor.metadata = freeze({ kind: 'w744-maintenance-worker', ambientOnly: true, boundedRoute: true, walkingInPlaceAllowed: false, interactive: false });
  const maintenanceFallback = createProceduralPerson(scene, maintenanceAnchor, 'maintenance-worker', materials, { accent: true });
  maintenanceFallback.root.scaling.setAll(0.88);
  // Authored worker or no worker: never expose the procedural maintenance rig.
  maintenanceFallback.root.setEnabled(false);

  return {
    root,
    transit: {
      anchor: transitAnchor, fallbackNodes: freeze([transitBody, transitRing, transitLight]), loaded: null,
      radius: 19.2, startAngle: -1.74, speed: 0.105
    },
    maintenance: {
      anchor: maintenanceAnchor, fallbackPerson: maintenanceFallback, loaded: null,
      home: new Vector3(-17.2, 0, 16.9), terminal: new Vector3(-15.9, 0, 18.25),
      phase: 'walk-terminal', phaseUntil: 0, lastAt: 0, moving: true, animationState: 'walk', speed: 0.48
    }
  };
}

function createFutureGateway(scene, parent, gateway, materials) {
  const radius = EON_CITY_W731_WORLD_BOUNDS.playableRadius - 1.2;
  const x = Math.sin(gateway.angle) * radius;
  const z = Math.cos(gateway.angle) * radius;
  const root = new TransformNode(`w731-future-${gateway.id}`, scene);
  root.parent = parent;
  root.position.set(x, 0, z);
  root.rotation.y = gateway.angle;
  const left = MeshBuilder.CreateBox(`w731-future-${gateway.id}-left`, { width: 0.55, height: 3.3, depth: 0.8 }, scene);
  left.parent = root; left.position.set(-1.5, 1.65, 0); left.material = materials.structure; left.isPickable = false;
  const right = left.clone(`w731-future-${gateway.id}-right`); right.parent = root; right.position.x = 1.5;
  const crown = MeshBuilder.CreateBox(`w731-future-${gateway.id}-crown`, { width: 3.55, height: 0.5, depth: 0.85 }, scene);
  crown.parent = root; crown.position.y = 3.05; crown.material = materials.secondaryBase; crown.isPickable = false;
  const seal = MeshBuilder.CreateBox(`w731-future-${gateway.id}-seal`, { width: 2.55, height: 2.55, depth: 0.12 }, scene);
  seal.parent = root; seal.position.y = 1.38; seal.material = materials.glass; seal.isPickable = false;
  root.metadata = freeze({ kind: 'w731-closed-future-gateway', gatewayId: gateway.id, label: gateway.label, available: false, interactive: false, launchClaim: false });
  return root;
}

function createRt92CommandHubGoldMasterLayer(scene, parent, materials, plan) {
  const validation = validateEonCityRt92CommandHubGoldMasterPlan(plan);
  if (!validation.ok) throw new Error(`rt92-command-hub-gold-master-invalid:${validation.errors.join(',')}`);
  const root = new TransformNode('rt92-command-hub-art-root', scene);
  root.parent = parent;
  root.metadata = freeze({ kind: 'rt92-command-hub-gold-master', schema: plan.schema, proceduralGeometryOnly: true, firstFrameNewBinaryBytes: 0, interactive: false });

  const nexusRoot = new TransformNode('rt92-living-nexus-art-root', scene);
  nexusRoot.parent = root;
  nexusRoot.position.set(0, 0, 0);
  const nexusOrbitRings = [];
  for (let index = 0; index < plan.nexus.orbitCount; index += 1) {
    const ring = MeshBuilder.CreateTorus(`rt92-nexus-orbit-${index}`, { diameter: 2.75 + index * 0.62, thickness: 0.038 + index * 0.007, tessellation: 72 }, scene);
    ring.parent = nexusRoot;
    ring.position.y = 2.5 + index * 0.34;
    ring.rotation.x = index % 2 ? Math.PI / 2.8 : Math.PI / 2;
    ring.rotation.z = index * 0.72;
    ring.material = index === 1 ? materials.warm : materials.signal;
    ring.isPickable = false;
    ring.checkCollisions = false;
    ring.visibility = 0.72 - index * 0.08;
    ring.metadata = freeze({ kind: 'rt92-living-nexus-orbit', index, decorativeOnly: true, interactive: false });
    nexusOrbitRings.push(ring);
  }

  const nexusCradlePylons = [];
  for (let index = 0; index < plan.nexus.cradlePylonCount; index += 1) {
    const angle = (index / plan.nexus.cradlePylonCount) * TAU + Math.PI / 4;
    const pylon = MeshBuilder.CreateBox(`rt92-nexus-cradle-pylon-${index}`, { width: 0.16, height: plan.nexus.crownHeight, depth: 0.22 }, scene);
    pylon.parent = nexusRoot;
    pylon.position.set(Math.sin(angle) * 3.35, plan.nexus.crownHeight / 2, Math.cos(angle) * 3.35);
    pylon.rotation.y = angle;
    pylon.rotation.z = index % 2 ? 0.035 : -0.035;
    pylon.material = index % 2 ? materials.structure : materials.secondaryBase;
    pylon.isPickable = false;
    pylon.checkCollisions = false;
    pylon.metadata = freeze({ kind: 'rt92-nexus-cradle', cameraCorridorSafe: true, decorativeOnly: true, interactive: false });
    nexusCradlePylons.push(pylon);
    const cap = MeshBuilder.CreatePolyhedron(`rt92-nexus-cradle-cap-${index}`, { type: 1, size: 0.2 }, scene);
    cap.parent = pylon;
    cap.position.y = plan.nexus.crownHeight / 2 - 0.18;
    cap.material = index % 2 ? materials.warm : materials.cyan;
    cap.isPickable = false;
    cap.checkCollisions = false;
  }

  const nexusCrown = MeshBuilder.CreatePolyhedron('rt92-nexus-crown', { type: 2, size: 0.42 }, scene);
  nexusCrown.parent = nexusRoot;
  nexusCrown.position.y = plan.nexus.crownHeight + 0.25;
  nexusCrown.material = materials.warm;
  nexusCrown.isPickable = false;
  nexusCrown.checkCollisions = false;
  nexusCrown.metadata = freeze({ kind: 'rt92-nexus-crown', focalOnly: true, interactive: false });

  const microTraceNodes = [];
  for (let index = 0; index < plan.motherboard.microTraceCount; index += 1) {
    const lane = index % EON_CITY_W731_STATIONS.length;
    const station = EON_CITY_W731_STATIONS[lane];
    const fraction = 0.34 + ((index * 17) % 57) / 100;
    const x = station.position.x * fraction;
    const z = station.position.z * fraction;
    const length = 0.42 + (index % 4) * 0.13;
    const trace = MeshBuilder.CreateBox(`rt92-micro-trace-${index}`, { width: 0.028 + (index % 3) * 0.008, height: 0.018, depth: length }, scene);
    trace.parent = root;
    trace.position.set(x, 0.172, z);
    trace.rotation.y = Math.atan2(station.position.x, station.position.z) + (index % 2 ? 0.18 : -0.18);
    trace.material = index % 7 === 0 ? materials.warm : stationAccentMaterial(station, materials);
    trace.isPickable = false;
    trace.checkCollisions = false;
    trace.visibility = 0.54;
    trace.metadata = freeze({ kind: 'rt92-motherboard-micro-trace', stationId: station.id, decorativeOnly: true, interactive: false });
    microTraceNodes.push(trace);
  }

  const pulseNodes = [];
  for (let index = 0; index < plan.motherboard.pulseNodeCount; index += 1) {
    const node = MeshBuilder.CreateSphere(`rt92-motherboard-pulse-node-${index}`, { diameter: 0.075 + (index % 3) * 0.015, segments: 8 }, scene);
    node.parent = root;
    node.position.y = 0.21;
    node.material = index % 4 === 0 ? materials.warm : materials.signal;
    node.isPickable = false;
    node.checkCollisions = false;
    node.metadata = freeze({ kind: 'rt92-motherboard-ambient-pulse', phase: index / Math.max(1, plan.motherboard.pulseNodeCount), decorativeOnly: true, interactive: false });
    pulseNodes.push(freeze({ node, phase: index / Math.max(1, plan.motherboard.pulseNodeCount), radius: 4.2 + (index % 4) * 1.55, speed: 0.045 + (index % 3) * 0.012 }));
  }

  const guidePylons = [];
  for (let index = 0; index < plan.verticality.guidePylonCount; index += 1) {
    const angle = (index / plan.verticality.guidePylonCount) * TAU + 0.18;
    const radius = 20.4 + (index % 2) * 1.25;
    const height = 2.6 + (index % 3) * 0.34;
    const pylon = MeshBuilder.CreateBox(`rt92-guide-pylon-${index}`, { width: 0.18, height, depth: 0.22 }, scene);
    pylon.parent = root;
    pylon.position.set(Math.sin(angle) * radius, height / 2, Math.cos(angle) * radius);
    pylon.rotation.y = angle;
    pylon.material = materials.structure;
    pylon.isPickable = false;
    pylon.checkCollisions = false;
    pylon.metadata = freeze({ kind: 'rt92-command-guide-pylon', routeCueOnly: true, cameraCorridorSafe: true, interactive: false });
    const beacon = MeshBuilder.CreatePolyhedron(`rt92-guide-pylon-beacon-${index}`, { type: 1, size: 0.16 }, scene);
    beacon.parent = pylon;
    beacon.position.y = height / 2 + 0.14;
    beacon.material = index % 3 === 0 ? materials.warm : materials.cyan;
    beacon.isPickable = false;
    beacon.checkCollisions = false;
    guidePylons.push(pylon);
  }

  const overheadFins = [];
  for (let index = 0; index < plan.verticality.overheadFinCount; index += 1) {
    const angle = (index / plan.verticality.overheadFinCount) * TAU;
    const fin = MeshBuilder.CreateBox(`rt92-overhead-fin-${index}`, { width: 0.15, height: 0.52, depth: 2.2 }, scene);
    fin.parent = root;
    fin.position.set(Math.sin(angle) * 11.9, 5.05 + (index % 2) * 0.18, Math.cos(angle) * 11.9);
    fin.rotation.y = angle;
    fin.rotation.z = index % 2 ? 0.11 : -0.11;
    fin.material = index % 4 === 0 ? materials.warm : materials.secondaryBase;
    fin.isPickable = false;
    fin.checkCollisions = false;
    fin.metadata = freeze({ kind: 'rt92-overhead-architectural-fin', cameraCorridorSafe: true, decorativeOnly: true, interactive: false });
    overheadFins.push(fin);
  }

  const stationCrests = [];
  for (const [index, station] of EON_CITY_W731_STATIONS.entries()) {
    const crest = MeshBuilder.CreatePolyhedron(`rt92-station-crest-${station.id}`, { type: index % 2 ? 1 : 2, size: station.ring === 'inner' ? 0.22 : 0.18 }, scene);
    crest.parent = root;
    crest.position.set(station.position.x, station.ring === 'inner' ? 2.9 : 2.55, station.position.z);
    crest.material = stationAccentMaterial(station, materials);
    crest.isPickable = false;
    crest.checkCollisions = false;
    crest.visibility = 0.72;
    crest.metadata = freeze({ kind: 'rt92-station-crest', stationId: station.id, symbolicOnly: true, interactive: false });
    stationCrests.push(crest);
  }

  return freeze({
    root,
    nexusRoot,
    nexusOrbitRings: freeze(nexusOrbitRings),
    nexusCradlePylons: freeze(nexusCradlePylons),
    nexusCrown,
    microTraceNodes: freeze(microTraceNodes),
    pulseNodes: freeze(pulseNodes),
    guidePylons: freeze(guidePylons),
    overheadFins: freeze(overheadFins),
    stationCrests: freeze(stationCrests),
    firstFrameNewBinaryBytes: 0,
    proceduralGeometryOnly: true
  });
}

function createWorld(scene, palette, environmentPlan, rt92CommandHubPlan) {
  const root = new TransformNode('w737-command-centre-root', scene);
  root.metadata = freeze({ kind: 'w737-command-centre-root', schema: EON_CITY_W731_COMMAND_HUB_SCHEMA, convergenceSchema: EON_CITY_W760_W765_SCHEMA, exteriorMap: true });
  const sceneConvergence = EON_CITY_W760_SCENE_PROFILE;
  const materials = {
    floor: makePbrMaterial(scene, 'w755-floor-pbr', { base: palette.floor, emissive: palette.background, emissiveIntensity: 0.055, metallic: 0.68, roughness: 0.34 }),
    lane: makeMaterial(scene, 'w737-lane', { diffuse: palette.surface, emissive: '#4ea8a0', emissiveIntensity: 0.18 }),
    structure: makeMaterial(scene, 'w737-structure', { diffuse: palette.structure, emissive: palette.accent, emissiveIntensity: 0.035 }),
    stationBase: makePbrMaterial(scene, 'w755-station-base-pbr', { base: palette.surface, emissive: palette.accent, emissiveIntensity: 0.075, metallic: 0.52, roughness: 0.4 }),
    secondaryBase: makeMaterial(scene, 'w737-secondary-base', { diffuse: palette.floor, emissive: palette.accent2, emissiveIntensity: 0.05 }),
    accent: makeMaterial(scene, 'w737-accent', { diffuse: '#5f8779', emissive: '#7bd7c7', emissiveIntensity: 0.42 }),
    accent2: makeMaterial(scene, 'w737-accent2', { diffuse: palette.accent2, emissive: palette.accent2, emissiveIntensity: 0.24 }),
    cyan: makeMaterial(scene, 'w737-cyan', { diffuse: '#2f7774', emissive: '#6ce8de', emissiveIntensity: 0.55 }),
    violet: makeMaterial(scene, 'w737-violet', { diffuse: '#62537a', emissive: '#a995d2', emissiveIntensity: 0.34 }),
    amber: makeMaterial(scene, 'w737-amber', { diffuse: '#805a32', emissive: '#efb868', emissiveIntensity: 0.5 }),
    mint: makeMaterial(scene, 'w737-mint', { diffuse: '#477464', emissive: '#91ddbd', emissiveIntensity: 0.42 }),
    magenta: makeMaterial(scene, 'w737-magenta', { diffuse: '#795369', emissive: '#d991b8', emissiveIntensity: 0.36 }),
    warm: makeMaterial(scene, 'w737-warm', { diffuse: palette.warm, emissive: '#e4bd7d', emissiveIntensity: 0.22 }),
    skin: makeMaterial(scene, 'w759r2-procedural-skin-w761-teal-graphite', { diffuse: '#8b6a55', emissive: '#3b241b', emissiveIntensity: 0.08, specular: '#21130e' }),
    skinWarm: makeMaterial(scene, 'w761-procedural-skin-violet-slate', { diffuse: '#a97961', emissive: '#40281f', emissiveIntensity: 0.075, specular: '#21130e' }),
    skinDeep: makeMaterial(scene, 'w761-procedural-skin-amber-charcoal', { diffuse: '#744f3f', emissive: '#302019', emissiveIntensity: 0.07, specular: '#1a100d' }),
    skinLight: makeMaterial(scene, 'w761-procedural-skin-magenta-graphite', { diffuse: '#bc8a70', emissive: '#4a2f27', emissiveIntensity: 0.075, specular: '#281813' }),
    signal: makeMaterial(scene, 'w737-signal', { diffuse: '#90c7bb', emissive: '#78e6d7', emissiveIntensity: 0.62 }),
    glass: makePbrMaterial(scene, 'w755-glass-pbr', { base: '#223e3a', emissive: '#5aa79b', emissiveIntensity: 0.18, metallic: 0.18, roughness: 0.18, alpha: 0.3 }),
    skylineNear: makePbrMaterial(scene, 'w759r3-skyline-near', { base: '#182520', emissive: '#50796c', emissiveIntensity: 0.15, metallic: 0.46, roughness: 0.46 }),
    skylineMid: makeMaterial(scene, 'w759r3-skyline-mid', { diffuse: '#121d1a', emissive: '#3f6258', emissiveIntensity: 0.105 }),
    skylineFar: makeMaterial(scene, 'w759r3-skyline-far', { diffuse: '#0c1311', emissive: '#263d37', emissiveIntensity: 0.065 }),
    skylineAccent: makeMaterial(scene, 'w759r3-skyline-accent', { diffuse: '#315f58', emissive: '#72d7c5', emissiveIntensity: 0.48 }),
    skylineGlass: makePbrMaterial(scene, 'w760-skyline-glass', { base: '#27423d', emissive: '#78d9ca', emissiveIntensity: 0.24, metallic: 0.2, roughness: 0.16, alpha: 0.72 }),
    skylineRoof: makePbrMaterial(scene, 'w760-skyline-roof', { base: '#28352f', emissive: '#d8b778', emissiveIntensity: 0.22, metallic: 0.62, roughness: 0.31 }),
    rewardPulse: makeMaterial(scene, 'w764-reward-pulse', { diffuse: '#a88445', emissive: '#ffe3a1', emissiveIntensity: 0.82, alpha: 0.86 }),
    windows: makeMaterial(scene, 'w737-windows', { diffuse: '#6d5739', emissive: '#d7a65f', emissiveIntensity: 0.42 })
  };

  const ground = MeshBuilder.CreateCylinder('w737-command-horizon-ground', { diameter: EON_CITY_W731_WORLD_BOUNDS.playableRadius * 2, height: 0.32, tessellation: 96 }, scene);
  ground.parent = root; ground.position.y = -0.16; ground.material = materials.floor; ground.isPickable = false;
  ground.metadata = freeze({ kind: 'w737-playable-ground', bounded: true, exteriorMap: true, interactive: false });
  const underside = MeshBuilder.CreateCylinder('w731-command-hub-world-safety-underlay', { diameter: EON_CITY_W731_WORLD_BOUNDS.playableRadius * 2.08, height: 7.8, tessellation: 72 }, scene);
  underside.parent = root; underside.position.y = -4.18; underside.material = materials.skylineFar; underside.isPickable = false;
  underside.metadata = freeze({ kind: 'w737-world-safety-underlay', hidesWorldUnderside: true, interactive: false });

  const architecture = createCommandCentreArchitecture(scene, root, materials);
  const exteriorMap = createExteriorMap(scene, root, materials);
  const ambientCitizens = createExteriorAmbientCitizens(scene, root);
  const ambientActors = createW744AmbientActors(scene, root, materials);

  const orientationRing = MeshBuilder.CreateTorus('w737-orientation-core-ring', { diameter: 7.1, thickness: 0.075, tessellation: 64 }, scene);
  orientationRing.parent = root; orientationRing.position.y = 0.34; orientationRing.rotation.x = Math.PI / 2; orientationRing.material = materials.signal; orientationRing.isPickable = false;

  const motherboardRoot = new TransformNode('w755-motherboard-floor-root', scene);
  motherboardRoot.parent = root;
  const centralSocket = MeshBuilder.CreateCylinder('w755-living-nexus-processor-socket', { diameter: environmentPlan.floor.centralSocket.radius * 2, height: 0.12, tessellation: 64 }, scene);
  centralSocket.parent = motherboardRoot; centralSocket.position.set(environmentPlan.floor.centralSocket.x, environmentPlan.floor.centralSocket.y, environmentPlan.floor.centralSocket.z); centralSocket.material = materials.secondaryBase; centralSocket.isPickable = false;
  centralSocket.metadata = freeze({ kind: 'w755-central-processor-socket', connectedStationCount: environmentPlan.floor.stationSocketCount, localOnly: true });
  const stationSockets = [];
  const stationSocketHalos = [];
  for (const socket of environmentPlan.floor.sockets) {
    const pad = MeshBuilder.CreateCylinder(`w755-${socket.stationId}-chip-socket`, { diameter: socket.radius * 2, height: 0.09, tessellation: 40 }, scene);
    pad.parent = motherboardRoot; pad.position.set(socket.position.x, socket.position.y, socket.position.z); pad.material = materials.stationBase; pad.isPickable = false;
    pad.metadata = freeze({ kind: 'w755-station-chip-socket', stationId: socket.stationId, address: socket.address, unique: true, interactive: false });
    stationSockets.push(pad);
    const halo = MeshBuilder.CreateTorus(`w760-${socket.stationId}-socket-halo`, { diameter: socket.radius * 2.38, thickness: 0.035, tessellation: 44 }, scene);
    halo.parent = motherboardRoot; halo.position.set(socket.position.x, socket.position.y + 0.065, socket.position.z); halo.rotation.x = Math.PI / 2; halo.material = stationAccentMaterial(getEonCityW731Station(socket.stationId), materials); halo.isPickable = false;
    halo.metadata = freeze({ kind: 'w760-station-socket-halo', stationId: socket.stationId, motherboardConnection: true, interactive: false });
    stationSocketHalos.push(halo);
  }

  for (const station of EON_CITY_W731_STATIONS) createPath(scene, root, { x: 0, z: 1 }, station.position, materials.lane, station.id);
  for (const discovery of EON_CITY_W737_DISCOVERIES) createPath(scene, root, { x: Math.sign(discovery.position.x) * 9, z: Math.sign(discovery.position.z) * 9 }, discovery.position, materials.secondaryBase, `discovery-${discovery.id}`);

  const stations = new Map(EON_CITY_W731_STATIONS.map((station) => [station.id, createStation(scene, root, station, materials)]));
  const discoveries = new Map(EON_CITY_W737_DISCOVERIES.map((entry) => [entry.id, createDiscovery(scene, root, entry, materials)]));
  architecture.environmentAnchors.set('living-nexus-core', stations.get('eonbot-nexus').root);
  const rt92CommandHubArt = createRt92CommandHubGoldMasterLayer(scene, root, materials, rt92CommandHubPlan);
  const rt92EnvironmentalLife = mountEonCityRt92EnvironmentalLifeArt({ scene, parent: root, worldId: 'command-hub', quality: rt92CommandHubPlan?.quality || 'balanced', reducedMotion: rt92CommandHubPlan?.reducedMotion === true });
  if (!rt92EnvironmentalLife?.ok) throw new Error(`rt92-command-hub-environmental-life-failed:${rt92EnvironmentalLife?.reason || 'unknown'}`);
  rt92EnvironmentalLife.setActive?.(true);
  const rt92CinematicVfx = mountEonCityRt92CinematicVfxArt({ scene, parent: root, worldId: 'command-hub', quality: rt92CommandHubPlan?.quality || 'balanced', reducedMotion: rt92CommandHubPlan?.reducedMotion === true });
  if (!rt92CinematicVfx?.ok) throw new Error(`rt92-command-hub-cinematic-vfx-failed:${rt92CinematicVfx?.reason || 'unknown'}`);

  const dock = MeshBuilder.CreateCylinder('w737-eonbot-dock-fallback', { diameter: 1.55, height: 0.16, tessellation: 30 }, scene);
  dock.parent = root; dock.position.set(EON_CITY_W731_EONBOT_DOCK.x, 0.09, EON_CITY_W731_EONBOT_DOCK.z); dock.material = materials.glass; dock.isPickable = true;
  dock.metadata = stationMetadata(getEonCityW731Station('eonbot-nexus'), {
    part: 'structure', interactionRole: 'structure', dock: true, authored: false,
    accessibilityLabel: 'Open the Living EONBOT Nexus from its dock'
  });

  for (let index = 0; index < 48; index += 1) {
    const angle = (index / 48) * TAU;
    const radius = EON_CITY_W731_WORLD_BOUNDS.playableRadius - 0.4;
    const segment = MeshBuilder.CreateBox(`w737-boundary-${index}`, { width: 3.15, height: 0.42, depth: 0.32 }, scene);
    segment.parent = root;
    segment.position.set(Math.sin(angle) * radius, 0.21, Math.cos(angle) * radius);
    segment.rotation.y = angle;
    segment.material = index % 6 === 0 ? materials.warm : materials.structure;
    segment.isPickable = false;
    segment.metadata = freeze({ kind: 'w737-complete-playable-boundary', reachableBeyond: false });
  }
  for (const gateway of EON_CITY_W731_FUTURE_GATEWAYS) createFutureGateway(scene, root, gateway, materials);

  const glassWallRoot = new TransformNode('w755-glass-wall-root', scene);
  glassWallRoot.parent = root;
  const glassSegments = [];
  for (let index = 0; index < environmentPlan.materials.glassStructuralSections; index += 1) {
    const angle = (index / environmentPlan.materials.glassStructuralSections) * TAU;
    const segment = MeshBuilder.CreateBox(`w755-glass-wall-${index}`, { width: 5.4, height: 5.2, depth: 0.1 }, scene);
    segment.parent = glassWallRoot; segment.position.set(Math.sin(angle) * 25.6, 3.1, Math.cos(angle) * 25.6); segment.rotation.y = angle; segment.material = materials.glass; segment.isPickable = false;
    segment.metadata = freeze({ kind: 'w755-translucent-structure', openCanopy: true, blocksNavigation: false });
    glassSegments.push(segment);
  }
  const megaScreens = [];
  for (let index = 0; index < environmentPlan.materials.megaScreens; index += 1) {
    const angle = (index / environmentPlan.materials.megaScreens) * TAU + 0.35;
    const screen = MeshBuilder.CreateBox(`w755-mega-screen-${index}`, { width: 4.2, height: 1.8, depth: 0.08 }, scene);
    screen.parent = glassWallRoot; screen.position.set(Math.sin(angle) * 24.8, 4.7, Math.cos(angle) * 24.8); screen.rotation.y = angle; screen.material = index % 2 ? materials.cyan : materials.violet; screen.isPickable = false;
    screen.metadata = freeze({ kind: 'w755-command-mega-screen', privateData: false, decorativeProjection: true });
    megaScreens.push(screen);
  }

  const skylineRoot = new TransformNode('w755-skyline-near-mid-far-root', scene);
  skylineRoot.parent = root;
  const skylineTowers = [];
  const skylineFacadeBands = [];
  const skylineWindowRows = [];
  const skylineCrowns = [];
  const skylineLightStrips = [];
  for (const tier of environmentPlan.skyline.tiers) {
    for (let index = 0; index < tier.count; index += 1) {
      const fraction = index / Math.max(1, tier.count);
      const angle = fraction * TAU + (tier.id === 'mid' ? 0.037 : tier.id === 'far' ? 0.073 : 0);
      const radiusSpan = tier.radiusMax - tier.radiusMin;
      const radius = tier.radiusMin + ((index * 7) % Math.max(1, tier.count)) / Math.max(1, tier.count - 1) * radiusSpan;
      const height = tier.heightMin + ((index * 5) % 11) / 10 * (tier.heightMax - tier.heightMin);
      const width = tier.id === 'near' ? 2.6 + (index % 4) * 0.55 : tier.id === 'mid' ? 2.1 + (index % 3) * 0.5 : 1.8 + (index % 3) * 0.42;
      const tower = MeshBuilder.CreateBox(`w755-skyline-${tier.id}-${index}`, { width, depth: width, height }, scene);
      const skylineMaterial = tier.id === 'near' ? materials.skylineNear : tier.id === 'mid' ? materials.skylineMid : materials.skylineFar;
      tower.parent = skylineRoot; tower.position.set(Math.sin(angle) * radius, height / 2 - 0.1, Math.cos(angle) * radius); tower.rotation.y = -angle + (index % 2 ? 0.14 : -0.12); tower.material = (index + tier.count) % 7 === 0 ? materials.secondaryBase : skylineMaterial; tower.isPickable = false;
      tower.metadata = freeze({ kind: 'w755-nonplayable-skyline', tier: tier.id, outsidePlayableBoundary: true, sameOriginOnly: true, silhouetteStyle: 'w759r3-layered-crown-and-light' });
      skylineTowers.push(tower);
      const rowCount = tier.id === 'near' ? sceneConvergence.skyline.nearWindowRows : tier.id === 'mid' ? sceneConvergence.skyline.midWindowRows : sceneConvergence.skyline.farWindowRows;
      for (let row = 0; row < rowCount; row += 1) {
        const windowRow = MeshBuilder.CreateBox(`w760-skyline-window-row-${tier.id}-${index}-${row}`, { width: width * (0.54 + (row % 2) * 0.1), height: Math.max(0.12, height * 0.025), depth: 0.045 }, scene);
        windowRow.parent = tower;
        windowRow.position.set((row % 2 ? -1 : 1) * width * 0.055, -height * 0.31 + (row + 1) * (height * 0.62 / (rowCount + 1)), -width / 2 - 0.032);
        windowRow.material = (index + row) % 3 === 0 ? materials.skylineAccent : materials.windows;
        windowRow.isPickable = false;
        windowRow.visibility = tier.id === 'near' ? 0.82 : tier.id === 'mid' ? 0.76 : 0.7;
        windowRow.metadata = freeze({ kind: 'w760-skyline-window-row', tier: tier.id, controlledEmission: true, interactive: false });
        skylineWindowRows.push(freeze({ node: windowRow, phase: index * 0.31 + row * 0.77, tier: tier.id }));
      }
      for (const [bandIndex, fraction] of sceneConvergence.skyline.facadeBandFractions.entries()) {
        if (tier.id === 'far' && bandIndex > 1) break;
        const band = MeshBuilder.CreateBox(`w760-skyline-facade-band-${tier.id}-${index}-${bandIndex}`, { width: width * 1.03, height: 0.055, depth: width * 1.03 }, scene);
        band.parent = tower; band.position.y = -height / 2 + height * fraction; band.material = bandIndex % 2 ? materials.skylineGlass : materials.skylineRoof; band.isPickable = false;
        band.metadata = freeze({ kind: 'w760-layered-facade-band', tier: tier.id, architecturalLayer: bandIndex + 1, interactive: false });
        skylineFacadeBands.push(band);
      }
      if (tier.id !== 'far' && index % 4 === 0) {
        const lightStrip = MeshBuilder.CreateBox(`w759r3-skyline-light-strip-${tier.id}-${index}`, { width: 0.075, height: Math.max(1.15, height * 0.48), depth: 0.045 }, scene);
        lightStrip.parent = tower; lightStrip.position.set(width * 0.29, height * 0.02, -width / 2 - 0.035); lightStrip.material = materials.skylineAccent; lightStrip.isPickable = false;
        lightStrip.metadata = freeze({ kind: 'w759r3-skyline-light-strip', tier: tier.id, controlledEmission: true, interactive: false });
        skylineLightStrips.push(lightStrip);
      }
      if (tier.id === 'near' && index % sceneConvergence.skyline.crownEvery === 0) {
        const crown = MeshBuilder.CreateCylinder(`w759r3-skyline-crown-w760-skyline-crown-${index}`, { diameterTop: width * 0.38, diameterBottom: width * 0.78, height: 0.42 + (index % 3) * 0.1, tessellation: 8 }, scene);
        crown.parent = tower; crown.position.y = height / 2 + 0.21; crown.material = index % 2 ? materials.skylineRoof : materials.skylineAccent; crown.isPickable = false;
        crown.metadata = freeze({ kind: 'w760-architectural-crown', tier: tier.id, silhouette: 'tapered', interactive: false });
        skylineCrowns.push(crown);
      }
      if (tier.id !== 'far' && index % sceneConvergence.skyline.spireEvery === 0) {
        const spire = MeshBuilder.CreateCylinder(`w760-skyline-spire-${tier.id}-${index}`, { diameterTop: 0.025, diameterBottom: 0.13, height: 1.2 + (index % 4) * 0.28, tessellation: 10 }, scene);
        spire.parent = tower; spire.position.y = height / 2 + 0.7; spire.material = materials.skylineAccent; spire.isPickable = false;
        spire.metadata = freeze({ kind: 'w760-architectural-spire', tier: tier.id, interactive: false });
        skylineCrowns.push(spire);
      }
    }
  }

  const skylineTransitRoot = new TransformNode('w760-distant-transit-root', scene);
  skylineTransitRoot.parent = root;
  const skylineTransit = [];
  for (let index = 0; index < sceneConvergence.skyline.transitCount; index += 1) {
    const capsule = MeshBuilder.CreateCapsule(`w760-distant-transit-${index}`, { height: 0.62, radius: 0.09, tessellation: 10, subdivisions: 1 }, scene);
    capsule.parent = skylineTransitRoot; capsule.material = index % 2 ? materials.warm : materials.skylineAccent; capsule.isPickable = false;
    capsule.rotation.z = Math.PI / 2;
    const transitRadius = 29 + index * 5.5;
    const transitHeight = 5.6 + index * 1.3;
    const transitPhase = index * 2.14;
    capsule.position.set(Math.sin(transitPhase) * transitRadius, transitHeight, Math.cos(transitPhase) * transitRadius);
    capsule.metadata = freeze({ kind: 'w760-distant-transit', ambientOnly: true, passengerTravel: false, interactive: false });
    skylineTransit.push(freeze({ node: capsule, radius: transitRadius, height: transitHeight, speed: 0.035 + index * 0.009, phase: transitPhase }));
  }

  const weatherRoot = new TransformNode('w755-weather-root', scene); weatherRoot.parent = root;
  const rainRoot = new TransformNode('w755-rain-root', scene); rainRoot.parent = weatherRoot;
  const rainDrops = [];
  for (let index = 0; index < environmentPlan.weather.particleCount; index += 1) {
    const drop = MeshBuilder.CreateBox(`w755-rain-${index}`, { width: 0.018, height: 0.65, depth: 0.018 }, scene);
    drop.parent = rainRoot; drop.position.set(((index * 13) % 41) - 20, 2.5 + ((index * 17) % 12), ((index * 19) % 41) - 20); drop.material = materials.cyan; drop.isPickable = false;
    drop.metadata = freeze({ kind: 'w755-local-rain-cue', realWeather: false, readableControls: true });
    rainDrops.push(drop);
  }
  rainRoot.setEnabled(environmentPlan.weather.particleCount > 0);
  const mistRoot = new TransformNode('w755-mist-root', scene); mistRoot.parent = weatherRoot;
  for (let index = 0; index < 5; index += 1) {
    const mist = MeshBuilder.CreateTorus(`w755-mist-band-${index}`, { diameter: 18 + index * 7, thickness: 0.08, tessellation: 72 }, scene);
    mist.parent = mistRoot; mist.position.y = 0.35 + index * 0.12; mist.rotation.x = Math.PI / 2; mist.material = materials.glass; mist.isPickable = false;
  }
  mistRoot.setEnabled(environmentPlan.weatherProfile === 'mist');
  const puddles = [];
  for (let index = 0; index < Math.max(12, environmentPlan.weather.puddleCueCount); index += 1) {
    const angle = (index / 12) * TAU;
    const puddle = MeshBuilder.CreateDisc(`w755-puddle-${index}`, { radius: 0.55 + (index % 3) * 0.14, tessellation: 28 }, scene);
    puddle.parent = weatherRoot; puddle.position.set(Math.sin(angle) * (10 + index % 4), 0.018, Math.cos(angle) * (10 + index % 4)); puddle.rotation.x = Math.PI / 2; puddle.material = materials.glass; puddle.isPickable = false;
    puddle.setEnabled(index < environmentPlan.weather.puddleCueCount); puddles.push(puddle);
  }

  const convergenceReactionRoot = new TransformNode('w762-w764-convergence-reaction-root', scene);
  convergenceReactionRoot.parent = root;
  convergenceReactionRoot.position.set(0, 0.18, 0);
  const nexusReactionRings = [];
  for (let index = 0; index < 3; index += 1) {
    const ring = MeshBuilder.CreateTorus(`w762-nexus-reaction-ring-${index}`, { diameter: 4.1 + index * 0.72, thickness: 0.045 + index * 0.012, tessellation: 72 }, scene);
    ring.parent = convergenceReactionRoot; ring.position.y = 0.12 + index * 0.08; ring.rotation.x = Math.PI / 2; ring.material = index === 1 ? materials.warm : materials.signal; ring.isPickable = false; ring.setEnabled(false);
    ring.metadata = freeze({ kind: 'w762-actual-nexus-state-reaction', index, sourceAuthority: 'w749', inventedActivity: false, interactive: false });
    nexusReactionRings.push(ring);
  }
  const rewardBurstNodes = [];
  for (let index = 0; index < 14; index += 1) {
    const spark = MeshBuilder.CreateSphere(`w764-reward-burst-${index}`, { diameter: 0.11 + (index % 3) * 0.025, segments: 8 }, scene);
    spark.parent = convergenceReactionRoot; spark.position.y = 1.2; spark.material = index % 3 === 0 ? materials.warm : index % 3 === 1 ? materials.signal : materials.rewardPulse; spark.isPickable = false; spark.setEnabled(false);
    spark.metadata = freeze({ kind: 'w764-verified-mission-reward-reaction', index, sourceAuthority: 'w752', deterministic: true, interactive: false });
    rewardBurstNodes.push(spark);
  }

  return freeze({
    root, materials: freeze(materials), stations, discoveries,
    environmentAnchors: architecture.environmentAnchors,
    dock, orientationRing, commandTable: architecture.commandTable, commandTableGlass: architecture.tableGlass, canopy: architecture.canopy, commandColumns: architecture.columns,
    circuitRoot: architecture.circuitRoot, circuitNodeCount: architecture.circuitNodeCount, circuitPulses: architecture.circuitPulses, commandLights: architecture.commandLights,
    ambientCitizens, ambientActors, exteriorMap, rt92CommandHubArt, rt92EnvironmentalLife, rt92CinematicVfx,
    environment: freeze({ plan: environmentPlan, convergence: sceneConvergence, motherboardRoot, centralSocket, stationSockets: freeze(stationSockets), stationSocketHalos: freeze(stationSocketHalos), glassSegments: freeze(glassSegments), megaScreens: freeze(megaScreens), skylineRoot, skylineTowers: freeze(skylineTowers), skylineFacadeBands: freeze(skylineFacadeBands), skylineWindowRows: freeze(skylineWindowRows), skylineCrowns: freeze(skylineCrowns), skylineLightStrips: freeze(skylineLightStrips), skylineTransitRoot, skylineTransit: freeze(skylineTransit), weather: freeze({ weatherRoot, rainRoot, rainDrops: freeze(rainDrops), mistRoot, puddles: freeze(puddles) }), reactions: freeze({ root: convergenceReactionRoot, nexusRings: freeze(nexusReactionRings), rewardBurstNodes: freeze(rewardBurstNodes) }) })
  });
}

function freezeCommandHubStaticPresentation(world) {
  const meshes = [];
  for (const mesh of world?.environment?.skylineTowers || []) meshes.push(mesh);
  for (const mesh of world?.environment?.skylineFacadeBands || []) meshes.push(mesh);
  for (const entry of world?.environment?.skylineWindowRows || []) if (entry?.node) meshes.push(entry.node);
  for (const mesh of world?.environment?.skylineCrowns || []) meshes.push(mesh);
  for (const mesh of world?.environment?.skylineLightStrips || []) meshes.push(mesh);
  for (const mesh of world?.environment?.glassSegments || []) meshes.push(mesh);
  for (const mesh of world?.environment?.megaScreens || []) meshes.push(mesh);
  for (const mesh of world?.rt92CommandHubArt?.nexusCradlePylons || []) meshes.push(mesh);
  for (const mesh of world?.rt92CommandHubArt?.microTraceNodes || []) meshes.push(mesh);
  for (const mesh of world?.rt92CommandHubArt?.guidePylons || []) meshes.push(mesh);
  for (const mesh of world?.rt92CommandHubArt?.overheadFins || []) meshes.push(mesh);
  for (const mesh of world?.rt92CommandHubArt?.stationCrests || []) meshes.push(mesh);
  for (const mesh of world?.environment?.weather?.rainDrops || []) meshes.push(mesh);
  for (const mesh of world?.environment?.weather?.puddles || []) meshes.push(mesh);
  for (const mesh of world?.environment?.weather?.mistRoot?.getChildMeshes?.(false) || []) meshes.push(mesh);
  let frozenCount = 0;
  for (const mesh of meshes) {
    if (!mesh || mesh.isDisposed?.()) continue;
    try {
      mesh.computeWorldMatrix?.(true);
      mesh.freezeWorldMatrix?.();
      frozenCount += 1;
    } catch {}
  }
  return freeze({ ok: true, frozenCount, staticPresentationOnly: true, changesInteractionAuthority: false });
}

function createCommandHubUi(productRoot, stations, discoveries, {
  onOpenStation, onGuideStation, onFocusMonitors, onInspectDiscovery, onGuideDiscovery, onInspectInteraction,
  onResume, onReset, onRestart, onOpenCapture, onOpenShare, onOpenNexus, onOpenExpanseMissionBoard, onOpenAccessibleMap, onClaimMission, onOpenReveal, onAcquireInputLease, onReleaseInputLease, surfaceManager, onStatus, getMissionView, getInteraction,
  getTransitDestinations, onRequestTransit, onConfirmTransit, onCancelTransit,
  onReviewExpanseGate, onEnterExpanse, onEnterSignal, onCancelExpanse, getExpanseGateReview, getOpenWorldAvailability, getActiveWorldRegion, getEonbotWorldContext, onEnterStorm, onEnterMyFrontier, onGuideFlagshipMission
} = {}) {
  const session = productRoot?.querySelector?.('.eon-play-session') || productRoot;
  if (!session?.append) return freeze({ update() {}, setPrompt() {}, setWorldMode() {}, updateMissions() {}, showReaction() {}, setPaused() {}, dispose() {} });
  const normalizeLeaseResult = (result) => result && typeof result === 'object' ? result : freeze({ ok: result !== false });
  const acquireUiLease = (ownerId, metadata = {}) => normalizeLeaseResult(onAcquireInputLease?.(ownerId, metadata) ?? freeze({ ok: true, ownerId, compatibilityFallback: true }));
  const releaseUiLease = (ownerId, reason = 'explicit-close') => normalizeLeaseResult(onReleaseInputLease?.(ownerId, reason) ?? freeze({ ok: true, ownerId, compatibilityFallback: true }));
  const inspectNodePresentation = (node) => {
    const connected = node?.isConnected === true;
    const intentionallyHidden = node?.hidden === true || node?.hasAttribute?.('hidden') === true;
    const accessibilityHidden = node?.getAttribute?.('aria-hidden') === 'true' || node?.inert === true || node?.hasAttribute?.('inert') === true;
    let computedHidden = false;
    let geometryVisible = null;
    let rectangle = null;
    if (connected) {
      try {
        const style = globalThis.getComputedStyle?.(node);
        computedHidden = Boolean(style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) <= 0.01));
        const rect = node.getBoundingClientRect?.();
        if (rect && [rect.width, rect.height, rect.left, rect.right, rect.top, rect.bottom].every(Number.isFinite)) {
          const width = Math.max(1, Number(globalThis.innerWidth || document?.documentElement?.clientWidth || 1));
          const height = Math.max(1, Number(globalThis.innerHeight || document?.documentElement?.clientHeight || 1));
          geometryVisible = rect.width > 1 && rect.height > 1 && rect.right > 0 && rect.bottom > 0 && rect.left < width && rect.top < height;
          rectangle = freeze({ width: rect.width, height: rect.height, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
        }
      } catch {}
    }
    return freeze({ connected, intentionallyHidden, accessibilityHidden, computedHidden, geometryVisible, rectangle });
  };
  const isNodeVisiblyOpen = (node) => {
    const presentation = inspectNodePresentation(node);
    return presentation.connected
      && !presentation.intentionallyHidden
      && !presentation.accessibilityHidden
      && !presentation.computedHidden
      && presentation.geometryVisible !== false;
  };
  const maintainedSurfaceLifecycle = {
    cityMenu: { logicalOpen: false, transitionActive: false, successorOwnerId: '', changedAt: Date.now() },
    transitReview: { logicalOpen: false, transitionActive: false, successorOwnerId: '', changedAt: Date.now() },
    expanseReview: { logicalOpen: false, transitionActive: false, successorOwnerId: '', changedAt: Date.now() }
  };
  const updateSurfaceLifecycle = (surfaceKey, patch = {}) => {
    const record = maintainedSurfaceLifecycle[surfaceKey];
    if (!record) return null;
    Object.assign(record, patch, { changedAt: Date.now() });
    return record;
  };
  const inspectSurfaceLifecycle = (surfaceKey, node) => {
    const lifecycle = maintainedSurfaceLifecycle[surfaceKey] || {};
    const presentation = inspectNodePresentation(node);
    return freeze({
      logicalOpen: lifecycle.logicalOpen === true,
      transitionActive: lifecycle.transitionActive === true,
      successorOwnerId: String(lifecycle.successorOwnerId || ''),
      changedAt: Number(lifecycle.changedAt || 0),
      connected: presentation.connected,
      accessibilityHidden: presentation.accessibilityHidden,
      intentionallyHidden: presentation.intentionallyHidden || presentation.computedHidden,
      geometryVisible: presentation.geometryVisible,
      rectangle: presentation.rectangle
    });
  };
  const focusOutsideSurfaceBeforeHide = (surface, preferredTarget = null, fallbackTarget = null) => {
    const activeElement = document?.activeElement || null;
    if (!surface?.contains?.(activeElement)) return freeze({ moved: false, reason: 'focus-already-outside' });
    const candidates = [preferredTarget, fallbackTarget, session.querySelector?.('canvas'), productRoot]
      .filter((candidate, index, list) => candidate?.isConnected && !surface.contains(candidate) && list.indexOf(candidate) === index);
    for (const candidate of candidates) {
      try { candidate.focus?.({ preventScroll: true }); } catch {}
      if (!surface.contains(document?.activeElement)) return freeze({ moved: true, target: candidate });
    }
    try { activeElement?.blur?.(); } catch {}
    return freeze({ moved: !surface.contains(document?.activeElement), reason: 'fallback-blur' });
  };
  const setMaintainedDialogOpen = (node, open, { display = '' } = {}) => {
    if (!node) return;
    if (open) {
      node.hidden = false;
      node.removeAttribute?.('hidden');
      try { node.inert = false; } catch {}
      node.removeAttribute?.('inert');
      node.setAttribute?.('aria-hidden', 'false');
      if (display) node.style.display = display;
    } else {
      try { node.inert = true; } catch {}
      node.setAttribute?.('inert', '');
      node.hidden = true;
      node.setAttribute?.('hidden', '');
      node.setAttribute?.('aria-hidden', 'true');
      if (display) node.style.display = 'none';
    }
  };
  try { session.__eonCityCommandHubUi?.dispose?.(); } catch {}
  session.dataset.eonCityCommandHub = 'w737';
  productRoot.dataset.eonCityRuntimeOwner = EON_CITY_W731_RUNTIME_OWNER_SCHEMA;
  productRoot.dataset.eonCityLaunchModel = 'command-centre-exterior-map';
  productRoot.dataset.eonCityOpenWorld = 'bounded-exterior';

  const labels = document.createElement('div');
  labels.className = 'eon-city-command-labels';
  labels.dataset.eonCityCommandLabels = '1';
  labels.setAttribute('aria-label', 'Command Centre destination markers');
  const labelRecords = [];
  let uiWorldMode = 'COMMAND_HUB';
  const addLabel = (entity, kind) => {
    const button = document.createElement('button');
    button.type = 'button';
    // Inline fail-safe: global application themes must never turn these
    // spatial labels into native white browser buttons before City CSS loads.
    button.style.setProperty('-webkit-appearance', 'none', 'important');
    button.style.setProperty('appearance', 'none', 'important');
    button.style.setProperty('border', '1px solid rgba(104,235,224,.58)', 'important');
    button.style.setProperty('border-radius', '.7rem', 'important');
    button.style.setProperty('background', 'linear-gradient(145deg,rgba(4,18,28,.96),rgba(10,28,31,.94))', 'important');
    button.style.setProperty('color', '#f2feff', 'important');
    button.style.setProperty('box-shadow', '0 .62rem 1.5rem rgba(0,0,0,.46),inset 0 0 0 1px rgba(255,255,255,.035)', 'important');
    button.dataset.eonCityLabelKind = kind;
    button.dataset.eonCityLabelId = entity.id;
    if (kind === 'station') button.dataset.eonCityStationLabel = entity.id;
    else button.dataset.eonCityDiscoveryLabel = entity.id;
    button.setAttribute('aria-label', kind === 'station' ? `Open ${entity.label}` : `Inspect ${entity.label}`);
    button.innerHTML = `<strong>${safeText(entity.shortLabel || entity.label)}</strong>`;
    button.addEventListener('click', () => kind === 'station' ? onOpenStation?.(entity.id, button) : onInspectDiscovery?.(entity.id, button));
    labels.append(button);
    labelRecords.push({ button, entity, kind });
  };
  for (const station of EON_CITY_W731_STATIONS) addLabel(station, 'station');
  for (const discovery of EON_CITY_W737_DISCOVERIES) addLabel(discovery, 'discovery');

  const prompt = document.createElement('section');
  prompt.className = 'eon-city-command-prompt';
  prompt.dataset.eonCityCommandPrompt = '1';
  prompt.hidden = true;
  prompt.setAttribute('aria-live', 'polite');
  prompt.innerHTML = `<div><p data-eon-city-command-prompt-role></p><strong data-eon-city-command-prompt-title></strong><span data-eon-city-command-prompt-greeting></span></div><div class="eon-city-command-prompt-actions"><button type="button" data-eon-city-command-open></button><button type="button" data-eon-city-command-inspect>Inspect</button><button type="button" data-eon-city-command-capture hidden>Record City</button><kbd>E</kbd></div>`;
  let promptTarget = null;
  prompt.querySelector('[data-eon-city-command-open]')?.addEventListener('click', (event) => {
    if (!promptTarget) return;
    if (promptTarget.kind === 'station') onOpenStation?.(promptTarget.entity.id, event.currentTarget);
    else onInspectDiscovery?.(promptTarget.entity.id, event.currentTarget);
  });
  prompt.querySelector('[data-eon-city-command-inspect]')?.addEventListener('click', (event) => {
    if (!promptTarget) return;
    const interaction = typeof getInteraction === 'function' ? getInteraction(promptTarget) : null;
    onInspectInteraction?.(interaction, promptTarget, event.currentTarget);
  });
  prompt.querySelector('[data-eon-city-command-capture]')?.addEventListener('click', (event) => onOpenCapture?.(event.currentTarget));

  const feedback = document.createElement('section');
  feedback.className = 'eon-city-command-feedback';
  feedback.dataset.eonCityCommandFeedback = '1';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.innerHTML = '<small data-eon-city-feedback-kicker>Command Core</small><strong data-eon-city-feedback-title></strong><span data-eon-city-feedback-detail></span>';
  let feedbackTimer = null;
  const showReaction = (reaction = {}) => {
    if (!reaction?.label) return false;
    if (feedbackTimer !== null) globalThis.clearTimeout?.(feedbackTimer);
    feedback.dataset.kind = String(reaction.kind || 'status');
    feedback.querySelector('[data-eon-city-feedback-kicker]').textContent = reaction.kind === 'mission-complete' ? 'Mission verified' : reaction.kind === 'vault-reveal' ? 'Vault Reveal' : 'Living Nexus';
    feedback.querySelector('[data-eon-city-feedback-title]').textContent = String(reaction.label || 'Command Core updated');
    const detail = reaction.awardedXp ? `+${Number(reaction.awardedXp)} City XP${reaction.revealProgress ? ` · +${Number(reaction.revealProgress)} Reveal progress` : ''}` : reaction.ringId ? `${String(reaction.ringId)} ring · actual projected state` : 'Verified local update';
    feedback.querySelector('[data-eon-city-feedback-detail]').textContent = detail;
    feedback.hidden = false;
    feedback.removeAttribute('hidden');
    feedbackTimer = globalThis.setTimeout?.(() => { feedback.hidden = true; feedback.setAttribute('hidden', ''); feedbackTimer = null; }, Math.max(1800, Math.min(6000, Number(reaction.durationMs || 3600)))) ?? null;
    return true;
  };
  const markButtonResponse = (button, label = 'Opening') => {
    if (!button) return;
    button.dataset.eonCityActionState = 'responding';
    button.setAttribute('aria-busy', 'true');
    button.dataset.eonCityActionLabel = String(label || 'Opening').slice(0, 64);
    globalThis.setTimeout?.(() => {
      if (!button?.isConnected) return;
      delete button.dataset.eonCityActionState;
      delete button.dataset.eonCityActionLabel;
      button.removeAttribute('aria-busy');
    }, 520);
  };
  session.append(labels, prompt, feedback);

  const makeLauncher = (label, datasetKey, ariaLabel = label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset[datasetKey] = '1';
    button.textContent = label;
    button.setAttribute('aria-label', ariaLabel);
    return button;
  };
  const exploreLauncher = makeLauncher('Explore', 'eonCityExploreOpen', 'Explore EON Open Worlds');
  const menuLauncher = makeLauncher('Menu', 'eonCityMenuOpen', 'Open EON City Menu');
  const eonbotLauncher = makeLauncher('EONBOT', 'eonCityEonbotOpen', 'Open EONBOT work chat');
  for (const launcher of [exploreLauncher, menuLauncher, eonbotLauncher]) launcher.dataset.eonCityRuntimeLauncher = 'l95';
  eonbotLauncher.dataset.eonCityPersistentWorkLauncher = 'true';
  const actions = session.querySelector('.eon-city-reduced-actions,.eon-play-hud-actions');
  actions?.querySelectorAll?.('[data-eon-city-runtime-launcher]')?.forEach?.((node) => node.remove());
  actions?.prepend(exploreLauncher, menuLauncher, eonbotLauncher);

  // A fixed menu must live under body. Keeping it inside the canvas session
  // allowed ancestor overflow/stacking contexts to swallow real browser clicks.
  document.querySelectorAll('body > [data-eon-city-command-menu]').forEach((node) => node.remove());
  const menu = document.createElement('section');
  menu.className = 'eon-city-command-menu';
  menu.dataset.eonCityCommandMenu = '1';
  menu.dataset.eonCityRuntimeOwner = 'w737';
  menu.hidden = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-hidden', 'true');
  menu.setAttribute('inert', '');
  try { menu.inert = true; } catch {}
  menu.setAttribute('aria-labelledby', 'eon-city-command-menu-title');
  const stationCards = EON_CITY_W731_STATIONS.map((station) => `<article data-eon-city-menu-station="${safeText(station.id)}"><div><small>${station.zone === 'command-centre' ? 'Command Centre' : 'Exterior destination'}</small><strong>${safeText(station.label)}</strong><p>${safeText(station.description)}</p></div><div><button type="button" data-eon-city-menu-guide="${safeText(station.id)}">Go there</button><button type="button" data-eon-city-menu-open-surface="${safeText(station.id)}">Open</button></div></article>`).join('');
  menu.innerHTML = `<div class="eon-city-command-menu-card eon-city-command-menu__dialog"><header><div><p>EON City</p><h2 id="eon-city-command-menu-title">Explore worlds or open Command Hub operations</h2><span>Open Worlds are the flagship experience. Command Hub work remains one tap away without competing with exploration.</span></div><div class="eon-city-surface-actions"><button type="button" data-eon-city-menu-minimize aria-label="Minimize City Menu">Minimize</button><button type="button" data-eon-city-menu-close aria-label="Close City Menu">×</button></div></header><nav class="eon-city-command-menu-quick" aria-label="Command Hub operations" data-eon-city-menu-order="${safeText(EON_CITY_W763_MENU_ORDER.join('|'))}"><button type="button" data-eon-city-quick="nexus">Living Nexus</button><button type="button" data-eon-city-quick="missions">Mission Board</button><button type="button" data-eon-city-quick="monitors">Live Monitors</button><button type="button" data-eon-city-quick="share">Share Command Center</button><button type="button" data-eon-city-quick="capture">Creator Capture</button><button type="button" data-eon-city-quick="plans">Plans &amp; Access</button><button type="button" data-eon-city-quick="accessible-map">Accessible Map</button></nav><section class="eon-city-command-menu-featured eon-city-command-menu-worlds" aria-label="EON Open Worlds"><article data-eon-city-featured="signal-frontier"><img class="eon-city-world-art" src="/assets/city/art/rt92/world-signal-frontier.svg" alt="" width="1200" height="675" loading="lazy" decoding="async"><div><small>Recommended first · guided restoration story</small><strong>Signal Frontier</strong><p>Restore the signal network, discover five distinct zones and unlock deeper story/transit rewards. My Frontier is already available if you want to build first.</p></div><div><button type="button" data-eon-city-menu-open-world>Open Signal Frontier</button></div></article><article data-eon-city-featured="storm-sector" data-eon-city-world-status="available"><img class="eon-city-world-art" src="/assets/city/art/rt92/world-storm-sector.svg" alt="" width="1200" height="675" loading="lazy" decoding="async"><div><small>Atmospheric world · available for direct review</small><strong>Storm Sector</strong><p>Electrical storms, charged fog, rescue missions and industrial restoration. Availability is tied only to its own certified build—not Signal completion. Direct review grants no certification, XP or progression.</p></div><div><button type="button" data-eon-city-menu-open-storm>Open Storm Sector</button></div></article><article data-eon-city-featured="my-frontier" data-eon-city-world-status="available-from-start"><img class="eon-city-world-art" src="/assets/city/art/rt92/world-my-frontier.svg" alt="" width="1200" height="675" loading="lazy" decoding="async"><div><small>Available now · personal build world</small><strong>My Frontier</strong><p>Start building immediately in fixed safe plots, explore public infrastructure and choose your world theme. Advanced construction/rewards remain receipt-protected.</p></div><div><button type="button" data-eon-city-menu-open-my-frontier>Open My Frontier</button></div></article></section><div class="eon-city-command-menu-body"><aside class="eon-city-command-missions"><div><small>Current progression</small><h3>One clear next objective</h3><p data-eon-city-mission-summary></p><button type="button" data-eon-city-menu-open-reveal hidden>Open deterministic Vault Reveal</button></div><div data-eon-city-mission-list></div></aside><section class="eon-city-command-menu-stations" aria-label="Command Hub stations"><header><small>Command Hub</small><strong>Productive stations</strong></header><div class="eon-city-command-menu-grid">${stationCards}</div></section></div><footer class="eon-city-command-menu__actions"><button type="button" data-eon-city-menu-review-transit>Transit</button><button type="button" data-eon-city-menu-open-readiness>City Readiness</button><button type="button" data-eon-city-menu-resume>Resume</button><button type="button" data-eon-city-menu-reset>Orientation Core</button><button type="button" data-eon-city-menu-restart>Restart 3D</button><a href="/" data-eon-city-menu-exit>Exit City</a><span>Explore is primary. Operations stay available without crowding the playfield.</span></footer></div>`;
  document.body.append(menu);

  document.querySelectorAll('body > [data-eon-city-transit-review]').forEach((node) => node.remove());
  const transitReview = document.createElement('section');
  transitReview.className = 'eon-city-transit-review-dialog';
  transitReview.dataset.eonCityTransitReview = '1';
  transitReview.hidden = true;
  transitReview.setAttribute('role', 'dialog');
  transitReview.setAttribute('aria-modal', 'true');
  transitReview.setAttribute('aria-hidden', 'true');
  transitReview.setAttribute('inert', '');
  try { transitReview.inert = true; } catch {}
  transitReview.setAttribute('aria-labelledby', 'eon-city-transit-review-title');
  transitReview.innerHTML = `<article><header><div><small>Review-first travel</small><h2 id="eon-city-transit-review-title">EON Transit Capsule</h2><p>Choose a destination, then explicitly board the visible capsule ride or skip the ride. No route, private data or work opens automatically.</p></div><div class="eon-city-surface-actions"><button type="button" data-eon-city-transit-minimize aria-label="Minimize Transit review">Minimize</button><button type="button" data-eon-city-transit-close aria-label="Close Transit review">×</button></div></header><label>Destination<select data-eon-city-transit-destination></select></label><div data-eon-city-transit-detail role="status"></div><footer><button type="button" data-eon-city-transit-board>Board Capsule</button><button type="button" data-eon-city-transit-skip>Skip ride</button><button type="button" data-eon-city-transit-cancel>Cancel</button></footer></article>`;
  document.body.append(transitReview);
  const transitSelect = transitReview.querySelector('[data-eon-city-transit-destination]');
  const transitDetail = transitReview.querySelector('[data-eon-city-transit-detail]');
  let transitReviewToken = '';
  let transitLastFocus = null;
  const renderTransitDestinations = () => {
    const destinations = typeof getTransitDestinations === 'function' ? getTransitDestinations() : [];
    if (!transitSelect) return destinations;
    transitSelect.innerHTML = destinations.map((entry) => `<option value="${safeText(entry.id)}">${safeText(entry.label || entry.id)}</option>`).join('');
    return destinations;
  };
  const closeTransitReview = ({ cancel = false, reason = cancel ? 'explicit-cancel' : 'completed', restoreFocus = true, successorOwnerId = '' } = {}) => {
    const wasOpen = !transitReview.hidden;
    updateSurfaceLifecycle('transitReview', { transitionActive: true, successorOwnerId });
    if (cancel && transitReviewToken) onCancelTransit?.({ explicitUserAction: true });
    const released = releaseUiLease('transit-review', reason);
    if (!released.ok) {
      updateSurfaceLifecycle('transitReview', { logicalOpen: wasOpen, transitionActive: false, successorOwnerId: '' });
      if (transitDetail) transitDetail.textContent = `Transit review could not release movement safely: ${String(released.reason || 'unknown error')}.`;
      return released;
    }
    transitReviewToken = '';
    const returnTarget = restoreFocus && transitLastFocus?.isConnected ? transitLastFocus : restoreFocus ? menuLauncher : session.querySelector?.('canvas');
    focusOutsideSurfaceBeforeHide(transitReview, returnTarget, menuLauncher);
    setMaintainedDialogOpen(transitReview, false);
    document.body.classList.remove('eon-city-transit-review-open');
    session.classList.remove('eon-city-transit-review-open');
    labels.hidden = false;
    updateSurfaceLifecycle('transitReview', { logicalOpen: false, transitionActive: Boolean(successorOwnerId), successorOwnerId });
    surfaceManager?.noteClosed?.('transit-review', reason);
    transitLastFocus = null;
    return freeze({ ok: true, state: wasOpen ? 'closed' : 'already-closed', reason, released: Number(released.released || 0) });
  };
  const minimizeTransitReview = () => {
    if (transitReview.hidden) return freeze({ ok: false, reason: 'transit-review-not-visible' });
    const released = releaseUiLease('transit-review', 'surface-minimized');
    if (!released.ok) return released;
    focusOutsideSurfaceBeforeHide(transitReview, session.querySelector?.('canvas'), menuLauncher);
    setMaintainedDialogOpen(transitReview, false);
    document.body.classList.remove('eon-city-transit-review-open');
    session.classList.remove('eon-city-transit-review-open');
    labels.hidden = false;
    updateSurfaceLifecycle('transitReview', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    return freeze({ ok: true, state: 'minimized' });
  };
  const restoreTransitReview = () => {
    if (!transitReview.hidden) return freeze({ ok: true, state: 'already-visible' });
    const acquired = acquireUiLease('transit-review', { source: 'transit-review', reason: 'surface-restored' });
    if (!acquired.ok) return acquired;
    setMaintainedDialogOpen(transitReview, true);
    document.body.classList.add('eon-city-transit-review-open');
    session.classList.add('eon-city-transit-review-open');
    labels.hidden = true;
    updateSurfaceLifecycle('transitReview', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    globalThis.requestAnimationFrame?.(() => transitSelect?.focus?.({ preventScroll: true }));
    return freeze({ ok: true, state: 'restored' });
  };
  const requestSelectedTransit = () => {
    const destinationId = String(transitSelect?.value || '');
    let result;
    try {
      result = onRequestTransit?.(destinationId, { explicitUserAction: true, fromDistrictId: 'orientation-hall' }) || { ok: false, reason: 'transit-unavailable' };
    } catch (error) {
      result = freeze({ ok: false, reason: String(error?.message || error || 'transit-request-failed') });
    }
    transitReviewToken = result.ok ? String(result.token || '') : '';
    if (transitDetail) {
      transitDetail.textContent = result.ok
        ? `${result.destination?.label || destinationId} is ready for explicit confirmation. Choose Board Capsule, Skip ride or Cancel.`
        : `Transit review unavailable: ${String(result.reason || 'unknown error')}.`;
    }
    return result;
  };
  const openTransitReview = (trigger = null) => {
    if (!transitReview.hidden) return freeze({ ok: true, state: 'already-open' });
    const surfaceLease = surfaceManager?.requestOpen?.('transit-review', { reason: 'transit-review-open' }) || freeze({ ok: true });
    if (!surfaceLease.ok) return freeze({ ok: false, reason: surfaceLease.reason || 'blocking-surface-active' });
    updateSurfaceLifecycle('transitReview', { logicalOpen: false, transitionActive: true, successorOwnerId: '' });
    const acquired = acquireUiLease('transit-review', { source: 'transit-review', reason: 'explicit-open' });
    if (!acquired.ok) {
      surfaceManager?.noteClosed?.('transit-review', 'input-lock-failed');
      updateSurfaceLifecycle('transitReview', { logicalOpen: false, transitionActive: false, successorOwnerId: '' });
      onStatus?.(`Transit review could not open safely: ${String(acquired.reason || 'input lock unavailable')}.`);
      return acquired;
    }
    transitLastFocus = trigger;
    const destinations = renderTransitDestinations();
    if (!destinations.length) { if (transitDetail) transitDetail.textContent = 'No reviewed destinations are available.'; }
    setMaintainedDialogOpen(transitReview, true);
    document.body.classList.add('eon-city-transit-review-open');
    session.classList.add('eon-city-transit-review-open');
    labels.hidden = true;
    requestSelectedTransit();
    updateSurfaceLifecycle('transitReview', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    globalThis.requestAnimationFrame?.(() => transitSelect?.focus?.({ preventScroll: true }));
    return freeze({ ok: true, state: 'TRANSIT_REVIEW' });
  };
  const confirmTransitChoice = (choice, trigger) => {
    if (!transitReviewToken) requestSelectedTransit();
    let result;
    try {
      result = onConfirmTransit?.(transitReviewToken, { explicitUserAction: true, choice }) || { ok: false, reason: 'transit-unavailable' };
    } catch (error) {
      result = freeze({ ok: false, reason: String(error?.message || error || 'transit-confirmation-failed') });
    }
    if (!result.ok) { if (transitDetail) transitDetail.textContent = `Transit could not start: ${String(result.reason || 'unknown error')}.`; return result; }
    if (transitDetail) {
      transitDetail.textContent = choice === 'skip'
        ? `Accessible skip confirmed for ${result.destination?.label || 'the destination'}.`
        : `Capsule boarding confirmed for ${result.destination?.label || 'the destination'}.`;
    }
    markButtonResponse(trigger, choice === 'skip' ? 'Skipping ride' : 'Boarding Capsule');
    const closed = closeTransitReview({ cancel: false, reason: `transit-${choice}-confirmed`, restoreFocus: false });
    if (!closed.ok) return closed;
    session.querySelector?.('canvas')?.focus?.({ preventScroll: true });
    return freeze({ ...result, reviewClosed: true });
  };
  transitSelect?.addEventListener('change', requestSelectedTransit);
  transitReview.querySelector('[data-eon-city-transit-minimize]')?.addEventListener('click', () => surfaceManager?.minimize?.('transit-review', { reason: 'minimize-button' }));
  transitReview.querySelector('[data-eon-city-transit-close]')?.addEventListener('click', () => closeTransitReview({ cancel: true, reason: 'close-button' }));
  transitReview.querySelector('[data-eon-city-transit-cancel]')?.addEventListener('click', () => closeTransitReview({ cancel: true, reason: 'cancel-button' }));
  transitReview.querySelector('[data-eon-city-transit-board]')?.addEventListener('click', (event) => confirmTransitChoice('board', event.currentTarget));
  transitReview.querySelector('[data-eon-city-transit-skip]')?.addEventListener('click', (event) => confirmTransitChoice('skip', event.currentTarget));
  transitReview.addEventListener('pointerdown', (event) => event.stopPropagation());

  document.querySelectorAll('body > [data-eon-city-expanse-review]').forEach((node) => node.remove());
  const expanseReview = document.createElement('section');
  expanseReview.className = 'eon-city-expanse-review-dialog';
  expanseReview.dataset.eonCityExpanseReview = '1';
  expanseReview.hidden = true;
  expanseReview.setAttribute('role', 'dialog');
  expanseReview.setAttribute('aria-modal', 'true');
  expanseReview.setAttribute('aria-hidden', 'true');
  expanseReview.setAttribute('inert', '');
  try { expanseReview.inert = true; } catch {}
  expanseReview.setAttribute('aria-labelledby', 'eon-city-expanse-review-title');
  expanseReview.innerHTML = `<article><header><div><small>Review-first world transition</small><h2 id="eon-city-expanse-review-title">Enter Open World — Signal Frontier?</h2><p>Signal Frontier mounts inside the current Babylon Engine, Scene and render loop. Nothing opens until you explicitly confirm.</p></div><div class="eon-city-surface-actions"><button type="button" data-eon-city-expanse-minimize aria-label="Minimize Signal Frontier entry review">Minimize</button><button type="button" data-eon-city-expanse-close aria-label="Close Signal Frontier entry review">×</button></div></header><dl><div><dt>Arrival</dt><dd>Gateway Overlook inside Signal Frontier</dd></div><div><dt>Runtime</dt><dd data-eon-city-expanse-runtime>Same Engine, Scene and player authority</dd></div><div><dt>Offline</dt><dd data-eon-city-expanse-offline>Checking installed coverage…</dd></div></dl><div data-eon-city-expanse-detail role="status" aria-live="polite"></div><footer><button type="button" data-eon-city-expanse-enter>Enter Signal Frontier</button><button type="button" data-eon-city-expanse-cancel>Cancel</button></footer></article>`;
  document.body.append(expanseReview);
  const expanseDetail = expanseReview.querySelector('[data-eon-city-expanse-detail]');
  const expanseOffline = expanseReview.querySelector('[data-eon-city-expanse-offline]');
  const expanseRuntime = expanseReview.querySelector('[data-eon-city-expanse-runtime]');
  let expanseReviewLastFocus = null;
  const renderExpanseReview = () => {
    const review = typeof getExpanseGateReview === 'function' ? getExpanseGateReview() : {};
    const identity = review?.runtimeIdentity || {};
    if (expanseRuntime) {
      expanseRuntime.textContent = identity?.engineId && identity?.sceneId
        ? `Preserves ${identity.engineId} and ${identity.sceneId}`
        : 'Preserves the current Engine, Scene and render loop';
    }
    if (expanseOffline) {
      expanseOffline.textContent = review?.offlinePackState === 'installed-and-verified'
        ? 'Installed and verified for offline entry'
        : review?.online === false
          ? 'Full Signal Frontier offline coverage is not yet certified; entry may be unavailable offline'
          : 'Online entry is available; full offline Signal Frontier coverage is not yet certified';
    }
    if (expanseDetail) expanseDetail.textContent = 'Choose Enter Signal Frontier to load Gateway Overlook, or Cancel to remain exactly where you are.';
    return review;
  };
  const hideExpanseReview = ({ restoreFocus = true, reason = 'completed', successorOwnerId = '' } = {}) => {
    const wasOpen = !expanseReview.hidden;
    updateSurfaceLifecycle('expanseReview', { transitionActive: true, successorOwnerId });
    const released = releaseUiLease('expanse-entry-review', reason);
    if (!released.ok) {
      updateSurfaceLifecycle('expanseReview', { logicalOpen: wasOpen, transitionActive: false, successorOwnerId: '' });
      if (expanseDetail) expanseDetail.textContent = `Signal Frontier review could not release movement safely: ${String(released.reason || 'unknown error')}.`;
      return released;
    }
    const returnTarget = restoreFocus && expanseReviewLastFocus?.isConnected ? expanseReviewLastFocus : session.querySelector?.('canvas');
    focusOutsideSurfaceBeforeHide(expanseReview, returnTarget, session.querySelector?.('canvas'));
    setMaintainedDialogOpen(expanseReview, false);
    document.body.classList.remove('eon-city-expanse-review-open');
    session.classList.remove('eon-city-expanse-review-open');
    labels.hidden = false;
    updateSurfaceLifecycle('expanseReview', { logicalOpen: false, transitionActive: Boolean(successorOwnerId), successorOwnerId });
    surfaceManager?.noteClosed?.('expanse-review', reason);
    expanseReviewLastFocus = null;
    return freeze({ ok: true, reason });
  };
  const minimizeExpanseReview = () => {
    if (expanseReview.hidden) return freeze({ ok: false, reason: 'expanse-review-not-visible' });
    const released = releaseUiLease('expanse-entry-review', 'surface-minimized');
    if (!released.ok) return released;
    focusOutsideSurfaceBeforeHide(expanseReview, session.querySelector?.('canvas'), session.querySelector?.('canvas'));
    setMaintainedDialogOpen(expanseReview, false);
    document.body.classList.remove('eon-city-expanse-review-open');
    session.classList.remove('eon-city-expanse-review-open');
    labels.hidden = false;
    updateSurfaceLifecycle('expanseReview', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    return freeze({ ok: true, state: 'minimized' });
  };
  const restoreExpanseReview = () => {
    if (!expanseReview.hidden) return freeze({ ok: true, state: 'already-visible' });
    const acquired = acquireUiLease('expanse-entry-review', { source: 'expanse-gate', reason: 'surface-restored' });
    if (!acquired.ok) return acquired;
    setMaintainedDialogOpen(expanseReview, true);
    document.body.classList.add('eon-city-expanse-review-open');
    session.classList.add('eon-city-expanse-review-open');
    labels.hidden = true;
    updateSurfaceLifecycle('expanseReview', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    globalThis.requestAnimationFrame?.(() => expanseReview.querySelector('[data-eon-city-expanse-enter]')?.focus?.({ preventScroll: true }));
    return freeze({ ok: true, state: 'restored' });
  };
  const closeExpanseReview = ({ cancel = true, reason = 'explicit-cancel', restoreFocus = true } = {}) => {
    const wasOpen = !expanseReview.hidden;
    if (cancel && wasOpen) {
      const result = onCancelExpanse?.({ explicitUserAction: true, reason }) || freeze({ ok: false, reason: 'expanse-cancel-unavailable' });
      if (!result.ok && result.reason !== 'review-not-active') {
        if (expanseDetail) expanseDetail.textContent = `Signal Frontier review could not close safely: ${String(result.reason || 'unknown error')}.`;
        return result;
      }
    }
    const hidden = hideExpanseReview({ restoreFocus, reason });
    return hidden.ok ? freeze({ ok: true, state: wasOpen ? 'COMMAND_HUB' : 'already-closed', reason }) : hidden;
  };
  const openExpanseReview = (trigger = null) => {
    if (!expanseReview.hidden) { renderExpanseReview(); return freeze({ ok: true, state: 'EXPANSE_ENTRY_REVIEW', alreadyOpen: true }); }
    const surfaceLease = surfaceManager?.requestOpen?.('expanse-review', { reason: 'expanse-review-open' }) || freeze({ ok: true });
    if (!surfaceLease.ok) return freeze({ ok: false, reason: surfaceLease.reason || 'blocking-surface-active' });
    updateSurfaceLifecycle('expanseReview', { logicalOpen: false, transitionActive: true, successorOwnerId: '' });
    const acquired = acquireUiLease('expanse-entry-review', { source: 'expanse-gate', reason: 'explicit-open' });
    if (!acquired.ok) {
      surfaceManager?.noteClosed?.('expanse-review', 'input-lock-failed');
      updateSurfaceLifecycle('expanseReview', { logicalOpen: false, transitionActive: false, successorOwnerId: '' });
      onStatus?.(`Signal Frontier entry review could not open safely: ${String(acquired.reason || 'input lock unavailable')}.`);
      return acquired;
    }
    let result;
    try {
      result = onReviewExpanseGate?.({ explicitUserAction: true, trigger }) || freeze({ ok: false, reason: 'expanse-review-unavailable' });
    } catch (error) {
      result = freeze({ ok: false, reason: String(error?.message || error || 'expanse-review-failed') });
    }
    if (!result.ok) {
      releaseUiLease('expanse-entry-review', 'review-controller-rejected');
      surfaceManager?.noteClosed?.('expanse-review', 'review-controller-rejected');
      updateSurfaceLifecycle('expanseReview', { logicalOpen: false, transitionActive: false, successorOwnerId: '' });
      onStatus?.(`Signal Frontier entry review unavailable: ${String(result.reason || 'unknown error')}.`);
      return result;
    }
    expanseReviewLastFocus = trigger;
    renderExpanseReview();
    setMaintainedDialogOpen(expanseReview, true);
    document.body.classList.add('eon-city-expanse-review-open');
    session.classList.add('eon-city-expanse-review-open');
    labels.hidden = true;
    updateSurfaceLifecycle('expanseReview', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    globalThis.requestAnimationFrame?.(() => expanseReview.querySelector('[data-eon-city-expanse-enter]')?.focus?.({ preventScroll: true }));
    return result;
  };
  const enterExpanseFromReview = (trigger = null) => {
    if (expanseDetail) expanseDetail.textContent = 'Loading Signal Frontier in the current Scene…';
    let result;
    try {
      result = onEnterExpanse?.({ explicitUserAction: true, trigger }) || freeze({ ok: false, reason: 'expanse-entry-unavailable' });
    } catch (error) {
      result = freeze({ ok: false, reason: String(error?.message || error || 'expanse-entry-failed') });
    }
    if (!result.ok) {
      if (expanseDetail) expanseDetail.textContent = `Signal Frontier entry could not start: ${String(result.reason || 'unknown error')}.`;
      return result;
    }
    markButtonResponse(trigger, 'Entering Signal Frontier');
    const hidden = hideExpanseReview({ restoreFocus: false, reason: 'entry-confirmed' });
    if (!hidden.ok) return hidden;
    session.querySelector?.('canvas')?.focus?.({ preventScroll: true });
    return result;
  };
  expanseReview.querySelector('[data-eon-city-expanse-minimize]')?.addEventListener('click', () => surfaceManager?.minimize?.('expanse-review', { reason: 'minimize-button' }));
  expanseReview.querySelector('[data-eon-city-expanse-close]')?.addEventListener('click', () => closeExpanseReview({ cancel: true, reason: 'close-button' }));
  expanseReview.querySelector('[data-eon-city-expanse-cancel]')?.addEventListener('click', () => closeExpanseReview({ cancel: true, reason: 'cancel-button' }));
  expanseReview.querySelector('[data-eon-city-expanse-enter]')?.addEventListener('click', (event) => enterExpanseFromReview(event.currentTarget));
  expanseReview.addEventListener('pointerdown', (event) => event.stopPropagation());

  let lastFocus = null;
  const menuFocusable = () => [...menu.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
  const renderMissions = () => {
    const list = menu.querySelector('[data-eon-city-mission-list]');
    const summary = menu.querySelector('[data-eon-city-mission-summary]');
    const revealButton = menu.querySelector('[data-eon-city-menu-open-reveal]');
    if (!list) return;
    const missionView = typeof getMissionView === 'function' ? getMissionView() : {};
    const missions = Array.isArray(missionView?.missions) ? missionView.missions : Array.isArray(missionView) ? missionView : [];
    if (summary) {
      const flagshipCount = Number(missionView?.rt91AvailableCount || 0);
      summary.textContent = `${Number(missionView?.xp || 0)} City XP · ${Number(missionView?.claimedCount || 0)} claimed · ${Number(missionView?.claimableCount || 0)} ready · ${Number(missionView?.pendingReveals || 0)} reveals${flagshipCount > 0 ? ` · ${flagshipCount} flagship` : ''}`;
    }
    if (revealButton) {
      revealButton.hidden = !(Number(missionView?.pendingReveals || 0) > 0 && missionView?.nextReveal);
      revealButton.textContent = missionView?.nextReveal ? `Reveal ${missionView.nextReveal.label}` : 'Open deterministic Vault Reveal';
    }
    list.innerHTML = missions.map((mission) => {
      const state = String(mission.state || mission.localState || 'available');
      const stateCopy = state === 'claimed' ? 'Verified mission claimed'
        : state === 'verified-ready' ? 'Genuine native receipt ready for explicit claim'
          : state === 'in-progress' ? 'Continue the maintained work surface and return with its native receipt'
            : state === 'blocked' ? 'Native proof is unavailable or cancelled'
              : 'Available';
      const guideLabel = mission.discoveryId && state === 'available' ? 'Find discovery' : (mission.actionLabel || 'Go to station');
      const claim = mission.claimable
        ? `<button type="button" data-eon-city-mission-claim="${safeText(mission.stationId)}">Claim +${Number(mission.xpReward || 0)} XP</button>`
        : mission.claimed ? '<button type="button" disabled>Claimed</button>' : '';
      return `<article data-eon-city-mission="${safeText(mission.id)}" data-state="${safeText(state)}"><div><span>${safeText(mission.category || 'Productive')}</span><strong>${safeText(mission.title)}</strong><p>${safeText(mission.summary)}</p><small>${safeText(stateCopy)}</small></div><div><button type="button" data-eon-city-mission-guide="${safeText(mission.id)}">${safeText(guideLabel)}</button>${claim}</div></article>`;
    }).join('');
  };
  const renderOpenWorldAvailability = () => {
    const availability = typeof getOpenWorldAvailability === 'function' ? getOpenWorldAvailability() : null;
    const signalCard = menu.querySelector('[data-eon-city-featured="signal-frontier"]');
    const signalButton = menu.querySelector('[data-eon-city-menu-open-world]');
    const stormCard = menu.querySelector('[data-eon-city-featured="storm-sector"]');
    const stormButton = menu.querySelector('[data-eon-city-menu-open-storm]');
    const myFrontierCard = menu.querySelector('[data-eon-city-featured="my-frontier"]');
    const myFrontierButton = menu.querySelector('[data-eon-city-menu-open-my-frontier]');
    const activeRegion = uiWorldMode === 'EXPANSE_ACTIVE' ? String(getActiveWorldRegion?.() || 'signal-frontier') : '';
    const markCurrentWorld = (card, button, regionId, defaultLabel) => {
      const current = activeRegion === regionId;
      if (card) card.dataset.eonCityWorldCurrent = current ? 'true' : 'false';
      if (button && current) {
        button.disabled = true;
        button.textContent = 'Current world';
        button.setAttribute('aria-current', 'location');
      } else if (button) {
        button.textContent = defaultLabel;
        button.removeAttribute('aria-current');
      }
      return current;
    };
    const signalCurrent = markCurrentWorld(signalCard, signalButton, 'signal-frontier', 'Open Signal Frontier');
    const stormAvailable = availability?.stormSector?.available === true;
    const stormOwnerReview = availability?.stormSector?.ownerReview === true;
    if (stormCard) stormCard.dataset.eonCityWorldStatus = stormOwnerReview ? 'owner-review' : stormAvailable ? 'available' : 'certification-pending';
    const stormCurrent = markCurrentWorld(stormCard, stormButton, 'storm-sector', stormOwnerReview ? 'Review Storm Sector' : stormAvailable ? 'Open Storm Sector' : 'Certification pending');
    if (stormButton && !stormCurrent) {
      stormButton.disabled = !stormAvailable;
      stormButton.textContent = stormOwnerReview ? 'Review Storm Sector' : stormAvailable ? 'Open Storm Sector' : 'Certification pending';
      stormButton.setAttribute('aria-disabled', stormAvailable ? 'false' : 'true');
    } else if (stormButton) stormButton.setAttribute('aria-disabled', 'true');
    if (stormButton) stormButton.dataset.eonCityOwnerReview = stormOwnerReview ? 'true' : 'false';
    const frontierAvailable = availability?.myFrontier?.available === true;
    if (myFrontierCard) myFrontierCard.dataset.eonCityWorldStatus = frontierAvailable ? 'available' : 'unavailable';
    const frontierCurrent = markCurrentWorld(myFrontierCard, myFrontierButton, 'my-frontier', frontierAvailable ? 'Open My Frontier' : 'My Frontier unavailable');
    if (myFrontierButton && !frontierCurrent) {
      myFrontierButton.disabled = !frontierAvailable;
      myFrontierButton.textContent = frontierAvailable ? 'Open My Frontier' : 'My Frontier unavailable';
      myFrontierButton.setAttribute('aria-disabled', frontierAvailable ? 'false' : 'true');
    } else if (myFrontierButton) myFrontierButton.setAttribute('aria-disabled', 'true');
    if (signalButton) signalButton.setAttribute('aria-disabled', signalCurrent ? 'true' : 'false');
    if (productRoot?.dataset) {
      productRoot.dataset.eonCityStormAvailable = stormAvailable ? 'true' : 'false';
      productRoot.dataset.eonCityStormOwnerReview = stormOwnerReview ? 'true' : 'false';
      productRoot.dataset.eonCityStormReviewOnly = availability?.stormSector?.reviewOnly === true ? 'true' : 'false';
      productRoot.dataset.eonCityStormReason = String(availability?.stormSector?.reason || '');
      productRoot.dataset.eonCityStormMenuState = String(stormCard?.dataset?.eonCityWorldStatus || 'unknown');
      productRoot.dataset.eonCityStormButtonDisabled = stormButton?.disabled === true ? 'true' : 'false';
      productRoot.dataset.eonCityStormButtonLabel = String(stormButton?.textContent || '');
      productRoot.dataset.eonCityMyFrontierAvailable = frontierAvailable ? 'true' : 'false';
      productRoot.dataset.eonCityMyFrontierReason = String(availability?.myFrontier?.reason || '');
      productRoot.dataset.eonCityMyFrontierButtonDisabled = myFrontierButton?.disabled === true ? 'true' : 'false';
    }
    return availability;
  };
  const openMenu = (trigger = menuLauncher) => {
    const openWorldSwitcher = uiWorldMode === 'EXPANSE_ACTIVE' && menu.dataset.eonCityMenuMode === 'explore';
    if (uiWorldMode === 'EXPANSE_ACTIVE' && !openWorldSwitcher) { onStatus?.('Use Worlds or EONBOT while exploring. Command Hub operations remain available after you return.'); return false; }
    if (!menu.isConnected) return false;
    if (!menu.hidden) return true;
    const surfaceLease = surfaceManager?.requestOpen?.('city-menu', { reason: 'city-menu-open' }) || freeze({ ok: true });
    if (!surfaceLease.ok) { onStatus?.(`City Menu could not open because ${String(surfaceLease.reason || 'another blocking surface is active')}.`); return false; }
    updateSurfaceLifecycle('cityMenu', { logicalOpen: false, transitionActive: true, successorOwnerId: '' });
    const acquired = acquireUiLease('city-menu', { source: 'city-menu', reason: 'explicit-open' });
    if (!acquired.ok) {
      surfaceManager?.noteClosed?.('city-menu', 'input-lock-failed');
      updateSurfaceLifecycle('cityMenu', { logicalOpen: false, transitionActive: false, successorOwnerId: '' });
      onStatus?.(`City Menu could not open safely: ${String(acquired.reason || 'input lock unavailable')}.`);
      return false;
    }
    lastFocus = trigger;
    try {
      renderMissions();
    renderOpenWorldAvailability();
    } catch (error) {
      releaseUiLease('city-menu', 'menu-render-failed');
      surfaceManager?.noteClosed?.('city-menu', 'menu-render-failed');
      updateSurfaceLifecycle('cityMenu', { logicalOpen: false, transitionActive: false, successorOwnerId: '' });
      lastFocus = null;
      onStatus?.(`City Menu could not render safely: ${String(error?.message || error || 'menu-render-failed')}. Movement remains available.`);
      return false;
    }
    setMaintainedDialogOpen(menu, true, { display: 'grid' });
    document.body.classList.add('eon-city-command-menu-body-open');
    session.classList.add('eon-city-command-menu-open');
    labels.hidden = true;
    menuLauncher.setAttribute('aria-expanded', 'true');
    exploreLauncher.setAttribute('aria-expanded', 'true');
    updateSurfaceLifecycle('cityMenu', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    globalThis.requestAnimationFrame?.(() => menu.querySelector('[data-eon-city-menu-close]')?.focus?.({ preventScroll: true }));
    return true;
  };
  const closeMenu = (reason = 'explicit-close', { restoreFocus = true, successorOwnerId = '' } = {}) => {
    const wasOpen = !menu.hidden;
    updateSurfaceLifecycle('cityMenu', { transitionActive: true, successorOwnerId });
    const released = releaseUiLease('city-menu', reason);
    if (!released.ok) {
      updateSurfaceLifecycle('cityMenu', { logicalOpen: wasOpen, transitionActive: false, successorOwnerId: '' });
      onStatus?.(`City Menu could not release movement safely: ${String(released.reason || 'unknown error')}.`);
      return false;
    }
    const returnTarget = restoreFocus && lastFocus?.isConnected ? lastFocus : restoreFocus ? menuLauncher : session.querySelector?.('canvas');
    focusOutsideSurfaceBeforeHide(menu, returnTarget, menuLauncher);
    setMaintainedDialogOpen(menu, false, { display: 'grid' });
    document.body.classList.remove('eon-city-command-menu-body-open');
    session.classList.remove('eon-city-command-menu-open');
    labels.hidden = false;
    menuLauncher.setAttribute('aria-expanded', 'false');
    exploreLauncher.setAttribute('aria-expanded', 'false');
    updateSurfaceLifecycle('cityMenu', { logicalOpen: false, transitionActive: Boolean(successorOwnerId), successorOwnerId });
    surfaceManager?.noteClosed?.('city-menu', reason);
    lastFocus = null;
    return wasOpen || released.ok;
  };
  const minimizeMenu = () => {
    if (menu.hidden) return freeze({ ok: false, reason: 'city-menu-not-visible' });
    const released = releaseUiLease('city-menu', 'surface-minimized');
    if (!released.ok) return released;
    focusOutsideSurfaceBeforeHide(menu, session.querySelector?.('canvas'), menuLauncher);
    setMaintainedDialogOpen(menu, false, { display: 'grid' });
    document.body.classList.remove('eon-city-command-menu-body-open');
    session.classList.remove('eon-city-command-menu-open');
    labels.hidden = false;
    menuLauncher.setAttribute('aria-expanded', 'false');
    exploreLauncher.setAttribute('aria-expanded', 'false');
    updateSurfaceLifecycle('cityMenu', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    return freeze({ ok: true, state: 'minimized' });
  };
  const restoreMenu = () => {
    if (!menu.hidden) return freeze({ ok: true, state: 'already-visible' });
    const acquired = acquireUiLease('city-menu', { source: 'city-menu', reason: 'surface-restored' });
    if (!acquired.ok) return acquired;
    setMaintainedDialogOpen(menu, true, { display: 'grid' });
    document.body.classList.add('eon-city-command-menu-body-open');
    session.classList.add('eon-city-command-menu-open');
    labels.hidden = true;
    menuLauncher.setAttribute('aria-expanded', 'true');
    exploreLauncher.setAttribute('aria-expanded', 'true');
    updateSurfaceLifecycle('cityMenu', { logicalOpen: true, transitionActive: false, successorOwnerId: '' });
    globalThis.requestAnimationFrame?.(() => menu.querySelector('[data-eon-city-menu-close]')?.focus?.({ preventScroll: true }));
    return freeze({ ok: true, state: 'restored' });
  };
  const handoffFromMenu = (reason, callback, successorOwnerId = '') => {
    const returnFocus = lastFocus?.isConnected ? lastFocus : menuLauncher;
    if (!closeMenu(reason, { restoreFocus: true, successorOwnerId })) return freeze({ ok: false, reason: 'city-menu-release-failed' });
    try {
      const result = typeof callback === 'function' ? callback(returnFocus) : freeze({ ok: true });
      if (result && typeof result === 'object' && result.ok === false) {
        onStatus?.(`City action could not start: ${String(result.reason || 'unknown error')}. Movement remains available.`);
      }
      updateSurfaceLifecycle('cityMenu', { logicalOpen: false, transitionActive: false, successorOwnerId: '' });
      return result && typeof result === 'object' ? result : freeze({ ok: result !== false });
    } catch (error) {
      updateSurfaceLifecycle('cityMenu', { logicalOpen: false, transitionActive: false, successorOwnerId: '' });
      const reasonText = String(error?.message || error || 'city-action-failed');
      onStatus?.(`City action could not start: ${reasonText}. Movement remains available.`);
      return freeze({ ok: false, reason: reasonText });
    }
  };
  const r03SurfaceRegistrations = [
    surfaceManager?.register?.('city-menu', { close: ({ reason = 'surface-handoff', successorId = '' } = {}) => ({ ok: closeMenu(reason, { restoreFocus: false, successorOwnerId: successorId }), reason }), minimize: minimizeMenu, restore: restoreMenu }),
    surfaceManager?.register?.('transit-review', { close: ({ reason = 'surface-handoff', successorId = '' } = {}) => closeTransitReview({ cancel: true, reason, restoreFocus: false, successorOwnerId: successorId }), minimize: minimizeTransitReview, restore: restoreTransitReview }),
    surfaceManager?.register?.('expanse-review', { close: ({ reason = 'surface-handoff' } = {}) => closeExpanseReview({ cancel: true, reason, restoreFocus: false }), minimize: minimizeExpanseReview, restore: restoreExpanseReview })
  ].filter(Boolean);

  exploreLauncher.setAttribute('aria-haspopup', 'dialog');
  exploreLauncher.setAttribute('aria-expanded', 'false');
  menuLauncher.setAttribute('aria-haspopup', 'dialog');
  menuLauncher.setAttribute('aria-expanded', 'false');
  const openWorlds = (trigger = exploreLauncher) => {
    menu.dataset.eonCityMenuMode = 'explore';
    markButtonResponse(trigger, 'Opening EON Open Worlds');
    const opened = openMenu(trigger);
    if (opened) globalThis.requestAnimationFrame?.(() => menu.querySelector('[data-eon-city-menu-open-world]')?.focus?.({ preventScroll: true }));
    return opened;
  };
  exploreLauncher.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openWorlds(event.currentTarget);
  });
  menuLauncher.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    menu.dataset.eonCityMenuMode = 'operations';
    markButtonResponse(event.currentTarget, 'Opening EON City Menu');
    openMenu(event.currentTarget);
  });
  eonbotLauncher.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    markButtonResponse(event.currentTarget, 'Opening EONBOT');
    const fromExpanse = uiWorldMode === 'EXPANSE_ACTIVE';
    const returnWorld = fromExpanse ? String(getActiveWorldRegion?.() || 'signal-frontier') : 'command-hub';
    const worldContext = getEonbotWorldContext?.() || freeze({ worldRegionId: returnWorld, nextAction: '', includesPrivateContent: false });
    onOpenStation?.('eonbot-nexus', fromExpanse ? {
      interactionSource: 'expanse-global-eonbot',
      interactionPart: 'ui',
      expanseContext: freeze({ source: 'persistent-eonbot-hud', returnWorld, worldContext })
    } : event.currentTarget, 'chat', { eonbotWorldContext: worldContext });
  });
  menu.querySelector('[data-eon-city-menu-minimize]')?.addEventListener('click', () => surfaceManager?.minimize?.('city-menu', { reason: 'minimize-button' }));
  menu.querySelector('[data-eon-city-menu-close]')?.addEventListener('click', () => closeMenu('close-button'));
  menu.querySelector('[data-eon-city-menu-resume]')?.addEventListener('click', () => handoffFromMenu('resume-location', () => onResume?.()));
  menu.querySelector('[data-eon-city-menu-reset]')?.addEventListener('click', () => handoffFromMenu('orientation-reset', () => onReset?.()));
  menu.querySelector('[data-eon-city-menu-restart]')?.addEventListener('click', () => handoffFromMenu('explicit-restart', () => onRestart?.()));
  menu.addEventListener('pointerdown', (event) => event.stopPropagation());
  menu.addEventListener('click', (event) => {
    if (event.target === menu) { closeMenu(); return; }
    const actionButton = event.target.closest('button');
    if (actionButton && !actionButton.disabled) markButtonResponse(actionButton, actionButton.textContent || 'Opening');
    const quick = event.target.closest('[data-eon-city-quick]');
    if (quick) {
      const action = String(quick.dataset.eonCityQuick || '');
      handoffFromMenu(`quick-${action || 'unknown'}`, (trigger) => {
        if (action === 'missions') return onOpenExpanseMissionBoard?.({ explicitUserAction: true, trigger });
        if (action === 'nexus') return onOpenNexus?.(trigger);
        if (action === 'monitors') return onFocusMonitors?.(trigger);
        if (action === 'share') return onOpenShare?.(trigger);
        if (action === 'capture') return onOpenCapture?.(trigger);
        if (action === 'plans') return onOpenStation?.('plans-access', trigger, 'plans');
        if (action === 'accessible-map') return onOpenAccessibleMap?.(trigger);
        return freeze({ ok: false, reason: 'unknown-city-menu-action' });
      }, action === 'accessible-map' ? 'accessible-map' : ['nexus', 'share', 'capture', 'plans'].includes(action) ? 'work-surface' : '');
      return;
    }
    const openWorld = event.target.closest('[data-eon-city-menu-open-world]');
    if (openWorld) {
      if (uiWorldMode === 'EXPANSE_ACTIVE') handoffFromMenu('signal-frontier-entry', (trigger) => onEnterSignal?.({ explicitUserAction: true, trigger }) || freeze({ ok: false, reason: 'signal-frontier-entry-unavailable' }), 'signal-frontier-entry');
      else handoffFromMenu('open-world-review', (trigger) => openExpanseReview(trigger), 'expanse-entry-review');
      return;
    }
    const openStorm = event.target.closest('[data-eon-city-menu-open-storm]');
    if (openStorm) {
      const availability = renderOpenWorldAvailability();
      if (availability?.stormSector?.available !== true) { onStatus?.('Storm Sector remains locked until its exact certified activation is available.'); return; }
      handoffFromMenu('storm-sector-entry', (trigger) => onEnterStorm?.({ explicitUserAction: true, trigger }) || freeze({ ok: false, reason: 'storm-sector-entry-unavailable' }), 'storm-sector-entry');
      return;
    }
    const openMyFrontier = event.target.closest('[data-eon-city-menu-open-my-frontier]');
    if (openMyFrontier) {
      const availability = renderOpenWorldAvailability();
      if (availability?.myFrontier?.available !== true) { onStatus?.('My Frontier is temporarily unavailable. Signal Frontier completion is never required for entry.'); return; }
      handoffFromMenu('my-frontier-entry', (trigger) => onEnterMyFrontier?.({ explicitUserAction: true, trigger }) || freeze({ ok: false, reason: 'my-frontier-entry-unavailable' }), 'my-frontier-entry');
      return;
    }
    const transit = event.target.closest('[data-eon-city-menu-review-transit]');
    if (transit) { handoffFromMenu('review-transit', (trigger) => openTransitReview(trigger), 'transit-review'); return; }
    const readiness = event.target.closest('[data-eon-city-menu-open-readiness]');
    if (readiness) { handoffFromMenu('open-readiness', (trigger) => onInspectDiscovery?.('maintenance-relay', trigger), 'city-readiness'); return; }
    const reveal = event.target.closest('[data-eon-city-menu-open-reveal]');
    if (reveal) { onOpenReveal?.(reveal); renderMissions(); return; }
    const claim = event.target.closest('[data-eon-city-mission-claim]');
    if (claim) { onClaimMission?.(String(claim.dataset.eonCityMissionClaim || ''), claim); renderMissions(); return; }
    const guide = event.target.closest('[data-eon-city-menu-guide]');
    if (guide) { handoffFromMenu('guide-station', (trigger) => onGuideStation?.(guide.dataset.eonCityMenuGuide, trigger)); return; }
    const open = event.target.closest('[data-eon-city-menu-open-surface]');
    if (open) { handoffFromMenu('open-station', (trigger) => onOpenStation?.(open.dataset.eonCityMenuOpenSurface, trigger), 'work-surface'); return; }
    const mission = event.target.closest('[data-eon-city-mission-guide]');
    if (mission) {
      const missionView = typeof getMissionView === 'function' ? getMissionView() : {};
      const records = Array.isArray(missionView?.missions) ? missionView.missions : Array.isArray(missionView) ? missionView : [];
      const record = records.find((entry) => entry.id === mission.dataset.eonCityMissionGuide);
      if (!record) return;
      handoffFromMenu('mission-guidance', (trigger) => {
        if (record.rt91 === true) return onGuideFlagshipMission?.(record, trigger);
        if (record.discoveryId && String(record.state || record.localState || 'available') === 'available') return onGuideDiscovery?.(record.discoveryId, trigger);
        return onGuideStation?.(record.stationId, trigger);
      });
    }
  });

  const onKeydown = (event) => {
    if (event.key === 'Tab' && !menu.hidden) {
      const focusable = menuFocusable();
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    if (event.key === 'Escape' && !expanseReview.hidden) { event.preventDefault(); closeExpanseReview({ cancel: true, reason: 'escape' }); return; }
    if (event.key === 'Escape' && !transitReview.hidden) { event.preventDefault(); closeTransitReview({ cancel: true }); return; }
    if (event.key === 'Escape' && !menu.hidden) { event.preventDefault(); closeMenu(); }
    if ((event.key === 'm' || event.key === 'M') && menu.hidden && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const tag = String(document.activeElement?.tagName || '').toLowerCase();
      if (!['input', 'textarea', 'select'].includes(tag) && !document.activeElement?.isContentEditable) {
        event.preventDefault();
        const fromExpanse = uiWorldMode === 'EXPANSE_ACTIVE';
        menu.dataset.eonCityMenuMode = fromExpanse ? 'explore' : 'operations';
        openMenu(fromExpanse ? exploreLauncher : menuLauncher);
      }
    }
  };
  globalThis.addEventListener?.('keydown', onKeydown);

  const hasBlockingPresentation = () => Boolean(
    !menu.hidden
    || !transitReview.hidden
    || !expanseReview.hidden
    || session.dataset.eonCityWorkSurfaceOpen === 'true'
    || String(productRoot?.dataset?.eonCityActiveBlockingSurface || '')
  );
  const setPrompt = (target = null) => {
    if (uiWorldMode === 'EXPANSE_ACTIVE') { promptTarget = null; prompt.hidden = true; return; }
    const station = target?.station || null;
    const discovery = target?.discovery || null;
    const entity = station || discovery;
    promptTarget = entity ? { kind: station ? 'station' : 'discovery', entity } : null;
    // RT96 mobile convergence: proximity actions never compete visually or
    // semantically with a blocking Menu, review sheet, Accessible Map or work
    // surface. Keep the target in memory so it can reappear on close without
    // re-running interaction discovery, but hide its controls while blocked.
    prompt.hidden = !entity || hasBlockingPresentation();
    if (!entity) return;
    const interaction = typeof getInteraction === 'function' ? getInteraction(promptTarget) : null;
    prompt.dataset.eonCityInteractionId = interaction?.id || '';
    prompt.querySelector('[data-eon-city-command-prompt-role]').textContent = `${entity.npc.name} · ${entity.npc.role}`;
    prompt.querySelector('[data-eon-city-command-prompt-title]').textContent = interaction?.label || entity.label;
    prompt.querySelector('[data-eon-city-command-prompt-greeting]').textContent = interaction?.oneLinePurpose || entity.npc.greeting;
    prompt.querySelector('[data-eon-city-command-open]').textContent = interaction?.primaryAction?.label || entity.npc.action || (station ? 'Open' : 'Inspect');
    prompt.querySelector('[data-eon-city-command-inspect]').textContent = interaction?.secondaryAction?.label || 'Inspect';
    const capture = prompt.querySelector('[data-eon-city-command-capture]');
    capture.hidden = station?.id !== 'share-capture';
  };

  let lastLabelProjectionAt = -Infinity;
  let lastLabelNearestTargetId = '';
  const update = (projector, playerPosition, nearestTargetId = '', at = now()) => {
    if (uiWorldMode === 'EXPANSE_ACTIVE') {
      labels.hidden = true;
      prompt.hidden = true;
      for (const record of labelRecords) record.button.hidden = true;
      labels.dataset.visibleCount = '0';
      return;
    }
    labels.hidden = false;
    if (hasBlockingPresentation()) {
      prompt.hidden = true;
      for (const record of labelRecords) record.button.hidden = true;
      return;
    }
    if (promptTarget?.entity) prompt.hidden = false;
    const timestamp = Number(at) || now();
    // Screen-space station labels are intentionally projected at ~11 Hz.
    // A nearest-target change bypasses the cadence so interaction feedback is
    // immediate, while normal camera/player motion avoids per-frame DOM work.
    if (nearestTargetId === lastLabelNearestTargetId && timestamp - lastLabelProjectionAt < 90) return;
    lastLabelProjectionAt = timestamp;
    lastLabelNearestTargetId = nearestTargetId;
    const width = Math.max(320, session.clientWidth || globalThis.innerWidth || 1280);
    const height = Math.max(240, session.clientHeight || globalThis.innerHeight || 720);
    const candidates = [];
    for (const record of labelRecords) {
      const projected = projector(record.entity, record.kind);
      const distance = Math.hypot(Number(playerPosition?.x || 0) - record.entity.position.x, Number(playerPosition?.z || 0) - record.entity.position.z);
      const representedByPrompt = promptTarget?.entity?.id === record.entity.id;
      if (!representedByPrompt && projected?.visible && distance < (record.kind === 'station' ? 18 : 15)) {
        const priority = record.entity.id === nearestTargetId ? -100 : record.entity.id === 'eonbot-nexus' ? -12 : record.kind === 'discovery' ? 4 : Number(record.entity.priority || 20);
        candidates.push({ ...record, projected, distance, score: priority + distance });
      }
      record.button.hidden = true;
    }
    candidates.sort((a, b) => a.score - b.score || a.projected.depth - b.projected.depth);
    const labelBudget = resolveEonCityR04LabelBudget(productRoot, 3);
    const selected = candidates.slice(0, Math.max(labelBudget * 3, labelBudget));
    const placed = [];
    const sessionRect = session.getBoundingClientRect?.() || { left: 0, top: 0 };
    const promptRect = prompt.hidden ? null : prompt.getBoundingClientRect?.();
    const blocked = promptRect ? [{
      left: promptRect.left - sessionRect.left - 10,
      right: promptRect.right - sessionRect.left + 10,
      top: promptRect.top - sessionRect.top - 10,
      bottom: promptRect.bottom - sessionRect.top + 10
    }] : [];
    const labelWidth = width <= 760 ? 122 : 156;
    const labelHeight = width <= 760 ? 42 : 50;
    const intersects = (rect, other) => !(rect.right < other.left || rect.left > other.right || rect.bottom < other.top || rect.top > other.bottom);
    const offsets = [[0, 0], [0, -58], [0, 58], [-166, 0], [166, 0], [-166, -58], [166, -58]];
    for (const candidate of selected) {
      if (placed.length >= labelBudget) break;
      const baseX = Math.max(labelWidth / 2 + 10, Math.min(width - labelWidth / 2 - 10, candidate.projected.x));
      const baseY = Math.max(labelHeight + 16, Math.min(height - 78, candidate.projected.y));
      let placement = null;
      for (const [offsetX, offsetY] of offsets) {
        const x = Math.max(labelWidth / 2 + 10, Math.min(width - labelWidth / 2 - 10, baseX + offsetX));
        const y = Math.max(labelHeight + 16, Math.min(height - 78, baseY + offsetY));
        const rect = { left: x - labelWidth / 2, right: x + labelWidth / 2, top: y - labelHeight, bottom: y };
        if (![...placed, ...blocked].some((prior) => intersects(rect, prior))) { placement = { x, y, ...rect }; break; }
      }
      if (!placement) continue;
      candidate.button.hidden = false;
      candidate.button.style.transform = `translate3d(${Math.round(placement.x)}px,${Math.round(placement.y)}px,0) translate(-50%,-100%)`;
      candidate.button.style.setProperty('--eon-city-label-depth', String(candidate.projected.depth || 0));
      candidate.button.dataset.nearest = candidate.entity.id === nearestTargetId ? 'true' : 'false';
      candidate.button.dataset.distanceBand = candidate.distance < 7 ? 'near' : candidate.distance < 12 ? 'mid' : 'far';
      candidate.button.style.setProperty('--eon-city-label-opacity', candidate.entity.id === nearestTargetId ? '1' : candidate.distance < 7 ? '.94' : candidate.distance < 12 ? '.82' : '.68');
      placed.push(placement);
    }
    labels.dataset.visibleCount = String(placed.length);
  };

  const controller = freeze({
    update,
    setPrompt,
    updateMissions: renderMissions,
    showReaction,
    setPaused(paused) {
      session.dataset.eonCityWorkSurfaceOpen = paused ? 'true' : 'false';
      if (paused) prompt.hidden = true;
      else if (promptTarget?.entity && !hasBlockingPresentation()) prompt.hidden = false;
    },
    setWorldMode(nextMode = 'COMMAND_HUB') {
      uiWorldMode = nextMode === 'EXPANSE_ACTIVE' ? 'EXPANSE_ACTIVE' : 'COMMAND_HUB';
      const expanseActive = uiWorldMode === 'EXPANSE_ACTIVE';
      labels.hidden = expanseActive;
      if (expanseActive) { promptTarget = null; prompt.hidden = true; feedback.hidden = true; }
      exploreLauncher.hidden = false;
      exploreLauncher.setAttribute('aria-hidden', 'false');
      exploreLauncher.textContent = expanseActive ? 'Worlds' : 'Explore';
      menuLauncher.hidden = expanseActive;
      menuLauncher.setAttribute('aria-hidden', String(expanseActive));
      eonbotLauncher.hidden = false;
      eonbotLauncher.setAttribute('aria-hidden', 'false');
      session.dataset.eonCityPresentationMode = expanseActive ? 'expanse' : 'command-hub';
      return freeze({ ok: true, worldMode: uiWorldMode, hubMarkersVisible: !expanseActive });
    },
    openMenu,
    openWorlds,
    closeMenu,
    isMenuOpen: () => !menu.hidden || !transitReview.hidden || !expanseReview.hidden,
    isCityMenuOpen: () => !menu.hidden,
    isCityMenuVisible: () => isNodeVisiblyOpen(menu),
    isTransitReviewOpen: () => !transitReview.hidden,
    isTransitReviewVisible: () => isNodeVisiblyOpen(transitReview),
    isExpanseReviewOpen: () => !expanseReview.hidden,
    isExpanseReviewVisible: () => isNodeVisiblyOpen(expanseReview),
    getBlockingSurfaceState: () => freeze({
      cityMenu: inspectSurfaceLifecycle('cityMenu', menu),
      transitReview: inspectSurfaceLifecycle('transitReview', transitReview),
      expanseReview: inspectSurfaceLifecycle('expanseReview', expanseReview)
    }),
    openTransitReview,
    closeTransitReview,
    openExpanseReview,
    closeExpanseReview,
    getPromptTarget: () => promptTarget,
    dispose() {
      releaseUiLease('city-menu', 'ui-dispose');
      releaseUiLease('transit-review', 'ui-dispose');
      releaseUiLease('expanse-entry-review', 'ui-dispose');
      globalThis.removeEventListener?.('keydown', onKeydown);
      for (const registration of r03SurfaceRegistrations) registration?.dispose?.();
      exploreLauncher.remove();
      menuLauncher.remove();
      eonbotLauncher.remove();
      if (feedbackTimer !== null) globalThis.clearTimeout?.(feedbackTimer);
      labels.remove();
      prompt.remove();
      feedback.remove();
      menu.remove();
      transitReview.remove();
      expanseReview.remove();
      document.body.classList.remove('eon-city-transit-review-open');
      document.body.classList.remove('eon-city-expanse-review-open');
      session.classList.remove('eon-city-transit-review-open');
      session.classList.remove('eon-city-expanse-review-open');
      document.body.classList.remove('eon-city-command-menu-body-open');
      session.classList.remove('eon-city-command-menu-open');
      delete session.dataset.eonCityCommandHub;
      if (session.__eonCityCommandHubUi === controller) delete session.__eonCityCommandHubUi;
    }
  });
  session.__eonCityCommandHubUi = controller;
  return controller;
}

function readResume(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem?.(EON_CITY_W731_RESUME_KEY) || 'null');
    if (!value || value.schema !== EON_CITY_W731_COMMAND_HUB_SCHEMA) return null;
    const safe = clampEonCityW731Position(value.player || {});
    return freeze({ player: safe, heading: Number(value.heading || 0), stationId: String(value.stationId || ''), savedAt: String(value.savedAt || '') });
  } catch { return null; }
}

function writeResume(player, heading, stationId = '', storage = globalThis.localStorage) {
  try {
    const safe = clampEonCityW731Position(player || {});
    storage?.setItem?.(EON_CITY_W731_RESUME_KEY, JSON.stringify({
      schema: EON_CITY_W731_COMMAND_HUB_SCHEMA,
      player: { x: safe.x, y: 0, z: safe.z },
      heading: Number(heading || 0), stationId: String(stationId || ''), savedAt: new Date().toISOString()
    }));
    return true;
  } catch { return false; }
}


function getEonCityW747NodeWorldBounds(node) {
  if (!node) return null;
  const candidates = [];
  if (node?.getBoundingInfo) candidates.push(node);
  for (const mesh of node?.getChildMeshes?.(false) || []) {
    if (mesh?.getBoundingInfo) candidates.push(mesh);
  }
  let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  for (const mesh of candidates) {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, box.minimumWorld);
      max = Vector3.Maximize(max, box.maximumWorld);
    } catch {}
  }
  if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) return null;
  return freeze({
    min: freeze({ x: min.x, y: min.y, z: min.z }),
    max: freeze({ x: max.x, y: max.y, z: max.z })
  });
}

function createEonCityW747DiagnosticsOverlay(scene, parent, diagnostics) {
  const root = new TransformNode('w747-spatial-diagnostics-root', scene);
  root.parent = parent;
  root.metadata = freeze({ kind: 'w747-advanced-spatial-diagnostics', advancedOnly: true, ownerVisibleByDefault: false });
  const material = new StandardMaterial('w747-spatial-diagnostics-material', scene);
  material.diffuseColor = color('#5ce1d2');
  material.emissiveColor = color('#5ce1d2').scale(0.7);
  material.alpha = 0.7;
  material.wireframe = true;
  material.disableLighting = true;
  const fixedNodes = [];
  const heroRing = MeshBuilder.CreateTorus('w747-diagnostic-hero-zone', { diameter: EON_CITY_W747_HERO_ZONE.diameter, thickness: 0.08, tessellation: 72 }, scene);
  heroRing.parent = root;
  heroRing.position.y = 0.22;
  heroRing.rotation.x = Math.PI / 2;
  heroRing.material = material;
  heroRing.isPickable = false;
  fixedNodes.push(heroRing);
  const corridorLength = Math.hypot(
    EON_CITY_W747_ARRIVAL_CORRIDOR.to.x - EON_CITY_W747_ARRIVAL_CORRIDOR.from.x,
    EON_CITY_W747_ARRIVAL_CORRIDOR.to.z - EON_CITY_W747_ARRIVAL_CORRIDOR.from.z
  );
  const corridor = MeshBuilder.CreateBox('w747-diagnostic-arrival-corridor', {
    width: EON_CITY_W747_ARRIVAL_CORRIDOR.halfWidth * 2,
    height: 0.08,
    depth: corridorLength
  }, scene);
  corridor.parent = root;
  corridor.position.set(
    (EON_CITY_W747_ARRIVAL_CORRIDOR.from.x + EON_CITY_W747_ARRIVAL_CORRIDOR.to.x) / 2,
    0.18,
    (EON_CITY_W747_ARRIVAL_CORRIDOR.from.z + EON_CITY_W747_ARRIVAL_CORRIDOR.to.z) / 2
  );
  corridor.rotation.y = Math.atan2(
    EON_CITY_W747_ARRIVAL_CORRIDOR.to.x - EON_CITY_W747_ARRIVAL_CORRIDOR.from.x,
    EON_CITY_W747_ARRIVAL_CORRIDOR.to.z - EON_CITY_W747_ARRIVAL_CORRIDOR.from.z
  );
  corridor.material = material;
  corridor.isPickable = false;
  fixedNodes.push(corridor);
  for (const wing of EON_CITY_W747_FIVE_WING_ANCHORS) {
    const marker = MeshBuilder.CreateCylinder(`w747-diagnostic-wing-${wing.id}`, { diameter: 0.7, height: 0.12, tessellation: 20 }, scene);
    marker.parent = root;
    marker.position.set(wing.position.x, 0.24, wing.position.z);
    marker.material = material;
    marker.isPickable = false;
    marker.metadata = freeze({ kind: 'w747-wing-anchor', wingId: wing.id, label: wing.label });
    fixedNodes.push(marker);
  }
  let boundNodes = [];
  const rebuildBounds = () => {
    for (const node of boundNodes) { try { node.dispose?.(false, true); } catch {} }
    boundNodes = [];
    for (const entry of diagnostics.listLoadedBounds()) {
      const size = entry.bounds.size;
      if (![size.x, size.y, size.z].every(Number.isFinite)) continue;
      const box = MeshBuilder.CreateBox(`w747-diagnostic-bound-${entry.id}`, {
        width: Math.max(0.04, size.x), height: Math.max(0.04, size.y), depth: Math.max(0.04, size.z)
      }, scene);
      box.parent = root;
      box.position.set(entry.bounds.center.x, entry.bounds.center.y, entry.bounds.center.z);
      box.material = material;
      box.isPickable = false;
      box.metadata = freeze({ kind: 'w747-loaded-bound', assetId: entry.id, primaryRole: entry.primaryRole });
      boundNodes.push(box);
    }
  };
  root.setEnabled(false);
  return freeze({
    root,
    setVisible(visible) {
      const next = Boolean(visible);
      if (next) rebuildBounds();
      root.setEnabled(next);
      return next;
    },
    dispose() {
      for (const node of boundNodes) { try { node.dispose?.(false, true); } catch {} }
      for (const node of fixedNodes) { try { node.dispose?.(false, true); } catch {} }
      try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
    }
  });
}

export function mountBabylonCityProof({
  host,
  quality = 'balanced',
  qualityAuthority = null,
  reducedMotion = false,
  onStatus = null,
  onTelemetry = null,
  onContextLoss = null,
  onContextRestored = null,
  onFirstFrame = null,
  onInitialAssetsReady = null,
  onAssetProgress = null,
  onDetailStage = null,
  onBootStage = null,
  onLandmarkChange = null,
  onInputModeChange = null,
  onPerformanceChange = null,
  runtimeIdentity = null,
  ownerWorldReview = false
} = {}) {
  const contractValidation = validateEonCityW731CommandHubContract();
  const assetValidation = validateEonCityW731LaunchAssetManifest();
  const missionValidation = validateEonCityW737MissionContract();
  const stationCompletionValidation = validateEonCityW744StationCompletion({ stations: EON_CITY_W731_STATIONS, launchManifest: EON_CITY_W731_LAUNCH_ASSET_MANIFEST });
  const productiveStationsValidation = validateEonCityW751ProductiveStations();
  const missionsProgressionValidation = validateEonCityW752MissionsProgression();
  const castTransitValidation = validateEonCityW754Contract();
  const arrivalCameraValidation = inspectEonCityW743ArrivalCamera();
  const spatialFoundationValidation = validateEonCityW747SpatialFoundation();
  const commandCoreConvergenceValidation = validateEonCityW760W765Convergence();
  const c08CommandHubValidation = validateEonCityC08CommandHubConvergence();
  const c09SignalFrontierValidation = validateEonCityC09SignalFrontierSummit();
  const c10FrontierRegionValidation = validateEonCityC10FrontierRegionGovernance();
  if (!contractValidation.ok) throw new Error(`w731-command-hub-contract-invalid:${contractValidation.errors.join(',')}`);
  if (!assetValidation.ok) throw new Error(`w737-launch-assets-invalid:${assetValidation.errors.join(',')}`);
  if (!missionValidation.ok) throw new Error(`w737-missions-invalid:${missionValidation.errors.join(',')}`);
  if (!stationCompletionValidation.ok) throw new Error(`w744-station-completion-invalid:${stationCompletionValidation.errors.join(',')}`);
  if (!productiveStationsValidation.ok) throw new Error(`w751-productive-stations-invalid:${productiveStationsValidation.errors.join(',')}`);
  if (!missionsProgressionValidation.ok) throw new Error(`w752-missions-progression-invalid:${missionsProgressionValidation.errors.join(',')}`);
  if (!castTransitValidation.ok) throw new Error(`w754-cast-eonbot-npc-transit-invalid:${castTransitValidation.errors.join(',')}`);
  const w765r6DiscoveryValidation = validateEonCityW765R6DiscoveryPolicy(EON_CITY_W737_DISCOVERIES);
  if (!w765r6DiscoveryValidation.ok) throw new Error(`w765r6-discovery-policy-invalid:${[...w765r6DiscoveryValidation.missing, ...w765r6DiscoveryValidation.dead].join(',')}`);
  if (!arrivalCameraValidation.ok) throw new Error(`w743-arrival-camera-obstructed:${arrivalCameraValidation.blockedStationIds.join(',')}`);
  if (!spatialFoundationValidation.ok) throw new Error(`w747-spatial-foundation-invalid:${spatialFoundationValidation.errors.join(',')}`);
  if (!commandCoreConvergenceValidation.ok) throw new Error(`w760-w765-command-core-convergence-invalid:${commandCoreConvergenceValidation.errors.join(',')}`);
  if (!c08CommandHubValidation.ok) throw new Error(`a15-c08-command-hub-convergence-invalid:${c08CommandHubValidation.errors.join(',')}`);
  if (!c09SignalFrontierValidation.ok) throw new Error(`a15-c09-signal-frontier-summit-invalid:${c09SignalFrontierValidation.errors.join(',')}`);
  if (!c10FrontierRegionValidation.ok) throw new Error(`a15-c10-frontier-region-governance-invalid:${c10FrontierRegionValidation.errors.join(',')}`);
  if (EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame?.authoredEnvironmentRequired !== true) throw new Error('w737-authored-visible-frame-required');
  if (EON_CITY_W731_LAUNCH_ASSET_MANIFEST.cacheVersion !== EON_CITY_W757_RUNTIME_PROVENANCE) throw new Error('w757-city-runtime-provenance-mismatch');
  if (!host || typeof document === 'undefined') throw Object.assign(new Error('City canvas host is unavailable.'), { code: 'CITY_CANVAS_MOUNT_FAILED' });

  const startedAt = now();
  const productRoot = host.closest?.('[data-eon-city-play-root]') || host.parentElement || host;
  const ownerWorldReviewEnabled = ownerWorldReview === true;
  // RT90 closure: the shipped authored Storm package is directly reviewable by
  // every signed-in City user. This transient activation never certifies or
  // persists the region and grants no progression authority.
  const stormReviewActivation = deriveEonCityL95StormReviewActivation({ enabled: true, at: Date.now(), ownerReview: false });
  if (productRoot?.dataset) productRoot.dataset.eonCityOwnerWorldReview = ownerWorldReviewEnabled ? 'true' : 'false';
  const interactionMatrixValidation = validateEonCityW765R7InteractionMatrix();
  productRoot.dataset.eonCityInteractionMatrix = interactionMatrixValidation.ok ? 'pass' : 'fail';
  productRoot.dataset.eonCityInteractionActionCount = String(EON_CITY_W765R7_INTERACTION_MATRIX.length);
  productRoot.dataset.eonCityC08Convergence = c08CommandHubValidation.ok ? 'pass' : 'fail';
  productRoot.dataset.eonCityC08StationCount = String(c08CommandHubValidation.audit.stationCount);
  productRoot.dataset.eonCityC08DiscoveryCount = String(c08CommandHubValidation.audit.discoveryCount);
  productRoot.dataset.eonCityC09SourceProgramme = c09SignalFrontierValidation.summit.sourceProgrammeComplete ? 'complete' : 'incomplete';
  productRoot.dataset.eonCityC09OwnerEvidence = 'pending';
  productRoot.dataset.eonCityC10MyFrontier = c10FrontierRegionValidation.state.myFrontier.sourceValid ? 'source-ready' : 'invalid';
  productRoot.dataset.eonCityC10StormGateway = c10FrontierRegionValidation.state.stormSector.releaseReady ? 'release-ready' : 'locked';
  productRoot.dataset.eonCityOpenWorldAvailability = EON_CITY_R07_OPEN_WORLD_AVAILABILITY_SCHEMA;
  const stage = (name, detail = '') => { trace(host, startedAt, name, detail); try { onBootStage?.({ stage: name, detailCode: detail }); } catch {} };
  stage('BABYLON_CORE_IMPORT_FINISHED', EON_CITY_W731_RUNTIME_OWNER_SCHEMA);

  const resolvedQuality = ['lite', 'balanced', 'cinematic'].includes(String(quality || '').toLowerCase()) ? String(quality).toLowerCase() : 'balanced';
  const resolvedQualityAuthority = freeze({
    received: String(quality || ''),
    requested: qualityAuthority?.requested || null,
    effective: resolvedQuality,
    detected: String(qualityAuthority?.detected || resolvedQuality),
    source: String(qualityAuthority?.source || 'automatic'),
    overrideAllowed: qualityAuthority?.overrideAllowed === true,
    overrideAccepted: qualityAuthority?.overrideAccepted === true,
    rejectionReason: qualityAuthority?.rejectionReason || null,
    renderer: String(qualityAuthority?.renderer || '')
  });
  const w754CastPlan = buildEonCityW754CastPlan({ quality: resolvedQuality === 'cinematic' ? 'high' : resolvedQuality });
  const w754NpcSchedulePlan = buildEonCityW754NpcSchedulePlan();
  const w754NpcScheduleController = createEonCityW754NpcScheduleController({ now, plan: w754NpcSchedulePlan });
  const w754TransitController = createEonCityW754TransitController({ now });
  const initialTimeProfile = resolveEonCityW755LocalTimeProfile(new Date());
  const initialEnvironmentPlan = buildEonCityW755EnvironmentPlan({ quality: resolvedQuality, timeProfile: initialTimeProfile, weatherProfile: 'clear', reducedEffects: Boolean(reducedMotion), reducedSensory: Boolean(reducedMotion) });
  const environmentValidation = validateEonCityW755EnvironmentPlan(initialEnvironmentPlan);
  if (!environmentValidation.ok) throw new Error(`w755-environment-art-audio-invalid:${environmentValidation.errors.join(',')}`);
  const environmentController = createEonCityW755EnvironmentController({ quality: resolvedQuality, timeProfile: initialTimeProfile, weatherProfile: 'clear', reducedEffects: Boolean(reducedMotion), reducedSensory: Boolean(reducedMotion), environment: globalThis, onState: (state) => onTelemetry?.(freeze({ type: 'w755-environment', state })) });
  const coarsePointer = Boolean(globalThis.matchMedia?.('(pointer: coarse)')?.matches);
  const rt92GrandArtPlan = buildEonCityRt92GrandArtPlan({ quality: resolvedQuality, reducedMotion: Boolean(reducedMotion), coarsePointer });
  const rt92GrandArtValidation = validateEonCityRt92GrandArtPlan(rt92GrandArtPlan);
  if (!rt92GrandArtValidation.ok) throw new Error(`rt92-grand-art-plan-invalid:${rt92GrandArtValidation.errors.join(',')}`);
  const rt92CommandHubPlan = buildEonCityRt92CommandHubGoldMasterPlan({ quality: resolvedQuality, reducedMotion: Boolean(reducedMotion) });
  const rt92CommandHubValidation = validateEonCityRt92CommandHubGoldMasterPlan(rt92CommandHubPlan);
  if (!rt92CommandHubValidation.ok) throw new Error(`rt92-command-hub-gold-master-invalid:${rt92CommandHubValidation.errors.join(',')}`);
  const rt92ArtRuntime = createEonCityRt92SharedArtRuntime({
    quality: resolvedQuality,
    reducedMotion: Boolean(reducedMotion),
    coarsePointer,
    onChange: (state) => onTelemetry?.(freeze({ type: 'rt92-shared-art', state }))
  });
  if (productRoot?.dataset) {
    productRoot.dataset.eonCityArtProgramme = rt92GrandArtPlan.schema;
    productRoot.dataset.eonCityArtQuality = rt92GrandArtPlan.quality;
    productRoot.dataset.eonCityArtLayers = String(rt92GrandArtPlan.layerCount);
    productRoot.dataset.eonCityArtMaterials = String(rt92GrandArtPlan.materialFamilyCount);
    productRoot.dataset.eonCityArtFirstFrameBinaryDelta = String(rt92GrandArtPlan.binaryBudget.firstFrameNewBinaryBytes);
  }
  const performanceBudget = buildEonCityL95RuntimePerformanceBudget({ quality: resolvedQuality, reducedMotion, coarsePointer });
  const w756ExperiencePlan = buildEonCityW756ExperiencePlan({ width: Number(globalThis.innerWidth || 1280), height: Number(globalThis.innerHeight || 720), coarsePointer, reducedMotion: Boolean(reducedMotion), highContrast: Boolean(globalThis.matchMedia?.('(forced-colors: active)')?.matches) });
  const w756ExperienceValidation = validateEonCityW756ExperiencePlan(w756ExperiencePlan);
  if (!w756ExperienceValidation.ok) throw new Error(`w756-onboarding-navigation-accessibility-invalid:${w756ExperienceValidation.errors.join(',')}`);
  const w757ReliabilityPlan = buildEonCityW757ReliabilityPlan({ quality: resolvedQuality });
  const w757ReliabilityValidation = validateEonCityW757ReliabilityPlan(w757ReliabilityPlan);
  if (!w757ReliabilityValidation.ok) throw new Error(`w757-performance-reliability-invalid:${w757ReliabilityValidation.errors.join(',')}`);
  const reliabilityController = createEonCityW757ReliabilityController({ quality: resolvedQuality, now, onState: (state) => onTelemetry?.(freeze({ type: 'w757-reliability', state })) });
  reliabilityController.recordStage('route-entered');
  const palette = themePalette(document);
  const canvas = document.createElement('canvas');
  canvas.className = 'eon-play-canvas eon-city-command-hub-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'EON City Command Hub. Use W A S D or arrow keys to move, E to use the nearest station, and M for City Menu.');
  host.replaceChildren(canvas);
  stage('CANVAS_ATTACHED');

  let engine = null;
  let scene = null;
  let currentHardwareScalingLevel = 1;
  let baselineHardwareScalingLevel = 1;
  let maxHardwareScalingLevel = 1;
  try {
    stage('ENGINE_CREATE_STARTED');
    engine = new Engine(canvas, resolvedQuality !== 'lite', {
      stencil: false,
      preserveDrawingBuffer: false,
      doNotHandleContextLost: false,
      powerPreference: resolvedQuality === 'cinematic' ? 'high-performance' : 'default'
    });
    const targetDpr = resolvedQuality === 'cinematic' ? 1.8 : resolvedQuality === 'balanced' ? 1.35 : 1;
    const browserDpr = Math.max(1, Math.min(3, Number(globalThis.devicePixelRatio || 1)));
    currentHardwareScalingLevel = Math.max(1, browserDpr / targetDpr);
    baselineHardwareScalingLevel = currentHardwareScalingLevel;
    maxHardwareScalingLevel = Math.max(currentHardwareScalingLevel, resolvedQuality === 'cinematic' ? 1.6 : resolvedQuality === 'balanced' ? 1.75 : 2);
    engine.setHardwareScalingLevel?.(currentHardwareScalingLevel);
    scene = new Scene(engine);
    // L95-W16: raw pointermove picking can run far above display refresh rate.
    // Pointer clicks remain immediate; hover semantics are resolved below at a
    // bounded cadence and are disabled entirely for coarse-pointer devices.
    scene.skipPointerMovePicking = true;
    scene.clearColor = new Color4(...color(initialEnvironmentPlan.lighting.clearColor).asArray(), 1);
    scene.ambientColor = color(initialEnvironmentPlan.lighting.ambientColor);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = color(initialEnvironmentPlan.lighting.fogColor);
    scene.fogDensity = initialEnvironmentPlan.lighting.fogDensity;
    if (scene.imageProcessingConfiguration) {
      scene.imageProcessingConfiguration.exposure = initialEnvironmentPlan.lighting.exposure;
      scene.imageProcessingConfiguration.contrast = initialEnvironmentPlan.lighting.contrast;
    }
    stage('ENGINE_CREATED');
    reliabilityController.recordStage('engine-created');
  } catch (error) {
    throw Object.assign(error instanceof Error ? error : new Error('City engine creation failed.'), { code: 'CITY_ENGINE_CREATE_FAILED' });
  }

  const playerAnchor = new TransformNode('w737-player-anchor', scene);
  playerAnchor.position.set(EON_CITY_W731_SPAWN.x, EON_CITY_W731_SPAWN.y, EON_CITY_W731_SPAWN.z);
  playerAnchor.rotation.y = EON_CITY_W731_SPAWN.heading;
  playerAnchor.metadata = freeze({ kind: 'w737-main-avatar-anchor', launchReadyAsset: 'pathfinder-prime', proceduralFallback: true });

  const camera = new ArcRotateCamera(
    'w737-command-centre-camera',
    EON_CITY_W743_ARRIVAL_CAMERA.alpha,
    EON_CITY_W743_ARRIVAL_CAMERA.beta,
    EON_CITY_W743_ARRIVAL_CAMERA.radius,
    new Vector3(EON_CITY_W743_ARRIVAL_CAMERA.target.x, EON_CITY_W743_ARRIVAL_CAMERA.target.y, EON_CITY_W743_ARRIVAL_CAMERA.target.z),
    scene
  );
  camera.lowerRadiusLimit = EON_CITY_W743_ARRIVAL_CAMERA.lowerRadiusLimit;
  camera.upperRadiusLimit = EON_CITY_W743_ARRIVAL_CAMERA.upperRadiusLimit;
  camera.lowerBetaLimit = EON_CITY_W743_ARRIVAL_CAMERA.lowerBetaLimit;
  camera.upperBetaLimit = EON_CITY_W743_ARRIVAL_CAMERA.upperBetaLimit;
  // Preserve the certified W743 construction authority, then apply the bounded
  // W760 composition adjustment before the first rendered frame.
  camera.alpha = EON_CITY_W760_CAMERA_POSES.arrival.alpha;
  camera.beta = EON_CITY_W760_CAMERA_POSES.arrival.beta;
  camera.radius = EON_CITY_W760_CAMERA_POSES.arrival.radius;
  camera.setTarget(new Vector3(EON_CITY_W760_CAMERA_POSES.arrival.target.x, EON_CITY_W760_CAMERA_POSES.arrival.target.y, EON_CITY_W760_CAMERA_POSES.arrival.target.z));
  camera.panningSensibility = 0;
  camera.wheelDeltaPercentage = 0.012;
  // ArcRotate collision displacement can push the camera through the thin
  // authored floor when large GLBs finish loading around it. The camera is
  // already bounded by beta/radius limits and panning is disabled, so use the
  // deterministic floor-safety guard below instead of collision displacement.
  camera.checkCollisions = false;
  camera.collisionRadius = new Vector3(0.48, 0.55, 0.48);
  scene.collisionsEnabled = true;
  camera.attachControl(canvas, true);
  const rt96CameraPolicy = deriveEonCityRt96CameraInputPolicy({
    coarsePointer: Boolean(globalThis.matchMedia?.('(pointer: coarse)')?.matches),
    width: Number(globalThis.innerWidth || canvas.clientWidth || 1280),
    height: Number(globalThis.innerHeight || canvas.clientHeight || 720)
  });
  const rt96CameraPolicyReceipt = applyEonCityRt96CameraInputPolicy(camera, canvas, rt96CameraPolicy);
  productRoot.dataset.eonCityCameraInput = rt96CameraPolicy.mode;
  productRoot.dataset.eonCitySimultaneousMoveLook = rt96CameraPolicy.simultaneousMovementAndLook ? 'true' : 'false';
  productRoot.dataset.eonCityGraphicsState = 'ready';
  const cameraOcclusion = createEonCityCameraOcclusionController({ scene, camera, target: playerAnchor });
  let lastCameraOccluderCount = -1;

  const hemisphere = new HemisphericLight('w737-hemisphere', new Vector3(0.2, 1, -0.1), scene);
  hemisphere.intensity = resolvedQuality === 'lite' ? 0.78 : 0.92;
  hemisphere.diffuse = color(initialEnvironmentPlan.lighting.hemisphereColor);
  hemisphere.groundColor = color(initialEnvironmentPlan.lighting.groundColor);
  const direction = new DirectionalLight('w737-directional', new Vector3(-0.3, -1, 0.45), scene);
  direction.position.set(14, 24, -16);
  direction.intensity = initialEnvironmentPlan.lighting.keyIntensity;
  direction.diffuse = color(initialEnvironmentPlan.lighting.keyColor);

  const world = createWorld(scene, palette, initialEnvironmentPlan, rt92CommandHubPlan);
  const staticPresentationFreeze = performanceBudget.staticPresentation.freezeSkylineWorldMatrices
    ? freezeCommandHubStaticPresentation(world)
    : freeze({ ok: true, frozenCount: 0, skipped: true });
  applyW755EnvironmentPlan({ scene, hemisphere, direction, world, plan: initialEnvironmentPlan });
  let signalVanguardCosmeticRoot = null;
  let signalVanguardCosmeticRing = null;
  let signalVanguardCosmeticOrbitA = null;
  let signalVanguardCosmeticOrbitB = null;
  const expansePersistence = createEonExpanseW766APersistence({ storage: globalThis.localStorage, now: Date.now });
  let expanseState = expansePersistence.read(createEonExpanseW766AInitialState({ seed: createEonExpanseW766AWorldSeed({ profileId: productRoot?.dataset?.eonProfileId || 'local-profile' }) }));
  const expanseMissionRuntime = createEonExpanseW766EMissionRuntime({ initialState: expanseState.missionLedger || createEonExpanseW766EInitialLedger(), now: Date.now, onChange: (missionLedger) => { expanseState = freeze({ ...expanseState, missionLedger, activeMissionId: missionLedger.activeMissionId || '', currentObjective: missionLedger.activeMissionId ? missionLedger.missions?.[missionLedger.activeMissionId]?.currentObjective || '' : '', worldMilestones: freeze([...new Set([...(expanseState.worldMilestones || []), ...(missionLedger.worldMilestones || [])])]), processedReceipts: freeze([...new Set([...(expanseState.processedReceipts || []), ...(missionLedger.processedReceipts || [])])]), updatedAt: Date.now() }); expansePersistence.write(expanseState); syncExpanseWorldProgress(); } });
  const readCurrentProductivePlan = () => {
    try { return getEonCityProductiveRpgPlan(); }
    catch { return null; }
  };
  const deriveCurrentDailySignal = ({ at = Date.now(), state = expanseState.livingContent || {} } = {}) => deriveEonExpanseW767YDailySignal({ at, nativePlan: readCurrentProductivePlan() || {}, livingState: state });
  const expanseLivingContent = createEonExpanseW766FLivingContent({
    initial: expanseState.livingContent || {},
    worldSeed: expanseState.seed?.value || 1,
    now: Date.now,
    onAwardXp: ({ sourceId, amount, receiptId }) => expanseMissionRuntime.awardXp({ sourceId, amount, receiptId }),
    verifyWorkspaceReceipt: ({ missionId, workspaceReceipt }) => validateEonExpanseW767WProductiveReceipt({ missionId, workspaceReceipt, nativePlan: readCurrentProductivePlan() }),
    getDailySignalRecommendation: ({ at, state }) => deriveCurrentDailySignal({ at, state }),
    onChange: (livingContent) => { expanseState = freeze({ ...expanseState, livingContent, updatedAt: Date.now() }); expansePersistence.write(expanseState); expanseGateway?.applyLivingContent?.(livingContent); }
  });
  const verifyCurrentExpanseCampaignReceipt = ({ campaignReceipt = null } = {}) => {
    const current = expanseMissionRuntime.getState().campaignReceipt || null;
    const exact = Boolean(current && campaignReceipt
      && String(campaignReceipt.id || '') === String(current.id || '')
      && String(campaignReceipt.campaignId || '') === 'signal-restoration'
      && Number(campaignReceipt.completedAt || 0) === Number(current.completedAt || 0)
      && Number(campaignReceipt.totalXp || 0) === Number(current.totalXp || 0)
      && String(campaignReceipt.cosmeticId || '') === String(current.cosmeticId || ''));
    return exact ? freeze({ ok: true, receipt: current, mutatesMissionAuthority: false }) : freeze({ ok: false, reason: 'campaign-receipt-mismatch' });
  };
  const verifyCurrentMyFrontierMilestoneReceipt = ({ milestoneReceipt = null } = {}) => verifyEonCityR08MyFrontierUnlockReceipt({
    milestoneReceipt,
    missionLedger: expanseMissionRuntime.getState()
  });
  const verifyCurrentMyFrontierResidentReceipt = ({ slotId = '', residentId = '', residentReceipt = null } = {}) => validateEonExpanseW768VResidentReceipt({
    slotId,
    residentId,
    residentReceipt,
    missionLedger: expanseMissionRuntime.getState()
  });
  let expanseMyFrontierRenderer = null;
  const expanseMyFrontier = createEonExpanseW768BMyFrontierState({
    initial: expanseState.myFrontier || {},
    now: Date.now,
    verifyCampaignReceipt: verifyCurrentExpanseCampaignReceipt,
    verifyResidentReceipt: verifyCurrentMyFrontierResidentReceipt,
    verifyMilestoneReceipt: verifyCurrentMyFrontierMilestoneReceipt,
    onChange: (myFrontier) => { expanseState = freeze({ ...expanseState, myFrontier, updatedAt: Date.now() }); expansePersistence.write(expanseState); syncExpanseMyFrontierVisuals(); }
  });
  const productiveReceiptConsumedForConstruction = (missionId = '', receiptId = '') => {
    const living = expanseLivingContent.getState();
    return living.completedProductiveMissions.includes(String(missionId || ''))
      && living.processedReceipts.some((entry) => String(entry || '').endsWith(`:${String(receiptId || '')}`));
  };
  const deriveCurrentMyFrontierPermit = ({ plotId = '', buildingId = '' } = {}) => {
    const policy = EON_EXPANSE_W768C_CONSTRUCTION_POLICIES[String(buildingId || '')] || null;
    const candidate = policy?.authority === 'productive' ? deriveEonExpanseW767WProductiveReceipt(readCurrentProductivePlan() || {}, policy.missionId) : null;
    return deriveEonExpanseW768CConstructionPermit({
      myFrontierState: expanseMyFrontier.getState(),
      plotId,
      buildingId,
      campaignReceipt: expanseMissionRuntime.getState().campaignReceipt,
      workspaceReceipt: candidate?.ok ? candidate : null,
      nativePlan: readCurrentProductivePlan(),
      verifyCampaignReceipt: verifyCurrentExpanseCampaignReceipt
    });
  };
  const verifyCurrentMyFrontierPermit = ({ permit = null } = {}) => {
    const current = deriveCurrentMyFrontierPermit({ plotId: permit?.plotId, buildingId: permit?.buildingId });
    if (!current.ok || current.permitId !== permit?.permitId || current.sourceReceiptId !== permit?.sourceReceiptId) return freeze({ ok: false, reason: current.reason || 'construction-permit-stale' });
    if (current.authority === 'productive' && !productiveReceiptConsumedForConstruction(current.sourceMissionId, current.sourceReceiptId)) return freeze({ ok: false, reason: 'productive-result-claim-required' });
    return validateEonExpanseW768CConstructionPermit(current);
  };
  const verifyPersistedMyFrontierConstruction = ({ record = null } = {}) => {
    if (!record) return freeze({ ok: false, reason: 'construction-record-required' });
    if (record.authority === 'campaign') {
      const current = expanseMissionRuntime.getState().campaignReceipt;
      return current?.id === record.sourceReceiptId ? freeze({ ok: true }) : freeze({ ok: false, reason: 'campaign-construction-receipt-stale' });
    }
    const policy = EON_EXPANSE_W768C_CONSTRUCTION_POLICIES[record.buildingId];
    return policy?.authority === 'productive' && productiveReceiptConsumedForConstruction(policy.missionId, record.sourceReceiptId)
      ? freeze({ ok: true })
      : freeze({ ok: false, reason: 'productive-construction-receipt-stale' });
  };
  const expanseMyFrontierConstruction = createEonExpanseW768DConstructionLedger({
    initial: expanseState.myFrontierConstruction || {},
    now: Date.now,
    verifyConstructionPermit: verifyCurrentMyFrontierPermit,
    verifyConstructionRecord: verifyPersistedMyFrontierConstruction,
    onChange: (myFrontierConstruction) => { expanseState = freeze({ ...expanseState, myFrontierConstruction, updatedAt: Date.now() }); expansePersistence.write(expanseState); syncExpanseMyFrontierVisuals(); }
  });

  const verifyPersistedMyFrontierUpgrade = ({ record = null } = {}) => {
    const construction = expanseMyFrontierConstruction.getState().records.find((entry) => entry.plotId === record?.plotId && entry.buildingId === record?.buildingId) || null;
    const receiptMarker = `my-frontier-upgrade:${String(record?.sourceReceiptId || '')}`;
    return construction && expanseState.processedReceipts.includes(receiptMarker)
      ? freeze({ ok: true })
      : freeze({ ok: false, reason: construction ? 'district-upgrade-receipt-stale' : 'district-upgrade-construction-stale' });
  };
  let expanseMyFrontierUpgrades = null;
  const deriveCurrentMyFrontierUpgradeView = ({ plotId = '', buildingId = '' } = {}) => {
    const construction = expanseMyFrontierConstruction.getState().records.find((entry) => entry.plotId === String(plotId || '') && entry.buildingId === String(buildingId || '')) || null;
    const constructionProjection = expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState());
    const upgradeProjection = expanseMyFrontierUpgrades?.getSafeProjection?.(constructionProjection) || { plots: [] };
    const currentLevel = upgradeProjection.plots.find((entry) => entry.plotId === String(plotId || ''))?.level || (construction ? 1 : 0);
    const policy = EON_EXPANSE_W768C_CONSTRUCTION_POLICIES[String(buildingId || '')] || null;
    const candidate = policy?.authority === 'productive' ? deriveEonExpanseW767WProductiveReceipt(readCurrentProductivePlan() || {}, policy.missionId) : null;
    return deriveEonExpanseW769DDistrictUpgrade({ constructionRecord: construction, currentLevel, workspaceReceipt: candidate?.ok ? candidate : null, nativePlan: readCurrentProductivePlan() });
  };
  const verifyCurrentMyFrontierUpgradeView = ({ upgradeView = null } = {}) => {
    const action = upgradeView?.action || null;
    const current = deriveCurrentMyFrontierUpgradeView({ plotId: action?.plotId, buildingId: action?.buildingId });
    return validateEonExpanseW769DDistrictUpgradeAction(current, { explicitUserAction: true, expectedPlotId: action?.plotId || '', expectedBuildingId: action?.buildingId || '', expectedPermitId: action?.permitId || '', expectedSourceReceiptId: action?.sourceReceiptId || '' });
  };
  expanseMyFrontierUpgrades = createEonExpanseW769EUpgradeLedger({
    initial: expanseState.myFrontierUpgrades || {},
    now: Date.now,
    verifyUpgradeView: verifyCurrentMyFrontierUpgradeView,
    verifyUpgradeRecord: verifyPersistedMyFrontierUpgrade,
    onChange: (myFrontierUpgrades) => {
      const markers = myFrontierUpgrades.records.map((entry) => `my-frontier-upgrade:${entry.sourceReceiptId}`);
      expanseState = freeze({ ...expanseState, myFrontierUpgrades, processedReceipts: freeze([...new Set([...(expanseState.processedReceipts || []), ...markers])]), updatedAt: Date.now() });
      expansePersistence.write(expanseState); syncExpanseMyFrontierVisuals();
    }
  });

  function getCurrentMyFrontierVisualPayload() {
    const myFrontierState = expanseMyFrontier.getState();
    const constructionProjection = expanseMyFrontierConstruction.getSafeProjection(myFrontierState);
    return freeze({ unlocked: myFrontierState.unlocked === true, myFrontierState, constructionProjection, upgradeProjection: expanseMyFrontierUpgrades.getSafeProjection(constructionProjection) });
  }
  function syncExpanseMyFrontierVisuals() {
    return expanseMyFrontierRenderer?.apply?.(getCurrentMyFrontierVisualPayload()) || freeze({ ok: true, deferredUntilRendererMount: true });
  }

  const deriveCurrentMyFrontierConstructionAction = () => {
    const readiness = deriveCurrentMyFrontierReadiness();
    const readyRow = readiness.rows.find((entry) => entry.status === 'permit-ready') || null;
    const permit = readyRow ? deriveCurrentMyFrontierPermit({ plotId: readyRow.plotId, buildingId: readyRow.buildingId }) : null;
    const permitAction = deriveEonExpanseW768OConstructionAction({ readiness, permit, rendererSummary: expanseMyFrontierRenderer?.getSummary?.() || null });
    return deriveEonExpanseW768QConstructionSite({ constructionAction: permitAction, playerPosition: playerAnchor.position });
  };

  const deriveCurrentMyFrontierReadiness = () => {
    const myFrontierState = expanseMyFrontier.getState();
    const constructionProjection = expanseMyFrontierConstruction.getSafeProjection(myFrontierState);
    const availability = listEonExpanseW768CConstructionAvailability(myFrontierState);
    const permitAssessments = availability.filter((entry) => entry.buildingId).map((entry) => {
      const permit = deriveCurrentMyFrontierPermit({ plotId: entry.plotId, buildingId: entry.buildingId });
      const verification = permit.ok ? verifyCurrentMyFrontierPermit({ permit }) : freeze({ ok: false, reason: permit.reason || 'construction-permit-unavailable' });
      return freeze({ plotId: entry.plotId, buildingId: entry.buildingId, permit, verification });
    });
    return deriveEonExpanseW768HMyFrontierReadiness({ myFrontierState, constructionProjection, availability, permitAssessments });
  };

  const deriveCurrentMyFrontierUpgradeBoard = () => {
    const myFrontierState = expanseMyFrontier.getState();
    const records = expanseMyFrontierConstruction.getState().records;
    const views = records.map((record) => deriveCurrentMyFrontierUpgradeView({ plotId: record.plotId, buildingId: record.buildingId }));
    const ready = views.find((entry) => entry.available === true && entry.action?.type === 'confirm-my-frontier-district-upgrade') || null;
    const readySite = ready ? deriveEonExpanseW769IUpgradeSite({ upgradeView: ready, playerPosition: playerAnchor.position }) : null;
    return freeze({
      schema: 'eon.expanse.my-frontier-upgrade-board.w769h.v1',
      visible: myFrontierState.unlocked === true && records.length > 0,
      rows: freeze(views.map((entry) => freeze({ plotId: entry.plotId || '', buildingId: entry.buildingId || '', currentLevel: entry.currentLevel || 0, targetLevel: entry.targetLevel || 0, status: entry.status || 'upgrade-unavailable', available: entry.available === true }))),
      readyCount: views.filter((entry) => entry.available === true).length,
      operationalCount: expanseMyFrontierUpgrades.getState().records.length,
      action: readySite?.action || null,
      siteStatus: readySite?.status || '',
      nearSite: readySite?.nearSite === true,
      automaticUpgrade: false,
      grantsXp: false,
      paidShortcutAccepted: false,
      privateContentStored: false
    });
  };

  const expanseRuntimeHealth = createEonExpanseW766HRuntimeHealth();
  let expansePresentation = projectEonExpanseW766GRestoration({ milestones: expanseState.worldMilestones || [], currentZone: expanseState.currentZone, quality: resolvedQuality, mobile: coarsePointer, reducedMotion });
  const expanseAudio = createEonExpanseW766GAudioDirector({ masterVolume: resolvedQuality === 'lite' ? 0.11 : 0.16 });
  expanseAudio.applyPresentation(expansePresentation);
  const expanseVisuals = mountEonExpanseW766GVisualDirector({ scene, quality: resolvedQuality, reducedMotion, worldSeed: expanseState.seed?.value || 1 });
  if (!expanseVisuals.ok) throw new Error(`w766g-visual-director-mount-failed:${expanseVisuals.reason || 'unknown'}`);
  const expanseWorldMode = createEonCityW766AWorldModeController({ now: Date.now, onChange: (state) => { try { productRoot.dataset.eonCityWorldMode = state.mode; } catch {} onTelemetry?.(freeze({ type: 'w766a-world-mode', state })); } });
  const expanseTransitJourney = createEonExpanseW766HTransitJourney({ durationMs: 2600 });
  const expanseStormSectorJourney = createEonExpanseW794AStormSectorJourney({ durationMs: 2800, now });
  const expanseStormSectorMissions = createEonExpanseW795AStormMissionRuntime({ initialState: expanseState.stormSectorMissions, now: Date.now });
  const expanseStormSectorTransit = createEonExpanseW797AStormTransitController({ durationMs: 1900, now });
  let expanseGateway = null;
  let expanseStormSectorPresenter = null;
  let expanseStormSectorInteractions = null;
  let expanseStormSectorNpcs = null;
  let expanseStormSectorTransitPresenter = null;
  let expanseStormSectorTransformations = null;
  let expanseActiveRegionId = 'signal-frontier';
  let stormEntryAwaitingFirstFrame = false;
  let stormEntryConfirmation = freeze({
    schema: 'eon.city.storm-entry-confirmation.rt92.v1',
    status: 'idle',
    requestedRegionId: '',
    preparedRegionId: '',
    confirmedRegionId: '',
    expectedActivationId: '',
    actualActivationId: '',
    firstPlayableFrame: false,
    failureReason: '',
    startedAt: 0,
    confirmedAt: 0
  });
  const updateStormEntryConfirmation = (patch = {}) => {
    stormEntryConfirmation = freeze({ ...stormEntryConfirmation, ...patch, schema: 'eon.city.storm-entry-confirmation.rt92.v1' });
    if (productRoot?.dataset) {
      productRoot.dataset.eonCityStormEntryStatus = stormEntryConfirmation.status;
      productRoot.dataset.eonCityStormRequestedRegion = stormEntryConfirmation.requestedRegionId;
      productRoot.dataset.eonCityStormConfirmedRegion = stormEntryConfirmation.confirmedRegionId;
      productRoot.dataset.eonCityStormFirstPlayable = String(stormEntryConfirmation.firstPlayableFrame === true);
    }
    onTelemetry?.(freeze({ type: 'rt92-storm-entry-confirmation', confirmation: stormEntryConfirmation }));
    return stormEntryConfirmation;
  };
  const rt91ProductiveReceiptAdapter = createEonCityRt91ProductiveReceiptAdapter({
    storage: globalThis.localStorage,
    now: Date.now,
    getTravelReadinessReceipt: () => {
      const ids = expanseLivingContent?.getState?.()?.activityProgress?.transitJourneyReceipts || [];
      const id = String(ids.at?.(-1) || ids[ids.length - 1] || '');
      return id ? freeze({ id, receiptId: id, kind: 'transit-journey-completed', verified: true, verifiedAt: Date.now(), sourceAuthority: 'w766h-transit-journey' }) : null;
    }
  });
  const rt91Integration = createEonCityRt91RuntimeIntegration({
    storage: globalThis.localStorage,
    now: Date.now,
    getSignalState: () => expanseMissionRuntime.getState(),
    getStormFoundationState: () => expanseStormSectorMissions.getState(),
    getMyFrontierState: () => expanseMyFrontier.getState(),
    getWorldSeed: () => expanseState.seed?.value || 'eoncity-living-frontier',
    getGeneratedContracts: () => [],
    getProductiveMissions: () => [],
    // Productive objectives consume only current redacted native proof. The
    // adapter is read-only and cannot create XP/unlocks or infer work content.
    verifyProductiveReceipt: ({ requiredKind = '', receipt = null }) => rt91ProductiveReceiptAdapter.verify({ requiredKind, receipt }),
    onChange: () => { try { ui?.updateMissions?.(); } catch {} }
  });
  const setCurrentWorld = (worldId, options = {}) => {
    const rt91 = rt91Integration.setCurrentWorld(worldId, options);
    const rt92 = rt92ArtRuntime.setActiveWorld(worldId, { reason: options.reason || 'living-frontier-world-change' });
    world.rt92CinematicVfx?.setActive?.(String(worldId || '') === 'command-hub', (globalThis.performance?.now?.() || 0) * 0.001);
    if (productRoot?.dataset) productRoot.dataset.eonCityArtWorld = rt92.snapshot?.activeWorldId || String(worldId || 'command-hub');
    return freeze({ rt91, rt92 });
  };
  setCurrentWorld('command-hub', { persistState: false, reason: 'maintained-runtime-boot' });
  const reconcileMountedWorldAuthority = (reason = 'world-transition') => {
    const current = expanseWorldMode.getState();
    if (current.mode === 'EXPANSE_ACTIVE') return freeze({ ok: true, reconciled: false, state: current });
    const regionId = String(expanseActiveRegionId || '');
    const presentation = regionId === 'my-frontier'
      ? expanseMyFrontierRenderer?.getSummary?.()
      : regionId === 'storm-sector'
        ? expanseStormSectorPresenter?.getSummary?.()
        : regionId === 'signal-frontier'
          ? expanseGateway?.getSummary?.()
          : null;
    const mounted = regionId === 'my-frontier'
      ? presentation?.active === true && presentation?.visible === true && presentation?.canonicalScene === true
      : regionId === 'storm-sector'
        ? presentation?.active === true && presentation?.canonicalScene === true
        : regionId === 'signal-frontier'
          ? presentation?.enabled === true && presentation?.canonicalScene === true
          : false;
    if (!mounted) return freeze({ ok: false, reason: 'world-authority-not-mounted', regionId, state: current });
    const reconciled = expanseWorldMode.reconcileActiveWorld({ explicitUserAction: true, canonicalSceneMounted: true });
    if (reconciled.ok) {
      ui?.setWorldMode?.('EXPANSE_ACTIVE');
      onTelemetry?.(freeze({ type: 'rt92-world-authority-reconciled', reason, regionId, priorMode: current.mode, result: reconciled, oneEngine: true, oneScene: true, oneRenderLoop: true }));
    }
    return freeze({ ...reconciled, regionId });
  };
  const getStormSectorInteractionCandidates = (position = {}, options = {}) => freeze([
    ...(expanseStormSectorInteractions?.getInteractionCandidates?.(position, options) || []),
    ...(expanseStormSectorNpcs?.getInteractionCandidates?.(position, options) || []),
    ...(expanseStormSectorTransitPresenter?.getInteractionCandidates?.(position, options) || [])
  ].sort((a, b) => Number(a.distance || 0) - Number(b.distance || 0)));
  const interactNearestStormSector = (position = {}, options = {}) => {
    if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    if (expanseStormSectorTransit.getState().status === 'active') return freeze({ ok: false, reason: 'storm-sector-transit-active' });
    const candidate = getStormSectorInteractionCandidates(position, { maxDistance: options.maxDistance || 5.2 })[0] || null;
    if (!candidate) return freeze({ ok: false, reason: 'no-nearby-storm-sector-interaction' });
    if (options.expectedTargetId && options.expectedTargetId !== candidate.targetId) return freeze({ ok: false, reason: 'storm-sector-interaction-target-changed', expectedTargetId: options.expectedTargetId, currentTargetId: candidate.targetId });
    if (candidate.metadata?.kind === 'storm-sector-authored-npc') return expanseStormSectorNpcs?.interactNearest?.(position, { ...options, expectedTargetId: candidate.targetId }) || freeze({ ok: false, reason: 'storm-sector-npc-interaction-unavailable' });
    if (candidate.metadata?.kind === 'storm-sector-transit-node') return expanseStormSectorTransitPresenter?.interactNearest?.(position, { ...options, expectedTargetId: candidate.targetId }) || freeze({ ok: false, reason: 'storm-sector-transit-interaction-unavailable' });
    return expanseStormSectorInteractions?.interactNearest?.(position, { ...options, expectedTargetId: candidate.targetId }) || freeze({ ok: false, reason: 'storm-sector-mission-interaction-unavailable' });
  };
  let expanseUiOverlay = null;
  let expanseFutureRegionReleaseEvidence = createEonExpanseW787AReleaseEvidence();
  let expanseVerifiedPerformanceEvidence = null;
  let expanseFutureRegionReleaseReview = deriveEonExpanseW788AReleaseReviewAction();
  let expanseFutureRegionOwnerAuthorization = null;
  let expanseFutureRegionActivation = deriveEonExpanseW793AActivationAction();
  const getStormSectorRuntimeActivation = () => expanseState.futureRegionActivation || stormReviewActivation || null;
  const getStormSectorPresenterActivation = () => {
    const activation = getStormSectorRuntimeActivation();
    if (!activation || activation.regionId !== 'storm-sector' || activation.gatewayId !== 'future-gateway-storm-sector' || activation.gatewayActivated !== true || activation.explicitOwnerAction !== true || activation.automaticActivation === true) return null;
    return freeze({ active: true, regionId: activation.regionId, gatewayId: activation.gatewayId, packageDigest: activation.packageDigest, explicitOwnerAction: true, automaticActivation: false });
  };
  expanseStormSectorJourney.syncActivation(getStormSectorRuntimeActivation());
  let expanseCompanionState = deriveEonExpanseW767ACompanionState({ missionLedger: expanseMissionRuntime.getState(), worldMode: expanseWorldMode.getState().mode, transitState: expanseTransitJourney.getState() });
  function syncExpanseCompanionState() {
    expanseCompanionState = deriveEonExpanseW767ACompanionState({ missionLedger: expanseMissionRuntime.getState(), worldMode: expanseWorldMode.getState().mode, transitState: expanseTransitJourney.getState() });
    expanseGateway?.applyCompanionState?.(expanseCompanionState);
    const behaviorLabel = getEonExpanseW767GCompanionBehaviorLabel(expanseCompanionBehaviorState || {});
    const behaviorActive = Boolean(expanseCompanionState.bonded && expanseCompanionBehaviorState?.active && behaviorLabel);
    expanseUiOverlay?.updateCompanion?.(freeze({
      ...expanseCompanionState,
      behaviorMode: String(expanseCompanionBehaviorState?.mode || ''),
      behaviorLabel,
      label: behaviorActive ? `${expanseCompanionState.label} · ${behaviorLabel}` : expanseCompanionState.label
    }));
    return expanseCompanionState;
  }
  function getExpanseWorldProgress() {
    return deriveEonExpanseW766WorldProgress({ milestones: expanseState.worldMilestones || [], missionLedger: expanseMissionRuntime.getState() });
  }
  function getOpenWorldAvailability() {
    const worldProgress = getExpanseWorldProgress();
    const publicAvailability = deriveEonCityR07OpenWorldAvailability({
      stormActivation: expanseState.futureRegionActivation,
      signalCampaignComplete: worldProgress.campaignComplete === true,
      beaconOneStage: worldProgress.beaconOneStage
    });
    // A real certified Storm activation outranks the transient direct-review
    // projection. Otherwise a future certified build would stay read-only merely
    // because RT90 keeps the review activation available for uncertified users.
    if (publicAvailability?.stormSector?.available === true) return publicAvailability;
    return projectEonCityL95OwnerReviewAvailability(publicAvailability, stormReviewActivation);
  }
  function showExpanseZoneArrival(zoneId = '', { force = false } = {}) {
    const progress = freeze({ ...getExpanseWorldProgress(), companionBonded: expanseCompanionState?.bonded === true });
    const result = expanseZoneArrival.enter(zoneId, { expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE', progress, at: Date.now(), force });
    if (result.ok) expanseUiOverlay?.showArrival?.(result.card);
    return result;
  }
  function syncExpanseWorldProgress() {
    const progress = getExpanseWorldProgress();
    expanseGateway?.applyProgress?.(progress);
    signalVanguardCosmeticRoot?.setEnabled?.(expanseMissionRuntime.getState().selectedCosmetic === 'signal-vanguard-glow');
    syncExpanseCompanionState();
    return progress;
  }
  function persistExpanseInteractionMilestone(milestone, receiptId = '') {
    const result = expanseMissionRuntime.addMilestone(milestone, { receiptId: receiptId || `interaction-milestone:${milestone}` });
    if (result.ok) syncExpanseWorldProgress();
    return result;
  }
  const expanseTransitPresenter = mountEonExpanseW766HTransitPresenter({ scene, quality: resolvedQuality, reducedMotion });
  if (!expanseTransitPresenter.ok) throw new Error(`w766h-transit-presenter-mount-failed:${expanseTransitPresenter.reason || 'unknown'}`);
  let expanseTransitDestination = null;
  let expanseTransitCameraSnapshot = null;
  const restoreExpanseTransitPresentation = ({ keepCurrentPosition = true } = {}) => {
    playerAnchor.setEnabled(true);
    expanseTransitPresenter.hide?.();
    if (expanseTransitCameraSnapshot) {
      camera.alpha = Number(expanseTransitCameraSnapshot.alpha);
      camera.beta = Number(expanseTransitCameraSnapshot.beta);
      camera.radius = Number(expanseTransitCameraSnapshot.radius);
    }
    if (keepCurrentPosition) camera.setTarget(new Vector3(playerAnchor.position.x, EON_CITY_W747_CAMERA_POSES.follow.targetHeight, playerAnchor.position.z));
    cameraMode = 'follow';
    expanseTransitCameraSnapshot = null;
  };
  const cancelActiveExpanseTransit = (reason = 'cancelled') => {
    const current = expanseTransitJourney.getState();
    if (current.status === 'active' && current.pose) playerAnchor.position.set(current.pose.x, current.pose.y, current.pose.z);
    const cancelled = expanseTransitJourney.cancel?.(reason);
    expanseTransitDestination = null;
    restoreExpanseTransitPresentation();
    syncExpanseCompanionState();
    return cancelled || freeze({ ok: true, reason });
  };
  const expanseTransit = createEonExpanseW766DTransitController({ getUnlocked: () => expanseState.unlockedTransitNodes || ['gateway-overlook'], onTravel: (node) => {
    if (expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE') return freeze({ ok: false, reason: 'expanse-not-active' });
    if (expanseTransitJourney.getState().status === 'active') return freeze({ ok: false, reason: 'transit-already-active' });
    clearInput?.('w766d-regional-transit');
    const begun = expanseTransitJourney.begin({ x: playerAnchor.position.x, y: playerAnchor.position.y, z: playerAnchor.position.z }, { x: node.x, y: 0.15, z: node.z }, Date.now());
    if (!begun.ok) return begun;
    expanseRuntimeHealth.beginTransit();
    expanseTransitDestination = node;
    syncExpanseCompanionState();
    expanseTransitCameraSnapshot = captureCameraPose();
    cameraMode = 'expanse-transit';
    camera.radius = Math.max(13, Math.min(18, Number(camera.radius || 16)));
    playerAnchor.setEnabled(false);
    expanseTransitPresenter.update(begun.state, 0);
    onStatus?.(`Regional Transit departing for ${node.label}.`);
    return freeze({ ok: true, node, journey: begun.state, explicitUserAction: true });
  } });
  const expanseRouteCertification = validateEonExpanseW766HPrimaryRoutes({ zones: EON_EXPANSE_W766B_ZONES, maxGap: 90, minWidth: 5.2 });
  if (!expanseRouteCertification.ok) throw new Error(`w766h-primary-route-certification-failed:${expanseRouteCertification.failures.join('|')}`);
  const expanseObjectiveMarker = mountEonExpanseW766HObjectiveMarker({ scene });
  if (!expanseObjectiveMarker.ok) throw new Error(`w766h-objective-marker-mount-failed:${expanseObjectiveMarker.reason || 'unknown'}`);
  let expanseGuidance = buildEonExpanseW766HGuidance(buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState()), playerAnchor.position);
  let expanseActivityGuidance = null;
  const buildCurrentExpanseGuidance = () => {
    const expanseActive = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
    const rt91Target = expanseActive ? rt91Integration.getActiveTarget(expanseActiveRegionId) : null;
    if (rt91Target?.position) {
      const distance = Math.hypot(Number(playerAnchor.position.x || 0) - Number(rt91Target.position.x || 0), Number(playerAnchor.position.z || 0) - Number(rt91Target.position.z || 0));
      return freeze({
        active: true, rt91: true, regionId: expanseActiveRegionId, route: freeze([]),
        objective: rt91Target.objectiveId, missionId: rt91Target.missionId, targetId: rt91Target.targetId,
        target: rt91Target.position, interactionRange: Number(rt91Target.interactionRange || 3), distance,
        nearTarget: distance <= Number(rt91Target.interactionRange || 3),
        prompt: `${rt91Target.missionLabel}: ${rt91Target.objectiveLabel} · E / tap Use`,
        guidance: `EONBOT route · ${rt91Target.objectiveLabel}`, mutatesMissionState: false
      });
    }
    if (expanseActive && expanseActiveRegionId === 'my-frontier') {
      return freeze({ active: false, regionId: 'my-frontier', route: freeze([]), objective: null, prompt: 'My Frontier · inspect a plot or ask EONBOT to build.', guidance: 'EONBOT build companion ready', mutatesMissionState: false });
    }
    if (expanseActive && expanseActiveRegionId === 'storm-sector') {
      return freeze({ active: false, regionId: 'storm-sector', route: freeze([]), objective: null, prompt: 'Storm Sector · follow the certified regional objectives.', guidance: 'EONBOT storm companion ready', mutatesMissionState: false });
    }
    const campaignGuidance = buildEonExpanseW766HGuidance(buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState()), playerAnchor.position);
    if (!expanseActivityGuidance?.target || !expanseActive) return campaignGuidance;
    const distance = Math.hypot(Number(playerAnchor.position.x || 0) - Number(expanseActivityGuidance.target.x || 0), Number(playerAnchor.position.z || 0) - Number(expanseActivityGuidance.target.z || 0));
    if (distance <= 7) { expanseActivityGuidance = null; return campaignGuidance; }
    return freeze({ ...expanseActivityGuidance, active: true, distance, nearTarget: false, prompt: `${expanseActivityGuidance.label}: travel to ${expanseActivityGuidance.zoneLabel}.`, guidance: `EONBOT route to ${expanseActivityGuidance.zoneLabel}` });
  };
  const expanseGuideController = createEonExpanseW767BGuideController({ now: Date.now, durationMs: 16000 });
  let expanseGuideState = expanseGuideController.getState();
  const expanseOnboarding = createEonExpanseW767FOnboardingDirector({ now: Date.now, durationMs: 60000 });
  let expanseOnboardingState = expanseOnboarding.getState();
  const expanseZoneArrival = createEonExpanseW772AZoneArrivalDirector({ now: Date.now, minimumIntervalMs: 2500 });
  const expanseObjectiveFeedback = createEonExpanseW772EObjectiveCompletionDirector();
  const expanseRestorationAudioCues = createEonExpanseW777ARestorationAudioCueDirector();
  const expanseCompanionBehavior = createEonExpanseW767GCompanionBehaviorDirector({ now: Date.now, stationaryDelayMs: 2400, behaviorDurationMs: 5200, cooldownMs: 6800, maxScoutDistance: 5.8 });
  let expanseCompanionBehaviorState = expanseCompanionBehavior.getState();
  const expanseAssetRecovery = createEonExpanseW767JAssetRecoveryController({ now: Date.now, cooldownMs: 10000, maxAttempts: 3 });
  const expanseCompositionRecovery = createEonExpanseW770FCompositionRecoveryController({ now: Date.now, cooldownMs: 10000, maxAttempts: 3 });
  let expanseWorldAssetRecoveryState = expanseAssetRecovery.getState({ expanseActive: false });
  let expanseCompositionRecoveryState = expanseCompositionRecovery.getState({ expanseActive: false });
  const combineExpanseAssetRecoveryState = (worldState = {}, compositionState = {}, { expanseActive = false } = {}) => {
    const repairRequired = worldState.repairRequired === true || compositionState.repairRequired === true;
    const retrying = worldState.retrying === true || compositionState.retrying === true;
    const loading = worldState.status === 'loading' || compositionState.status === 'loading';
    const available = worldState.available === true || compositionState.available === true;
    const exhausted = repairRequired && !available && !retrying && !loading && (worldState.status === 'exhausted' || compositionState.status === 'exhausted');
    const cooldown = repairRequired && !available && !retrying && !loading && !exhausted && (worldState.status === 'cooldown' || compositionState.status === 'cooldown');
    const compositionRequested = Number(compositionState?.totals?.requested || 0) > 0;
    const releaseReady = worldState.releaseReady === true && (!compositionRequested || compositionState.releaseReady === true);
    const status = !expanseActive ? 'inactive' : retrying ? 'retrying' : loading ? 'loading' : available ? 'available' : exhausted ? 'exhausted' : cooldown ? 'cooldown' : releaseReady ? 'release-ready' : 'idle';
    const relevantRemaining = [worldState, compositionState].filter((state) => state.repairRequired === true).map((state) => Number(state.remainingAttempts || 0));
    return freeze({
      schema: 'eon.city.expanse.combined-asset-recovery.w770f.v1', status, available: status === 'available', retrying: status === 'retrying', repairRequired, releaseReady, expanseActive,
      attemptCount: Number(worldState.attemptCount || 0) + Number(compositionState.attemptCount || 0), maxAttempts: Number(worldState.maxAttempts || 0) + Number(compositionState.maxAttempts || 0),
      remainingAttempts: relevantRemaining.length ? Math.min(...relevantRemaining) : Math.max(Number(worldState.remainingAttempts || 0), Number(compositionState.remainingAttempts || 0)),
      cooldownMs: Math.max(Number(worldState.cooldownMs || 0), Number(compositionState.cooldownMs || 0)), nextAllowedAt: Math.max(Number(worldState.nextAllowedAt || 0), Number(compositionState.nextAllowedAt || 0)),
      lastReason: String(compositionState.lastReason || worldState.lastReason || ''),
      totals: freeze({ requested: Number(worldState?.totals?.requested || 0) + Number(compositionState?.totals?.requested || 0), presented: Number(worldState?.totals?.presented || 0) + Number(compositionState?.totals?.presented || 0), pending: Number(worldState?.totals?.pending || 0) + Number(compositionState?.totals?.pending || 0), rejected: Number(worldState?.totals?.rejected || 0) + Number(compositionState?.totals?.rejected || 0), proceduralFallback: Number(worldState?.totals?.proceduralFallback || 0) + Number(compositionState?.totals?.proceduralFallback || 0) }),
      world: worldState, composition: compositionState, explicitUserActionRequired: true, automaticRetry: false, ownsScene: false, storesPrivateContent: false
    });
  };
  let expanseAssetRecoveryState = combineExpanseAssetRecoveryState(expanseWorldAssetRecoveryState, expanseCompositionRecoveryState, { expanseActive: false });
  const expanseLostAssistance = createEonExpanseW767KLostPlayerAssistanceDirector({ now: Date.now, idleThresholdMs: 35000, movementThreshold: 1.4, progressThreshold: 3.5, dismissCooldownMs: 30000 });
  let expanseLostAssistanceState = expanseLostAssistance.getState();
  let expanseCompanionBehaviorCandidates = freeze([]);
  let lastExpanseCompanionCandidateRefreshAt = 0;
  const refreshExpanseCompanionBehaviorCandidates = (at = Date.now(), { force = false } = {}) => {
    const timestamp = Number(at || Date.now());
    if (!force && timestamp - lastExpanseCompanionCandidateRefreshAt < 850) return expanseCompanionBehaviorCandidates;
    const rawCandidates = expanseActiveRegionId === 'storm-sector'
      ? getStormSectorInteractionCandidates(playerAnchor.position, { maxDistance: 7.5 })
      : expanseGateway?.getInteractionCandidates?.(playerAnchor.position, { maxDistance: 7.5 }) || [];
    expanseCompanionBehaviorCandidates = freeze(rawCandidates.slice(0, 8).map((candidate) => freeze({
      id: String(candidate.targetId || candidate.meshName || ''),
      kind: String(candidate.metadata?.kind || ''),
      action: String(candidate.metadata?.action || ''),
      interactionAction: String(candidate.metadata?.interactionAction || ''),
      npcId: String(candidate.metadata?.npcId || ''),
      discoveryId: String(candidate.metadata?.discoveryId || ''),
      eventId: String(candidate.metadata?.eventId || ''),
      world: freeze({ x: Number(candidate.world?.x || 0), y: Number(candidate.world?.y || 0), z: Number(candidate.world?.z || 0) }),
      distance: Number(candidate.distance || 0)
    })));
    lastExpanseCompanionCandidateRefreshAt = timestamp;
    return expanseCompanionBehaviorCandidates;
  };
  const reactEonbotToExpanseInteraction = ({ action = '', discovery = null, npcId = '', ...detail } = {}) => {
    const companion = expanseCompanionState || syncExpanseCompanionState();
    if (!companion?.expanseActive || !companion?.bonded) return freeze({ ok: false, reason: 'bonded-expanse-companion-required' });
    const candidates = refreshExpanseCompanionBehaviorCandidates(Date.now(), { force: true });
    const interactionAction = String(detail.interactionAction || action || '');
    const discoveryId = String(discovery?.id || discovery || detail.discoveryId || '');
    const target = candidates.find((candidate) => (
      (npcId && candidate.npcId === String(npcId))
      || (discoveryId && candidate.discoveryId === discoveryId)
      || (interactionAction && candidate.interactionAction === interactionAction)
      || (action && candidate.action === String(action))
    )) || null;
    if (!target) return freeze({ ok: false, reason: 'companion-reaction-target-unavailable' });
    const result = expanseCompanionBehavior.react(target, {
      explicitUserAction: true,
      expanseActive: true,
      bonded: true,
      transitActive: expanseTransitJourney.getState().status === 'active' || expanseStormSectorTransit.getState().status === 'active' || ['departing', 'returning'].includes(expanseStormSectorJourney.getState().status),
      guideActive: expanseGuideState?.active === true,
      player: playerAnchor.position,
      at: Date.now()
    });
    if (result.ok) {
      expanseCompanionBehaviorState = result.state;
      syncExpanseCompanionState();
      onTelemetry?.(freeze({ type: 'w767h-companion-interaction-reaction', action: String(action || interactionAction), mode: result.state.mode, targetId: result.state.targetId, mutatesMissionState: false }));
    }
    return result;
  };
  const confirmExpanseCampaignReceiptAction = ({ explicitUserAction = false } = {}) => {
    const confirmed = expanseMissionRuntime.confirmCampaignReceipt({ explicitUserAction });
    if (confirmed.ok) {
      syncExpanseWorldProgress();
      syncExpanseUi();
      onStatus?.('Signal Restoration complete. Signal Vanguard progression is saved. Next: open Worlds to build in My Frontier, explore Storm when available, keep exploring Signal, or open EONBOT to continue real work.');
    }
    return confirmed;
  };
  const startExpanseMissionAction = (missionId = '', { explicitUserAction = false } = {}) => {
    const started = expanseMissionRuntime.start(missionId, { explicitUserAction });
    if (started.ok) {
      syncExpanseUi();
      onStatus?.(`${started.mission?.label || 'Expanse mission'} started. Follow the objective guidance.`);
    }
    return started;
  };
  const retryExpanseAuthoredAssetsAction = ({ explicitUserAction = false } = {}) => {
    const expanseActive = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
    const at = Date.now();
    const worldBefore = expanseGateway?.getAssetTruthReport?.() || {};
    const compositionBefore = expanseMyFrontierRenderer?.getBuildingCompositionRecoveryReport?.() || expanseMyFrontierRenderer?.getSummary?.()?.buildingCompositions || {};
    const worldRequested = expanseAssetRecovery.request(worldBefore, { explicitUserAction, expanseActive, at });
    const compositionRequested = expanseCompositionRecovery.request(compositionBefore, { explicitUserAction, expanseActive, at });
    expanseWorldAssetRecoveryState = worldRequested.state || expanseWorldAssetRecoveryState;
    expanseCompositionRecoveryState = compositionRequested.state || expanseCompositionRecoveryState;
    expanseAssetRecoveryState = combineExpanseAssetRecoveryState(expanseWorldAssetRecoveryState, expanseCompositionRecoveryState, { expanseActive });
    expanseUiOverlay?.updateAssetRecovery?.(expanseAssetRecoveryState);
    if (!worldRequested.ok && !compositionRequested.ok) return freeze({ ok: false, reason: compositionRequested.reason === 'composition-retry-not-required' ? worldRequested.reason : compositionRequested.reason, world: worldRequested, composition: compositionRequested, state: expanseAssetRecoveryState, explicitUserAction: explicitUserAction === true });
    const worldReload = worldRequested.ok ? (expanseGateway?.reloadAuthoredAssets?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'expanse-asset-reload-unavailable' })) : freeze({ ok: false, skipped: true, reason: worldRequested.reason || 'world-retry-not-required' });
    const compositionReload = compositionRequested.ok ? (expanseMyFrontierRenderer?.retryBuildingCompositions?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'composition-retry-unavailable' })) : freeze({ ok: false, skipped: true, reason: compositionRequested.reason || 'composition-retry-not-required' });
    if (worldRequested.ok) {
      const worldAfter = expanseGateway?.getAssetTruthReport?.() || worldBefore;
      expanseWorldAssetRecoveryState = expanseAssetRecovery.complete(worldRequested.token, { ok: worldReload.ok, report: worldAfter, reason: worldReload.reason || '', expanseActive, at: Date.now() }).state;
    }
    if (compositionRequested.ok) {
      const compositionAfter = expanseMyFrontierRenderer?.getBuildingCompositionRecoveryReport?.() || compositionBefore;
      expanseCompositionRecoveryState = expanseCompositionRecovery.complete(compositionRequested.token, { ok: compositionReload.ok, summary: compositionAfter, reason: compositionReload.reason || '', expanseActive, at: Date.now() }).state;
    }
    expanseAssetRecoveryState = combineExpanseAssetRecoveryState(expanseWorldAssetRecoveryState, expanseCompositionRecoveryState, { expanseActive });
    expanseUiOverlay?.updateAssetRecovery?.(expanseAssetRecoveryState);
    const ok = worldReload.ok || compositionReload.ok;
    const reason = ok ? '' : String(compositionReload.reason || worldReload.reason || 'asset-retry-failed');
    onTelemetry?.(freeze({ type: 'w770f-expanse-combined-asset-recovery', ok, reason, worldRetried: worldReload.ok === true, compositionRetried: compositionReload.ok === true, retriedCompositionParts: Number(compositionReload.retriedPartCount || 0), automaticRetry: false }));
    onStatus?.(ok ? 'Authored world assets are loading again. Procedural fallbacks, foundations and scaffolding remain until presentation is validated.' : `World asset retry could not start: ${reason}.`);
    syncExpanseUi();
    return freeze({ ok, reason, worldReload, compositionReload, state: expanseAssetRecoveryState, explicitUserAction: true, automaticRetry: false });
  };
  const expanseMyFrontierCapture = createEonExpanseW773CMyFrontierCaptureDirector({ now: Date.now });
  const expanseStormSectorCapture = createEonExpanseW800AStormCaptureDirector({ now: Date.now });
  let activeExpanseCaptureMoment = deriveEonExpanseW767SCaptureMoment();
  let interactNearestExpanseAction = () => freeze({ ok: false, reason: 'expanse-interaction-not-ready' });
  const deriveCurrentFutureRegionProgrammeReview = () => {
    const openWorld = expanseGateway?.getSummary?.()?.frontier?.openWorld || null;
    const campaignBoard = buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState());
    const zoneRestorationBoard = deriveEonExpanseW773AZoneRestorationBoard(getExpanseWorldProgress());
    const productiveTransformationStatus = expanseGateway?.getSummary?.()?.productiveTransformations || null;
    const sideTransformationStatus = expanseGateway?.getSummary?.()?.sideTransformations || null;
    const postCampaign = deriveEonExpanseW779APostCampaignProgression({ campaignBoard, zoneRestorationBoard, myFrontierState: expanseMyFrontier.getState(), constructionProjection: expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState()), productiveTransformationStatus, sideTransformationStatus, livingContentState: expanseLivingContent.getState() });
    const programme = deriveEonExpanseW780BFutureRegionProgramme({ postCampaign, worldSeed: expanseState.seed?.value || 1, releasedRegionIds: getOpenWorldAvailability().stormSector.available ? ['storm-sector'] : [] });
    return freeze({ view: deriveEonExpanseW783AProgrammeReviewAction({ programme, reviewState: expanseState.futureRegionProgrammeReview }), programme, openWorld });
  };
  expanseUiOverlay = mountEonExpanseW766HUiOverlay({
    host: productRoot,
    coarsePointer,
    reducedMotion,
    forcedColors: Boolean(globalThis.matchMedia?.('(forced-colors: active)')?.matches),
    onConfirmCampaignReceipt: (options) => confirmExpanseCampaignReceiptAction(options),
    onStartMission: (missionId, options) => startExpanseMissionAction(missionId, options),
    onReturnToCommandHub: (options = {}) => runtime?.returnFromExpanse?.({ explicitUserAction: options.explicitUserAction === true }) || freeze({ ok: false, reason: 'command-hub-return-unavailable' }),
    onOpenMissionMap: (options = {}) => openExpanseMissionMapAction({ explicitUserAction: options.explicitUserAction === true }),
    onSelectMapZone: (zoneId = '', options = {}) => {
      if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const zone = EON_EXPANSE_W766B_ZONES.find((entry) => entry.id === String(zoneId || '')) || null;
      if (!zone) return freeze({ ok: false, reason: 'atlas-zone-unavailable' });
      expanseActivityGuidance = freeze({ objective: `atlas:${zone.id}`, label: zone.label, zoneId: zone.id, zoneLabel: zone.label, target: freeze({ x: zone.x, y: 0.2, z: zone.z }) });
      expanseGuidance = buildCurrentExpanseGuidance();
      const guided = expanseGuideController.request(expanseGuidance, { explicitUserAction: true });
      if (guided.ok) { expanseGuideState = guided.state; onStatus?.(`EONBOT is guiding ${zone.label}.`); syncExpanseUi(); }
      return freeze({ ...guided, zoneId: zone.id, label: zone.label, automaticTravel: false });
    },
    onInteractNearest: (options = {}) => interactNearestExpanseAction(options),
    onRetryAssets: (options = {}) => retryExpanseAuthoredAssetsAction(options),
    onReviewFutureRegionProgramme: (action, options = {}) => {
      const current = deriveCurrentFutureRegionProgrammeReview();
      const validated = validateEonExpanseW783AProgrammeReviewAction(current.view, { explicitUserAction: options.explicitUserAction === true, expectedRegionId: options.expectedRegionId || action?.regionId || '', expectedGatewayId: options.expectedGatewayId || action?.gatewayId || '', expectedReviewToken: options.expectedReviewToken || action?.reviewToken || '' });
      if (!validated.ok) return validated;
      const confirmed = confirmEonExpanseW783AProgrammeReview(validated.action, { explicitUserAction: true, at: Date.now() });
      if (!confirmed.ok) return confirmed;
      expanseState = freeze({ ...expanseState, futureRegionProgrammeReview: confirmed.state, updatedAt: Date.now() });
      const persisted = expansePersistence.write(expanseState);
      if (!persisted.ok) return freeze({ ok: false, reason: persisted.reason || 'future-region-programme-persistence-failed' });
      onStatus?.(`${current.programme.recommendedRegion?.label || validated.action.regionId} programme reviewed. The gateway remains locked until authored art, missions, performance and browser certification pass.`);
      syncExpanseUi();
      return freeze({ ...confirmed, persisted: true });
    },
    onOpenCaptureMoment: (trigger, options = {}) => {
      const validated = validateEonExpanseW767SCaptureRequest(activeExpanseCaptureMoment, { explicitUserAction: options.explicitUserAction === true, expectedMomentId: options.expectedMomentId || '' });
      if (!validated.ok) return validated;
      const handoff = buildEonExpanseW775ACaptureHandoff(validated.context);
      const handoffValidation = validateEonExpanseW775ACaptureHandoff(handoff, { expectedMomentId: validated.context.momentId });
      if (!handoffValidation.ok) return handoffValidation;
      return openSurfaceForStation('share-capture', { interactionPart: 'structure', interactionSource: 'expanse-capture-moment', expanseContext: handoffValidation.handoff, nodeType: trigger?.nodeType || 0 }, 'creator-capture');
    },
    onUnlockMyFrontier: (view, options = {}) => {
      const currentView = deriveEonExpanseW768FMyFrontierPlanningView({
        campaignReceipt: expanseMissionRuntime.getState().campaignReceipt,
        myFrontierState: expanseMyFrontier.getState(),
        constructionProjection: expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState()),
        availability: listEonExpanseW768CConstructionAvailability(expanseMyFrontier.getState()),
        earlyAccessAvailable: Boolean(deriveEonCityR08MyFrontierUnlockReceipt(expanseMissionRuntime.getState())),
        starterAccessAvailable: getOpenWorldAvailability().myFrontier.starterAccess === true
      });
      const validated = validateEonExpanseW768FPlanningAction(currentView, { explicitUserAction: options.explicitUserAction === true, expectedStage: options.expectedStage || view?.stage || '' });
      if (!validated.ok) return validated;
      if (validated.action.type === 'enter-my-frontier') {
        const entered = runtime.enterMyFrontier({ explicitUserAction: true });
        return freeze({ ...entered, action: validated.action, automaticUnlock: false, automaticConstruction: false, grantsCampaignCompletion: false, grantsXp: false });
      }
      const campaignReceipt = expanseMissionRuntime.getState().campaignReceipt;
      const milestoneReceipt = deriveEonCityR08MyFrontierUnlockReceipt(expanseMissionRuntime.getState());
      const result = campaignReceipt
        ? expanseMyFrontier.unlockMyFrontier({ campaignReceipt, explicitUserAction: true })
        : expanseMyFrontier.unlockMyFrontierEarly({ milestoneReceipt, explicitUserAction: true });
      if (result.ok) { onStatus?.(campaignReceipt ? 'My Frontier unlocked from the verified Signal campaign receipt.' : 'My Frontier unlocked after Beacon One. Campaign-gated construction remains receipt-protected.'); syncExpanseUi(); }
      return freeze({ ...result, action: validated.action, automaticUnlock: false, automaticConstruction: false, grantsCampaignCompletion: false });
    },
    onPlanMyFrontierBuilding: (selection, options = {}) => {
      const currentState = expanseMyFrontier.getState();
      const currentModel = deriveEonExpanseW768GBuildingChoiceModel({
        myFrontierState: currentState,
        constructionProjection: expanseMyFrontierConstruction.getSafeProjection(currentState),
        selectedPlotId: options.expectedPlotId || selection?.plotId || '',
        selectedBuildingId: options.expectedBuildingId || selection?.buildingId || ''
      });
      const validated = validateEonExpanseW768GBuildingChoiceAction(currentModel, {
        explicitUserAction: options.explicitUserAction === true,
        expectedPlotId: options.expectedPlotId || selection?.plotId || '',
        expectedBuildingId: options.expectedBuildingId || selection?.buildingId || '',
        expectedCurrentBuildingId: options.expectedCurrentBuildingId || selection?.expectedCurrentBuildingId || ''
      });
      if (!validated.ok) return validated;
      const result = expanseMyFrontier.selectBuilding({ plotId: validated.action.plotId, buildingId: validated.action.buildingId, explicitUserAction: true });
      if (result.ok) { onStatus?.(`${validated.action.buildingId.replaceAll('-', ' ')} planned for ${validated.action.plotId.replace('plot-', '').replaceAll('-', ' ')}. Next: open Review required work, complete the maintained workspace step, then return for the receipt-protected construction confirmation.`); syncExpanseUi(); }
      return freeze({ ...result, action: validated.action, automaticSelection: false, automaticConstruction: false });
    },
    onSelectMyFrontierTheme: (selection, options = {}) => {
      const current = deriveEonExpanseW769BThemeChoice({ myFrontierState: expanseMyFrontier.getState(), selectedThemeId: options.expectedThemeId || selection?.themeId || '' });
      const validated = validateEonExpanseW769BThemeAction(current, { explicitUserAction: options.explicitUserAction === true, expectedThemeId: options.expectedThemeId || selection?.themeId || '', expectedCurrentThemeId: options.expectedCurrentThemeId || selection?.expectedCurrentThemeId || '' });
      if (!validated.ok) return validated;
      const result = expanseMyFrontier.selectTheme({ themeId: validated.action.themeId, explicitUserAction: true });
      if (result.ok) { onStatus?.(`${current.options.find((entry) => entry.id === validated.action.themeId)?.label || validated.action.themeId} applied to My Frontier.`); syncExpanseUi(); }
      return freeze({ ...result, action: validated.action, automaticSelection: false, rawColorsAccepted: false });
    },
    onOpenMyFrontierWork: (action, options = {}) => {
      const current = deriveCurrentMyFrontierReadiness();
      const validated = validateEonExpanseW768HReadinessAction(current, {
        explicitUserAction: options.explicitUserAction === true,
        expectedPlotId: options.expectedPlotId || action?.plotId || '',
        expectedBuildingId: options.expectedBuildingId || action?.buildingId || '',
        expectedWorkspaceId: options.expectedWorkspaceId || action?.workspaceId || '',
        expectedReason: options.expectedReason || action?.expectedReason || ''
      });
      if (!validated.ok) return validated;
      const stationByWorkspace = { create: 'create-forge', 'local-ai': 'local-ai-lab', automations: 'automation-theatre', library: 'library-vault', status: 'command-console' };
      const stationId = stationByWorkspace[validated.action.workspaceId] || '';
      if (!stationId) return freeze({ ok: false, reason: 'workspace-station-not-mapped' });
      return openSurfaceForStation(stationId, { interactionPart: 'structure', interactionSource: 'expanse-my-frontier-readiness', expanseContext: freeze({ type: 'my-frontier-construction-work', plotId: validated.action.plotId, buildingId: validated.action.buildingId, missionId: validated.action.missionId, workspaceId: validated.action.workspaceId, receiptRequired: true, includesPrivateContent: false }) }, validated.action.workspaceId === 'status' ? 'command-status' : validated.action.workspaceId);
    },
    onGuideMyFrontier: (action, options = {}) => {
      const current = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: expanseMyFrontier.getState(), playerPosition: playerAnchor.position });
      const validated = validateEonExpanseW768PNavigationAction(current, { explicitUserAction: options.explicitUserAction === true, expectedPlotId: options.expectedPlotId || action?.plotId || '', expectedTargetToken: options.expectedTargetToken || action?.targetToken || '' });
      if (!validated.ok) return validated;
      expanseActivityGuidance = validated.guidance;
      expanseGuidance = buildCurrentExpanseGuidance();
      const guided = expanseGuideController.request(expanseGuidance, { explicitUserAction: true });
      if (guided.ok) { expanseGuideState = guided.state; onStatus?.('EONBOT is guiding the authored route to My Frontier.'); syncExpanseUi(); }
      return freeze({ ok: guided.ok, reason: guided.reason || '', action: validated.action, guideState: expanseGuideState, automaticMovement: false, teleport: false });
    },
    onInviteMyFrontierResident: (action, options = {}) => {
      const current = deriveEonExpanseW768WResidentInvitationView({ myFrontierState: expanseMyFrontier.getState(), missionLedger: expanseMissionRuntime.getState() });
      const validated = validateEonExpanseW768WResidentInvitationAction(current, {
        explicitUserAction: options.explicitUserAction === true,
        expectedSlotId: options.expectedSlotId || action?.slotId || '',
        expectedResidentId: options.expectedResidentId || action?.residentId || '',
        expectedReceiptId: options.expectedReceiptId || action?.receiptId || '',
        expectedCompletedAt: options.expectedCompletedAt || action?.completedAt || 0
      });
      if (!validated.ok) return validated;
      const receiptResult = deriveEonExpanseW768VResidentReceipt({ residentId: validated.action.residentId, missionLedger: expanseMissionRuntime.getState() });
      if (!receiptResult.ok) return receiptResult;
      const result = expanseMyFrontier.inviteResident({ slotId: validated.action.slotId, residentId: validated.action.residentId, residentReceipt: receiptResult.receipt, explicitUserAction: true });
      if (result.ok) { expanseMyFrontierCapture.record({ type: 'resident', slotId: validated.action.slotId, residentId: validated.action.residentId, label: validated.action.label.replace('Invite ', '') }, { explicitUserAction: true }); onStatus?.(`${validated.action.label.replace('Invite ', '')} invited to the authored My Frontier station. Character presentation remains pending validated asset loading.`); syncExpanseUi(); }
      return freeze({ ...result, action: validated.action, automaticInvitation: false, awardsXp: false });
    },
    onReleaseMyFrontierResident: (action, options = {}) => {
      const current = deriveEonExpanseW769AResidentReleaseView({ myFrontierState: expanseMyFrontier.getState() });
      const validated = validateEonExpanseW769AResidentReleaseAction(current, {
        explicitUserAction: options.explicitUserAction === true,
        expectedSlotId: options.expectedSlotId || action?.slotId || '',
        expectedResidentId: options.expectedResidentId || action?.residentId || '',
        expectedReceiptId: options.expectedReceiptId || action?.receiptId || '',
        expectedReleaseToken: options.expectedReleaseToken || action?.releaseToken || ''
      });
      if (!validated.ok) return validated;
      const result = expanseMyFrontier.releaseResident({ slotId: validated.action.slotId, residentId: validated.action.residentId, residentReceiptId: validated.action.receiptId, explicitUserAction: true });
      if (result.ok) { onStatus?.(`${validated.action.residentLabel} released from My Frontier. The authored station is reserved and can be invited again.`); syncExpanseUi(); }
      return freeze({ ...result, action: validated.action, automaticRelease: false, awardsXp: false, mutatesMissionState: false });
    },
    onConfirmMyFrontierDistrictUpgrade: (action, options = {}) => {
      const current = deriveCurrentMyFrontierUpgradeView({ plotId: options.expectedPlotId || action?.plotId || '', buildingId: options.expectedBuildingId || action?.buildingId || '' });
      const site = deriveEonExpanseW769IUpgradeSite({ upgradeView: current, playerPosition: playerAnchor.position });
      const validated = validateEonExpanseW769IUpgradeSite(site, { explicitUserAction: options.explicitUserAction === true, expectedSiteToken: options.expectedSiteToken || action?.siteToken || '', expectedPlotId: options.expectedPlotId || action?.plotId || '', expectedBuildingId: options.expectedBuildingId || action?.buildingId || '', expectedPermitId: options.expectedPermitId || action?.permitId || '', expectedSourceReceiptId: options.expectedSourceReceiptId || action?.sourceReceiptId || '' });
      if (!validated.ok) return validated;
      const result = expanseMyFrontierUpgrades.confirmUpgrade({ upgradeView: current, explicitUserAction: true });
      let companionReaction = freeze({ ok: false, reason: 'district-upgrade-not-confirmed' });
      if (result.ok) {
        const companion = expanseCompanionState || syncExpanseCompanionState();
        companionReaction = expanseCompanionBehavior.react(validated.companionReaction, { explicitUserAction: true, expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE', bonded: companion?.bonded === true, transitActive: expanseTransitJourney.getState().status === 'active', guideActive: expanseGuideState?.active === true, player: playerAnchor.position, at: Date.now() });
        if (companionReaction.ok) expanseCompanionBehaviorState = companionReaction.state;
        expanseMyFrontierCapture.record({ type: 'upgrade', plotId: validated.action.plotId, buildingId: validated.action.buildingId, label: validated.action.buildingId.replaceAll('-', ' ') }, { explicitUserAction: true });
        onStatus?.(`${validated.action.buildingId.replaceAll('-', ' ')} upgraded to operational level. Next: use its building terminal, invite an eligible resident, or walk to another plot and plan the next build.`); syncExpanseUi();
      }
      return freeze({ ...result, action: validated.action, companionReaction, remoteUpgradeAllowed: false, automaticUpgrade: false, grantsXp: false, paidShortcutAccepted: false });
    },
    onConfirmMyFrontierConstruction: (action, options = {}) => {
      const current = deriveCurrentMyFrontierConstructionAction();
      const validated = validateEonExpanseW768QConstructionSite(current, {
        explicitUserAction: options.explicitUserAction === true,
        expectedSiteToken: options.expectedSiteToken || action?.siteToken || '',
        expectedPlotId: options.expectedPlotId || action?.plotId || '',
        expectedBuildingId: options.expectedBuildingId || action?.buildingId || '',
        expectedPermitId: options.expectedPermitId || action?.permitId || '',
        expectedSourceReceiptId: options.expectedSourceReceiptId || action?.sourceReceiptId || '',
        expectedRendererSchema: options.expectedRendererSchema || action?.rendererSchema || ''
      });
      if (!validated.ok) return validated;
      const permit = deriveCurrentMyFrontierPermit({ plotId: validated.action.plotId, buildingId: validated.action.buildingId });
      const result = expanseMyFrontierConstruction.confirmConstruction({ permit, explicitUserAction: true });
      let companionReaction = freeze({ ok: false, reason: 'construction-not-confirmed' });
      if (result.ok) {
        if (String(expanseActivityGuidance?.objective || '') === 'activity:my-frontier-arrival') { expanseActivityGuidance = null; expanseGuidance = buildCurrentExpanseGuidance(); expanseGuideState = expanseGuideController.cancel('activity-target-reached').state; }
        const companion = expanseCompanionState || syncExpanseCompanionState();
        companionReaction = expanseCompanionBehavior.react(validated.companionReaction, { explicitUserAction: true, expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE', bonded: companion?.bonded === true, transitActive: expanseTransitJourney.getState().status === 'active', guideActive: expanseGuideState?.active === true, player: playerAnchor.position, at: Date.now() });
        if (companionReaction.ok) expanseCompanionBehaviorState = companionReaction.state;
        expanseMyFrontierCapture.record({ type: 'construction', plotId: validated.action.plotId, buildingId: validated.action.buildingId, label: validated.action.buildingLabel || validated.action.buildingId.replaceAll('-', ' ') }, { explicitUserAction: true });
        onStatus?.(`${validated.action.buildingLabel || validated.action.buildingId} foundation constructed. Next: use its building terminal, review Upgrade district when eligible, or walk to another plot and plan the next build.`);
        syncExpanseUi();
      }
      return freeze({ ...result, action: validated.action, companionReaction, automaticConstruction: false, grantsXp: false });
    },
    onSelectLivingActivity: (item, options = {}) => {
      const currentBoard = deriveEonExpanseW767TLivingActivityBoard(expanseLivingContent.getState(), { at: Date.now(), maxItems: 16, dailySignal: deriveCurrentDailySignal({ state: expanseLivingContent.getState() }) });
      const currentItem = currentBoard.items.find((entry) => entry.activityId === String(options.expectedActivityId || item?.activityId || '')) || null;
      const receiptCandidate = deriveEonExpanseW767WProductiveReceipt(readCurrentProductivePlan() || {}, currentItem?.activityId || '');
      const verifiedAction = deriveEonExpanseW767XVerifiedResultAction(currentItem, receiptCandidate);
      if (verifiedAction.available || options.expectedReceiptId) {
        const verified = validateEonExpanseW767XVerifiedResultAction(verifiedAction, { explicitUserAction: options.explicitUserAction === true, expectedActivityId: options.expectedActivityId || '', expectedReceiptId: options.expectedReceiptId || '' });
        if (!verified.ok) return verified;
        const completed = expanseLivingContent.completeProductiveMission(currentItem.activityId, { explicitUserAction: true, workspaceReceipt: receiptCandidate });
        if (completed.ok) {
          expanseMyFrontierCapture.record({ type: 'productive', missionId: currentItem.activityId, workspaceId: currentItem.workspaceId, label: currentItem.label }, { explicitUserAction: true });
          onStatus?.(`${currentItem.label} verified. ${completed.awardedXp} XP added to the canonical progression ledger.`);
          syncExpanseUi();
        }
        return freeze({ ...completed, action: verifiedAction, automaticCompletion: false, explicitUserAction: true });
      }
      const action = deriveEonExpanseW767UActivityAction(currentItem, EON_EXPANSE_W766B_ZONES);
      const validated = validateEonExpanseW767UActivityAction(action, { explicitUserAction: options.explicitUserAction === true, expectedActivityId: options.expectedActivityId || '' });
      if (!validated.ok) return validated;
      if (action.type === 'claim-daily-signal') {
        const recommendation = deriveCurrentDailySignal({ state: expanseLivingContent.getState() });
        const selected = validateEonExpanseW767YDailySignalSelection(recommendation, { explicitUserAction: true, expectedDayKey: action.dayKey, expectedMissionId: action.missionId });
        if (!selected.ok) return selected;
        const completed = expanseLivingContent.completeDailySignal({ explicitUserAction: true, dayKey: recommendation.dayKey, missionId: recommendation.missionId, workspaceReceipt: recommendation.receipt });
        if (completed.ok) { expanseMyFrontierCapture.record({ type: 'productive', missionId: recommendation.missionId, workspaceId: recommendation.workspaceId, label: recommendation.label || 'Daily Signal' }, { explicitUserAction: true }); onStatus?.(`Daily Signal completed. ${completed.awardedXp} XP added to the canonical progression ledger.`); syncExpanseUi(); }
        return freeze({ ...completed, action, automaticCompletion: false, explicitUserAction: true });
      }
      if (action.type === 'guide-zone') {
        expanseActivityGuidance = freeze({ objective: `activity:${action.activityId}`, label: action.label, zoneId: action.zoneId, zoneLabel: action.zoneLabel, target: action.target });
        expanseGuidance = buildCurrentExpanseGuidance();
        const guided = expanseGuideController.request(expanseGuidance, { explicitUserAction: true });
        if (guided.ok) expanseGuideState = guided.state;
        syncExpanseUi();
        return freeze({ ok: guided.ok, reason: guided.reason || '', action, guideState: expanseGuideState, automaticCompletion: false });
      }
      const stationByWorkspace = { create: 'create-forge', 'local-ai': 'local-ai-lab', automations: 'automation-theatre', library: 'library-vault', status: 'command-console' };
      const stationId = stationByWorkspace[action.workspaceId] || '';
      if (!stationId) return freeze({ ok: false, reason: 'workspace-station-not-mapped' });
      return openSurfaceForStation(stationId, { interactionPart: 'structure', interactionSource: 'expanse-productive-mission-board', expanseContext: freeze({ type: 'productive-mission-review', activityId: action.activityId, workspaceId: action.workspaceId, receiptRequired: true, includesPrivateContent: false }) }, action.workspaceId === 'status' ? 'command-status' : action.workspaceId);
    },
    onDismissOnboarding: (options = {}) => {
      const result = expanseOnboarding.dismiss({ explicitUserAction: options.explicitUserAction === true });
      if (result.ok) expanseOnboardingState = result.state;
      return result;
    },
    onCancelGuide: (options = {}) => {
      if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const activityObjective = String(expanseActivityGuidance?.objective || '');
      if (shouldClearEonExpanseW767VActivityGuidance({ reason: 'explicit-user-cancel', activityObjective })) expanseActivityGuidance = null;
      expanseGuidance = buildCurrentExpanseGuidance();
      const result = expanseGuideController.cancel('explicit-user-cancel');
      expanseGuideState = result.state;
      onStatus?.('EONBOT objective guidance stopped.');
      syncExpanseUi();
      return freeze({ ...result, explicitUserAction: true, clearedActivityGuidance: !expanseActivityGuidance });
    },
    onGuideObjective: (guidance, options = {}) => {
      if (options.explicitUserAction === true && expanseLostAssistanceState?.active) {
        const accepted = expanseLostAssistance.acceptGuide({ explicitUserAction: true, at: Date.now() });
        if (!accepted.ok) return accepted;
        expanseLostAssistanceState = accepted.state;
      }
      const result = expanseGuideController.request(guidance || expanseGuidance, { explicitUserAction: options.explicitUserAction === true });
      if (result.ok) { expanseGuideState = result.state; onStatus?.(`EONBOT is guiding ${String(expanseGuidance?.objective || 'the active objective').replaceAll('-', ' ')}.`); syncExpanseUi(); }
      return result;
    },
    onDismissAssistance: (options = {}) => {
      const result = expanseLostAssistance.dismiss({ explicitUserAction: options.explicitUserAction === true, at: Date.now() });
      if (result.ok) { expanseLostAssistanceState = result.state; syncExpanseUi(); }
      return result;
    },
    onGuideToExpanseGate: (options = {}) => {
      const guided = guideToDiscovery('expanse-gate');
      if (!guided.ok) return guided;
      return ui?.openExpanseReview?.(options?.trigger || null) || freeze({ ok: false, reason: 'expanse-review-ui-unavailable' });
    }
  });
  if (!expanseUiOverlay.ok) throw new Error(`w766h-ui-overlay-mount-failed:${expanseUiOverlay.reason || 'unknown'}`);
  const openExpanseMissionMapAction = ({ explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    if (expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE') return freeze({ ok: false, reason: 'expanse-not-active' });
    if (expanseTransitJourney.getState().status === 'active') return freeze({ ok: false, reason: 'expanse-transit-active' });
    expanseMissionRuntime.recordSignal('map-opened', { receiptId: 'expanse:map-opened' });
    expanseOnboarding.recordMapOpened({ explicitUserAction: true });
    syncExpanseUi();
    return expanseUiOverlay.openBoard();
  };
  let activeExpanseEvent = null;
  let lastExpanseEventResolveAt = 0;
  let lastSignalProjectionAt = 0;
  let lastExpanseUiSyncAt = 0;
  let lastExpanseZoneSignalAt = 0;
  const syncExpanseUi = () => {
    if (expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE') expanseGuidance = buildCurrentExpanseGuidance();
    const openWorld = expanseGateway?.getSummary?.()?.frontier?.openWorld || null;
    const stormSectorZone = resolveEonExpanseW792BStormSectorZone(playerAnchor.position)?.zone || null;
    const stormSector = deriveEonExpanseW798AStormBoard({
      activeRegionId: expanseActiveRegionId,
      missionState: expanseStormSectorMissions.getState(),
      playerPosition: playerAnchor.position,
      transitState: expanseStormSectorTransit.getState(),
      npcSummary: expanseStormSectorNpcs?.getSummary?.() || null,
      presentationSummary: expanseStormSectorPresenter?.getSummary?.() || null,
      journeyState: expanseStormSectorJourney.getState()
    });
    const assetTruth = expanseGateway?.getAssetTruthReport?.() || null;
    const assetRepairFocus = buildEonExpanseW767NAssetRepairFocus(assetTruth || {});
    const restorationStatus = deriveEonExpanseW767RRestorationStatus(expanseMissionRuntime.getState());
    const zoneRestorationBoard = deriveEonExpanseW773AZoneRestorationBoard(getExpanseWorldProgress());
    const livingActivityBoard = deriveEonExpanseW767TLivingActivityBoard(expanseLivingContent.getState(), { at: Date.now(), dailySignal: deriveCurrentDailySignal({ state: expanseLivingContent.getState() }) });
    const productiveTransformationStatus = expanseGateway?.getSummary?.()?.productiveTransformations || null;
    const sideTransformationStatus = expanseGateway?.getSummary?.()?.sideTransformations || null;
    const livingActivityItems = freeze(livingActivityBoard.items.map((item) => {
      if (item.family !== 'productive-mission' || item.status === 'completed') return item;
      const receiptCandidate = deriveEonExpanseW767WProductiveReceipt(readCurrentProductivePlan() || {}, item.activityId);
      const verifiedAction = deriveEonExpanseW767XVerifiedResultAction(item, receiptCandidate);
      return freeze({ ...item, verifiedResultAvailable: verifiedAction.available === true, verifiedReceiptId: verifiedAction.available ? verifiedAction.expectedReceiptId : '', verifiedResultKind: verifiedAction.available ? verifiedAction.receiptKind : '' });
    }));
    const livingActivities = freeze({ ...livingActivityBoard, items: livingActivityItems, verifiedResultCount: livingActivityItems.filter((item) => item.verifiedResultAvailable === true).length });
    const myFrontier = deriveEonExpanseW768FMyFrontierPlanningView({
      campaignReceipt: expanseMissionRuntime.getState().campaignReceipt,
      myFrontierState: expanseMyFrontier.getState(),
      constructionProjection: expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState()),
      availability: listEonExpanseW768CConstructionAvailability(expanseMyFrontier.getState()),
      earlyAccessAvailable: Boolean(deriveEonCityR08MyFrontierUnlockReceipt(expanseMissionRuntime.getState())),
      starterAccessAvailable: getOpenWorldAvailability().myFrontier.starterAccess === true
    });
    const myFrontierChoice = deriveEonExpanseW768GBuildingChoiceModel({
      myFrontierState: expanseMyFrontier.getState(),
      constructionProjection: expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState())
    });
    const myFrontierReadiness = deriveCurrentMyFrontierReadiness();
    const myFrontierConstructionAction = deriveCurrentMyFrontierConstructionAction();
    const myFrontierNavigation = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: expanseMyFrontier.getState(), playerPosition: playerAnchor.position });
    const myFrontierResidents = deriveEonExpanseW768WResidentInvitationView({ myFrontierState: expanseMyFrontier.getState(), missionLedger: expanseMissionRuntime.getState() });
    const myFrontierResidentRelease = deriveEonExpanseW769AResidentReleaseView({ myFrontierState: expanseMyFrontier.getState() });
    const myFrontierTheme = deriveEonExpanseW769BThemeChoice({ myFrontierState: expanseMyFrontier.getState() });
    const myFrontierDistrictUpgrade = deriveCurrentMyFrontierUpgradeBoard();
    const myFrontierPresentation = deriveEonExpanseW770EBuildingPresentationView({ planningView: myFrontier, rendererSummary: expanseMyFrontierRenderer?.getSummary?.() || {} });
    const campaignBoard = buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState());
    const campaignObjectiveAuthority = deriveEonExpanseW772CCurrentObjectiveAuthority(campaignBoard);
    const postCampaign = deriveEonExpanseW779APostCampaignProgression({ campaignBoard, zoneRestorationBoard, myFrontierState: expanseMyFrontier.getState(), constructionProjection: expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState()), productiveTransformationStatus, sideTransformationStatus, livingContentState: expanseLivingContent.getState() });
    const persistentNextAction = deriveEonExpanseW772GPersistentNextAction({ campaignBoard, objectiveAuthority: campaignObjectiveAuthority, postCampaign });
    const futureRegionProgramme = deriveEonExpanseW780BFutureRegionProgramme({ postCampaign, worldSeed: expanseState.seed?.value || 1, releasedRegionIds: getOpenWorldAvailability().stormSector.available ? ['storm-sector'] : [] });
    const openWorldArtAudit = auditEonExpanseW781AOpenWorldArt(openWorld || {});
    const performanceReadiness = deriveEonExpanseW782APerformanceReadiness({ openWorldSummary: openWorld, foregroundTelemetry: expanseVerifiedPerformanceEvidence?.foregroundTelemetry || null, transitionSoak: expanseVerifiedPerformanceEvidence?.transitionSoak || null });
    const futureRegionProgrammeReview = deriveEonExpanseW783AProgrammeReviewAction({ programme: futureRegionProgramme, reviewState: expanseState.futureRegionProgrammeReview });
    const futureRegionPackageCertification = validateEonExpanseW789ARegionPackageCertificationState(expanseState.futureRegionPackageCertification, { expectedRegionId: futureRegionProgrammeReview.reviewedRegion?.regionId || futureRegionProgramme.recommendedRegion?.id || '' });
    const futureRegionReleaseGate = deriveEonExpanseW781BFutureRegionReleaseGate({ programme: futureRegionProgramme, artAudit: openWorldArtAudit, authoredRegionPackageCertification: futureRegionPackageCertification });
    const futureRegionPackageReadiness = deriveEonExpanseW785BRegionPackageReadiness({ reviewView: futureRegionProgrammeReview, certificationReceipt: expanseState.futureRegionPackageCertification });
    const futureRegionReleaseMatrix = deriveEonExpanseW786AFutureRegionReleaseMatrix({ postCampaign, programmeReview: futureRegionProgrammeReview, openWorldArtAudit, packageReadiness: futureRegionPackageReadiness, performanceReadiness, releaseGate: futureRegionReleaseGate });
    expanseFutureRegionReleaseReview = deriveEonExpanseW788AReleaseReviewAction({ releaseMatrix: futureRegionReleaseMatrix, packageReadiness: futureRegionPackageReadiness, reviewState: expanseState.futureRegionReleaseReview });
    expanseFutureRegionActivation = deriveEonExpanseW793AActivationAction({ releaseReview: expanseState.futureRegionReleaseReview, packageCertification: expanseState.futureRegionPackageCertification, performanceEvidence: expanseVerifiedPerformanceEvidence, ownerAuthorization: expanseFutureRegionOwnerAuthorization, currentActivation: expanseState.futureRegionActivation });
    expanseFutureRegionReleaseEvidence = createEonExpanseW787AReleaseEvidence({ releaseMatrix: futureRegionReleaseMatrix, packageReadiness: futureRegionPackageReadiness, performanceReadiness, artAudit: openWorldArtAudit, generatedAt: Date.now() });
    const objectiveFeedback = expanseObjectiveFeedback.update(campaignBoard, { expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' });
    if (objectiveFeedback.ok) expanseUiOverlay?.showArrival?.(objectiveFeedback.card);
    const expanseActive = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
    const board = freeze({
      ...buildEonExpanseW766GMissionBoardView({ campaignBoard, contentSummary: expanseLivingContent.getSummary(), map: createEonExpanseW766AMapView(expanseState), guidance: expanseGuidance, openWorld }),
      campaignObjectiveAuthority,
      persistentNextAction,
      assetRepairFocus,
      restorationStatus,
      zoneRestorationBoard,
      productiveTransformationStatus,
      sideTransformationStatus,
      postCampaign,
      futureRegionProgramme,
      openWorldArtAudit,
      futureRegionReleaseGate,
      performanceReadiness,
      futureRegionProgrammeReview,
      futureRegionPackageReadiness,
      futureRegionReleaseMatrix,
      futureRegionReleaseReview: expanseFutureRegionReleaseReview,
      futureRegionActivation: expanseFutureRegionActivation,
      stormSector,
      livingActivities,
      myFrontier,
      myFrontierChoice,
      myFrontierReadiness,
      myFrontierConstructionAction,
      myFrontierNavigation,
      myFrontierResidents,
      myFrontierResidentRelease,
      myFrontierTheme,
      myFrontierDistrictUpgrade,
      myFrontierPresentation,
      rt91MissionBoard: rt91Integration.getMissionBoard(),
      rt91NextAction: rt91Integration.getNextAction(expanseActive ? expanseActiveRegionId : 'command-hub'),
      rt91Hud: rt91Integration.getHudProjection(expanseActive ? expanseActiveRegionId : 'command-hub')
    });
    const map = buildEonExpanseW766GMapPresentation(createEonExpanseW766AMapView(expanseState), openWorld);
    const signalFrontierActive = expanseActive && expanseActiveRegionId === 'signal-frontier' && !stormSector.active;
    const myFrontierActive = expanseActive && expanseActiveRegionId === 'my-frontier';
    syncExpanseCompanionState();
    expanseGateway?.applyCompanionState?.(expanseCompanionState, { guideActive: expanseGuideState?.active === true, transitActive: expanseTransitJourney.getState().status === 'active' });
    expanseLostAssistanceState = expanseLostAssistance.update({
      expanseActive: signalFrontierActive,
      bonded: expanseCompanionState?.bonded === true,
      transitActive: expanseTransitJourney.getState().status === 'active',
      guideActive: expanseGuideState?.active === true,
      boardOpen: expanseUiOverlay.isBoardOpen?.() === true,
      objective: expanseGuidance?.objective || '',
      position: playerAnchor.position,
      distance: expanseGuidance?.distance,
      nearTarget: expanseGuidance?.nearTarget === true,
      at: Date.now()
    });
    const guidancePresentation = expanseLostAssistanceState.active
      ? { ...expanseGuidance, prompt: expanseLostAssistanceState.prompt, assistanceActive: true, assistanceState: expanseLostAssistanceState }
      : { ...expanseGuidance, assistanceActive: false, assistanceState: expanseLostAssistanceState };
    const rt91GuidancePresentation = expanseGuidance?.rt91 === true && expanseGuidance?.active === true ? freeze({
      ...expanseGuidance, expanseActive: true, zoneId: expanseActiveRegionId,
      zoneLabel: expanseActiveRegionId === 'storm-sector' ? 'Storm Sector' : expanseActiveRegionId === 'my-frontier' ? 'My Frontier' : 'Signal Frontier',
      label: expanseGuidance.guidance || expanseGuidance.prompt || 'Flagship objective',
      guideState: freeze({ active: true, reason: 'rt91-physical-objective' }),
      assistanceActive: false, assistanceState: expanseLostAssistanceState
    }) : null;
    const stormGuidancePresentation = stormSector.active && !rt91GuidancePresentation ? freeze({
      active: false,
      expanseActive: true,
      zoneId: stormSectorZone?.id || 'storm-sector',
      zoneLabel: stormSectorZone?.label || 'Storm Sector',
      label: stormSector.activeObjective?.label || stormSector.completionLabel || 'Storm Sector exploration',
      prompt: stormSector.activeObjective?.detail || 'Use Regional Transit, patrol briefings and the physical return terminal.',
      distance: null,
      guideState: freeze({ active: false, reason: 'storm-sector-physical-navigation' }),
      assistanceActive: false,
      assistanceState: expanseLostAssistanceState
    }) : null;
    const myFrontierGuidancePresentation = myFrontierActive ? freeze({
      active: false,
      expanseActive: true,
      zoneId: 'my-frontier',
      zoneLabel: 'My Frontier',
      label: myFrontierConstructionAction?.available === true ? (myFrontierConstructionAction.action?.label || 'Construct your planned foundation') : 'Choose a plot and plan your first building',
      prompt: myFrontierConstructionAction?.available === true ? 'A verified construction action is ready. Open the build board or interact with the planned plot.' : 'Walk to any authored plot and interact to open its planner, or ask EONBOT for build help.',
      distance: null,
      guideState: freeze({ active: false, reason: 'my-frontier-physical-building' }),
      assistanceActive: false,
      assistanceState: expanseLostAssistanceState
    }) : null;
    const persistentGuidancePresentation = signalFrontierActive && expanseGuidance?.active !== true ? freeze({
      active: false,
      persistent: true,
      expanseActive: true,
      zoneId: expanseState.currentZone,
      zoneLabel: String(expanseState.currentZone || 'signal-frontier').replaceAll('-', ' '),
      label: persistentNextAction.label,
      prompt: persistentNextAction.detail,
      primaryAction: persistentNextAction.primaryAction,
      nextActionKind: persistentNextAction.kind,
      guideState: freeze({ active: false, reason: persistentNextAction.reason }),
      assistanceActive: false,
      assistanceState: expanseLostAssistanceState
    }) : null;
    expanseUiOverlay.updateGuidance(expanseActive ? (rt91GuidancePresentation || stormGuidancePresentation || myFrontierGuidancePresentation || persistentGuidancePresentation || { ...guidancePresentation, expanseActive, zoneId: expanseState.currentZone, zoneLabel: String(expanseState.currentZone || 'signal-frontier').replaceAll('-', ' '), guideState: expanseGuideState }) : { active: false, expanseActive: false, guideState: expanseGuideState, assistanceState: expanseLostAssistanceState });
    const dynamicEventPresentation = deriveEonExpanseW767PDynamicEventPresentation(signalFrontierActive ? activeExpanseEvent : null, { expanseActive: signalFrontierActive, playerZoneId: expanseState.currentZone, at: Date.now() });
    if (signalFrontierActive) {
      const zoneAudioState = deriveEonExpanseW776AZoneAudioState({ zoneId: expanseState.currentZone, zoneRestorationBoard, dynamicEvent: dynamicEventPresentation, reducedMotion });
      expanseAudio.applyWorldState?.(zoneAudioState);
      const restorationAudioCue = expanseRestorationAudioCues.update(zoneRestorationBoard, { expanseActive: true, currentZoneId: expanseState.currentZone });
      if (restorationAudioCue.cue) expanseAudio.playRestorationCue?.(restorationAudioCue.cue);
    }
    expanseUiOverlay.updateDynamicEventPresentation?.(dynamicEventPresentation);
    expanseUiOverlay.updateRestorationStatus?.(signalFrontierActive ? restorationStatus : freeze({ onlinePercent: 0, derivedFromVerifiedProgress: false, complete: false }));
    const fallbackCaptureMoment = signalFrontierActive ? deriveEonExpanseW767SCaptureMoment({ expanseActive: true, restorationStatus, dynamicEvent: dynamicEventPresentation }) : null;
    const stormCaptureMoment = expanseStormSectorCapture.derive({ regionActive: stormSector.active, at: Date.now() });
    activeExpanseCaptureMoment = stormSector.active ? stormCaptureMoment : expanseMyFrontierCapture.derive({ expanseActive, fallback: fallbackCaptureMoment, at: Date.now() });
    expanseUiOverlay.updateCaptureMoment?.(activeExpanseCaptureMoment);
    expanseOnboardingState = expanseOnboarding.update({ companion: expanseCompanionState, guidance: expanseGuidance, expanseActive: signalFrontierActive, at: Date.now() });
    expanseUiOverlay.updateOnboarding?.(expanseOnboardingState);
    expanseUiOverlay.updateBoard(board, map);
    const recoveryAt = Date.now();
    expanseWorldAssetRecoveryState = expanseAssetRecovery.inspect(assetTruth || {}, { expanseActive, at: recoveryAt });
    const compositionRecoveryReport = expanseMyFrontierRenderer?.getBuildingCompositionRecoveryReport?.() || expanseMyFrontierRenderer?.getSummary?.()?.buildingCompositions || {};
    expanseCompositionRecoveryState = expanseCompositionRecovery.inspect(compositionRecoveryReport, { expanseActive, at: recoveryAt });
    expanseAssetRecoveryState = combineExpanseAssetRecoveryState(expanseWorldAssetRecoveryState, expanseCompositionRecoveryState, { expanseActive });
    expanseUiOverlay.updateAssetRecovery?.(expanseAssetRecoveryState);
    if (assetTruth?.totals) {
      productRoot.dataset.eonExpanseAssetPresented = String(assetTruth.totals.presented || 0);
      productRoot.dataset.eonExpanseAssetPending = String(assetTruth.totals.pending || 0);
      productRoot.dataset.eonExpanseAssetRejected = String(assetTruth.totals.rejected || 0);
      productRoot.dataset.eonExpanseAssetReleaseReady = String(assetTruth.releaseReady === true);
    }
    return freeze({ board, map, assetTruth });
  };
  syncExpanseUi();
  const fallbackPlayer = createProceduralPerson(scene, playerAnchor, 'pathfinder', world.materials, { accent: true });
  fallbackPlayer.root.scaling.setAll(1.06);
  signalVanguardCosmeticRoot = new TransformNode('w766g-signal-vanguard-player-cosmetic', scene);
  signalVanguardCosmeticRoot.parent = playerAnchor;
  signalVanguardCosmeticRoot.metadata = freeze({ kind: 'expanse-cosmetic', cosmeticId: 'signal-vanguard-glow', cosmeticOnly: true, tradeable: false, financialValue: false });
  signalVanguardCosmeticRing = MeshBuilder.CreateTorus('w766g-signal-vanguard-player-ring', { diameter: 1.55, thickness: 0.045, tessellation: 48 }, scene);
  signalVanguardCosmeticRing.parent = signalVanguardCosmeticRoot;
  signalVanguardCosmeticRing.position.y = 0.08;
  signalVanguardCosmeticRing.rotation.x = Math.PI / 2;
  signalVanguardCosmeticRing.material = world.materials.cyan;
  signalVanguardCosmeticRing.isPickable = false;
  signalVanguardCosmeticOrbitA = MeshBuilder.CreateSphere('w766g-signal-vanguard-orbit-a', { diameter: 0.12, segments: 10 }, scene);
  signalVanguardCosmeticOrbitA.parent = signalVanguardCosmeticRoot;
  signalVanguardCosmeticOrbitA.material = world.materials.warm;
  signalVanguardCosmeticOrbitA.isPickable = false;
  signalVanguardCosmeticOrbitB = MeshBuilder.CreateSphere('w766g-signal-vanguard-orbit-b', { diameter: 0.09, segments: 10 }, scene);
  signalVanguardCosmeticOrbitB.parent = signalVanguardCosmeticRoot;
  signalVanguardCosmeticOrbitB.material = world.materials.cyan;
  signalVanguardCosmeticOrbitB.isPickable = false;
  signalVanguardCosmeticRoot.setEnabled(expanseMissionRuntime.getState().selectedCosmetic === 'signal-vanguard-glow');
  const eonbotAnchor = new TransformNode('w737-eonbot-anchor', scene);
  eonbotAnchor.position.set(EON_CITY_W731_EONBOT_DOCK.x, 0.85, EON_CITY_W731_EONBOT_DOCK.z);
  eonbotAnchor.metadata = freeze({ kind: 'w737-eonbot-companion', curiousFollow: true, dock: EON_CITY_W731_EONBOT_DOCK });
  const eonbotFallback = MeshBuilder.CreateSphere('w737-eonbot-fallback', { diameter: 0.86, segments: 20 }, scene);
  eonbotFallback.parent = eonbotAnchor; eonbotFallback.material = world.materials.accent; eonbotFallback.isPickable = true;
  eonbotFallback.metadata = stationMetadata(getEonCityW731Station('eonbot-nexus'), { part: 'npc', interactionRole: 'npc', npcName: 'EONBOT', companion: true });
  const eonbotRing = MeshBuilder.CreateTorus('w737-eonbot-fallback-ring', { diameter: 1.25, thickness: 0.055, tessellation: 28 }, scene);
  eonbotRing.parent = eonbotAnchor; eonbotRing.rotation.x = Math.PI / 2; eonbotRing.material = world.materials.signal; eonbotRing.isPickable = false;
  const eonbotScanHalo = MeshBuilder.CreateTorus('w745-eonbot-scan-halo', { diameter: 1.48, thickness: 0.035, tessellation: 36 }, scene);
  eonbotScanHalo.parent = eonbotAnchor; eonbotScanHalo.rotation.x = Math.PI / 2; eonbotScanHalo.position.y = -0.06; eonbotScanHalo.material = world.materials.cyan; eonbotScanHalo.isPickable = false; eonbotScanHalo.setEnabled(false);
  const eonbotScanBeam = MeshBuilder.CreateCylinder('w745-eonbot-scan-beam', { diameterTop: 0.08, diameterBottom: 0.46, height: 1.15, tessellation: 18 }, scene);
  eonbotScanBeam.parent = eonbotAnchor; eonbotScanBeam.position.y = -0.72; eonbotScanBeam.material = world.materials.glass; eonbotScanBeam.isPickable = false; eonbotScanBeam.setEnabled(false);
  const eonbotSparkA = MeshBuilder.CreateSphere('w745-eonbot-spark-a', { diameter: 0.11, segments: 8 }, scene);
  eonbotSparkA.parent = eonbotAnchor; eonbotSparkA.material = world.materials.warm; eonbotSparkA.isPickable = false;
  const eonbotSparkB = MeshBuilder.CreateSphere('w745-eonbot-spark-b', { diameter: 0.085, segments: 8 }, scene);
  eonbotSparkB.parent = eonbotAnchor; eonbotSparkB.material = world.materials.cyan; eonbotSparkB.isPickable = false;
  syncExpanseCompanionState();

  expanseGateway = mountEonExpanseW766AGatewayOverlook({ scene, quality: resolvedQuality, reducedMotion, worldSeed: expanseState.seed?.value || 1, initialMilestones: expanseState.worldMilestones || [], initialDiscovered: expanseState.discovered || ['gateway-overlook'], missionLedger: expanseMissionRuntime.getState(), initialProgress: deriveEonExpanseW766WorldProgress({ milestones: expanseState.worldMilestones || [], missionLedger: expanseMissionRuntime.getState() }), initialLivingContent: expanseLivingContent.getState(), initialFutureRegionActivation: expanseState.futureRegionActivation, onInteract: ({ action, discovery, npcId, ...detail }) => {
    if (action === 'enter-storm-sector') {
      const runtimeActivation = getStormSectorRuntimeActivation();
      const identityMatches = runtimeActivation?.regionId === detail.regionId
        && runtimeActivation?.gatewayId === detail.gatewayId
        && runtimeActivation?.activationId === detail.activationId
        && runtimeActivation?.packageDigest === detail.packageDigest;
      if (!identityMatches) {
        const rejected = freeze({ ok: false, reason: 'storm-sector-gateway-identity-stale', grantsXp: false, automaticTravel: false });
        onStatus?.('Storm Sector gateway changed. Review the current activation before entering.');
        onTelemetry?.(freeze({ type: 'w794d-storm-sector-entry', action, result: rejected, explicitUserAction: detail.explicitUserAction === true }));
        return rejected;
      }
      expanseStormSectorJourney.syncActivation(runtimeActivation);
      const result = expanseStormSectorJourney.startEnter({ explicitUserAction: detail.explicitUserAction === true, expectedActivationId: detail.activationId || '' });
      onStatus?.(result.ok ? 'Storm Sector transit is charging. Pathfinder remains in control.' : `Storm Sector entry unavailable: ${String(result.reason || 'gateway locked').replaceAll('-', ' ')}.`);
      onTelemetry?.(freeze({ type: 'w794d-storm-sector-entry', action, result, regionId: detail.regionId || '', gatewayId: detail.gatewayId || '', grantsXp: false, automaticTravel: false, oneCanonicalScene: true }));
      return result;
    }
    if (action === 'dock-eonbot') {
      const validation = validateEonExpanseW767LCompanionDockRequest({
        explicitUserAction: detail.explicitUserAction === true,
        expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE',
        bonded: expanseCompanionState?.bonded === true,
        transitActive: expanseTransitJourney.getState().status === 'active',
        guideActive: expanseGuideState?.active === true
      });
      if (!validation.ok) {
        onStatus?.(`EONBOT cannot dock right now: ${String(validation.reason || 'dock unavailable').replaceAll('-', ' ')}.`);
        onTelemetry?.(freeze({ type: 'w767l-companion-dock', ok: false, action, reason: validation.reason || '', oneCanonicalCompanion: true, grantsXp: false, mutatesMissionState: false, automaticDocking: false }));
        return validation;
      }
      const reaction = reactEonbotToExpanseInteraction({ action, discovery, npcId, ...detail });
      const result = freeze({ ...validation, reaction, oneCanonicalCompanion: true, grantsXp: false, mutatesMissionState: false, automaticDocking: false });
      onStatus?.(reaction.ok ? 'EONBOT is checking the Gateway Overlook recharge dock.' : 'The recharge dock is ready, but EONBOT is returning to formation.');
      onTelemetry?.(freeze({ type: 'w767l-companion-dock', ok: true, action, reaction, oneCanonicalCompanion: true, grantsXp: false, mutatesMissionState: false, automaticDocking: false }));
      return result;
    } else {
      reactEonbotToExpanseInteraction({ action, discovery, npcId, ...detail });
    }
    if (action === 'inspect-my-frontier-resident-station') {
      const inspection = deriveEonExpanseW768UResidentInspection({ slotId: detail.slotId, myFrontierState: expanseMyFrontier.getState() });
      const result = validateEonExpanseW768UResidentInspection(inspection, { explicitUserAction: detail.explicitUserAction === true, expectedSlotId: detail.slotId || '', expectedToken: detail.expectedToken || '' });
      const residentReaction = result.ok
        ? expanseMyFrontierRenderer?.reactResident?.({ slotId: inspection.slotId, residentId: inspection.residentId, explicitUserAction: true }) || freeze({ ok: false, reason: 'resident-presenter-unavailable', grantsXp: false, mutatesMissionState: false })
        : freeze({ ok: false, reason: 'resident-inspection-invalid', grantsXp: false, mutatesMissionState: false });
      const statusDetail = residentReaction.ok
        ? `${inspection.label}'s authored resident responds, then returns to idle.`
        : inspection.detail;
      onStatus?.(result.ok ? `${inspection.label}: ${statusDetail}` : `Resident station inspection unavailable: ${String(result.reason || 'state changed').replaceAll('-', ' ')}.`);
      onTelemetry?.(freeze({ type: 'w768z-my-frontier-resident-reaction', action, slotId: detail.slotId || '', residentId: detail.residentId || '', status: inspection.status || '', result, residentReaction, grantsXp: false, mutatesMissionState: false, privateContentStored: false, automaticDialogue: false }));
      return freeze({ ...result, residentReaction, grantsXp: false, mutatesMissionState: false, privateContentStored: false });
    }
    if (action === 'open-my-frontier-building-terminal') {
      const myFrontierState = expanseMyFrontier.getState();
      const projection = expanseMyFrontierConstruction.getSafeProjection(myFrontierState);
      const projectedPlot = projection.plots.find((entry) => entry.plotId === String(detail.plotId || '')) || null;
      const terminal = deriveEonExpanseW768RBuildingTerminal({ plotId: projectedPlot?.plotId || '', buildingId: projectedPlot?.constructedBuildingId || '', presentationStatus: projectedPlot?.status === 'constructed' ? 'constructed-foundation' : '' });
      const validated = validateEonExpanseW768RBuildingTerminal(terminal, { explicitUserAction: detail.explicitUserAction === true, expectedTerminalToken: detail.expectedTerminalToken || '', expectedPlotId: detail.plotId || '', expectedBuildingId: detail.buildingId || '', expectedStationId: detail.stationId || '', expectedSurface: detail.surface || '' });
      if (!validated.ok) {
        onStatus?.(`My Frontier terminal unavailable: ${String(validated.reason || 'state changed').replaceAll('-', ' ')}.`);
        onTelemetry?.(freeze({ type: 'w768r-my-frontier-building-terminal', action, result: validated, grantsXp: false, automaticOpen: false, privateContentStored: false }));
        return validated;
      }
      const opened = openSurfaceForStation(validated.action.stationId, { interactionPart: 'terminal', interactionSource: 'expanse-my-frontier-building-terminal', expanseContext: freeze({ type: 'my-frontier-building-terminal', plotId: validated.action.plotId, buildingId: validated.action.buildingId, nativeRoute: validated.action.nativeRoute, includesPrivateContent: false, reviewFirst: true }) }, validated.action.surface);
      onStatus?.(opened.ok ? `${validated.action.buildingLabel} opened its maintained EONAPP workspace.` : `Unable to open ${validated.action.buildingLabel}: ${String(opened.reason || 'workspace unavailable').replaceAll('-', ' ')}.`);
      onTelemetry?.(freeze({ type: 'w768r-my-frontier-building-terminal', action, plotId: validated.action.plotId, buildingId: validated.action.buildingId, stationId: validated.action.stationId, surface: validated.action.surface, result: opened, grantsXp: false, automaticOpen: false, privateContentStored: false }));
      return freeze({ ...opened, action: validated.action, grantsXp: false, automaticOpen: false });
    }
    if (action === 'inspect-my-frontier-plot') {
      const myFrontierState = expanseMyFrontier.getState();
      const inspection = deriveEonExpanseW768KPlotInspection({ plotId: detail.plotId, myFrontierState, constructionProjection: expanseMyFrontierConstruction.getSafeProjection(myFrontierState) });
      const result = validateEonExpanseW768KPlotInspection(inspection, { explicitUserAction: detail.explicitUserAction === true, expectedPlotId: detail.plotId, expectedToken: detail.expectedToken });
      const planner = result.ok ? expanseUiOverlay.openMyFrontierPlanner?.(inspection.plotId) || freeze({ ok:false, reason:'my-frontier-planner-unavailable' }) : null;
      onStatus?.(result.ok
        ? planner?.ok ? `${inspection.plotLabel}: choose an approved building, then Plan. Construction remains separately receipt-protected.` : `${inspection.plotLabel}: ${inspection.detail}`
        : `My Frontier inspection unavailable: ${String(result.reason || 'state changed').replaceAll('-', ' ')}.`);
      onTelemetry?.(freeze({ type: 'w768k-my-frontier-plot-inspection', action, plotId: detail.plotId || '', status: inspection.status || '', buildingId: inspection.buildingId || '', result, planner, grantsXp: false, mutatesProgression: false, privateContentStored: false }));
      return freeze({ ...result, planner, grantsXp:false, mutatesProgression:false });
    }
    if (action === 'return-to-command-hub') runtime?.returnFromExpanse?.({ explicitUserAction: true });
    if (['scan-dormant-eonbot', 'recover-companion-signal-core', 'restore-companion-link'].includes(action)) {
      const signalByAction = {
        'scan-dormant-eonbot': 'dormant-eonbot-scanned',
        'recover-companion-signal-core': 'companion-signal-core-recovered',
        'restore-companion-link': 'companion-link-restored'
      };
      const result = expanseMissionRuntime.recordSignal(signalByAction[action], { receiptId: `interaction:${action}` });
      const followup = result.ok && action === 'restore-companion-link'
        ? expanseMissionRuntime.start('beyond-the-gate', { explicitUserAction: true })
        : null;
      syncExpanseCompanionState();
      const statusByAction = {
        'scan-dormant-eonbot': 'EONBOT scan complete. Next: recover the loose signal core → approach it and press E / tap Use.',
        'recover-companion-signal-core': 'Signal core recovered. Next: return to dormant EONBOT and press E / tap Use to restore the companion link.',
        'restore-companion-link': 'Companion link restored. EONBOT is now permanently with Pathfinder. Next: follow the active Signal marker and press E / tap Use.'
      };
      onStatus?.(result.ok ? statusByAction[action] : 'Companion rescue objective is already recorded or still out of sequence.');
      onTelemetry?.(freeze({ type: 'w767a-companion-rescue-interaction', action, result, followup, companion: expanseCompanionState }));
    }
    if (action === 'activate-expanse-map') {
      const result = expanseMissionRuntime.recordSignal('map-opened', { receiptId: 'expanse:map-opened' });
      syncExpanseUi();
      expanseUiOverlay.openBoard();
      onStatus?.(result.ok ? 'Signal Frontier map activated. Next: review the panorama, then follow the active marker and press E / tap Use.' : 'Signal Frontier map is already active. Next: follow the active marker and press E / tap Use.');
      onTelemetry?.(freeze({ type: 'w766a-map-activated', action, result }));
    }
    if (action === 'meet-pathfinder') { const result = expanseMissionRuntime.recordSignal('pathfinder-met', { receiptId: 'npc:pathfinder:first-meeting' }); onStatus?.(result.ok ? 'Pathfinder briefing complete. The Signal Restoration campaign has advanced.' : 'Pathfinder is ready. Continue the current objective.'); onTelemetry?.(freeze({ type: 'w766d-npc-interaction', npcId, action, result })); }
    if (action === 'meet-navigator') { const result = expanseMissionRuntime.recordSignal('navigator-met', { receiptId: 'npc:navigator:first-meeting' }); onStatus?.(result.ok ? 'Navigator connected. Recover the three archive records.' : 'Navigator: continue the active Archive Ruins objective.'); onTelemetry?.(freeze({ type: 'w766d-npc-interaction', npcId, action, result })); }
    if (action === 'meet-maintainer') { const result = expanseMissionRuntime.recordSignal('maintainer-met', { receiptId: 'npc:maintainer:first-meeting' }); onStatus?.(result.ok ? 'Maintenance Worker connected. Activate all three relay nodes.' : 'Maintenance Worker: continue the active Transit Scar objective.'); onTelemetry?.(freeze({ type: 'w766d-npc-interaction', npcId, action, result })); }
    if (action === 'frontier-contract-interaction') {
      const result = expanseLivingContent.interactFrontierContract(detail.contract, { explicitUserAction: true });
      const status = result.status === 'reviewed'
        ? `${result.contract.label} reviewed. ${result.contract.objective} Begin with: ${result.nextStep?.label || 'the first field action'}.`
        : result.status === 'in-progress'
          ? `${result.contract.label} is active. Next: ${result.nextStep?.label || 'complete the remaining field action'}.`
          : result.reason === 'frontier-contract-already-completed'
            ? 'This frontier contract is already complete for the current cycle.'
            : 'This frontier contract is unavailable or failed validation.';
      onStatus?.(status);
      onTelemetry?.(freeze({ type: 'w766i-frontier-contract-interaction', action, contractId: detail.contract?.id || '', sectorId: detail.sectorId || '', result }));
    }
    if (action === 'frontier-contract-step') {
      const result = expanseLivingContent.progressFrontierContract(detail.contract, detail.stepId, { explicitUserAction: true });
      const status = result.status === 'progressed'
        ? `${result.completedStep?.label || 'Field action'} complete. Next: ${result.nextStep?.label || 'continue the contract'}.`
        : result.status === 'completed'
          ? `${result.contract.label} completed. ${result.awardedXp} XP added to the canonical progression ledger.`
          : result.reason === 'frontier-contract-review-required'
            ? 'Review the frontier landmark before completing its field actions.'
            : result.reason === 'frontier-contract-step-out-of-order'
              ? `Complete the field actions in order. Next: ${result.nextStep?.label || 'return to the contract marker'}.`
              : result.reason === 'frontier-contract-step-already-completed'
                ? 'This field action is already complete.'
                : result.reason === 'frontier-contract-already-completed'
                  ? 'This frontier contract is already complete for the current cycle.'
                  : 'This frontier field action is unavailable or failed validation.';
      onStatus?.(status);
      onTelemetry?.(freeze({ type: 'w766i-frontier-contract-step', action, contractId: detail.contract?.id || '', sectorId: detail.sectorId || '', stepId: detail.stepId || '', result }));
    }
    if (action === 'procedural-discovery-reviewed') {
      const result = expanseLivingContent.recordProceduralDiscovery(discovery, { explicitUserAction: true });
      onStatus?.(result.ok ? `${result.discovery.label || 'Frontier discovery'} recorded. ${result.awardedXp} XP added.` : result.reason === 'procedural-discovery-already-recorded' ? 'This frontier discovery is already recorded.' : 'This frontier discovery failed validation.');
      onTelemetry?.(freeze({ type: 'w766i-procedural-discovery', action, discoveryId: discovery?.id || '', result }));
    }
    if (action === 'living-world-interaction') {
      const result = expanseLivingContent.recordWorldInteraction(detail.interactionAction, { itemId: detail.itemId }, { explicitUserAction: true });
      const label = String(detail.missionId || 'side mission').replaceAll('-', ' ');
      if (result.completion?.ok && shouldClearEonExpanseW767VActivityGuidance({ activityObjective: expanseActivityGuidance?.objective, completedMissionId: detail.missionId })) {
        expanseActivityGuidance = null;
        expanseGuidance = buildCurrentExpanseGuidance();
        expanseGuideState = expanseGuideController.cancel('activity-completed').state;
      }
      onStatus?.(result.completion?.ok ? `${label} completed. ${result.completion.awardedXp} XP added to the canonical progression ledger.` : result.ok ? `${label} progress saved.` : 'This activity interaction was already recorded or is not currently valid.');
      onTelemetry?.(freeze({ type: 'w766f-side-activity-interaction', action: detail.interactionAction, detail, result }));
    }
    if (action === 'living-discovery') {
      const result = expanseLivingContent.recordDiscovery(detail.discoveryId, { receiptId: `physical-discovery:${detail.discoveryId}` });
      onStatus?.(result.ok ? `${result.discovery.label} discovered. ${result.awardedXp} XP added.` : 'This discovery is already recorded.');
      onTelemetry?.(freeze({ type: 'w766f-discovery-interaction', detail, result }));
    }
    if (action === 'productive-mission-review') {
      const stationByWorkspace = { create: 'create-forge', 'local-ai': 'local-ai-lab', automations: 'automation-theatre', library: 'library-vault', status: 'command-console' };
      const stationId = stationByWorkspace[detail.workspaceId] || '';
      const opened = stationId ? openSurfaceForStation(stationId, canvas, detail.workspaceId === 'status' ? 'command-status' : detail.workspaceId) : freeze({ ok: false, reason: 'workspace-station-not-mapped' });
      onStatus?.(opened.ok ? `Productive mission reviewed. Complete the ${detail.workspaceId} workspace and return with its receipt to earn XP.` : 'This productive mission workspace is unavailable.');
      onTelemetry?.(freeze({ type: 'w766f-productive-mission-review', detail, opened }));
    }
    if (action === 'dynamic-event-reviewed') {
      const reviewed = expanseLivingContent.reviewDynamicEvent({ eventId: detail.eventId, windowId: detail.windowId }, { explicitUserAction: true, at: Date.now() });
      const event = reviewed.ok ? reviewed.event : null;
      onStatus?.(reviewed.ok ? `${event.label} is active in ${event.zoneId.replaceAll('-', ' ')}. It is bounded and never blocks return to the Hub.` : reviewed.reason === 'dynamic-event-expired' ? 'That frontier event has ended. The marker has been cleared.' : 'No matching dynamic event is active.');
      onTelemetry?.(freeze({ type: 'w767o-dynamic-event-reviewed', detail, reviewed, event }));
    }
    if (['beacon-one-scanned', 'signal-components-recovered', 'beacon-one-repaired'].includes(action)) { const result = expanseMissionRuntime.recordSignal(action, { receiptId: `interaction:${action}` }); if (action === 'beacon-one-repaired' && result.ok) { expanseState = freeze({ ...expanseState, unlockedTransitNodes: freeze([...new Set([...(expanseState.unlockedTransitNodes || []), 'beacon-fields'])]), worldMilestones: freeze([...new Set([...(expanseState.worldMilestones || []), 'beacon-one-repaired'])]), updatedAt: Date.now() }); expansePersistence.write(expanseState); expanseMissionRuntime.recordSignal('beacon-fields-revealed', { receiptId: 'map:beacon-fields:revealed' }); } onStatus?.(result.ok ? `${action.replaceAll('-', ' ')}. First Light advanced.` : 'Beacon One interaction already recorded.'); onTelemetry?.(freeze({ type: 'w766e-beacon-one-interaction', action, result })); }
    if (['archive-records-recovered', 'archive-routing-solved', 'beacon-two-repaired'].includes(action)) { const result = expanseMissionRuntime.recordSignal(action, { receiptId: `interaction:${action}` }); if (action === 'beacon-two-repaired' && result.ok) { expanseState = freeze({ ...expanseState, unlockedTransitNodes: freeze([...new Set([...(expanseState.unlockedTransitNodes || []), 'archive-ruins'])]), worldMilestones: freeze([...new Set([...(expanseState.worldMilestones || []), 'beacon-two-repaired'])]), updatedAt: Date.now() }); expansePersistence.write(expanseState); } onStatus?.(result.ok ? `${action.replaceAll('-', ' ')}. Echoes in the Archive advanced.` : 'Archive objective already recorded or still blocked.'); onTelemetry?.(freeze({ type: 'w766e-archive-interaction', action, detail, result })); }
    if (['archive-record-collected', 'archive-records-recovered'].includes(action) && detail.recordId) persistExpanseInteractionMilestone(`archive-record:${detail.recordId}`, `interaction:archive-record:${detail.recordId}`);
    if (action === 'archive-record-collected') onStatus?.(`Archive record ${detail.count || 1}/3 recovered.`);
    if (action === 'archive-routing-blocked') onStatus?.('Recover all three archive records before using the routing console.');
    if (action === 'beacon-two-blocked') onStatus?.('Solve the Archive routing puzzle before repairing Beacon Two.');
    if (['relay-nodes-activated', 'transit-relay-stabilized', 'regional-transit-restored'].includes(action)) { const result = expanseMissionRuntime.recordSignal(action, { receiptId: `interaction:${action}` }); if (action === 'regional-transit-restored' && result.ok) { expanseState = freeze({ ...expanseState, unlockedTransitNodes: freeze([...new Set([...(expanseState.unlockedTransitNodes || []), 'transit-scar'])]), worldMilestones: freeze([...new Set([...(expanseState.worldMilestones || []), 'regional-transit-restored'])]), updatedAt: Date.now() }); expansePersistence.write(expanseState); } onStatus?.(result.ok ? `${action.replaceAll('-', ' ')}. The Broken Line advanced.` : 'Transit objective already recorded or still blocked.'); onTelemetry?.(freeze({ type: 'w766e-transit-scar-interaction', action, detail, result })); }
    if (['relay-node-activated', 'relay-nodes-activated'].includes(action) && detail.relayNodeId) persistExpanseInteractionMilestone(`relay-node:${detail.relayNodeId}`, `interaction:relay-node:${detail.relayNodeId}`);
    if (action === 'relay-node-activated') onStatus?.(`Relay node ${detail.count || 1}/3 activated.`);
    if (action === 'transit-stabilizer-blocked') onStatus?.('Activate all three relay nodes before stabilizing the line.');
    if (action === 'regional-transit-blocked') onStatus?.('Stabilize the Transit relay before restoring regional Transit.');
    if (['three-signals-verified', 'regional-core-synchronized', 'horizon-transit-unlocked', 'vault-route-opened', 'vault-chamber-entered'].includes(action)) {
      const result = expanseMissionRuntime.recordSignal(action, { receiptId: `interaction:${action}` });
      if (result.ok) {
        const unlocks = action === 'horizon-transit-unlocked' ? ['horizon-vault'] : [];
        expanseState = freeze({ ...expanseState, unlockedTransitNodes: freeze([...new Set([...(expanseState.unlockedTransitNodes || []), ...unlocks])]), worldMilestones: freeze([...new Set([...(expanseState.worldMilestones || []), action])]), updatedAt: Date.now() });
        expansePersistence.write(expanseState);
      }
      onStatus?.(result.ok ? `${action.replaceAll('-', ' ')}. Horizon Reconnected advanced.` : 'Horizon Vault objective already recorded or still blocked.');
      onTelemetry?.(freeze({ type: 'w766g-horizon-vault-interaction', action, detail, result }));
    }
    if (action === 'signal-vanguard-claimed') {
      const claimed = expanseMissionRuntime.claimSignalVanguard({ explicitUserAction: true, receiptId: 'reward:signal-vanguard' });
      const objective = claimed.ok ? expanseMissionRuntime.recordSignal('signal-vanguard-claimed', { receiptId: 'interaction:signal-vanguard-claimed' }) : claimed;
      onStatus?.(claimed.ok ? 'Signal Vanguard Reveal claimed. Activate the cosmetic at the halo.' : 'Signal Vanguard Reveal was already claimed or remains locked.');
      onTelemetry?.(freeze({ type: 'w766g-vault-reveal', action, claimed, objective }));
    }
    if (action === 'signal-vanguard-activated') {
      const selected = expanseMissionRuntime.selectCosmetic('signal-vanguard-glow', { explicitUserAction: true });
      const objective = selected.ok ? expanseMissionRuntime.recordSignal('signal-vanguard-activated', { receiptId: 'interaction:signal-vanguard-activated' }) : selected;
      onStatus?.(selected.ok ? 'Signal Vanguard glow activated and saved.' : 'Claim the Signal Vanguard Reveal before activation.');
      onTelemetry?.(freeze({ type: 'w766g-cosmetic-activation', action, selected, objective }));
    }
    if (action === 'horizon-verification-blocked') onStatus?.('Restore Beacon One, Beacon Two, and regional Transit before verification.');
    if (action === 'regional-core-blocked') onStatus?.('Verify all three restored signals before synchronizing the core.');
    if (action === 'horizon-transit-blocked') onStatus?.('Synchronize the regional core before unlocking Horizon Transit.');
    if (action === 'vault-route-blocked') onStatus?.('Unlock Horizon Transit before opening the Vault route.');
    if (action === 'vault-entry-blocked') onStatus?.('Open the Vault route before entering the chamber.');
    if (action === 'vault-reveal-blocked') onStatus?.('Enter the Vault chamber before claiming the Reveal.');
    if (action === 'cosmetic-activation-blocked') onStatus?.('Claim the Signal Vanguard Reveal before activating it.');
    if (action === 'discover-zone' && discovery?.id) {
      expanseState = freeze({ ...expanseState, currentZone: discovery.id, discovered: freeze([...new Set([...(expanseState.discovered || []), discovery.id])]), updatedAt: Date.now() });
      expansePersistence.write(expanseState);
      expanseMissionRuntime.recordSignal(`zone:${discovery.id}`, { receiptId: `discovery:${discovery.id}` });
      if (discovery.id === 'beacon-fields') expanseMissionRuntime.recordSignal('beacon-fields-revealed', { receiptId: 'map:beacon-fields:revealed' });
      onStatus?.(`${discovery.label} discovered. Expanse map and mission progress saved.`);
      onTelemetry?.(freeze({ type: 'w766b-zone-discovered', discovery }));
    }
    syncExpanseWorldProgress();
    syncExpanseUi();
  } });
  if (!expanseGateway?.ok) throw new Error(`w766a-gateway-overlook-mount-failed:${expanseGateway?.reason || 'unknown'}`);
  // L95-W16B/D — Storm is unavailable to ordinary players until certified,
  // so its presenter/interactions/NPC/transit meshes must not tax Command Hub
  // startup. Construct the region once, on the first certified explicit entry,
  // then reuse it for the rest of the canonical-scene session.
  const ensureStormSectorPresenters = () => {
    if (expanseStormSectorPresenter?.ok
      && expanseStormSectorInteractions?.ok
      && expanseStormSectorNpcs?.ok
      && expanseStormSectorTransitPresenter?.ok
      && expanseStormSectorTransformations?.ok) {
      return freeze({ ok: true, reused: true });
    }
    expanseStormSectorPresenter = mountEonExpanseW792CStormSectorPresenter({ scene, reducedMotion, assetAdmission: pendingOptionalAssetAdmission });
    if (!expanseStormSectorPresenter?.ok) throw new Error(`w792c-storm-sector-presenter-mount-failed:${expanseStormSectorPresenter?.reason || 'unknown'}`);
    expanseStormSectorInteractions = mountEonExpanseW795BStormSectorInteractionPresenter({
      scene,
      parent: expanseStormSectorPresenter.root,
      reducedMotion,
      onInteract: (event = {}) => {
        const action = String(event.action || '');
        const persistedActivation = getStormSectorRuntimeActivation();
        const identityMatches = expanseActiveRegionId === 'storm-sector'
          && persistedActivation?.activationId === event.activationId
          && persistedActivation?.packageDigest === event.packageDigest;
        if (!identityMatches) return freeze({ ok: false, reason: 'storm-sector-interaction-identity-stale', grantsXp: false });
        if (action === 'return-signal-frontier') {
          expanseStormSectorJourney.syncActivation(persistedActivation);
          const result = expanseStormSectorJourney.startReturn({ explicitUserAction: event.explicitUserAction === true, expectedActivationId: event.activationId || '' });
          onStatus?.(result.ok ? 'Return transit is charging. Signal Frontier remains preserved.' : `Return unavailable: ${String(result.reason || 'gateway unavailable').replaceAll('-', ' ')}.`);
          onTelemetry?.(freeze({ type: 'w795d-storm-sector-return', action, result, grantsXp: false, automaticTravel: false, oneCanonicalScene: true }));
          return result;
        }
        const reviewOnlyStorm = !expanseState.futureRegionActivation && stormReviewActivation?.reviewOnly === true;
        if (reviewOnlyStorm) {
          const ownerReview = stormReviewActivation?.ownerReview === true;
          const result = freeze({ ok: false, reason: ownerReview ? 'owner-review-read-only' : 'direct-review-read-only', ownerReview, directReview: !ownerReview, grantsXp: false, mutatesMissionState: false, persistsProgression: false });
          onStatus?.(ownerReview
            ? 'OWNER REVIEW · Storm mission interactions are read-only. Public certification/progression remains unchanged.'
            : 'DIRECT REVIEW · Storm mission interactions are read-only. Review grants no certification, XP or progression.');
          onTelemetry?.(freeze({ type: ownerReview ? 'l95-owner-review-storm-interaction' : 'rt90-direct-review-storm-interaction', action, result, privateContentStored: false }));
          return result;
        }
        const result = expanseStormSectorMissions.recordAction(action, { explicitUserAction: event.explicitUserAction === true, receiptId: `storm:${persistedActivation.activationId}:${action}` });
        if (result.ok) {
          expanseState = freeze({ ...expanseState, stormSectorMissions: result.state, updatedAt: Date.now() });
          expansePersistence.write(expanseState);
          expanseStormSectorInteractions?.apply?.({ regionActive: true, state: result.state, expectedActivationId: persistedActivation.activationId, expectedPackageDigest: persistedActivation.packageDigest });
          expanseStormSectorTransitPresenter?.apply?.({ regionActive: true, missionState: result.state, expectedActivationId: persistedActivation.activationId, expectedPackageDigest: persistedActivation.packageDigest, journeyState: expanseStormSectorTransit.getState(), currentPosition: playerAnchor.position });
          expanseStormSectorTransformations?.apply?.({ regionActive: true, missionState: result.state, expectedActivationId: persistedActivation.activationId, expectedPackageDigest: persistedActivation.packageDigest });
          const captureType = result.regionCompleted ? 'region' : result.missionCompleted ? 'mission' : 'objective';
          const captureLabel = result.regionCompleted ? 'Storm Sector restored' : result.missionCompleted ? `${String(result.missionId || 'Storm mission').replaceAll('-', ' ')} restored` : `${String(result.objectiveId || 'Storm objective').replaceAll('-', ' ')} complete`;
          expanseStormSectorCapture.record({ type: captureType, objectiveId: result.objectiveId || '', missionId: result.regionCompleted ? 'storm-sector' : result.missionId || '', label: captureLabel }, { explicitUserAction: true });
        }
        onStatus?.(result.ok ? (result.regionCompleted ? 'Storm Sector restored. Next: explore, talk to a patrol, open EONBOT, or open Worlds to switch regions.' : `Next: ${result.view.nextObjective?.label || 'follow the active Storm objective'} · follow the marker and press E / tap Use.`) : `Storm objective unavailable: ${String(result.reason || 'out of sequence').replaceAll('-', ' ')}.`);
        onTelemetry?.(freeze({ type: 'w795d-storm-sector-mission', action, result, grantsXp: false, automaticProgression: false, privateContentStored: false }));
        return result;
      }
    });
    if (!expanseStormSectorInteractions?.ok) throw new Error(`w795b-storm-sector-interaction-presenter-mount-failed:${expanseStormSectorInteractions?.reason || 'unknown'}`);
    expanseStormSectorNpcs = mountEonExpanseW796BStormNpcPresenter({
      scene,
      parent: expanseStormSectorPresenter.root,
      reducedMotion,
      assetAdmission: pendingOptionalAssetAdmission,
      onInteract: (event = {}) => {
        const activation = getStormSectorRuntimeActivation();
        if (expanseActiveRegionId !== 'storm-sector' || event.activationId !== activation?.activationId || event.packageDigest !== activation?.packageDigest) return freeze({ ok: false, reason: 'storm-npc-identity-stale', grantsXp: false, mutatesMissionState: false });
        const view = expanseStormSectorMissions.getView();
        const briefing = String(event.briefing || 'Follow the active Storm Sector objective in order.');
        const next = view.nextObjective?.label ? ` Next: ${view.nextObjective.label} · follow the marker and press E / tap Use.` : ' Storm Sector is restored. Next: explore, open EONBOT, or open Worlds to switch regions.';
        onStatus?.(`${event.label || 'Storm Sector resident'}: ${briefing}${next}`);
        const result = freeze({ ok: true, npcId: event.npcId || '', briefing, nextObjective: view.nextObjective || null, grantsXp: false, mutatesMissionState: false, automaticDialogue: false });
        onTelemetry?.(freeze({ type: 'w796c-storm-sector-npc-briefing', ...result, explicitUserAction: event.explicitUserAction === true, privateContentStored: false }));
        return result;
      }
    });
    if (!expanseStormSectorNpcs?.ok) throw new Error(`w796b-storm-sector-npc-presenter-mount-failed:${expanseStormSectorNpcs?.reason || 'unknown'}`);
    expanseStormSectorTransitPresenter = mountEonExpanseW797BStormTransitPresenter({
      scene,
      parent: expanseStormSectorPresenter.root,
      reducedMotion,
      onInteract: (event = {}) => {
        const activation = getStormSectorRuntimeActivation();
        if (expanseActiveRegionId !== 'storm-sector' || event.activationId !== activation?.activationId || event.packageDigest !== activation?.packageDigest) return freeze({ ok: false, reason: 'storm-transit-identity-stale', grantsXp: false, automaticTravel: false });
        const result = expanseStormSectorTransit.start({ destinationNodeId: event.nodeId || '', currentPosition: playerAnchor.position, missionState: expanseStormSectorMissions.getState(), explicitUserAction: event.explicitUserAction === true });
        onStatus?.(result.ok ? `Regional Transit charging for ${result.node?.label || 'the selected node'}.` : `Transit unavailable: ${String(result.reason || 'route unavailable').replaceAll('-', ' ')}.`);
        onTelemetry?.(freeze({ type: 'w797c-storm-sector-transit-start', nodeId: event.nodeId || '', result, explicitUserAction: event.explicitUserAction === true, grantsXp: false, automaticTravel: false, oneCanonicalScene: true }));
        return result;
      }
    });
    if (!expanseStormSectorTransitPresenter?.ok) throw new Error(`w797b-storm-sector-transit-presenter-mount-failed:${expanseStormSectorTransitPresenter?.reason || 'unknown'}`);
    expanseStormSectorTransformations = mountEonExpanseW799BStormTransformationPresenter({ scene, parent: expanseStormSectorPresenter.root, reducedMotion });
    if (!expanseStormSectorTransformations?.ok) throw new Error(`w799b-storm-sector-transformation-presenter-mount-failed:${expanseStormSectorTransformations?.reason || 'unknown'}`);
    onTelemetry?.(freeze({ type: 'l95-storm-sector-presenters-mounted', trigger: 'first-certified-entry', sameSessionReuse: true, eagerBootMount: false }));
    return freeze({ ok: true, reused: false });
  };
  // L95-W16B/D — My Frontier is a substantial authored/procedural scene. Do
  // not construct its meshes or start authored-asset requests during ordinary
  // Command Hub / Signal Frontier boot. Mount once on first explicit entry and
  // then retain the renderer for same-session reuse.
  let myFrontierOptionalAssetsHeldForFirstFrame = false;
  const ensureMyFrontierRenderer = () => {
    if (expanseMyFrontierRenderer?.ok) return expanseMyFrontierRenderer;
    // RT90 closure: the collision-safe procedural shell is gameplay-critical,
    // but authored GLB detail is optional for first paint. Hold optional decode
    // and scene attachment until one canonical My Frontier frame has rendered.
    const firstFrameAssetAdmission = freeze({
      pressure: 'critical',
      visibility: globalThis.document?.visibilityState === 'hidden' ? 'hidden' : 'visible',
      reason: 'my-frontier-first-frame'
    });
    expanseMyFrontierRenderer = mountEonExpanseW768IMyFrontierRenderer({ scene, parent: expanseGateway.root, quality: resolvedQuality, reducedMotion, assetAdmission: firstFrameAssetAdmission });
    if (!expanseMyFrontierRenderer?.ok) throw new Error(`w768i-my-frontier-renderer-mount-failed:${expanseMyFrontierRenderer?.reason || 'unknown'}`);
    // activate() below owns the first presentation application. Do not apply the
    // same payload twice on the synchronous entry path.
    myFrontierOptionalAssetsHeldForFirstFrame = true;
    onTelemetry?.(freeze({ type: 'l95-my-frontier-renderer-mounted', trigger: 'first-explicit-entry', sameSessionReuse: true, eagerBootMount: false, optionalAssetsHeldForFirstFrame: true }));
    return expanseMyFrontierRenderer;
  };
  let myFrontierEntryAwaitingFirstFrame = false;
  const worldPerformanceLedger = createEonCityL95WorldPerformanceLedger({ now });
  let worldPerformanceAwaitingFirstFrameId = '';
  const captureWorldPerformanceAssetSnapshot = (worldRegionId = '') => {
    const id = String(worldRegionId || '');
    if (id === 'signal-frontier') {
      const summary = expanseGateway?.getSummary?.() || {};
      const hero = summary.heroAssets || {};
      const streamer = summary.frontier?.streamer || {};
      return freeze({
        requested: hero.requested,
        presented: hero.loaded,
        queued: Array.isArray(hero.pendingAssets) ? hero.pendingAssets.length : null,
        loading: hero.pending,
        pending: hero.pending,
        rejected: hero.failed,
        mountedSectors: streamer.activeCount,
        activeOptionalLoads: hero.pending,
        source: 'signal-frontier-runtime-summary'
      });
    }
    if (id === 'storm-sector') {
      const summary = expanseStormSectorPresenter?.getSummary?.() || {};
      return freeze({
        requested: summary.requestedHeroCount,
        presented: summary.presentedHeroCount,
        queued: summary.queuedHeroCount,
        loading: summary.loadingHeroCount,
        pending: summary.pendingTasks,
        rejected: summary.rejectedHeroCount,
        mountedSectors: summary.activeCellCount,
        activeOptionalLoads: summary.activeHeroLoads,
        source: 'storm-sector-runtime-summary'
      });
    }
    if (id === 'my-frontier') {
      const summary = expanseMyFrontierRenderer?.getSummary?.() || {};
      const publicInfrastructure = summary.publicInfrastructure || {};
      const ambientCast = summary.ambientCast || {};
      const authored = summary.authoredAssets || {};
      const compositions = summary.buildingCompositions || {};
      const residents = summary.residentAssets || {};
      const requested = Number(publicInfrastructure.requested || 0) + Number(ambientCast.requested || 0) + Number(authored.requested || 0) + Number(compositions.requestedPartCount || 0) + Number(residents.requested || 0);
      const presented = Number(publicInfrastructure.presented || 0) + Number(ambientCast.presented || 0) + Number(authored.presented || 0) + Number(compositions.presentedPartCount || 0) + Number(residents.presented || 0);
      const queued = Number(publicInfrastructure.queued || 0) + Number(ambientCast.queued || 0) + Number(authored.queued || 0) + Number(compositions.queuedPartCount || 0) + Number(residents.queued || 0);
      const loading = Number(publicInfrastructure.loading || 0) + Number(authored.loading || 0) + Number(compositions.loadingPartCount || 0) + Number(residents.loading || 0);
      const pending = Number(publicInfrastructure.pendingTasks || 0) + Number(ambientCast.pendingTasks || 0) + Number(authored.pendingTasks || 0) + Number(compositions.pendingTasks || 0) + Number(residents.pendingTasks || 0);
      const rejected = Number(publicInfrastructure.rejected || 0) + Number(authored.rejected || 0) + Number(compositions.rejectedPartCount || 0) + Number(residents.rejected || 0);
      const activeOptionalLoads = Number(publicInfrastructure.activeLoads || 0) + Number(ambientCast.activeLoads || 0) + Number(authored.activeLoads || 0) + Number(compositions.activeLoads || 0) + Number(residents.activeLoads || 0);
      return freeze({ requested, presented, queued, loading, pending, rejected, mountedSectors: summary.plotCount, activeOptionalLoads, source: 'my-frontier-runtime-summary' });
    }
    return freeze({ source: 'unsupported-world' });
  };
  const beginObservedWorldPerformanceSession = (worldRegionId = '', reason = 'explicit-entry') => {
    const result = worldPerformanceLedger.begin({
      worldRegionId,
      reason,
      engineCount: 1,
      sceneCount: 1,
      renderLoopOwnerCount: 1,
      assetSnapshot: captureWorldPerformanceAssetSnapshot(worldRegionId)
    });
    if (result.ok) worldPerformanceAwaitingFirstFrameId = String(worldRegionId || '');
    return result;
  };
  const finishObservedWorldPerformanceSession = (worldRegionId = '', reason = 'return-to-command-hub') => {
    if (worldPerformanceAwaitingFirstFrameId === String(worldRegionId || '')) worldPerformanceAwaitingFirstFrameId = '';
    return worldPerformanceLedger.finish({ worldRegionId, reason, assetSnapshot: captureWorldPerformanceAssetSnapshot(worldRegionId) });
  };
  const recordMyFrontierEntryDiagnostic = (stageName, { ok = null, reason = '', detail = '' } = {}) => {
    const stageValue = String(stageName || 'unknown').slice(0, 80);
    const reasonValue = String(reason || '').slice(0, 160);
    const detailValue = String(detail || '').slice(0, 160);
    if (productRoot?.dataset) {
      productRoot.dataset.eonCityMyFrontierEntryStage = stageValue;
      productRoot.dataset.eonCityMyFrontierEntryOk = ok === null ? 'pending' : ok ? 'true' : 'false';
      productRoot.dataset.eonCityMyFrontierEntryReason = reasonValue;
      productRoot.dataset.eonCityMyFrontierEntryDetail = detailValue;
    }
    onTelemetry?.(freeze({ type: 'rt89-my-frontier-entry-stage', stage: stageValue, ok, reason: reasonValue, detail: detailValue, grantsXp: false, storesPrivateContent: false }));
    return freeze({ stage: stageValue, ok, reason: reasonValue, detail: detailValue });
  };
  syncExpanseCompanionState();
  productRoot.dataset.eonCityWorldMode = expanseWorldMode.getState().mode;

  stage('SCENE_CREATED');
  reliabilityController.recordStage('scene-created');
  const movement = { forward: new Set(), backward: new Set(), left: new Set(), right: new Set() };
  const analog = new Map();
  const heldKeys = new Map();
  const sprintSources = new Set();
  let destroyed = false;
  let manualPaused = false;
  let documentHidden = globalThis.document?.visibilityState === 'hidden';
  let contextLost = false;
  let contextLossCount = 0;
  let contextRestoreCount = 0;
  let lowFpsSamples = 0;
  let highFpsSamples = 0;
  const fpsTimeline = [];
  let lastFpsSample = freeze({ at: 0, fps: 0, engineFps: 0, sampleMs: 0, frames: 0, backgroundPresentation: false, documentHidden, samplePhase: 'startup', quality: resolvedQuality, hardwareScalingLevel: currentHardwareScalingLevel, worldRegionId: 'command-hub' });
  let performanceProtectionLevel = 0;
  let lastPerformanceProtectionAt = 0;
  let lastPerformanceProtectionReason = '';
  let lastPerformanceRecoveryAt = 0;
  let lastPerformanceRecoveryReason = '';
  let firstFrame = false;
  let workSurfaceOpen = false;
  let workSurfaceOpenedAt = 0;
  let lastInputEvent = freeze({ source: 'runtime', direction: '', active: false, accepted: false, reason: 'not-started', at: 0 });
  let keydownEvents = 0;
  let keyupEvents = 0;
  let lastRawKeyboardEvent = freeze({ type: '', key: '', code: '', resolvedCode: '', targetTag: '', targetEditable: false, activeElementTag: '', accepted: false, reason: 'not-started', at: 0 });
  let renderLoopFrames = 0;
  let movementUpdateCalls = 0;
  let lastRenderAt = 0;
  let lastMovementUpdateAt = 0;
  let lastReliabilityRenderDecision = 'not-started';
  let sceneRenderCalls = 0;
  let lastSceneRenderError = '';
  let movementRenderRecovery = null;
  let lastSimulationClockAt = Date.now();
  let simulationAccumulatorSeconds = 0;
  let lastSimulationStepAt = 0;
  let simulationStepCount = 0;
  let simulationSource = 'not-started';
  let fallbackClockHandle = null;
  let fallbackClockGeneration = 0;
  let fallbackClockTickCount = 0;
  let fallbackSimulationStepCount = 0;
  let renderSimulationStepCount = 0;
  let duplicateStepPreventedCount = 0;
  let lastSimulationDeltaSeconds = 0;
  let startMovementSimulationFallback = null;
  let stopMovementSimulationFallback = null;
  let settleMovementBeforeSourceRelease = null;
  let releaseSettlementStepCount = 0;
  let releaseSettlementDistance = 0;
  let lastReleaseSettlement = freeze({ attempted: false, allowed: false, source: '', reason: 'not-started', unprocessedElapsedMs: 0, boundedElapsedMs: 0, fixedStepsApplied: 0, distanceApplied: 0, skippedReason: 'not-started', at: 0 });
  let axisReadCount = 0;
  let activeAxisFrameCount = 0;
  let lastAxis = freeze({ right: 0, forward: 0, active: false });
  let lastBeforePosition = freeze({ x: 0, z: 0 });
  let lastRequestedPosition = freeze({ x: 0, z: 0 });
  let lastClampedPosition = freeze({ x: 0, z: 0 });
  let lastTravelledDistance = 0;
  let lastMovementBlockReason = 'no-input';
  let lastR08Locomotion = deriveEonCityR08Locomotion();
  let movementFrameCount = 0;
  let movementDistance = 0;
  let lastMovementAt = 0;
  let nearestStation = null;
  let nearestDiscovery = null;
  let lastNearestId = '';
  let activeMissionId = '';
  let activeStationId = '';
  let lastResumeWrite = 0;
  let lastTelemetry = 0;
  let playerMotion = 'idle';
  let playerPresentationState = 'idle';
  let heroPresentationSnapshot = null;
  const heroPresentationDirector = createEonCityW745HeroPresentationDirector({ now });
  const heroPresentationTruth = getEonCityW745HeroPresentationTruth();
  let lastCharacterMotionSnapshot = null;
  const locomotionTruth = createEonCityW695LocomotionTruthController({
    initialPosition: EON_CITY_W731_SPAWN,
    initialHeading: EON_CITY_W731_SPAWN.heading,
    stopHoldMs: EON_CITY_W761_CHARACTER_PROFILE.locomotion.stopBlendSeconds * 1000,
    headingSmoothing: Math.min(0.72, EON_CITY_W761_CHARACTER_PROFILE.locomotion.turnResponsiveness / 12)
  });
  let localAssetRuntime = null;
  const assetCacheBaselinePromise = inspectEonCityAssetCache({ navigatorRef: globalThis.navigator, cachesRef: globalThis.caches, requestPersistence: false }).catch(() => null);
  let assetCacheBaseline = null;
  let assetTransferObservation = null;
  let assetTransferObservationReason = 'not-observed';
  const refreshAssetTransferObservation = async (reason = 'manual') => {
    try {
      assetCacheBaseline = assetCacheBaseline || await assetCacheBaselinePromise;
      assetTransferObservation = observeEonCityL95AssetTransfer({ performanceRef: globalThis.performance, cacheStatus: assetCacheBaseline || {}, baseUrl: globalThis.location?.href || 'https://eonapp.invalid/' });
      assetTransferObservationReason = String(reason || 'manual');
      productRoot.dataset.eonCityAssetNetworkTransfers = String(assetTransferObservation.networkTransferAssetCount || 0);
      productRoot.dataset.eonCityAssetLocalReuse = String(assetTransferObservation.localReuseOnlyAssetCount || 0);
      productRoot.dataset.eonCityAssetTransferProfile = String(assetTransferObservation.sessionProfile || 'unknown');
      return freeze({ ok: true, reason: assetTransferObservationReason, observation: assetTransferObservation, cacheBaseline: assetCacheBaseline, description: describeEonCityL95AssetTransferObservation(assetTransferObservation) });
    } catch (error) {
      assetTransferObservationReason = `observation-failed:${String(error?.message || error || 'unknown')}`;
      return freeze({ ok: false, reason: assetTransferObservationReason, observation: assetTransferObservation, cacheBaseline: assetCacheBaseline });
    }
  };
  let pendingOptionalAssetAdmission = freeze({ pressure: 'nominal', visibility: 'visible', reason: 'startup' });
  let playerAsset = null;
  let playerAnimationReadiness = freeze({ ready: false, source: 'procedural-fallback', required: freeze(['idle', 'walk', 'run']), states: freeze({ idle: true, walk: true, run: true }), availableClipCount: 0 });
  let eonbotAsset = null;
  const visibleFrameState = {
    authoredEnvironmentReady: 0,
    authoredHeroCharactersReady: 0,
    gateComplete: false,
    degraded: true
  };
  const npcAssets = new Map();
  let lastFrameAt = now();
  let fpsSampleAt = now();
  let fpsFrames = 0;
  let measuredFps = 0;
  let activationPulse = null;
  let cameraMode = 'arrival';
  let cameraSafetyRecoveryCount = 0;
  let lastCameraSafetyRecovery = freeze({ ok: true, recovered: false, reason: 'not-required', at: 0 });
  let spatialDiagnosticsVisible = false;
  const spatialDiagnostics = createEonCityW747SpatialDiagnostics();

  const stationState = world.stations;
  const discoveryState = world.discoveries;
  const spatialOverlay = createEonCityW747DiagnosticsOverlay(scene, world.root, spatialDiagnostics);
  const registerSpatialNode = (id, node, options = {}) => {
    const bounds = getEonCityW747NodeWorldBounds(node);
    if (!bounds) return freeze({ ok: false, reason: 'node-bounds-unavailable', id });
    return spatialDiagnostics.registerLoadedAsset({ id, bounds, ...options });
  };
  const registerLoadedSpatialAsset = (id, loaded, options = {}) => {
    if (!isEonCityW759PresentationReady(loaded) || !loaded?.bounds) return freeze({ ok: false, reason: 'loaded-presentation-unavailable', id });
    return spatialDiagnostics.registerLoadedAsset({ id, bounds: loaded.bounds, ...options });
  };
  registerSpatialNode('procedural:operations-command-table', world.commandTable, {
    primaryRole: 'operations-command-table', groupId: 'operations-crescent'
  });
  registerSpatialNode('procedural:eonbot-dock', world.dock, {
    groupId: 'eonbot-nexus', allowHeroZone: true, allowArrivalRay: true
  });
  for (const [stationId, record] of stationState) {
    registerSpatialNode(`fallback:station:${stationId}`, record.root, {
      primaryRole: stationId === 'eonbot-nexus' ? 'living-nexus-core' : stationId,
      groupId: stationId,
      allowHeroZone: stationId === 'eonbot-nexus',
      allowArrivalRay: stationId === 'eonbot-nexus'
    });
  }
  for (const [discoveryId, record] of discoveryState) {
    registerSpatialNode(`fallback:discovery:${discoveryId}`, record.root, {
      primaryRole: discoveryId, groupId: discoveryId
    });
  }
  for (const column of world.commandColumns || []) {
    registerSpatialNode(`procedural:${column.name}`, column, { groupId: 'command-canopy' });
  }
  const npcExclusionZones = createEonCityW765R6NpcExclusionZones(EON_CITY_W731_STATIONS);
  productRoot.dataset.eonCitySpatialRepairAuthority = EON_CITY_W765R6_SPATIAL_REPAIR_SCHEMA;
  const playerCollisionZones = createEonCityW765R6PlayerCollisionZones([
    ...EON_CITY_W731_STATIONS.map((station) => ({ id: `station:${station.id}`, kind: 'station', position: station.position, footprintRadius: station.footprintRadius })),
    ...EON_CITY_W737_DISCOVERIES.map((discovery) => ({ id: `discovery:${discovery.id}`, kind: 'discovery', position: discovery.position, footprintRadius: 1.72 })),
    { id: 'structure:command-table', kind: 'structure', position: EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.position, footprintRadius: EON_CITY_W747_OPERATIONS_CRESCENT.commandTable.footprintRadius },
    { id: 'structure:command-seat', kind: 'structure', position: EON_CITY_W747_OPERATIONS_CRESCENT.commandSeat.position, footprintRadius: EON_CITY_W747_OPERATIONS_CRESCENT.commandSeat.footprintRadius },
    { id: 'structure:district-hologram', kind: 'structure', position: EON_CITY_W747_OPERATIONS_CRESCENT.districtHologram.position, footprintRadius: EON_CITY_W747_OPERATIONS_CRESCENT.districtHologram.footprintRadius },
    { id: 'structure:eonbot-dock', kind: 'structure', position: EON_CITY_W747_OPERATIONS_CRESCENT.eonbotDock.position, footprintRadius: EON_CITY_W747_OPERATIONS_CRESCENT.eonbotDock.footprintRadius },
    ...EON_CITY_W765R6_CANOPY_SUPPORTS.map((support) => ({ id: `support:${support.id}`, kind: 'support', position: { x: Math.sin(support.angle) * support.radius, y: 0, z: Math.cos(support.angle) * support.radius }, footprintRadius: Math.hypot(support.width, support.depth) / 2 }))
  ], { margin: EON_CITY_W765R6_PLAYER_COLLISION_RADIUS });
  productRoot.dataset.eonCityPlayerCollision = 'deterministic-footprint-v1';
  productRoot.dataset.eonCityNpcExclusionZoneCount = String(npcExclusionZones.length);
  productRoot.dataset.eonCitySpatialAuthority = EON_CITY_W747_SPATIAL_SCHEMA;
  productRoot.dataset.eonCityHeroZoneDiameter = String(EON_CITY_W747_HERO_ZONE.diameter);
  productRoot.dataset.eonCityCastTransitAuthority = EON_CITY_W754_SCHEMA;
  productRoot.dataset.eonCityCapsuleId = EON_CITY_W754_CAPSULE_ID;
  productRoot.dataset.eonCityCommandCoreConvergence = EON_CITY_W760_W765_SCHEMA;
  productRoot.dataset.eonCityNexusAuthority = EON_CITY_W749_LIVING_NEXUS_SCHEMA;
  productRoot.dataset.eonCityMissionAuthority = EON_CITY_W752_SCHEMA;
  const setSpatialDiagnosticsVisible = (visible, { advancedDiagnostics = false } = {}) => {
    if (!advancedDiagnostics) return freeze({ ok: false, reason: 'advanced-diagnostics-required', visible: spatialDiagnosticsVisible });
    spatialDiagnosticsVisible = spatialOverlay.setVisible(Boolean(visible));
    return freeze({ ok: true, visible: spatialDiagnosticsVisible, report: spatialDiagnostics.getReport() });
  };
  const forcePlayerIdle = (reason = 'movement-stopped') => {
    simulationAccumulatorSeconds = 0;
    lastSimulationClockAt = Date.now();
    lastCharacterMotionSnapshot = locomotionTruth.reset({
      position: playerAnchor.position,
      worldHeading: playerAnchor.rotation.y
    });
    playerMotion = 'idle';
    playerPresentationState = 'idle';
    const animations = playerAsset?.animations;
    const accepted = animations?.playStationary?.('idle', { restart: true })
      ?? animations?.play?.('idle', { restart: true });
    animations?.stabilize?.();
    lastMovementBlockReason = String(reason || 'movement-stopped');
    return accepted !== false;
  };
  const setDirection = (directionName, active, source = 'external', { settleBeforeRelease = true, releaseReason = 'input-release' } = {}) => {
    const bucket = movement[directionName];
    if (!bucket) return false;
    const previousAxis = axis();
    const key = String(source || 'external').slice(0, 64);
    if (!active && settleBeforeRelease) settleMovementBeforeSourceRelease?.({ source: key, reason: releaseReason, allowSettlement: true });
    if (active) bucket.add(key); else bucket.delete(key);
    const nextAxis = axis();
    if (!previousAxis.active && nextAxis.active) {
      movementRenderRecovery?.activate({ source: key, reason: 'movement-activated' });
      startMovementSimulationFallback?.(key);
    }
    if (previousAxis.active && !nextAxis.active) {
      movementRenderRecovery?.deactivate('movement-inactive');
      stopMovementSimulationFallback?.('movement-inactive');
      forcePlayerIdle(releaseReason || 'movement-inactive');
    }
    lastInputEvent = freeze({ source: key, direction: directionName, active: Boolean(active), accepted: true, reason: 'direction-updated', at: Date.now() });
    return true;
  };
  const clearInput = (reason = 'clear-input') => {
    for (const bucket of Object.values(movement)) bucket.clear();
    analog.clear();
    heldKeys.clear();
    sprintSources.clear();
    movementRenderRecovery?.deactivate(reason);
    stopMovementSimulationFallback?.(reason);
    forcePlayerIdle(reason);
    lastInputEvent = freeze({ source: 'runtime', direction: '', active: false, accepted: true, reason: String(reason || 'clear-input'), at: Date.now() });
  };
  const inputLockManager = createEonCityW766IR2InputLockLeaseManager({
    now: Date.now,
    onEvent: (event) => {
      try { productRoot.dataset.eonCityInputLockOwners = event.activeOwners.join('|'); } catch {}
      onTelemetry?.(freeze({ type: 'w766ir2-input-lock', event }));
    }
  });
  const surfaceManager = createEonCityR03SurfaceManager({ environment: globalThis, root: productRoot });
  productRoot.dataset.eonCitySurfaceManager = EON_CITY_R03_SURFACE_SCHEMA;
  const workSurfaceRegistration = surfaceManager.register('work-surface', {
    close: ({ restoreFocus = false } = {}) => {
      const controller = globalThis.document?.querySelector?.('[data-eon-work-surface-host]')?.EONWorkSurfaceController;
      if (!controller?.getState?.().open) return freeze({ ok: true, state: 'already-closed' });
      controller.close?.({ restoreFocus });
      return freeze({ ok: true, state: 'closed' });
    },
    minimize: () => {
      const controller = globalThis.document?.querySelector?.('[data-eon-work-surface-host]')?.EONWorkSurfaceController;
      return controller?.minimize?.({ restoreFocus: true }) || freeze({ ok: false, reason: 'work-surface-controller-unavailable' });
    },
    restore: () => {
      const controller = globalThis.document?.querySelector?.('[data-eon-work-surface-host]')?.EONWorkSurfaceController;
      return controller?.restore?.() || freeze({ ok: false, reason: 'work-surface-controller-unavailable' });
    },
    preferMinimizeOnHandoff: true
  });
  const surfaceShelf = globalThis.document?.createElement?.('section') || null;
  if (surfaceShelf) {
    surfaceShelf.className = 'eon-city-surface-shelf';
    surfaceShelf.dataset.eonCitySurfaceShelf = '1';
    surfaceShelf.hidden = true;
    surfaceShelf.setAttribute('aria-label', 'Minimized City windows');
    globalThis.document.body?.append?.(surfaceShelf);
  }
  const surfaceLabel = (id) => {
    if (id === 'work-surface') return globalThis.document?.querySelector?.('[data-eon-work-surface-host]')?.EONWorkSurfaceController?.getState?.()?.invocation?.definition?.label || 'Workspace';
    return ({ 'city-menu': 'City Menu', 'transit-review': 'Transit', 'expanse-review': 'Signal Frontier', 'accessible-map': 'Accessible Map' })[id] || id;
  };
  const renderSurfaceShelf = (snapshot = surfaceManager.getSnapshot()) => {
    if (!surfaceShelf) return;
    const minimized = (snapshot?.surfaces || []).filter((entry) => entry.open && entry.minimized);
    surfaceShelf.innerHTML = minimized.map((entry) => `<button type="button" data-eon-city-surface-restore="${safeText(entry.id)}">Restore ${safeText(surfaceLabel(entry.id))}</button>`).join('');
    surfaceShelf.hidden = minimized.length === 0;
  };
  const onSurfaceState = (event) => renderSurfaceShelf(event?.detail?.snapshot);
  const onSurfaceShelfClick = (event) => {
    const button = event.target.closest?.('[data-eon-city-surface-restore]');
    if (!button) return;
    surfaceManager.restore(button.dataset.eonCitySurfaceRestore, { reason: 'surface-shelf-restore' });
  };
  globalThis.addEventListener?.(EON_CITY_R03_SURFACE_STATE_EVENT, onSurfaceState);
  surfaceShelf?.addEventListener?.('click', onSurfaceShelfClick);
  renderSurfaceShelf();
  const acquireInputLease = (ownerId, metadata = {}) => {
    const result = inputLockManager.acquire(ownerId, metadata);
    if (result.ok) clearInput(`input-lock:${ownerId}`);
    return result;
  };
  const releaseInputLease = (ownerId, reason = 'explicit-close') => inputLockManager.releaseAllForOwner(ownerId, reason);
  let reconcileOrphanedInputLocks = () => freeze({ ok: true, recoveredOwnerIds: freeze([]), pending: true });
  let lastOrphanedInputReconcileAt = -Infinity;
  const runtimeReadinessAuthority = globalThis.EON_CITY_RUNTIME_READINESS || null;
  runtimeReadinessAuthority?.setLifecycleHandlers?.({
    onShow: ({ source } = {}) => acquireInputLease('city-readiness', { source: source || 'city-readiness', reason: 'explicit-open' }),
    onHide: ({ reason } = {}) => releaseInputLease('city-readiness', reason || 'explicit-close')
  });
  const axis = () => {
    let right = (movement.right.size ? 1 : 0) - (movement.left.size ? 1 : 0);
    let forward = (movement.forward.size ? 1 : 0) - (movement.backward.size ? 1 : 0);
    for (const value of analog.values()) { right += Number(value.x || 0); forward += Number(value.z || 0); }
    const magnitude = Math.hypot(right, forward);
    if (magnitude > 1) { right /= magnitude; forward /= magnitude; }
    const value = freeze({ right, forward, active: magnitude > 0.001 });
    axisReadCount += 1;
    lastAxis = value;
    return value;
  };
  const getMovementBlockReason = () => {
    if (destroyed) return 'runtime-destroyed';
    if (documentHidden) return 'document-hidden';
    if (manualPaused) return 'manual-pause';
    reconcileOrphanedInputLocks();
    const inputLocks = inputLockManager.getSnapshot();
    if (inputLocks.movementBlocked) return `input-lock:${inputLocks.activeOwnerIds[0] || 'unknown'}`;
    if (workSurfaceOpen) return 'work-surface-open-diagnostic';
    if (ui?.isMenuOpen?.()) return 'ui-open-without-input-lease';
    if (expanseUiOverlay.isBoardOpen?.() === true) return 'expanse-board-open';
    if (expanseTransitJourney.getState().status === 'active') return 'expanse-transit-active';
    if (expanseStormSectorTransit.getState().status === 'active') return 'storm-sector-transit-active';
    if (['departing', 'returning'].includes(expanseStormSectorJourney.getState().status)) return 'storm-sector-journey-active';
    return '';
  };

  const captureCameraPose = () => freeze({
    alpha: Number(camera.alpha), beta: Number(camera.beta), radius: Number(camera.radius),
    target: freeze({ x: Number(camera.target.x), y: Number(camera.target.y), z: Number(camera.target.z) }),
    mode: cameraMode
  });
  const applyCameraPose = (pose = EON_CITY_W747_CAMERA_POSES.follow, mode = pose.id || 'follow') => {
    camera.alpha = Number(pose.alpha);
    camera.beta = Number(pose.beta);
    camera.radius = Number(pose.radius);
    camera.lowerRadiusLimit = Number(pose.lowerRadiusLimit || EON_CITY_W731_WORLD_BOUNDS.cameraRadiusMin);
    camera.upperRadiusLimit = Number(pose.upperRadiusLimit || EON_CITY_W731_WORLD_BOUNDS.cameraRadiusMax);
    camera.lowerBetaLimit = Number(pose.lowerBetaLimit || EON_CITY_W731_WORLD_BOUNDS.cameraBetaMin);
    camera.upperBetaLimit = Number(pose.upperBetaLimit || EON_CITY_W731_WORLD_BOUNDS.cameraBetaMax);
    camera.setTarget(new Vector3(Number(pose.target.x), Number(pose.target.y), Number(pose.target.z)));
    cameraMode = String(mode || pose.id || 'follow');
    return captureCameraPose();
  };
  const restoreCameraPose = (pose = null) => {
    if (!pose?.target) return applyCameraPose(EON_CITY_W747_CAMERA_POSES.follow, 'follow');
    camera.alpha = Number(pose.alpha);
    camera.beta = Number(pose.beta);
    camera.radius = Number(pose.radius);
    camera.setTarget(new Vector3(Number(pose.target.x), Number(pose.target.y), Number(pose.target.z)));
    cameraMode = String(pose.mode || 'follow');
    return captureCameraPose();
  };
  const inspectCameraFloorSafety = () => inspectEonCityW747CameraFloorSafety({
    position: camera.position,
    target: camera.target,
    beta: camera.beta,
    floorY: 0,
    minimumCameraClearance: 0.35,
    minimumTargetHeight: 0.65,
    lowerBetaLimit: EON_CITY_W747_CAMERA_POSES.follow.lowerBetaLimit,
    upperBetaLimit: EON_CITY_W747_CAMERA_POSES.follow.upperBetaLimit
  });
  const recoverUnsafeCamera = (reason = 'frame-safety') => {
    const inspection = inspectCameraFloorSafety();
    if (inspection.ok) return freeze({ ok: true, recovered: false, inspection });
    const before = captureCameraPose();
    const expanseActive = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
    const playerY = Number.isFinite(Number(playerAnchor.position.y)) ? Number(playerAnchor.position.y) : 0;
    camera.lowerRadiusLimit = EON_CITY_W747_CAMERA_POSES.follow.lowerRadiusLimit;
    camera.upperRadiusLimit = expanseActive ? 26 : EON_CITY_W747_CAMERA_POSES.follow.upperRadiusLimit;
    camera.lowerBetaLimit = EON_CITY_W747_CAMERA_POSES.follow.lowerBetaLimit;
    camera.upperBetaLimit = EON_CITY_W747_CAMERA_POSES.follow.upperBetaLimit;
    camera.alpha = Number.isFinite(Number(camera.alpha)) ? Number(camera.alpha) : EON_CITY_W747_CAMERA_POSES.follow.alpha;
    camera.beta = EON_CITY_W747_CAMERA_POSES.follow.beta;
    camera.radius = expanseActive
      ? Math.max(12, Math.min(22, Number.isFinite(Number(camera.radius)) ? Number(camera.radius) : 16))
      : EON_CITY_W747_CAMERA_POSES.follow.radius;
    camera.setTarget(new Vector3(
      Number.isFinite(Number(playerAnchor.position.x)) ? Number(playerAnchor.position.x) : EON_CITY_W731_SPAWN.x,
      Math.max(1.35, playerY + EON_CITY_W747_CAMERA_POSES.follow.targetHeight),
      Number.isFinite(Number(playerAnchor.position.z)) ? Number(playerAnchor.position.z) : EON_CITY_W731_SPAWN.z
    ));
    cameraMode = expanseActive ? 'expanse-follow-recovered' : 'follow';
    cameraSafetyRecoveryCount += 1;
    lastCameraSafetyRecovery = freeze({
      ok: true,
      recovered: true,
      reason: String(reason || 'frame-safety'),
      causes: inspection.reasons,
      before,
      after: captureCameraPose(),
      at: Date.now()
    });
    try {
      productRoot.dataset.eonCityCameraSafetyRecovery = String(cameraSafetyRecoveryCount);
      productRoot.dataset.eonCityLastCameraSafetyReason = inspection.reasons.join(',');
    } catch {}
    onTelemetry?.(freeze({ type: 'w766ir2g-camera-floor-recovery', recovery: lastCameraSafetyRecovery }));
    onStatus?.('Camera position was recovered safely without reloading EON City.');
    return lastCameraSafetyRecovery;
  };
  const focusCameraOnStation = (station) => {
    if (!station) return applyCameraPose(EON_CITY_W760_CAMERA_POSES.return, 'return');
    if (station.id === 'eonbot-nexus') return applyCameraPose(EON_CITY_W760_CAMERA_POSES.nexusFocus, 'nexus-focus');
    const dx = Number(station.focus.x) - Number(station.position.x);
    const dz = Number(station.focus.z) - Number(station.position.z);
    const pose = {
      alpha: Math.atan2(dz, dx), beta: 1.05,
      radius: Math.max(8.6, Math.min(12.2, Number(station.footprintRadius || 2.5) * 3.35)),
      target: { x: station.position.x, y: 1.55, z: station.position.z },
      lowerRadiusLimit: 6.8, upperRadiusLimit: 15.5, lowerBetaLimit: 0.72, upperBetaLimit: 1.36
    };
    return applyCameraPose(pose, 'station-focus');
  };
  const applyPlayerPose = (pose = {}, { stationId = '', save = true, camera = 'follow' } = {}) => {
    const sanitized = sanitizeEonCityW747WorldPoint(pose);
    const safe = clampEonCityW731Position(sanitized);
    playerAnchor.position.set(safe.x, 0, safe.z);
    if (Number.isFinite(Number(pose.heading))) playerAnchor.rotation.y = Number(pose.heading);
    locomotionTruth.reset({ position: playerAnchor.position, worldHeading: playerAnchor.rotation.y });
    lastCharacterMotionSnapshot = locomotionTruth.getSnapshot();
    if (camera === 'arrival') {
      applyCameraPose(EON_CITY_W747_CAMERA_POSES.arrival, 'arrival');
      applyCameraPose(EON_CITY_W760_CAMERA_POSES.arrival, 'arrival');
    }
    else if (camera === 'return') applyCameraPose(EON_CITY_W760_CAMERA_POSES.return, 'return');
    else if (camera === 'follow') {
      cameraMode = 'follow';
      camera.setTarget(new Vector3(playerAnchor.position.x, EON_CITY_W747_CAMERA_POSES.follow.targetHeight, playerAnchor.position.z));
    }
    activeStationId = stationId || activeStationId;
    if (save) writeResume(playerAnchor.position, playerAnchor.rotation.y, activeStationId);
    return freeze({ ...safe, sanitized: sanitized.sanitized });
  };

  const projector = (entity, kind = 'station') => {
    const record = kind === 'discovery' ? discoveryState.get(entity.id) : stationState.get(entity.id);
    const target = record?.focusNode?.getAbsolutePosition?.() || new Vector3(entity.position.x, 2.3, entity.position.z);
    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const projected = Vector3.Project(target, Matrix.IdentityReadOnly, scene.getTransformMatrix(), viewport);
    const cameraSpace = Vector3.TransformCoordinates(target, scene.getViewMatrix());
    const visible = cameraSpace.z > 0 && projected.x > -120 && projected.x < engine.getRenderWidth() + 120 && projected.y > -80 && projected.y < engine.getRenderHeight() + 100;
    return freeze({ x: projected.x, y: projected.y, depth: projected.z, visible });
  };


  const projectExpansePoint = (target = {}) => {
    const worldPoint = target instanceof Vector3 ? target : new Vector3(Number(target.x || 0), Number(target.y || 0), Number(target.z || 0));
    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const projected = Vector3.Project(worldPoint, Matrix.IdentityReadOnly, scene.getTransformMatrix(), viewport);
    const cameraSpace = Vector3.TransformCoordinates(worldPoint, scene.getViewMatrix());
    const inFront = cameraSpace.z > 0;
    const visible = inFront && projected.x > -90 && projected.x < engine.getRenderWidth() + 90 && projected.y > -70 && projected.y < engine.getRenderHeight() + 90;
    return freeze({ x: projected.x, y: projected.y, depth: projected.z, inFront, visible });
  };
  const isExpanseInteractionMetadata = (metadata = {}) => {
    const kind = String(metadata.kind || '');
    return Boolean(metadata.action) && (kind.startsWith('expanse-') || kind.startsWith('w766a-expanse-') || kind.startsWith('w767a-companion-') || kind.startsWith('storm-sector-'));
  };
  const isDescendantOfNode = (node, ancestor) => {
    if (!node || !ancestor) return false;
    let current = node;
    for (let depth = 0; current && depth < 24; depth += 1) {
      if (current === ancestor) return true;
      current = current.parent || null;
    }
    return false;
  };
  const resolveExpansePointerInteraction = (pickedMesh = null) => {
    if (!pickedMesh) return freeze({ ok: false, reason: 'expanse-pointer-no-mesh' });
    let current = pickedMesh;
    for (let depth = 0; current && depth < 24; depth += 1) {
      const metadata = current.metadata || {};
      if (isExpanseInteractionMetadata(metadata)) {
        return freeze({
          ok: true,
          ownerMesh: current,
          metadata,
          targetId: getEonExpanseW767BInteractionTargetId(metadata, current.name),
          presenterOwned: true,
          canonicalCompanionFallback: false
        });
      }
      current = current.parent || null;
    }
    const rescueAction = String(expanseCompanionState?.nextAction || '');
    if (rescueAction && expanseCompanionState?.rescuePresentationVisible === true && isDescendantOfNode(pickedMesh, eonbotAnchor)) {
      const metadata = freeze({
        kind: 'w767a-companion-rescue',
        action: rescueAction,
        label: rescueAction === 'restore-companion-link' ? 'Restore EONBOT link' : rescueAction === 'recover-companion-signal-core' ? 'Recover signal core' : 'Scan dormant EONBOT',
        interactive: true
      });
      return freeze({
        ok: true,
        ownerMesh: eonbotAnchor,
        metadata,
        targetId: getEonExpanseW767BInteractionTargetId(metadata, pickedMesh.name),
        presenterOwned: false,
        canonicalCompanionFallback: true
      });
    }
    return freeze({ ok: false, reason: 'expanse-pointer-unresolved' });
  };
  const expanseMeshWorldPoint = (mesh) => {
    try {
      mesh.computeWorldMatrix?.(true);
      const center = mesh.getBoundingInfo?.().boundingBox?.centerWorld;
      if (center && Number.isFinite(center.x) && Number.isFinite(center.y) && Number.isFinite(center.z)) return center.clone?.() || new Vector3(center.x, center.y, center.z);
    } catch {}
    const absolute = mesh?.getAbsolutePosition?.();
    return absolute?.clone?.() || new Vector3(Number(absolute?.x || 0), Number(absolute?.y || 0), Number(absolute?.z || 0));
  };
  const isExpansePointOccluded = (target, sourceIdentity = '') => {
    const origin = camera.position.clone();
    const delta = target.subtract(origin);
    const length = delta.length();
    if (!Number.isFinite(length) || length <= 1.2) return false;
    const ray = new Ray(origin, delta.scale(1 / length), length);
    const hit = scene.pickWithRay?.(ray, (mesh) => {
      if (!mesh?.isEnabled?.() || mesh.isVisible === false || Number(mesh.visibility ?? 1) < 0.08) return false;
      const name = String(mesh.name || '');
      if (name.startsWith('w766h-objective-marker-') || name.startsWith('w767b-objective-ground-circuit-') || name.startsWith('w737-player-') || name.startsWith('w737-eonbot-') || name.startsWith('w745-eonbot-')) return false;
      const identity = getEonExpanseW767BLabelIdentity(mesh.metadata || {}, name);
      if (sourceIdentity && identity === sourceIdentity) return false;
      return mesh.checkCollisions === true || mesh.metadata?.interactive === true || Number(mesh.visibility ?? 1) >= 0.25;
    }, false);
    return Boolean(hit?.hit && Number(hit.distance || length) < length - 0.7);
  };
  let lastExpanseLabelSummary = freeze({ selected: freeze([]), primaryCount: 0, nearbyCount: 0, rejectedCount: 0 });
  const updateExpanseWorldLabels = () => {
    if (expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE') {
      expanseUiOverlay.updateLabels?.([]);
      expanseUiOverlay.updateInteraction?.({ expanseActive: false, transitActive: false, target: null });
      lastExpanseLabelSummary = freeze({ selected: freeze([]), primaryCount: 0, nearbyCount: 0, rejectedCount: 0, nearestInteraction: null });
      return lastExpanseLabelSummary;
    }
    const candidates = [];
    const objectiveTarget = expanseGuidance?.active && expanseGuidance?.target
      ? new Vector3(Number(expanseGuidance.target.x || 0), Number(expanseGuidance.target.y || 0.2) + 5.55, Number(expanseGuidance.target.z || 0))
      : null;
    if (objectiveTarget) {
      const projection = projectExpansePoint(objectiveTarget);
      const distance = Math.hypot(objectiveTarget.x - playerAnchor.position.x, objectiveTarget.z - playerAnchor.position.z);
      candidates.push(freeze({
        id: `objective:${String(expanseGuidance.objective || 'active')}`,
        label: String(expanseGuidance.guidance || expanseGuidance.prompt || expanseGuidance.objective || 'Active objective').split(' · ')[0],
        primaryObjective: true,
        distance,
        x: projection.x,
        y: projection.y,
        visible: projection.visible,
        inFront: projection.inFront,
        occluded: distance > 7 && isExpansePointOccluded(objectiveTarget)
      }));
    }
    const deduped = new Map();
    for (const mesh of scene.meshes || []) {
      const metadata = mesh?.metadata || {};
      if (!isExpanseInteractionMetadata(metadata) || !mesh?.isEnabled?.() || mesh.isPickable === false || mesh.isVisible === false || Number(mesh.visibility ?? 1) < 0.02) continue;
      const position = expanseMeshWorldPoint(mesh);
      const distance = Math.hypot(position.x - playerAnchor.position.x, position.z - playerAnchor.position.z);
      if (!Number.isFinite(distance) || distance > 20) continue;
      const overlapsObjective = Boolean(objectiveTarget && Math.hypot(position.x - objectiveTarget.x, position.z - objectiveTarget.z) < 2.4);
      const labelIdentity = getEonExpanseW767BLabelIdentity(metadata, mesh.name);
      const interactionTargetId = getEonExpanseW767BInteractionTargetId(metadata, mesh.name);
      const projection = projectExpansePoint(position.add(new Vector3(0, 0.5, 0)));
      const candidate = freeze({
        id: interactionTargetId,
        labelIdentity,
        label: formatEonExpanseW767BInteractionLabel(metadata),
        primaryObjective: false,
        distance,
        x: projection.x,
        y: projection.y,
        visible: projection.visible,
        inFront: projection.inFront,
        suppressWorldLabel: overlapsObjective,
        occluded: distance > 4.5 && isExpansePointOccluded(position, labelIdentity)
      });
      const previous = deduped.get(interactionTargetId);
      if (!previous || candidate.distance < previous.distance) deduped.set(interactionTargetId, candidate);
    }
    const rt91InteractionTarget = rt91Integration.getActiveTarget(expanseActiveRegionId);
    if (rt91InteractionTarget?.position) {
      const position = new Vector3(Number(rt91InteractionTarget.position.x || 0), Number(rt91InteractionTarget.position.y || 0.2), Number(rt91InteractionTarget.position.z || 0));
      const distance = Math.hypot(position.x - playerAnchor.position.x, position.z - playerAnchor.position.z);
      if (Number.isFinite(distance) && distance <= 20) {
        const projection = projectExpansePoint(position.add(new Vector3(0, 0.5, 0)));
        deduped.set(rt91InteractionTarget.targetId, freeze({
          id: rt91InteractionTarget.targetId, labelIdentity: rt91InteractionTarget.targetId,
          label: String(rt91InteractionTarget.objectiveLabel || 'Flagship objective'), primaryObjective: false, distance,
          x: projection.x, y: projection.y, visible: projection.visible, inFront: projection.inFront,
          suppressWorldLabel: true, occluded: distance > 4.5 && isExpansePointOccluded(position, rt91InteractionTarget.targetId),
          rt91: true
        }));
      }
    }
    candidates.push(...[...deduped.values()].filter((candidate) => candidate.suppressWorldLabel !== true));
    const arbitration = arbitrateEonExpanseW767BLabels(candidates, { maxPrimary: 1, maxNearby: 2, maxDistance: 18, maxPrimaryDistance: 180 });
    const nearestInteraction = [...deduped.values()].filter((candidate) => candidate.distance <= 5.2 && candidate.visible && candidate.inFront && !candidate.occluded).sort((a, b) => a.distance - b.distance)[0] || null;
    const selected = freeze(arbitration.selected.map((candidate) => freeze({ ...candidate, keyboardHint: Boolean(!coarsePointer && nearestInteraction && candidate.id === nearestInteraction.id) })));
    lastExpanseLabelSummary = freeze({ ...arbitration, selected, nearestInteraction: nearestInteraction ? freeze({ id: nearestInteraction.id, label: nearestInteraction.label, distance: nearestInteraction.distance }) : null });
    expanseUiOverlay.updateLabels?.(selected);
    expanseUiOverlay.updateInteraction?.({
      expanseActive: true,
      transitActive: expanseTransitJourney.getState().status === 'active',
      target: lastExpanseLabelSummary.nearestInteraction
    });
    return lastExpanseLabelSummary;
  };
  const expanseInteractionReasonCopy = (reason = '') => {
    const code = String(reason || 'expanse-interaction-rejected');
    if (code === 'no-nearby-expanse-interaction') return 'Move closer to the highlighted object, then press E / tap Use.';
    if (code === 'expanse-interaction-target-changed') return 'The nearby target changed. Face the highlighted object and try again.';
    if (code === 'expanse-transit-active') return 'Interaction is paused while Transit is moving.';
    if (code === 'expanse-not-active') return 'Enter an Open World before using world interactions.';
    if (code === 'explicit-user-action-required') return 'Use E, click, or tap Use to interact.';
    if (code === 'rt91-objective-not-in-range') return 'Move closer to the flagship objective, then press E / tap Use.';
    if (code === 'rt91-objective-target-changed') return 'The flagship objective changed. Follow the current marker and try again.';
    if (code === 'reviewed-native-outcome-required') return 'Complete or review the required real EONAPP action first, then return here and press E / tap Use.';
    if (code === 'reviewed-native-action-required') return 'Complete the required reviewed City or EONBOT action first, then return here and press E / tap Use.';
    if (code === 'opened-vault-reveal-required') return 'Open one earned deterministic Vault Reveal first, then return here and press E / tap Use.';
    if (code === 'reviewed-travel-receipt-required') return 'Complete one reviewed regional Transit journey first, then return here and press E / tap Use.';
    if (code === 'productive-receipt-selection-changed') return 'The reviewed EONAPP proof changed. Recheck the current action, then press E / tap Use again.';
    if (code === 'productive-receipt-authority-unavailable') return 'Complete the reviewed EONAPP action first; this productive objective cannot be faked in the world.';
    return `Interaction unavailable: ${code.replaceAll('-', ' ')}.`;
  };
  const recordExpanseInteractionDiagnostic = ({ source = '', expectedTargetId = '', currentTargetId = '', distance = null, accepted = false, reason = '' } = {}) => {
    const activeOwnerIds = inputLockManager.getSnapshot().activeOwnerIds || [];
    const record = freeze({
      source: String(source || 'unknown').slice(0, 48),
      expectedTargetId: String(expectedTargetId || '').slice(0, 180),
      currentTargetId: String(currentTargetId || '').slice(0, 180),
      distance: Number.isFinite(Number(distance)) ? Number(distance) : null,
      accepted: accepted === true,
      reason: String(reason || '').slice(0, 160),
      regionId: String(expanseActiveRegionId || '').slice(0, 80),
      boardOpen: expanseUiOverlay.isBoardOpen?.() === true,
      activeInputLockOwners: freeze(activeOwnerIds.map((value) => String(value).slice(0, 80)).slice(0, 8)),
      at: Date.now(),
      storesPrivateContent: false
    });
    if (productRoot?.dataset) {
      productRoot.dataset.eonCityLastExpanseInteractionSource = record.source;
      productRoot.dataset.eonCityLastExpanseInteractionTarget = record.currentTargetId;
      productRoot.dataset.eonCityLastExpanseInteractionExpectedTarget = record.expectedTargetId;
      productRoot.dataset.eonCityLastExpanseInteractionAccepted = record.accepted ? 'true' : 'false';
      productRoot.dataset.eonCityLastExpanseInteractionReason = record.reason;
      productRoot.dataset.eonCityLastExpanseInteractionRegion = record.regionId;
      productRoot.dataset.eonCityLastExpanseInteractionDistance = record.distance === null ? '' : String(Math.round(record.distance * 100) / 100);
      productRoot.dataset.eonCityLastExpanseInteractionInputOwners = record.activeInputLockOwners.join('|');
    }
    onTelemetry?.(freeze({ type: 'rt89-expanse-interaction-decision', ...record }));
    return record;
  };
  interactNearestExpanseAction = ({ explicitUserAction = false, expectedTargetId = '', source = 'expanse-proximity' } = {}) => {
    const labels = updateExpanseWorldLabels();
    const currentTargetId = String(labels?.nearestInteraction?.id || '');
    const currentDistance = labels?.nearestInteraction?.distance;
    const validation = validateEonExpanseW767IInteractionDispatch({
      explicitUserAction,
      expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE',
      transitActive: expanseTransitJourney.getState().status === 'active' || expanseStormSectorTransit.getState().status === 'active' || ['departing', 'returning'].includes(expanseStormSectorJourney.getState().status),
      expectedTargetId,
      currentTargetId
    });
    if (!validation.ok) {
      recordExpanseInteractionDiagnostic({ source, expectedTargetId, currentTargetId, distance: currentDistance, accepted: false, reason: validation.reason });
      onStatus?.(expanseInteractionReasonCopy(validation.reason));
      return validation;
    }
    const rt91Target = rt91Integration.getActiveTarget(expanseActiveRegionId);
    const result = rt91Target?.targetId === validation.targetId
      ? rt91Integration.completeActiveObjective({ worldId: expanseActiveRegionId, playerPosition: playerAnchor.position, explicitUserAction: true, expectedTargetId: validation.targetId })
      : expanseActiveRegionId === 'storm-sector'
        ? interactNearestStormSector(playerAnchor.position, { maxDistance: 5.2, explicitUserAction: true, expectedTargetId: validation.targetId, source })
        : expanseGateway?.interactNearest?.(playerAnchor.position, { maxDistance: 5.2, explicitUserAction: true, expectedTargetId: validation.targetId, source }) || freeze({ ok: false, reason: 'expanse-interaction-unavailable' });
    recordExpanseInteractionDiagnostic({ source, expectedTargetId, currentTargetId: validation.targetId, distance: currentDistance, accepted: result.ok === true, reason: result.ok ? 'interaction-accepted' : String(result.reason || 'expanse-interaction-rejected') });
    if (result.ok) {
      expanseLostAssistanceState = expanseLostAssistance.recordInteraction({ at: Date.now() }).state;
      updateExpanseWorldLabels();
      syncExpanseUi();
    } else {
      if (result.reason === 'expanse-interaction-target-changed') updateExpanseWorldLabels();
      onStatus?.(expanseInteractionReasonCopy(result.reason));
    }
    return result;
  };

  const interactionRegistry = createEonCityW748InteractionRegistry();
  let nexusEventAdapter = null;
  try {
    nexusEventAdapter = createEonNexusCityProjectionAdapter({
      environment: globalThis,
      document: globalThis.document
    });
  } catch {
    onStatus?.('Living Nexus source adapter is unavailable; bounded guide mode remains active.');
  }
  const nexusStationRecord = stationState.get('eonbot-nexus');
  const livingNexus = createEonCityW749LivingNexus({
    scene,
    stationRecord: nexusStationRecord,
    MeshBuilder,
    TransformNode,
    Vector3,
    materials: world.materials,
    eventAdapter: nexusEventAdapter,
    readContinuity: () => {
      try { return readEonNexusCityContinuityProjection(); }
      catch { return null; }
    },
    getMissions: () => {
      try { return buildEonCityW737MissionView(); }
      catch { return []; }
    },
    environment: globalThis,
    now: Date.now,
    reducedMotion: () => reducedMotion,
    onStatus
  });
  if (livingNexus.ok) {
    for (const node of nexusStationRecord?.fallbackVisualNodes || []) node.setEnabled?.(false);
    for (const node of nexusStationRecord?.stationDetailNodes || []) node.setEnabled?.(false);
    spatialDiagnostics.unregisterLoadedAsset('fallback:station:eonbot-nexus');
    registerSpatialNode('procedural:w749-living-nexus', livingNexus.root, {
      primaryRole: 'living-nexus-core',
      groupId: 'eonbot-nexus',
      allowHeroZone: true,
      allowArrivalRay: true
    });
  }
  const commandStatusController = createEonCityTruthfulCommandCenterController({
    fetchImpl: globalThis.fetch,
    now: Date.now
  });
  const agentTheatreController = createEonCityGenuineAgentTheatreController({ now: Date.now });
  const commandCentreStationRecord = stationState.get('command-console');
  const commandCentre = createEonCityW750CommandCentre({
    scene,
    stationRecord: commandCentreStationRecord,
    MeshBuilder,
    TransformNode,
    Vector3,
    DynamicTexture,
    StandardMaterial,
    materials: world.materials,
    environment: globalThis,
    getNexusView: () => livingNexus.getView?.() || {},
    getCommandSnapshot: () => commandStatusController.getSnapshot(),
    getTheatreSnapshot: () => agentTheatreController.getSnapshot(),
    subscribeCommand: (listener) => commandStatusController.subscribe(listener),
    subscribeTheatre: (listener) => agentTheatreController.subscribe(listener),
    districtCount: 9,
    reducedMotion: () => reducedMotion,
    onStatus
  });
  if (commandCentre.ok) {
    registerSpatialNode('procedural:w750-command-centre-live-walls', commandCentre.root, {
      primaryRole: 'command-centre-live-walls',
      groupId: 'command-console'
    });
  }
  let productiveStationStorage = null;
  try {
    productiveStationStorage = globalThis.localStorage;
  } catch {
    productiveStationStorage = null;
  }
  const productiveStations = createEonCityW751ProductiveStations({
    storage: productiveStationStorage,
    environment: globalThis,
    now: Date.now
  });
  const missionsProgression = createEonCityW752MissionsProgression({
    stationController: productiveStations,
    storage: productiveStationStorage,
    environment: globalThis,
    now: Date.now
  });
  const stationMonitorValidation = validateEonCityW765R7WallDisplayContract({ stations: EON_CITY_W731_STATIONS });
  const stationMonitors = new Map();
  const wallGalleryStations = EON_CITY_R01_OUTER_WALL_GALLERY_ENABLED ? [...EON_CITY_W731_STATIONS.entries()] : [];
  for (const [stationIndex, station] of wallGalleryStations) {
    if (station.id === 'command-console') continue;
    const stationRecord = stationState.get(station.id);
    const monitor = createEonCityW765R7WallDisplay({
      parent: world.root,
      index: stationIndex,
      count: EON_CITY_W731_STATIONS.length,
      scene,
      station,
      stationRecord,
      MeshBuilder,
      TransformNode,
      DynamicTexture,
      StandardMaterial,
      materials: world.materials,
      interactionMetadata: stationMetadata(station, {
        part: 'terminal',
        interactionRole: 'terminal',
        liveMonitor: true,
        wallDisplay: true,
        monitorSchema: EON_CITY_W765R7_WALL_DISPLAY_SCHEMA
      }),
      projectionProvider: () => projectEonCityW765R5StationMonitor({
        station,
        productiveView: productiveStations.getView?.() || {},
        nexusView: livingNexus.getView?.() || {},
        commandSnapshot: commandStatusController.getSnapshot?.() || {},
        theatreSnapshot: agentTheatreController.getSnapshot?.() || {}
      }),
      openSurface: (stationId, trigger) => openSurfaceForStation(stationId, trigger),
      now
    });
    if (!monitor.ok) continue;
    stationMonitors.set(station.id, monitor);
    registerSpatialNode(`procedural:w765r7-wall-display:${station.id}`, monitor.root, {
      groupId: `wall-display:${station.id}`,
      allowHeroZone: station.id === 'eonbot-nexus',
      allowArrivalRay: station.id === 'eonbot-nexus'
    });
  }
  for (const wallId of EON_CITY_W750_WALL_IDS) {
    const wallView = commandCentre.getView?.()?.walls?.find?.((entry) => entry.id === wallId);
    interactionRegistry.register({
      id: `command-wall:${wallId}`,
      objectType: 'command-centre',
      role: 'live-command-wall',
      label: wallView?.label || `${wallId} command wall`,
      oneLinePurpose: wallView?.purpose || 'Inspect bounded Command Centre state.',
      inspectText: wallView?.detail || 'Inspect this truthful bounded wall before opening maintained work.',
      truthBoundary: wallView?.truthBoundary || 'No private content or automatic work is exposed by this wall.',
      stationId: 'command-console',
      position: freeze({ ...getEonCityW731Station('command-console').position }),
      primaryAction: freeze({
        kind: 'open', label: `Inspect ${wallView?.label || wallId}`, surface: 'command-centre', presentationMode: 'dock',
        explicitUserActionRequired: true, automaticNavigation: false, automaticExecution: false
      }),
      secondaryAction: freeze({
        kind: 'inspect', label: 'Read truth boundary', explicitUserActionRequired: true,
        automaticNavigation: false, automaticExecution: false
      }),
      accessibilityLabel: `${wallView?.label || wallId} command wall. Inspect bounded state; no automatic work.`,
      availability: freeze({ state: 'available', truthful: true }),
      explicitUserActionRequired: true,
      autoNavigate: false,
      autoExecute: false
    });
  }
  for (const ringId of EON_CITY_W749_RING_IDS) {
    const ringView = livingNexus.getView?.()?.rings?.find?.((entry) => entry.id === ringId);
    interactionRegistry.register({
      id: `nexus-ring:${ringId}`,
      objectType: 'nexus',
      role: 'living-nexus-ring',
      label: ringView?.label || `${ringId} Nexus ring`,
      oneLinePurpose: ringView?.shortLabel || 'Inspect a bounded privacy-projected Nexus state.',
      inspectText: ringView?.detail || 'Inspect this bounded Nexus projection before opening maintained work.',
      truthBoundary: ringView?.truthBoundary || 'No private content or automatic work is exposed by this City object.',
      stationId: 'eonbot-nexus',
      position: freeze({ ...getEonCityW731Station('eonbot-nexus').position }),
      primaryAction: freeze({
        kind: 'open', label: `Inspect ${ringView?.label || ringId}`, surface: 'nexus', presentationMode: 'dock',
        explicitUserActionRequired: true, automaticNavigation: false, automaticExecution: false
      }),
      secondaryAction: freeze({
        kind: 'inspect', label: 'Read truth boundary', explicitUserActionRequired: true,
        automaticNavigation: false, automaticExecution: false
      }),
      accessibilityLabel: `${ringView?.label || ringId} Nexus ring. Inspect bounded state; no automatic work.`,
      availability: freeze({ state: 'available', truthful: true }),
      explicitUserActionRequired: true,
      autoNavigate: false,
      autoExecute: false
    });
  }
  const interactionCompleteness = auditEonCityW763InteractionCompleteness(interactionRegistry.list({ qualityMode: resolvedQuality, visibleOnly: false }));
  if (!interactionCompleteness.ok) throw new Error(`w763-interaction-completeness-invalid:${[...interactionCompleteness.dead, ...interactionCompleteness.missingCopy, ...interactionCompleteness.missingAccessibility].join(',')}`);
  let workspacePresentationMode = 'world';
  let ui = null;
  let semanticNavigationController = null;
  let nexusReactionController = null;
  let rewardReactionController = null;
  let latestNexusReaction = null;
  let latestRewardReaction = null;
  let onW749ViewChanged = null;

  const openCityReadiness = (source = 'maintenance-relay') => {
    const authority = runtimeReadinessAuthority || globalThis.EON_CITY_RUNTIME_READINESS;
    const view = authority?.show?.(source) || null;
    const snapshot = authority?.getSnapshot?.() || null;
    if (!view || !snapshot) {
      onStatus?.('City Readiness is unavailable. No maintenance task was started.');
      return freeze({ ok: false, reason: 'city-readiness-unavailable', source });
    }
    onStatus?.('City Readiness opened with measured runtime, service-worker and connectivity evidence. No repair task is running automatically.');
    return freeze({ ok: true, source, action: 'open-city-readiness', snapshot, noAutomaticWork: true });
  };

  const inspectInteraction = (interaction = null, target = null) => {
    const entity = target?.entity || null;
    const record = interaction || (target?.kind === 'station'
      ? interactionRegistry.getStation(entity?.id, 'structure')
      : interactionRegistry.get(`discovery:${entity?.id || ''}`));
    if (!record) return freeze({ ok: false, reason: 'interaction-not-found' });
    if (record.discoveryId === 'maintenance-relay' || record.id === 'support:maintenance-worker') return openCityReadiness(record.id);
    if (record.discoveryId === 'expanse-gate') return ui?.openExpanseReview?.(target?.trigger || null) || freeze({ ok: false, reason: 'expanse-review-ui-unavailable' });
    onStatus?.(`${record.label}: ${record.inspectText} ${record.truthBoundary}`);
    return freeze({ ok: true, interactionId: record.id, action: 'inspect', noAutomaticWork: true });
  };

  const workspacePresenter = createEonCityW748WorkspacePresenter({
    environment: globalThis,
    captureWorldState: () => freeze({
      player: freeze({ x: Number(playerAnchor.position.x), y: 0, z: Number(playerAnchor.position.z), heading: Number(playerAnchor.rotation.y) }),
      camera: captureCameraPose(),
      activeStationId,
      activeMissionId,
      nearestStationId: nearestStation?.station?.id || '',
      nearestDiscoveryId: nearestDiscovery?.discovery?.id || '',
      selectedInteractionId: String(productRoot.dataset.eonCitySelectedInteraction || ''),
      worldMode: expanseWorldMode.getState().mode,
      activeWorldRegionId: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' ? String(expanseActiveRegionId || 'signal-frontier') : 'command-hub'
    }),
    focusWorldObject: ({ station, snapshot }) => {
      if (snapshot?.worldMode === 'EXPANSE_ACTIVE') return freeze({ ok: true, reason: 'expanse-workspace-background-preserved', cameraChanged: false });
      activeStationId = station.id;
      return focusCameraOnStation(station);
    },
    restoreWorldState: (snapshot) => {
      if (!snapshot) return freeze({ ok: false, reason: 'workspace-snapshot-missing' });
      activeStationId = String(snapshot.activeStationId || '');
      applyPlayerPose(snapshot.player || EON_CITY_W731_SPAWN, { stationId: activeStationId, save: false, camera: 'none' });
      const cameraReceipt = restoreCameraPose(snapshot.camera);
      if (snapshot.worldMode === 'EXPANSE_ACTIVE' && expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE') {
        const expectedRegionId = String(snapshot.activeWorldRegionId || 'signal-frontier');
        const actualRegionId = String(expanseActiveRegionId || 'signal-frontier');
        if (expectedRegionId !== actualRegionId) {
          onStatus?.(`Workspace return kept safe: expected ${expectedRegionId}, current world is ${actualRegionId}. No automatic world switch was performed.`);
          return freeze({ ok: false, reason: 'expanse-workspace-region-changed', expectedRegionId, actualRegionId, camera: cameraReceipt, player: snapshot.player, worldMode: 'EXPANSE_ACTIVE' });
        }
        syncExpanseUi();
        canvas.focus?.({ preventScroll: true });
        return freeze({ ok: true, reason: 'expanse-workspace-return', camera: cameraReceipt, player: snapshot.player, worldMode: 'EXPANSE_ACTIVE', activeWorldRegionId: actualRegionId, regionPreserved: true });
      }
      nearestStation = resolveEonCityW731NearestStation(playerAnchor.position, 5.2);
      nearestDiscovery = resolveEonCityW737NearestDiscovery(playerAnchor.position, 5.2);
      const stationDistance = Number(nearestStation?.distance ?? Number.POSITIVE_INFINITY);
      const discoveryDistance = Number(nearestDiscovery?.distance ?? Number.POSITIVE_INFINITY);
      const selectedInteractionId = String(snapshot.selectedInteractionId || '');
      const selectedStationId = selectedInteractionId.startsWith('station:') ? selectedInteractionId.slice('station:'.length) : '';
      const selectedDiscoveryId = selectedInteractionId.startsWith('discovery:') ? selectedInteractionId.slice('discovery:'.length) : '';
      const restoredTarget = selectedStationId && getEonCityW731Station(selectedStationId)
        ? freeze({ station: getEonCityW731Station(selectedStationId), distance: Math.hypot(playerAnchor.position.x - getEonCityW731Station(selectedStationId).position.x, playerAnchor.position.z - getEonCityW731Station(selectedStationId).position.z) })
        : selectedDiscoveryId && getEonCityW737Discovery(selectedDiscoveryId)
          ? freeze({ discovery: getEonCityW737Discovery(selectedDiscoveryId), distance: Math.hypot(playerAnchor.position.x - getEonCityW737Discovery(selectedDiscoveryId).position.x, playerAnchor.position.z - getEonCityW737Discovery(selectedDiscoveryId).position.z) })
          : stationDistance <= discoveryDistance ? nearestStation : nearestDiscovery;
      lastNearestId = restoredTarget?.station?.id || restoredTarget?.discovery?.id || '';
      ui?.setPrompt?.(restoredTarget);
      setContextualSelection(restoredTarget);
      writeResume(playerAnchor.position, playerAnchor.rotation.y, activeStationId);
      return freeze({ ok: true, camera: cameraReceipt, player: snapshot.player });
    },
    setMovementPaused: (shouldPause) => {
      if (shouldPause) {
        const acquired = inputLockManager.has('work-surface')
          ? freeze({ ok: true, ownerId: 'work-surface', alreadyActive: true })
          : acquireInputLease('work-surface', { source: 'workspace-presenter', reason: 'work-surface-open' });
        workSurfaceOpen = acquired.ok || inputLockManager.has('work-surface');
        workSurfaceOpenedAt = workSurfaceOpen ? now() : 0;
        if (!workSurfaceOpen) onStatus?.(`Work surface could not pause City movement safely: ${String(acquired.reason || 'input lock unavailable')}.`);
      } else {
        releaseInputLease('work-surface', 'work-surface-closed');
        workSurfaceOpen = false;
        workSurfaceOpenedAt = 0;
      }
      ui?.setPaused?.(manualPaused || inputLockManager.isMovementBlocked());
    },
    setWorldAudioPaused: (shouldPause) => {
      productRoot.dataset.eonCityAudioPaused = shouldPause ? 'true' : 'false';
    },
    setBackgroundPresentation: (mode) => {
      workspacePresentationMode = String(mode || 'world');
      productRoot.dataset.eonCityWorkspacePresentation = workspacePresentationMode;
      reliabilityController.noteWorkspacePresentation(workspacePresentationMode);
    },
    requestSurfaceOpen: (surfaceId, options = {}) => surfaceManager.requestOpen(surfaceId, options),
    noteSurfaceClosed: (surfaceId, reason = 'closed') => surfaceManager.noteClosed(surfaceId, reason),
    noteSurfaceMinimized: (surfaceId, reason = 'minimized') => surfaceManager.noteMinimized(surfaceId, reason),
    noteSurfaceRestored: (surfaceId, reason = 'restored') => surfaceManager.noteRestored(surfaceId, reason),
    onStatus,
    onReturn: ({ source } = {}) => {
      const openedStationId = String(source?.stationId || activeStationId || '');
      const restoredStationId = String(source?.snapshot?.activeStationId || '');
      productiveStations.markReturned?.(openedStationId, { explicitUserAction: true });
      if (activeMissionId) writeEonCityW737MissionState(activeMissionId, 'returned');
      activeMissionId = String(source?.snapshot?.activeMissionId || '');
      activeStationId = restoredStationId;
      missionsProgression.refresh?.('workspace-return');
      ui?.updateMissions?.();
      livingNexus.refresh?.('workspace-return');
      const activeNpc = stationState.get(openedStationId);
      activeNpc?.loadedNpc?.animations?.playStationary?.('idle');
      if (activeNpc) {
        activeNpc.npcGestureState = 'idle';
        activeNpc.npcGestureUntil = 0;
        activeNpc.nextNpcGestureAt = now() + 4_500 + activeNpc.station.priority * 530;
        if (activeNpc.npcRoute) {
          activeNpc.npcRoute.suspendedUntil = now() + 1_200;
          activeNpc.npcRoute.animationState = 'idle';
          activeNpc.npcRoute.moving = false;
        }
      }
      if (source?.snapshot?.worldMode === 'EXPANSE_ACTIVE') {
        const regionId = String(source.snapshot.activeWorldRegionId || 'signal-frontier');
        if (regionId === 'my-frontier') {
          const readiness = deriveCurrentMyFrontierReadiness();
          const construction = deriveCurrentMyFrontierConstructionAction();
          const upgrade = deriveCurrentMyFrontierUpgradeBoard();
          const nextAction = readiness?.action?.label || construction?.action?.label || upgrade?.action?.label || 'walk to a plot → E / tap Use → choose a building → Plan';
          onStatus?.(`Back in My Frontier. Next: ${nextAction}.`);
        } else if (regionId === 'storm-sector') {
          const nextObjective = expanseStormSectorMissions.getView()?.nextObjective;
          onStatus?.(nextObjective?.label ? `Back in Storm Sector. Next: ${nextObjective.label} · follow the marker → E / tap Use.` : 'Back in Storm Sector. Next: explore, talk to a patrol, or open Worlds.');
        } else {
          const authority = deriveEonExpanseW772CCurrentObjectiveAuthority(buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState()));
          onStatus?.(authority.active ? `Back in Signal Frontier. Next: ${authority.guidance || authority.interactionLabel} · ${authority.physical ? 'E / tap Use.' : 'use the mission board.'}` : 'Back in Signal Frontier. Open EONBOT or Worlds whenever you are ready.');
        }
      }
      canvas.focus?.({ preventScroll: true });
    }
  });

  const openSurfaceForStation = (stationId, trigger = null, overrideSurface = '', extraContext = {}) => {
    if (workspacePresenter.getState().active || workspacePresenter.getState().pending || workSurfaceOpen) return freeze({ ok: false, reason: 'work-surface-already-opening' });
    const station = getEonCityW731Station(stationId);
    if (!station) return freeze({ ok: false, reason: 'station-not-found' });
    const surface = overrideSurface || (station.id === 'eonbot-nexus' ? 'nexus' : station.id === 'command-console' ? 'command-centre' : station.id === 'automation-theatre' ? 'agent-theatre' : station.surface);
    const rawPart = String(trigger?.interactionPart || trigger?.dataset?.eonCityInteractionPart || (trigger?.nodeType ? 'ui' : 'structure')).slice(0, 80);
    const nexusRingId = String(trigger?.nexusRingId || (rawPart.startsWith('nexus-ring:') ? rawPart.slice('nexus-ring:'.length) : '')).slice(0, 40);
    const commandWallId = String(trigger?.commandWallId || (rawPart.startsWith('command-wall:') ? rawPart.slice('command-wall:'.length) : (station.id === 'automation-theatre' ? 'agent-theatre' : ''))).slice(0, 40);
    const interactionPart = rawPart === 'terminal' ? 'terminal' : rawPart === 'npc' ? 'npc' : nexusRingId ? 'nexus-ring' : commandWallId ? 'command-wall' : 'structure';
    const interactionSource = String(trigger?.interactionSource || (trigger?.nodeType ? 'city-ui' : 'city-3d')).slice(0, 40);
    const creatorMode = station.id === 'create-forge' && ['image', 'video', 'music'].includes(String(extraContext?.creatorMode || '').toLowerCase()) ? String(extraContext.creatorMode).toLowerCase() : '';
    if (nexusRingId) livingNexus.inspectRing?.(nexusRingId);
    if (commandWallId) commandCentre.inspectWall?.(commandWallId);
    const interaction = (nexusRingId ? interactionRegistry.get(`nexus-ring:${nexusRingId}`) : null)
      || (commandWallId ? interactionRegistry.get(`command-wall:${commandWallId}`) : null)
      || interactionRegistry.getStation(station.id, interactionPart)
      || interactionRegistry.getStation(station.id, 'structure');
    productiveStations.reviewStation?.(station.id, { explicitUserAction: true });
    const stationWorkLoop = productiveStations.getStation?.(station.id) || null;
    const fromExpanseWorkspace = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' && String(trigger?.interactionSource || '').startsWith('expanse-');
    const fromExpanseCapture = fromExpanseWorkspace && trigger?.interactionSource === 'expanse-capture-moment';
    const result = workspacePresenter.begin({
      station,
      interaction,
      surface,
      trigger,
      context: freeze({
        type: fromExpanseWorkspace ? 'expanse' : 'city',
        citySource: fromExpanseWorkspace ? 'eon-expanse-signal-frontier' : 'eon-city-command-hub',
        expanseCaptureMoment: fromExpanseCapture ? trigger?.expanseContext || null : null,
        expanseWorkspaceContext: fromExpanseWorkspace ? trigger?.expanseContext || null : null,
        stationId: station.id,
        creatorMode,
        eonbotWorldContext: extraContext?.eonbotWorldContext || trigger?.expanseContext?.worldContext || null,
        stationWorkLoop,
        missionsProgression: missionsProgression.getView?.() || null,
        npcName: station.npc.name,
        npcRole: station.npc.role,
        interactionPart,
        interactionSource,
        nexusRingId,
        commandWallId,
        nexusView: station.id === 'eonbot-nexus' ? livingNexus.getView?.() : null,
        commandCentreView: ['command-console', 'automation-theatre'].includes(station.id) ? commandCentre.getView?.() : null
      })
    });
    if (!result.ok) return result;
    productiveStations.markOpened?.(station.id, { explicitUserAction: true });
    activeStationId = station.id;
    const mission = getEonCityW737MissionForStation(station.id);
    activeMissionId = mission?.id || '';
    if (mission) writeEonCityW737MissionState(mission.id, 'opened');
    missionsProgression.refresh?.('mission-opened');
    ui?.updateMissions?.();
    livingNexus.refresh?.('mission-opened');
    activationPulse = { stationId: station.id, until: now() + (reducedMotion ? 0 : 180) };
    const stationRecord = stationState.get(station.id);
    const interactionAnimation = interactionPart === 'terminal' ? 'interact' : 'talk';
    stationRecord?.loadedNpc?.animations?.playStationary?.(interactionAnimation, { restart: true });
    if (stationRecord) {
      stationRecord.npcGestureState = interactionAnimation;
      stationRecord.npcGestureUntil = now() + 2_400;
      stationRecord.nextNpcGestureAt = stationRecord.npcGestureUntil + 5_500 + stationRecord.station.priority * 420;
      if (stationRecord.npcRoute) {
        stationRecord.npcRoute.moving = false;
        stationRecord.npcRoute.suspendedUntil = stationRecord.npcGestureUntil;
        stationRecord.npcRoute.animationState = stationRecord.npcGestureState;
      }
    }
    writeResume(playerAnchor.position, playerAnchor.rotation.y, station.id);
    return freeze({
      ...result,
      stationId: station.id,
      surface,
      trigger: Boolean(trigger),
      interactionId: interaction?.id || '',
      interactionPart,
      interactionSource,
      nexusRingId,
      commandWallId,
      explicitUserAction: true
    });
  };

  const guideToStation = (stationId) => {
    const station = getEonCityW731Station(stationId);
    if (!station) return freeze({ ok: false, reason: 'station-not-found' });
    clearInput();
    applyPlayerPose({ x: station.focus.x, y: 0, z: station.focus.z, heading: Math.atan2(station.position.x - station.focus.x, station.position.z - station.focus.z) }, { stationId: station.id, camera: 'none' });
    focusCameraOnStation(station);
    nearestStation = resolveEonCityW731NearestStation(playerAnchor.position, 6);
    ui?.setPrompt?.(nearestStation);
    setContextualSelection(nearestStation);
    onStatus?.(`Arrived at ${station.label}. Press E or choose ${station.npc.action}.`);
    onLandmarkChange?.(freeze({ id: station.id, label: station.label, districtId: 'command-hub' }));
    return freeze({ ok: true, stationId: station.id, explicitUserAction: true, teleportedWithinClosedHub: true });
  };


  const reviewExpanseGate = (trigger = null) => {
    const discovery = getEonCityW737Discovery('expanse-gate');
    if (!discovery) return freeze({ ok: false, reason: 'expanse-gate-not-found' });
    const review = expanseWorldMode.review({ explicitUserAction: true });
    if (!review.ok) return review;
    const mission = getEonCityW737MissionForDiscovery(discovery.id);
    if (mission) {
      activeMissionId = mission.id;
      writeEonCityW737MissionState(mission.id, 'reviewed');
      ui?.updateMissions?.();
      livingNexus.refresh?.('mission-reviewed');
    }
    expanseMissionRuntime.recordSignal('expanse-reviewed', { receiptId: 'expanse:reviewed' });
    onStatus?.('Signal Frontier entry review opened. Choose Enter Signal Frontier or Cancel. No travel starts automatically.');
    onLandmarkChange?.(freeze({ id: discovery.id, label: discovery.label, districtId: 'command-horizon', discovery: true, entryReview: true }));
    return freeze({ ...review, discoveryId: discovery.id, missionId: mission?.id || null, trigger: Boolean(trigger), explicitUserAction: true, noAutomaticWork: true, nextAction: 'enter-or-cancel' });
  };

  const inspectDiscovery = (discoveryId, trigger = null) => {
    const discovery = getEonCityW737Discovery(discoveryId);
    if (!discovery) return freeze({ ok: false, reason: 'discovery-not-found' });
    if (discovery.id === 'expanse-gate') return ui?.openExpanseReview?.(trigger) || freeze({ ok: false, reason: 'expanse-review-ui-unavailable' });
    if (discovery.id === 'maintenance-relay') return openCityReadiness('maintenance-relay');
    if (discovery.id === 'transit-overlook') return ui?.openTransitReview?.(trigger) || freeze({ ok: false, reason: 'transit-review-ui-unavailable' });
    const mission = getEonCityW737MissionForDiscovery(discovery.id);
    if (mission) {
      activeMissionId = mission.id;
      writeEonCityW737MissionState(mission.id, 'reviewed');
      ui?.updateMissions?.();
      livingNexus.refresh?.('mission-reviewed');
    }
    onStatus?.(`${discovery.label} reviewed. ${discovery.npc.greeting}`);
    onLandmarkChange?.(freeze({ id: discovery.id, label: discovery.label, districtId: 'command-horizon', discovery: true }));
    return freeze({ ok: true, discoveryId: discovery.id, missionId: mission?.id || null, trigger: Boolean(trigger), explicitUserAction: true, noAutomaticWork: true });
  };

  const guideToDiscovery = (discoveryId) => {
    const discovery = getEonCityW737Discovery(discoveryId);
    if (!discovery) return freeze({ ok: false, reason: 'discovery-not-found' });
    clearInput();
    applyPlayerPose({ x: discovery.focus.x, y: 0, z: discovery.focus.z, heading: Math.atan2(discovery.position.x - discovery.focus.x, discovery.position.z - discovery.focus.z) }, { stationId: '', save: true, camera: 'follow' });
    nearestDiscovery = resolveEonCityW737NearestDiscovery(playerAnchor.position, 6);
    ui?.setPrompt?.(nearestDiscovery);
    setContextualSelection(nearestDiscovery);
    onStatus?.(`Arrived at ${discovery.label}. Press E or choose ${discovery.npc.action}.`);
    onLandmarkChange?.(freeze({ id: discovery.id, label: discovery.label, districtId: 'command-horizon', discovery: true }));
    return freeze({ ok: true, discoveryId: discovery.id, explicitUserAction: true, teleportedWithinBoundedMap: true });
  };

  const focusCommandWall = (trigger = null) => {
    clearInput('command-wall-focus');
    applyCameraPose(EON_CITY_W760_CAMERA_POSES.commandWall, 'command-wall-focus');
    commandCentre.refresh?.('explicit-command-wall-focus');
    commandCentre.inspectWall?.('work');
    onStatus?.('Five live Command Centre monitors focused. Select a screen to inspect its verified information.');
    return freeze({ ok: true, trigger: Boolean(trigger), explicitUserAction: true, cameraMode: 'command-wall-focus', monitorCount: 5 });
  };

  const resumeLocation = () => {
    const resume = readResume();
    if (!resume) { onStatus?.('No saved City location is available yet.'); return freeze({ ok: false, reason: 'resume-unavailable' }); }
    applyPlayerPose({ ...resume.player, heading: resume.heading }, { stationId: resume.stationId, save: false, camera: 'follow' });
    onStatus?.('Your last Command Hub location is restored on this device.');
    return freeze({ ok: true, resume });
  };

  const resetView = () => {
    clearInput();
    activeStationId = '';
    applyPlayerPose(EON_CITY_W731_SPAWN, { stationId: '', save: true, camera: 'arrival' });
    onStatus?.('Returned to the Living Command Centre arrival point.');
    return freeze({ ok: true });
  };

  const showVerifiedReaction = (reaction = null) => {
    if (!reaction) return false;
    ui?.showReaction?.(reaction);
    onStatus?.(reaction.label || 'Command Core updated.');
    if (['mission-complete', 'vault-reveal'].includes(reaction.kind)) environmentController.cue?.('confirm');
    return true;
  };
  const claimMissionWithReaction = (stationId, { explicitUserAction = true } = {}) => {
    const result = missionsProgression.claimMission?.(stationId, { explicitUserAction }) || freeze({ ok: false, reason: 'missions-progression-unavailable' });
    const receipt = rewardReactionController?.noteMissionClaim?.(result);
    if (receipt?.ok) showVerifiedReaction(receipt.reaction);
    ui?.updateMissions?.();
    livingNexus.refresh?.('mission-claimed');
    return result;
  };
  const openRevealWithReaction = ({ explicitUserAction = true } = {}) => {
    const result = missionsProgression.openVaultReveal?.({ explicitUserAction }) || freeze({ ok: false, reason: 'missions-progression-unavailable' });
    const receipt = rewardReactionController?.noteVaultReveal?.(result);
    if (receipt?.ok) showVerifiedReaction(receipt.reaction);
    ui?.updateMissions?.();
    livingNexus.refresh?.('vault-reveal-opened');
    return result;
  };

  ui = createCommandHubUi(productRoot, stationState, discoveryState, {
    onOpenStation: openSurfaceForStation,
    onGuideStation: guideToStation,
    onFocusMonitors: focusCommandWall,
    onInspectDiscovery: inspectDiscovery,
    onGuideDiscovery: guideToDiscovery,
    onResume: resumeLocation,
    onReset: resetView,
    onRestart: () => productRoot.querySelector?.('[data-eon-city-retry-3d]')?.click?.(),
    onOpenCapture: (trigger) => openSurfaceForStation('share-capture', trigger, 'creator-capture'),
    onOpenShare: (trigger) => openSurfaceForStation('share-capture', trigger, 'share'),
    onOpenNexus: (trigger) => openSurfaceForStation('eonbot-nexus', trigger, 'nexus'),
    onOpenExpanseMissionBoard: () => { syncExpanseUi(); return expanseUiOverlay.openBoard(); },
    getEonbotWorldContext: () => {
      const worldRegionId = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' ? String(expanseActiveRegionId || 'signal-frontier') : 'command-hub';
      const rt91Context = rt91Integration.getEonbotContext(worldRegionId);
      if (rt91Context?.objectiveId) return rt91Context;
      if (worldRegionId === 'signal-frontier') {
        const authority = deriveEonExpanseW772CCurrentObjectiveAuthority(buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState()));
        return freeze({ worldRegionId, worldLabel: 'Signal Frontier', objectiveId: authority.objectiveId || '', nextAction: authority.guidance || 'Follow the active Signal marker and press E / tap Use.', includesPrivateContent: false });
      }
      if (worldRegionId === 'my-frontier') {
        const readiness = deriveCurrentMyFrontierReadiness();
        const construction = deriveCurrentMyFrontierConstructionAction();
        const upgrade = deriveCurrentMyFrontierUpgradeBoard();
        const nextAction = readiness?.action?.label || construction?.action?.label || upgrade?.action?.label || 'Walk to a plot → E / tap Use → choose a building → Plan.';
        return freeze({ worldRegionId, worldLabel: 'My Frontier', plotId: readiness?.action?.plotId || construction?.action?.plotId || upgrade?.action?.plotId || '', buildingId: readiness?.action?.buildingId || construction?.action?.buildingId || upgrade?.action?.buildingId || '', nextAction, includesPrivateContent: false });
      }
      if (worldRegionId === 'storm-sector') {
        const view = expanseStormSectorMissions.getView();
        return freeze({ worldRegionId, worldLabel: 'Storm Sector', objectiveId: view.nextObjective?.id || '', nextAction: view.nextObjective?.label || 'Explore, talk to a patrol, or open Worlds to switch regions.', includesPrivateContent: false });
      }
      return freeze({ worldRegionId: 'command-hub', worldLabel: 'Command Hub', nextAction: 'Use a nearby station or ask EONBOT what to work on next.', includesPrivateContent: false });
    },
    onOpenAccessibleMap: (trigger) => freeze({ ok: semanticNavigationController?.show?.(trigger) === true, reason: semanticNavigationController ? '' : 'accessible-map-unavailable' }),
    onAcquireInputLease: acquireInputLease,
    onReleaseInputLease: releaseInputLease,
    surfaceManager,
    getMissionView: () => rt91Integration.getLegacyCompatibleMissionView(missionsProgression.getView?.() || {}),
    onGuideFlagshipMission: (record) => {
      const worldId = String(record?.rt91WorldId || '');
      const route = worldId === 'signal-frontier' ? runtime?.enterSignalFrontier?.({ explicitUserAction: true })
        : worldId === 'storm-sector' ? runtime?.enterStormSector?.({ explicitUserAction: true })
          : worldId === 'my-frontier' ? runtime?.enterMyFrontier?.({ explicitUserAction: true })
            : freeze({ ok: false, reason: 'rt91-world-route-unavailable' });
      if (!route?.ok) { onStatus?.(`Flagship mission travel unavailable: ${String(route?.reason || 'world-route-unavailable').replaceAll('-', ' ')}.`); return route; }
      const started = record?.rt91Status === 'available' ? rt91Integration.startMission(record.id, { explicitUserAction: true }) : freeze({ ok: true, reason: 'mission-already-active' });
      if (!started.ok) onStatus?.(`Flagship mission unavailable: ${String(started.reason || 'mission-start-failed').replaceAll('-', ' ')}.`);
      expanseGuidance = buildCurrentExpanseGuidance();
      syncExpanseUi();
      return freeze({ ok: started.ok === true, route, mission: started, worldId });
    },
    onClaimMission: (stationId) => claimMissionWithReaction(stationId, { explicitUserAction: true }),
    onOpenReveal: () => openRevealWithReaction({ explicitUserAction: true }),
    onStatus,
    onInspectInteraction: inspectInteraction,
    getInteraction: (target = null) => target?.kind === 'station'
      ? interactionRegistry.getStation(target?.entity?.id, 'structure')
      : interactionRegistry.get(`discovery:${target?.entity?.id || ''}`),
    getTransitDestinations: () => w754TransitController.listDestinations(),
    onRequestTransit: (destinationId, options) => w754TransitController.request(destinationId, options),
    onConfirmTransit: (reviewToken, options) => w754TransitController.confirm(reviewToken, options),
    onCancelTransit: (options) => w754TransitController.cancel(options),
    onReviewExpanseGate: (options = {}) => reviewExpanseGate(options?.trigger || null),
    onEnterExpanse: (options = {}) => runtime?.enterExpanse?.(options) || freeze({ ok: false, reason: 'runtime-entry-unavailable' }),
    onCancelExpanse: (options = {}) => runtime?.cancelExpanseEntry?.(options) || freeze({ ok: false, reason: 'runtime-cancel-unavailable' }),
    getExpanseGateReview: () => freeze({
      mode: expanseWorldMode.getState().mode,
      online: globalThis.navigator?.onLine !== false,
      gateway: expanseGateway?.getSummary?.() || null,
      offlinePackState: 'full-expanse-offline-pack-not-yet-certified',
      runtimeIdentity: getRuntimeIdentitySnapshot?.() || null
    }),
    getOpenWorldAvailability,
    getActiveWorldRegion: () => expanseActiveRegionId,
    onEnterSignal: (options = {}) => runtime?.enterSignalFrontier?.(options) || freeze({ ok: false, reason: 'runtime-signal-entry-unavailable' }),
    onEnterStorm: (options = {}) => runtime?.enterStormSector?.(options) || freeze({ ok: false, reason: 'runtime-storm-entry-unavailable' }),
    onEnterMyFrontier: (options = {}) => runtime?.enterMyFrontier?.(options) || freeze({ ok: false, reason: 'runtime-my-frontier-entry-unavailable' })
  });
  ui?.setWorldMode?.(expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' ? 'EXPANSE_ACTIVE' : 'COMMAND_HUB');
  nexusReactionController = createEonCityW762NexusReactionController({
    environment: globalThis,
    now: Date.now,
    onReaction: (reaction) => {
      latestNexusReaction = reaction;
      showVerifiedReaction(reaction);
    }
  });
  rewardReactionController = createEonCityW764RewardReactionController({
    environment: globalThis,
    now: Date.now,
    onReaction: (reaction) => { latestRewardReaction = reaction; }
  });
  nexusReactionController.observe(livingNexus.getView?.() || {}, 'initial');
  onW749ViewChanged = (event) => nexusReactionController?.observe?.(event?.detail?.view || {}, event?.detail?.reason || 'source-state');
  globalThis.addEventListener?.(EON_CITY_W749_VIEW_EVENT, onW749ViewChanged);

  semanticNavigationController = createEonCityW756SemanticNavigationController({
    root: productRoot,
    environment: globalThis,
    showLauncher: false,
    onOpen: ({ trigger } = {}) => {
      const surfaceLease = surfaceManager.requestOpen('accessible-map', { reason: 'accessible-map-open' });
      if (!surfaceLease.ok) return surfaceLease;
      const inputLease = acquireInputLease('accessible-map', { source: 'accessible-map', reason: 'explicit-open', trigger: Boolean(trigger) });
      if (!inputLease.ok) surfaceManager.noteClosed('accessible-map', 'input-lock-failed');
      return inputLease;
    },
    onClose: ({ reason } = {}) => {
      const release = releaseInputLease('accessible-map', reason || 'explicit-close');
      if (release.ok) surfaceManager.noteClosed('accessible-map', reason || 'explicit-close');
      return release;
    },
    onMinimize: ({ reason } = {}) => releaseInputLease('accessible-map', reason || 'surface-minimized'),
    onRestore: () => acquireInputLease('accessible-map', { source: 'accessible-map', reason: 'surface-restored' }),
    onRequestMinimize: () => surfaceManager.minimize('accessible-map', { reason: 'minimize-button' }),
    onGuideStation: guideToStation,
    onOpenStation: (stationId, trigger) => openSurfaceForStation(stationId, trigger, 'semantic-map'),
    onInspectStation: (stationId) => {
      const station = getEonCityW731Station(stationId);
      const interaction = interactionRegistry.getStation(stationId, 'structure');
      onStatus?.(interaction?.inspectText || station?.description || `${station?.label || 'Station'} is available through the maintained City Dock.`);
      return freeze({ ok: Boolean(station), stationId, automaticWork: false, privateDataRead: false });
    },
    onSetEnvironment: (next, options) => {
      const result = environmentController.setProfile(next, options);
      if (result.ok) applyW755EnvironmentPlan({ scene, hemisphere, direction, world, plan: environmentController.getPlan() });
      return result;
    },
    onActivateAudio: (options) => {
      environmentController.setAudioPreferences({ ambience: true, ui: true, voice: false, music: false, reducedSensory: Boolean(reducedMotion) }, options);
      return environmentController.activateAudio(options);
    },
    onOpenNexus: (trigger) => openSurfaceForStation('eonbot-nexus', trigger, 'w756-onboarding'),
    onOpenWorlds: (trigger) => ui?.openWorlds?.(trigger || canvas),
    onOpenMenu: (trigger) => ui?.openMenu?.(trigger || canvas),
    onGuideDiscovery: guideToDiscovery,
    onInspectDiscovery: inspectDiscovery,
    onReviewTransit: (trigger) => ui?.openTransitReview?.(trigger || canvas) || freeze({ ok: false, reason: 'transit-review-ui-unavailable' }),
    onOpenReadiness: () => openCityReadiness('accessible-map'),
    onReviewExpanse: (trigger) => ui?.openExpanseReview?.(trigger || canvas) || freeze({ ok: false, reason: 'expanse-review-ui-unavailable' }),
    onStatus: (message) => onStatus?.(message)
  });

  const accessibleMapSurfaceRegistration = surfaceManager.register('accessible-map', {
    close: ({ reason = 'surface-handoff' } = {}) => freeze({ ok: semanticNavigationController?.hide?.({ reason, restoreFocus: false }) !== false }),
    minimize: () => semanticNavigationController?.minimize?.() || freeze({ ok: false, reason: 'accessible-map-unavailable' }),
    restore: () => semanticNavigationController?.restore?.() || freeze({ ok: false, reason: 'accessible-map-unavailable' })
  });

  const setContextualSelection = (target = null) => {
    const stationId = String(target?.station?.id || '');
    const discoveryId = String(target?.discovery?.id || '');
    for (const record of stationState.values()) record.selectionRing?.setEnabled?.(record.station.id === stationId);
    for (const record of discoveryState.values()) record.selectionRing?.setEnabled?.(record.discovery.id === discoveryId);
    productRoot.dataset.eonCitySelectedInteraction = stationId
      ? `station:${stationId}`
      : discoveryId ? `discovery:${discoveryId}` : '';
    return productRoot.dataset.eonCitySelectedInteraction;
  };

  const isEditableTarget = (node) => {
    if (!node) return false;
    const tag = String(node.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag) || node.isContentEditable) return true;
    try { return Boolean(node.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')); } catch { return false; }
  };
  const isTyping = (event = null) => isEditableTarget(event?.target) || isEditableTarget(globalThis.document?.activeElement);
  const workSurfaceHostVisible = () => {
    const host = globalThis.document?.querySelector?.('[data-eon-work-surface-host]');
    if (!host?.isConnected || host.hidden === true || host.getAttribute?.('aria-hidden') === 'true') return false;
    try {
      const style = globalThis.getComputedStyle?.(host);
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) <= 0.01)) return false;
      const rect = host.getBoundingClientRect?.();
      if (rect && Number.isFinite(rect.width) && Number.isFinite(rect.height) && (rect.width <= 1 || rect.height <= 1)) return false;
    } catch {}
    return true;
  };
  const reconcileWorkspacePause = () => {
    const state = workspacePresenter.getState();
    if (!workSurfaceOpen || now() - workSurfaceOpenedAt < 750 || workSurfaceHostVisible() || state.active || state.pending) return false;
    if (workSurfaceOpen) {
      releaseInputLease('work-surface', 'hidden-work-surface-reconcile');
      workSurfaceOpen = false;
      workSurfaceOpenedAt = 0;
      ui?.setPaused?.(manualPaused || inputLockManager.isMovementBlocked());
    }
    return true;
  };
  reconcileOrphanedInputLocks = () => {
    const workspaceState = workspacePresenter.getState();
    const workSurfaceHost = globalThis.document?.querySelector?.('[data-eon-work-surface-host]');
    const readinessView = globalThis.document?.querySelector?.('[data-eon-city-runtime-readiness]');
    const readinessAuthority = runtimeReadinessAuthority || globalThis.EON_CITY_RUNTIME_READINESS;
    const uiState = ui?.getBlockingSurfaceState?.() || {};
    const semanticSurfaceState = semanticNavigationController?.getSurfaceLifecycle?.() || freeze({
      logicalOpen: semanticNavigationController?.isOpen?.() === true,
      transitionActive: false,
      successorOwnerId: '',
      connected: semanticNavigationController?.isOpen?.() === true,
      accessibilityHidden: semanticNavigationController?.isOpen?.() !== true,
      intentionallyHidden: semanticNavigationController?.isOpen?.() !== true,
      geometryVisible: semanticNavigationController?.isVisible?.() === true
    });
    const readinessSurfaceState = readinessAuthority?.getSurfaceLifecycle?.() || freeze({
      logicalOpen: Boolean(readinessView?.isConnected && readinessView.hidden !== true),
      transitionActive: false,
      successorOwnerId: '',
      connected: Boolean(readinessView?.isConnected),
      accessibilityHidden: readinessView?.getAttribute?.('aria-hidden') === 'true',
      intentionallyHidden: readinessView?.hidden === true,
      geometryVisible: readinessView?.isConnected ? true : false
    });
    const surfaceState = freeze({
      cityMenu: uiState.cityMenu || false,
      transitReview: uiState.transitReview || false,
      expanseReview: uiState.expanseReview || false,
      accessibleMap: semanticSurfaceState,
      workSurface: freeze({
        logicalOpen: workspaceState.active === true || workspaceState.pending === true,
        transitionActive: false,
        successorOwnerId: '',
        connected: workSurfaceHost?.isConnected === true,
        accessibilityHidden: workSurfaceHost?.getAttribute?.('aria-hidden') === 'true',
        intentionallyHidden: workSurfaceHost?.hidden === true,
        geometryVisible: workSurfaceHostVisible()
      }),
      cityReadiness: readinessSurfaceState
    });
    const snapshot = inputLockManager.getSnapshot();
    const orphaned = getEonCityW766IR2OrphanedInputLockOwners({
      snapshot,
      surfaceState,
      at: Date.now(),
      graceMs: 1200
    });
    if (!orphaned.length) return freeze({ ok: true, recoveredOwnerIds: freeze([]), surfaceState });
    const recoveredOwnerIds = [];
    for (const orphan of orphaned) {
      const ownerId = orphan.ownerId;
      try {
        if (ownerId === 'city-menu') ui?.closeMenu?.('orphaned-surface-recovery');
        else if (ownerId === 'transit-review') ui?.closeTransitReview?.({ cancel: true, reason: 'orphaned-surface-recovery', restoreFocus: false });
        else if (ownerId === 'expanse-entry-review') {
          expanseWorldMode.cancelReview?.({ safeNavigationAway: false, orphanedSurfaceRecovery: true });
          ui?.closeExpanseReview?.({ cancel: false, reason: 'orphaned-surface-recovery', restoreFocus: false });
        } else if (ownerId === 'accessible-map') {
          if (semanticNavigationController?.isOpen?.()) semanticNavigationController.hide?.({ reason: 'orphaned-surface-recovery', restoreFocus: false });
        } else if (ownerId === 'work-surface') {
          const state = workspacePresenter.getState();
          if (state.active || state.pending) workspacePresenter.cancelPending('orphaned-surface-recovery');
          workSurfaceOpen = false;
          workSurfaceOpenedAt = 0;
        } else if (ownerId === 'city-readiness') {
          (runtimeReadinessAuthority || globalThis.EON_CITY_RUNTIME_READINESS)?.hide?.('orphaned-surface-recovery');
        }
      } catch {}
      const released = releaseInputLease(ownerId, 'orphaned-surface-recovery');
      if (released.ok) recoveredOwnerIds.push(ownerId);
    }
    if (recoveredOwnerIds.length) {
      clearInput('orphaned-input-lock-recovered');
      try {
        productRoot.dataset.eonCityLastInputLockRecovery = recoveredOwnerIds.join('|');
        productRoot.dataset.eonCityLastInputLockRecoveryAt = new Date().toISOString();
      } catch {}
      onStatus?.(`Recovered City movement after a hidden surface failed to complete: ${recoveredOwnerIds.join(', ')}.`);
    }
    return freeze({ ok: true, recoveredOwnerIds: freeze(recoveredOwnerIds), surfaceState });
  };
  const activateResolvedHubInteraction = (resolved = {}, { source = 'unknown', trigger = canvas } = {}) => {
    const stationId = String(resolved.stationId || '');
    const discoveryId = String(resolved.discoveryId || '');
    const commandWallId = String(resolved.commandWallId || '');
    const nexusRingId = String(resolved.nexusRingId || '');
    productRoot.dataset.eonCityLastResolvedInteraction = String(resolved.interactionId || stationId || discoveryId || commandWallId || nexusRingId || (resolved.transitCapsule ? 'support:transit-capsule' : ''));
    if (resolved.transitCapsule) {
      const interaction = interactionRegistry.get('support:transit-capsule');
      clearInput('transit-review');
      const result = ui?.openTransitReview?.(trigger) || freeze({ ok: false, reason: 'transit-review-ui-unavailable' });
      onStatus?.(`${interaction?.label || 'EON Transit Capsule'}: ${interaction?.inspectText || 'Review a destination, then choose Board or Skip.'} Transit review is open; no travel starts automatically.`);
      return result && typeof result === 'object' ? result : freeze({ ok: result !== false });
    }
    if (commandWallId) return openSurfaceForStation('command-console', { interactionPart: `command-wall:${commandWallId}`, interactionSource: source, commandWallId }, 'command-centre');
    if (nexusRingId) return openSurfaceForStation('eonbot-nexus', { interactionPart: `nexus-ring:${nexusRingId}`, interactionSource: source, nexusRingId }, 'nexus');
    if (stationId) return openSurfaceForStation(stationId, { interactionPart: resolved.interactionPart || 'structure', interactionSource: source });
    if (discoveryId) return inspectDiscovery(discoveryId, trigger);
    return freeze({ ok: false, reason: 'semantic-interaction-unresolved' });
  };

  const onKeyDown = (event) => {
    if (destroyed) return;
    keydownEvents += 1;
    reconcileWorkspacePause();
    const keyboardCode = resolveEonCityW719KeyboardCode(event);
    const directionName = KEY_TO_DIRECTION[keyboardCode];
    const rawEvent = () => freeze({ type: 'keydown', key: String(event?.key || ''), code: String(event?.code || ''), resolvedCode: keyboardCode, targetTag: String(event?.target?.tagName || '').toLowerCase(), targetEditable: isEditableTarget(event?.target), activeElementTag: String(globalThis.document?.activeElement?.tagName || '').toLowerCase(), accepted: false, reason: 'unresolved', at: Date.now() });
    if (isEonCityR08SprintKeyboardCode(keyboardCode)) {
      const blockedReason = isTyping(event) ? 'editable-target' : getMovementBlockReason();
      if (blockedReason) {
        lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: false, reason: blockedReason });
        return;
      }
      event.preventDefault();
      sprintSources.add(keyboardCode);
      lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: true, reason: 'sprint-intent-updated' });
      onInputModeChange?.({ mode: 'keyboard', source: keyboardCode });
      return;
    }
    if (directionName) {
      const blockedReason = isTyping(event) ? 'editable-target' : getMovementBlockReason();
      if (blockedReason) {
        lastInputEvent = freeze({ source: keyboardCode, direction: directionName, active: true, accepted: false, reason: blockedReason, at: Date.now() });
        lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: false, reason: blockedReason });
        return;
      }
      event.preventDefault();
      heldKeys.set(keyboardCode, directionName);
      setDirection(directionName, true, keyboardCode);
      lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: true, reason: 'direction-updated' });
      onInputModeChange?.({ mode: 'keyboard', source: keyboardCode });
      return;
    }
    lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: false, reason: 'unmapped-key' });
    reconcileOrphanedInputLocks();
    if (inputLockManager.isMovementBlocked() || isTyping(event)) return;
    if ((event.key === 'm' || event.key === 'M') && !event.ctrlKey && !event.metaKey && !event.altKey && expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE') {
      event.preventDefault();
      const closing = expanseUiOverlay.isBoardOpen?.() === true;
      const result = closing ? expanseUiOverlay.closeBoard() : openExpanseMissionMapAction({ explicitUserAction: true });
      lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: result.ok === true, reason: result.ok ? (closing ? 'expanse-map-closed' : 'expanse-map-opened') : String(result.reason || 'expanse-map-unavailable') });
      return;
    }
    if (expanseUiOverlay.isBoardOpen?.() === true) {
      lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: false, reason: 'expanse-board-open' });
      return;
    }
    if (keyboardCode === 'KeyE' && event.repeat !== true) {
      if (expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE') {
        const interacted = interactNearestExpanseAction({ explicitUserAction: true, source: 'keyboard-e' });
        lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: interacted.ok === true, reason: interacted.ok ? 'expanse-interaction-accepted' : String(interacted.reason || 'expanse-interaction-rejected') });
        if (interacted.ok) event.preventDefault();
        return;
      }
      const nearest = nearestStation?.station
        ? freeze({ stationId: nearestStation.station.id, interactionPart: 'proximity' })
        : nearestDiscovery?.discovery
          ? freeze({ discoveryId: nearestDiscovery.discovery.id, interactionPart: 'proximity' })
          : null;
      if (nearest) {
        const interacted = activateResolvedHubInteraction(nearest, { source: 'keyboard-e', trigger: canvas });
        if (interacted?.ok !== false) event.preventDefault();
      }
    }
  };
  const onKeyUp = (event) => {
    keyupEvents += 1;
    const keyboardCode = resolveEonCityW719KeyboardCode(event);
    const directionName = heldKeys.get(keyboardCode) || KEY_TO_DIRECTION[keyboardCode];
    heldKeys.delete(keyboardCode);
    const rawEvent = () => freeze({ type: 'keyup', key: String(event?.key || ''), code: String(event?.code || ''), resolvedCode: keyboardCode, targetTag: String(event?.target?.tagName || '').toLowerCase(), targetEditable: isEditableTarget(event?.target), activeElementTag: String(globalThis.document?.activeElement?.tagName || '').toLowerCase(), accepted: false, reason: 'unmapped-key', at: Date.now() });
    if (isEonCityR08SprintKeyboardCode(keyboardCode)) {
      sprintSources.delete(keyboardCode);
      event.preventDefault();
      lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: true, reason: 'sprint-intent-updated' });
      return;
    }
    if (directionName) setDirection(directionName, false, keyboardCode);
    if (!directionName) { lastRawKeyboardEvent = rawEvent(); return; }
    event.preventDefault();
    lastRawKeyboardEvent = freeze({ ...rawEvent(), accepted: true, reason: 'direction-updated' });
  };
  globalThis.addEventListener?.('keydown', onKeyDown);
  globalThis.addEventListener?.('keyup', onKeyUp);
  const onWindowBlur = () => clearInput('window-blur');
  globalThis.addEventListener?.('blur', onWindowBlur);
  const restoreCanvasFocus = () => {
    reconcileWorkspacePause();
    canvas.focus?.({ preventScroll: true });
    if (cameraMode === 'arrival' || cameraMode === 'return') {
      cameraMode = 'follow';
      camera.setTarget(new Vector3(playerAnchor.position.x, EON_CITY_W747_CAMERA_POSES.follow.targetHeight, playerAnchor.position.z));
    }
  };
  canvas.addEventListener('pointerdown', restoreCanvasFocus);

  let lastHoverPickAt = 0;
  const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
    if (![PointerEventTypes.POINTERMOVE, PointerEventTypes.POINTERPICK].includes(pointerInfo.type)) return;
    reconcileOrphanedInputLocks();
    if (inputLockManager.isMovementBlocked()) { if (pointerInfo.type === PointerEventTypes.POINTERMOVE) canvas.style.cursor = 'default'; return; }
    let pickedMesh = pointerInfo.pickInfo?.pickedMesh || null;
    if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
      if (!performanceBudget.pointerHoverPicking.enabled) {
        canvas.style.cursor = 'default';
        productRoot.dataset.eonCityPointerInteractive = 'false';
        return;
      }
      const hoverAt = now();
      if (hoverAt - lastHoverPickAt < performanceBudget.pointerHoverPicking.intervalMs) return;
      lastHoverPickAt = hoverAt;
      try { pickedMesh = scene.pick?.(scene.pointerX, scene.pointerY, (mesh) => mesh?.isPickable === true)?.pickedMesh || null; }
      catch { pickedMesh = null; }
    }
    productRoot.dataset.eonCityLastPickedMesh = String(pickedMesh?.name || '');
    if (expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE') {
      const expanseResolved = resolveExpansePointerInteraction(pickedMesh);
      productRoot.dataset.eonCityPointerSemanticOwner = String(expanseResolved.ownerMesh?.name || '');
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        canvas.style.cursor = expanseResolved.ok ? 'pointer' : 'default';
        productRoot.dataset.eonCityPointerInteractive = expanseResolved.ok ? 'true' : 'false';
        return;
      }
      if (!expanseResolved.ok) {
        productRoot.dataset.eonCityLastResolvedInteraction = `ignored:${expanseResolved.reason || 'expanse-pointer-unresolved'}`;
        return;
      }
      if (expanseResolved.canonicalCompanionFallback) {
        const interacted = interactNearestExpanseAction({ explicitUserAction: true, expectedTargetId: expanseResolved.targetId, source: 'expanse-3d-pick' });
        productRoot.dataset.eonCityLastResolvedInteraction = interacted.ok ? expanseResolved.targetId : `ignored:${interacted.reason || 'expanse-interaction-rejected'}`;
        return;
      }
      // Authored Expanse presenters own their direct mesh click. This observer
      // only prevents Command Hub semantics from stealing the same pick.
      productRoot.dataset.eonCityLastResolvedInteraction = `expanse-owned:${expanseResolved.targetId}`;
      return;
    }
    const resolved = resolveEonCityR04MeshInteraction(pickedMesh);
    productRoot.dataset.eonCityPointerSemanticOwner = String(resolved.ownerMesh?.name || '');
    if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
      canvas.style.cursor = resolved.ok ? 'pointer' : 'default';
      productRoot.dataset.eonCityPointerInteractive = resolved.ok ? 'true' : 'false';
      return;
    }
    if (!resolved.ok) {
      productRoot.dataset.eonCityLastResolvedInteraction = `ignored:${resolved.reason || 'unresolved'}`;
      return;
    }
    activateResolvedHubInteraction(resolved, { source: 'city-3d-pick', trigger: resolved.ownerMesh || pickedMesh || canvas });
  });

  const viewportDirector = createEonCityR02ViewportDirector({
    host,
    productRoot,
    globalRef: globalThis,
    onResize: () => { try { engine.resize(); } catch {} },
    onCompose: (profile, previousProfile) => {
      applyEonCityL95HudSafeZone({ productRoot, documentRef: document, profile });
      const expanseActive = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
      const previousScale = previousProfile?.camera?.radiusScale || 1;
      const minimumRadius = expanseActive ? 10 : EON_CITY_W747_CAMERA_POSES.follow.lowerRadiusLimit;
      const maximumRadius = expanseActive ? 26 : EON_CITY_W747_CAMERA_POSES.follow.upperRadiusLimit;
      camera.lowerRadiusLimit = minimumRadius;
      camera.upperRadiusLimit = maximumRadius;
      camera.radius = recomposeEonCityR02CameraRadius({
        radius: camera.radius,
        previousScale,
        nextScale: profile.camera.radiusScale,
        min: minimumRadius,
        max: maximumRadius
      });
      camera.fov = profile.camera.fov;
    },
    onChange: (profile, previousProfile, reason) => {
      surfaceManager.setViewportProfile(profile);
      onTelemetry?.(freeze({ type: 'r02-viewport-profile', profile, previousProfileId: previousProfile?.id || '', reason }));
    }
  });
  productRoot.dataset.eonCityViewportDirector = EON_CITY_R02_VIEWPORT_SCHEMA;
  const onContextLost = (event) => {
    event?.preventDefault?.();
    contextLost = true;
    contextLossCount += 1;
    reliabilityController.noteContextLoss();
    clearInput('webgl-context-lost');
    // Preserve the last physically safe pose immediately. A mobile browser may
    // kill the GPU context under memory pressure before the normal periodic or
    // pagehide checkpoint gets another chance to run.
    writeResume(playerAnchor.position, playerAnchor.rotation.y, activeStationId);
    productRoot.dataset.eonCityGraphicsState = 'context-lost';
    productRoot.dataset.eonCityContextLossCount = String(contextLossCount);
    onStatus?.('City graphics paused safely. Use Restart 3D if the browser does not restore the scene.');
    onContextLoss?.({ code: 'CITY_WEBGL_CONTEXT_LOST', recoverable: true, recoveryAction: 'restart-3d', contextLossCount });
  };
  const handleContextRestored = () => {
    contextLost = false;
    movementRenderRecovery?.resetHeartbeats?.();
    contextRestoreCount += 1;
    reliabilityController.noteContextRestore();
    lastFrameAt = now();
    try { engine.resize(); } catch {}
    // Reassert the already-selected camera policy on the restored Babylon
    // context. This does not create another engine/camera/input owner.
    applyEonCityRt96CameraInputPolicy(camera, canvas, rt96CameraPolicy);
    productRoot.dataset.eonCityGraphicsState = 'ready';
    productRoot.dataset.eonCityContextRestoreCount = String(contextRestoreCount);
    onStatus?.('City graphics restored. Your local position and work state were preserved.');
    onContextRestored?.({ code: 'CITY_WEBGL_CONTEXT_RESTORED', recovered: true, contextRestoreCount });
  };
  canvas.addEventListener('webglcontextlost', onContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
  const onVisibilityChange = () => {
    documentHidden = globalThis.document?.visibilityState === 'hidden';
    if (documentHidden) { clearInput(); environmentController.stopAudio('tab-hidden'); }
    else {
      lastFrameAt = now();
      movementRenderRecovery?.resetHeartbeats?.();
      try { engine.resize(); } catch {}
    }
  };
  globalThis.document?.addEventListener?.('visibilitychange', onVisibilityChange);
  const onPageHide = () => writeResume(playerAnchor.position, playerAnchor.rotation.y, activeStationId);
  globalThis.addEventListener?.('pagehide', onPageHide);

  const applyAdaptiveSceneDetail = (level = performanceProtectionLevel) => {
    const detail = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: level });
    for (const entry of world.environment?.skylineWindowRows || []) {
      const enabled = entry.tier === 'near' ? detail.skyline.nearDecor : entry.tier === 'mid' ? detail.skyline.midDecor : detail.skyline.farDecor;
      try { entry.node?.setEnabled?.(enabled); } catch {}
    }
    for (const mesh of world.environment?.skylineFacadeBands || []) {
      const tier = String(mesh?.metadata?.tier || 'near');
      const enabled = tier === 'near' ? detail.skyline.nearDecor : tier === 'mid' ? detail.skyline.midDecor : detail.skyline.farDecor;
      try { mesh?.setEnabled?.(enabled); } catch {}
    }
    for (const mesh of world.environment?.skylineCrowns || []) {
      const tier = String(mesh?.metadata?.tier || 'near');
      const enabled = tier === 'near' ? true : detail.skyline.midDecor;
      try { mesh?.setEnabled?.(enabled); } catch {}
    }
    for (const mesh of world.environment?.skylineLightStrips || []) {
      const tier = String(mesh?.metadata?.tier || 'near');
      const enabled = tier === 'near' ? detail.skyline.nearDecor : detail.skyline.midDecor;
      try { mesh?.setEnabled?.(enabled); } catch {}
    }
    try { world.environment?.skylineTransitRoot?.setEnabled?.(detail.skyline.distantTransit); } catch {}
    const citizenBudget = Number(detail.ambient?.exteriorCitizenBudget ?? 4);
    for (const [index, citizen] of (world.ambientCitizens || []).entries()) {
      try { citizen.anchor?.setEnabled?.(index < citizenBudget); } catch {}
    }
    try { world.ambientActors?.maintenance?.anchor?.setEnabled?.(detail.ambient?.maintenanceActor !== false); } catch {}
    const commandHubActive = expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE';
    try { world.rt92CinematicVfx?.setActive?.(commandHubActive && detail.ambient?.cinematicVfx !== false, (globalThis.performance?.now?.() || 0) * 0.001); } catch {}
    productRoot.dataset.eonCityAmbientCitizenBudget = String(citizenBudget);
    productRoot.dataset.eonCityCinematicVfx = detail.ambient?.cinematicVfx !== false ? 'enabled' : 'shed';
    return detail;
  };

  const applyPerformanceProtection = (reason = 'manual') => {
    const previous = currentHardwareScalingLevel;
    const next = Math.min(maxHardwareScalingLevel, Number((previous + 0.2).toFixed(2)));
    if (next > previous + 0.001) {
      currentHardwareScalingLevel = next;
      performanceProtectionLevel += 1;
      engine.setHardwareScalingLevel?.(currentHardwareScalingLevel);
      try { engine.resize(); } catch {}
    }
    const changed = next > previous + 0.001;
    lastPerformanceProtectionReason = String(reason || 'manual');
    const result = freeze({
      ok: true,
      changed,
      reason: String(reason || 'manual'),
      level: performanceProtectionLevel,
      hardwareScalingLevel: currentHardwareScalingLevel,
      quality: resolvedQuality
    });
    if (changed) {
      const sceneDetail = applyAdaptiveSceneDetail(performanceProtectionLevel);
      reliabilityController.notePerformanceProtection();
      const evidence = freeze({ ...result, sceneDetail, fpsSample: lastFpsSample, documentHidden, visibilityState: String(globalThis.document?.visibilityState || ''), activeInputLockOwners: inputLockManager.getSnapshot().activeOwnerIds });
      try { console.warn('[W766IR2H_FPS_PROTECTION]', JSON.stringify(evidence), evidence); } catch {}
      onPerformanceChange?.({ ...evidence, message: `Command Hub performance protection reduced render load (${reason}).` });
    }
    return result;
  };

  // RT96: low-FPS protection is reversible, but only after a long stable
  // headroom window. This avoids permanently leaving a recovered phone at a
  // blurred render scale after one decode/thermal/scheduling dip, while the
  // wide FPS hysteresis prevents quality from oscillating every few seconds.
  const applyPerformanceRecovery = (reason = 'sustained-headroom') => {
    const previous = currentHardwareScalingLevel;
    const next = Math.max(baselineHardwareScalingLevel, Number((previous - 0.2).toFixed(2)));
    const changed = next < previous - 0.001 && performanceProtectionLevel > 0;
    if (changed) {
      currentHardwareScalingLevel = next;
      performanceProtectionLevel = Math.max(0, performanceProtectionLevel - 1);
      engine.setHardwareScalingLevel?.(currentHardwareScalingLevel);
      try { engine.resize(); } catch {}
    }
    lastPerformanceRecoveryReason = String(reason || 'sustained-headroom');
    const result = freeze({
      ok: true,
      changed,
      reason: lastPerformanceRecoveryReason,
      level: performanceProtectionLevel,
      hardwareScalingLevel: currentHardwareScalingLevel,
      baselineHardwareScalingLevel,
      quality: resolvedQuality
    });
    if (changed) {
      const sceneDetail = applyAdaptiveSceneDetail(performanceProtectionLevel);
      const evidence = freeze({ ...result, sceneDetail, fpsSample: lastFpsSample, documentHidden, visibilityState: String(globalThis.document?.visibilityState || ''), activeInputLockOwners: inputLockManager.getSnapshot().activeOwnerIds });
      try { console.info('[RT96_FPS_RECOVERY]', JSON.stringify(evidence), evidence); } catch {}
      onPerformanceChange?.({ ...evidence, message: `Command Hub restored render quality after sustained performance headroom (${reason}).` });
    }
    return result;
  };

  const startProgressiveAssets = async () => {
    reliabilityController.recordStage('deferred-stages-started');
    const enableLoadedInteraction = (loaded, metadata, collisions = true) => {
      if (!isEonCityW759PresentationReady(loaded)) return false;
      for (const mesh of loaded.container?.meshes || []) {
        if (!mesh || mesh === loaded.container?.rootNodes?.[0]) continue;
        mesh.isPickable = true;
        mesh.checkCollisions = Boolean(collisions);
        mesh.metadata = freeze({ ...(mesh.metadata || {}), ...metadata, interactive: true, explicitUserActionRequired: true });
      }
      return true;
    };
    const hideNodes = (nodes = []) => {
      for (const node of nodes || []) {
        try { node.setEnabled?.(false); } catch {}
      }
    };
    const hideProceduralStructure = (record) => hideNodes((record?.fallbackVisualNodes || []).filter((node) => node !== record?.base));
    try {
      const module = await import('./eon-city-w731-local-assets.js');
      if (destroyed) return;
      localAssetRuntime = module.createEonCityW731LocalAssetRuntime({
        scene,
        commandCoreConvergence: freeze({
      schema: EON_CITY_W760_W765_SCHEMA,
      validation: commandCoreConvergenceValidation,
      interactionCompleteness,
      menuOrder: EON_CITY_W763_MENU_ORDER,
      cameraPoses: EON_CITY_W760_CAMERA_POSES,
      nexusReaction: nexusReactionController?.getSnapshot?.() || null,
      rewardReaction: rewardReactionController?.getSnapshot?.() || null,
      oneNexusAuthority: EON_CITY_W749_LIVING_NEXUS_SCHEMA,
      oneMissionAuthority: EON_CITY_W752_SCHEMA,
      fakeLiveData: false,
      secondRuntime: false
    }),
    quality: resolvedQuality,
        qualityAuthority: resolvedQualityAuthority,
        onProgress: (event) => onAssetProgress?.(event),
        onStatus: (message) => onStatus?.(message)
      });
      localAssetRuntime.setOptionalAdmission?.(pendingOptionalAssetAdmission);

      stage('AUTHORED_VISIBLE_FRAME_LOADING', 'command-centre-core-and-hero-cast');
      const environmentLoads = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.coreAssetAliases.map(async (alias) => {
        const anchor = world.environmentAnchors.get(alias);
        if (!anchor) return freeze({ ok: false, alias, reason: 'environment-anchor-missing' });
        const loaded = await localAssetRuntime.loadEnvironment(alias, anchor);
        if (isEonCityW759PresentationReady(loaded)) {
          if (alias === 'living-nexus-core') {
            const nexusRecord = stationState.get('eonbot-nexus');
            if (nexusRecord) nexusRecord.loadedWorld = loaded;
            hideProceduralStructure(nexusRecord);
            enableLoadedInteraction(loaded, stationMetadata(getEonCityW731Station('eonbot-nexus'), { part: 'structure', interactionRole: 'structure', authored: true }), true);
            spatialDiagnostics.unregisterLoadedAsset('fallback:station:eonbot-nexus');
            livingNexus.setPresentationEnabled?.(false);
            spatialDiagnostics.unregisterLoadedAsset('procedural:w749-living-nexus');
            registerLoadedSpatialAsset('authored:living-nexus-core', loaded, {
              primaryRole: 'living-nexus-core', groupId: 'eonbot-nexus', allowHeroZone: true, allowArrivalRay: true
            });
          } else if (alias === 'command-seat') {
            enableLoadedInteraction(loaded, stationMetadata(getEonCityW731Station('command-console'), {
              part: 'command-wall:work', interactionRole: 'structure', commandWallId: 'work', authored: true,
              accessibilityLabel: 'Open the live Work command monitor from the Command Seat'
            }), true);
            registerLoadedSpatialAsset('authored:command-seat', loaded, {
              primaryRole: 'command-seat', groupId: 'operations-crescent'
            });
          } else if (alias === 'district-hologram') {
            enableLoadedInteraction(loaded, stationMetadata(getEonCityW731Station('command-console'), {
              part: 'command-wall:atlas-transit', interactionRole: 'structure', commandWallId: 'atlas-transit', authored: true,
              accessibilityLabel: 'Open the live Atlas and Transit command monitor'
            }), false);
            registerLoadedSpatialAsset('authored:district-hologram', loaded, {
              primaryRole: 'district-hologram', groupId: 'operations-crescent'
            });
          } else if (alias === 'eonbot-dock') {
            enableLoadedInteraction(loaded, stationMetadata(getEonCityW731Station('eonbot-nexus'), {
              part: 'structure', interactionRole: 'structure', dock: true, authored: true,
              accessibilityLabel: 'Open the Living EONBOT Nexus from its authored dock'
            }), false);
            world.dock.setEnabled?.(false);
            spatialDiagnostics.unregisterLoadedAsset('procedural:eonbot-dock');
            registerLoadedSpatialAsset('authored:eonbot-dock', loaded, {
              groupId: 'eonbot-nexus', allowHeroZone: true, allowArrivalRay: true
            });
          }
        }
        return freeze({ alias, ok: isEonCityW759PresentationReady(loaded), record: loaded });
      });
      const heroCharacterLoad = Promise.all([
        localAssetRuntime.loadCore('player-primary', playerAnchor),
        localAssetRuntime.loadCore('eonbot', eonbotAnchor)
      ]);
      const [environmentResults, heroCharacters] = await Promise.all([Promise.all(environmentLoads), heroCharacterLoad]);
      if (destroyed) return;
      const [loadedPlayer, loadedEonbot] = heroCharacters;
      playerAsset = loadedPlayer;
      eonbotAsset = loadedEonbot;
      const authoredPlayerPresentationReady = isEonCityW759PresentationReady(playerAsset);
      const authoredPlayerAnimationReadiness = authoredPlayerPresentationReady
        ? playerAsset.animations?.getReadiness?.(['idle', 'walk', 'run']) || freeze({ ready: false, required: freeze(['idle', 'walk', 'run']), states: freeze({}), availableClipCount: 0 })
        : freeze({ ready: false, required: freeze(['idle', 'walk', 'run']), states: freeze({}), availableClipCount: 0 });
      if (authoredPlayerPresentationReady && authoredPlayerAnimationReadiness.ready === true) {
        playerAnimationReadiness = freeze({ ...authoredPlayerAnimationReadiness, source: 'authored-player' });
        fallbackPlayer.root.setEnabled(false);
        playerAsset.wrapper?.setEnabled?.(true);
        playerAsset.animations?.playStationary?.('idle', { restart: true });
        playerAsset.animations?.stabilize?.();
        productRoot.dataset.eonCityPlayerAnimationReady = 'authored';
      } else {
        playerAnimationReadiness = freeze({ ready: true, source: 'procedural-fallback', required: freeze(['idle', 'walk', 'run']), states: freeze({ idle: true, walk: true, run: true }), availableClipCount: 0, authoredPresentationReady: authoredPlayerPresentationReady, authoredReadiness: authoredPlayerAnimationReadiness });
        fallbackPlayer.root.setEnabled(true);
        playerAsset?.wrapper?.setEnabled?.(false);
        productRoot.dataset.eonCityPlayerAnimationReady = 'procedural-fallback';
        onStatus?.('Pathfinder is using the animated local fallback while authored locomotion clips recover.');
      }
      if (isEonCityW759PresentationReady(eonbotAsset)) {
        eonbotFallback.setEnabled(false);
        eonbotRing.setEnabled(false);
        enableLoadedInteraction(eonbotAsset, stationMetadata(getEonCityW731Station('eonbot-nexus'), {
          part: 'npc', interactionRole: 'npc', npcName: 'EONBOT', companion: true, authored: true
        }), false);
      }
      const authoredCoreReady = environmentResults.filter((entry) => entry.ok).length;
      const authoredHeroCharactersReady = heroCharacters.filter(isEonCityW759PresentationReady).length;
      const environmentDegraded = authoredCoreReady < EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreAssetCount;
      const heroCastDegraded = authoredHeroCharactersReady < EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreCharacterCount;
      const visibleFrameDegraded = environmentDegraded || heroCastDegraded;
      visibleFrameState.authoredEnvironmentReady = authoredCoreReady;
      visibleFrameState.authoredHeroCharactersReady = authoredHeroCharactersReady;
      visibleFrameState.gateComplete = true;
      visibleFrameState.degraded = visibleFrameDegraded;
      stage('AUTHORED_VISIBLE_FRAME_READY', `${authoredCoreReady}/${EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreAssetCount};cast:${authoredHeroCharactersReady}/${EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreCharacterCount}`);
      // L95-W56 — startup GLB decode/attachment work is not sustained gameplay
      // pressure. Begin the FPS-protection evidence window only after the
      // authored visible-frame gate completes, then require the normal cooldown
      // before any render-load protection can change the stable scene.
      lowFpsSamples = 0;
      highFpsSamples = 0;
      fpsFrames = 0;
      fpsSampleAt = now();
      lastPerformanceProtectionAt = fpsSampleAt;
      lastPerformanceRecoveryAt = fpsSampleAt;
      onInitialAssetsReady?.(freeze({
        ok: !visibleFrameDegraded,
        degraded: visibleFrameDegraded,
        authoredEnvironmentReady: authoredCoreReady,
        authoredEnvironmentRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreAssetCount,
        authoredHeroCharactersReady,
        authoredHeroCharactersRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreCharacterCount,
        brandedHeroFallbackReady: true,
        visibleFrameGateComplete: true,
        progressiveCharacterAssets: true,
        stationInteractionTriads: true
      }));
      onStatus?.(visibleFrameDegraded
        ? 'The authored Command Centre or hero cast is partly ready. Branded local fallbacks keep every route usable.'
        : 'The authored Command Centre, Pathfinder, EONBOT, 3D Nexus and arrival composition are ready.');
      // RT96 warm-start proof is browser-local and non-blocking. The baseline
      // cache snapshot began before progressive loads, so Resource Timing can
      // distinguish observed network bytes from assets already saved when the
      // City session started without claiming a specific cache layer.
      void refreshAssetTransferObservation('visible-frame-ready');

      const stationStructureLoads = [];
      const stationTerminalLoads = [];
      for (const station of EON_CITY_W731_STATIONS) {
        const record = stationState.get(station.id);
        if (!record) continue;
        if (station.id !== 'eonbot-nexus') {
          const alias = `${station.id}-world`;
          stationStructureLoads.push(localAssetRuntime.loadStation(alias, record.visualRoot, station.id).then((loaded) => {
            if (isEonCityW759PresentationReady(loaded)) {
              record.loadedWorld = loaded;
              hideProceduralStructure(record);
              enableLoadedInteraction(loaded, stationMetadata(station, { part: 'structure', interactionRole: 'structure', authored: true }), true);
              spatialDiagnostics.unregisterLoadedAsset(`fallback:station:${station.id}`);
              registerLoadedSpatialAsset(`authored:station:${station.id}`, loaded, {
                primaryRole: station.id, groupId: station.id
              });
            }
            return loaded;
          }));
        }
        const terminalAlias = `${station.id}-terminal`;
        stationTerminalLoads.push(localAssetRuntime.loadStationProp(terminalAlias, record.terminalAnchor, station.id).then((loaded) => {
          if (isEonCityW759PresentationReady(loaded)) {
            record.loadedTerminal = loaded;
            hideNodes(record.terminalFallbackNodes);
            enableLoadedInteraction(loaded, stationMetadata(station, { part: 'terminal', interactionRole: 'terminal', authored: true }), false);
            registerLoadedSpatialAsset(`authored:terminal:${station.id}`, loaded, {
              groupId: station.id,
              allowHeroZone: station.id === 'eonbot-nexus',
              allowArrivalRay: station.id === 'eonbot-nexus'
            });
          }
          return loaded;
        }));
      }

      const discoveryLoads = [];
      for (const discovery of EON_CITY_W737_DISCOVERIES) {
        const record = discoveryState.get(discovery.id);
        const alias = `${discovery.id}-world`;
        discoveryLoads.push(localAssetRuntime.loadDiscovery(alias, record?.visualRoot || record?.root, discovery.id).then((loaded) => {
          if (isEonCityW759PresentationReady(loaded) && record) {
            record.loadedWorld = loaded;
            hideNodes(record.fallbackVisualNodes);
            enableLoadedInteraction(loaded, discoveryMetadata(discovery, { part: 'authored-world' }), true);
            spatialDiagnostics.unregisterLoadedAsset(`fallback:discovery:${discovery.id}`);
            registerLoadedSpatialAsset(`authored:discovery:${discovery.id}`, loaded, {
              primaryRole: discovery.id, groupId: discovery.id
            });
          }
          return loaded;
        }));
      }

      const roleLoads = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.map(async (roleEntry) => {
        const record = stationState.get(roleEntry.stationId);
        if (!record) return freeze({ ok: false, reason: 'station-record-missing', stationId: roleEntry.stationId });
        const loaded = await localAssetRuntime.loadRole(roleEntry.stationId, record.npcAnchor);
        if (isEonCityW759PresentationReady(loaded)) {
          record.fallbackNpc.root.setEnabled(false);
          record.loadedNpc = loaded;
          enableLoadedInteraction(loaded, stationMetadata(record.station, {
            part: 'npc', interactionRole: 'npc', npcName: record.station.npc.name,
            npcAlias: roleEntry.alias, authored: true
          }), false);
          loaded.animations?.playStationary?.('idle');
          record.npcGestureState = 'idle';
          record.npcGestureUntil = 0;
          record.nextNpcGestureAt = now() + 4_000 + record.station.priority * 680;
          npcAssets.set(record.station.id, loaded);
        }
        return loaded;
      });

      const ambientLoads = [];
      const transitActor = world.ambientActors?.transit;
      const maintenanceActor = world.ambientActors?.maintenance;
      if (transitActor) {
        ambientLoads.push(localAssetRuntime.loadAmbient('transit-capsule-ambient', transitActor.anchor, 'transit-capsule').then((loaded) => {
        if (isEonCityW759PresentationReady(loaded)) {
          transitActor.loaded = loaded;
          hideNodes(transitActor.fallbackNodes);
          enableLoadedInteraction(loaded, transitActor.anchor.metadata, false);
        }
        return loaded;
        }));
      }
      if (maintenanceActor) {
        ambientLoads.push(localAssetRuntime.loadAmbient('maintenance-worker-ambient', maintenanceActor.anchor, 'maintenance-worker').then((loaded) => {
        if (isEonCityW759PresentationReady(loaded)) {
          maintenanceActor.loaded = loaded;
          maintenanceActor.fallbackPerson.root.setEnabled(false);
          loaded.animations?.play?.('walk');
        }
        return loaded;
        }));
      }
      for (const citizen of world.ambientCitizens || []) {
        ambientLoads.push(localAssetRuntime.loadAmbient(citizen.assetAlias, citizen.anchor, citizen.id).then((loaded) => {
          if (isEonCityW759PresentationReady(loaded)) {
            citizen.loaded = loaded;
            citizen.animationState = citizen.motion;
            loaded.animations?.play?.(citizen.motion, { restart: true });
          } else {
            // Empty anchor is intentional. A missing authored citizen must never
            // become a visible procedural stick figure.
            citizen.loaded = null;
          }
          return loaded;
        }));
      }
      const streetLightNetwork = world.exteriorMap;
      if (streetLightNetwork?.streetLampAnchors?.length && resolvedQuality !== 'lite') {
        const authoredAnchors = streetLightNetwork.streetLampAnchors.filter((_, index) => index % 2 === 0);
        ambientLoads.push(localAssetRuntime.loadAmbient('street-lamp-ambient', authoredAnchors[0], 'street-light-network').then((loaded) => {
          if (!isEonCityW759PresentationReady(loaded)) return loaded;
          streetLightNetwork.authoredStreetLamp = loaded;
          streetLightNetwork.proceduralLampPosts.forEach((node, index) => {
            if (index % 2 === 0) node.setEnabled?.(false);
          });
          const clones = [];
          for (let index = 1; index < authoredAnchors.length; index += 1) {
            const clone = loaded.wrapper?.clone?.(`w744-authored-street-lamp-instance-${index}`, authoredAnchors[index], false);
            if (!clone) continue;
            clone.parent = authoredAnchors[index];
            clone.position.copyFrom(loaded.wrapper.position);
            clone.rotation.copyFrom(loaded.wrapper.rotation);
            clone.scaling.copyFrom(loaded.wrapper.scaling);
            clone.metadata = freeze({ kind: 'w744-authored-street-lamp-instance', index, ambientOnly: true, interactive: false });
            for (const child of clone.getChildMeshes?.(false) || []) {
              child.isPickable = false;
              child.checkCollisions = false;
            }
            clones.push(clone);
          }
          streetLightNetwork.authoredStreetLampClones = clones;
          return loaded;
        }));
      }

      await Promise.allSettled([
        ...stationStructureLoads, ...stationTerminalLoads, ...discoveryLoads, ...roleLoads, ...ambientLoads
      ]);
      if (destroyed) return;
      reliabilityController.noteAssets(localAssetRuntime?.getSummary?.() || {});
      const spatialReport = spatialDiagnostics.getReport();
      const ownerRuntimeGate = publishEonCityR11RuntimeGate(evaluateEonCityR11RuntimeGate({
        spatialReport,
        surfaceSnapshot: surfaceManager.getSnapshot(),
        viewportProfile: viewportDirector.getProfile(),
        firstPlayableFrame: true
      }), { environment: globalThis, root: productRoot });
      productRoot.dataset.eonCitySpatialGate = spatialReport.ok ? 'pass' : 'fail';
      if (!spatialReport.ok) {
        try { console.error?.('[W747_SPATIAL_DIAGNOSTICS_BLOCKING]', JSON.stringify(spatialReport), spatialReport); } catch {}
        onStatus?.(`Owner-candidate gate blocked: spatial diagnostics must be clean before review (${ownerRuntimeGate.failures.join(', ')}).`);
      } else onStatus?.('The Living Command Centre cast, station structures, usable terminals, transport and outside discoveries are ready on this device.');
    } catch (error) {
      visibleFrameState.authoredEnvironmentReady = 0;
      visibleFrameState.authoredHeroCharactersReady = 0;
      visibleFrameState.gateComplete = true;
      visibleFrameState.degraded = true;
      try { console.warn('[W744_AUTHORED_ASSETS_DEFERRED]', error); } catch {}
      onInitialAssetsReady?.(freeze({
        ok: false,
        degraded: true,
        authoredEnvironmentReady: 0,
        authoredHeroCharactersReady: 0,
        brandedHeroFallbackReady: true,
        visibleFrameGateComplete: true,
        stationInteractionTriads: true
      }));
      onStatus?.('The City remains usable with deliberate branded structures and terminals while authored character assets recover. Missing NPC assets remain hidden rather than becoming procedural figures.');
    }
  };

  const applyProceduralWalk = (person, seconds, phase = 0, speed = 1) => {
    const rig = person?.rig;
    if (!rig) return;
    const cadence = seconds * 5.1 * Math.max(0.5, speed) + phase;
    const stride = reducedMotion ? 0 : Math.sin(cadence);
    rig.leftLeg.rotation.x = stride * 0.46;
    rig.rightLeg.rotation.x = -stride * 0.46;
    rig.leftArm.rotation.x = -stride * 0.36;
    rig.rightArm.rotation.x = stride * 0.36;
    rig.leftArm.rotation.z = -0.08;
    rig.rightArm.rotation.z = 0.08;
    rig.head.rotation.y = reducedMotion ? 0 : Math.sin(cadence * 0.5) * 0.045;
    rig.body.rotation.x = 0.025;
  };

  const applyProceduralStationary = (record, person, seconds, phase = 0) => {
    const rig = person?.rig;
    if (!rig) return;
    const gesture = record?.npcGestureState || 'idle';
    const conversational = gesture === 'talk' || gesture === 'interact';
    const wave = gesture === 'wave';
    const inspect = gesture === 'inspect';
    const pose = gesture === 'pose';
    const idleAlt = gesture === 'idle-alt';
    const cadence = seconds * (conversational ? 3.1 : 1.15) + phase;
    rig.head.rotation.y = inspect
      ? -0.26 + Math.sin(seconds * 0.55 + phase) * 0.08
      : Math.sin(seconds * (idleAlt ? 0.46 : 0.72) + phase) * (conversational ? 0.16 : idleAlt ? 0.13 : 0.08);
    rig.head.rotation.x = inspect ? -0.075 : Math.sin(seconds * 0.9 + phase) * (idleAlt ? 0.04 : 0.025);
    rig.leftArm.rotation.x = pose ? -0.34 : inspect ? -0.18 : conversational ? -0.28 + Math.sin(cadence) * 0.18 : Math.sin(cadence) * (idleAlt ? 0.085 : 0.045);
    rig.rightArm.rotation.x = wave ? -0.2 : pose ? -0.72 : inspect ? -0.34 : conversational ? -0.3 - Math.sin(cadence) * 0.18 : -Math.sin(cadence) * (idleAlt ? 0.085 : 0.045);
    rig.leftArm.rotation.z = pose ? -0.62 : -0.08 - (conversational ? Math.sin(cadence * 0.7) * 0.08 : 0);
    rig.rightArm.rotation.z = wave ? -1.78 + Math.sin(seconds * 7 + phase) * 0.22 : pose ? 0.62 : inspect ? 0.28 : 0.08 + (conversational ? Math.sin(cadence * 0.7) * 0.08 : 0);
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.body.rotation.x = 0;
  };

  const setStationNpcAnimation = (record, state, { stationary = false, restart = false } = {}) => {
    if (!record?.npcRoute) return false;
    if (record.npcRoute.animationState === state && !restart) return true;
    const animations = record.loadedNpc?.animations;
    const accepted = animations
      ? (stationary ? animations.playStationary?.(state, { restart }) : animations.play?.(state, { restart }))
      : true;
    if (accepted !== false) record.npcRoute.animationState = state;
    return accepted !== false;
  };

  const updateStationNpcRoute = (record, timeMs) => {
    const route = record?.npcRoute;
    if (!route?.enabled) return false;
    const suspended = reducedMotion || route.suspendedUntil > timeMs || record.npcGestureUntil > timeMs;
    const snapshot = w754NpcScheduleController.update(record.station.id, timeMs, { suspended });
    if (!snapshot?.ok) return false;
    const previous = record.npcAnchor.position.clone();
    record.npcAnchor.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
    const dx = record.npcAnchor.position.x - previous.x;
    const dz = record.npcAnchor.position.z - previous.z;
    const step = Math.hypot(dx, dz);
    const moved = snapshot.moving && step > 0.0001;
    route.phase = snapshot.phase;
    route.moving = moved;
    route.actualDistanceTravelled += step;
    if (moved) {
      record.npcAnchor.rotation.y = snapshot.heading;
      if (route.moving) setStationNpcAnimation(record, 'walk');
      record.npcGestureState = 'idle';
      return true;
    }
    const stationaryState = snapshot.animation === 'interact' ? 'interact' : (record.npcGestureState || 'idle');
    setStationNpcAnimation(record, stationaryState, { stationary: true });
    return false;
  };

  const updateMaintenanceActor = (timeMs) => {
    const actor = world.ambientActors?.maintenance;
    if (!actor) return;
    const deltaSeconds = actor.lastAt > 0 ? Math.min(0.05, Math.max(0.001, (timeMs - actor.lastAt) / 1000)) : 0.016;
    actor.lastAt = timeMs;
    if (reducedMotion) {
      actor.moving = false;
      actor.loaded?.animations?.playStationary?.('idle');
      return;
    }
    if (actor.phase === 'dwell-terminal' || actor.phase === 'dwell-home') {
      actor.moving = false;
      const atTerminal = actor.phase === 'dwell-terminal';
      actor.loaded?.animations?.playStationary?.(atTerminal ? 'interact' : 'idle');
      if (timeMs < actor.phaseUntil) return;
      actor.phase = atTerminal ? 'walk-home' : 'walk-terminal';
      actor.loaded?.animations?.play?.('walk', { restart: true });
    }
    const target = actor.phase === 'walk-terminal' ? actor.terminal : actor.home;
    const delta = target.subtract(actor.anchor.position);
    const distance = delta.length();
    if (distance <= 0.035) {
      actor.anchor.position.copyFrom(target);
      const atTerminal = actor.phase === 'walk-terminal';
      actor.phase = atTerminal ? 'dwell-terminal' : 'dwell-home';
      actor.phaseUntil = timeMs + (atTerminal ? 4_200 : 3_600);
      actor.moving = false;
      actor.loaded?.animations?.playStationary?.(atTerminal ? 'interact' : 'idle', { restart: true });
      return;
    }
    const direction = delta.scale(1 / Math.max(0.001, distance));
    const step = Math.min(distance, actor.speed * deltaSeconds);
    actor.anchor.position.addInPlace(direction.scale(step));
    actor.anchor.rotation.y = Math.atan2(direction.x, direction.z);
    actor.moving = step > 0.0001;
    if (actor.animationState !== 'walk') {
      actor.animationState = 'walk';
      actor.loaded?.animations?.play?.('walk', { restart: true });
    }
    actor.loaded?.animations?.stabilize?.();
  };

  let lastSkylineAmbienceAt = 0;
  let lastDistantTransitAmbienceAt = 0;
  let lastStationHaloAmbienceAt = 0;
  let lastCircuitPulseAmbienceAt = 0;
  let lastStationMonitorCheckAt = -Infinity;
  let lastHubHeroAnimationAt = -Infinity;
  let lastRainAnimationAt = -Infinity;
  let lastProximitySampleAt = -Infinity;
  const stationDistanceCache = new Map();
  const citizenDistanceCache = new Map();
  let maintenanceDistanceCache = 0;
  const sampleAnimationProximity = (timeMs) => {
    const interval = Number(performanceBudget.proximitySampling?.intervalMs || 0);
    if (interval > 0 && timeMs - lastProximitySampleAt < interval && stationDistanceCache.size === stationState.size) return;
    lastProximitySampleAt = timeMs;
    for (const record of stationState.values()) {
      stationDistanceCache.set(record.station.id, Math.hypot(
        Number(record.root?.position?.x || 0) - Number(playerAnchor.position.x || 0),
        Number(record.root?.position?.z || 0) - Number(playerAnchor.position.z || 0)
      ));
    }
    for (const citizen of world.ambientCitizens || []) {
      citizenDistanceCache.set(citizen.id, Math.hypot(
        Number(citizen.anchor?.position?.x || 0) - Number(playerAnchor.position.x || 0),
        Number(citizen.anchor?.position?.z || 0) - Number(playerAnchor.position.z || 0)
      ));
    }
    const maintenance = world.ambientActors?.maintenance;
    maintenanceDistanceCache = maintenance ? Math.hypot(
      Number(maintenance.anchor?.position?.x || 0) - Number(playerAnchor.position.x || 0),
      Number(maintenance.anchor?.position?.z || 0) - Number(playerAnchor.position.z || 0)
    ) : 0;
  };
  const animatedSkylineTiers = new Set(performanceBudget.ambience.animatedSkylineTiers || []);
  const updateAnimatedWorld = (timeMs) => {
    const seconds = timeMs * 0.001;
    const epochNow = Date.now();
    world.rt92EnvironmentalLife?.update?.(seconds);
    world.rt92CinematicVfx?.update?.(seconds);
    world.orientationRing.rotation.z += reducedMotion ? 0 : 0.0018;
    const rt92CommandHubArt = world.rt92CommandHubArt;
    if (rt92CommandHubArt) {
      for (const [index, ring] of rt92CommandHubArt.nexusOrbitRings.entries()) {
        if (!reducedMotion) {
          ring.rotation.z += (index % 2 ? -1 : 1) * (0.0016 + index * 0.0005);
          ring.rotation.y += (index % 2 ? 1 : -1) * 0.0007;
        }
        ring.visibility = 0.55 + (Math.sin(seconds * 0.68 + index * 1.3) + 1) * 0.085;
      }
      if (!reducedMotion) rt92CommandHubArt.nexusCrown.rotation.y += 0.0017;
      for (const pulse of rt92CommandHubArt.pulseNodes) {
        const angle = pulse.phase * TAU + (reducedMotion ? 0 : seconds * pulse.speed);
        pulse.node.position.set(Math.sin(angle) * pulse.radius, 0.205, Math.cos(angle) * pulse.radius);
        pulse.node.visibility = 0.48 + (Math.sin(seconds * 1.15 + pulse.phase * TAU) + 1) * 0.18;
      }
    }
    const skylineInterval = performanceBudget.ambience.skylinePulseIntervalMs;
    if (skylineInterval > 0 && timeMs - lastSkylineAmbienceAt >= skylineInterval) {
      lastSkylineAmbienceAt = timeMs;
      for (const entry of world.environment?.skylineWindowRows || []) {
        if (!animatedSkylineTiers.has(entry.tier)) continue;
        entry.node.visibility = 0.72 + (Math.sin(seconds * 0.82 + entry.phase) + 1) * 0.12;
      }
    }
    const transitInterval = performanceBudget.ambience.distantTransitIntervalMs;
    if (transitInterval > 0 && timeMs - lastDistantTransitAmbienceAt >= transitInterval) {
      lastDistantTransitAmbienceAt = timeMs;
      for (const transitEntry of world.environment?.skylineTransit || []) {
        const angle = transitEntry.phase + seconds * transitEntry.speed;
        transitEntry.node.position.set(Math.sin(angle) * transitEntry.radius, transitEntry.height + Math.sin(seconds * 0.55 + transitEntry.phase) * 0.25, Math.cos(angle) * transitEntry.radius);
        transitEntry.node.rotation.y = angle;
      }
    }
    const activeAdaptiveDetail = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: performanceProtectionLevel });
    const haloInterval = activeAdaptiveDetail.ambient.stationHaloAnimation ? performanceBudget.ambience.stationHaloIntervalMs : 0;
    if (haloInterval > 0 && timeMs - lastStationHaloAmbienceAt >= haloInterval) {
      lastStationHaloAmbienceAt = timeMs;
      for (const [index, halo] of (world.environment?.stationSocketHalos || []).entries()) {
        halo.rotation.z += 0.015 + (index % 3) * 0.0035;
        halo.visibility = 0.62 + (Math.sin(seconds * 0.9 + index * 0.7) + 1) * 0.12;
      }
    }
    const nexusReaction = latestNexusReaction?.expiresAt > epochNow ? latestNexusReaction : null;
    for (const [index, ring] of (world.environment?.reactions?.nexusRings || []).entries()) {
      const active = Boolean(nexusReaction);
      ring.setEnabled(active);
      if (!active) continue;
      const intensity = Number(nexusReaction.intensity || 0.7);
      const phase = seconds * (1.7 + index * 0.33) + index * 1.2;
      ring.rotation.z = reducedMotion ? index * 0.2 : phase;
      ring.scaling.setAll(1 + (reducedMotion ? 0 : Math.sin(phase * 1.4) * 0.055 * intensity));
      ring.visibility = 0.42 + intensity * 0.45;
    }
    const rewardReaction = latestRewardReaction?.expiresAt > epochNow ? latestRewardReaction : null;
    const rewardNodes = world.environment?.reactions?.rewardBurstNodes || [];
    const rewardProgress = rewardReaction ? Math.max(0, Math.min(1, (epochNow - rewardReaction.at) / Math.max(1, rewardReaction.expiresAt - rewardReaction.at))) : 0;
    for (const [index, spark] of rewardNodes.entries()) {
      const active = Boolean(rewardReaction);
      spark.setEnabled(active);
      if (!active) continue;
      const angle = (index / Math.max(1, rewardNodes.length)) * TAU + (reducedMotion ? 0 : rewardProgress * TAU * 1.35);
      const radius = 0.35 + rewardProgress * (2.1 + (index % 4) * 0.18);
      spark.position.set(Math.sin(angle) * radius, 0.55 + Math.sin(angle * 2 + index) * 0.34 + rewardProgress * 1.35, Math.cos(angle) * radius);
      const scale = Math.max(0.18, 1 - rewardProgress * 0.82);
      spark.scaling.setAll(scale);
      spark.visibility = Math.max(0.08, 1 - rewardProgress);
    }
    const circuitPulseInterval = activeAdaptiveDetail.ambient.circuitPulseAnimation ? performanceBudget.ambience.circuitPulseIntervalMs : 0;
    const circuitPulseDue = reducedMotion
      ? lastCircuitPulseAmbienceAt === 0
      : circuitPulseInterval > 0 && timeMs - lastCircuitPulseAmbienceAt >= circuitPulseInterval;
    if (circuitPulseDue) {
      lastCircuitPulseAmbienceAt = timeMs;
      for (const pulse of world.circuitPulses || []) {
        const progress = reducedMotion ? pulse.phase : (seconds * pulse.speed + pulse.phase) % 1;
        pulse.node.position.set(
          pulse.from.x + (pulse.to.x - pulse.from.x) * progress,
          pulse.from.y + (pulse.to.y - pulse.from.y) * progress,
          pulse.from.z + (pulse.to.z - pulse.from.z) * progress
        );
        const pulseScale = reducedMotion ? 0.72 : 0.72 + Math.sin((progress * TAU) + pulse.phase * TAU) * 0.18;
        pulse.node.scaling.setAll(Math.max(0.5, pulseScale));
      }
    }
    sampleAnimationProximity(timeMs);
    for (const record of stationState.values()) {
      const stationDistance = Number(stationDistanceCache.get(record.station.id) || 0);
      const animateStation = reliabilityController.shouldUpdateAnimation({ id: `station:${record.station.id}`, distance: stationDistance, at: timeMs });
      const npcMoving = animateStation ? updateStationNpcRoute(record, timeMs) : Boolean(record.npcRoute?.moving);
      for (const entry of record.animated) {
        if (!entry.node || entry.node.isDisposed?.() || !animateStation) continue;
        if (entry.kind === 'float' && !reducedMotion) entry.node.position.y = entry.baseY + Math.sin(seconds * 1.25 + entry.phase) * 0.1;
        else if (entry.kind === 'ring-a' && !reducedMotion) entry.node.rotation.z += 0.0035;
        else if (entry.kind === 'ring-b' && !reducedMotion) entry.node.rotation.y -= 0.0026;
        else if (entry.kind === 'pulse' && !reducedMotion) entry.node.scaling.setAll(1 + Math.sin(seconds * 1.6 + entry.phase) * 0.035);
        else if (entry.kind === 'npc-idle') {
          if (npcMoving) {
            entry.node.position.y = Math.abs(Math.sin(seconds * 5.1 + entry.phase)) * 0.025;
            entry.node.rotation.z = 0;
            if (!isEonCityW759PresentationReady(record.loadedNpc)) applyProceduralWalk(entry.person, seconds, entry.phase, record.npcRoute.speed);
          } else if (!reducedMotion) {
            entry.node.position.y = entry.baseY + Math.sin(seconds * 1.05 + entry.phase) * 0.025;
            entry.node.rotation.z = Math.sin(seconds * 0.55 + entry.phase) * 0.012;
            if (!isEonCityW759PresentationReady(record.loadedNpc)) applyProceduralStationary(record, entry.person, seconds, entry.phase);
          } else if (!isEonCityW759PresentationReady(record.loadedNpc)) applyProceduralStationary(record, entry.person, seconds, entry.phase);
        }
      }

      const routeAtTerminal = record.npcRoute?.phase === 'dwell-terminal';
      if (animateStation && !npcMoving && !routeAtTerminal) {
        const npcAnimations = record.loadedNpc?.animations;
        if (record.npcGestureUntil > 0 && timeMs >= record.npcGestureUntil) {
          npcAnimations?.playStationary?.('idle');
          record.npcGestureState = 'idle';
          record.npcGestureUntil = 0;
          record.npcRoute.animationState = 'idle';
        } else if (record.npcGestureUntil <= 0 && timeMs >= record.nextNpcGestureAt) {
          const gesture = STATIONARY_NPC_GESTURES[(record.station.priority - 1) % STATIONARY_NPC_GESTURES.length];
          const gestureAccepted = npcAnimations ? npcAnimations.playStationary?.(gesture, { restart: true }) : true;
          if (gestureAccepted) {
            record.npcGestureState = gesture;
            record.npcGestureUntil = timeMs + 1_850 + (record.station.priority % 3) * 260;
            record.npcRoute.animationState = gesture;
          }
          record.nextNpcGestureAt = timeMs + 7_500 + record.station.priority * 610;
        }
      }
      if (animateStation) record.loadedNpc?.animations?.stabilize?.();
      const active = activationPulse?.stationId === record.station.id && activationPulse.until > timeMs;
      if (active && !reducedMotion) {
        record.root.scaling.setAll(1.08 + Math.sin(seconds * 24) * 0.04);
      } else if (Math.abs(Number(record.root.scaling?.x || 1) - 1) > 0.0001 || Math.abs(Number(record.root.scaling?.y || 1) - 1) > 0.0001 || Math.abs(Number(record.root.scaling?.z || 1) - 1) > 0.0001) {
        // Do not dirty every station transform on every frame when no activation
        // pulse is visible. Station roots own substantial authored subtrees.
        record.root.scaling.setAll(1);
      }
    }

    for (const citizen of world.ambientCitizens || []) {
      if (!isEonCityW759PresentationReady(citizen.loaded)) continue;
      const citizenDistance = Number(citizenDistanceCache.get(citizen.id) || 0);
      if (!reliabilityController.shouldUpdateAnimation({ id: `ambient-citizen:${citizen.id}`, distance: citizenDistance, at: timeMs })) continue;
      const angle = citizen.startAngle + (reducedMotion ? 0 : citizen.direction * ((seconds * citizen.speed) / citizen.radius));
      citizen.anchor.position.set(Math.sin(angle) * citizen.radius, 0, Math.cos(angle) * citizen.radius);
      citizen.anchor.rotation.y = Math.atan2(citizen.direction * Math.cos(angle), citizen.direction * -Math.sin(angle));
      const desiredAnimation = reducedMotion ? 'idle' : citizen.motion;
      if (desiredAnimation !== citizen.animationState) {
        citizen.animationState = desiredAnimation;
        if (desiredAnimation === 'idle') citizen.loaded.animations?.playStationary?.('idle', { restart: true });
        else citizen.loaded.animations?.play?.(desiredAnimation, { restart: true });
      }
      citizen.loaded.animations?.stabilize?.();
    }

    const transit = world.ambientActors?.transit;
    if (transit) {
      const transitState = w754TransitController.update(timeMs);
      if (transitState?.pose && ['active', 'complete'].includes(transitState.status)) {
        transit.anchor.position.set(transitState.pose.position.x, transitState.pose.position.y, transitState.pose.position.z);
        transit.anchor.rotation.y = transitState.pose.rotationY;
      } else {
        const angle = transit.startAngle + (reducedMotion ? 0 : seconds * transit.speed);
        transit.anchor.position.set(Math.sin(angle) * transit.radius, reducedMotion ? 2.5 : 2.5 + Math.sin(seconds * 0.8) * 0.22, Math.cos(angle) * transit.radius);
        // The capsule's authored long axis is local +X; this yaw aligns it to
        // the circular route tangent instead of presenting it backwards.
        transit.anchor.rotation.y = angle;
      }
      transit.loaded?.animations?.stabilize?.();
      if (transit.fallbackNodes?.[1]) transit.fallbackNodes[1].rotation.z += reducedMotion ? 0 : 0.018;
    }
    const maintenanceDistance = maintenanceDistanceCache;
    if (reliabilityController.shouldUpdateAnimation({ id: 'ambient:maintenance', distance: maintenanceDistance, at: timeMs })) updateMaintenanceActor(timeMs, seconds);
    eonbotRing.rotation.z += reducedMotion ? 0 : 0.006;
  };

  const updateMovement = (deltaSeconds) => {
    movementUpdateCalls += 1;
    lastMovementUpdateAt = Date.now();
    movementRenderRecovery?.noteMovementUpdate(lastMovementUpdateAt);
    const input = axis();
    const blockedReason = getMovementBlockReason();
    const canMove = input.active && !blockedReason;
    lastMovementBlockReason = input.active ? (blockedReason || '') : 'no-input';
    let desiredDirection = null;
    let runRequested = false;
    const beforeX = Number(playerAnchor.position.x || 0);
    const beforeZ = Number(playerAnchor.position.z || 0);
    lastBeforePosition = freeze({ x: beforeX, z: beforeZ });
    if (input.active) activeAxisFrameCount += 1;
    const expanseMovementActive = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
    lastR08Locomotion = deriveEonCityR08Locomotion({
      moving: input.active,
      sprintRequested: sprintSources.size > 0,
      expanseActive: expanseMovementActive,
      blocked: !canMove
    });
    if (canMove) {
      if (expanseMovementActive) {
        if (cameraMode !== 'expanse-follow') {
          cameraMode = 'expanse-follow';
          camera.radius = Math.max(12, Math.min(22, Number.isFinite(Number(camera.radius)) ? Number(camera.radius) : 16));
        }
      } else if (cameraMode !== 'follow') {
        cameraMode = 'follow';
        camera.radius = EON_CITY_W747_CAMERA_POSES.follow.radius;
      }
      const forward = camera.getForwardRay(1).direction;
      forward.y = 0;
      if (forward.lengthSquared() < 0.0001) forward.set(0, 0, 1);
      forward.normalize();
      // W765R6: one canonical screen-relative basis owns every left/right
      // path. Positive input is screen-right and negative input is screen-left.
      // The previous local perpendicular used the opposite sign and reversed
      // A/D, ArrowLeft/ArrowRight, and the matching touch controls in production.
      const resolvedMove = resolveEonCityCameraRelativeMovement({
        inputRight: input.right,
        inputForward: input.forward,
        cameraPosition: camera.position,
        cameraTarget: camera.target,
        cameraAlpha: camera.alpha,
        deadZone: 0
      });
      const directionVector = new Vector3(resolvedMove.x, 0, resolvedMove.z);
      if (directionVector.lengthSquared() > 0.0001) {
        directionVector.normalize();
        runRequested = lastR08Locomotion.sprinting || expanseMovementActive;
        const speed = lastR08Locomotion.speed;
        const requested = playerAnchor.position.add(directionVector.scale(speed * deltaSeconds));
        lastRequestedPosition = freeze({ x: Number(requested.x), z: Number(requested.z) });
        // Keep the long-standing world-mode boundary explicit: Expanse owns its
        // own sanitizer while Command Hub first applies the canonical world
        // clamp. RT96 then adds physical station/structure collision only to
        // the bounded Command Hub result.
        const next = expanseMovementActive
          ? sanitizeEonExpanseW766APlayerPosition({ x: requested.x, y: 0.15, z: requested.z }, playerAnchor.position)
          : clampEonCityW731Position(requested);
        const resolvedNext = expanseMovementActive
          ? next
          : resolveEonCityW765R6PlayerCollision(next, playerAnchor.position, playerCollisionZones);
        lastClampedPosition = freeze({
          x: Number(resolvedNext.x), z: Number(resolvedNext.z),
          worldMode: expanseMovementActive ? 'EXPANSE_ACTIVE' : 'COMMAND_HUB',
          hardWorldClampApplied: next.hardWorldClampApplied === true || next.clamped === true,
          collisionBlocked: resolvedNext.collisionBlocked === true,
          collisionZoneIds: resolvedNext.collisionZoneIds || freeze([])
        });
        playerAnchor.position.set(resolvedNext.x, expanseMovementActive ? 0.15 : 0, resolvedNext.z);
        desiredDirection = { x: directionVector.x, z: directionVector.z };
        const travelled = Math.hypot(Number(resolvedNext.x) - beforeX, Number(resolvedNext.z) - beforeZ);
        lastTravelledDistance = travelled;
        if (travelled > 0.000001) {
          movementFrameCount += 1;
          movementDistance += travelled;
          lastMovementAt = Date.now();
        }
      }
    }
    const activeAssetId = playerAsset?.entry?.id || 'eoncity-pathfinder-prime-11clips';
    const activeVariant = playerAsset?.variantName || 'primary';
    lastCharacterMotionSnapshot = locomotionTruth.update({
      position: playerAnchor.position,
      desiredDirection,
      deltaSeconds,
      activeAssetId,
      activeVariant,
      runRequested,
      panelOpen: manualPaused || inputLockManager.isMovementBlocked()
    });
    const nextMotion = lastCharacterMotionSnapshot.blocked ? 'idle' : lastCharacterMotionSnapshot.animationState;
    const locomotionAnimationSpeed = nextMotion === 'run'
      ? Math.max(EON_CITY_W761_CHARACTER_PROFILE.locomotion.runSpeedRange[0], Math.min(EON_CITY_W761_CHARACTER_PROFILE.locomotion.runSpeedRange[1], Number(lastCharacterMotionSnapshot.actualSpeed || 0) / 5.2))
      : nextMotion === 'walk'
        ? Math.max(EON_CITY_W761_CHARACTER_PROFILE.locomotion.walkSpeedRange[0], Math.min(EON_CITY_W761_CHARACTER_PROFILE.locomotion.walkSpeedRange[1], Number(lastCharacterMotionSnapshot.actualSpeed || 0) / 3.25))
        : 1;
    if (lastCharacterMotionSnapshot.moving || desiredDirection) playerAnchor.rotation.y = lastCharacterMotionSnapshot.visualHeading;
    if (nextMotion !== playerMotion) playerMotion = nextMotion;
    if (playerAnimationReadiness.source === 'authored-player' && playerAnimationReadiness.ready === true) {
      playerAsset?.animations?.play?.(nextMotion, { speedRatio: locomotionAnimationSpeed });
      playerAsset?.animations?.stabilize?.();
    } else if (nextMotion === 'walk' || nextMotion === 'run') {
      applyProceduralWalk(fallbackPlayer, Date.now() * 0.001, 5.2, nextMotion === 'run' ? 1.55 : 1);
    }
    if (cameraMode === 'follow') camera.setTarget(new Vector3(playerAnchor.position.x, EON_CITY_W747_CAMERA_POSES.follow.targetHeight, playerAnchor.position.z));
    else if (cameraMode === 'expanse-follow') camera.setTarget(new Vector3(playerAnchor.position.x, Math.max(1.35, playerAnchor.position.y + 1.2), playerAnchor.position.z));
  };

  // Rendering remains Babylon-owned. This shared fixed-step clock is only for
  // player simulation, so accepted input remains responsive if a browser
  // delays a visual callback. Render frames and the fallback consume the same
  // accumulator and cannot apply the elapsed time twice.
  const advanceMovementSimulation = (at = Date.now(), source = 'render') => {
    const clockAt = Number(at) || Date.now();
    const input = axis();
    if (!input.active || getMovementBlockReason()) {
      simulationAccumulatorSeconds = 0;
      lastSimulationClockAt = clockAt;
      return 0;
    }
    const elapsed = Math.min(0.12, Math.max(0, (clockAt - lastSimulationClockAt) / 1000));
    lastSimulationClockAt = clockAt;
    simulationAccumulatorSeconds = Math.min(0.12, simulationAccumulatorSeconds + elapsed);
    const stepSeconds = 1 / 60;
    let steps = 0;
    while (simulationAccumulatorSeconds >= stepSeconds && steps < 7) {
      updateMovement(stepSeconds);
      simulationAccumulatorSeconds -= stepSeconds;
      steps += 1;
    }
    if (!steps) { duplicateStepPreventedCount += 1; return 0; }
    simulationStepCount += steps;
    lastSimulationStepAt = clockAt;
    simulationSource = source;
    lastSimulationDeltaSeconds = stepSeconds;
    if (source === 'fallback') fallbackSimulationStepCount += steps;
    else if (source === 'release-settlement') releaseSettlementStepCount += steps;
    else renderSimulationStepCount += steps;
    return steps;
  };
  settleMovementBeforeSourceRelease = ({ source = 'external', reason = 'input-release', allowSettlement = true } = {}) => {
    const at = Date.now();
    const blockedReason = getMovementBlockReason();
    const input = axis();
    const unprocessedElapsedMs = Math.max(0, at - lastSimulationClockAt);
    const boundedElapsedMs = Math.min(180, unprocessedElapsedMs);
    if (!allowSettlement || !input.active || blockedReason || !boundedElapsedMs) {
      lastReleaseSettlement = freeze({ attempted: true, allowed: false, source: String(source), reason: String(reason), unprocessedElapsedMs, boundedElapsedMs: 0, fixedStepsApplied: 0, distanceApplied: 0, skippedReason: !allowSettlement ? 'forced-cleanup' : (blockedReason || (!input.active ? 'inactive-axis' : 'no-unprocessed-time')), at });
      return lastReleaseSettlement;
    }
    const before = freeze({ x: Number(playerAnchor.position.x || 0), z: Number(playerAnchor.position.z || 0) });
    // advanceMovementSimulation clamps real elapsed time to the same 120 ms
    // anti-teleport bound used by the fallback; no synthetic time is added.
    const steps = advanceMovementSimulation(at, 'release-settlement');
    const distanceApplied = Math.hypot(Number(playerAnchor.position.x || 0) - before.x, Number(playerAnchor.position.z || 0) - before.z);
    releaseSettlementDistance += distanceApplied;
    lastReleaseSettlement = freeze({ attempted: true, allowed: true, source: String(source), reason: String(reason), unprocessedElapsedMs, boundedElapsedMs: Math.min(120, boundedElapsedMs), fixedStepsApplied: steps, distanceApplied, skippedReason: '', at });
    return lastReleaseSettlement;
  };
  stopMovementSimulationFallback = () => {
    if (fallbackClockHandle !== null && fallbackClockHandle !== 'microtask') globalThis.clearTimeout?.(fallbackClockHandle);
    fallbackClockHandle = null;
    fallbackClockGeneration += 1;
  };
  const runMovementSimulationFallback = () => {
    fallbackClockHandle = null;
    if (destroyed || !axis().active || getMovementBlockReason()) return;
    fallbackClockTickCount += 1;
    if (Date.now() - lastMovementUpdateAt > 24) advanceMovementSimulation(Date.now(), 'fallback');
    if (!destroyed && axis().active && !getMovementBlockReason()) fallbackClockHandle = globalThis.setTimeout?.(runMovementSimulationFallback, 24) ?? null;
  };
  startMovementSimulationFallback = () => {
    if (fallbackClockHandle !== null || destroyed || !axis().active || getMovementBlockReason()) return;
    const generation = ++fallbackClockGeneration;
    // This runs after the accepted browser input event returns, never from the
    // event handler itself. It covers browsers that defer both RAF and timers
    // while a heavy import is monopolising visual scheduling.
    fallbackClockHandle = 'microtask';
    const firstTick = () => {
      if (generation !== fallbackClockGeneration || destroyed || !axis().active || getMovementBlockReason()) return;
      runMovementSimulationFallback();
    };
    if (typeof globalThis.queueMicrotask === 'function') globalThis.queueMicrotask(firstTick);
    else fallbackClockHandle = globalThis.setTimeout?.(firstTick, 0) ?? null;
  };

  const updateEonbot = (timeMs, deltaSeconds) => {
    const seconds = timeMs * 0.001;
    const companion = expanseCompanionState || syncExpanseCompanionState();
    if (companion?.expanseActive && companion.movementMode === 'dormant-rescue') {
      eonbotAnchor.setEnabled(companion.visible);
      if (!companion.visible) return;
      const rescueTarget = new Vector3(EON_EXPANSE_W767A_RESCUE_POSE.x, EON_EXPANSE_W767A_RESCUE_POSE.y + (reducedMotion ? 0 : Math.sin(seconds * 1.15) * 0.035), EON_EXPANSE_W767A_RESCUE_POSE.z);
      eonbotAnchor.position.copyFrom(Vector3.Lerp(eonbotAnchor.position, rescueTarget, Math.min(1, deltaSeconds * 3.4)));
      eonbotAnchor.rotation.y = EON_EXPANSE_W767A_RESCUE_POSE.heading;
      eonbotAnchor.rotation.x = companion.scanned ? 0 : 0.28;
      eonbotAnchor.rotation.z = companion.coreRecovered ? 0 : -0.18;
      eonbotScanHalo.setEnabled(companion.scanned || companion.coreRecovered);
      eonbotScanBeam.setEnabled(false);
      if (eonbotScanHalo.isEnabled?.()) {
        eonbotScanHalo.rotation.z += reducedMotion ? 0 : 0.025;
        eonbotScanHalo.scaling.setAll(0.78 + Math.sin(seconds * 2.8) * 0.08);
      }
      const rescueOrbit = seconds * 1.3;
      eonbotSparkA.position.set(Math.sin(rescueOrbit) * 0.48, 0.08, Math.cos(rescueOrbit) * 0.48);
      eonbotSparkB.position.set(Math.sin(-rescueOrbit * 0.72) * 0.36, -0.12, Math.cos(-rescueOrbit * 0.72) * 0.36);
      return;
    }
    eonbotAnchor.setEnabled(companion?.visible !== false);
    const moving = Boolean(lastCharacterMotionSnapshot?.moving || axis().active);
    heroPresentationSnapshot = heroPresentationDirector.update({
      deltaMs: deltaSeconds * 1000,
      moving,
      playerPosition: playerAnchor.position,
      companionPosition: eonbotAnchor.position,
      nearestStationId: nearestStation?.station?.id || activeStationId || '',
      reducedMotion
    });

    const heading = Number(playerAnchor.rotation.y || 0);
    const forward = new Vector3(Math.sin(heading), 0, Math.cos(heading));
    const right = new Vector3(Math.cos(heading), 0, -Math.sin(heading));
    const formationTarget = playerAnchor.position
      .add(right.scale(1.35))
      .subtract(forward.scale(0.48))
      .add(new Vector3(0, 1.08 + (reducedMotion ? 0 : Math.sin(seconds * 1.45) * 0.08), 0));
    let target = formationTarget.clone();
    let state = heroPresentationSnapshot.companionState;
    const publicTarget = heroPresentationSnapshot.target?.position || null;
    const epochNow = Date.now();
    const activeReaction = latestRewardReaction?.expiresAt > epochNow ? latestRewardReaction : latestNexusReaction?.expiresAt > epochNow ? latestNexusReaction : null;
    const guideLead = companion?.expanseActive && companion?.bonded && expanseGuideState?.active ? expanseGuideState.leadTarget : null;
    const transitActive = expanseTransitJourney.getState().status === 'active';
    if (companion?.expanseActive && companion?.bonded && !transitActive) refreshExpanseCompanionBehaviorCandidates(epochNow);
    expanseCompanionBehaviorState = expanseCompanionBehavior.update({
      expanseActive: companion?.expanseActive === true,
      bonded: companion?.bonded === true,
      transitActive,
      guideActive: Boolean(guideLead),
      moving,
      player: playerAnchor.position,
      companion: eonbotAnchor.position,
      candidates: expanseCompanionBehaviorCandidates,
      at: epochNow
    });
    const ambientBehavior = !guideLead && !activeReaction && expanseCompanionBehaviorState?.active && expanseCompanionBehaviorState?.target
      ? expanseCompanionBehaviorState
      : null;

    if (guideLead) {
      state = 'guide-route';
      target = new Vector3(Number(guideLead.x || 0), Number(guideLead.y || 1.25) + (reducedMotion ? 0 : Math.sin(seconds * 2.1) * 0.08), Number(guideLead.z || 0));
    } else if (activeReaction?.kind === 'mission-complete' || activeReaction?.kind === 'vault-reveal') {
      state = 'celebrate-mission';
      const celebrationAngle = seconds * 2.6;
      target = playerAnchor.position.add(new Vector3(Math.sin(celebrationAngle) * 1.55, 1.45 + Math.sin(seconds * 4.2) * 0.32, Math.cos(celebrationAngle) * 1.55));
    } else if (activeReaction?.kind === 'approval-waiting') {
      state = 'signal-approval';
      target = new Vector3(1.7 + Math.sin(seconds * 1.6) * 0.25, 1.55 + Math.sin(seconds * 3.2) * 0.18, 0.8);
    } else if (activeReaction?.kind === 'result-created') {
      state = 'result-arrival';
      target = new Vector3(-1.5 + Math.sin(seconds * 1.9) * 0.3, 1.62 + Math.cos(seconds * 3.1) * 0.18, 0.55);
    } else if (activeReaction?.kind === 'system-warning' || activeReaction?.kind === 'freshness-warning') {
      state = 'system-warning';
      target = new Vector3(0.1, 1.35 + Math.sin(seconds * 4.5) * 0.16, 1.7);
    } else if (ambientBehavior) {
      const presentationByMode = {
        'curious-hover': 'curious-hover',
        'inspect-nearby': 'inspect-terminal',
        'greet-npc': 'greet-host',
        'scan-discovery': 'circuit-scan',
        'dock-recharge': 'dock-check',
        'return-formation': 'return-formation'
      };
      state = presentationByMode[ambientBehavior.mode] || 'curious-hover';
      target = ambientBehavior.mode === 'return-formation'
        ? formationTarget.clone()
        : new Vector3(Number(ambientBehavior.target.x || 0), Number(ambientBehavior.target.y || 1.2), Number(ambientBehavior.target.z || 0));
    } else if (state === 'curious-hover') {
      target = playerAnchor.position.add(new Vector3(
        right.x * 1.05 + Math.sin(seconds * 0.82) * 0.55,
        1.18 + Math.sin(seconds * 1.7) * 0.16,
        right.z * 1.05 + Math.sin(seconds * 1.64) * 0.28
      ));
    } else if (publicTarget && ['scout-structure', 'inspect-terminal', 'greet-host', 'circuit-scan', 'dock-check'].includes(state)) {
      target = new Vector3(Number(publicTarget.x || 0), Number(publicTarget.y || 1.05), Number(publicTarget.z || 0));
      if (state === 'scout-structure') target.y += 0.35 + Math.sin(seconds * 1.2) * 0.12;
      if (state === 'inspect-terminal') target.y += 0.28 + Math.sin(seconds * 2.1) * 0.06;
      if (state === 'greet-host') {
        target.x += Math.sin(seconds * 0.9) * 0.24;
        target.y += 0.38 + Math.sin(seconds * 2.4) * 0.09;
        target.z += Math.cos(seconds * 0.9) * 0.24;
      }
      if (state === 'circuit-scan') target.y = 0.72 + Math.sin(seconds * 1.8) * 0.08;
      if (state === 'dock-check') target.y += 0.16 + Math.sin(seconds * 2.2) * 0.06;
    } else if (state === 'nexus-spiral' && publicTarget) {
      const orbitRadius = 1.55 + Math.sin(seconds * 0.55) * 0.22;
      const orbitAngle = seconds * 0.95;
      target = new Vector3(
        Number(publicTarget.x || 0) + Math.sin(orbitAngle) * orbitRadius,
        1.12 + Math.sin(seconds * 1.35) * 0.38,
        Number(publicTarget.z || 0) + Math.cos(orbitAngle) * orbitRadius
      );
    } else if (state === 'playful-loop') {
      const loopAngle = seconds * 2.15;
      const loopRadius = 1.05 + Math.sin(seconds * 0.72) * 0.18;
      target = playerAnchor.position
        .add(right.scale(0.85))
        .subtract(forward.scale(0.35))
        .add(new Vector3(
          Math.sin(loopAngle) * loopRadius,
          1.18 + Math.sin(loopAngle * 1.55) * 0.42,
          Math.cos(loopAngle) * loopRadius
        ));
    }

    if (!moving && nearestStation?.station?.id === 'eonbot-nexus' && livingNexus.ok) {
      const orbit = livingNexus.getCompanionOrbitTarget?.(seconds);
      if (orbit) target = new Vector3(Number(orbit.x), Number(orbit.y), Number(orbit.z));
    }

    const fromPlayer = target.subtract(playerAnchor.position);
    const horizontalDistance = Math.hypot(fromPlayer.x, fromPlayer.z);
    const maxScoutDistance = Number(heroPresentationSnapshot.maxScoutDistanceFromPlayer || EON_CITY_W761_CHARACTER_PROFILE.eonbot.maximumScoutDistance);
    if (horizontalDistance > maxScoutDistance) {
      const scale = maxScoutDistance / Math.max(0.001, horizontalDistance);
      target.x = playerAnchor.position.x + fromPlayer.x * scale;
      target.z = playerAnchor.position.z + fromPlayer.z * scale;
    }
    target.y = Math.max(0.68, Math.min(2.35, target.y));

    const safeTarget = resolveEonCityW754EonbotSafeTarget({
      playerPosition: playerAnchor.position,
      requestedTarget: target,
      cameraPosition: camera.position,
      maxDistance: Number(heroPresentationSnapshot.maxScoutDistanceFromPlayer || EON_CITY_W761_CHARACTER_PROFILE.eonbot.maximumScoutDistance)
    });
    target.set(safeTarget.target.x, safeTarget.target.y, safeTarget.target.z);

    const previous = eonbotAnchor.position.clone();
    const speed = state === 'formation-follow' ? 4.4
      : state === 'return-formation' ? 3.7
        : state === 'celebrate-mission' ? 4.1
          : ['signal-approval', 'result-arrival', 'system-warning'].includes(state) ? 3.25
            : state === 'inspect-terminal' || state === 'dock-check' ? 2.05
              : state === 'greet-host' ? 2.35
                : state === 'playful-loop' ? 3.15
                  : state === 'guide-route' ? 4.2
                    : 2.65;
    eonbotAnchor.position.copyFrom(Vector3.Lerp(previous, target, Math.min(1, deltaSeconds * speed)));
    const travel = eonbotAnchor.position.subtract(previous);
    if (Math.hypot(travel.x, travel.z) > 0.0005) {
      const desiredHeading = Math.atan2(travel.x, travel.z);
      const headingDelta = Math.atan2(Math.sin(desiredHeading - eonbotAnchor.rotation.y), Math.cos(desiredHeading - eonbotAnchor.rotation.y));
      eonbotAnchor.rotation.y += headingDelta * Math.min(1, deltaSeconds * 5.5);
    } else if (!reducedMotion) eonbotAnchor.rotation.y += 0.0035;
    const playfulTilt = (heroPresentationSnapshot.playfulTilt || ['curious-hover', 'greet-host'].includes(state)) && !reducedMotion;
    eonbotAnchor.rotation.x = playfulTilt ? Math.sin(seconds * 1.9) * 0.09 : 0;
    eonbotAnchor.rotation.z = playfulTilt ? Math.sin(seconds * 1.15 + 0.8) * 0.12 : 0;

    const ambientScan = Boolean(ambientBehavior && ['inspect-terminal', 'circuit-scan', 'dock-check'].includes(state));
    const scanActive = Boolean(heroPresentationSnapshot.scanEffect) || ambientScan || ['signal-approval', 'result-arrival', 'system-warning'].includes(state);
    const greetingActive = Boolean(heroPresentationSnapshot.greetingEffect) || state === 'celebrate-mission' || Boolean(ambientBehavior && state === 'greet-host');
    eonbotScanHalo.setEnabled(scanActive || greetingActive);
    eonbotScanBeam.setEnabled(scanActive && ['inspect-terminal', 'dock-check'].includes(state));
    if (scanActive || greetingActive) {
      eonbotScanHalo.rotation.z += reducedMotion ? 0 : greetingActive ? 0.025 : 0.045;
      eonbotScanHalo.scaling.setAll(greetingActive
        ? 0.72 + Math.sin(seconds * 3.1) * 0.08
        : 0.88 + Math.sin(seconds * 4.2) * 0.12);
      eonbotScanBeam.scaling.y = 0.82 + Math.sin(seconds * 3.6) * 0.12;
    }
    const sparkAngle = seconds * (state === 'nexus-spiral' ? 3.1 : state === 'playful-loop' ? 4.4 : 2.15);
    eonbotSparkA.position.set(Math.sin(sparkAngle) * 0.72, Math.sin(seconds * 1.7) * 0.14, Math.cos(sparkAngle) * 0.72);
    eonbotSparkB.position.set(Math.sin(-sparkAngle * 0.78) * 0.54, Math.cos(seconds * 1.35) * 0.18, Math.cos(-sparkAngle * 0.78) * 0.54);

    if (playerMotion === 'idle') {
      const nextPresentation = heroPresentationSnapshot.playerIdleState || 'idle';
      if (nextPresentation !== playerPresentationState) {
        const accepted = playerAsset?.animations?.playStationary?.(nextPresentation, { restart: true });
        playerPresentationState = accepted === false ? 'idle' : nextPresentation;
        if (accepted === false) playerAsset?.animations?.playStationary?.('idle', { restart: true });
      }
      if (playerAnimationReadiness.source !== 'authored-player') applyProceduralStationary({ npcGestureState: playerPresentationState }, fallbackPlayer, seconds, 5.2);
      if (playerAnimationReadiness.source === 'authored-player') playerAsset?.animations?.stabilize?.();
    } else playerPresentationState = '';
  };

  const getRuntimeIdentitySnapshot = () => freeze({
    schema: 'eon.city.babylon-runtime-identity.w766ir2-0.v1',
    documentId: String(runtimeIdentity?.documentId || '') || null,
    accessMountId: String(runtimeIdentity?.accessMountId || '') || null,
    mountReason: String(runtimeIdentity?.mountReason || '') || null,
    mountOwner: String(runtimeIdentity?.mountOwner || '') || null,
    mountCaller: String(runtimeIdentity?.mountCaller || '') || null,
    generation: Number(runtimeIdentity?.generation || productRoot.dataset.eonCityMountGeneration || 0),
    canvasId: getEonCityObjectIdentity(canvas, 'canvas'),
    engineId: getEonCityObjectIdentity(engine, 'engine'),
    sceneId: getEonCityObjectIdentity(scene, 'scene'),
    playerRootId: getEonCityObjectIdentity(playerAnchor, 'player-root'),
    cameraId: getEonCityObjectIdentity(camera, 'camera'),
    renderLoopId: getEonCityObjectIdentity(renderFrame, 'render-loop')
  });

  const getRuntimeSummary = () => freeze({
    schema: EON_CITY_CORE_RUNTIME_SCHEMA,
    runtimeIdentity: getRuntimeIdentitySnapshot(),
    owner: EON_CITY_W731_RUNTIME_OWNER_SCHEMA,
    launchModel: 'living-command-centre-exterior-map',
    player: freeze({
      x: Number(playerAnchor.position.x), y: 0, z: Number(playerAnchor.position.z), heading: Number(playerAnchor.rotation.y),
      motion: playerMotion, idlePresentation: playerPresentationState || 'locomotion', motionTruth: lastCharacterMotionSnapshot, animationReadiness: playerAnimationReadiness
    }),
    eonbot: freeze({
      x: Number(eonbotAnchor.position.x), y: Number(eonbotAnchor.position.y), z: Number(eonbotAnchor.position.z),
      docked: Math.hypot(eonbotAnchor.position.x - EON_CITY_W731_EONBOT_DOCK.x, eonbotAnchor.position.z - EON_CITY_W731_EONBOT_DOCK.z) < 0.8,
      presentation: heroPresentationSnapshot,
      expanseBehavior: expanseCompanionBehaviorState,
      reactionMode: latestRewardReaction?.expiresAt > Date.now() ? latestRewardReaction.kind : latestNexusReaction?.expiresAt > Date.now() ? latestNexusReaction.kind : null,
      schema: EON_CITY_W745_HERO_PRESENTATION_SCHEMA
    }),
    nearestStation: nearestStation ? freeze({ id: nearestStation.station.id, label: nearestStation.station.label, distance: nearestStation.distance }) : null,
    nearestDiscovery: nearestDiscovery ? freeze({ id: nearestDiscovery.discovery.id, label: nearestDiscovery.discovery.label, distance: nearestDiscovery.distance }) : null,
    activeStationId: activeStationId || null,
    stations: freeze(EON_CITY_W731_STATIONS.map((station) => freeze({ id: station.id, label: station.label }))),
    stationCount: EON_CITY_W731_STATIONS.length,
    discoveryCount: EON_CITY_W737_DISCOVERIES.length,
    missionCount: missionsProgression.getView?.()?.missionCount || 0,
    missions: missionsProgression.getView?.()?.missions || [],
    explorationMissionCount: EON_CITY_W737_MISSIONS.length,
    explorationMissions: buildEonCityW737MissionView(),
    outsideMapActive: true,
    visibleFrameGate: freeze({
      authoredEnvironmentRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreAssetCount,
      authoredEnvironmentReady: visibleFrameState.authoredEnvironmentReady,
      authoredHeroCharactersRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.requiredCoreCharacterCount,
      authoredHeroCharactersReady: visibleFrameState.authoredHeroCharactersReady,
      heroFallbacksReady: true,
      gateComplete: visibleFrameState.gateComplete,
      degraded: visibleFrameState.degraded,
      hardTimeoutMs: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.hardTimeoutMs
    }),
    assetTransferEvidence: freeze({
      reason: assetTransferObservationReason,
      sessionProfile: assetTransferObservation?.sessionProfile || 'not-observed',
      observedAssetCount: Number(assetTransferObservation?.observedAssetCount || 0),
      networkTransferAssetCount: Number(assetTransferObservation?.networkTransferAssetCount || 0),
      localReuseOnlyAssetCount: Number(assetTransferObservation?.localReuseOnlyAssetCount || 0),
      totalTransferBytes: Number(assetTransferObservation?.totalTransferBytes || 0),
      cachedBeforeSessionAssetCount: Number(assetTransferObservation?.cachedBeforeSessionAssetCount || 0),
      localOnly: true
    }),
    stationCompletion: freeze({
      schema: EON_CITY_W744_STATION_COMPLETION_SCHEMA,
      blueprintCount: EON_CITY_W744_STATION_BLUEPRINTS.length,
      interactionTriads: EON_CITY_W744_STATION_BLUEPRINTS.every((entry) => ['structure', 'terminal', 'npc'].every((part) => entry.interactions.includes(part))),
      authoredStructuresReady: [...stationState.values()].filter((record) => isEonCityW759PresentationReady(record.loadedWorld)).length,
      authoredTerminalsReady: [...stationState.values()].filter((record) => isEonCityW759PresentationReady(record.loadedTerminal)).length,
      authoredNpcReady: [...stationState.values()].filter((record) => isEonCityW759PresentationReady(record.loadedNpc)).length,
      commandStatusCharacter: stationState.get('command-console')?.blueprint?.npcAlias || null,
      rejectedArchitectActive: false
    }),
    characterMotion: freeze({
      playerLocomotion: true,
      playerNonStaticIdle: heroPresentationTruth.nonStaticPlayerIdle,
      playerIdleModes: heroPresentationTruth.playerIdleModes,
      eonbotCuriousFollow: true,
      eonbotPublicScouting: heroPresentationTruth.boundedPublicScouting,
      eonbotStationHostGreetings: true,
      eonbotPlayfulLoops: true,
      eonbotVisualDockVisits: heroPresentationTruth.visualDockVisitOnly,
      eonbotCompanionModes: heroPresentationTruth.companionModes,
      eonbotAutomaticStationActivation: false,
      eonbotAutonomousAgent: false,
      stationNpcLocomotionAllowed: true,
      stationNpcBoundedMicroRoutes: true,
      stationNpcWalkingInPlace: false,
      stationNpcGestureAnimation: true,
      stationNpcMovingNow: [...stationState.values()].filter((record) => record.npcRoute?.moving).length,
      exteriorAmbientLocomotion: true,
      exteriorAmbientCitizenSlots: world.ambientCitizens?.length || 0,
      rt92EnvironmentalLife: world.rt92EnvironmentalLife?.getSummary?.() || null,
      rt92CinematicVfx: world.rt92CinematicVfx?.getSummary?.() || null,
      exteriorAmbientCitizenCount: (world.ambientCitizens || []).filter((citizen) => isEonCityW759PresentationReady(citizen.loaded)).length,
      proceduralExteriorAmbientCitizenVisible: false,
      maintenanceWorkerBoundedRoute: true,
      maintenanceWorkerVisible: isEonCityW759PresentationReady(world.ambientActors?.maintenance?.loaded)
    }),
    commandCentreDesign: freeze({
      microchipCircuitFloor: true,
      circuitNodeCount: world.circuitNodeCount || 0,
      animatedCircuitPulseCount: world.circuitPulses?.length || 0,
      boundedPointLights: world.commandLights?.length || 0,
      l95PerformanceBudget: performanceBudget,
      staticPresentationFrozenMeshes: staticPresentationFreeze.frozenCount || 0,
      stationBeacons: EON_CITY_W744_STATION_BLUEPRINTS.reduce((total, entry) => total + Number(entry.lighting.beacons || 0), 0),
      transportCapsuleAmbient: Boolean(world.ambientActors?.transit),
      maintenanceWorkerAmbient: Boolean(world.ambientActors?.maintenance),
      authoredStreetLampInstances: isEonCityW759PresentationReady(world.exteriorMap?.authoredStreetLamp)
        ? 1 + Number(world.exteriorMap?.authoredStreetLampClones?.length || 0)
        : 0,
      allReadyWorldAssetsAssigned: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.allReadyWorldAssetsAssigned === true,
      atmosphericDepth: scene.fogMode === Scene.FOGMODE_EXP2,
      themeAwareExposure: Number(scene.imageProcessingConfiguration?.exposure || 1)
    }),
    nexus3d: freeze({
      schema: EON_CITY_W749_LIVING_NEXUS_SCHEMA,
      livingHero: Boolean(livingNexus.ok),
      centralGenesisCore: true,
      authoredCoreReady: isEonCityW759PresentationReady(stationState.get('eonbot-nexus')?.loadedWorld),
      state: livingNexus.getView?.()?.state || 'unavailable',
      freshness: livingNexus.getView?.()?.freshness || null,
      ringCount: livingNexus.getView?.()?.rings?.length || 0,
      selectedRingId: livingNexus.getSelectedRing?.() || livingNexus.getView?.()?.selectedRingId || '',
      workObject: livingNexus.getView?.()?.workObject || freeze({ present: false }),
      privacy: livingNexus.getView?.()?.privacy || null,
      ownsProductState: false,
      oneProjectionEvent: true,
      dockSurface: 'nexus',
      terminal: true,
      commandSeat: true,
      eonbotDock: true,
      interactionParts: freeze(['structure', 'terminal', 'npc', 'nexus-ring', 'command-wall'])
    }),
    stationMonitors: freeze({
      schema: EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
      validation: stationMonitorValidation,
      count: stationMonitors.size + (commandCentre.ok ? 1 : 0),
      individualCount: stationMonitors.size,
      commandStatusWallCount: commandCentre.getView?.()?.walls?.length || 0,
      stations: freeze([...stationMonitors.values()].map((monitor) => monitor.getSummary?.()).filter(Boolean))
    }),
    commandCentre: freeze({
      schema: EON_CITY_W750_COMMAND_CENTRE_SCHEMA,
      liveWalls: Boolean(commandCentre.ok),
      wallCount: commandCentre.getView?.()?.walls?.length || 0,
      selectedWallId: commandCentre.getSelectedWall?.() || commandCentre.getView?.()?.selectedWallId || '',
      agentTheatreReceipts: commandCentre.getView?.()?.walls?.find?.((entry) => entry.id === 'agent-theatre')?.jobs?.length || 0,
      truthfulStatusValidation: validateEonCityTruthfulCommandCenterSnapshot(commandStatusController.getSnapshot()),
      genuineTheatreValidation: validateEonCityGenuineAgentTheatreSnapshot(agentTheatreController.getSnapshot()),
      commandCentreValidation: validateEonCityW750CommandCentreContract(),
      presentation: commandCentre.getPresentationSummary?.() || null,
      fakeWorkers: false,
      inventedProgress: false,
      automaticExecution: false,
      dockSurface: 'command-centre'
    }),
    productiveStations: freeze({
      schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
      stationCount: productiveStations.getView?.()?.stationCount || 0,
      reviewedCount: productiveStations.getView?.()?.reviewedCount || 0,
      verifiedCount: productiveStations.getView?.()?.verifiedCount || 0,
      validation: validateEonCityW751ProductiveStations(productiveStations.getView?.()),
      ownsProductState: false,
      ownsReceiptAuthority: false,
      automaticExecution: false,
      rewardIssued: false
    }),
    missionsProgression: freeze({
      schema: EON_CITY_W752_SCHEMA,
      missionCount: missionsProgression.getView?.()?.missionCount || 0,
      claimedCount: missionsProgression.getView?.()?.claimedCount || 0,
      claimableCount: missionsProgression.getView?.()?.claimableCount || 0,
      xp: missionsProgression.getView?.()?.xp || 0,
      pendingReveals: missionsProgression.getView?.()?.pendingReveals || 0,
      validation: validateEonCityW752MissionsProgression(missionsProgression.getView?.()),
      deterministicCosmeticsOnly: true,
      lootBox: false,
      paidRandomReward: false,
      streakPunishment: false,
      publicPostingRequired: false
    }),
    castNpcTransit: freeze({
      schema: EON_CITY_W754_SCHEMA,
      validation: castTransitValidation,
      cast: w754CastPlan,
      schedules: w754NpcSchedulePlan,
      transit: w754TransitController.getSnapshot(),
      capsuleId: EON_CITY_W754_CAPSULE_ID,
      capsuleForwardAxis: EON_CITY_W754_CAPSULE_FORWARD_AXIS,
      uniqueCapsuleCount: 1,
      boardSkipExplicit: true,
      automaticTravel: false,
      sourcePresenceIsNotVisualCertification: true
    }),
    spatialFoundation: freeze({
      schema: EON_CITY_W747_SPATIAL_SCHEMA,
      validation: validateEonCityW747SpatialFoundation(),
      heroZone: EON_CITY_W747_HERO_ZONE,
      wingCount: EON_CITY_W747_FIVE_WING_ANCHORS.length,
      camera: captureCameraPose(),
      diagnosticsVisible: spatialDiagnosticsVisible,
      loadedBounds: spatialDiagnostics.getReport(),
      centralOrientationShellRetired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.centralOrientationShellRetired === true
    }),
    accessibleEmptyAreas: 0,
    futureGatewaysClosed: EON_CITY_W731_FUTURE_GATEWAYS.length,
    oneEngine: true,
    oneScene: true,
    oneRenderLoop: true,
    oldDistrictBeltsActive: false,
    retiredLivingNexusBridgeActive: false,
    expanseVisibleFromOverlook: true,
    expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE',
    activeWorldRegionId: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' ? String(expanseActiveRegionId || 'signal-frontier') : 'command-hub',
    worldMode: expanseWorldMode.getState(),
    workSurfaceOpen,
    inputLocks: inputLockManager.getSnapshot(),
    movementPaused: manualPaused || inputLockManager.isMovementBlocked(),
    movementBlockReason: getMovementBlockReason() || null,
    workspace: freeze({
      schema: workspacePresenter.schema,
      defaultPresentation: 'dock',
      presentationMode: workspacePresentationMode,
      state: workspacePresenter.getState(),
      exactWorldRestore: true,
      routeChangeOnOpen: false,
      interactionRegistry: interactionRegistry.getSummary(),
      interactionValidation: validateEonCityW748InteractionRegistry(),
      presenterValidation: validateEonCityW748WorkspacePresenterContract(),
      livingNexusValidation: validateEonCityW749LivingNexusContract()
    }),
    quality: resolvedQuality,
    reducedMotion: Boolean(reducedMotion),
    fps: measuredFps,
    averageFrameMs: lastFpsSample.frames > 0
      ? Math.round((lastFpsSample.sampleMs / lastFpsSample.frames) * 100) / 100
      : null,
    runtimeProvenance: EON_CITY_W757_RUNTIME_PROVENANCE,
    arrivalCamera: arrivalCameraValidation,
    lifecycle: freeze({
      documentHidden,
      contextLost,
      contextLossCount,
      contextRestoreCount,
      performanceProtectionLevel,
      lastPerformanceProtectionReason,
      lastPerformanceRecoveryReason,
      lastPerformanceRecoveryAt,
      hardwareScalingLevel: currentHardwareScalingLevel,
      baselineHardwareScalingLevel,
      maxHardwareScalingLevel,
      engineFps: Math.round(engine.getFps?.() || 0),
      lastFpsSample,
      fpsTimeline: freeze([...fpsTimeline]),
      cameraSafetyRecoveryCount,
      lastCameraSafetyRecovery,
      cameraFloorSafety: inspectCameraFloorSafety(),
      cameraInputPolicy: freeze({ ...rt96CameraPolicy, applied: rt96CameraPolicyReceipt.ok === true })
    }),
    worldPerformance: worldPerformanceLedger.getSnapshot(),
    assets: localAssetRuntime?.getSummary?.() || freeze({ resident: 0, inflight: 0, proceduralFallback: true }),
    environment: freeze({ schema: EON_CITY_W755_SCHEMA, plan: environmentController.getPlan(), validation: environmentValidation, audio: environmentController.getSnapshot().audio }),
    experience: freeze({ schema: EON_CITY_W756_SCHEMA, plan: w756ExperiencePlan, validation: w756ExperienceValidation, semanticNavigation: semanticNavigationController?.getSummary?.() || null }),
    reliability: freeze({ schema: EON_CITY_W757_SCHEMA, plan: w757ReliabilityPlan, validation: w757ReliabilityValidation, snapshot: reliabilityController.getSnapshot() }),
    destroyed
  });

  const renderFrame = () => {
    if (destroyed) return;
    const frameAt = now();
    renderLoopFrames += 1;
    lastRenderAt = Date.now();
    movementRenderRecovery?.noteRenderCallback(lastRenderAt);
    if (frameAt - lastOrphanedInputReconcileAt >= performanceBudget.housekeeping.orphanInputReconcileIntervalMs) {
      reconcileOrphanedInputLocks();
      lastOrphanedInputReconcileAt = frameAt;
    }
    const activeInputLockOwners = inputLockManager.getSnapshot().activeOwnerIds;
    // Only a genuine dock/work-surface presentation is intentionally capped.
    // Lightweight Menu, Map, Transit, Relay and Expanse review overlays must
    // keep the live 3D world at its normal frame rate and must never manufacture
    // a false sustained-11-fps performance-protection event.
    const backgroundPresentation = workSurfaceOpen || activeInputLockOwners.includes('work-surface');
    // The first scene render is a boot proof, not background presentation. A
    // hidden-at-mount document must not convert a successfully-created engine
    // into a permanent Stage-5 stall before it has produced that proof.
    const bootFramePending = !firstFrame;
    if (!reliabilityController.shouldRenderFrame({ at: frameAt, background: backgroundPresentation, hidden: documentHidden && !bootFramePending, contextLost })) {
      lastReliabilityRenderDecision = 'skipped-reliability';
      return;
    }
    lastReliabilityRenderDecision = 'rendered';
    movementRenderRecovery?.noteReliabilityRenderAccepted(Date.now());
    const frameDurationMs = Math.max(0, frameAt - lastFrameAt);
    const deltaSeconds = Math.min(0.05, Math.max(0.001, frameDurationMs / 1000));
    const timeMs = frameAt;
    const seconds = timeMs / 1000;
    lastFrameAt = frameAt;
    if (!backgroundPresentation) reliabilityController.recordFrame(frameDurationMs);
    if (!manualPaused && !inputLockManager.isMovementBlocked()) {
      advanceMovementSimulation(Date.now(), 'render');
      updateEonbot(frameAt, deltaSeconds);
      const expanseActiveForFrame = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
      // L95: Command Hub animation/weather/monitor owners are completely hidden
      // while an Open World owns presentation. Do not keep paying their update
      // cost behind Signal/My Frontier/Storm; decoded meshes remain resident for
      // instant return and no selected visual quality is changed.
      if (!expanseActiveForFrame) {
        updateAnimatedWorld(frameAt);
        const weather = world.environment?.weather;
        const rainInterval = performanceBudget.ambience.rainAnimationIntervalMs;
        if (rainInterval > 0 && weather?.rainRoot?.isEnabled?.() && !reducedMotion && frameAt - lastRainAnimationAt >= rainInterval) {
          const rainDeltaSeconds = Math.min(0.1, Math.max(0.001, (frameAt - Math.max(0, lastRainAnimationAt)) / 1000));
          lastRainAnimationAt = frameAt;
          for (let index = 0; index < weather.rainDrops.length; index += 1) {
            const drop = weather.rainDrops[index];
            drop.position.y -= rainDeltaSeconds * (7 + index % 5);
            if (drop.position.y < 0.6) drop.position.y = 8 + (index % 7);
          }
        }
        const hubHeroAnimationInterval = performanceBudget.ambience.hubHeroAnimationIntervalMs;
        if (hubHeroAnimationInterval > 0 && frameAt - lastHubHeroAnimationAt >= hubHeroAnimationInterval) {
          lastHubHeroAnimationAt = frameAt;
          livingNexus.update?.(frameAt);
          commandCentre.update?.(frameAt);
        }
        const stationMonitorInterval = performanceBudget.ambience.stationMonitorCheckIntervalMs;
        if (stationMonitorInterval > 0 && frameAt - lastStationMonitorCheckAt >= stationMonitorInterval) {
          lastStationMonitorCheckAt = frameAt;
          for (const monitor of stationMonitors.values()) monitor.update?.(frameAt, camera.position);
        }
      }
      if (signalVanguardCosmeticRoot?.isEnabled?.()) {
        signalVanguardCosmeticRing.rotation.z = seconds * 0.7;
        const orbit = seconds * 1.35;
        signalVanguardCosmeticOrbitA.position.set(Math.sin(orbit) * 0.82, 1.35 + Math.sin(seconds * 2.1) * 0.08, Math.cos(orbit) * 0.82);
        signalVanguardCosmeticOrbitB.position.set(Math.sin(orbit + Math.PI) * 0.68, 1.78 + Math.cos(seconds * 1.8) * 0.07, Math.cos(orbit + Math.PI) * 0.68);
      }
      if (expanseActiveForFrame) {
        const stormJourneyUpdate = expanseStormSectorJourney.update(timeMs);
        if (stormJourneyUpdate.completed && stormJourneyUpdate.transition) {
          const transition = stormJourneyUpdate.transition;
          if (transition.type === 'enter-storm-sector') {
            expanseMyFrontierRenderer?.deactivate?.();
            expanseGateway?.deactivate?.();
            expanseVisuals.deactivate?.();
            expanseAudio.suspend?.('storm-sector-entry');
            expanseActiveRegionId = 'storm-sector';
            setCurrentWorld('storm-sector', { reason: 'storm-sector-transition-complete' });
            ensureStormSectorPresenters();
            const activation = getStormSectorPresenterActivation();
            const applied = expanseStormSectorPresenter?.apply?.({ activation, quality: resolvedQuality, playerPosition: transition.position }) || freeze({ ok: false, reason: 'storm-sector-presenter-unavailable' });
            if (applied.ok && applied.active) {
              stormEntryAwaitingFirstFrame = true;
              updateStormEntryConfirmation({ status: 'scene-prepared', preparedRegionId: 'storm-sector', confirmedRegionId: '', actualActivationId: transition.activationId || '', firstPlayableFrame: false, failureReason: '' });
              beginObservedWorldPerformanceSession('storm-sector', 'storm-sector-transition-complete');
              expanseStormSectorInteractions?.apply?.({ regionActive: true, state: expanseStormSectorMissions.getState(), expectedActivationId: transition.activationId, expectedPackageDigest: transition.packageDigest });
              expanseStormSectorNpcs?.apply?.({ regionActive: true, expectedActivationId: transition.activationId, expectedPackageDigest: transition.packageDigest });
              expanseStormSectorTransitPresenter?.apply?.({ regionActive: true, missionState: expanseStormSectorMissions.getState(), expectedActivationId: transition.activationId, expectedPackageDigest: transition.packageDigest, journeyState: expanseStormSectorTransit.getState(), currentPosition: transition.position });
              expanseStormSectorTransformations?.apply?.({ regionActive: true, missionState: expanseStormSectorMissions.getState(), expectedActivationId: transition.activationId, expectedPackageDigest: transition.packageDigest });
              playerAnchor.position.set(transition.position.x, transition.position.y, transition.position.z);
              camera.setTarget(new Vector3(transition.position.x, transition.position.y + 1.1, transition.position.z));
              expanseUiOverlay.showArrival?.({ title: 'STORM SECTOR', network: 'Atmospheric world online', detail: 'Follow the highlighted objective → E / tap Use at the field target · EONBOT remains one tap away' });
              onStatus?.('Storm Sector scene prepared. Confirming the first playable frame in the canonical scene…');
            } else {
              stormEntryAwaitingFirstFrame = false;
              updateStormEntryConfirmation({ status: 'failed', preparedRegionId: '', confirmedRegionId: '', firstPlayableFrame: false, failureReason: applied.reason || 'storm-sector-presenter-unavailable' });
              expanseActiveRegionId = 'signal-frontier';
              setCurrentWorld('signal-frontier', { reason: 'storm-sector-transition-failed' });
              expanseGateway?.activate?.();
              expanseVisuals.activate?.(expansePresentation);
              expanseAudio.start?.({ explicitUserAction: true });
              expanseAudio.applyPresentation?.(expansePresentation);
              expanseStormSectorJourney.reset({ explicitUserAction: true });
              onStatus?.(`Storm Sector presentation failed safely: ${String(applied.reason || 'authored region unavailable').replaceAll('-', ' ')}.`);
            }
            expanseStormSectorJourney.consumeTransition();
            syncExpanseCompanionState();
          } else if (transition.type === 'return-signal-frontier') {
            expanseStormSectorInteractions?.apply?.({ regionActive: false });
            expanseStormSectorNpcs?.apply?.({ regionActive: false });
            expanseStormSectorTransit.cancel({ explicitUserAction: true, reason: 'return-signal-frontier' });
            expanseStormSectorTransitPresenter?.apply?.({ regionActive: false });
            expanseStormSectorTransformations?.apply?.({ regionActive: false });
            expanseStormSectorCapture.reset('return-signal-frontier');
            expanseStormSectorPresenter?.suspend?.();
            expanseActiveRegionId = 'signal-frontier';
            setCurrentWorld('signal-frontier', { reason: 'storm-return-signal-frontier' });
            const restored = expanseGateway?.activate?.() || freeze({ ok: false, reason: 'signal-frontier-gateway-unavailable' });
            if (restored.ok) {
              beginObservedWorldPerformanceSession('signal-frontier', 'storm-return-signal-frontier');
              expanseVisuals.activate?.(expansePresentation);
              expanseAudio.start?.({ explicitUserAction: true });
              expanseAudio.applyPresentation?.(expansePresentation);
              playerAnchor.position.set(transition.position.x, transition.position.y, transition.position.z);
              camera.setTarget(new Vector3(transition.position.x, transition.position.y + 1.1, transition.position.z));
              onStatus?.('Returned to Signal Frontier. Storm Sector progress remains saved.');
            }
            expanseStormSectorJourney.consumeTransition();
            syncExpanseCompanionState();
          }
        }
        if (expanseActiveRegionId === 'storm-sector') {
          expanseStormSectorPresenter?.apply?.({ activation: getStormSectorPresenterActivation(), quality: resolvedQuality, playerPosition: playerAnchor.position });
          const stormTransitState = expanseStormSectorTransit.update(timeMs);
          if (stormTransitState.status === 'active' && stormTransitState.pose) {
            playerAnchor.position.set(stormTransitState.pose.x, stormTransitState.pose.y, stormTransitState.pose.z);
            camera.setTarget(new Vector3(stormTransitState.pose.x, stormTransitState.pose.y + 1.1, stormTransitState.pose.z));
            if (expanseCompanionState.bonded) {
              eonbotAnchor.setEnabled(true);
              eonbotAnchor.position.set(stormTransitState.pose.x + 1.15, stormTransitState.pose.y + 1.05 + Math.sin(seconds * 3.2) * 0.07, stormTransitState.pose.z + 1.15);
            }
          } else if (stormTransitState.status === 'complete' && stormTransitState.transition) {
            const completedTransit = expanseStormSectorTransit.consumeTransition();
            if (completedTransit?.position) {
              playerAnchor.position.set(completedTransit.position.x, completedTransit.position.y, completedTransit.position.z);
              camera.setTarget(new Vector3(completedTransit.position.x, completedTransit.position.y + 1.1, completedTransit.position.z));
              onStatus?.(`Regional Transit arrived at ${String(completedTransit.destinationNodeId || 'destination').replaceAll('-', ' ')}.`);
              onTelemetry?.(freeze({ type: 'w797c-storm-sector-transit-complete', transition: completedTransit, grantsXp: false, automaticTravel: false, oneCanonicalScene: true }));
            }
          }
          expanseStormSectorPresenter?.update?.(seconds);
          expanseStormSectorInteractions?.update?.(seconds);
          expanseStormSectorNpcs?.update?.(deltaSeconds, playerAnchor.position);
          const runtimeStormActivation = getStormSectorRuntimeActivation();
          expanseStormSectorTransitPresenter?.apply?.({ regionActive: true, missionState: expanseStormSectorMissions.getState(), expectedActivationId: runtimeStormActivation?.activationId || '', expectedPackageDigest: runtimeStormActivation?.packageDigest || '', journeyState: expanseStormSectorTransit.getState(), currentPosition: playerAnchor.position });
          expanseStormSectorTransitPresenter?.update?.(seconds, expanseStormSectorTransit.getState());
          expanseStormSectorTransformations?.update?.(seconds);
        }
        const transitJourneyState = expanseActiveRegionId === 'signal-frontier' ? expanseTransitJourney.update(timeMs) : freeze({ status: 'idle' });
        if (transitJourneyState.status === 'active' && transitJourneyState.pose) {
          playerAnchor.position.set(transitJourneyState.pose.x, transitJourneyState.pose.y, transitJourneyState.pose.z);
          expanseTransitPresenter.update(transitJourneyState, seconds);
          syncExpanseCompanionState();
          if (expanseCompanionState.bonded) {
            const travelX = Number(transitJourneyState.to?.x || 0) - Number(transitJourneyState.from?.x || 0);
            const travelZ = Number(transitJourneyState.to?.z || 0) - Number(transitJourneyState.from?.z || 0);
            const travelLength = Math.max(0.001, Math.hypot(travelX, travelZ));
            const rightX = travelZ / travelLength;
            const rightZ = -travelX / travelLength;
            eonbotAnchor.setEnabled(true);
            eonbotAnchor.position.set(transitJourneyState.pose.x + rightX * 1.25, transitJourneyState.pose.y + 1.05 + Math.sin(seconds * 3.2) * 0.08, transitJourneyState.pose.z + rightZ * 1.25);
            eonbotAnchor.rotation.y = Math.atan2(travelX, travelZ);
          }
          camera.setTarget(new Vector3(transitJourneyState.pose.x, transitJourneyState.pose.y + 1.1, transitJourneyState.pose.z));
        } else if (transitJourneyState.status === 'complete' && expanseTransitDestination) {
          const node = expanseTransitDestination;
          playerAnchor.position.set(node.x, 0.15, node.z);
          expanseState = freeze({ ...expanseState, currentZone: node.id, safePosition: freeze({ x: node.x, y: 0.15, z: node.z }), lastTransitNode: node.id, updatedAt: Date.now() });
          expansePersistence.write(expanseState);
          expanseMissionRuntime.recordSignal(`zone:${node.id}`, { receiptId: `transit-zone-entry:${node.id}` });
          expanseLivingContent.recordWorldInteraction('transit-calibration-completed', { journeyReceipt: { id: `transit-journey:${transitJourneyState.startedAt}:${node.id}`, status: 'completed' } }, { explicitUserAction: true });
          expanseTransitJourney.finish(); expanseTransitDestination = null;
          restoreExpanseTransitPresentation();
          syncExpanseCompanionState();
          showExpanseZoneArrival(node.id);
          onStatus?.(`Regional Transit arrived at ${node.label}.`);
        } else if (transitJourneyState.status === 'idle') {
          expanseTransitPresenter.hide?.();
        }
        const signalFrontierActiveForFrame = expanseActiveRegionId === 'signal-frontier';
        if (signalFrontierActiveForFrame) {
          // Signal movement and animation remain frame-rate, but mission/restoration
          // projection is state work. Rebuild/apply it at the established 10 Hz
          // guidance cadence instead of allocating and traversing mission state on
          // every rendered frame.
          if (!expanseGuidance || timeMs - lastSignalProjectionAt >= 100) {
            expanseGuidance = buildCurrentExpanseGuidance();
            expansePresentation = projectEonExpanseW766GRestoration({ milestones: [...(expanseState.worldMilestones || []), ...(expanseMissionRuntime.getState().worldMilestones || [])], currentZone: expanseState.currentZone, quality: resolvedQuality, mobile: coarsePointer, reducedMotion });
            expanseAudio.applyPresentation(expansePresentation);
            expanseVisuals.apply(expansePresentation);
            lastSignalProjectionAt = timeMs;
          }
          expanseGuideState = expanseGuideController.update(expanseGuidance, playerAnchor.position, timeMs);
          expanseVisuals.update(seconds, playerAnchor.position);
          if (!activeExpanseEvent || timeMs - lastExpanseEventResolveAt >= 5000) {
            activeExpanseEvent = expanseLivingContent.resolveEvent({ at: Date.now() });
            lastExpanseEventResolveAt = timeMs;
          }
          expanseVisuals.applyDynamicEvent?.(activeExpanseEvent, { eventActive: Boolean(activeExpanseEvent) });
          expanseGateway?.updateDynamicEvent?.(activeExpanseEvent, seconds);
          expanseObjectiveMarker.update(expanseGuidance, seconds, playerAnchor.position, expanseGuideState);
        } else {
          // Signal restoration presenters remain suspended outside Signal, but
          // the existing canonical objective-marker presenter may visualize an
          // RT91 physical target in Storm/My Frontier without owning another loop.
          const rt91Guidance = expanseGuidance?.rt91 === true ? expanseGuidance : buildCurrentExpanseGuidance();
          expanseGuidance = rt91Guidance;
          expanseObjectiveMarker.update(rt91Guidance?.rt91 === true ? rt91Guidance : null, seconds, playerAnchor.position, rt91Guidance?.rt91 === true ? freeze({ active: true }) : null);
        }
        if (expanseActiveRegionId === 'my-frontier') expanseMyFrontierRenderer?.update?.(timeMs, playerAnchor.position);
        // Signal objective guidance stays at the established 10 Hz cadence.
        // My Frontier / Storm boards are substantially heavier and do not need
        // 10 DOM/projection rebuilds per second while movement remains frame-rate.
        const expanseUiSyncIntervalMs = expanseActiveRegionId === 'signal-frontier' ? 100 : 220;
        if (timeMs - lastExpanseUiSyncAt >= expanseUiSyncIntervalMs) {
          updateExpanseWorldLabels();
          syncExpanseUi();
          lastExpanseUiSyncAt = timeMs;
        }
        const expanseUpdate = signalFrontierActiveForFrame ? expanseGateway?.update?.(playerAnchor.position) : freeze({ currentZone: '' });
        if (expanseUpdate?.currentZone && timeMs - lastExpanseZoneSignalAt >= 500) {
          expanseMissionRuntime.recordSignal(`zone:${expanseUpdate.currentZone}`, { receiptId: `zone-entry:${expanseUpdate.currentZone}` });
          lastExpanseZoneSignalAt = timeMs;
        }
        if (expanseUpdate?.currentZone && expanseUpdate.currentZone !== expanseState.currentZone) {
          expanseState = freeze({ ...expanseState, currentZone: expanseUpdate.currentZone, discovered: freeze([...new Set([...(expanseState.discovered || []), ...(expanseUpdate.discovered || [])])]), updatedAt: Date.now() });
          expansePersistence.write(expanseState);
          expanseMissionRuntime.recordSignal(`zone:${expanseUpdate.currentZone}`, { receiptId: `zone-entry:${expanseUpdate.currentZone}` });
          showExpanseZoneArrival(expanseUpdate.currentZone);
        }
      }
    }
    const expanseActive = expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE';
    nearestStation = expanseActive ? null : resolveEonCityW731NearestStation(playerAnchor.position, 5.2);
    nearestDiscovery = expanseActive ? null : resolveEonCityW737NearestDiscovery(playerAnchor.position, 5.2);
    const stationDistance = Number(nearestStation?.distance ?? Number.POSITIVE_INFINITY);
    const discoveryDistance = Number(nearestDiscovery?.distance ?? Number.POSITIVE_INFINITY);
    const nearestTarget = stationDistance <= discoveryDistance ? nearestStation : nearestDiscovery;
    // Explicitly opening the review from City Menu or the accessible map is a
    // valid remote review path. Do not cancel it merely because the avatar is
    // not already standing at the physical gate. The named input lease keeps
    // the avatar stationary until Enter or Cancel, while orphan recovery above
    // handles genuinely missing/hidden dialogs without trapping movement.
    const nearestId = nearestTarget?.station?.id || nearestTarget?.discovery?.id || '';
    if (nearestId !== lastNearestId) {
      lastNearestId = nearestId;
      ui.setPrompt(nearestTarget);
      setContextualSelection(nearestTarget);
      if (nearestTarget?.station) {
        activeStationId = nearestTarget.station.id;
        onStatus?.(`Near ${nearestTarget.station.label}. Press E or choose ${nearestTarget.station.npc.action}.`);
        onLandmarkChange?.(freeze({ id: nearestTarget.station.id, label: nearestTarget.station.label, districtId: nearestTarget.station.zone || 'command-centre' }));
      } else if (nearestTarget?.discovery) {
        onStatus?.(`Near ${nearestTarget.discovery.label}. Press E or choose ${nearestTarget.discovery.npc.action}.`);
        onLandmarkChange?.(freeze({ id: nearestTarget.discovery.id, label: nearestTarget.discovery.label, districtId: 'command-horizon', discovery: true }));
      } else onStatus?.('Living Command Centre ready. Explore a destination, outside landmark or open City Menu.');
    }
    recoverUnsafeCamera('before-scene-render');
    const cameraSightline = cameraOcclusion.update(frameAt);
    if (cameraSightline.activeCount !== lastCameraOccluderCount) {
      lastCameraOccluderCount = cameraSightline.activeCount;
      productRoot.dataset.eonCityCameraOccluderCount = String(cameraSightline.activeCount);
      productRoot.dataset.eonCityCameraSightlineProtected = cameraSightline.activeCount > 0 ? 'true' : 'false';
      onTelemetry?.(freeze({
        type: 'rt89-camera-sightline-protection',
        activeOccluderCount: cameraSightline.activeCount,
        localVisualOnly: true
      }));
    }
    ui.update(projector, playerAnchor.position, nearestId, frameAt);
    sceneRenderCalls += 1;
    try { scene.render(); } catch (error) {
      lastSceneRenderError = String(error?.message || error || 'scene-render-failed').slice(0, 160);
      throw error;
    }
    if (stormEntryAwaitingFirstFrame && expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' && stormEntryConfirmation.requestedRegionId === 'storm-sector' && expanseActiveRegionId === stormEntryConfirmation.requestedRegionId) {
      stormEntryAwaitingFirstFrame = false;
      updateStormEntryConfirmation({ status: 'first-playable', preparedRegionId: 'storm-sector', confirmedRegionId: 'storm-sector', firstPlayableFrame: true, failureReason: '', confirmedAt: Date.now() });
      onStatus?.('Storm Sector reached and first playable frame confirmed. World switching itself grants no XP or progression.');
    }
    if (worldPerformanceAwaitingFirstFrameId && expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' && expanseActiveRegionId === worldPerformanceAwaitingFirstFrameId) {
      const observedWorldRegionId = worldPerformanceAwaitingFirstFrameId;
      worldPerformanceAwaitingFirstFrameId = '';
      worldPerformanceLedger.recordFirstPlayableFrame({ worldRegionId: observedWorldRegionId, assetSnapshot: captureWorldPerformanceAssetSnapshot(observedWorldRegionId) });
    }
    if (myFrontierEntryAwaitingFirstFrame && expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' && expanseActiveRegionId === 'my-frontier') {
      myFrontierEntryAwaitingFirstFrame = false;
      recordMyFrontierEntryDiagnostic('first-frame', { ok: true, detail: 'canonical-scene-rendered' });
      if (myFrontierOptionalAssetsHeldForFirstFrame) {
        myFrontierOptionalAssetsHeldForFirstFrame = false;
        const released = expanseMyFrontierRenderer?.setOptionalAssetAdmission?.(pendingOptionalAssetAdmission) || freeze({ ok: false, reason: 'my-frontier-asset-admission-unavailable' });
        recordMyFrontierEntryDiagnostic('optional-assets-released', { ok: released.ok !== false, reason: released.reason || '', detail: `pressure:${pendingOptionalAssetAdmission.pressure || 'nominal'}` });
      }
    }
    movementRenderRecovery?.noteSceneRender(Date.now());
    if (backgroundPresentation) {
      // The dock is deliberately frame-capped. Never feed that intentional cap
      // into foreground low-FPS protection or it will resize the engine and
      // create the black flash seen in the production recording.
      fpsFrames = 0;
      fpsSampleAt = frameAt;
      lowFpsSamples = 0;
      highFpsSamples = 0;
    } else {
      fpsFrames += 1;
      if (frameAt - fpsSampleAt >= 1000) {
        const sampleMs = Math.max(1, frameAt - fpsSampleAt);
        const sampledFrames = fpsFrames;
        measuredFps = Math.round((sampledFrames * 1000) / sampleMs);
        const fpsProtectionWindowEligible = visibleFrameState.gateComplete
          && !documentHidden
          && sampleMs >= 700
          && sampleMs <= 1_600;
        lastFpsSample = freeze({
          at: Date.now(),
          fps: measuredFps,
          engineFps: Math.round(engine.getFps?.() || 0),
          sampleMs: Math.round(sampleMs),
          frames: sampledFrames,
          backgroundPresentation: false,
          documentHidden,
          visibilityState: String(globalThis.document?.visibilityState || ''),
          activeInputLockOwners: freeze([...activeInputLockOwners]),
          samplePhase: !visibleFrameState.gateComplete ? 'startup' : (fpsProtectionWindowEligible ? 'stable-session' : 'scheduling-gap'),
          protectionEligible: fpsProtectionWindowEligible,
          worldRegionId: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' ? String(expanseActiveRegionId || 'signal-frontier') : 'command-hub',
          quality: resolvedQuality,
          hardwareScalingLevel: currentHardwareScalingLevel,
          reliabilityDecision: lastReliabilityRenderDecision
        });
        fpsTimeline.push(lastFpsSample);
        if (fpsTimeline.length > 24) fpsTimeline.shift();
        worldPerformanceLedger.recordFpsSample(lastFpsSample);
        fpsFrames = 0;
        fpsSampleAt = frameAt;
        const lowFpsFloor = resolvedQuality === 'cinematic' ? 38 : resolvedQuality === 'balanced' ? 40 : 25;
        const recoveryFpsFloor = resolvedQuality === 'cinematic' ? 55 : resolvedQuality === 'balanced' ? 52 : 45;
        // RT92 live Edge evidence exposed a scheduling/decode gap that could be
        // divided into this window and mislabeled as sustained-1-fps. Keep the
        // raw sample, but only let a reasonably bounded ~1s visible-frame
        // window vote for *sustained* FPS protection. Genuine 13/16/29 FPS
        // windows remain eligible because their sampleMs stays near 1000ms.
        lowFpsSamples = fpsProtectionWindowEligible && measuredFps > 0 && measuredFps < lowFpsFloor ? lowFpsSamples + 1 : 0;
        highFpsSamples = fpsProtectionWindowEligible
          && performanceProtectionLevel > 0
          && measuredFps >= recoveryFpsFloor
          ? highFpsSamples + 1
          : 0;
        if (lowFpsSamples >= 3 && frameAt - lastPerformanceProtectionAt >= 8_000) {
          lastPerformanceProtectionAt = frameAt;
          lowFpsSamples = 0;
          highFpsSamples = 0;
          applyPerformanceProtection(`sustained-${measuredFps}-fps`);
        } else if (
          highFpsSamples >= 8
          && frameAt - lastPerformanceProtectionAt >= 15_000
          && frameAt - lastPerformanceRecoveryAt >= 15_000
        ) {
          lastPerformanceRecoveryAt = frameAt;
          highFpsSamples = 0;
          applyPerformanceRecovery(`sustained-${measuredFps}-fps-headroom`);
        }
      }
    }
    if (!firstFrame) {
      firstFrame = true;
      reliabilityController.recordFirstFrame();
      stage('CITY_FIRST_PLAYABLE_FRAME', 'hidden-safety-frame');
      onFirstFrame?.();
      onDetailStage?.({ id: 'nearby-district', summary: { activeDistrictId: 'command-centre', activeExperience: { displayName: 'Living Command Centre' }, residents: [] } });
      onStatus?.('Preparing the authored Living Command Centre, Pathfinder and EONBOT.');
      void startProgressiveAssets();
    }
    if (frameAt - lastResumeWrite > 2000 && axis().active) {
      lastResumeWrite = frameAt;
      writeResume(playerAnchor.position, playerAnchor.rotation.y, activeStationId);
    }
    if (frameAt - lastTelemetry > 3000) {
      lastTelemetry = frameAt;
      onTelemetry?.(getRuntimeSummary());
    }
  };
  const launchRenderLoop = () => engine.runRenderLoop(renderFrame);
  launchRenderLoop();
  movementRenderRecovery = createEonCityW731MovementRenderRecovery({
    now: () => Date.now(),
    staleThresholdMs: 80,
    cooldownMs: 260,
    wakeImmediately: true,
    getState: () => freeze({
      destroyed,
      engine,
      scene,
      documentHidden,
      documentVisible: globalThis.document?.visibilityState !== 'hidden',
      contextLost,
      manualPaused,
      workSurfaceOpen,
      inputLocks: inputLockManager.getSnapshot(),
      cityMenuOpen: Boolean(ui?.isMenuOpen?.()),
      axisActive: axis().active
    }),
    restartRenderLoop: () => {
      try {
        engine.stopRenderLoop(renderFrame);
        launchRenderLoop();
        return true;
      } catch {
        return false;
      }
    }
  });
  stage('FIRST_RENDER_REQUESTED');

  const getW759PresentationDiagnostics = () => {
    const roleStations = new Set(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.map((entry) => entry.stationId));
    const stations = EON_CITY_W731_STATIONS.map((station) => {
      const record = stationState.get(station.id);
      const fallbackStructureVisualsEnabled = (record?.fallbackVisualNodes || [])
        .filter((node) => node !== record?.base && isEonCityW759NodeEnabled(node)).length;
      const fallbackTerminalVisualsEnabled = (record?.terminalFallbackNodes || [])
        .filter(isEonCityW759NodeEnabled).length;
      return freeze({
        id: station.id,
        label: station.label,
        roleNpcRequired: roleStations.has(station.id),
        structure: summarizeEonCityW759LoadedPresentation(record?.loadedWorld),
        terminal: summarizeEonCityW759LoadedPresentation(record?.loadedTerminal),
        npc: summarizeEonCityW759LoadedPresentation(record?.loadedNpc),
        fallbackStructureVisualsEnabled,
        fallbackTerminalVisualsEnabled,
        fallbackNpcEnabled: isEonCityW759NodeEnabled(record?.fallbackNpc?.root),
        npcRepresentation: isEonCityW759PresentationReady(record?.loadedNpc) ? 'authored' : 'absent',
        proceduralNpcVisible: false
      });
    });
    const discoveries = EON_CITY_W737_DISCOVERIES.map((discovery) => {
      const record = discoveryState.get(discovery.id);
      return freeze({
        id: discovery.id,
        label: discovery.label,
        world: summarizeEonCityW759LoadedPresentation(record?.loadedWorld),
        fallbackVisualsEnabled: (record?.fallbackVisualNodes || []).filter(isEonCityW759NodeEnabled).length
      });
    });
    const assets = localAssetRuntime?.getSummary?.() || null;
    const assetLoader = assets
      ? freeze({
        received: assets.qualityAuthority?.received || null,
        effective: assets.quality || null,
        source: assets.qualityAuthority?.source || null,
        budgetName: assets.budget?.name || null
      })
      : null;
    const entryAuthority = qualityAuthority && typeof qualityAuthority === 'object'
      ? freeze({ ...qualityAuthority })
      : freeze({ detected: resolvedQuality, requested: null, effective: resolvedQuality, source: 'automatic', overrideAllowed: false, overrideAccepted: false, rejectionReason: 'entry-authority-unavailable', renderer: '' });
    const handshakeReady = Boolean(assetLoader?.effective);
    const entryToRuntimePass = entryAuthority.effective === resolvedQualityAuthority.effective;
    const runtimeToLoaderPass = handshakeReady && resolvedQualityAuthority.effective === assetLoader.effective;
    return freeze({
      schema: 'eon.city.w759r1.presentation-diagnostics.v1',
      quality: resolvedQuality,
      qualityAuthority: freeze({ entry: entryAuthority, runtime: resolvedQualityAuthority, assetLoader }),
      qualityHandshake: freeze({
        state: handshakeReady ? 'ready' : 'pending',
        entryToRuntimePass,
        runtimeToLoaderPass,
        pass: handshakeReady && entryToRuntimePass && runtimeToLoaderPass
      }),
      player: freeze({
        authored: summarizeEonCityW759LoadedPresentation(playerAsset),
        fallbackEnabled: isEonCityW759NodeEnabled(fallbackPlayer?.root)
      }),
      eonbot: freeze({
        authored: summarizeEonCityW759LoadedPresentation(eonbotAsset),
        fallbackEnabled: isEonCityW759NodeEnabled(eonbotFallback),
        fallbackRingEnabled: isEonCityW759NodeEnabled(eonbotRing)
      }),
      stations: freeze(stations),
      discoveries: freeze(discoveries),
      assets: assets || freeze({ resident: 0, inflight: 0, queued: 0, presentationReadinessPass: false, attachments: freeze([]) }),
      counts: freeze({
        stationWorldReady: stations.filter((entry) => entry.id !== 'eonbot-nexus' && entry.structure.ready).length,
        stationWorldRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationWorld.length,
        stationTerminalsReady: stations.filter((entry) => entry.terminal.ready).length,
        stationTerminalsRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationProps.length,
        roleNpcsReady: stations.filter((entry) => entry.roleNpcRequired && entry.npc.ready).length,
        roleNpcsRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.length,
        discoveriesReady: discoveries.filter((entry) => entry.world.ready).length,
        discoveriesRequired: EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld.length
      }),
      privacySafeVisualDiagnosticsOnly: true
    });
  };

  const runtime = freeze({
    schema: EON_CITY_CORE_RUNTIME_SCHEMA,
    setMove(directionName = '', active = false, options = {}) {
      reconcileWorkspacePause();
      return setDirection(String(directionName), Boolean(active), options?.source || 'external', { settleBeforeRelease: options?.settleBeforeRelease !== false, releaseReason: options?.releaseReason || 'runtime-setMove-release' });
    },
    setSprint(active = false, options = {}) {
      reconcileWorkspacePause();
      const source = String(options?.source || 'external-sprint').slice(0, 64);
      const isActive = Boolean(active);
      if (isActive && getMovementBlockReason()) return freeze({ ok: false, reason: getMovementBlockReason(), active: sprintSources.size > 0 });
      if (isActive) sprintSources.add(source); else sprintSources.delete(source);
      return freeze({ ok: true, schema: EON_CITY_R08_LOCOMOTION_SCHEMA, source, active: sprintSources.size > 0, explicitIntent: true, staminaRequired: false });
    },
    getLocomotionState() { return lastR08Locomotion; },
    setAnalogMove(vector = {}, options = {}) {
      reconcileWorkspacePause();
      const source = String(options?.source || 'analog').slice(0, 64);
      const previousAxis = axis();
      const value = freeze({ x: Math.max(-1, Math.min(1, Number(vector.x || 0))), z: Math.max(-1, Math.min(1, Number(vector.z || 0))) });
      if (Math.hypot(value.x, value.z) <= 0.001 && options?.settleBeforeRelease !== false) settleMovementBeforeSourceRelease?.({ source, reason: 'analog-release', allowSettlement: true });
      if (Math.hypot(value.x, value.z) <= 0.001) analog.delete(source); else analog.set(source, value);
      const nextAxis = axis();
      if (!previousAxis.active && nextAxis.active) {
        movementRenderRecovery?.activate({ source, reason: 'movement-activated' });
        startMovementSimulationFallback?.(source);
      }
      if (previousAxis.active && !nextAxis.active) {
        movementRenderRecovery?.deactivate('movement-inactive');
        stopMovementSimulationFallback?.('movement-inactive');
        forcePlayerIdle?.('analog-release');
      }
      return freeze({ ...value, source });
    },
    clearInput() { clearInput(); return freeze({ ok: true, released: true }); },
    refreshAssetTransferObservation(reason = 'runtime-api') { return refreshAssetTransferObservation(reason); },
    getAssetTransferObservation() { return assetTransferObservation; },
    getW759PresentationDiagnostics() { return getW759PresentationDiagnostics(); },
    getInputDiagnostics() {
      reconcileWorkspacePause();
      const value = axis();
      return freeze({
        mode: 'manual-camera-relative',
        right: value.right,
        forward: value.forward,
        active: value.active,
        keyboardKeys: heldKeys.size,
        analogSources: analog.size,
        blockedReason: value.active ? (getMovementBlockReason() || lastMovementBlockReason || null) : null,
        lastInputEvent,
        movementFrameCount,
        movementDistance: Number(movementDistance.toFixed(4)),
        lastMovementAt,
        player: freeze({ x: Number(playerAnchor.position.x), y: Number(playerAnchor.position.y), z: Number(playerAnchor.position.z), heading: Number(playerAnchor.rotation.y) }),
        workSurfaceOpen,
        workSurfaceHostVisible: workSurfaceHostVisible(),
        manualPaused,
        menuOpen: Boolean(ui?.isMenuOpen?.()),
        inputLocks: inputLockManager.getSnapshot()
        ,inputDiagnostics: freeze({ listenersAttached: !destroyed, keydownEvents, keyupEvents, lastRawKeyboardEvent })
        ,renderDiagnostics: freeze({ renderLoopFrames, movementUpdateCalls, lastRenderAt, lastMovementUpdateAt, lastReliabilityRenderDecision, sceneRenderCalls, lastSceneRenderError, engineDisposed: engine.isDisposed === true, sceneDisposed: scene.isDisposed === true, documentHidden, visibilityState: String(globalThis.document?.visibilityState || 'unknown'), contextLost })
        ,renderRecovery: movementRenderRecovery?.getSnapshot?.() || null
        ,movementDiagnostics: freeze({ axisReadCount, activeAxisFrameCount, lastAxis, lastBlockReason: lastMovementBlockReason, lastBeforePosition, lastRequestedPosition, lastClampedPosition, lastTravelledDistance })
        ,movementSimulation: freeze({ active: axis().active, source: simulationSource, lastClockAt: lastSimulationClockAt, lastStepAt: lastSimulationStepAt, stepCount: simulationStepCount, accumulatorSeconds: simulationAccumulatorSeconds, fallbackClockScheduled: fallbackClockHandle !== null, fallbackClockTickCount, fallbackSimulationStepCount, renderSimulationStepCount, releaseSettlementStepCount, releaseSettlementDistance, duplicateStepPreventedCount, lastStepDeltaSeconds: lastSimulationDeltaSeconds, lastTravelledDistance })
        ,releaseSettlement: lastReleaseSettlement
      });
    },
    openStation(stationId = '', { explicitUserAction = false, surface = '', creatorMode = '' } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return openSurfaceForStation(stationId, canvas, surface, { creatorMode });
    },
    guideToStation(stationId = '', { explicitUserAction = true } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return guideToStation(stationId);
    },
    focusLandmark(id = '') {
      const stationId = LEGACY_LANDMARK_TO_STATION[String(id || '').toLowerCase()] || String(id || '').toLowerCase();
      return guideToStation(stationId).ok;
    },
    guideToLandmark(id = '') {
      const stationId = LEGACY_LANDMARK_TO_STATION[String(id || '').toLowerCase()] || String(id || '').toLowerCase();
      return guideToStation(stationId);
    },
    getW649DistrictActions() { return freeze([]); },
    focusCommandDeck() { return guideToStation('command-console'); },
    setCommandCentreMonitorProofView(side = 'front', { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const proofMode = new URLSearchParams(globalThis.location?.search || '').get('cityProof') === '1';
      if (!proofMode) return freeze({ ok: false, reason: 'city-proof-mode-required' });
      const normalizedSide = String(side || 'front').toLowerCase() === 'rear' ? 'rear' : 'front';
      focusCommandWall();
      if (normalizedSide === 'rear') {
        camera.alpha = (Number(EON_CITY_W760_CAMERA_POSES.commandWall.alpha) + Math.PI) % TAU;
        cameraMode = 'command-wall-rear-proof';
      } else {
        cameraMode = 'command-wall-front-proof';
      }
      return freeze({
        ok: true,
        side: normalizedSide,
        camera: captureCameraPose(),
        runtimeIdentity: getRuntimeIdentitySnapshot(),
        localVisualOnly: true,
        productionStateChanged: false
      });
    },
    focusCreatorAtrium() { return guideToStation('create-forge'); },
    focusMetropolisDistrict(id = '') { return this.guideToLandmark(id); },
    focusAuthoredVerticalSliceRegion(id = '') { return this.guideToLandmark(id); },
    guideToLivingNexusPhysicalGateway() { return freeze({ ok: false, reason: 'retired-launch-layer', replacement: 'command-hub-stations' }); },
    guideToLivingNexusCell() { return freeze({ ok: false, reason: 'retired-launch-layer', replacement: 'command-hub-stations' }); },
    enterLivingNexusRealm() { return freeze({ ok: false, reason: 'retired-launch-layer', replacement: 'my-realm' }); },
    getSpatialDiagnostics() { return freeze({ visible: spatialDiagnosticsVisible, report: spatialDiagnostics.getReport(), bounds: spatialDiagnostics.listLoadedBounds() }); },
    setSpatialDiagnosticsVisible,
    getCameraPose: captureCameraPose,
    getRuntimeIdentitySnapshot,
    getRuntimeSummary,
    refreshLivingNexus(reason = 'manual') { return livingNexus.refresh?.(reason) || null; },
    inspectLivingNexusRing(id = '', { explicitUserAction = false, openDock = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (openDock) {
        return openSurfaceForStation('eonbot-nexus', {
          interactionPart: `nexus-ring:${id}`,
          interactionSource: 'runtime-api',
          nexusRingId: id
        }, 'nexus');
      }
      return livingNexus.inspectRing?.(id) || freeze({ ok: false, reason: 'living-nexus-unavailable' });
    },
    async refreshCommandCentre({ explicitUserAction = false, includeServerBilling = false, reason = 'manual' } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (includeServerBilling) await commandStatusController.refresh({ explicitUserAction: true });
      else commandStatusController.refreshLocal();
      const view = commandCentre.refresh?.(reason) || commandCentre.getView?.();
      return freeze({ ok: true, view, serverBillingRequested: Boolean(includeServerBilling), automaticExecution: false });
    },
    inspectCommandCentreWall(id = '', { explicitUserAction = false, openDock = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (openDock) {
        return openSurfaceForStation('command-console', {
          interactionPart: `command-wall:${id}`,
          interactionSource: 'runtime-api',
          commandWallId: id
        }, 'command-centre');
      }
      return commandCentre.inspectWall?.(id) || freeze({ ok: false, reason: 'command-centre-unavailable' });
    },
    reviewAgentTheatreJob(jobId = '', { explicitUserAction = false } = {}) {
      const result = agentTheatreController.review(jobId, { explicitUserAction });
      commandCentre.refresh?.('agent-theatre-review');
      return result;
    },
    getProductiveStationLoops() { return productiveStations.getView?.() || null; },
    getProductiveStationLoop(stationId = '') { return productiveStations.getStation?.(stationId) || null; },
    reviewProductiveStation(stationId = '', { explicitUserAction = false } = {}) {
      const result = productiveStations.reviewStation?.(stationId, { explicitUserAction }) || freeze({ ok: false, reason: 'productive-stations-unavailable' });
      if (result.ok) livingNexus.refresh?.('productive-station-reviewed');
      return result;
    },
    async prepareProductiveStationHandoff(stationId = '', context = {}, { explicitUserAction = false } = {}) {
      const result = await productiveStations.prepareHandoff?.(stationId, context, { explicitUserAction, sessionStorage: globalThis.sessionStorage, cryptoApi: globalThis.crypto, now: now() })
        || freeze({ ok: false, reason: 'productive-stations-unavailable' });
      if (result.ok) livingNexus.refresh?.('productive-station-handoff-prepared');
      return result;
    },
    refreshProductiveStations(reason = 'manual', { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const view = productiveStations.refresh?.(reason) || productiveStations.getView?.();
      livingNexus.refresh?.('productive-stations-refreshed');
      return freeze({ ok: true, view, automaticExecution: false, rewardIssued: false });
    },
    getMissionsProgression() { return missionsProgression.getView?.() || null; },
    getProductiveMission(stationId = '') { return missionsProgression.getMission?.(stationId) || null; },
    claimProductiveMission(stationId = '', { explicitUserAction = false } = {}) {
      return claimMissionWithReaction(stationId, { explicitUserAction });
    },
    openDeterministicVaultReveal({ explicitUserAction = false } = {}) {
      return openRevealWithReaction({ explicitUserAction });
    },
    selectCityCosmetic(rewardId = '', { explicitUserAction = false } = {}) {
      return missionsProgression.selectCosmetic?.(rewardId, { explicitUserAction }) || freeze({ ok: false, reason: 'missions-progression-unavailable' });
    },
    refreshMissionsProgression(reason = 'manual', { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const view = missionsProgression.refresh?.(reason) || missionsProgression.getView?.();
      ui?.updateMissions?.();
      return freeze({ ok: true, view, automaticExecution: false, automaticPublishing: false });
    },
    getCastNpcTransitPlan() { return freeze({ schema: EON_CITY_W754_SCHEMA, cast: w754CastPlan, schedules: w754NpcSchedulePlan, validation: castTransitValidation }); },
    getEnvironmentArtAudioPlan() { return freeze({ schema: EON_CITY_W755_SCHEMA, plan: environmentController.getPlan(), validation: validateEonCityW755EnvironmentPlan(environmentController.getPlan()), audio: environmentController.getSnapshot().audio }); },
    getOnboardingNavigationAccessibilityPlan() { return freeze({ schema: EON_CITY_W756_SCHEMA, plan: w756ExperiencePlan, validation: w756ExperienceValidation, semanticNavigation: semanticNavigationController?.getSummary?.() || null }); },
    getPerformanceReliabilityPlan() { return freeze({ schema: EON_CITY_W757_SCHEMA, plan: w757ReliabilityPlan, validation: w757ReliabilityValidation, snapshot: reliabilityController.getSnapshot() }); },
    capturePerformanceMemory({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return freeze({ ok: true, snapshot: reliabilityController.captureMemory(), localOnly: true, automaticallyCertified: false });
    },
    notePerformanceRestart({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return freeze({ ok: true, snapshot: reliabilityController.noteRestart(), automaticallyCertified: false });
    },
    openAccessibleCityMap({ explicitUserAction = false, trigger = null } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return freeze({ ok: semanticNavigationController?.show?.(trigger || canvas) === true, semanticAlternative: true, automaticNavigation: false });
    },
    setEnvironmentProfile(next = {}, { explicitUserAction = false } = {}) {
      const result = environmentController.setProfile(next, { explicitUserAction });
      if (result.ok) applyW755EnvironmentPlan({ scene, hemisphere, direction, world, plan: environmentController.getPlan() });
      return result;
    },
    activateCityAudio({ explicitUserAction = false } = {}) { return environmentController.activateAudio({ explicitUserAction }); },
    setCityAudioPreferences(next = {}, { explicitUserAction = false } = {}) { return environmentController.setAudioPreferences(next, { explicitUserAction }); },
    listTransitDestinations() { return w754TransitController.listDestinations(); },
    requestTransit(destinationId = '', { explicitUserAction = false, fromDistrictId = 'orientation-hall' } = {}) {
      return w754TransitController.request(destinationId, { explicitUserAction, fromDistrictId });
    },
    confirmTransit(reviewToken = '', { explicitUserAction = false, choice = 'board' } = {}) {
      return w754TransitController.confirm(reviewToken, { explicitUserAction, choice });
    },
    cancelTransit({ explicitUserAction = false } = {}) { return w754TransitController.cancel({ explicitUserAction }); },
    getTransitState() { return w754TransitController.getSnapshot(); },
    getExpanseWorldMode() { return expanseWorldMode.getState(); },
    getExpanseState() { return expanseState; },
    getExpanseMap() { const map = createEonExpanseW766AMapView(expanseState); if (expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE') expanseMissionRuntime.recordSignal('map-opened', { receiptId: 'expanse:map-opened' }); return map; },
    getExpanseMissionState() { return expanseMissionRuntime.getState(); },
    getExpanseCompanionState() { return expanseCompanionState; },
    getExpanseMissionBoard() { return buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState()); },
    getExpanseMissionBoardView() { const openWorld = expanseGateway?.getSummary?.()?.frontier?.openWorld || null; return buildEonExpanseW766GMissionBoardView({ campaignBoard: buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState()), contentSummary: expanseLivingContent.getSummary(), map: createEonExpanseW766AMapView(expanseState), guidance: expanseGuidance, openWorld }); },
    getExpanseMapPresentation() { const openWorld = expanseGateway?.getSummary?.()?.frontier?.openWorld || null; return buildEonExpanseW766GMapPresentation(createEonExpanseW766AMapView(expanseState), openWorld); },
    getExpanseLivingContent() { return expanseLivingContent.getSummary(); },
    getExpanseDynamicEvent() { return expanseLivingContent.resolveEvent({ at: Date.now() }); },
    getExpansePresentation() { return expansePresentation; },
    getExpanseCosmeticSummary() { return freeze({ cosmeticId: 'signal-vanguard-glow', owned: expanseMissionRuntime.getState().ownedCosmetics.includes('signal-vanguard-glow'), selected: expanseMissionRuntime.getState().selectedCosmetic === 'signal-vanguard-glow', visible: signalVanguardCosmeticRoot?.isEnabled?.() === true, canonicalPlayerAnchor: signalVanguardCosmeticRoot?.parent === playerAnchor, tradeable: false, financialValue: false }); },
    getExpanseAudioSummary() { return expanseAudio.getSummary(); },
    getExpanseVisualSummary() { return expanseVisuals.getSummary(); },
    setExpanseAudioMuted(muted = false, { explicitUserAction = false } = {}) { return expanseAudio.setMuted(muted, { explicitUserAction }); },
    getExpanseRuntimeHealth() { return expanseRuntimeHealth.getState(); },
    getExpanseUiSummary() { return expanseUiOverlay.getSummary(); },
    openExpanseMissionBoard(options = {}) { return openExpanseMissionMapAction(options); },
    closeExpanseMissionBoard() { return expanseUiOverlay.closeBoard(); },
    getExpanseOnboardingState() { return expanseOnboardingState; },
    certifyExpanseFirstMinuteClarity() { return expanseOnboarding.certify(); },
    dismissExpanseOnboarding({ explicitUserAction = false } = {}) { const result = expanseOnboarding.dismiss({ explicitUserAction }); if (result.ok) { expanseOnboardingState = result.state; expanseUiOverlay.updateOnboarding?.(expanseOnboardingState); } return result; },
    certifyExpanseRuntimeHealth() { return expanseRuntimeHealth.certify(); },
    completeExpanseSideMission(missionId = '', options = {}) { const result = expanseLivingContent.completeSideMission(missionId, options); if (result.ok) syncExpanseUi(); return result; },
    getExpanseProductiveReceiptCandidate(missionId = '') { return deriveEonExpanseW767WProductiveReceipt(readCurrentProductivePlan() || {}, missionId); },
    completeExpanseProductiveMission(missionId = '', options = {}) {
      const candidate = deriveEonExpanseW767WProductiveReceipt(readCurrentProductivePlan() || {}, missionId);
      const expectedReceiptId = String(options.expectedReceiptId || '');
      if (expectedReceiptId && (!candidate.ok || candidate.id !== expectedReceiptId)) return freeze({ ok: false, reason: 'productive-receipt-selection-changed' });
      const workspaceReceipt = options.workspaceReceipt || (candidate.ok ? candidate : null);
      const result = expanseLivingContent.completeProductiveMission(missionId, { ...options, workspaceReceipt });
      if (result.ok) syncExpanseUi();
      return result;
    },
    recordExpanseDiscovery(discoveryId = '', options = {}) { const result = expanseLivingContent.recordDiscovery(discoveryId, options); if (result.ok) syncExpanseUi(); return result; },
    interactExpanseFrontierContract(contract = {}, options = {}) { const result = expanseLivingContent.interactFrontierContract(contract, options); if (result.ok) syncExpanseUi(); return result; },
    progressExpanseFrontierContract(contract = {}, stepId = '', options = {}) { const result = expanseLivingContent.progressFrontierContract(contract, stepId, options); if (result.ok) syncExpanseUi(); return result; },
    recordExpanseProceduralDiscovery(discovery = {}, options = {}) { const result = expanseLivingContent.recordProceduralDiscovery(discovery, options); if (result.ok) syncExpanseUi(); return result; },
    getExpanseOpenWorldSummary() { return expanseGateway?.getSummary?.()?.frontier?.openWorld || freeze({ mountedSectorCount: 0, visibleHardBorder: false, deferredUntilEntry: true }); },
    getExpanseAssetTruthReport() { return expanseGateway?.getAssetTruthReport?.() || freeze({ releaseReady: false, totals: freeze({ requested: 0, presented: 0, pending: 0, rejected: 0, authoredFallback: 0, proceduralFallback: 0 }), records: freeze([]), missingZoneIds: freeze([]) }); },
    getExpanseAssetRepairFocus() { return buildEonExpanseW767NAssetRepairFocus(expanseGateway?.getAssetTruthReport?.() || {}); },
    getExpanseFutureRegionReleaseEvidence() { return expanseFutureRegionReleaseEvidence; },
    getExpanseFutureRegionReleaseReview() { return expanseFutureRegionReleaseReview; },
    getExpanseFutureRegionActivation() { return expanseFutureRegionActivation; },
    getExpanseStormSectorJourney() { return expanseStormSectorJourney.getState(); },
    getStormSectorEntryConfirmation() { return stormEntryConfirmation; },
    getExpanseStormSectorPresentation() { return expanseStormSectorPresenter?.getSummary?.() || freeze({ active: false, regionId: 'storm-sector', deferred: true }); },
    getExpanseStormSectorMissions() { return expanseStormSectorMissions.getView(); },
    getExpanseStormSectorNpcs() { return expanseStormSectorNpcs?.getSummary?.() || freeze({ active: false, presentedNpcCount: 0 }); },
    getExpanseStormSectorTransit() { return freeze({ state: expanseStormSectorTransit.getState(), view: expanseStormSectorTransit.getView(expanseStormSectorMissions.getState(), playerAnchor.position), presentation: expanseStormSectorTransitPresenter?.getSummary?.() || null }); },
    getExpanseStormSectorTransformations() { return expanseStormSectorTransformations?.getSummary?.() || freeze({ active: false, restoredCount: 0, totalCount: 3 }); },
    getExpanseStormSectorCaptureMoment() { return expanseStormSectorCapture.derive({ regionActive: expanseActiveRegionId === 'storm-sector', at: Date.now() }); },
    submitExpanseFutureRegionOwnerAuthorization(authorization = null, { explicitOwnerAction = false } = {}) {
      if (!explicitOwnerAction) return freeze({ ok: false, reason: 'explicit-owner-action-required' });
      const sanitized = sanitizeEonExpanseW793AOwnerAuthorization(authorization);
      if (!sanitized) return freeze({ ok: false, reason: 'future-region-owner-authorization-invalid' });
      const current = deriveEonExpanseW793AActivationAction({
        releaseReview: expanseState.futureRegionReleaseReview,
        packageCertification: expanseState.futureRegionPackageCertification,
        performanceEvidence: expanseVerifiedPerformanceEvidence,
        ownerAuthorization: sanitized,
        currentActivation: expanseState.futureRegionActivation
      });
      const action = current.action;
      const validated = validateEonExpanseW793AActivationAction(current, {
        explicitOwnerAction: true,
        expectedRegionId: action?.regionId || '',
        expectedGatewayId: action?.gatewayId || '',
        expectedPackageDigest: action?.packageDigest || '',
        expectedBuildDigest: action?.buildDigest || '',
        expectedDeploymentChannel: action?.deploymentChannel || '',
        expectedActivationToken: action?.activationToken || ''
      });
      if (!validated.ok) return validated;
      const confirmed = confirmEonExpanseW793AActivation(validated.action, { explicitOwnerAction: true, at: Date.now() });
      if (!confirmed.ok) return confirmed;
      expanseFutureRegionOwnerAuthorization = sanitized;
      expanseState = freeze({ ...expanseState, futureRegionActivation: confirmed.state, updatedAt: Date.now() });
      const persisted = expansePersistence.write(expanseState);
      if (!persisted.ok) { expanseFutureRegionOwnerAuthorization = null; return freeze({ ok: false, reason: persisted.reason || 'future-region-activation-persistence-failed' }); }
      expanseStormSectorJourney.syncActivation(expanseState.futureRegionActivation);
      expanseGateway?.applyFutureRegionActivation?.(expanseState.futureRegionActivation);
      syncExpanseUi();
      return freeze({ ...confirmed, persisted: true, regionRendered: false, automaticActivation: false, explicitOwnerAction: true });
    },
    reviewExpanseFutureRegionRelease(action = null, options = {}) {
      const current = expanseFutureRegionReleaseReview;
      const validated = validateEonExpanseW788AReleaseReviewAction(current, { explicitUserAction: options.explicitUserAction === true, expectedRegionId: options.expectedRegionId || action?.regionId || '', expectedGatewayId: options.expectedGatewayId || action?.gatewayId || '', expectedPackageDigest: options.expectedPackageDigest || action?.packageDigest || '', expectedReviewToken: options.expectedReviewToken || action?.reviewToken || '' });
      if (!validated.ok) return validated;
      const confirmed = confirmEonExpanseW788AReleaseReview(validated.action, { explicitUserAction: true, at: Date.now() });
      if (!confirmed.ok) return confirmed;
      expanseState = freeze({ ...expanseState, futureRegionReleaseReview: confirmed.state, updatedAt: Date.now() });
      const persisted = expansePersistence.write(expanseState);
      if (!persisted.ok) return freeze({ ok: false, reason: persisted.reason || 'future-region-release-review-persistence-failed' });
      syncExpanseUi();
      return freeze({ ...confirmed, persisted: true, gatewayActivated: false, regionRendered: false, automaticRelease: false });
    },
    getExpanseFutureRegionPackageCertification() { return expanseState.futureRegionPackageCertification || null; },
    getExpanseFutureRegionPerformanceEvidence() { return freeze({ persisted: expanseState.futureRegionPerformanceEvidence || null, verifiedForCurrentCandidate: expanseVerifiedPerformanceEvidence }); },
    async submitExpanseFutureRegionPerformanceEvidence(evidence = null, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const sanitized = sanitizeEonExpanseW790APerformanceEvidence(evidence);
      if (!sanitized) return freeze({ ok: false, reason: 'foreground-performance-evidence-invalid' });
      try {
        const response = await globalThis.fetch?.('/release/candidate-provenance.json', { cache: 'no-store', credentials: 'same-origin', headers: { accept: 'application/json', 'cache-control': 'no-store' } });
        const provenance = response?.ok ? await response.json() : null;
        const candidateDigest = String(provenance?.candidateDigest || '');
        const validated = validateEonExpanseW790APerformanceEvidence(sanitized, { expectedQuality: resolvedQuality, expectedBuildDigest: candidateDigest });
        if (!validated.ok) return freeze({ ok: false, reason: validated.errors[0] || 'served-candidate-performance-evidence-mismatch', errors: validated.errors });
        expanseVerifiedPerformanceEvidence = validated.evidence;
        expanseState = freeze({ ...expanseState, futureRegionPerformanceEvidence: validated.evidence, updatedAt: Date.now() });
        const persisted = expansePersistence.write(expanseState);
        if (!persisted.ok) { expanseVerifiedPerformanceEvidence = null; return freeze({ ok: false, reason: persisted.reason || 'future-region-performance-evidence-persistence-failed' }); }
        syncExpanseUi();
        return freeze({ ok: true, evidence: validated.evidence, persisted: true, certified: false, gatewayActivated: false, explicitUserAction: true });
      } catch { return freeze({ ok: false, reason: 'served-candidate-provenance-unavailable' }); }
    },
    async revalidateExpanseFutureRegionPerformanceEvidence({ explicitUserAction = false } = {}) {
      const persisted = expanseState.futureRegionPerformanceEvidence;
      if (!persisted) return freeze({ ok: false, reason: 'persisted-performance-evidence-unavailable' });
      return this.submitExpanseFutureRegionPerformanceEvidence(persisted, { explicitUserAction });
    },
    submitExpanseFutureRegionPackageCertification(receipt = null, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const reviewedRegionId = String(expanseState.futureRegionProgrammeReview?.regionId || '');
      if (!reviewedRegionId) return freeze({ ok: false, reason: 'future-region-programme-review-required' });
      const certification = sanitizeEonExpanseW789ARegionPackageCertification(receipt);
      if (!certification || certification.regionId !== reviewedRegionId) return freeze({ ok: false, reason: 'exact-reviewed-region-package-certification-required' });
      expanseState = freeze({ ...expanseState, futureRegionPackageCertification: certification, updatedAt: Date.now() });
      const persisted = expansePersistence.write(expanseState);
      if (!persisted.ok) return freeze({ ok: false, reason: persisted.reason || 'future-region-package-certification-persistence-failed' });
      syncExpanseUi();
      return freeze({ ok: true, certification, persisted: true, gatewayActivated: false, regionRendered: false, automaticRelease: false, explicitUserAction: true });
    },
    exportExpanseFutureRegionReleaseEvidence({ explicitUserAction = false, pretty = true } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return freeze({ ok: true, fileName: `EON_EXPANSE_FUTURE_REGION_RELEASE_EVIDENCE_${new Date().toISOString().slice(0, 10)}.json`, json: serializeEonExpanseW787AReleaseEvidence(expanseFutureRegionReleaseEvidence, { pretty }), evidence: expanseFutureRegionReleaseEvidence });
    },
    getExpanseAssetRecoveryState() { return expanseAssetRecoveryState; },
    retryExpanseAuthoredAssets(options = {}) { return retryExpanseAuthoredAssetsAction(options); },
    certifyExpanseAssetRecovery() { return expanseAssetRecovery.certify({ expanseActive: expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE', at: Date.now() }); },
    exportExpanseAssetTruthReport({ explicitUserAction = false, pretty = true } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const report = expanseGateway?.getAssetTruthReport?.();
      if (!report) return freeze({ ok: false, reason: 'expanse-asset-truth-unavailable' });
      return freeze({ ok: true, fileName: `EON_EXPANSE_ASSET_TRUTH_${new Date().toISOString().slice(0, 10)}.json`, json: serializeEonExpanseW767DAssetTruthReport(report, { pretty }), report });
    },
    getExpanseMyFrontierState() { return expanseMyFrontier.getState(); },
    getExpanseMyFrontierProjection() { return freeze({ ...expanseMyFrontier.getSafeProjection(), construction: expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState()) }); },
    getExpanseMyFrontierConstructionAvailability() { return listEonExpanseW768CConstructionAvailability(expanseMyFrontier.getState()); },
    getExpanseMyFrontierReadiness() { return deriveCurrentMyFrontierReadiness(); },
    getExpanseMyFrontierVisualSummary() { return expanseMyFrontierRenderer?.getSummary?.() || freeze({ visible: false, reason: 'my-frontier-renderer-unavailable' }); },
    getExpanseMyFrontierResidentAvailability() { return deriveEonExpanseW768WResidentInvitationView({ myFrontierState: expanseMyFrontier.getState(), missionLedger: expanseMissionRuntime.getState() }); },
    inviteExpanseMyFrontierResident(slotId = '', residentId = '', { explicitUserAction = false } = {}) {
      const current = deriveEonExpanseW768WResidentInvitationView({ myFrontierState: expanseMyFrontier.getState(), missionLedger: expanseMissionRuntime.getState() });
      const validated = validateEonExpanseW768WResidentInvitationAction(current, { explicitUserAction, expectedSlotId: slotId, expectedResidentId: residentId });
      if (!validated.ok) return validated;
      const receipt = deriveEonExpanseW768VResidentReceipt({ residentId: validated.action.residentId, missionLedger: expanseMissionRuntime.getState() });
      if (!receipt.ok) return receipt;
      const result = expanseMyFrontier.inviteResident({ slotId: validated.action.slotId, residentId: validated.action.residentId, residentReceipt: receipt.receipt, explicitUserAction: true });
      if (result.ok) syncExpanseUi();
      return freeze({ ...result, action: validated.action, automaticInvitation: false, awardsXp: false });
    },
    getExpanseMyFrontierTheme() { return deriveEonExpanseW769BThemeChoice({ myFrontierState: expanseMyFrontier.getState() }); },
    selectExpanseMyFrontierTheme(themeId = '', { explicitUserAction = false } = {}) {
      const current = deriveEonExpanseW769BThemeChoice({ myFrontierState: expanseMyFrontier.getState(), selectedThemeId: themeId });
      const validated = validateEonExpanseW769BThemeAction(current, { explicitUserAction, expectedThemeId: themeId, expectedCurrentThemeId: current.currentThemeId });
      if (!validated.ok) return validated;
      const result = expanseMyFrontier.selectTheme({ themeId: validated.action.themeId, explicitUserAction: true });
      if (result.ok) syncExpanseUi();
      return freeze({ ...result, action: validated.action, automaticSelection: false, rawColorsAccepted: false });
    },
    getExpanseMyFrontierResidentReleaseView() { return deriveEonExpanseW769AResidentReleaseView({ myFrontierState: expanseMyFrontier.getState() }); },
    releaseExpanseMyFrontierResident(slotId = '', residentId = '', { explicitUserAction = false } = {}) {
      const current = deriveEonExpanseW769AResidentReleaseView({ myFrontierState: expanseMyFrontier.getState() });
      const action = current.actions.find((entry) => entry.slotId === String(slotId || '')) || null;
      const validated = validateEonExpanseW769AResidentReleaseAction(current, { explicitUserAction, expectedSlotId: slotId, expectedResidentId: residentId, expectedReceiptId: action?.receiptId || '', expectedReleaseToken: action?.releaseToken || '' });
      if (!validated.ok) return validated;
      const result = expanseMyFrontier.releaseResident({ slotId: validated.action.slotId, residentId: validated.action.residentId, residentReceiptId: validated.action.receiptId, explicitUserAction: true });
      if (result.ok) syncExpanseUi();
      return freeze({ ...result, action: validated.action, automaticRelease: false, awardsXp: false, mutatesMissionState: false });
    },
    unlockExpanseMyFrontier({ explicitUserAction = false } = {}) { return expanseMyFrontier.unlockMyFrontier({ campaignReceipt: expanseMissionRuntime.getState().campaignReceipt, explicitUserAction }); },
    selectExpanseMyFrontierBuilding(plotId = '', buildingId = '', { explicitUserAction = false } = {}) { return expanseMyFrontier.selectBuilding({ plotId, buildingId, explicitUserAction }); },
    getExpanseMyFrontierConstructionPermit(plotId = '', buildingId = '') { return deriveCurrentMyFrontierPermit({ plotId, buildingId }); },
    getExpanseMyFrontierDistrictUpgrade(plotId = '', buildingId = '') { return deriveCurrentMyFrontierUpgradeView({ plotId, buildingId }); },
    getExpanseMyFrontierUpgradeProjection() { const constructionProjection = expanseMyFrontierConstruction.getSafeProjection(expanseMyFrontier.getState()); return expanseMyFrontierUpgrades.getSafeProjection(constructionProjection); },
    confirmExpanseMyFrontierDistrictUpgrade(plotId = '', buildingId = '', { explicitUserAction = false } = {}) {
      const current = deriveCurrentMyFrontierUpgradeView({ plotId, buildingId });
      const site = deriveEonExpanseW769IUpgradeSite({ upgradeView: current, playerPosition: playerAnchor.position });
      const validated = validateEonExpanseW769IUpgradeSite(site, { explicitUserAction, expectedPlotId: plotId, expectedBuildingId: buildingId });
      if (!validated.ok) return validated;
      const result = expanseMyFrontierUpgrades.confirmUpgrade({ upgradeView: current, explicitUserAction: true });
      return freeze({ ...result, action: validated.action, remoteUpgradeAllowed: false, automaticUpgrade: false, grantsXp: false });
    },
    requestExpanseMyFrontierGuide({ explicitUserAction = false } = {}) {
      const current = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: expanseMyFrontier.getState(), playerPosition: playerAnchor.position });
      const validated = validateEonExpanseW768PNavigationAction(current, { explicitUserAction });
      if (!validated.ok) return validated;
      expanseActivityGuidance = validated.guidance; expanseGuidance = buildCurrentExpanseGuidance();
      const result = expanseGuideController.request(expanseGuidance, { explicitUserAction: true });
      if (result.ok) { expanseGuideState = result.state; syncExpanseUi(); }
      return freeze({ ...result, action: validated.action, automaticMovement: false, teleport: false });
    },
    confirmExpanseMyFrontierConstruction(plotId = '', buildingId = '', { explicitUserAction = false } = {}) {
      const current = deriveCurrentMyFrontierConstructionAction();
      const validated = validateEonExpanseW768QConstructionSite(current, { explicitUserAction, expectedPlotId: plotId, expectedBuildingId: buildingId });
      if (!validated.ok) return validated;
      const permit = deriveCurrentMyFrontierPermit({ plotId: validated.action.plotId, buildingId: validated.action.buildingId });
      return expanseMyFrontierConstruction.confirmConstruction({ permit, explicitUserAction: true });
    },
    getExpanseDailySignalRecommendation() { return deriveCurrentDailySignal({ state: expanseLivingContent.getState() }); },
    completeExpanseDailySignal(options = {}) {
      const recommendation = deriveCurrentDailySignal({ state: expanseLivingContent.getState() });
      const selected = validateEonExpanseW767YDailySignalSelection(recommendation, { explicitUserAction: options.explicitUserAction === true, expectedDayKey: options.expectedDayKey || options.dayKey || '', expectedMissionId: options.expectedMissionId || options.missionId || '' });
      if (!selected.ok) return selected;
      const result = expanseLivingContent.completeDailySignal({ ...options, dayKey: recommendation.dayKey, missionId: recommendation.missionId, workspaceReceipt: options.workspaceReceipt || recommendation.receipt });
      if (result.ok) syncExpanseUi();
      return result;
    },
    getExpanseGuidance() { return expanseGuidance; },
    getExpanseGuideState() { return expanseGuideState; },
    getExpanseLostPlayerAssistanceState() { return expanseLostAssistanceState; },
    certifyExpanseLostPlayerAssistance() { return expanseLostAssistance.certify(); },
    dismissExpanseLostPlayerAssistance({ explicitUserAction = false } = {}) { const result = expanseLostAssistance.dismiss({ explicitUserAction, at: Date.now() }); if (result.ok) { expanseLostAssistanceState = result.state; syncExpanseUi(); } return result; },
    getExpanseCompanionBehaviorState() { return expanseCompanionBehaviorState; },
    certifyExpanseCompanionBehavior() { return expanseCompanionBehavior.certify(); },
    getExpanseCompanionDockState() { return expanseGateway?.getSummary?.()?.companionDock || freeze({ visible: false, interactive: false, deferredUntilEntry: true }); },
    getExpanseLabelSummary() { return lastExpanseLabelSummary; },
    interactWithNearestExpanseTarget({ explicitUserAction = false, expectedTargetId = '', source = 'public-runtime' } = {}) {
      return interactNearestExpanseAction({ explicitUserAction, expectedTargetId, source });
    },
    requestExpanseGuide({ explicitUserAction = false } = {}) { if (explicitUserAction && expanseLostAssistanceState?.active) expanseLostAssistanceState = expanseLostAssistance.acceptGuide({ explicitUserAction: true, at: Date.now() }).state; const result = expanseGuideController.request(expanseGuidance, { explicitUserAction }); if (result.ok) { expanseGuideState = result.state; syncExpanseUi(); } return result; },
    cancelExpanseGuide(reason = 'explicit-cancel') { if (shouldClearEonExpanseW767VActivityGuidance({ reason, activityObjective: expanseActivityGuidance?.objective })) expanseActivityGuidance = null; expanseGuidance = buildCurrentExpanseGuidance(); const result = expanseGuideController.cancel(reason); expanseGuideState = result.state; syncExpanseUi(); return result; },
    getExpanseTransitJourney() { return expanseTransitJourney.getState(); },
    getExpanseTransitPresentation() { return expanseTransitPresenter.getSummary(); },
    getExpanseRouteCertification() { return expanseRouteCertification; },
    startExpanseMission(missionId = '', options = {}) { return startExpanseMissionAction(missionId, options); },
    completeExpanseObjective(missionId = '', objectiveId = '', receiptId = '') { return expanseMissionRuntime.completeObjective(missionId, objectiveId, { receiptId }); },
    listExpanseTransitNodes() { return expanseTransit.list(); },
    requestExpanseTransit(nodeId = '', { explicitUserAction = false } = {}) { return expanseTransit.request(nodeId, { explicitUserAction }); },
    confirmExpanseTransit(reviewToken = '', { explicitUserAction = false } = {}) { return expanseTransit.confirm(reviewToken, { explicitUserAction }); },
    cancelExpanseTransit({ explicitUserAction = false } = {}) {
      const review = expanseTransit.cancel({ explicitUserAction });
      if (explicitUserAction && expanseTransitJourney.getState().status === 'active') {
        const journey = cancelActiveExpanseTransit('explicit-user-cancel');
        onStatus?.('Regional Transit cancelled safely.');
        return freeze({ ok: true, explicitUserAction: true, review, journey });
      }
      return review;
    },
    claimSignalVanguardReveal({ explicitUserAction = false } = {}) { return expanseMissionRuntime.claimSignalVanguard({ explicitUserAction }); },
    selectExpanseCosmetic(cosmeticId = '', { explicitUserAction = false } = {}) { return expanseMissionRuntime.selectCosmetic(cosmeticId, { explicitUserAction }); },
    confirmExpanseCampaignReceipt(options = {}) { return confirmExpanseCampaignReceiptAction(options); },
    getExpanseGatewaySummary() { return expanseGateway?.getSummary?.() || freeze({ enabled: false, reason: 'gateway-unavailable' }); },
    getOpenWorldAvailability() { return getOpenWorldAvailability(); },
    getWorldPerformanceObservation() { return worldPerformanceLedger.getSnapshot(); },
    getRt91MissionBoard() { return rt91Integration.getMissionBoard(); },
    getRt91RuntimeSummary() { return rt91Integration.getSummary(); },
    getRt91ProductiveReceiptStatus(requiredKind = '') { return rt91ProductiveReceiptAdapter.resolve(requiredKind); },
    getRt91ActiveTarget() { return rt91Integration.getActiveTarget(expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' ? expanseActiveRegionId : 'command-hub'); },
    getRt91HudProjection() { return rt91Integration.getHudProjection(expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE' ? expanseActiveRegionId : 'command-hub'); },
    startRt91Mission(missionId = '', { explicitUserAction = false } = {}) { return rt91Integration.startMission(missionId, { explicitUserAction }); },
    completeRt91ActiveObjective({ explicitUserAction = false, expectedTargetId = '', productiveReceipt = null } = {}) {
      return rt91Integration.completeActiveObjective({ worldId: expanseActiveRegionId, playerPosition: playerAnchor.position, explicitUserAction, expectedTargetId, productiveReceipt });
    },
    clearRt91Session({ explicitUserAction = false } = {}) { return rt91Integration.clearSession({ explicitUserAction }); },
    enterSignalFrontier({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE') return this.enterExpanse({ explicitUserAction: true });
      if (expanseActiveRegionId === 'signal-frontier') return freeze({ ok: true, reason: 'already-in-signal-frontier', directOpenWorldEntry: true, grantsXp: false });
      clearInput('l95-direct-signal-entry');
      if (expanseActiveRegionId === 'storm-sector') {
        expanseStormSectorInteractions?.apply?.({ regionActive: false });
        expanseStormSectorNpcs?.apply?.({ regionActive: false });
        expanseStormSectorTransit.cancel({ explicitUserAction: true, reason: 'world-switch-signal-frontier' });
        expanseStormSectorTransitPresenter?.apply?.({ regionActive: false });
        expanseStormSectorTransformations?.apply?.({ regionActive: false });
        expanseStormSectorPresenter?.suspend?.();
        expanseStormSectorJourney.reset({ explicitUserAction: true });
      }
      expanseMyFrontierRenderer?.deactivate?.();
      expanseActiveRegionId = 'signal-frontier';
      setCurrentWorld('signal-frontier', { reason: 'direct-signal-entry' });
      const restored = expanseGateway?.activate?.() || freeze({ ok: false, reason: 'signal-frontier-gateway-unavailable' });
      if (!restored.ok) return freeze({ ...restored, directOpenWorldEntry: false, grantsXp: false, persistsProgression: false });
      expanseVisuals.activate?.(expansePresentation);
      expanseAudio.start?.({ explicitUserAction: true });
      expanseAudio.applyPresentation?.(expansePresentation);
      const signalSpawn = EON_EXPANSE_W766A_REGION_KITS.find((entry) => entry.id === 'signal-frontier')?.safeSpawn || freeze({ x: 0, y: 0.15, z: 16 });
      playerAnchor.position.set(signalSpawn.x, signalSpawn.y, signalSpawn.z);
      cameraMode = 'expanse-follow';
      camera.alpha = Math.PI; camera.beta = 1.08; camera.radius = 24;
      camera.setTarget(new Vector3(signalSpawn.x, 2.2, signalSpawn.z - 8));
      expanseZoneArrival.reset('direct-signal-entry');
      expanseZoneArrival.markAnnounced('gateway-overlook');
      expanseUiOverlay.showArrival?.({ title: 'SIGNAL FRONTIER', network: 'Story world online', detail: 'Follow the highlighted signal → E / tap Use at the field target · EONBOT is one tap away' });
      beginObservedWorldPerformanceSession('signal-frontier', 'direct-signal-entry');
      syncExpanseCompanionState();
      onStatus?.('Signal Frontier active. World switching grants no XP or progression by itself.');
      return freeze({ ok: true, directOpenWorldEntry: true, worldId: 'signal-frontier', grantsXp: false, persistsProgression: false, automaticMovement: false });
    },
    enterMyFrontier({ explicitUserAction = false } = {}) {
      recordMyFrontierEntryDiagnostic('request', { ok: null, detail: explicitUserAction ? 'explicit-user-action' : 'missing-explicit-user-action' });
      if (!explicitUserAction) {
        recordMyFrontierEntryDiagnostic('rejected', { ok: false, reason: 'explicit-user-action-required' });
        return freeze({ ok: false, reason: 'explicit-user-action-required' });
      }
      const availability = getOpenWorldAvailability();
      recordMyFrontierEntryDiagnostic('availability', { ok: availability.myFrontier.available === true, reason: availability.myFrontier.reason || '', detail: `starterAccess:${availability.myFrontier.starterAccess === true}` });
      if (availability.myFrontier.available !== true) return freeze({ ok: false, reason: availability.myFrontier.reason, campaignCompletionRequired: false, grantsXp: false });
      if (!expanseMyFrontier.getState().unlocked) {
        const starterAccessReceipt = deriveEonCityR08MyFrontierStarterReceipt();
        const unlocked = expanseMyFrontier.unlockMyFrontierStarter({ starterAccessReceipt, explicitUserAction: true });
        recordMyFrontierEntryDiagnostic('starter-unlock', { ok: unlocked.ok === true, reason: unlocked.reason || '' });
        if (!unlocked.ok) return freeze({ ...unlocked, campaignCompletionRequired: false, grantsXp: false });
      } else recordMyFrontierEntryDiagnostic('starter-unlock', { ok: true, detail: 'already-unlocked' });
      const entry = deriveEonCityR08MyFrontierEntry({ unlocked: expanseMyFrontier.getState().unlocked });
      if (!entry.available || !entry.target) {
        recordMyFrontierEntryDiagnostic('entry-target', { ok: false, reason: 'my-frontier-entry-target-unavailable' });
        return freeze({ ok: false, reason: 'my-frontier-entry-target-unavailable', campaignCompletionRequired: false, grantsXp: false });
      }
      recordMyFrontierEntryDiagnostic('entry-target', { ok: true, detail: 'safe-target-ready' });

      // RT89: build the destination while it is still disabled. The current
      // world remains authoritative until My Frontier has mounted AND accepted
      // activation, so a renderer failure can never strand the player in a
      // half-switched region.
      let myFrontierRenderer = null;
      try {
        myFrontierRenderer = ensureMyFrontierRenderer();
        recordMyFrontierEntryDiagnostic('renderer-mount', { ok: true, detail: 'mounted-inactive' });
      } catch (error) {
        const reason = String(error?.message || error || 'w768i-my-frontier-renderer-mount-failed:unknown');
        recordMyFrontierEntryDiagnostic('renderer-mount', { ok: false, reason });
        onStatus?.(`My Frontier could not open: ${reason.replaceAll('-', ' ')}.`);
        return freeze({ ok: false, reason, directOpenWorldEntry: false, campaignCompletionRequired: false, grantsXp: false, grantsConstructionPermit: false });
      }

      if (expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE') {
        const entered = runtime.enterExpanse({ explicitUserAction: true, starterAccess: true });
        recordMyFrontierEntryDiagnostic('expanse-entry', { ok: entered.ok === true, reason: entered.reason || '' });
        if (!entered.ok) {
          myFrontierRenderer.deactivate?.();
          return freeze({ ...entered, directOpenWorldEntry: false, campaignCompletionRequired: false, grantsXp: false });
        }
      } else recordMyFrontierEntryDiagnostic('expanse-entry', { ok: true, detail: 'already-active' });

      const previousRegionId = String(expanseActiveRegionId || 'signal-frontier');
      const activation = myFrontierRenderer.activate?.(getCurrentMyFrontierVisualPayload());
      if (activation?.ok === false) {
        myFrontierRenderer.deactivate?.();
        const reason = String(activation.reason || 'my-frontier-renderer-activation-failed');
        recordMyFrontierEntryDiagnostic('renderer-activate', { ok: false, reason, detail: `preserved:${previousRegionId}` });
        onStatus?.(`My Frontier could not activate: ${reason.replaceAll('-', ' ')}.`);
        return freeze({ ok: false, reason, directOpenWorldEntry: false, campaignCompletionRequired: false, grantsXp: false, grantsConstructionPermit: false, previousRegionPreserved: true });
      }
      recordMyFrontierEntryDiagnostic('renderer-activate', { ok: true, detail: `destination-ready;previous:${previousRegionId}` });

      // No render occurs between the synchronous activation above and this
      // handoff. Retire the previous presentation only after the destination
      // is known-good.
      if (previousRegionId === 'storm-sector') {
        clearInput('l95-direct-my-frontier-from-storm');
        expanseStormSectorInteractions?.apply?.({ regionActive: false });
        expanseStormSectorNpcs?.apply?.({ regionActive: false });
        expanseStormSectorTransit.cancel({ explicitUserAction: true, reason: 'world-switch-my-frontier' });
        expanseStormSectorTransitPresenter?.apply?.({ regionActive: false });
        expanseStormSectorTransformations?.apply?.({ regionActive: false });
        expanseStormSectorCapture.reset('world-switch-my-frontier');
        expanseStormSectorPresenter?.suspend?.();
        expanseStormSectorJourney.reset({ explicitUserAction: true });
        recordMyFrontierEntryDiagnostic('storm-suspended', { ok: true, detail: 'after-destination-activation' });
      } else {
        clearInput('r08-my-frontier-entry');
        expanseGateway.suspendSignalPresentation?.('my-frontier-entry');
        expanseVisuals.deactivate?.();
        expanseAudio.suspend?.('my-frontier-entry');
      }
      expanseActiveRegionId = 'my-frontier';
      setCurrentWorld('my-frontier', { reason: 'direct-my-frontier-entry' });
      beginObservedWorldPerformanceSession('my-frontier', 'direct-my-frontier-entry');
      playerAnchor.position.set(entry.target.x, entry.target.y, entry.target.z);
      playerAnchor.rotation.y = entry.target.heading;
      cameraMode = 'expanse-follow';
      camera.alpha = Math.PI; camera.beta = 1.08; camera.radius = 20;
      camera.setTarget(new Vector3(entry.target.x, 1.7, entry.target.z - 14));
      expanseState = freeze({ ...expanseState, safePosition: freeze({ x: entry.target.x, y: entry.target.y, z: entry.target.z }), updatedAt: Date.now() });
      expansePersistence.write(expanseState);
      expanseOnboardingState = expanseOnboarding.end('direct-my-frontier-entry');
      expanseUiOverlay.updateOnboarding?.(expanseOnboardingState);
      expanseZoneArrival.reset('direct-my-frontier-entry');
      expanseUiOverlay.showArrival?.({ title: 'MY FRONTIER', network: 'Personal frontier online', detail: 'Walk to a plot → E / tap Use → choose a building → Plan · EONBOT is always one tap away' });
      myFrontierEntryAwaitingFirstFrame = true;
      recordMyFrontierEntryDiagnostic('scene-prepared', { ok: true, detail: 'awaiting-first-rendered-frame' });
      onStatus?.('My Frontier active from starter access. No Signal completion, XP, campaign receipt or construction permit was granted by travel.');
      return freeze({ ok: true, directOpenWorldEntry: true, target: entry.target, campaignCompletionRequired: false, grantsXp: false, grantsConstructionPermit: false, automaticMovement: false });
    },
    enterStormSector({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      // A World selector can be opened while another World is visibly active.
      // Reconcile only a proven mounted World before deciding whether a fresh
      // Hub entry is required; otherwise My Frontier would be left on screen
      // while Storm tries to restart the Hub-only review path.
      if (expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE' && ['signal-frontier', 'my-frontier', 'storm-sector'].includes(String(expanseActiveRegionId || ''))) {
        const reconciled = reconcileMountedWorldAuthority('storm-sector-entry');
        if (!reconciled.ok && expanseWorldMode.getState().mode !== 'COMMAND_HUB') return reconciled;
      }
      const availability = this.getOpenWorldAvailability();
      if (availability.stormSector.available !== true) {
        updateStormEntryConfirmation({ status: 'failed', requestedRegionId: 'storm-sector', preparedRegionId: '', confirmedRegionId: '', expectedActivationId: '', actualActivationId: '', firstPlayableFrame: false, failureReason: availability.stormSector.reason || 'storm-sector-unavailable', startedAt: now(), confirmedAt: 0 });
        return freeze({ ok: false, reason: availability.stormSector.reason, certificationBypassed: false, signalCampaignCompletionRequired: false });
      }
      if (expanseActiveRegionId === 'storm-sector' && expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE') {
        updateStormEntryConfirmation({ status: 'first-playable', requestedRegionId: 'storm-sector', preparedRegionId: 'storm-sector', confirmedRegionId: 'storm-sector', expectedActivationId: availability.stormSector.activationId || '', actualActivationId: availability.stormSector.activationId || '', firstPlayableFrame: true, failureReason: '', confirmedAt: Date.now() });
        return freeze({ ok: true, reason: 'already-in-storm-sector', directOpenWorldEntry: true, requestedRegionId: 'storm-sector', confirmedActiveRegionId: 'storm-sector', firstPlayableFrame: true });
      }
      stormEntryAwaitingFirstFrame = false;
      updateStormEntryConfirmation({ status: 'requested', requestedRegionId: 'storm-sector', preparedRegionId: '', confirmedRegionId: '', expectedActivationId: availability.stormSector.activationId || '', actualActivationId: '', firstPlayableFrame: false, failureReason: '', startedAt: now(), confirmedAt: 0 });
      if (expanseWorldMode.getState().mode !== 'EXPANSE_ACTIVE') {
        // The Open Storm control itself is an explicit review action. Prepare the
        // maintained review-gated Expanse authority before entering its canonical
        // scene; otherwise a fresh Hub -> Storm click fails as gateway-review-required.
        if (expanseWorldMode.getState().mode === 'COMMAND_HUB') {
          const reviewed = expanseWorldMode.review({ explicitUserAction: true });
          if (!reviewed.ok) {
            updateStormEntryConfirmation({ status: 'failed', failureReason: reviewed.reason || 'storm-sector-review-failed' });
            return freeze({ ...reviewed, directOpenWorldEntry: false, signalCampaignCompletionRequired: false });
          }
        }
        const entered = runtime.enterExpanse({ explicitUserAction: true });
        if (!entered.ok) {
          updateStormEntryConfirmation({ status: 'failed', failureReason: entered.reason || 'storm-sector-signal-bootstrap-failed' });
          return freeze({ ...entered, directOpenWorldEntry: false, signalCampaignCompletionRequired: false });
        }
      }
      const runtimeStormActivation = getStormSectorRuntimeActivation();
      expanseStormSectorJourney.syncActivation(runtimeStormActivation);
      const started = expanseStormSectorJourney.startEnter({ explicitUserAction: true, expectedActivationId: availability.stormSector.activationId });
      if (started.ok) {
        updateStormEntryConfirmation({ status: 'transitioning', actualActivationId: started.activationId || '', failureReason: '' });
        expanseOnboardingState = expanseOnboarding.end('direct-storm-entry');
        expanseUiOverlay.updateOnboarding?.(expanseOnboardingState);
        onStatus?.(availability.stormSector.ownerReview === true
          ? 'OWNER REVIEW · Storm Sector transit is charging. Arrival will be confirmed only after its first playable frame.'
          : 'Storm Sector transit is charging. Arrival will be confirmed only after its first playable frame.');
      } else updateStormEntryConfirmation({ status: 'failed', failureReason: started.reason || 'storm-sector-transition-start-failed' });
      return freeze({ ...started, directOpenWorldEntry: false, transitionStarted: started.ok === true, requestedRegionId: 'storm-sector', confirmedActiveRegionId: '', firstPlayableFrame: false, ownerReview: availability.stormSector.ownerReview === true, certificationBypassed: false, signalCampaignCompletionRequired: false, grantsXp: false, persistsActivation: availability.stormSector.reviewOnly !== true });
    },
    reviewExpanseEntry({ explicitUserAction = false } = {}) { const result = expanseWorldMode.review({ explicitUserAction }); if (result.ok) expanseMissionRuntime.recordSignal('expanse-reviewed', { receiptId: 'expanse:reviewed' }); return result; },
    cancelExpanseEntry({ explicitUserAction = false } = {}) { return expanseWorldMode.cancelReview({ explicitUserAction }); },
    enterExpanse({ explicitUserAction = false, starterAccess = false } = {}) {
      const snapshot = createEonCityW766AReturnSnapshot({
        player: { position: playerAnchor.position, heading: playerAnchor.rotation.y },
        camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: camera.target, mode: cameraMode },
        selectedWorkspace: activeStationId || '', missionState: missionsProgression.getView?.() || null,
        inputState: { source: 'w766a-expanse-entry' }, graphicsProfile: resolvedQuality
      });
      const begin = starterAccess
        ? expanseWorldMode.beginStarterEntry({ snapshot, explicitUserAction })
        : expanseWorldMode.beginEntry({ snapshot, explicitUserAction });
      if (!begin.ok) return begin;
      clearInput('w766a-expanse-entry');
      expanseActiveRegionId = 'signal-frontier';
      setCurrentWorld('signal-frontier', { reason: 'expanse-entry' });
      expanseMyFrontierRenderer?.deactivate?.();
      expanseWorldMode.reportLoading(0.25);
      world.root.setEnabled(false);
      playerAnchor.setEnabled(false);
      eonbotAnchor.setEnabled(false);
      expanseWorldMode.reportLoading(0.7);
      const mounted = expanseGateway.activate();
      // Signal Frontier entry must not eagerly mount/activate My Frontier.
      // The Build world is created only after explicit My Frontier selection.
      if (mounted.ok) expanseRuntimeHealth.mount({ observers: 3 });
      if (!mounted.ok || !mounted.mountedInCanonicalScene) {
        world.root.setEnabled(true); playerAnchor.setEnabled(true); eonbotAnchor.setEnabled(true);
        expanseGateway.deactivate();
        expanseUiOverlay.resetWorldPresentation?.({ reason: 'gateway-canonical-mount-failed' });
        expanseRuntimeHealth.transitionFailure('gateway-canonical-mount-failed');
        if (mounted.ok) expanseRuntimeHealth.dispose({ observers: 3 });
        return expanseWorldMode.failSafeToHub('gateway-canonical-mount-failed');
      }
      playerAnchor.position.set(expanseState.safePosition.x, expanseState.safePosition.y, expanseState.safePosition.z);
      playerAnchor.setEnabled(true);
      camera.setTarget(new Vector3(0, 2.2, -8)); camera.alpha = Math.PI; camera.beta = 1.08; camera.radius = 24; cameraMode = 'expanse-arrival';
      expanseWorldMode.reportLoading(1);
      const activated = expanseWorldMode.activate({ mountedInCanonicalScene: true });
      ui?.setWorldMode?.('EXPANSE_ACTIVE');
      expanseUiOverlay.updateLabels?.([]);
      expanseGuideState = expanseGuideController.cancel('expanse-entry').state;
      expanseLostAssistanceState = expanseLostAssistance.reset('expanse-entry', { at: Date.now() }).state;
      expanseCompanionBehaviorState = expanseCompanionBehavior.cancel('expanse-entry').state;
      expanseCompanionBehaviorCandidates = freeze([]);
      lastExpanseCompanionCandidateRefreshAt = 0;
      expansePersistence.write(expanseState);
      expanseMissionRuntime.recordSignal('expanse-entered', { receiptId: 'expanse:first-entry' });
      expanseMissionRuntime.recordSignal('companion-signal-detected', { receiptId: 'expanse:companion-signal-detected' });
      expanseObjectiveFeedback.reset(buildEonExpanseW766EMissionBoard(expanseMissionRuntime.getState()), 'expanse-entry');
      expanseRestorationAudioCues.reset(deriveEonExpanseW773AZoneRestorationBoard(getExpanseWorldProgress()));
      syncExpanseCompanionState();
      expanseOnboardingState = expanseOnboarding.begin({ companion: expanseCompanionState, guidance: expanseGuidance, expanseActive: true });
      expanseUiOverlay.updateOnboarding?.(expanseOnboardingState);
      eonbotAnchor.position.set(EON_EXPANSE_W767A_RESCUE_POSE.x, EON_EXPANSE_W767A_RESCUE_POSE.y, EON_EXPANSE_W767A_RESCUE_POSE.z);
      eonbotAnchor.rotation.y = EON_EXPANSE_W767A_RESCUE_POSE.heading;
      eonbotAnchor.setEnabled(expanseCompanionState.visible);
      expanseZoneArrival.reset('expanse-entry');
      expanseZoneArrival.markAnnounced('gateway-overlook');
      expanseUiOverlay.showArrival?.({ title: 'SIGNAL FRONTIER', network: 'Regional network: 8% online', detail: expanseCompanionState.bonded ? 'Follow the highlighted objective → E / tap Use at the field target' : 'Approach the dormant EONBOT signal → E / tap Use to begin recovery' });
      expanseAudio.start({ explicitUserAction: true });
      expanseAudio.applyPresentation(expansePresentation);
      expanseVisuals.activate(expansePresentation);
      onStatus?.(expanseCompanionState.bonded ? 'Signal Frontier active. EONBOT is linked; meet Pathfinder at Gateway Overlook.' : 'Signal Frontier active. Follow the pulsing signal and recover EONBOT.');
      if (!starterAccess) beginObservedWorldPerformanceSession('signal-frontier', 'expanse-entry');
      return freeze({ ...activated, map: createEonExpanseW766AMapView(expanseState), gateway: expanseGateway.getSummary(), companion: expanseCompanionState });
    },
    returnFromExpanse({ explicitUserAction = false } = {}) {
      let currentWorldMode = expanseWorldMode.getState();
      if (explicitUserAction && currentWorldMode.mode !== 'EXPANSE_ACTIVE') {
        const reconciled = reconcileMountedWorldAuthority('return-to-command-hub');
        if (reconciled.ok) currentWorldMode = expanseWorldMode.getState();
        else if (currentWorldMode.mode !== 'COMMAND_HUB') return reconciled;
      }
      if (explicitUserAction && currentWorldMode.mode === 'COMMAND_HUB') {
        setCurrentWorld('command-hub', { reason: 'idempotent-command-hub-return' });
        // Idempotent cleanup protects against a stale/replayed UI event without
        // surfacing expanse-not-active to the player.
        expanseUiOverlay.resetWorldPresentation?.({ reason: 'idempotent-command-hub-return' });
        return freeze({ ok: true, reason: 'already-in-command-hub', alreadyReturned: true, state: currentWorldMode });
      }
      const requested = expanseWorldMode.requestReturn({ explicitUserAction });
      if (!requested.ok) return requested;
      const returningWorldPerformanceRegionId = String(expanseActiveRegionId || 'signal-frontier');
      if (returningWorldPerformanceRegionId === 'storm-sector') {
        stormEntryAwaitingFirstFrame = false;
        updateStormEntryConfirmation({ status: 'returned-to-command-hub', preparedRegionId: '', confirmedRegionId: '', firstPlayableFrame: false, failureReason: '' });
      }
      clearInput('w766a-return-to-hub');
      expanseTransit.cancel?.({ explicitUserAction: true });
      if (shouldClearEonExpanseW767VActivityGuidance({ reason: 'return-to-command-hub', activityObjective: expanseActivityGuidance?.objective })) expanseActivityGuidance = null;
      expanseGuidance = buildCurrentExpanseGuidance();
      expanseGuideState = expanseGuideController.cancel('return-to-command-hub').state;
      expanseLostAssistanceState = expanseLostAssistance.reset('return-to-command-hub', { at: Date.now() }).state;
      expanseZoneArrival.reset('return-to-command-hub');
      expanseObjectiveFeedback.reset(null, 'return-to-command-hub');
      expanseRestorationAudioCues.reset(deriveEonExpanseW773AZoneRestorationBoard(getExpanseWorldProgress()));
      expanseMyFrontierCapture.reset('return-to-command-hub');
      expanseStormSectorCapture.reset('return-to-command-hub');
      expanseCompanionBehaviorState = expanseCompanionBehavior.cancel('return-to-command-hub').state;
      expanseCompanionBehaviorCandidates = freeze([]);
      lastExpanseCompanionCandidateRefreshAt = 0;
      expanseWorldAssetRecoveryState = expanseAssetRecovery.cancel('return-to-command-hub', { expanseActive: false, at: Date.now() }).state;
      expanseCompositionRecoveryState = expanseCompositionRecovery.cancel('return-to-command-hub', { expanseActive: false, at: Date.now() }).state;
      expanseAssetRecoveryState = combineExpanseAssetRecoveryState(expanseWorldAssetRecoveryState, expanseCompositionRecoveryState, { expanseActive: false });
      expanseUiOverlay.updateAssetRecovery?.(expanseAssetRecoveryState);
      cancelActiveExpanseTransit('return-to-command-hub');
      expanseState = freeze({ ...expanseState, safePosition: freeze({ x: playerAnchor.position.x, y: playerAnchor.position.y, z: playerAnchor.position.z }), updatedAt: Date.now() });
      expansePersistence.write(expanseState);
      // RT92 forensic repair: retire every world-only DOM presentation before
      // the Command Hub root is re-enabled. This makes Hub and Open World UI
      // mutually exclusive even if a prior Signal/Storm callback fires late.
      const worldPresentationReset = expanseUiOverlay.resetWorldPresentation?.({ reason: 'return-to-command-hub' }) || freeze({ ok: true, reason: 'overlay-reset-unavailable' });
      expanseMyFrontierRenderer?.deactivate?.();
      if (expanseActiveRegionId === 'storm-sector') {
        expanseStormSectorInteractions?.apply?.({ regionActive: false });
        expanseStormSectorNpcs?.apply?.({ regionActive: false });
        expanseStormSectorTransit.cancel({ explicitUserAction: true, reason: 'return-to-command-hub' });
        expanseStormSectorTransitPresenter?.apply?.({ regionActive: false });
        expanseStormSectorTransformations?.apply?.({ regionActive: false });
        expanseStormSectorCapture.reset('return-to-command-hub');
        expanseStormSectorPresenter?.suspend?.();
        expanseStormSectorJourney.reset({ explicitUserAction: true });
      }
      expanseActiveRegionId = 'signal-frontier';
      expanseGateway.deactivate();
      finishObservedWorldPerformanceSession(returningWorldPerformanceRegionId, 'return-to-command-hub');
      expanseAudio.suspend('return-to-command-hub');
      expanseVisuals.deactivate();
      expanseRuntimeHealth.dispose({ observers: 3 });
      const restoring = expanseWorldMode.beginHubRestore({ expanseSuspended: true });
      if (!restoring.ok) return restoring;
      world.root.setEnabled(true); eonbotAnchor.setEnabled(true); playerAnchor.setEnabled(true);
      const snapshot = expanseWorldMode.getState().returnSnapshot;
      if (snapshot?.player?.position) playerAnchor.position.set(snapshot.player.position.x, snapshot.player.position.y, snapshot.player.position.z);
      playerAnchor.rotation.y = Number(snapshot?.player?.heading || 0);
      if (snapshot?.camera) {
        camera.alpha = snapshot.camera.alpha; camera.beta = snapshot.camera.beta; camera.radius = snapshot.camera.radius;
        camera.setTarget(new Vector3(snapshot.camera.target.x, snapshot.camera.target.y, snapshot.camera.target.z));
        const restoredMode = String(snapshot.camera.mode || 'follow');
        cameraMode = restoredMode.startsWith('expanse-') ? 'follow' : restoredMode;
      } else cameraMode = 'follow';
      const completed = expanseWorldMode.completeHubRestore({ snapshotRestored: true });
      setCurrentWorld('command-hub', { reason: 'return-to-command-hub' });
      syncExpanseCompanionState();
      ui?.setWorldMode?.('COMMAND_HUB');
      expanseOnboardingState = expanseOnboarding.end('returned-to-command-hub');
      expanseUiOverlay.updateOnboarding?.(expanseOnboardingState);
      const missionReturn = expanseMissionRuntime.recordSignal('command-hub-returned', { receiptId: 'campaign:return-command-hub' });
      onStatus?.(missionReturn.ok ? 'Returned safely. Confirm the completed expedition on the Mission Board.' : 'Returned safely to the Command Hub. Expanse progress was saved locally.');
      return freeze({ ...completed, missionReturn, worldPresentationReset });
    },
    getExplorationPose() { return freeze({ x: playerAnchor.position.x, y: 0, z: playerAnchor.position.z, heading: playerAnchor.rotation.y }); },
    restoreExplorationPose(pose = {}) { applyPlayerPose(pose, { stationId: activeStationId }); return true; },
    resumeLocation,
    resetView,
    openCityMenu(trigger = null) { ui?.openMenu?.(trigger || canvas); return freeze({ ok: true, explicitUserAction: true }); },
    closeCityMenu() { ui?.closeMenu?.(); return freeze({ ok: true }); },
    cycleWayfinderCamera() { cameraMode = 'follow'; camera.alpha += Math.PI / 4; camera.setTarget(new Vector3(playerAnchor.position.x, EON_CITY_W747_CAMERA_POSES.follow.targetHeight, playerAnchor.position.z)); return freeze({ id: 'orbit', alpha: camera.alpha }); },
    getWayfinderSummary() { return freeze({ id: 'orbit', alpha: camera.alpha, beta: camera.beta, radius: camera.radius }); },
    resetWayfinderCamera() {
      applyCameraPose(EON_CITY_W747_CAMERA_POSES.return, 'return');
      applyCameraPose(EON_CITY_W760_CAMERA_POSES.return, 'return');
      return freeze({ ok: true, obstructionClearance: arrivalCameraValidation.minimumClearance });
    },
    requestWayfinderState() { return freeze({ ok: true, camera: this.getWayfinderSummary() }); },
    setCinematicShot() { return freeze({ ok: false, reason: 'manual-camera-only' }); },
    setOpenSkyProfile(profile = 'dusk', { explicitUserAction = false } = {}) { return this.setEnvironmentProfile({ timeProfile: profile }, { explicitUserAction }); },
    setAgentPresence() { return freeze({ ok: false, reason: 'real-task-state-only' }); },
    setCompanionIntent() {
      return freeze({
        ok: true,
        companion: 'eonbot',
        presentation: 'w745-curiosity-director',
        current: heroPresentationSnapshot,
        localVisualOnly: true,
        automaticStationActivation: false,
        autonomousAgent: false
      });
    },
    setEonbotOrbitPresentation() {
      return freeze({
        ok: true,
        companion: 'eonbot',
        presentation: 'w745-curiosity-director',
        simpleOrbitRetired: true,
        current: heroPresentationSnapshot,
        localVisualOnly: true
      });
    },
    setOptionalAssetAdmission(options = {}) {
      pendingOptionalAssetAdmission = freeze({
        pressure: String(options.pressure || 'nominal'),
        visibility: String(options.visibility || globalThis.document?.visibilityState || 'visible'),
        reason: String(options.reason || 'universal-workload-governor').slice(0, 120)
      });
      const commandHubAdmission = localAssetRuntime?.setOptionalAdmission?.(pendingOptionalAssetAdmission)
        || freeze({ ok: true, pending: true, admission: pendingOptionalAssetAdmission, reason: 'asset-runtime-not-ready' });
      const myFrontierAdmission = myFrontierOptionalAssetsHeldForFirstFrame
        ? freeze({ ok: true, pending: true, reason: 'my-frontier-first-frame-gate', admission: pendingOptionalAssetAdmission })
        : expanseMyFrontierRenderer?.setOptionalAssetAdmission?.(pendingOptionalAssetAdmission) || null;
      const stormAdmission = expanseStormSectorPresenter?.setOptionalAssetAdmission?.(pendingOptionalAssetAdmission) || null;
      const stormNpcAdmission = expanseStormSectorNpcs?.setOptionalAssetAdmission?.(pendingOptionalAssetAdmission) || null;
      return freeze({ ...commandHubAdmission, myFrontier: myFrontierAdmission, storm: stormAdmission, stormNpcs: stormNpcAdmission });
    },
    applyWorkloadProtection(reason = 'manual') { return applyPerformanceProtection(reason); },
    unstuck() {
      clearInput('manual-unstuck');
      const resolved = findEonCityW765R6NearestSafePosition(playerAnchor.position, playerCollisionZones, {
        fallback: EON_CITY_W731_SPAWN,
        worldRadius: EON_CITY_W731_WORLD_BOUNDS.safetyRadius
      });
      if (!resolved.ok) return freeze({ ok: false, reason: resolved.reason || 'safe-position-unavailable' });
      playerAnchor.position.set(resolved.position.x, 0, resolved.position.z);
      cameraMode = 'follow';
      camera.setTarget(new Vector3(playerAnchor.position.x, EON_CITY_W747_CAMERA_POSES.follow.targetHeight, playerAnchor.position.z));
      writeResume(playerAnchor.position, playerAnchor.rotation.y, activeStationId);
      productRoot.dataset.eonCityLastUnstuckReason = String(resolved.reason || 'nearest-safe-position');
      onTelemetry?.(freeze({ type: 'rt96-player-unstuck', reason: resolved.reason, distance: resolved.distance }));
      return freeze({ ok: true, recovered: resolved.recovered, reason: resolved.reason, position: freeze({ x: resolved.position.x, y: 0, z: resolved.position.z }), distance: resolved.distance });
    },
    pause() { manualPaused = true; clearInput('manual-pause'); ui?.setPaused?.(true); },
    resume() { manualPaused = false; ui?.setPaused?.(inputLockManager.isMovementBlocked()); },
    isPaused() { return manualPaused || inputLockManager.isMovementBlocked(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      writeResume(playerAnchor.position, playerAnchor.rotation.y, activeStationId);
      clearInput();
      cameraOcclusion.destroy?.();
      workspacePresenter.dispose?.();
      expanseUiOverlay.dispose?.();
      expanseObjectiveMarker.dispose?.();
      cancelActiveExpanseTransit('runtime-destroyed');
      expanseTransitPresenter.dispose?.();
      expanseAudio.dispose?.();
      expanseVisuals.dispose?.();
      expanseMyFrontierRenderer?.dispose?.();
      expanseStormSectorTransit.cancel({ explicitUserAction: true, reason: 'runtime-destroyed' });
      expanseStormSectorTransitPresenter?.dispose?.();
      expanseStormSectorTransformations?.dispose?.();
      expanseStormSectorNpcs?.dispose?.();
      expanseStormSectorInteractions?.dispose?.();
      expanseStormSectorPresenter?.dispose?.();
      expanseGateway?.dispose?.();
      world.rt92CinematicVfx?.dispose?.();
      world.rt92EnvironmentalLife?.dispose?.();
      globalThis.removeEventListener?.('keydown', onKeyDown);
      if (onW749ViewChanged) globalThis.removeEventListener?.(EON_CITY_W749_VIEW_EVENT, onW749ViewChanged);
      globalThis.removeEventListener?.('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', restoreCanvasFocus);
      globalThis.removeEventListener?.('blur', onWindowBlur);
      viewportDirector.destroy?.();
      clearEonCityL95HudSafeZone({ productRoot, documentRef: document });
      globalThis.removeEventListener?.('pagehide', onPageHide);
      canvas.removeEventListener('webglcontextlost', onContextLost, false);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
      globalThis.document?.removeEventListener?.('visibilitychange', onVisibilityChange);
      scene.onPointerObservable.remove(pointerObserver);
      setContextualSelection(null);
      semanticNavigationController?.dispose?.();
      accessibleMapSurfaceRegistration?.dispose?.();
      ui.dispose();
      globalThis.removeEventListener?.(EON_CITY_R03_SURFACE_STATE_EVENT, onSurfaceState);
      surfaceShelf?.removeEventListener?.('click', onSurfaceShelfClick);
      surfaceShelf?.remove?.();
      workSurfaceRegistration?.dispose?.();
      surfaceManager.dispose?.();
      runtimeReadinessAuthority?.hide?.('runtime-destroyed');
      runtimeReadinessAuthority?.setLifecycleHandlers?.({});
      inputLockManager.dispose('runtime-destroyed');
      spatialOverlay.dispose?.();
      missionsProgression.dispose?.();
      productiveStations.dispose?.();
      for (const monitor of stationMonitors.values()) monitor.dispose?.();
      stationMonitors.clear();
      commandCentre.dispose?.();
      commandStatusController.dispose?.();
      agentTheatreController.dispose?.();
      livingNexus.dispose?.();
      rt92ArtRuntime.dispose?.();
      environmentController.dispose?.();
      reliabilityController.noteAssets(localAssetRuntime?.getSummary?.() || {});
      reliabilityController.dispose?.();
      localAssetRuntime?.dispose?.();
      movementRenderRecovery?.destroy?.();
      try { engine.stopRenderLoop(); } catch {}
      try { scene.dispose(); } catch {}
      try { engine.dispose(); } catch {}
      if (productRoot.__eonCityCommandHubRuntime === runtime) delete productRoot.__eonCityCommandHubRuntime;
      if (globalThis.EON_CITY_COMMAND_HUB_RUNTIME === runtime) delete globalThis.EON_CITY_COMMAND_HUB_RUNTIME;
    }
  });

  productRoot.__eonCityCommandHubRuntime = runtime;
  globalThis.EON_CITY_COMMAND_HUB_RUNTIME = runtime;
  return runtime;
}
