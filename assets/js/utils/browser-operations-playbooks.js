import { getActionTrustMeta } from './action-trust-model.js';

export const BROWSER_OPERATION_PLAYBOOKS = Object.freeze({
  lead_gen: {
    label: 'Lead gen follow-up',
    summary: 'Collect lead context, draft a personalized response, prepare CRM/browser entry, and stop before final send unless explicitly approved.',
    classMix: ['read', 'draft', 'submit'],
    steps: [
      'Read the page, inbox, or lead record and summarize context.',
      'Draft a personalized response or offer based on the lead.',
      'Prepare form fields or CRM updates.',
      'Pause before final submit/send for user review.'
    ],
    safeRail: 'draft-first'
  },
  discord_ops: {
    label: 'Discord / community ops',
    summary: 'Draft announcements, moderation notes, and server setup changes while keeping member actions and destructive changes reviewed.',
    classMix: ['read', 'draft', 'submit', 'sensitive'],
    steps: [
      'Read community context and summarize the current thread or server status.',
      'Draft an announcement, reply, or moderation note.',
      'Open the target channel or settings screen.',
      'Require review before posting, deleting, banning, or changing roles.'
    ],
    safeRail: 'review-before-community-impact'
  },
  site_update: {
    label: 'Business site update',
    summary: 'Gather page context, draft content or settings changes, and prepare the update path while keeping final publish reviewed.',
    classMix: ['read', 'draft', 'submit'],
    steps: [
      'Inspect the live site or CMS page.',
      'Draft updated copy, CTA, or content blocks.',
      'Prepare the CMS/browser update.',
      'Pause before final publish or save.'
    ],
    safeRail: 'publish-reviewed'
  },
  offer_post: {
    label: 'Offer / listing publish',
    summary: 'Prepare marketplace or service listings, enrich the copy, and open the publish flow while final posting stays reviewed.',
    classMix: ['read', 'draft', 'submit'],
    steps: [
      'Inspect platform requirements and current profile state.',
      'Draft the listing title, pricing, CTA, and description.',
      'Prepare media and proof assets.',
      'Pause before final publish or payment-linked steps.'
    ],
    safeRail: 'publish-reviewed'
  },
  inbox_triage: {
    label: 'Inbox triage',
    summary: 'Sort messages, draft replies, and group escalation actions while keeping send/archive/delete rules clear.',
    classMix: ['read', 'draft', 'submit', 'sensitive'],
    steps: [
      'Read and classify messages by urgency and opportunity.',
      'Draft responses or next actions.',
      'Prepare safe archive/label actions.',
      'Require review before sending, deleting, or high-impact changes.'
    ],
    safeRail: 'draft-and-review'
  },
  account_relogin: {
    label: 'Safe relogin flow',
    summary: 'Guide the user back into a saved account path using browser attachments and encrypted provider-entry mediation, without exposing raw secrets to the model.',
    classMix: ['read', 'sensitive'],
    steps: [
      'Detect which platform or host needs relogin.',
      'Check attached account/session context.',
      'Offer password-vault or social-login mediated relogin guidance.',
      'Require the user to complete sign-in, 2FA, and challenge steps.'
    ],
    safeRail: 'human-completes-login'
  }
});

export function getBrowserPlaybook(id = 'lead_gen') {
  return BROWSER_OPERATION_PLAYBOOKS[String(id || 'lead_gen').trim().toLowerCase()] || BROWSER_OPERATION_PLAYBOOKS.lead_gen;
}

export function buildBrowserPlaybookPlan(id = 'lead_gen') {
  const playbook = getBrowserPlaybook(id);
  const trustLabels = (playbook.classMix || []).map((cls) => getActionTrustMeta(cls)?.label || cls);
  const truthNotes = [
    playbook.safeRail === 'human-completes-login'
      ? 'Passwords, 2FA, and challenge completion stay with the user. EONAPP can guide the flow but should not impersonate the login step.'
      : 'Draft/navigation work can be accelerated, but final submit should still be reviewed.',
    'External websites, prompts, and forms remain untrusted until the user reviews them.'
  ];
  return {
    ...playbook,
    trustLabels,
    truthNotes
  };
}
