
interface Window {
  [key: string]: any;
  Eon: any;
  EonXP: any;
  EonWallet: any;
  EonLootbox: any;
  EonCredits: any;
  EonSeason: any;
  EonPoolPoints: any;
  DEBUG: boolean;
  TAROT_DATA: any;
  TarotOracle: any;
  Gun: any;
  NostrTools: any;
  html2canvas: any;
  QRCode: any;
  __EON_API_BASE__: string;
  __EON_ADMIN_GATED__?: boolean;
  ethereum: any;
  coinbaseWalletExtension: any;
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
  google: any;
  monaco: any;
  MonacoEnvironment: any;
  DOMPurify: any;
  eonAIService: any;
  eonAnalytics: any;
  eonArtifactIndex: any;
  eonProviderOrchestrator: any;
  tokenDashboard: any;
  ChatVoiceEvidence: any;
  CreatorStudioEvidence: any;
  CreatorStudioAutomation: any;
  WorkbenchAutomation: any;
  EONBrowserEvidence: any;
  ModelMarketplacePanel: any;
  ProviderEarningsDashboard: any;
  ProviderStatusBadge: any;
  LocalRuntimeDetector: any;
  DistributedInferenceHelpers: any;
  DistributedInferenceService: any;
  DistributedInferenceIntegration: any;
  EONTabSystem: any;
  EONBrowserDownloadManager: any;
  EONBrowserAutomation: any;
  EONActivityMonitor: any;
  EONModelDiscovery: any;
  EONProactiveBot: any;
  EONPush: any;
  EONSocialAttachments: any;
  EONAbilities: any;
  EONAccountsManager: any;
  HTMLAnchorElement: any;
  __eonDownloadBridgeInstalled: any;
  __eonDownloadClickPatched: any;
  openPanel: any;
  closeAllPanels: any;
  renderAbilityGrid: any;
  renderPasswordList: any;
  _cmGetCode: any;
  _cmSetCode: any;
  shouldProbeLocalRuntimes: any;
  getLocalRuntimeAutoDetectEnabled: any;
  setLocalRuntimeAutoDetectEnabled: any;
  loadAISettings: any;
  getAvailableModelsForStudio: any;
  submitStudioInference: any;
  modelMarketplacePanel: any;
  providerEarningsDashboard: any;
  getLocalRuntimeDetector: any;
  showToast: any;
}

interface GlobalThis {
  [key: string]: any;
}

interface CustomEvent<T = any> extends Event {
  detail: T;
}

declare var Eon: any;
declare var EonXP: any;
declare var EonWallet: any;
declare var EonLootbox: any;
declare var EonCredits: any;
declare var DEBUG: boolean;
declare var Buffer: any;
declare var html2canvas: any;

interface Element {
  value: any;
  checked: any;
  files: any;
  dataset: DOMStringMap;
  style: CSSStyleDeclaration;
  textContent: string | null;
  classList: DOMTokenList;
  hidden: any;
  disabled: boolean;
  focus: () => void;
  click: () => void;
  scrollIntoView: (options?: any) => void;
  offsetWidth: number;
  name: string;
  content: string;
  placeholder: string;
  getContext: (...args: any[]) => any;
  width: number;
  height: number;
}

interface HTMLElement {
  value: any;
  checked: any;
  files: any;
  placeholder: string;
}

interface Navigator {
  deviceMemory?: number;
  connection?: any;
  mozConnection?: any;
  webkitConnection?: any;
}

interface Performance {
  memory?: {
    usedJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

interface Number {
  unref?: () => void;
}

interface Error {
  status?: number;
  payload?: any;
  code?: string;
}

declare var __webpack_require__: any;
declare var PQSigningKeyPair: any;

interface Event {
  detail?: any;
}

interface EventTarget {
  tagName?: string;
  className?: string;
  value?: string;
  type?: string;
  checked?: boolean;
  matches?: (selectors: string) => boolean;
  closest?: (selectors: string) => Element | null;
}

type ContentItem = any;
type SavedHook = any;
type SponsorSlot = any;
type Campaign = any;
type challenge = any;
type duelResult = any;
type PQSigningKeyPair = any;

interface Object {
  status?: any;
  payload?: any;
  sequence?: any;
  domain?: any;
  wallet_address?: any;
  points?: any;
  claim_amount?: any;
  proof_root?: any;
  latestEpoch?: any;
  uid?: any;
  claims?: any;
  pools?: any;
  origin?: any;
  pending?: any;
  planId?: any;
  renewsAt?: any;
  _meta?: any;
  acceptorUid?: any;
  [key: string]: any;
}
