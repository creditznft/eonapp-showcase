/**
 * EONBOT guide responses — W228 product-truth catalog.
 * These are deterministic Guide Mode explanations. They never claim an active
 * reward, affiliate, payment, token, social-posting, public-store or account
 * capability. Connected AI is only described after a secure configuration has
 * already been proven outside chat.
 */
export const RESPONSES = Object.freeze({
  onboarding_help: [
    'EONAPP starts with EONBOT. Tell it the outcome you want, use Create for a new result, and continue saved work in Projects or Library. Local and Connected AI remain optional, explicit choices.',
    'Start with one useful task. EONBOT can guide you to Create, Projects, Library, Local AI, Vault, Research or EON City without making you learn a feature grid.'
  ],
  local_ai: [
    'Local AI is device-dependent. Open Local AI setup to check this browser and choose a manual Ollama or LM Studio connection only after the runtime is available.',
    'Use local AI for private drafting where your device can handle it. EONBOT will keep Guide, Local and Connected status separate so the interface does not pretend a model is running.'
  ],
  workbench: [
    'Create is the single place to start images, videos, websites, documents, projects, automations or guided work. Chat stays the calm guide and Projects keeps meaningful work.',
    'Open Create for a new outcome and Projects to continue. Keep publishing, browser submission and external connections under an explicit review step.'
  ],
  browser_flow: [
    'Ask EONBOT to plan research and collect your own sources. It can structure the work, but must not claim browsing, publishing or external execution without a visible approved connection.',
    'For research, begin with the question, expected output and sources you trust. Use Research Lab only for local evidence, historical review and scenario notes; it has no broker or order path.'
  ],
  market: [
    'The old Preview Studio name is compatibility-only. Use Create → Image for visual planning and Vault for local, non-financial Vault Reveals.',
    'Vault Reveals stay local until you export or back them up. They are not purchases, listings, investments, tokens or transferable assets.'
  ],
  vault_info: [
    'Vault is for local profile, backup and recovery guidance. Keep passwords, recovery phrases, API keys and private wallet material out of chat.',
    'Use Vault to export a protected backup before changing devices. EONBOT can explain the path but never asks you to paste credentials into chat.'
  ],
  signal_research: [
    'Research Lab is local analysis only. It does not connect to brokers, place orders, move funds, make recommendations or verify a live position.',
    'Use Trade to organize research, scenarios and risk notes. Treat external market decisions as your own and verify information independently.'
  ],
  realm_land: [
    'EON City is a lightweight personal workspace world. The 2D view is the default; optional 3D reads the same safe City state on capable devices and can fall back to 2D.',
    'My Realm is a personal district and identity surface. It is not a public store, land sale, investment, commerce or earnings system.'
  ],
  rewards_campaign_status: [
    'There is no active reward, offerwall, referral-credit, payout, token, subscription-unlock or ad campaign in this release. Sharing a link, opening a link or spending time in the app does not create value.',
    'Current access status is simple: use available local features, set up your own local runtime or connect a provider securely outside chat. Any future program requires separate server-side proof, terms and review.'
  ],
  referral_share: [
    'Use Invite & Share Center to create a signed EONAPP, EON City, Workspace or safe Realm identity link. It can prepare copy and a local campaign draft, but it does not post for you, track clicks or create rewards.',
    'A signed invite is privacy-aware: it never includes private chats, Vault content, private City state, credentials, wallet material or a central referral ledger.'
  ],
  ai_chat: [
    'EONBOT has three honest modes: Guide for deterministic product help, Local after a self-tested runtime is available, and Connected only after secure configuration already exists. The UI should always show which mode is active.',
    'Supported browser dictation and spoken Guide replies can work without a model. Speech is still separate from model reasoning, and typed fallback always remains available.'
  ],
  privacy: [
    'Keep secrets out of chat. Do not paste passwords, API keys, recovery phrases, private keys or exchange credentials. Use Vault for protected backup and configuration guidance.',
    'EONAPP should distinguish local data, preview-only features, disabled commercial flows and future server-backed features instead of blurring them together.'
  ],
  multilingual_help: [
    'Language settings stay in Profile instead of the main chat. The published interface is English. Chat/Guide routing and browser speech cover eleven language choices; no additional full-interface language is claimed until route, legal and accessibility certification is complete.',
    'Voice support is browser and locale dependent. When it is unavailable, the typed chat experience stays fully usable.'
  ],
  about: [
    'EONAPP is a private, chat-first creation workspace led by EONBOT. Create starts new work, Projects and Library keep it useful, and EON City is the optional visual workspace. Commercial and reward claims remain proof-gated.'
  ]
});

export default RESPONSES;
