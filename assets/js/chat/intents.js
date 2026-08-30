/**
 * W192 Chat-first intents.
 * Internal systems are intentionally not first-class intents; EONBOT routes the
 * outcome to a clear route and only exposes advanced controls when relevant.
 */
export const INTENTS = Object.freeze([
  { id: 'onboarding_help', patterns: ['getting started', 'first time', 'how does this work', 'guide me', 'what can you do', 'help me start'], toolCTA: { label: '⚡ Let EONBOT guide local AI', url: '/local-ai#eonbot-local-ai-setup' }, quickReplies: ['Open Create', 'Continue a project', 'Use voice', 'What works offline'] },
  { id: 'local_ai', patterns: ['local ai', 'offline ai', 'ollama', 'phi', 'install a model', 'download model', 'run locally'], toolCTA: { label: '⚡ Let EONBOT guide local AI', url: '/local-ai#eonbot-local-ai-setup' }, quickReplies: ['Check this device', 'What works offline', 'Connect a provider'] },
  { id: 'workbench', patterns: ['workspace', 'workbench', 'build', 'create', 'analyze', 'project'], toolCTA: { label: '✦ Open Create', url: '/create' }, quickReplies: ['Build something', 'Create content', 'Continue a project'] },
  { id: 'browser_flow', patterns: ['research', 'browse', 'web research', 'sources', 'compare options'], toolCTA: { label: '⌘ Open advanced review', url: '/workspace' }, quickReplies: ['Research safely', 'Create a project', 'Open Research Lab'] },
  { id: 'market', patterns: ['market', 'nft', 'private preview', 'generate an item', 'generate a preview', 'vault reveal'], toolCTA: { label: '▧ Open Create → Image', url: '/create?mode=image' }, quickReplies: ['Create an image', 'Vault Reveal truth', 'Open Vault'] },
  { id: 'vault_info', patterns: ['vault', 'backup', 'profile', 'receipt', 'api key', 'my account'], toolCTA: { label: '◈ Open Vault', url: '/vault' }, quickReplies: ['Back up my data', 'Set up a provider', 'Share safely'] },
  { id: 'signal_research', patterns: ['trade', 'trading', 'chart', 'paper trade', 'market research'], toolCTA: { label: '↗ Open Research Lab', url: '/insights' }, quickReplies: ['Open Research Lab', 'Research a topic', 'Research safety'] },
  { id: 'realm_land', patterns: ['eon city', 'city', 'realm', 'operator map', '2d map'], toolCTA: { label: '◌ Open EON City', url: '/eoncity' }, quickReplies: ['Open EON City', 'What can I do there?', 'Continue a project'] },
  { id: 'rewards_campaign_status', patterns: ['reward', 'rewards', 'offerwall', 'credits', 'multitag', 'direct link'], toolCTA: { label: '◉ Open access status', url: '/profile' }, quickReplies: ['Why are campaigns disabled?', 'Make Local AI ready', 'Open Share Center'] },
  { id: 'referral_share', patterns: ['referral', 'invite', 'share link', 'qr code', 'promote'], toolCTA: { label: '◉ Open Profile & Share Center', url: '/profile' }, actionCTA: { label: 'Create my invite link', action: 'copyInvite' }, quickReplies: ['Create my link', 'Share safely', 'Open My Realm'] },
  { id: 'ai_chat', patterns: ['ai chat', 'full chat', 'chat page', 'open chat', 'voice chat', 'microphone'], toolCTA: { label: '✦ Open EONBOT Chat', url: '/' }, quickReplies: ['Use voice', 'Make Local AI ready', 'Open Create'] },
  { id: 'privacy', patterns: ['privacy', 'safe', 'security', 'data', 'secret', 'password', 'seed phrase'], toolCTA: { label: '◈ Open Vault', url: '/vault' }, quickReplies: ['Back up my data', 'Local AI privacy', 'Open settings'] },
  { id: 'multilingual_help', patterns: ['language', 'translate', 'hindi', 'arabic', 'multilingual', 'switch language'], toolCTA: { label: '🌐 Open voice & language', url: '/profile#profile-voice-language' }, quickReplies: ['Open language settings', 'Use voice', 'Make Local AI ready'] },
  { id: 'about', patterns: ['about eonapp', 'what is eonapp', 'explain eonapp'], toolCTA: { label: '✦ Open EONBOT Chat', url: '/' }, quickReplies: ['Open Create', 'Make Local AI ready', 'Continue a project'] }
]);

export default INTENTS;
