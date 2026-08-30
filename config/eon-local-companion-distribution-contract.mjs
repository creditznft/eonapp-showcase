/**
 * RT90 — EON Local Companion consumer distribution truth.
 *
 * The secure loopback core and native build recipe can be source-complete while
 * signed consumer installers are still unproven. Keep those states separate so
 * the browser never turns a developer build into a public download by accident.
 */
import { EON_LOCAL_COMPANION_RELEASE, isVerifiedEonLocalCompanionArtifact } from './eon-local-companion-release-contract.mjs';

export const EON_LOCAL_COMPANION_DISTRIBUTION_SCHEMA = 'eon.local-companion.distribution.rt90.v2';
export const EON_LOCAL_COMPANION_PRODUCT_NAME = 'EON Local Companion';

export const EON_LOCAL_COMPANION_DISTRIBUTION = Object.freeze({
  productName: EON_LOCAL_COMPANION_PRODUCT_NAME,
  transportCore: Object.freeze({
    implementation: 'tools/eon-local-bridge',
    loopbackOnly: true,
    exactOriginAllowlist: true,
    privateNetworkAccessAware: true,
    shortLivedBrowserPairing: true,
    codeFreeLocalApprovalImplemented: true,
    trustedBrowserPublicKeyResumeImplemented: true,
    persistentBrowserBearerToken: false,
    arbitraryShell: false,
    arbitraryExecutablePath: false,
    arbitraryLanTarget: false,
    silentCloudFallback: false,
    fixedRuntimeStartManager: true,
    reviewedModelPackManager: true
  }),
  buildSource: Object.freeze({
    bundledSingleEntryRecipeImplemented: true,
    node22SeaPreparationRecipeImplemented: true,
    immutableReleaseManifestImplemented: true,
    failClosedBrowserDownloadAuthorityImplemented: true,
    developerNodeLauncherRetainedForDiagnosticsOnly: true
  }),
  consumerPackage: Object.freeze({
    signedNativeInstaller: false,
    osAutostartWithUserOptIn: false,
    safeAutomaticUpdater: false,
    nativePairingApprovalWithoutCodeCopy: false,
    cleanUninstall: false,
    releaseArtifactVerified: false
  }),
  requiredBeforeConsumerLaunch: Object.freeze([
    'signed-native-installer',
    'os-autostart-with-user-opt-in',
    'safe-updater',
    'native-pairing-without-code-copy',
    'clean-uninstall',
    'windows-macos-linux-release-proof'
  ]),
  desktopRuntimePolicy: Object.freeze({
    detectAfterExplicitSetupIntent: true,
    startAlreadyInstalledAllowlistedRuntimeAfterPairing: true,
    offerOfficialRuntimeAcquisitionWhenMissing: true,
    silentlyInstallThirdPartyRuntime: false,
    silentlyDownloadModel: false,
    silentlyElevatePrivileges: false,
    browserSuppliedCommandOrArguments: false
  })
});

function verifiedReleaseCount() {
  return Object.values(EON_LOCAL_COMPANION_RELEASE.artifacts || {}).filter(isVerifiedEonLocalCompanionArtifact).length;
}

export function getEonLocalCompanionDistributionTruth() {
  const packageTruth = EON_LOCAL_COMPANION_DISTRIBUTION.consumerPackage;
  const buildTruth = EON_LOCAL_COMPANION_DISTRIBUTION.buildSource;
  const releaseArtifactCount = verifiedReleaseCount();
  return Object.freeze({
    schema: EON_LOCAL_COMPANION_DISTRIBUTION_SCHEMA,
    productName: EON_LOCAL_COMPANION_PRODUCT_NAME,
    secureTransportCoreImplemented: true,
    fixedRuntimeStartManagerImplemented: true,
    reviewedModelPackManagerImplemented: true,
    codeFreePairingSourceImplemented: true,
    trustedBrowserResumeSourceImplemented: true,
    persistentBrowserBearerToken: false,
    nativeBuildRecipeImplemented: Object.values(buildTruth).every(Boolean),
    verifiedReleaseArtifactCount: releaseArtifactCount,
    consumerNativePackageReady: Object.values(packageTruth).every(Boolean) && releaseArtifactCount > 0,
    ...buildTruth,
    ...packageTruth,
    developerNodeLauncherIsConsumerReady: false
  });
}

export function validateEonLocalCompanionDistributionContract() {
  const errors = [];
  const truth = getEonLocalCompanionDistributionTruth();
  if (!truth.nativeBuildRecipeImplemented) errors.push('RT90 Local Companion native build source recipe is incomplete.');
  if (truth.consumerNativePackageReady) errors.push('RT90 source must not claim native Companion packaging is certified before release artifacts exist.');
  if (truth.developerNodeLauncherIsConsumerReady !== false) errors.push('The developer Node launcher must not be treated as the consumer installer.');
  const transport = EON_LOCAL_COMPANION_DISTRIBUTION.transportCore;
  if (!transport.loopbackOnly || !transport.exactOriginAllowlist || transport.arbitraryShell || transport.arbitraryLanTarget || transport.silentCloudFallback) {
    errors.push('Local Companion transport boundaries must remain fail-closed.');
  }
  const runtime = EON_LOCAL_COMPANION_DISTRIBUTION.desktopRuntimePolicy;
  if (runtime.silentlyInstallThirdPartyRuntime || runtime.silentlyDownloadModel || runtime.silentlyElevatePrivileges || runtime.browserSuppliedCommandOrArguments) {
    errors.push('Consumer convenience must not become arbitrary install/download/elevation execution.');
  }
  return errors;
}
