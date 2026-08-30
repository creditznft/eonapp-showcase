import { EON_PRODUCT_CONTEXT_VERSION, buildEonbotContextSlice } from './eonbot-context-registry.js';
import { buildEonbotTruthSystemPrompt } from './eonbot-truth-contract.js';
import { buildEonbotKnowledgeGrounding } from './eonbot-knowledge-grounding.js';
import { getEonChatGuideLanguage } from '../utils/language-matrix.js';

/** Current product context for local and API-backed EONBOT models. */
const MARKER = 'EONAPP_CONTEXT_V3';

export function buildEonbotSystemContext(extraInstructions = '', options = {}) {
  const extra = String(extraInstructions || '').trim().slice(0, 1200);
  const slice = buildEonbotContextSlice(options || {});
  const grounding = buildEonbotKnowledgeGrounding(options.input || '', {
    ...(options || {}),
    knowledgeMaxChars: options.knowledgeMaxChars || (options.compactContext ? 2800 : 4400),
    memoryLimit: options.memoryLimit ?? (options.compactContext ? 2 : 4)
  });
  const replyLanguage = getEonChatGuideLanguage(options.replyLanguage || '', null);
  const replyLanguageRule = replyLanguage
    ? `- Reply in ${replyLanguage.englishName} (${replyLanguage.code}) unless the user explicitly asks for another language.`
    : '- Follow the language used by the user unless they explicitly ask for another language.';

  return `${MARKER}\nVersion: ${EON_PRODUCT_CONTEXT_VERSION}\nYou are EONBOT, the practical assistant inside EONAPP.ch.\n\nProduct identity:\n- Chat is the primary place to ask, plan, and operate.\n- Create is the single beginner-first entry for Image, Video, Music, Website / Forge, Project / Document, Automation and Guide.\n- Projects holds meaningful work; Library holds reusable prompts and saved outputs.\n- Vault and Profile are private settings surfaces: never ask for or reveal passwords, API keys or recovery secrets.\n\n${slice.prompt}\n\n${grounding.prompt}\n\n${buildEonbotTruthSystemPrompt()}\n\nResponse rules:\n${replyLanguageRule}\n- Be concise, practical, warm and honest about Guide, Local, Direct BYOK, planned, unavailable and approval-required states.\n- Prefer clear user outcomes over old internal names such as Cockpit, Workbench, Preview Studio, Market, Realm, Hive, Twin or Sponsor Boost.\n- Ask before irreversible, external, financial, publishing or permission-changing actions.\n${extra ? `\nUser preference or custom instructions:\n${extra}` : ''}`;
}

export function buildEonbotTurnContext(input = '', options = {}) {
  return buildEonbotSystemContext(options.extraInstructions || '', { ...options, input });
}

export function mergeEonbotSystemContext(value = '', options = {}) {
  const raw = String(value || '').trim();
  if (raw.includes(MARKER)) return raw.slice(0, 12000);
  if (raw.includes('EONAPP_CONTEXT_V2')) return buildEonbotSystemContext(raw.replace(/^EONAPP_CONTEXT_V2[\s\S]*?Response rules:/, '').trim(), options).slice(0, 12000);
  return buildEonbotSystemContext(raw, options);
}
