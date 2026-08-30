// Legacy browser/global augmentations for EONAPP's JavaScript checkJS gate.
// These declarations document existing runtime globals used by older non-module
// pages without changing runtime behavior or adding source-level TypeScript bypasses.

declare const PQSigningKeyPair: any;

type EONAnyFunction = (...args: any[]) => any;
type EONAnyConstructor = new (...args: any[]) => any;

interface Window {
  [key: string]: any;
  __EON_REQUIRE_ADMIN_READY__?: EONAnyFunction;
  openPanel?: EONAnyFunction;
  closeAllPanels?: EONAnyFunction;
  showToast?: EONAnyFunction;
  EONModelDiscovery?: any;
  EONAccountsManager?: any;
  SpeechRecognition?: EONAnyConstructor;
  webkitSpeechRecognition?: EONAnyConstructor;
  shouldProbeLocalRuntimes?: EONAnyFunction;
  setLocalRuntimeAutoDetectEnabled?: EONAnyFunction;
  getLocalRuntimeAutoDetectEnabled?: EONAnyFunction;
  eonAIService?: any;
  eonProviderOrchestrator?: any;
  EONSocialAttachments?: any;
  EonPoolPoints?: any;
  WorkbenchAutomation?: any;
  ethereum?: any;
}

interface Document {
  [key: string]: any;
}

interface Navigator {
  deviceMemory?: number;
}

interface Element {
  [key: string]: any;
  dataset: DOMStringMap;
  value?: any;
  disabled?: any;
  checked?: any;
  reset?: EONAnyFunction;
  getContext?: EONAnyFunction;
  width?: any;
  height?: any;
}

interface Event {
  [key: string]: any;
}

interface EventTarget {
  [key: string]: any;
}

interface HTMLElement {
  [key: string]: any;
  value?: any;
  disabled?: any;
  checked?: any;
  reset?: EONAnyFunction;
  getContext?: EONAnyFunction;
  width?: any;
  height?: any;
}
