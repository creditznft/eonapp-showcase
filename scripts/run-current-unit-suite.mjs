#!/usr/bin/env node
/**
 * W624D-stable / W734-current product unit suite.
 *
 * This is intentionally explicit. The historical report remains available
 * as `test:unit:archived-diagnostic` for archaeology and migration review, but
 * it must not certify retired token, payout, reward, prefilled-market, or
 * old-dashboard contracts as current EONAPP behavior.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS } from '../config/w393a-lean-handover-integrity-contract.mjs';
import { W624D_ARCHIVED_CONTRACT_ASSERTIONS } from '../config/w624d-current-contract-alignment-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W721_SUPERSEDED_LAUNCH_TESTS = Object.freeze(JSON.parse(
  fs.readFileSync(path.join(root, 'config', 'archive', 'w721-superseded-launch-tests.json'), 'utf8')
).testFiles || []);
const CANDIDATE_UNIT_TESTS = Object.freeze([
  'tests/unit/w720-source-authority.test.mjs',
  'tests/unit/w721-product-reset-contract.test.mjs',
  'tests/unit/w722-theme-system.test.mjs',
  'tests/unit/w723-shell-route-reset.test.mjs',
  'tests/unit/w724-quick-command-surface.test.mjs',
  'tests/unit/w725-shared-work-surface.test.mjs',
  'tests/unit/w726-w727-productivity-simplification.test.mjs',
  'tests/unit/w728-share-capture-plans.test.mjs',
  'tests/unit/w729-help-settings-profile.test.mjs',
  'tests/unit/w730-my-realm-templates.test.mjs',
  'tests/unit/w731-city-runtime-consolidation.test.mjs',
  'tests/unit/w732-command-atrium.test.mjs',
  'tests/unit/w733-functional-stations.test.mjs',
  'tests/unit/w734-city-characters-polish.test.mjs',
  'tests/unit/w759r1-city-functional-hotfix.test.mjs',
  'tests/unit/w63-signed-share-link.test.mjs',
  'tests/unit/w145-update-safe-user-data-survival.test.mjs',
  'tests/unit/w517-source-convergence.test.mjs',
  'tests/unit/w518-workspace-capsule.test.mjs',
  'tests/unit/w519-legacy-transport-quarantine.test.mjs',
  'tests/unit/w520-core-modularisation.test.mjs',
  'tests/unit/w521-eon-city-source-engineering.test.mjs',
  'tests/unit/w551-eon-city-exploration-pose.test.mjs',
  'tests/unit/w554-city-access-project-portals.test.mjs',
  'tests/unit/w649-eoncity-authenticated-entry.test.mjs',
  'tests/unit/w649-eoncity-asset-manifests.test.mjs',
  'tests/unit/w649-eoncity-controllable-core.test.mjs',
  'tests/unit/w649-eoncity-district-runtime.test.mjs',
  'tests/unit/w649-eoncity-performance-profile.test.mjs',
  'tests/unit/w649-eoncity-build-emission.test.mjs',
  'tests/unit/w649-eoncity-asset-acceptance.test.mjs',
  'tests/unit/w649-eoncity-preview-evidence-bridge.test.mjs',
  'tests/unit/w650-eoncity-cache-update-safety.test.mjs',
  'tests/unit/w651-eoncity-visual-integration.test.mjs',
  'tests/unit/w652-eoncity-entry-first-impression.test.mjs',
  'tests/unit/w653-eoncity-control-workspace.test.mjs',
  'tests/unit/w654-eoncity-technical-update-red-team.test.mjs',
  'tests/unit/w654-eoncity-grand-ceo-audit.test.mjs',
  'tests/unit/w655-eoncity-executive-certification.test.mjs',
  'tests/unit/w659f-eoncity-functional-integration.test.mjs',
  'tests/unit/w659g-productive-city.test.mjs',
  'tests/unit/w659g-google-signin-referral.test.mjs',
  'tests/unit/w659h-final-reaudit.test.mjs',
  'tests/unit/w659n-productive-city-integration.test.mjs',
  'tests/unit/w554c-eon-city-client-load.test.mjs',
  'tests/unit/w555a-workload-governor.test.mjs',
  'tests/unit/w555b-third-person-controller.test.mjs',
  'tests/unit/w556-landmark-focus.test.mjs',
  'tests/unit/w557-workroom-membership-retention.test.mjs',
  'tests/unit/w558-project-mission-cards.test.mjs',
  'tests/unit/w559-city-resume-travel.test.mjs',
  'tests/unit/w560-city-ai-job-receipt.test.mjs',
  'tests/unit/w561-eonbot-companion.test.mjs',
  'tests/unit/w562-city-voice-consent.test.mjs',
  'tests/unit/w563-useful-city-work-paths.test.mjs',
  'tests/unit/w564-city-vault-reveals.test.mjs',
  'tests/unit/w565-city-fairness-safety.test.mjs',
  'tests/unit/w566-city-art-source-register.test.mjs',
  'tests/unit/w567-city-binary-pipeline.test.mjs',
  'tests/unit/w568-command-horizon-street-kit.test.mjs',
  'tests/unit/w569-city-cell-streamer.test.mjs',
  'tests/unit/w570-city-npc-archetypes.test.mjs',
  'tests/unit/w571-eonbot-rig-and-staging.test.mjs',
  'tests/unit/w572-local-soundscape-audio-policy.test.mjs',
  'tests/unit/w573-seeded-city-ambience.test.mjs',
  'tests/unit/w574-open-sky-visual-profiles.test.mjs',
  'tests/unit/w575-command-horizon-live-gameplay.test.mjs',
  'tests/unit/w576-w590-universe-completion.test.mjs',
  'tests/unit/w591-eon-city-quality-summit.test.mjs',
  'tests/unit/w522-gate-risk-convergence.test.mjs',
  'tests/unit/w524-device-pwa-evidence-rehearsal.test.mjs',
  'tests/unit/w524-portability-handover-gate.test.mjs',
  'tests/unit/w525-data-continuity-vault-profile.test.mjs',
  'tests/unit/w525a-google-drive-vault-profile.test.mjs',
  'tests/unit/w537-consumer-ux-compression.test.mjs',
  'tests/unit/w527-env-local-ai.test.mjs',
  'tests/unit/w528-machine-evidence.test.mjs',
  'tests/unit/w529-android-emulator.test.mjs',
  'tests/unit/w530-security-oauth.test.mjs',
  'tests/unit/w525b-account-vault-ux.test.mjs',
  'tests/unit/w533-domain-continuity.test.mjs',
  'tests/unit/w534-historical-documentation.test.mjs',
  'tests/unit/w535-release-truth-reaudit.test.mjs',
  'tests/unit/w536-google-drive-snapshot.test.mjs',
  'tests/unit/w180-w181-chat-first-shell.test.mjs',
  'tests/unit/w199-public-route-retirement.test.mjs',
  'tests/unit/w384-simplified-apps-hub.test.mjs',
  'tests/unit/w385-eon-forge-quick-build.test.mjs',
  'tests/unit/w386-eon-forge-developer-workspace.test.mjs',
  'tests/unit/w387-eon-forge-integrity-change-review.test.mjs',
  'tests/unit/w648-forge-ai-builder.test.mjs',
  'tests/unit/w648-forge-ai-controller.test.mjs',
  'tests/unit/w392-direct-eon-city-entry.test.mjs',
  'tests/unit/w393-command-deck.test.mjs',
  'tests/unit/w388a2-remix-cards.test.mjs',
  'tests/unit/w388a3-eonbot-shareable.test.mjs',
  'tests/unit/w395-google-identity-d1-readiness.test.mjs',
  'tests/unit/w396-update-rollback-restore.test.mjs',
  'tests/unit/w397-release-audit.test.mjs',
  'tests/unit/w400c-google-identity-entry.test.mjs',
  'tests/unit/w405-live-ux-city-rescue.test.mjs',
  'tests/unit/w406-w407-action-gateway.test.mjs',
  'tests/unit/w388b-w389-connectors-deployment.test.mjs',
  'tests/unit/w398-w399-creator-pilot-measurement.test.mjs',
  'tests/unit/w399-prelaunch-audit.test.mjs',
  'tests/unit/w209-vault-account-boundary.test.mjs',
  'tests/unit/w210-pwa-eonlite-device-readiness.test.mjs',
  'tests/unit/w212-market-stateless-links.test.mjs',
  'tests/unit/w213-calm-city-trade.test.mjs',
  'tests/unit/w375-market-intelligence.test.mjs',
  'tests/unit/w214-security-trust.test.mjs',
  'tests/unit/w215-monetization-decision.test.mjs',
  'tests/unit/w216-local-finalization.test.mjs',
  'tests/unit/w217-route-contract.test.mjs',
  'tests/unit/w218-chat-first-shell-v2.test.mjs',
  'tests/unit/w219-eonbot-local-ai-workspace.test.mjs',
  'tests/unit/w220-market-generation-vertical-slice.test.mjs',
  'tests/unit/w221-cityworldstate-2d-rpg.test.mjs',
  'tests/unit/w222-my-realm-mvp.test.mjs',
  'tests/unit/w223-invite-share-center.test.mjs',
  'tests/unit/w224-cityworldstate-3d-parity.test.mjs',
  'tests/unit/w225-account-catalog-foundations.test.mjs',
  'tests/unit/w226-commercial-decision-gate.test.mjs',
  'tests/unit/w227-release-certification.test.mjs',
  'tests/unit/w228-local-language-service.test.mjs',
  'tests/unit/w229-chat-composer-truth.test.mjs',
  'tests/unit/w230-eonbot-command-hub.test.mjs',
  'tests/unit/w231-eon-city-flagship.test.mjs',
  'tests/unit/w231-active-surface-import-fence.test.mjs',
  'tests/unit/w232-my-realm-return-loop.test.mjs',
  'tests/unit/w233-local-ai-3d-device-proof.test.mjs',
  'tests/unit/w234-referral-d1-readonly-audit.test.mjs',
  'tests/unit/w235-access-milestones-disabled.test.mjs',
  'tests/unit/w236-w237-no-go.test.mjs',
  'tests/unit/w238-legacy-consolidation.test.mjs',
  'tests/unit/w239-w240-release-foundation.test.mjs',
  'tests/unit/r4-comm01-graphite-commerce.test.mjs',
  'tests/unit/w242-active-source-quarantine.test.mjs',
  'tests/unit/w243-chat-navigation-theme.test.mjs',
  'tests/unit/w244-provider-local-ai-truth.test.mjs',
  'tests/unit/w247-economic-commercial-firewall.test.mjs',
  'tests/unit/w248-city-mode-contract.test.mjs',
  'tests/unit/w249-babylon-play-proof-spike.test.mjs',
  'tests/unit/w250-city-play-prepared-action.test.mjs',
  'tests/unit/w251-city-work-gateway.test.mjs',
  'tests/unit/w252-city-art-provenance.test.mjs',
  'tests/unit/w253-city-input-orientation-accessibility.test.mjs',
  'tests/unit/w364-babylon-immersive-controls.test.mjs',
  'tests/unit/w365-city-asset-foundation.test.mjs',
  'tests/unit/w406b-city-art-intake.test.mjs',
  'tests/unit/w407-arrival-district.test.mjs',
  'tests/unit/w408-creator-forge-district.test.mjs',
  'tests/unit/w409-living-city-systems.test.mjs',
  'tests/unit/w410-city-validation-lab.test.mjs',
  'tests/unit/w413-w414-city-expeditions-metropolis.test.mjs',
  'tests/unit/w416-city-renderer-hardening.test.mjs',
  'tests/unit/w417-city-asset-release-preflight.test.mjs',
  'tests/unit/w418-final-flagship-audit.test.mjs',
  'tests/unit/w419-city-original-vector-art.test.mjs',
  'tests/unit/w420-city-cinematic-art-direction.test.mjs',
  'tests/unit/w421-city-art-review.test.mjs',
  'tests/unit/w422-city-deep-art.test.mjs',
  'tests/unit/w426-city-motion-progression.test.mjs',
  'tests/unit/w427-babylon-direct-boot.test.mjs',
  'tests/unit/w428-one-public-city-retirement.test.mjs',
  'tests/unit/w430-authored-city-vertical-slice.test.mjs',
  'tests/unit/w431-city-quality-governor.test.mjs',
  'tests/unit/w432-city-certification-tooling.test.mjs',
  'tests/unit/w434-notification-center.test.mjs',
  'tests/unit/w435-eonbot-job-fabric.test.mjs',
  'tests/unit/w437-safe-sharing-collaboration.test.mjs',
  'tests/unit/w436-collection-eligibility.test.mjs',
  'tests/unit/w438-project-district.test.mjs',
  'tests/unit/w439-agent-signal.test.mjs',
  'tests/unit/w440-pwa-rollout.test.mjs',
  'tests/unit/w441-action-gateway-review.test.mjs',
  'tests/unit/w442-connector-consent.test.mjs',
  'tests/unit/w443-commercial-decision.test.mjs',
  'tests/unit/w444-institutional-certification.test.mjs',
  'tests/unit/commercial-retirement.test.mjs',
  'tests/unit/w449-production-cleanroom.test.mjs',
  'tests/unit/w450-dodo-approval-readiness.test.mjs',
  'tests/unit/w451-legacy-source-inventory.test.mjs',
  'tests/unit/w451-cleanup-execution-handoff.test.mjs',
  'tests/unit/w452-app-shell-quality.test.mjs',
  'tests/unit/w453-city-performance-observation.test.mjs',
  'tests/unit/w453a-production-city-edge-proof.test.mjs',
  'tests/unit/city-noir-architecture.test.mjs',
  'tests/unit/w455a-noir-world-composition.test.mjs',
  'tests/unit/w456a-noir-readable-guide-cast.test.mjs',
  'tests/unit/w457a-city-mobile-share-proof.test.mjs',
  'tests/unit/w459-pwa-recovery-rehearsal.test.mjs',
  'tests/unit/w460-eonbot-job-activity-bridge.test.mjs',
  'tests/unit/w461-telegram-research-production-proof.test.mjs',
  'tests/unit/w462-trust-accessibility-source-audit.test.mjs',
  'tests/unit/w466-production-release-evidence.test.mjs',
  'tests/unit/w467-codex-deployment-handoff.test.mjs',
  'tests/unit/w452a-active-canonical-destination.test.mjs',
  'tests/unit/w452b-production-route-emission-cleanup.test.mjs',
  'tests/unit/w450a-dodo-catalogue-envelope.test.mjs',
  'tests/unit/city-route-canonicalizer.test.mjs',
  'tests/unit/city-engine-staging.test.mjs',
  'tests/unit/city-mobile-mode.test.mjs',
  'tests/unit/w366-neon-command-district.test.mjs',
  'tests/unit/w367-spatial-command-space.test.mjs',
  'tests/unit/w368-eonbot-city-work-loop.test.mjs',
  'tests/unit/w369-adaptive-soundscape.test.mjs',
  'tests/unit/w370-my-realm-visual-profile.test.mjs',
  'tests/unit/w371-performance-lab.test.mjs',
  'tests/unit/w372-visual-certification.test.mjs',
  'tests/unit/w254-city-performance-governor.test.mjs',
  'tests/unit/w255-city-landmark-registry-parity.test.mjs',
  'tests/unit/w256-eonbot-proposals-vault-return.test.mjs',
  'tests/unit/w257-beginner-work-missions.test.mjs',
  'tests/unit/w259-city-preview-evidence.test.mjs',
  'tests/unit/w265-w286-city-district-expansion.test.mjs',
  'tests/unit/w286-b1-city-agent-presence.test.mjs',
  'tests/unit/w286-b2-live-work-command.test.mjs',
  'tests/unit/w286-b3-city-outcome-relay.test.mjs',
  'tests/unit/w281-ai-provider-lifecycle.test.mjs',
  'tests/unit/w306-local-first-boundary.test.mjs',
  'tests/unit/rt85-disabled-provider-boundary.test.mjs',
  'tests/unit/rt86-retention-notification-scale.test.mjs',
  'tests/unit/rt87-push-device-entitlement-cost-control.test.mjs',
  'tests/unit/w263-eonbot-capability-execution.test.mjs',
  'tests/unit/w264-creator-build-handoff.test.mjs',
  'tests/unit/w285-local-ai-device-support.test.mjs',
  'tests/unit/w287-eonbot-language-voice.test.mjs',
  'tests/unit/w288-creator-handoff-integrity.test.mjs',
  'tests/unit/w283-w284-cloudflare-referral-evidence.test.mjs',
  'tests/unit/w260-release-board-gate.test.mjs',
  'tests/unit/w266-visual-proof-lab.test.mjs',
  'tests/unit/w267-red-team-source-audit.test.mjs',
  'tests/unit/w268-operations-readiness.test.mjs',
  'tests/unit/w271-accessibility-i18n-source-gate.test.mjs',
  'tests/unit/w272-security-supplychain-source-gate.test.mjs',
  'tests/unit/w273-city-sensory-accessibility-source-gate.test.mjs',
  'tests/unit/w274-city-scripted-guide-source-gate.test.mjs',
  'tests/unit/w275-pwa-asset-policy.test.mjs',
  'tests/unit/w277-privacy-measurement-source-gate.test.mjs',
  'tests/unit/w280-public-support-narrative-source-gate.test.mjs',
  'tests/unit/w280-b1-local-support-evidence-pack.test.mjs',
  'tests/unit/w276-data-survival-reaudit.test.mjs',
  'tests/unit/w289-w290-external-evidence-board.test.mjs',
  'tests/unit/r3a1-ai-api-change-control.test.mjs',
  'tests/unit/w476-ai-api-and-local-browser-contract.test.mjs',
  'tests/unit/w476-b-production-proof.test.mjs',
  'tests/unit/w477-route-seo-legacy.test.mjs',
  'tests/unit/w478-experience-identity-device.test.mjs',
  'tests/unit/w479m-creator-distribution-contract.test.mjs',
  'tests/unit/w479v-eonbot-voice.test.mjs',
  'tests/unit/w479p-universal-manual-post.test.mjs',
  'tests/unit/w486-evidence-freshness.test.mjs',
  'tests/unit/w487-institutional-code-closure.test.mjs',
  'tests/unit/r3a2-lighthouse-static-server.test.mjs',
  'tests/unit/r3a2-all-public-routes-static-gate.test.mjs',
  'tests/unit/r3a3-referral-milestone-cloudflare.test.mjs',
  'tests/unit/r3-f1-physical-source-reduction.test.mjs',
  'tests/unit/w217-r1-cumulative-handoff.test.mjs',
  'tests/unit/w612-build-provenance.test.mjs',
  'tests/unit/w613-eon-city-final-red-team.test.mjs',
  'tests/unit/w592-eon-city-flagship-red-team.test.mjs',
  'tests/unit/w623a-comfyui-local-image.test.mjs',
  'tests/unit/w623-ceo-grand-audit.test.mjs',
  'tests/unit/w623c-canonical-commercial-truth.test.mjs',
  'tests/unit/w621-live-dodo-cloudflare-rollout.test.mjs',
  'tests/unit/w623d-production-reachability.test.mjs',
  'tests/unit/w623e-information-architecture.test.mjs',
  'tests/unit/w623f-multilingual-routing.test.mjs',
  'tests/unit/w623f-core-language-copy.test.mjs',
  'tests/unit/w623h-minimal-referral-ledger.test.mjs',
  'tests/unit/w623i-referral-scale.test.mjs',
  'tests/unit/w624a-city-art-bible.test.mjs',
  'tests/unit/w624b-city-runtime-consolidation.test.mjs',
  'tests/unit/w624c-command-district-vertical-slice.test.mjs',
  'tests/unit/w624d-wayfinder-camera.test.mjs',
  'tests/unit/w624d-current-contract-alignment.test.mjs',
  'tests/unit/w624d-test-archive.test.mjs',
  'tests/unit/w624e-eonbot-orbit.test.mjs',
  'tests/unit/w624f-command-district-npc-system.test.mjs',
  'tests/unit/w624g-productive-rpg-loop.test.mjs',
  'tests/unit/w624h-truthful-command-center.test.mjs',
  'tests/unit/w624i-genuine-agent-theatre.test.mjs',
  'tests/unit/w624j-sharing-center.test.mjs',
  'tests/unit/w624k-accessibility-device.test.mjs',
  'tests/unit/w624l-flagship-certification.test.mjs',
  'tests/unit/w625a-real-local-image-tooling.test.mjs',
  'tests/unit/w625b-local-image-workflow-registry.test.mjs',
  'tests/unit/w625c-image-creation-foundation.test.mjs',
  'tests/unit/w625d-local-video-capability.test.mjs',
  'tests/unit/w625e-real-local-video-contract.test.mjs',
  'tests/unit/w625f-local-video-product-workflow.test.mjs',
  'tests/unit/w625g-local-video-efficiency-governor.test.mjs',
  'tests/unit/w625h-local-creator-certification.test.mjs',
  'tests/unit/w626a-direct-job-threat-model.test.mjs',
  'tests/unit/w626b-creator-companion.test.mjs',
  'tests/unit/w626c-external-image-adapters.test.mjs',
  'tests/unit/w626d-external-video-adapters.test.mjs',
  'tests/unit/w626e-unified-direct-job-fabric.test.mjs',
  'tests/unit/w626f-mobile-secure-path.test.mjs',
  'tests/unit/w626g-direct-spending-safety.test.mjs',
  'tests/unit/w626h-byok-privacy-certification.test.mjs',
  'tests/unit/w627a-one-create-experience.test.mjs',
  'tests/unit/w627b-beginner-advanced-mode.test.mjs',
  'tests/unit/w627c-unified-creator-lifecycle.test.mjs',
  'tests/unit/w627d-creator-library.test.mjs',
  'tests/unit/w627e-project-continuation.test.mjs',
  'tests/unit/w627f-creator-data-survival.test.mjs',
  'tests/unit/w627g-unified-creator-certification.test.mjs',
  'tests/unit/w628a-real-dodo-checkout.test.mjs',
  'tests/unit/w628b-provider-webhook-ledger.test.mjs',
  'tests/unit/w628c-entitlement-activation.test.mjs',
  'tests/unit/w628d-portal-cancellation.test.mjs',
  'tests/unit/w628e-failure-reversal.test.mjs',
  'tests/unit/w628f-billing-certification.test.mjs',
  'tests/unit/w629a-signed-referral-attribution.test.mjs',
  'tests/unit/w629b-qualification-events.test.mjs',
  'tests/unit/w629c-eonkey-grant-ledger.test.mjs',
  'tests/unit/w629d-referral-reversal.test.mjs',
  'tests/unit/w629e-feature-unlock-redemption.test.mjs',
  'tests/unit/w629f-referral-key-ux.test.mjs',
  'tests/unit/w629g-vault-reveal-integration.test.mjs',
  'tests/unit/w629h-referral-red-team-certification.test.mjs',
  'tests/unit/w630-whole-app-ux.test.mjs',
  'tests/unit/w631-project-workspace-forge-automation.test.mjs',
  'tests/unit/w632-account-vault-custody.test.mjs',
  'tests/unit/w633-every-route-audit.test.mjs',
  'tests/unit/w634-responsive-accessibility-input.test.mjs',
  'tests/unit/w635-performance-cache-update-safety.test.mjs',
  'tests/unit/w636-security-privacy-abuse.test.mjs',
  'tests/unit/w637-persistence-migration-recovery.test.mjs',
  'tests/unit/w638-evidence-convergence.test.mjs',
  'tests/unit/w639-production-rehearsal-freeze.test.mjs',
  'tests/unit/w660-nexus-state-contract.test.mjs',
  'tests/unit/w660-nexus-privacy-projection.test.mjs',
  'tests/unit/w660-nexus-event-adapter.test.mjs',
  'tests/unit/w660b1-eon-nexus-pulse.test.mjs',
  'tests/unit/w660b2-eon-nexus-pulse-motion.test.mjs',
  'tests/unit/w660c-live-nexus.test.mjs',
  'tests/unit/w660d-project-atlas.test.mjs',
  'tests/unit/w660e-product-adapters.test.mjs',
  'tests/unit/w660f-city-nexus.test.mjs',
  'tests/unit/w660g-app-shell-nexus.test.mjs',
  'tests/unit/w660h-chat-shell-page-nexus.test.mjs',
  'tests/unit/w660n-eon-nexus-end-to-end.test.mjs',
  'tests/unit/w660o-nexus-launch-continuity.test.mjs',
  'tests/unit/w660p-living-nexus-hybrid.test.mjs',
  'tests/unit/w660r-living-nexus-expanse-renderer.test.mjs',
  'tests/unit/w660s-living-nexus-functional-encounters.test.mjs',
  'tests/unit/w660t-living-nexus-atlas-return.test.mjs',
  'tests/unit/w660u-living-nexus-world-systems.test.mjs',
  'tests/unit/w660v-curated-nexus-realms.test.mjs',
  'tests/unit/w660w-curated-realm-atlas.test.mjs',
  'tests/unit/w660x-premium-nexus-realms.test.mjs',
  'tests/unit/w660y-connected-core.test.mjs',
  'tests/unit/w660z-living-nexus-institutional.test.mjs',
  'tests/unit/w661d-nexus-convergence.test.mjs',
  'tests/unit/w660-city-completion-matrix.test.mjs',
  'tests/unit/w660i-eoncity-visual-rescue.test.mjs',
  'tests/unit/w662-implementation-exposure-ledger.test.mjs',
  'tests/unit/w662-camera-relative-movement.test.mjs',
  'tests/unit/w662c-nexus-continuity.test.mjs',
  'tests/unit/w662d-live-nexus-recovery.test.mjs',
  'tests/unit/w662e-project-atlas-spatial.test.mjs',
  'tests/unit/w662f-physical-living-nexus-gateway.test.mjs',
  'tests/unit/w662g-cast-certification.test.mjs',
  'tests/unit/w662h-whole-app-reconciliation.test.mjs',
  'tests/unit/w662i-local-release-candidate.test.mjs',
  'tests/unit/w664-input-interaction-authority.test.mjs',
  'tests/unit/w665-seamless-core-transition.test.mjs',
  'tests/unit/w666-functional-resident-program.test.mjs',
  'tests/unit/w666b-complete-asset-function-registry.test.mjs',
  'tests/unit/w667-expanse-streaming.test.mjs',
  'tests/unit/w667b-infinite-world-grammar.test.mjs',
  'tests/unit/w668-flagship-living-nexus.test.mjs',
  'tests/unit/w668b-simple-nexus-atlas-ux.test.mjs',
  'tests/unit/w668c-world-first-living-nexus.test.mjs',
  'tests/unit/w669-flagship-release-gate.test.mjs',
  'tests/unit/w670-final-reconciliation.test.mjs',
  'tests/unit/w671-owner-repair-and-atlas.test.mjs',
  'tests/unit/w672-morphic-command-field.test.mjs',
  'tests/unit/w673-hybrid-metropolis-plan.test.mjs',
  'tests/unit/w674-orientation-district-belt.test.mjs',
  'tests/unit/w675-orientation-belt-activation.test.mjs',
  'tests/unit/w676-orientation-resident-coherence.test.mjs',
  'tests/unit/w677-transit-capsule-journey.test.mjs',
  'tests/unit/w678-expanse-threshold.test.mjs',
  'tests/unit/w679-eonbot-curiosity.test.mjs',
  'tests/unit/w680-orientation-productive-loop.test.mjs',
  'tests/unit/w681-expanse-macro-regions.test.mjs',
  'tests/unit/w682-expanse-population.test.mjs',
  'tests/unit/w683-morphic-field-renderer.test.mjs',
  'tests/unit/w684-multimodal-controls.test.mjs',
  'tests/unit/w685-spatial-project-atlas.test.mjs',
  'tests/unit/w686-nexus-city-work-object-continuity.test.mjs',
  'tests/unit/w687-district-belt-system.test.mjs',
  'tests/unit/w688-creator-forge-belt-activation.test.mjs',
  'tests/unit/w689-all-district-belts.test.mjs',
  'tests/unit/w690-complete-core-identity.test.mjs',
  'tests/unit/w691-realms-my-realm-integration.test.mjs',
  'tests/unit/w692-experience-quality.test.mjs',
  'tests/unit/w693-local-certification.test.mjs',
  'tests/unit/w694-final-local-candidate.test.mjs',
  'tests/unit/w695-character-motion-truth.test.mjs',
  'tests/unit/w696-boundary-hud-interaction.test.mjs',
  'tests/unit/w697-district-visual-identity.test.mjs',
  'tests/unit/w698-expanse-open-world-presentation.test.mjs',
  'tests/unit/w699-nexus-command-clarity.test.mjs',
  'tests/unit/w700-eonapp-signature-flow.test.mjs',
  'tests/unit/w702-canonical-state.test.mjs',
  'tests/unit/w702-reviewed-action-gateway.test.mjs',
  'tests/unit/w703-eoncity-world-safety.test.mjs',
  'tests/unit/w703-eoncity-world-safety-integration.test.mjs',
  'tests/unit/w704-projects-command-workspace.test.mjs',
  'tests/unit/w705-useful-atlas-entry.test.mjs',
  'tests/unit/w706-nexus-spatial-scene-plan.test.mjs',
  'tests/unit/w707-nexus-spatial-manipulation.test.mjs',
  'tests/unit/w708-responsive-interaction.test.mjs',
  'tests/unit/w709-command-centre-master-room.test.mjs',
  'tests/unit/w710-continuous-core-fabric.test.mjs',
  'tests/unit/w711-district-street-identity.test.mjs',
  'tests/unit/w712-flagship-expanse-entry.test.mjs',
  'tests/unit/w713-cross-route-product-coherence.test.mjs',
  'tests/unit/w714-identity-commercial-truth.test.mjs',
  'tests/unit/w715-performance-asset-engineering.test.mjs',
  'tests/unit/w716-accessibility-language-input.test.mjs',
  'tests/unit/w717-security-certification-simplification.test.mjs',
  'tests/unit/w718-independent-certification.test.mjs',
  'tests/unit/w719-14-live-defect-closure.test.mjs',
  'tests/unit/w719-frozen-release.test.mjs',
  'tests/unit/w719-13-arrival-camera.test.mjs',
  'tests/unit/w719-13-city-control-authority.test.mjs',
  'tests/unit/w719-13-core-world-authority.test.mjs',
  'tests/unit/w719-13-functional-arrival.test.mjs',
  'tests/unit/w719-13-input-camera-authority.test.mjs',
  'tests/unit/w719-13-living-nexus-session-state.test.mjs',
  'tests/unit/w719-13-nexus-spatial-primary.test.mjs'
]);

const DEFAULT_TEST_CONCURRENCY = 1;
const rawTestConcurrency = String(process.env.EONAPP_TEST_CONCURRENCY || DEFAULT_TEST_CONCURRENCY).trim();
const testConcurrency = Number(rawTestConcurrency);
if (!Number.isInteger(testConcurrency) || testConcurrency < 1 || testConcurrency > 8) {
  console.error(`[current-unit-suite] FAIL: EONAPP_TEST_CONCURRENCY must be an integer from 1 to 8; received ${rawTestConcurrency || '(empty)'}.`);
  process.exit(1);
}

const historicalDiagnosticPaths = new Set(W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS.map((entry) => entry.test));
const supersededLaunchPaths = new Set(W721_SUPERSEDED_LAUNCH_TESTS);
export const HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS = W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS;
export const SUPERSEDED_LAUNCH_DIAGNOSTIC_TESTS = W721_SUPERSEDED_LAUNCH_TESTS;
export const CURRENT_UNIT_TESTS = Object.freeze(CANDIDATE_UNIT_TESTS.filter((relative) => !historicalDiagnosticPaths.has(relative) && !supersededLaunchPaths.has(relative)));

const unitReportDirectory = path.join(root, 'reports', 'w730-current-unit-suite');
const unitCheckpointPath = path.join(unitReportDirectory, 'checkpoint.json');
const unitReceiptPath = path.join(unitReportDirectory, 'receipt.json');

function chunkTests(tests, size) {
  const chunks = [];
  for (let index = 0; index < tests.length; index += size) chunks.push(Object.freeze(tests.slice(index, index + size)));
  return Object.freeze(chunks);
}

export function parseTapSummary(output = '') {
  const pick = (label) => {
    const matches = [...String(output).matchAll(new RegExp(`^(?:#|ℹ)\\s+${label}\\s+(\\d+)\\s*$`, 'gmu'))];
    return matches.length ? Number(matches.at(-1)[1]) : 0;
  };
  return Object.freeze({ tests: pick('tests'), passed: pick('pass'), failed: pick('fail'), skipped: pick('skipped'), cancelled: pick('cancelled'), todo: pick('todo') });
}

function readUnitCheckpoint({ fingerprint, chunks }) {
  if (!fingerprint || !fs.existsSync(unitCheckpointPath)) return null;
  try {
    const checkpoint = JSON.parse(fs.readFileSync(unitCheckpointPath, 'utf8'));
    const rows = Array.isArray(checkpoint?.chunks) ? checkpoint.chunks : [];
    const validPrefix = rows.every((row, index) => row?.status === 0 && row.chunkIndex === index && JSON.stringify(row.testFiles || []) === JSON.stringify(chunks[index] || []));
    if (checkpoint?.sourceFingerprint === fingerprint && checkpoint?.testFileCount === CURRENT_UNIT_TESTS.length && validPrefix) return checkpoint;
  } catch {}
  fs.rmSync(unitCheckpointPath, { force: true });
  return null;
}

function writeUnitJson(filePath, payload) {
  fs.mkdirSync(unitReportDirectory, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function runUnitChunk(testFiles, { rootDirectory }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', `--test-concurrency=${testConcurrency}`, ...testFiles], { cwd: rootDirectory, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const relay = (target) => (chunk) => { const text = String(chunk); output += text; target.write(text); };
    child.stdout?.on('data', relay(process.stdout));
    child.stderr?.on('data', relay(process.stderr));
    child.once('error', (error) => resolve(Object.freeze({ status: 1, output: `${output}\n${error?.stack || error}` })));
    child.once('exit', (code) => resolve(Object.freeze({ status: Number(code ?? 1), output })));
  });
}

export async function runCurrentUnitSuite({ rootDirectory = root } = {}) {
  const missing = CURRENT_UNIT_TESTS.filter((relative) => !fs.existsSync(path.join(rootDirectory, relative)));
  if (missing.length) {
    console.error('[current-unit-suite] FAIL: missing required test files:');
    for (const relative of missing) console.error(`- ${relative}`);
    return 1;
  }
  const rawChunkSize = String(process.env.EONAPP_TEST_CHUNK_SIZE || '28').trim();
  const chunkSize = Number(rawChunkSize);
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 60) {
    console.error(`[current-unit-suite] FAIL: EONAPP_TEST_CHUNK_SIZE must be an integer from 1 to 60; received ${rawChunkSize || '(empty)'}.`);
    return 1;
  }
  const chunks = chunkTests(CURRENT_UNIT_TESTS, chunkSize);
  const sourceFingerprint = String(process.env.EONAPP_CERTIFICATION_FINGERPRINT || '').trim();
  const checkpoint = readUnitCheckpoint({ fingerprint: sourceFingerprint, chunks });
  const startedAt = checkpoint?.startedAt || new Date().toISOString();
  const rows = Array.isArray(checkpoint?.chunks) ? [...checkpoint.chunks] : [];
  const resumedChunkCount = rows.length;
  console.log(`[current-unit-suite] Running ${CURRENT_UNIT_TESTS.length} maintained test files in ${chunks.length} serial chunk${chunks.length === 1 ? '' : 's'} of up to ${chunkSize}; ${SUPERSEDED_LAUNCH_DIAGNOSTIC_TESTS.length} superseded launch files and ${HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS.length} evidence-dependent files remain non-certifying diagnostics; ${W624D_ARCHIVED_CONTRACT_ASSERTIONS.length} exact historical assertions remain explicit skips.`);
  if (resumedChunkCount) console.log(`[current-unit-suite] RESUME ${resumedChunkCount}/${chunks.length} completed chunks; certification fingerprint ${sourceFingerprint.slice(0, 12)}… unchanged.`);

  for (let index = resumedChunkCount; index < chunks.length; index += 1) {
    const files = chunks[index];
    console.log(`\n[current-unit-suite] CHUNK ${index + 1}/${chunks.length}: ${files.length} files`);
    const started = Date.now();
    const result = await runUnitChunk(files, { rootDirectory });
    const summary = parseTapSummary(result.output);
    const row = Object.freeze({ chunkIndex: index, testFiles: files, status: result.status, durationMs: Date.now() - started, summary });
    if (result.status !== 0) {
      writeUnitJson(unitReceiptPath, { schema: 'eonapp.current-unit-suite-receipt.w730.2026-07-28.v1', wave: 'W730', ok: false, startedAt, finishedAt: new Date().toISOString(), sourceFingerprint: sourceFingerprint || null, resumedChunkCount, failedChunk: index + 1, chunks: [...rows, row] });
      console.error(`[current-unit-suite] FAIL in chunk ${index + 1}/${chunks.length}. Later chunks were not treated as certified.`);
      return result.status;
    }
    rows.push(row);
    if (sourceFingerprint) writeUnitJson(unitCheckpointPath, { schema: 'eonapp.current-unit-suite-checkpoint.w730.2026-07-28.v1', wave: 'W730', startedAt, sourceFingerprint, testFileCount: CURRENT_UNIT_TESTS.length, chunkSize, chunks: rows });
  }

  const totals = rows.reduce((sum, row) => {
    for (const key of ['tests', 'passed', 'failed', 'skipped', 'cancelled', 'todo']) sum[key] += Number(row.summary?.[key] || 0);
    return sum;
  }, { tests: 0, passed: 0, failed: 0, skipped: 0, cancelled: 0, todo: 0 });
  writeUnitJson(unitReceiptPath, { schema: 'eonapp.current-unit-suite-receipt.w730.2026-07-28.v1', wave: 'W730', ok: totals.failed === 0, startedAt, finishedAt: new Date().toISOString(), sourceFingerprint: sourceFingerprint || null, resumedChunkCount, testFileCount: CURRENT_UNIT_TESTS.length, chunkCount: chunks.length, totals, chunks: rows });
  fs.rmSync(unitCheckpointPath, { force: true });
  console.log(`\n[current-unit-suite] PASS ${totals.passed}/${totals.tests}; ${totals.skipped} explicit historical skips; ${CURRENT_UNIT_TESTS.length} maintained files; ${chunks.length}/${chunks.length} chunks.`);
  return totals.failed === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runCurrentUnitSuite();
}
