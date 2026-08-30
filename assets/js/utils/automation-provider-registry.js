/**
 * EON Automation OS provider registry.
 *
 * This registry is deliberately explicit about integration truth. A catalogued
 * provider is not automatically a live connection. `adapter-ready` means the
 * product knows the provider's auth/setup/capability model, while credentials,
 * OAuth applications, server proxies, account approval, and provider terms may
 * still be required. `companion` means a reviewed browser-companion or external
 * handoff is required. Secrets are referenced through Vault and are never kept
 * in this registry or returned to page markup.
 */

export const AUTOMATION_SUPPORT_STATES = Object.freeze({
  BUILT_IN: 'built-in',
  ADAPTER_READY: 'adapter-ready',
  BRIDGE_READY: 'bridge-ready',
  COMPANION: 'companion'
});

export const AUTOMATION_APPROVAL_LEVELS = Object.freeze({
  READ: 'read',
  DRAFT: 'draft',
  SUBMIT: 'submit',
  SENSITIVE: 'sensitive'
});

const SUPPORT_LABELS = Object.freeze({
  'built-in': 'Built-in local/browser rail',
  'adapter-ready': 'Adapter ready · setup required',
  'bridge-ready': 'Automation bridge available',
  companion: 'Companion or reviewed handoff'
});

const CATEGORY_LABELS = Object.freeze({
  ai: 'AI & model providers',
  communication: 'Communication & messaging',
  productivity: 'Productivity & documents',
  project: 'Projects & work management',
  crm: 'CRM, sales & support',
  marketing: 'Marketing & social publishing',
  content: 'Content & media',
  developer: 'Developer & DevOps',
  data: 'Data, databases & analytics',
  storage: 'Storage & files',
  forms: 'Forms, signatures & scheduling',
  hr: 'HR & people operations',
  automation: 'Automation bridges',
  local: 'Local runtimes & open protocols'
});

function p(id, name, category, auth, rail, state, homepage, capabilities, approval = 'draft', runner = 'either', notes = '') {
  return Object.freeze({
    id,
    name,
    category,
    categoryLabel: CATEGORY_LABELS[category] || category,
    auth,
    rail,
    state,
    stateLabel: SUPPORT_LABELS[state] || state,
    homepage,
    capabilities: Object.freeze([...new Set(capabilities)]),
    defaultApproval: approval,
    runner,
    notes,
    credentialStorage: auth === 'none' ? 'none' : 'vault-reference-only',
    public: true
  });
}

const PROVIDERS = [
  // AI, multimodal, speech, search and local model providers.
  p('openai', 'OpenAI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://openai.com/', ['chat', 'reasoning', 'vision', 'image', 'speech', 'embeddings', 'tools'], 'draft'),
  p('anthropic', 'Anthropic', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.anthropic.com/', ['chat', 'reasoning', 'vision', 'tools'], 'draft'),
  p('google-gemini', 'Google Gemini', 'ai', 'api-key-or-oauth', 'direct-api', 'adapter-ready', 'https://ai.google.dev/', ['chat', 'reasoning', 'vision', 'image', 'audio', 'tools'], 'draft'),
  p('groq', 'Groq', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://groq.com/', ['chat', 'speech', 'tools'], 'draft'),
  p('mistral', 'Mistral AI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://mistral.ai/', ['chat', 'reasoning', 'ocr', 'embeddings', 'tools'], 'draft'),
  p('cohere', 'Cohere', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://cohere.com/', ['chat', 'rerank', 'embeddings', 'tools'], 'draft'),
  p('cerebras', 'Cerebras Inference', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.cerebras.ai/', ['chat', 'reasoning', 'tools'], 'draft'),
  p('deepseek', 'DeepSeek', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.deepseek.com/', ['chat', 'reasoning', 'code', 'tools'], 'draft'),
  p('together', 'Together AI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.together.ai/', ['chat', 'image', 'embeddings', 'tools'], 'draft'),
  p('nvidia-nim', 'NVIDIA NIM', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://build.nvidia.com/', ['chat', 'vision', 'embeddings', 'speech', 'tools'], 'draft'),
  p('openrouter', 'OpenRouter', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://openrouter.ai/', ['chat', 'reasoning', 'vision', 'tools'], 'draft'),
  p('cloudflare-ai', 'Cloudflare Workers AI', 'ai', 'api-token', 'direct-api', 'adapter-ready', 'https://developers.cloudflare.com/workers-ai/', ['chat', 'image', 'speech', 'embeddings'], 'draft', 'cloud-scheduler'),
  p('huggingface', 'Hugging Face Inference', 'ai', 'api-token', 'direct-api', 'adapter-ready', 'https://huggingface.co/', ['chat', 'image', 'speech', 'embeddings'], 'draft'),
  p('sambanova', 'SambaNova Cloud', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://cloud.sambanova.ai/', ['chat', 'reasoning', 'tools'], 'draft'),
  p('replicate', 'Replicate', 'ai', 'api-token', 'direct-api', 'adapter-ready', 'https://replicate.com/', ['image', 'video', 'speech', 'models'], 'draft', 'cloud-scheduler'),
  p('stability-ai', 'Stability AI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://stability.ai/', ['image', 'video', 'audio'], 'draft'),
  p('elevenlabs', 'ElevenLabs', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://elevenlabs.io/', ['speech', 'voice', 'music', 'dubbing'], 'draft'),
  p('deepgram', 'Deepgram', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://deepgram.com/', ['speech-to-text', 'text-to-speech', 'voice-agent'], 'draft'),
  p('assemblyai', 'AssemblyAI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.assemblyai.com/', ['speech-to-text', 'audio-intelligence'], 'draft'),
  p('perplexity', 'Perplexity API', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.perplexity.ai/', ['search', 'research', 'chat'], 'read'),
  p('jina-ai', 'Jina AI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://jina.ai/', ['reader', 'search', 'embeddings', 'rerank'], 'read'),
  p('voyage-ai', 'Voyage AI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.voyageai.com/', ['embeddings', 'rerank'], 'read'),
  p('xai', 'xAI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://x.ai/', ['chat', 'reasoning', 'vision', 'tools'], 'draft'),
  p('qwen-cloud', 'Qwen Cloud', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://qwen.ai/', ['chat', 'reasoning', 'vision', 'audio', 'tools'], 'draft'),
  p('fireworks-ai', 'Fireworks AI', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://fireworks.ai/', ['chat', 'reasoning', 'image', 'embeddings', 'tools'], 'draft'),
  p('azure-openai', 'Azure OpenAI', 'ai', 'api-key-or-managed-identity', 'direct-api', 'adapter-ready', 'https://azure.microsoft.com/products/ai-services/openai-service', ['chat', 'reasoning', 'vision', 'image', 'speech', 'embeddings', 'tools'], 'draft', 'cloud-scheduler'),
  p('aws-bedrock', 'Amazon Bedrock', 'ai', 'iam-or-api-key', 'direct-api', 'adapter-ready', 'https://aws.amazon.com/bedrock/', ['chat', 'agents', 'knowledge-bases', 'image', 'embeddings', 'tools'], 'draft', 'cloud-scheduler'),
  p('google-vertex-ai', 'Google Vertex AI', 'ai', 'oauth-or-service-account', 'direct-api', 'adapter-ready', 'https://cloud.google.com/vertex-ai', ['chat', 'reasoning', 'vision', 'image', 'speech', 'embeddings', 'agents'], 'draft', 'cloud-scheduler'),
  p('ai21', 'AI21 Labs', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://www.ai21.com/', ['chat', 'reasoning', 'summarization'], 'draft'),
  p('fal-ai', 'fal.ai', 'ai', 'api-key', 'direct-api', 'adapter-ready', 'https://fal.ai/', ['image', 'video', 'audio', 'models'], 'draft', 'cloud-scheduler'),
  p('openai-compatible', 'OpenAI-compatible endpoint', 'ai', 'configurable', 'direct-api', 'built-in', 'https://platform.openai.com/docs/api-reference', ['chat', 'embeddings', 'tools', 'custom-endpoint'], 'draft', 'either'),

  // Communication and messaging.
  p('gmail', 'Gmail', 'communication', 'oauth', 'oauth', 'adapter-ready', 'https://workspace.google.com/products/gmail/', ['email-read', 'email-draft', 'email-send', 'attachments'], 'draft', 'cloud-scheduler'),
  p('outlook-mail', 'Microsoft Outlook Mail', 'communication', 'oauth', 'oauth', 'adapter-ready', 'https://www.microsoft.com/microsoft-365/outlook/outlook-for-business', ['email-read', 'email-draft', 'email-send', 'attachments'], 'draft', 'cloud-scheduler'),
  p('slack', 'Slack', 'communication', 'oauth-or-webhook', 'webhook', 'adapter-ready', 'https://slack.com/', ['messages', 'channels', 'files', 'alerts'], 'submit', 'cloud-scheduler'),
  p('microsoft-teams', 'Microsoft Teams', 'communication', 'oauth-or-webhook', 'oauth', 'adapter-ready', 'https://www.microsoft.com/microsoft-teams/', ['messages', 'channels', 'meetings', 'files'], 'submit', 'cloud-scheduler'),
  p('discord', 'Discord', 'communication', 'bot-token-or-webhook', 'webhook', 'adapter-ready', 'https://discord.com/', ['messages', 'channels', 'webhooks', 'community'], 'submit', 'cloud-scheduler'),
  p('telegram', 'Telegram', 'communication', 'bot-token', 'direct-api', 'adapter-ready', 'https://telegram.org/', ['messages', 'media', 'bots', 'mini-apps'], 'submit', 'cloud-scheduler'),
  p('whatsapp-business', 'WhatsApp Business Platform', 'communication', 'oauth-token', 'direct-api', 'adapter-ready', 'https://business.whatsapp.com/', ['messages', 'templates', 'media', 'support'], 'submit', 'cloud-scheduler'),
  p('twilio', 'Twilio', 'communication', 'api-key', 'direct-api', 'adapter-ready', 'https://www.twilio.com/', ['sms', 'voice', 'whatsapp', 'verification'], 'sensitive', 'cloud-scheduler'),
  p('sendgrid', 'Twilio SendGrid', 'communication', 'api-key', 'direct-api', 'adapter-ready', 'https://sendgrid.com/', ['transactional-email', 'campaigns', 'templates'], 'submit', 'cloud-scheduler'),
  p('mailgun', 'Mailgun', 'communication', 'api-key', 'direct-api', 'adapter-ready', 'https://www.mailgun.com/', ['transactional-email', 'validation', 'routing'], 'submit', 'cloud-scheduler'),
  p('postmark', 'Postmark', 'communication', 'server-token', 'direct-api', 'adapter-ready', 'https://postmarkapp.com/', ['transactional-email', 'templates', 'inbound'], 'submit', 'cloud-scheduler'),
  p('brevo', 'Brevo', 'communication', 'api-key', 'direct-api', 'adapter-ready', 'https://www.brevo.com/', ['email', 'sms', 'campaigns', 'contacts'], 'submit', 'cloud-scheduler'),
  p('messagebird', 'Bird', 'communication', 'api-key', 'direct-api', 'adapter-ready', 'https://bird.com/', ['sms', 'whatsapp', 'voice', 'inbox'], 'sensitive', 'cloud-scheduler'),
  p('zoom', 'Zoom', 'communication', 'oauth-or-server-to-server', 'oauth', 'adapter-ready', 'https://zoom.us/', ['meetings', 'webinars', 'recordings', 'chat'], 'submit', 'cloud-scheduler'),
  p('webex', 'Cisco Webex', 'communication', 'oauth', 'oauth', 'adapter-ready', 'https://www.webex.com/', ['meetings', 'messages', 'spaces', 'recordings'], 'submit', 'cloud-scheduler'),
  p('google-meet', 'Google Meet', 'communication', 'oauth', 'oauth', 'adapter-ready', 'https://workspace.google.com/products/meet/', ['meetings', 'conference-records', 'participants'], 'submit', 'cloud-scheduler'),
  p('ringcentral', 'RingCentral', 'communication', 'oauth', 'oauth', 'adapter-ready', 'https://www.ringcentral.com/', ['sms', 'voice', 'meetings', 'contacts'], 'sensitive', 'cloud-scheduler'),
  p('resend', 'Resend', 'communication', 'api-key', 'direct-api', 'adapter-ready', 'https://resend.com/', ['transactional-email', 'domains', 'templates'], 'submit', 'cloud-scheduler'),
  p('customerio', 'Customer.io', 'communication', 'api-key', 'direct-api', 'adapter-ready', 'https://customer.io/', ['email', 'sms', 'campaigns', 'segments'], 'submit', 'cloud-scheduler'),

  // Productivity and documents.
  p('microsoft-graph', 'Microsoft Graph', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://learn.microsoft.com/graph/', ['mail', 'calendar', 'files', 'users', 'teams', 'reports'], 'sensitive', 'cloud-scheduler'),
  p('google-tasks', 'Google Tasks', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://tasks.google.com/', ['tasks', 'lists', 'due-dates'], 'submit', 'cloud-scheduler'),
  p('onenote', 'Microsoft OneNote', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://www.onenote.com/', ['notebooks', 'sections', 'pages'], 'draft', 'cloud-scheduler'),
  p('miro', 'Miro', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://miro.com/', ['boards', 'cards', 'diagrams', 'collaboration'], 'draft', 'cloud-scheduler'),
  p('lucid', 'Lucid', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://lucid.co/', ['documents', 'diagrams', 'collaboration'], 'draft', 'cloud-scheduler'),
  p('google-calendar', 'Google Calendar', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://workspace.google.com/products/calendar/', ['calendar-read', 'calendar-write', 'availability'], 'submit', 'cloud-scheduler'),
  p('outlook-calendar', 'Microsoft Outlook Calendar', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://www.microsoft.com/microsoft-365/outlook/outlook-for-business', ['calendar-read', 'calendar-write', 'availability'], 'submit', 'cloud-scheduler'),
  p('google-drive', 'Google Drive', 'storage', 'oauth', 'oauth', 'adapter-ready', 'https://workspace.google.com/products/drive/', ['files', 'folders', 'sharing', 'export'], 'draft', 'cloud-scheduler'),
  p('onedrive', 'Microsoft OneDrive', 'storage', 'oauth', 'oauth', 'adapter-ready', 'https://www.microsoft.com/microsoft-365/onedrive/online-cloud-storage', ['files', 'folders', 'sharing'], 'draft', 'cloud-scheduler'),
  p('dropbox', 'Dropbox', 'storage', 'oauth', 'oauth', 'adapter-ready', 'https://www.dropbox.com/', ['files', 'folders', 'sharing', 'signatures'], 'draft', 'cloud-scheduler'),
  p('box', 'Box', 'storage', 'oauth', 'oauth', 'adapter-ready', 'https://www.box.com/', ['files', 'folders', 'sharing', 'enterprise-content'], 'draft', 'cloud-scheduler'),
  p('notion', 'Notion', 'productivity', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.notion.so/', ['pages', 'databases', 'comments', 'search'], 'draft', 'cloud-scheduler'),
  p('airtable', 'Airtable', 'productivity', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.airtable.com/', ['records', 'bases', 'forms', 'automation'], 'draft', 'cloud-scheduler'),
  p('google-sheets', 'Google Sheets', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://workspace.google.com/products/sheets/', ['rows', 'cells', 'charts', 'reporting'], 'draft', 'cloud-scheduler'),
  p('excel-online', 'Microsoft Excel Online', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://www.microsoft.com/microsoft-365/excel', ['rows', 'cells', 'tables', 'reporting'], 'draft', 'cloud-scheduler'),
  p('google-docs', 'Google Docs', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://workspace.google.com/products/docs/', ['documents', 'comments', 'templates', 'export'], 'draft', 'cloud-scheduler'),
  p('microsoft-word', 'Microsoft Word Online', 'productivity', 'oauth', 'oauth', 'adapter-ready', 'https://www.microsoft.com/microsoft-365/word', ['documents', 'templates', 'export'], 'draft', 'cloud-scheduler'),
  p('coda', 'Coda', 'productivity', 'api-token', 'direct-api', 'adapter-ready', 'https://coda.io/', ['docs', 'tables', 'rows', 'buttons'], 'draft', 'cloud-scheduler'),
  p('evernote', 'Evernote', 'productivity', 'oauth', 'bridge', 'bridge-ready', 'https://evernote.com/', ['notes', 'notebooks', 'search'], 'draft', 'cloud-scheduler'),

  // Project and work management.
  p('clickup', 'ClickUp', 'project', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://clickup.com/', ['tasks', 'lists', 'comments', 'time'], 'draft', 'cloud-scheduler'),
  p('asana', 'Asana', 'project', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://asana.com/', ['tasks', 'projects', 'comments', 'teams'], 'draft', 'cloud-scheduler'),
  p('trello', 'Trello', 'project', 'oauth-token', 'direct-api', 'adapter-ready', 'https://trello.com/', ['cards', 'boards', 'lists', 'comments'], 'draft', 'cloud-scheduler'),
  p('monday', 'monday.com', 'project', 'api-token', 'direct-api', 'adapter-ready', 'https://monday.com/', ['boards', 'items', 'updates', 'automation'], 'draft', 'cloud-scheduler'),
  p('linear', 'Linear', 'project', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://linear.app/', ['issues', 'projects', 'cycles', 'comments'], 'draft', 'cloud-scheduler'),
  p('jira', 'Jira', 'project', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.atlassian.com/software/jira', ['issues', 'projects', 'sprints', 'comments'], 'draft', 'cloud-scheduler'),
  p('confluence', 'Confluence', 'productivity', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.atlassian.com/software/confluence', ['pages', 'spaces', 'comments', 'search'], 'draft', 'cloud-scheduler'),
  p('todoist', 'Todoist', 'project', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://todoist.com/', ['tasks', 'projects', 'labels', 'comments'], 'draft', 'cloud-scheduler'),
  p('basecamp', 'Basecamp', 'project', 'oauth', 'bridge', 'bridge-ready', 'https://basecamp.com/', ['projects', 'todos', 'messages', 'schedule'], 'draft', 'cloud-scheduler'),
  p('smartsheet', 'Smartsheet', 'project', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.smartsheet.com/', ['sheets', 'rows', 'reports', 'automation'], 'draft', 'cloud-scheduler'),

  // CRM, sales and support.
  p('hubspot', 'HubSpot', 'crm', 'oauth-or-private-app', 'direct-api', 'adapter-ready', 'https://www.hubspot.com/', ['contacts', 'companies', 'deals', 'tickets', 'marketing'], 'draft', 'cloud-scheduler'),
  p('salesforce', 'Salesforce', 'crm', 'oauth', 'oauth', 'adapter-ready', 'https://www.salesforce.com/', ['leads', 'contacts', 'opportunities', 'cases'], 'draft', 'cloud-scheduler'),
  p('pipedrive', 'Pipedrive', 'crm', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.pipedrive.com/', ['people', 'organizations', 'deals', 'activities'], 'draft', 'cloud-scheduler'),
  p('zoho-crm', 'Zoho CRM', 'crm', 'oauth', 'oauth', 'adapter-ready', 'https://www.zoho.com/crm/', ['leads', 'contacts', 'deals', 'tasks'], 'draft', 'cloud-scheduler'),
  p('freshsales', 'Freshsales', 'crm', 'api-key', 'direct-api', 'adapter-ready', 'https://www.freshworks.com/crm/sales/', ['leads', 'contacts', 'deals', 'activities'], 'draft', 'cloud-scheduler'),
  p('zendesk', 'Zendesk', 'crm', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.zendesk.com/', ['tickets', 'users', 'organizations', 'help-center'], 'draft', 'cloud-scheduler'),
  p('intercom', 'Intercom', 'crm', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.intercom.com/', ['conversations', 'contacts', 'tickets', 'messages'], 'draft', 'cloud-scheduler'),
  p('freshdesk', 'Freshdesk', 'crm', 'api-key', 'direct-api', 'adapter-ready', 'https://www.freshworks.com/freshdesk/', ['tickets', 'contacts', 'companies', 'knowledge-base'], 'draft', 'cloud-scheduler'),
  p('helpscout', 'Help Scout', 'crm', 'oauth', 'direct-api', 'adapter-ready', 'https://www.helpscout.com/', ['conversations', 'customers', 'mailboxes', 'docs'], 'draft', 'cloud-scheduler'),
  p('gorgias', 'Gorgias', 'crm', 'api-key', 'direct-api', 'adapter-ready', 'https://www.gorgias.com/', ['tickets', 'customers', 'orders', 'macros'], 'draft', 'cloud-scheduler'),
  p('front', 'Front', 'crm', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://front.com/', ['inboxes', 'messages', 'contacts', 'rules'], 'draft', 'cloud-scheduler'),

  // W247: value-bearing commerce connectors are intentionally absent from the current product.

  // Marketing, social and publishing.
  p('youtube', 'YouTube', 'marketing', 'oauth', 'oauth', 'adapter-ready', 'https://www.youtube.com/', ['upload', 'playlists', 'comments', 'analytics'], 'submit', 'cloud-scheduler'),
  p('linkedin', 'LinkedIn', 'marketing', 'oauth', 'oauth', 'adapter-ready', 'https://www.linkedin.com/', ['posts', 'pages', 'media', 'analytics'], 'submit', 'cloud-scheduler'),
  p('meta-pages', 'Meta Pages', 'marketing', 'oauth', 'oauth', 'adapter-ready', 'https://www.facebook.com/business/', ['facebook-pages', 'instagram-business', 'media', 'insights'], 'submit', 'cloud-scheduler'),
  p('tiktok', 'TikTok for Developers', 'marketing', 'oauth', 'oauth', 'adapter-ready', 'https://developers.tiktok.com/', ['content-posting', 'video', 'analytics'], 'submit', 'cloud-scheduler'),
  p('x', 'X', 'marketing', 'oauth', 'oauth', 'adapter-ready', 'https://developer.x.com/', ['posts', 'media', 'search', 'analytics'], 'submit', 'cloud-scheduler'),
  p('reddit', 'Reddit', 'marketing', 'oauth', 'oauth', 'adapter-ready', 'https://www.reddit.com/dev/api/', ['posts', 'comments', 'communities', 'moderation'], 'submit', 'cloud-scheduler'),
  p('pinterest', 'Pinterest', 'marketing', 'oauth', 'oauth', 'adapter-ready', 'https://developers.pinterest.com/', ['pins', 'boards', 'media', 'analytics'], 'submit', 'cloud-scheduler'),
  p('mastodon', 'Mastodon', 'marketing', 'oauth-token', 'direct-api', 'adapter-ready', 'https://joinmastodon.org/', ['posts', 'media', 'notifications', 'search'], 'submit', 'cloud-scheduler'),
  p('bluesky', 'Bluesky', 'marketing', 'app-password-or-oauth', 'direct-api', 'adapter-ready', 'https://bsky.app/', ['posts', 'media', 'feeds', 'profiles'], 'submit', 'cloud-scheduler'),
  p('buffer', 'Buffer', 'marketing', 'oauth', 'bridge', 'bridge-ready', 'https://buffer.com/', ['publishing', 'queue', 'analytics'], 'submit', 'cloud-scheduler'),
  p('hootsuite', 'Hootsuite', 'marketing', 'oauth', 'bridge', 'bridge-ready', 'https://www.hootsuite.com/', ['publishing', 'streams', 'analytics'], 'submit', 'cloud-scheduler'),
  p('mailchimp', 'Mailchimp', 'marketing', 'oauth-or-api-key', 'direct-api', 'adapter-ready', 'https://mailchimp.com/', ['campaigns', 'audiences', 'templates', 'reports'], 'submit', 'cloud-scheduler'),
  p('convertkit', 'Kit', 'marketing', 'api-key', 'direct-api', 'adapter-ready', 'https://kit.com/', ['subscribers', 'forms', 'broadcasts', 'tags'], 'submit', 'cloud-scheduler'),

  // Content and media.
  p('wordpress', 'WordPress', 'content', 'application-password-or-oauth', 'direct-api', 'adapter-ready', 'https://wordpress.org/', ['posts', 'pages', 'media', 'comments'], 'submit', 'cloud-scheduler'),
  p('ghost', 'Ghost', 'content', 'admin-api-key', 'direct-api', 'adapter-ready', 'https://ghost.org/', ['posts', 'members', 'newsletters', 'tags'], 'submit', 'cloud-scheduler'),
  p('medium', 'Medium', 'content', 'browser-session', 'browser-companion', 'companion', 'https://medium.com/', ['drafts', 'publishing', 'publications'], 'submit', 'browser', 'Use reviewed composer handoff unless the account exposes an approved integration.'),
  p('devto', 'DEV Community', 'content', 'api-key', 'direct-api', 'adapter-ready', 'https://dev.to/', ['articles', 'comments', 'organizations'], 'submit', 'cloud-scheduler'),
  p('substack', 'Substack', 'content', 'browser-session', 'browser-companion', 'companion', 'https://substack.com/', ['drafts', 'newsletters', 'audience'], 'submit', 'browser', 'Reviewed browser companion or export handoff; no universal public publishing API is claimed.'),
  p('webflow', 'Webflow', 'content', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://webflow.com/', ['cms', 'sites', 'forms', 'assets'], 'submit', 'cloud-scheduler'),
  p('contentful', 'Contentful', 'content', 'api-token', 'direct-api', 'adapter-ready', 'https://www.contentful.com/', ['entries', 'assets', 'content-models', 'locales'], 'draft', 'cloud-scheduler'),
  p('sanity', 'Sanity', 'content', 'api-token', 'direct-api', 'adapter-ready', 'https://www.sanity.io/', ['documents', 'assets', 'datasets', 'queries'], 'draft', 'cloud-scheduler'),
  p('canva', 'Canva', 'content', 'oauth', 'oauth', 'adapter-ready', 'https://www.canva.com/', ['designs', 'exports', 'templates', 'assets'], 'draft', 'cloud-scheduler'),
  p('figma', 'Figma', 'content', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.figma.com/', ['files', 'comments', 'components', 'exports'], 'draft', 'cloud-scheduler'),
  p('vimeo', 'Vimeo', 'content', 'oauth-token', 'direct-api', 'adapter-ready', 'https://vimeo.com/', ['upload', 'video', 'folders', 'analytics'], 'submit', 'cloud-scheduler'),

  // Developer and DevOps.
  p('github', 'GitHub', 'developer', 'oauth-or-fine-grained-token', 'direct-api', 'adapter-ready', 'https://github.com/', ['repos', 'issues', 'pull-requests', 'actions', 'releases'], 'submit', 'cloud-scheduler'),
  p('gitlab', 'GitLab', 'developer', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://gitlab.com/', ['repos', 'issues', 'merge-requests', 'pipelines'], 'submit', 'cloud-scheduler'),
  p('bitbucket', 'Bitbucket', 'developer', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://bitbucket.org/', ['repos', 'issues', 'pull-requests', 'pipelines'], 'submit', 'cloud-scheduler'),
  p('cloudflare', 'Cloudflare', 'developer', 'api-token', 'direct-api', 'adapter-ready', 'https://www.cloudflare.com/', ['workers', 'pages', 'dns', 'r2', 'queues'], 'sensitive', 'cloud-scheduler'),
  p('vercel', 'Vercel', 'developer', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://vercel.com/', ['deployments', 'projects', 'domains', 'logs'], 'sensitive', 'cloud-scheduler'),
  p('netlify', 'Netlify', 'developer', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.netlify.com/', ['deployments', 'sites', 'forms', 'functions'], 'sensitive', 'cloud-scheduler'),
  p('sentry', 'Sentry', 'developer', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://sentry.io/', ['issues', 'events', 'releases', 'alerts'], 'draft', 'cloud-scheduler'),
  p('datadog', 'Datadog', 'developer', 'api-key-and-app-key', 'direct-api', 'adapter-ready', 'https://www.datadoghq.com/', ['metrics', 'logs', 'monitors', 'incidents'], 'draft', 'cloud-scheduler'),
  p('pagerduty', 'PagerDuty', 'developer', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.pagerduty.com/', ['incidents', 'schedules', 'on-call', 'alerts'], 'submit', 'cloud-scheduler'),

  // Data, databases and analytics.
  p('supabase', 'Supabase', 'data', 'service-role-or-oauth', 'direct-api', 'adapter-ready', 'https://supabase.com/', ['database', 'auth', 'storage', 'functions'], 'sensitive', 'cloud-scheduler'),
  p('firebase', 'Firebase', 'data', 'service-account-or-oauth', 'direct-api', 'adapter-ready', 'https://firebase.google.com/', ['database', 'auth', 'storage', 'functions', 'messaging'], 'sensitive', 'cloud-scheduler'),
  p('postgresql', 'PostgreSQL', 'data', 'connection-secret', 'database', 'adapter-ready', 'https://www.postgresql.org/', ['query', 'insert', 'update', 'transactions'], 'sensitive', 'local-runner'),
  p('mysql', 'MySQL', 'data', 'connection-secret', 'database', 'adapter-ready', 'https://www.mysql.com/', ['query', 'insert', 'update', 'transactions'], 'sensitive', 'local-runner'),
  p('mongodb-atlas', 'MongoDB Atlas', 'data', 'connection-secret', 'database', 'adapter-ready', 'https://www.mongodb.com/atlas', ['query', 'insert', 'update', 'search'], 'sensitive', 'local-runner'),
  p('snowflake', 'Snowflake', 'data', 'oauth-or-keypair', 'database', 'adapter-ready', 'https://www.snowflake.com/', ['query', 'warehouse', 'tasks', 'streams'], 'sensitive', 'local-runner'),
  p('bigquery', 'Google BigQuery', 'data', 'oauth-or-service-account', 'direct-api', 'adapter-ready', 'https://cloud.google.com/bigquery', ['query', 'datasets', 'jobs', 'analytics'], 'sensitive', 'cloud-scheduler'),
  p('google-analytics', 'Google Analytics', 'data', 'oauth', 'oauth', 'adapter-ready', 'https://marketingplatform.google.com/about/analytics/', ['reports', 'events', 'audiences', 'attribution'], 'read', 'cloud-scheduler'),
  p('mixpanel', 'Mixpanel', 'data', 'api-secret-or-oauth', 'direct-api', 'adapter-ready', 'https://mixpanel.com/', ['events', 'funnels', 'cohorts', 'reports'], 'read', 'cloud-scheduler'),
  p('segment', 'Twilio Segment', 'data', 'write-key-or-token', 'direct-api', 'adapter-ready', 'https://segment.com/', ['events', 'profiles', 'destinations', 'audiences'], 'submit', 'cloud-scheduler'),

  // Forms, signing, scheduling and people operations.
  p('typeform', 'Typeform', 'forms', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://www.typeform.com/', ['forms', 'responses', 'webhooks'], 'draft', 'cloud-scheduler'),
  p('jotform', 'Jotform', 'forms', 'api-key', 'direct-api', 'adapter-ready', 'https://www.jotform.com/', ['forms', 'submissions', 'files', 'webhooks'], 'draft', 'cloud-scheduler'),
  p('tally', 'Tally', 'forms', 'webhook-or-api-key', 'webhook', 'adapter-ready', 'https://tally.so/', ['forms', 'responses', 'webhooks'], 'draft', 'cloud-scheduler'),
  p('calendly', 'Calendly', 'forms', 'oauth-or-token', 'direct-api', 'adapter-ready', 'https://calendly.com/', ['events', 'invitees', 'availability', 'webhooks'], 'submit', 'cloud-scheduler'),
  p('docusign', 'DocuSign', 'forms', 'oauth', 'oauth', 'adapter-ready', 'https://www.docusign.com/', ['envelopes', 'templates', 'signatures', 'status'], 'sensitive', 'cloud-scheduler'),
  p('pandadoc', 'PandaDoc', 'forms', 'oauth-or-api-key', 'direct-api', 'adapter-ready', 'https://www.pandadoc.com/', ['documents', 'templates', 'signatures', 'status'], 'sensitive', 'cloud-scheduler'),
  p('bamboohr', 'BambooHR', 'hr', 'api-key', 'direct-api', 'adapter-ready', 'https://www.bamboohr.com/', ['employees', 'time-off', 'reports', 'applicants'], 'sensitive', 'cloud-scheduler'),
  p('workday', 'Workday', 'hr', 'enterprise-oauth', 'bridge', 'bridge-ready', 'https://www.workday.com/', ['workers', 'recruiting', 'finance', 'approvals'], 'sensitive', 'cloud-scheduler'),

  // W247: finance and money-movement connectors are intentionally absent from the current product.

  // Automation bridges and universal protocols.
  p('zapier', 'Zapier', 'automation', 'oauth-or-api-key', 'bridge', 'bridge-ready', 'https://zapier.com/', ['workflows', 'agents', 'webhooks', 'app-bridge'], 'submit', 'cloud-scheduler'),
  p('make', 'Make', 'automation', 'oauth-or-api-token', 'bridge', 'bridge-ready', 'https://www.make.com/', ['scenarios', 'webhooks', 'app-bridge', 'schedules'], 'submit', 'cloud-scheduler'),
  p('n8n', 'n8n', 'automation', 'api-key-or-self-hosted', 'bridge', 'bridge-ready', 'https://n8n.io/', ['workflows', 'webhooks', 'app-bridge', 'self-hosted'], 'submit', 'either'),
  p('pipedream', 'Pipedream Connect', 'automation', 'oauth-or-project-key', 'bridge', 'bridge-ready', 'https://pipedream.com/connect', ['actions', 'triggers', 'managed-auth', 'app-bridge'], 'submit', 'cloud-scheduler'),
  p('activepieces', 'Activepieces', 'automation', 'api-key-or-self-hosted', 'bridge', 'bridge-ready', 'https://www.activepieces.com/', ['flows', 'webhooks', 'app-bridge', 'self-hosted'], 'submit', 'either'),
  p('ifttt', 'IFTTT', 'automation', 'oauth-or-webhook', 'bridge', 'bridge-ready', 'https://ifttt.com/', ['applets', 'webhooks', 'iot', 'consumer-apps'], 'submit', 'cloud-scheduler'),
  p('workato', 'Workato', 'automation', 'enterprise-oauth', 'bridge', 'bridge-ready', 'https://www.workato.com/', ['recipes', 'enterprise-apps', 'governance'], 'submit', 'cloud-scheduler'),
  p('tray', 'Tray.ai', 'automation', 'enterprise-oauth', 'bridge', 'bridge-ready', 'https://tray.ai/', ['workflows', 'embedded-integrations', 'governance'], 'submit', 'cloud-scheduler'),
  p('power-automate', 'Microsoft Power Automate', 'automation', 'oauth', 'bridge', 'bridge-ready', 'https://www.microsoft.com/power-platform/products/power-automate', ['flows', 'connectors', 'approvals', 'desktop-automation'], 'submit', 'cloud-scheduler'),
  p('azure-logic-apps', 'Azure Logic Apps', 'automation', 'oauth-or-managed-identity', 'bridge', 'bridge-ready', 'https://azure.microsoft.com/products/logic-apps', ['workflows', 'connectors', 'events', 'enterprise-integration'], 'submit', 'cloud-scheduler'),
  p('webhook', 'Generic Webhook', 'local', 'optional-signing-secret', 'webhook', 'built-in', 'https://developer.mozilla.org/en-US/docs/Web/HTTP', ['trigger', 'action', 'json', 'signed-callback'], 'submit', 'either'),
  p('rest-api', 'Generic REST API', 'local', 'configurable', 'direct-api', 'built-in', 'https://developer.mozilla.org/en-US/docs/Web/HTTP', ['get', 'post', 'put', 'patch', 'delete'], 'sensitive', 'either'),
  p('graphql', 'Generic GraphQL API', 'local', 'configurable', 'direct-api', 'built-in', 'https://graphql.org/', ['query', 'mutation', 'subscription'], 'sensitive', 'either'),
  p('rss', 'RSS / Atom', 'local', 'none', 'direct-api', 'built-in', 'https://www.rssboard.org/', ['feed-read', 'monitor', 'content-source'], 'read', 'either'),
  p('csv-json', 'CSV / JSON Files', 'local', 'none', 'local', 'built-in', 'https://developer.mozilla.org/en-US/docs/Web/API/File', ['import', 'export', 'transform', 'report'], 'draft', 'browser'),
  p('mcp', 'Model Context Protocol', 'local', 'server-defined', 'mcp', 'built-in', 'https://modelcontextprotocol.io/', ['tools', 'resources', 'prompts', 'server-bridge'], 'draft', 'local-runner'),
  p('ollama', 'Ollama', 'local', 'local-endpoint', 'local', 'built-in', 'https://ollama.com/', ['chat', 'embeddings', 'vision', 'tools'], 'draft', 'local-runner'),
  p('lmstudio', 'LM Studio', 'local', 'local-endpoint', 'local', 'built-in', 'https://lmstudio.ai/', ['chat', 'embeddings', 'openai-compatible'], 'draft', 'local-runner'),
  p('jan', 'Jan', 'local', 'local-endpoint', 'local', 'built-in', 'https://jan.ai/', ['chat', 'local-models', 'openai-compatible'], 'draft', 'local-runner'),
  p('browser-companion', 'EON Browser Companion', 'local', 'user-install-and-host-allowlist', 'browser-companion', 'built-in', 'https://eonapp.ch/eon-browser.html', ['read-page', 'draft-form', 'submit-with-approval', 'download-with-approval'], 'submit', 'browser', 'Never bypasses CAPTCHA, MFA, login consent, paywalls, or site policy.'),
  p('local-runner', 'EON Local Runner', 'local', 'device-pairing', 'local', 'built-in', 'https://eonapp.ch/eon-browser.html', ['files', 'heavy-render', 'local-models', 'device-jobs'], 'sensitive', 'local-runner', 'Optional user-owned runner; not claimed active until paired.'),
  p('cloud-scheduler', 'EON Cloud Scheduler', 'local', 'explicit-opt-in', 'direct-api', 'built-in', 'https://eonapp.ch/eon-browser.html', ['schedules', 'retries', 'webhooks', 'run-history'], 'sensitive', 'cloud-scheduler', 'Disabled by default and only available after explicit deployment/configuration.')
];

export const AUTOMATION_PROVIDERS = Object.freeze(PROVIDERS);
export const AUTOMATION_PROVIDER_MAP = Object.freeze(Object.fromEntries(PROVIDERS.map((provider) => [provider.id, provider])));
export const AUTOMATION_CATEGORIES = Object.freeze(Object.entries(CATEGORY_LABELS).map(([id, label]) => Object.freeze({ id, label })));

export function getAutomationProvider(id = '') {
  return AUTOMATION_PROVIDER_MAP[String(id || '').trim().toLowerCase()] || null;
}

export function listAutomationProviders({ query = '', category = 'all', state = 'all', rail = 'all', capability = '' } = {}) {
  const needle = String(query || '').trim().toLowerCase();
  const categoryNeedle = String(category || 'all');
  const stateNeedle = String(state || 'all');
  const railNeedle = String(rail || 'all');
  const capabilityNeedle = String(capability || '').trim().toLowerCase();
  return AUTOMATION_PROVIDERS.filter((provider) => {
    if (categoryNeedle !== 'all' && provider.category !== categoryNeedle) return false;
    if (stateNeedle !== 'all' && provider.state !== stateNeedle) return false;
    if (railNeedle !== 'all' && provider.rail !== railNeedle) return false;
    if (capabilityNeedle && !provider.capabilities.some((item) => item.toLowerCase().includes(capabilityNeedle))) return false;
    if (!needle) return true;
    const haystack = [provider.id, provider.name, provider.categoryLabel, provider.auth, provider.rail, provider.stateLabel, provider.capabilities.join(' '), provider.notes].join(' ').toLowerCase();
    return haystack.includes(needle);
  });
}

export function getAutomationProviderStats() {
  const byCategory = {};
  const byState = {};
  const byRail = {};
  for (const provider of AUTOMATION_PROVIDERS) {
    byCategory[provider.category] = (byCategory[provider.category] || 0) + 1;
    byState[provider.state] = (byState[provider.state] || 0) + 1;
    byRail[provider.rail] = (byRail[provider.rail] || 0) + 1;
  }
  return Object.freeze({
    total: AUTOMATION_PROVIDERS.length,
    categories: Object.keys(byCategory).length,
    byCategory: Object.freeze(byCategory),
    byState: Object.freeze(byState),
    byRail: Object.freeze(byRail)
  });
}

export function buildProviderSetupChecklist(providerId = '') {
  const provider = getAutomationProvider(providerId);
  if (!provider) return null;
  const steps = [
    'Review the provider terms, account role, scopes, and data residency before connecting.',
    provider.auth === 'none'
      ? 'No credential is required for this local/public rail.'
      : 'Create the least-privilege credential or OAuth application required by the provider.',
    provider.credentialStorage === 'vault-reference-only'
      ? 'Store the credential in Vault. Automation OS keeps only a non-secret credential reference.'
      : 'Keep the configuration local to this workflow.',
    provider.rail === 'browser-companion'
      ? 'Install the EON Browser Companion and approve only the exact host and permission level needed.'
      : provider.rail === 'bridge'
        ? 'Connect the selected automation bridge and map its connection identifier.'
        : 'Run a read-only health check before enabling draft or submit actions.',
    provider.defaultApproval === 'sensitive'
      ? 'Sensitive actions always require a fresh explicit approval and cannot be remembered.'
      : 'Start in read or draft mode, then deliberately promote individual actions if needed.'
  ];
  return Object.freeze({ provider, steps: Object.freeze(steps) });
}

export function findProvidersForCapability(capability = '', { preferredStates = ['built-in', 'adapter-ready', 'bridge-ready', 'companion'], limit = 8 } = {}) {
  const needle = String(capability || '').trim().toLowerCase();
  if (!needle) return [];
  const rank = new Map(preferredStates.map((value, index) => [value, index]));
  return AUTOMATION_PROVIDERS
    .filter((provider) => provider.capabilities.some((item) => item.toLowerCase().includes(needle)))
    .sort((a, b) => (rank.get(a.state) ?? 99) - (rank.get(b.state) ?? 99) || a.name.localeCompare(b.name))
    .slice(0, Math.max(1, Number(limit) || 8));
}

export function validateAutomationProviderRegistry() {
  const failures = [];
  const ids = new Set();
  for (const provider of AUTOMATION_PROVIDERS) {
    if (!provider.id || !provider.name || !provider.category || !provider.state || !provider.rail) failures.push({ id: provider.id, reason: 'missing required field' });
    if (ids.has(provider.id)) failures.push({ id: provider.id, reason: 'duplicate id' });
    ids.add(provider.id);
    if (!Object.values(AUTOMATION_SUPPORT_STATES).includes(provider.state)) failures.push({ id: provider.id, reason: `unsupported state ${provider.state}` });
    if (!Object.values(AUTOMATION_APPROVAL_LEVELS).includes(provider.defaultApproval)) failures.push({ id: provider.id, reason: `unsupported approval ${provider.defaultApproval}` });
    if (provider.credentialStorage !== 'none' && provider.credentialStorage !== 'vault-reference-only') failures.push({ id: provider.id, reason: 'unsafe credential storage rule' });
    if (!Array.isArray(provider.capabilities) || provider.capabilities.length === 0) failures.push({ id: provider.id, reason: 'no capabilities' });
  }
  return Object.freeze({ ok: failures.length === 0, providerCount: AUTOMATION_PROVIDERS.length, failures: Object.freeze(failures) });
}

export default AUTOMATION_PROVIDERS;
