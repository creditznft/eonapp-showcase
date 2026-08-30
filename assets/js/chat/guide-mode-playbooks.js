import { detectLocalAiCapabilityProfile, buildLocalWorkloadMatrix, buildLocalModelDiscoveryPlan, summarizeLocalCapabilityTruth } from '../utils/local-ai-capability-matrix.js';
import { buildNativeVoiceCapabilityPlan, buildVoiceCeoRoadmap } from './native-voice-strategy.js';

function getLocalGuideContext() {
  const profile = detectLocalAiCapabilityProfile();
  const matrix = buildLocalWorkloadMatrix(profile);
  const truth = summarizeLocalCapabilityTruth(profile, matrix);
  const discovery = buildLocalModelDiscoveryPlan(profile, { workloadMatrix: matrix });
  return { profile, matrix, truth, discovery };
}

function createPlaybook({ text, steps = [], truthNote = '', toolCTA = null, actionCTA = null, quickReplies = [] }) {
  return { text, steps, truthNote, toolCTA, actionCTA, quickReplies };
}

export function buildGuidePlaybook(intentId = 'fallback', options = {}) {
  const { profile, truth, discovery } = getLocalGuideContext();
  const guideTruth = 'Guide Mode can explain EONAPP, translate built-in guidance, prepare prompts and route you correctly without an AI key. Model-powered replies need a verified Local AI path—Local Lite or a self-tested desktop runtime—or a securely connected provider the user explicitly selected.';

  switch (String(intentId || 'fallback')) {
    case 'onboarding_help':
    case 'hello':
    case 'fallback':
      return createPlaybook({
        text: 'Tell me what you want to make or solve. I’ll turn it into one clear next step—Create something new, continue a Project, find an item in Library, enter EON City, or open a private setting. No feature maze.',
        steps: [
          'Say the result in your own words—by typing or voice.',
          'Stay in Guide Mode for instant help, or choose Local AI when this device can support it.',
          'Use Direct BYOK only when you deliberately choose your own provider and understand its privacy and cost.',
          'Use Create for a new outcome, Projects to continue work, and Library to reopen saved outputs.'
        ],
        truthNote: `${guideTruth} ${truth.summary}`,
        toolCTA: { label: '⚡ Let EONBOT guide local AI', url: '/local-ai#eonbot-local-ai-setup' },
        quickReplies: ['Open Create', 'Make Local AI ready', 'Continue a project', 'What works offline']
      });
    case 'setup_provider':
      return createPlaybook({
        text: 'You can begin in Guide Mode with no key. For model-powered work, choose either a tested Local AI runtime or your own securely connected provider—never both silently.',
        steps: [
          'Open Local AI and accept only an approved device recommendation.',
          'Connect a provider from Vault only when you want to use your own API key.',
          'EONBOT must always show whether the current reply is Guide, Local or Connected.',
          'Keep private keys and recovery data out of chat messages.'
        ],
        truthNote: guideTruth,
        toolCTA: { label: '⚡ Let EONBOT guide local AI', url: '/local-ai#eonbot-local-ai-setup' },
        quickReplies: ['Check local AI', 'Connect a provider', 'What works offline', 'Use voice']
      });
    case 'local_ai':
      return createPlaybook({
        text: `${profile.label}: ${profile.summary} Start with one action: Make Local AI ready. EON checks this device, uses Local Lite on compatible phones/tablets/basic browsers, and can reuse a supported installed desktop runtime after proof.`,
        steps: [
          'Tap Make Local AI ready; normal setup should not begin with ports, CORS, localhost addresses or command-line steps.',
          ...((discovery.runtimeHints || []).slice(0, 1)),
          'On Windows or macOS, reuse a supported installed runtime after its self-test; use EON Local Companion only when a signed device-certified build exists for that platform.',
          'On iPhone, iPad and Android, use Local Lite where the browser/device check passes; desktop runtimes and desktop Companion installers are not offered.',
          'Keep Image and Video separately proof-gated. A hosted provider is a separate explicit choice and never a silent fallback.'
        ].slice(0, 5),
        truthNote: `${guideTruth} ${truth.summary}`,
        toolCTA: { label: '🖥️ Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' },
        quickReplies: ['Make Local AI ready', 'Local AI on my phone', 'Local AI on my Mac', 'Open Create']
      });
    case 'business_launch_os':
      return createPlaybook({
        text: 'Use the flagship business flow if you want the app to feel like magic instead of a toolbox: define the offer, build the assets, create content, prepare the site/app launch handoff, then promote with safe approvals.',
        steps: [
          'Clarify the business, offer, and audience.',
          'Prepare the plan with EONBOT and save it as a Project.',
          'Use Create for images, video plans, websites, documents and automations.',
          'Use the website/app launch handoff to get the site live quickly.'
        ],
        truthNote: 'Guide Mode can prepare the flow and explain the steps. Real generation and launch execution still need AI and, for live deployment, your chosen hosting path.',
        toolCTA: { label: '🚀 Open Create', url: '/create' },
        quickReplies: ['Launch my business', 'Create business content', 'Website launch handoff', 'Browser safety']
      });
    case 'ai_chat':
      return createPlaybook({
        text: 'EONBOT can use supported browser dictation and spoken Guide replies without an AI key. That voice layer is separate from model-powered reasoning, which still needs a tested Local or Connected AI route.',
        steps: [
          'Use browser voice input if your browser supports it.',
          'Stay in Guide Mode for product help, planning, routing and prepared next steps.',
          'Complete secure provider setup outside chat or use a tested local runtime for real AI output.',
          'Use Auto Mode after setup so EON can route work intelligently.'
        ],
        truthNote: 'Speech recognition, Guide logic, model reasoning, spoken output and action approval are separate capabilities. EONBOT must always explain which route is active.',
        toolCTA: { label: '💬 Open EONBOT Chat', url: '/' },
        quickReplies: ['Voice truth', 'Make Local AI ready', 'Local AI on this device', 'Guide Mode']
      });
    case 'multilingual_help':
      return createPlaybook({
        text: 'EONAPP publishes the complete interface in English. Chat/Guide routing, language-aware model prompts and browser speech offer eleven choices, but those capabilities do not publish an unverified full-interface translation.',
        steps: [
          'Open Profile → Voice & language only when you want to override the automatic language choice.',
          'Type or dictate in your language; Guide Mode can localize built-in help without an AI key.',
          'Use browser voice input where supported by the browser and locale.',
          'Expect provider/runtime quality differences for advanced AI replies.'
        ],
        truthNote: 'Core multilingual controls and routing are source-tested. Full-page translation, recognition accuracy and spoken-voice availability still need language-by-language device proof.',
        toolCTA: { label: '🌐 Open language & voice settings', url: '/profile#profile-voice-language' },
        quickReplies: ['Open language settings', 'Use voice', 'Guide Mode', 'Make Local AI ready']
      });

    case 'access_status':
      return createPlaybook({
        text: 'No live reward, offerwall, payout, token or feature-unlock grant is active in this release. The planned EON Keys programme is non-cash and will unlock app features only after a separate server-side release.',
        steps: [
          'Use the available local features and save your work safely.',
          'Use Local AI where the device self-test supports it.',
          'Use a securely configured connected provider only after you choose it outside chat.',
          'Treat any future reward program as a separate reviewed release, not a hidden promise.'
        ],
        truthNote: 'A non-cash access program still needs a real server ledger, anti-fraud controls, terms, disclosure and specialist review before activation.',
        toolCTA: { label: '◉ Open Profile & access status', url: '/profile' },
        quickReplies: ['Make Local AI ready', 'Open Share Center', 'Open Profile']
      });
    case 'eonbot_commander':
      return createPlaybook({
        text: 'EONBOT is your calm command guide. Type or speak naturally; it understands the goal, prepares the safest next step, and pauses before anything sensitive, paid, public or external.',
        steps: [
          'Safe navigation can be one tap: open Create, Projects, Library, EON City, Vault or Local AI setup.',
          'Dictate turns speech into editable text; Use Voice can continue with Guide, Local or Connected replies where the browser supports it.',
          'EONBOT should produce action receipts: what it understood, what it will open, and what needs approval.',
          'Vault changes, billing actions, browser submits, publishing and permission changes must never run silently.'
        ],
        truthNote: 'This is a command-center layer, not an unsafe autopilot. High-impact actions stay approval-gated.',
        toolCTA: { label: '💬 Open EONBOT Chat', url: '/' },
        quickReplies: ['Use voice', 'Open Create', 'Open EON City', 'Open Vault']
      });
    case 'voice_commander': {
      const plan = buildNativeVoiceCapabilityPlan({});
      const roadmap = buildVoiceCeoRoadmap();
      return createPlaybook({
        text: 'The simplest no-key voice path uses browser speech recognition and speech synthesis. It can power Dictate and spoken Guide replies, but availability and privacy depend on the browser, device and language.',
        steps: [
          'Use a supported full browser and grant microphone access only when you tap a voice control.',
          'Keep typing as the permanent fallback when recognition or a matching voice is unavailable.',
          'Keep language controls in Profile; Auto follows the current chat or device language.',
          'Let EONBOT convert transcript into safe app commands with approval receipts.',
          roadmap.phase2[1]
        ],
        truthNote: plan.truth,
        toolCTA: { label: '🎤 Open Voice Chat', url: '/?voice=1' },
        quickReplies: ['Voice support truth', 'Open language settings', 'Use Dictate', 'Make Local AI ready']
      });
    }
    case 'eoncity_gameplay_help':
      return createPlaybook({
        text: 'EON City is the optional visual workspace, and its Quick EONBOT uses the same canonical Guide, Local and Connected AI authority as main Chat. A saved provider name is not enough: City shows model-powered readiness only after current Local or Connected proof.',
        steps: [
          'Use Guide Mode inside City immediately for safe product help and route preparation.',
          'For private model replies, choose Make Local AI ready; City reuses the same verified Local Lite or desktop-runtime setup as main Chat.',
          'When a heavy local Image or Video job competes with the City renderer, EON must ask before pausing City and resume only a workload-owned pause when the job ends.',
          'Use a non-3D fallback when the device, orientation or browser cannot run the renderer safely.',
          'Keep EONBOT and a clear exit to the native app available at all times.'
        ],
        truthNote: 'EON City never creates a second AI runtime. Local/Connected execution, workload admission and capability proof stay shared with the canonical EONAPP AI system.',
        toolCTA: { label: '🌆 Open EON City', url: '/eoncity' },
        quickReplies: ['Open EON City', 'Make Local AI ready', 'City + Local AI', 'Return to Chat']
      });
    case 'browser_flow':
      return createPlaybook({
        text: 'Browser actions should feel powerful but safe. EON can help read, draft, and prepare actions, but submit and sensitive actions must stay approval-based.',
        steps: [
          'Use Workspace for research, summaries, and guided action preparation.',
          'Let EON draft the work before it touches an account or a live submission.',
          'Read and draft approvals can be remembered briefly per host after you review them once.',
          'Submit and sensitive actions always need review and should never run silently.'
        ],
        truthNote: 'Browser agents are useful, but they should never be framed as risk-free autopilots. Read/draft work can gain temporary host-based approval memory; submit and sensitive actions still require explicit approval.',
        toolCTA: { label: '🌐 Open language & voice settings', url: '/profile#profile-voice-language' },
        quickReplies: ['Browser safety', 'Launch my business', 'Open AI Chat', 'Make Local AI ready']
      });
    case 'workbench':
    case 'workbench_modes':
      return createPlaybook({
        text: 'The old WorkBench mode grid is retired. Tell EONBOT the outcome you need, or use Create for a new result and Projects to continue saved work.',
        steps: ['Start with the outcome, not a mode name.', 'Review any external side effect before it runs.', 'Save useful outputs in Projects or Library.'],
        truthNote: 'Advanced agent and multi-model tools remain approval-based and appear only when relevant.',
        toolCTA: { label: '✦ Open Create', url: '/create' },
        quickReplies: ['Build something', 'Create content', 'Set an automation', 'Analyze data']
      });
    case 'market':
      return createPlaybook({
        text: 'The old Preview Studio and Market names are retired from primary navigation. Use Create → Image for visual work and Vault for non-financial Vault Reveals.',
        steps: ['Open Create and choose Image.', 'Use Guide mode for a prompt or storyboard until a real Local or Direct BYOK image rail is proven.', 'Use Vault Reveals only as local, non-transferable visuals.'],
        truthNote: 'There is no user-to-user exchange, checkout, commission, payout, token, or trading surface in this release.',
        toolCTA: { label: '▧ Open Create → Image', url: '/create?mode=image' },
        quickReplies: ['Create an image', 'Open Vault', 'What is a Vault Reveal?', 'Image generation status']
      });
    case 'referral_share':
      return createPlaybook({
        text: 'Use the Referral section in Vault to create a link, copy it, share through your device composer and scan a bundled QR code. EONAPP does not award value for a raw share click.',
        steps: ['Open Vault referral.', 'Check the copied canonical link.', 'Use native share or an approved platform composer.', 'Review verified conversions in the future Referral Hub.'],
        truthNote: 'Referral links are self-contained signed envelopes. They verify locally and use no short-link registry; a local share attempt is never a reward event or a central database write.',
        toolCTA: { label: '↗ Open Vault referral', url: '/vault#referral' },
        quickReplies: ['Open referral link', 'Show QR code', 'Share safely', 'Open Vault']
      });
    case 'vault_info':
      return createPlaybook({
        text: 'Vault is the account and recovery centre. Use it for safe profile settings, receipts, backups, provider connections and local item records—not as a public dashboard for secrets.',
        steps: ['Review backup status.', 'Add only a provider key you control.', 'Keep recovery material outside chat.', 'Export before moving to another device.'],
        truthNote: 'Raw seed phrases and exchange keys should not be placed in chat or ordinary browser storage.',
        toolCTA: { label: '◈ Open Vault', url: '/vault' },
        quickReplies: ['Back up my data', 'Set up a provider', 'Open referral QR', 'Open local AI']
      });
    case 'realm_land':
      return createPlaybook({
        text: 'EON City is being rebuilt as an optional productive RPG workspace. Use Chat, Create, Projects and Library for dependable work today; enter City when you want the visual experience.',
        steps: ['Use EON City only when your device can handle it.', 'Return to Chat, Create or Projects for full controls.', 'Share only through reviewed EONAPP sharing surfaces.'],
        truthNote: 'Legacy Realm naming is compatibility-only. City access, project data and sharing remain separate and proof-gated.',
        toolCTA: { label: '◌ Open EON City', url: '/eoncity' },
        quickReplies: ['Open EON City', 'City status', 'Open Create', 'Local AI setup']
      });
    case 'free_cost':
      return createPlaybook({
        text: 'Free users keep core Chat, Create planning, Projects, Library, compatible Local AI setup, Vault basics and EON City preview access. EONAPP does not sell platform-paid AI generation at launch; generation uses your Local runtime or your own Direct BYOK provider when you choose one.',
        steps: ['Use local AI when supported for device-owned generation and offline basics.', 'Connect your own provider/API key for extra personal generation capacity.', 'Review Plus, Studio, Power or EON Keys only for higher EONAPP workflow capability and advanced workloads.'],
        truthNote: 'No live EON Key grant, payout, revenue-share, token or access campaign is active. Any future referral unlock programme requires a separate reviewed release with server-side proof.',
        toolCTA: { label: '◉ Open Profile & access status', url: '/profile' },
        quickReplies: ['Check local AI', 'Connect a provider', 'What is free?', 'Open Profile']
      });
    case 'about':
      return createPlaybook({
        text: 'EONAPP is a chat-first creation workspace: ask EONBOT, start from Create, save real work in Projects and Library, use Local or Direct BYOK AI when chosen, and enter EON City as an optional visual workspace.',
        steps: ['Start in Chat.', 'Use Create for a new outcome.', 'Continue saved work in Projects or Library.', 'Keep billing, keys and external execution under explicit controls.'],
        truthNote: 'Features that are still being rebuilt are labelled honestly rather than presented as live.',
        toolCTA: { label: '✦ Open EONBOT Chat', url: '/' },
        quickReplies: ['Open Create', 'Make Local AI ready', 'Continue a project', 'Open Vault']
      });
    default:
      return null;
  }
}
