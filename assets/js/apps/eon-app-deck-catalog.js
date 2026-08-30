/**
 * W362 / W376 — EON App Deck catalog.
 *
 * The App Deck is an outcome-first curated product surface, not an open
 * third-party app store. Cards only prepare local work, foreground chat,
 * local research navigation, or a reviewable Automation draft handoff.
 * They never install code, connect an account, call a provider, create a
 * payment/subscription, grant an entitlement, or execute an external action.
 */

import { EON_ACTION_CLASS_IDS, getEonActionClass } from '../automation/eon-action-taxonomy.js';

export const EON_APP_DECK_SCHEMA = 'eonapp.app-deck.v1';
export const EON_APP_DECK_VERSION = 3;
/** W376 baseline is kept so later expansions cannot rewrite historical catalogue truth. */
export const EON_APP_DECK_W376_BASE_VERSION = 2;
export const EON_APP_DECK_SELECTION_KEY = 'eon:app-deck:selection:v1';
/** Historical W362 base — preserved while W376 adds Insights & Forecasts. */
export const EON_APP_DECK_W362_BASE_CATEGORY_IDS = Object.freeze(['workrooms', 'crew', 'connections', 'blueprints']);
export const EON_APP_DECK_CATEGORY_IDS = Object.freeze(['workrooms', 'blueprints', 'insights', 'crew', 'connections']);

const CATEGORY_META = Object.freeze({
  workrooms: Object.freeze({ id: 'workrooms', label: 'Workrooms', summary: 'Choose an outcome-focused space instead of starting with a blank tool.' }),
  blueprints: Object.freeze({ id: 'blueprints', label: 'Blueprints', summary: 'Prepare versioned, approval-first local workflow drafts from official outcome packs.' }),
  insights: Object.freeze({ id: 'insights', label: 'Insights & Forecasts', summary: 'Open local research desks for evidence, scenarios, business questions and calibrated forecasts.' }),
  crew: Object.freeze({ id: 'crew', label: 'AI Crew', summary: 'Choose a role-scoped AI collaborator for foreground planning and review.' }),
  connections: Object.freeze({ id: 'connections', label: 'Connections', summary: 'See which services may be connected later and exactly what future permissions would mean.' })
});

function buildBlueprintPackSpec(card = {}) {
  const outcome = String(card.outcome || 'A reviewable local work package.');
  return Object.freeze({
    schema: 'eonapp.official-blueprint-pack.v1',
    requiredInputs: Object.freeze([...(card.requiredInputs || ['Outcome and audience', 'Constraints and deadline', 'User-owned notes or source material'])]),
    deliverables: Object.freeze([...(card.deliverables || [outcome, 'A local Project brief', 'A reusable Library template', 'A reviewable Automation draft'])]),
    reviewCheckpoints: Object.freeze([...(card.reviewCheckpoints || ['Confirm the scope and boundaries', 'Review assumptions and source notes', 'Choose any manual next action yourself'])]),
    privacyBoundary: String(card.privacyBoundary || 'Uses user-supplied local notes only; no account connection, publishing or automatic external action.').slice(0, 320),
    changeNotes: String(card.changeNotes || 'Versioned official local pack. Review the pack before reusing it.').slice(0, 320),
    workroomEligible: true
  });
}

function officialBlueprint(card = {}) {
  const packVersion = String(card.packVersion || '1.0.0');
  return Object.freeze({
    kind: 'official-blueprint',
    ...card,
    packVersion,
    packSpec: buildBlueprintPackSpec(card),
    actionClasses: Object.freeze([...(card.actionClasses || [])])
  });
}

const CATALOG = Object.freeze({
  workrooms: Object.freeze([
    Object.freeze({ id: 'launch-room', label: 'Launch Room', icon: '◈', cityDistrict: 'Creator Tower', summary: 'Turn an idea, offer, event, product or site into one clear launch plan.', route: '/?new=1', chatPrompt: 'Help me create a practical launch plan. Start by asking what I am launching, who it is for, and the outcome I need. Then prepare a clear local plan with deliverables, timeline, risks, and next actions. Do not publish, spend, message anyone, or claim an external action happened.', outcome: 'A review-ready launch brief and next-step checklist.' }),
    Object.freeze({ id: 'creator-room', label: 'Creator Room', icon: '✦', cityDistrict: 'Creator Tower', summary: 'Shape content, campaigns, scripts, storyboards and creative direction.', route: '/?new=1', chatPrompt: 'Help me turn my idea into a creator brief. Ask about audience, format, tone, platform, and deadline. Prepare concepts, structure, assets needed, and a review checklist. Keep this as a local draft; do not generate a publishing claim or auto-post.', outcome: 'A creator brief, content sequence and review checklist.' }),
    Object.freeze({ id: 'builder-room', label: 'Builder Room', icon: '▣', cityDistrict: 'Build Workshop', summary: 'Plan software, websites, fixes, product flows and developer handoffs.', route: '/?new=1', chatPrompt: 'Help me make a build plan for a software or website outcome. Ask one clarifying question at a time. Return a user-focused scope, screens or flows, architecture options, acceptance criteria, privacy boundary, QA checklist, and handoff steps. Do not deploy or claim production readiness.', outcome: 'A build specification, acceptance criteria and handoff checklist.' }),
    Object.freeze({ id: 'business-room', label: 'Business Room', icon: '⌘', cityDistrict: 'Command Centre', summary: 'Organise proposals, client follow-ups, operations, offers and daily priorities.', route: '/?new=1', chatPrompt: 'Help me organise a business outcome. Ask about the customer, goal, deadline, constraints, and success signal. Prepare a proposal, operating checklist, follow-up drafts, and approval points. Do not send messages, take payments, or create financial commitments.', outcome: 'A grounded operating plan with draft-ready communication.' })
  ]),
  blueprints: Object.freeze([
    officialBlueprint({ id: 'friday-event-launch', label: 'Friday Event Launch', icon: '◈', packFamily: 'Creator', workflowTemplateId: 'local-event-launch', summary: 'Prepare an event launch package: brief, flyer direction, posts, booking message and review checklist.', automationGoal: 'Prepare a Friday event launch package from my local notes. Draft the flyer brief, social post ideas, booking message, and review checklist. Do not publish, send messages, spend money, or access external accounts.', actionClasses: ['draft', 'publish'], outcome: 'A review-ready event launch draft.' }),
    officialBlueprint({ id: 'creator-weekly-engine', label: 'Creator Weekly Engine', icon: '✦', packFamily: 'Creator', workflowTemplateId: 'local-creator-engine', summary: 'Turn ideas into a weekly content structure with asset needs and a publish-review step.', automationGoal: 'Create a weekly creator workflow from my local ideas. Prepare a content calendar, caption drafts, script outlines, asset checklist, and a final review step. Do not post or use an external provider.', actionClasses: ['read', 'draft', 'publish'], outcome: 'A weekly content plan ready for review.' }),
    officialBlueprint({ id: 'website-launch-protocol', label: 'Website Launch Protocol', icon: '▣', packFamily: 'Builder', workflowTemplateId: 'local-website-release', summary: 'Prepare a build, QA, launch and post-launch checklist for a website or app.', automationGoal: 'Create a local website launch protocol. Prepare build checks, accessibility and performance checks, deployment review steps, launch copy drafts, and rollback questions. Do not deploy, publish, or change hosting.', actionClasses: ['draft', 'write', 'publish', 'admin'], outcome: 'A staged website launch and QA plan.' }),
    officialBlueprint({ id: 'freelancer-client-loop', label: 'Freelancer Client Loop', icon: '⌘', packFamily: 'Business', workflowTemplateId: 'local-client-delivery', summary: 'Prepare a proposal, scope, follow-up schedule and invoice draft checklist.', automationGoal: 'Prepare a freelancer client workflow using local notes. Draft a proposal structure, scope checklist, follow-up schedule, progress update template, and invoice draft checklist. Do not send emails, create invoices, or charge a client.', actionClasses: ['draft', 'write', 'publish', 'spend'], outcome: 'A client-ready but unsent service workflow.' }),
    officialBlueprint({ id: 'business-morning-brief', label: 'Business Morning Brief', icon: '◷', packFamily: 'Business', workflowTemplateId: 'local-business-brief', summary: 'Prepare a daily operating brief from local priorities, tasks and risks.', automationGoal: 'Prepare a local business morning brief. Organize priorities, deadlines, risks, follow-ups, and a short plan for today. Do not read external accounts, send messages, or schedule anything.', actionClasses: ['read', 'draft'], outcome: 'A calm, structured daily operating brief.' }),
    officialBlueprint({ id: 'local-project-rescue', label: 'Local Project Rescue', icon: '◇', packFamily: 'Builder', workflowTemplateId: 'local-project-rescue', summary: 'Diagnose a stuck project, identify the smallest recovery slice and create a decision log.', automationGoal: 'Help me rescue a stuck project. Identify the desired outcome, current blockers, smallest testable recovery slice, owner decisions, and an evidence checklist. Keep it local and do not modify external systems.', actionClasses: ['draft', 'write'], outcome: 'A recovery plan with measurable next steps.' }),
    officialBlueprint({ id: 'personal-study-system', label: 'Personal Study System', icon: '⌁', packFamily: 'Personal', workflowTemplateId: 'local-study-system', summary: 'Build an achievable study plan, review rhythm, flashcard outline and reminder draft.', automationGoal: 'Prepare a personal study workflow. Create a weekly plan, lesson breakdown, active recall prompts, review cadence, and reminder drafts. Do not create calendar events or send notifications.', actionClasses: ['draft', 'write'], outcome: 'A personal learning system ready for manual setup.' }),
    officialBlueprint({ id: 'client-onboarding-system', label: 'Client Onboarding System', icon: '⌘', packFamily: 'Business', workflowTemplateId: 'local-client-delivery', summary: 'Prepare local intake, scope, approval and follow-up records for a client relationship.', automationGoal: 'Prepare a local client onboarding system. Draft an intake checklist, scope questions, approval points, project setup notes and follow-up draft. Do not send messages, create an invoice, or access external accounts.', actionClasses: ['read', 'draft', 'write'], outcome: 'A client onboarding pack ready for review.' }),
    officialBlueprint({ id: 'offer-validation-sprint', label: 'Offer Validation Sprint', icon: '◇', packFamily: 'Business', workflowTemplateId: 'local-business-brief', summary: 'Frame a customer problem, offer hypothesis, evidence plan and low-risk experiment.', automationGoal: 'Prepare an offer validation sprint. Draft the audience problem, offer hypothesis, assumptions, evidence questions, small test design and review criteria. Do not run ads, charge customers, or claim results.', actionClasses: ['read', 'draft', 'write'], outcome: 'A practical validation brief with clear assumptions.' }),
    officialBlueprint({ id: 'community-session-plan', label: 'Community Session Plan', icon: '◎', packFamily: 'Business', workflowTemplateId: 'local-event-launch', summary: 'Prepare a run-of-show, host plan, participant notes and feedback review for a local session.', automationGoal: 'Prepare a community session plan from local notes. Draft the session goal, run-of-show, host roles, materials, feedback questions and review checklist. Do not schedule, publish, or message participants.', actionClasses: ['draft', 'write'], outcome: 'A calm session plan ready for manual coordination.' }),
    officialBlueprint({ id: 'newsletter-engine', label: 'Newsletter Engine', icon: '✦', packFamily: 'Creator', workflowTemplateId: 'local-creator-engine', summary: 'Create a repeatable topic, draft, review and send-ready checklist without sending.', automationGoal: 'Prepare a local newsletter engine. Draft topic selection, outline, source checks, editing checklist, subject-line options and send-ready review. Do not access a mailing list or send anything.', actionClasses: ['read', 'draft', 'write', 'publish'], outcome: 'A newsletter workflow ready for a later human send.' }),
    officialBlueprint({ id: 'content-repurpose-loop', label: 'Content Repurpose Loop', icon: '✦', packFamily: 'Creator', workflowTemplateId: 'local-creator-engine', summary: 'Turn a user-owned source into ethical multi-format drafts and review steps.', automationGoal: 'Prepare a local content repurpose loop using user-owned material. Draft ethical format ideas, adaptations, asset needs, fact checks and final review steps. Do not copy protected work or post anywhere.', actionClasses: ['read', 'draft', 'write', 'publish'], outcome: 'A reusable content adaptation plan.' }),
    officialBlueprint({ id: 'brand-foundation', label: 'Brand Foundation', icon: '✦', packFamily: 'Creator', workflowTemplateId: 'local-creator-engine', summary: 'Clarify voice, promise, audience, visual direction and review criteria for a brand.', automationGoal: 'Prepare a local brand foundation. Draft audience, promise, voice, visual direction, message examples and review criteria. Do not claim a trademark search, publish a brand asset, or spend money.', actionClasses: ['read', 'draft', 'write'], outcome: 'A grounded brand foundation brief.' }),
    officialBlueprint({ id: 'product-discovery-sprint', label: 'Product Discovery Sprint', icon: '▣', packFamily: 'Builder', workflowTemplateId: 'local-product-qa', summary: 'Turn a problem into user needs, scope, constraints and acceptance criteria.', automationGoal: 'Prepare a local product discovery sprint. Draft the user problem, evidence needs, constraints, smallest scope, acceptance criteria, privacy considerations and review questions. Do not build, deploy, or claim research was conducted.', actionClasses: ['read', 'draft', 'write'], outcome: 'A product discovery and scope brief.' }),
    officialBlueprint({ id: 'bug-triage-qa', label: 'Bug Triage & QA', icon: '▣', packFamily: 'Builder', workflowTemplateId: 'local-product-qa', summary: 'Capture reproduction steps, impact, priority, test plan and release checklist.', automationGoal: 'Prepare a local bug triage and QA plan. Draft reproduction steps, impact, severity, test matrix, regression checks, release criteria and rollback questions. Do not change a repository or deploy a fix.', actionClasses: ['read', 'draft', 'write', 'admin'], outcome: 'A testable bug triage and QA pack.' }),
    officialBlueprint({ id: 'decision-research-brief', label: 'Decision Research Brief', icon: '⌁', packFamily: 'Research', workflowTemplateId: 'local-research-decision', summary: 'Structure a question, evidence plan, uncertainties, options and decision memo.', automationGoal: 'Prepare a local decision research brief. Draft the question, options, evidence needed, unknowns, assumptions, risks, recommendation criteria and review checkpoint. Do not invent sources or make a decision for me.', actionClasses: ['read', 'draft', 'write'], outcome: 'An evidence-aware decision memo.' }),
    officialBlueprint({ id: 'competitor-observation-map', label: 'Competitor Observation Map', icon: '⌁', packFamily: 'Research', workflowTemplateId: 'local-competitor-review', summary: 'Compare lawful public observations while separating facts, assumptions and caveats.', automationGoal: 'Prepare a lawful public competitor observation map. Draft comparison categories, source logging, caveats, assumptions, differentiation questions and review criteria. Do not scrape private systems, collect personal data, or claim current research happened.', actionClasses: ['read', 'draft', 'write'], outcome: 'A cautious competitor observation framework.' }),
    officialBlueprint({ id: 'pricing-demand-review', label: 'Pricing & Demand Review', icon: '⌁', packFamily: 'Research', workflowTemplateId: 'local-business-brief', summary: 'Explore assumptions, scenarios, customer evidence and the next low-risk test.', automationGoal: 'Prepare a local pricing and demand review. Draft customer assumptions, possible price scenarios, evidence sources, trade-offs, success measures and next low-risk test. Do not set prices automatically or promise revenue.', actionClasses: ['read', 'draft', 'write'], outcome: 'A pricing and demand review with explicit uncertainty.' }),
    officialBlueprint({ id: 'portfolio-launch-kit', label: 'Portfolio Launch Kit', icon: '◇', packFamily: 'Career', workflowTemplateId: 'local-client-delivery', summary: 'Organise case-study structure, proof checklist, profile draft and outreach review.', automationGoal: 'Prepare a local portfolio launch kit. Draft case-study structure, proof checklist, profile outline, feedback questions and outreach drafts. Do not contact anyone, upload work, or make employment claims.', actionClasses: ['read', 'draft', 'write', 'publish'], outcome: 'A career portfolio pack ready for manual review.' }),
    officialBlueprint({ id: 'personal-knowledge-system', label: 'Personal Knowledge System', icon: '⌁', packFamily: 'Personal', workflowTemplateId: 'local-study-system', summary: 'Design capture, review, retrieval and privacy-safe maintenance around user-owned notes.', automationGoal: 'Prepare a local personal knowledge system. Draft capture habits, review rhythm, retrieval methods, privacy boundaries, cleanup steps and a maintenance checklist. Do not connect external note accounts or copy private content.', actionClasses: ['read', 'draft', 'write', 'delete'], outcome: 'A sustainable knowledge workflow with privacy boundaries.' }),
    officialBlueprint({ id: 'hospitality-service-playbook', label: 'Hospitality Service Playbook', icon: '⌂', packFamily: 'Operations', packVersion: '1.1.0', workflowTemplateId: 'local-hospitality-operations', summary: 'Prepare service standards, shift readiness, guest recovery notes and a local operations review.', automationGoal: 'Prepare a local hospitality service playbook. Draft opening checks, guest experience standards, service recovery notes, role cues and a review checklist. Do not message guests, access booking systems or claim a service action happened.', actionClasses: ['read', 'draft', 'write'], outcome: 'A practical service playbook ready for manual use.' }),
    officialBlueprint({ id: 'event-partner-protocol', label: 'Event Partner Protocol', icon: '◎', packFamily: 'Operations', packVersion: '1.1.0', workflowTemplateId: 'local-hospitality-operations', summary: 'Prepare partner roles, venue requirements, run-of-show and a reviewable collaboration record.', automationGoal: 'Prepare a local event partner protocol. Draft roles, contribution list, venue needs, run-of-show, review points and a manual follow-up outline. Do not contact partners, confirm bookings or create a financial commitment.', actionClasses: ['read', 'draft', 'write'], outcome: 'A partner-ready local collaboration protocol.' }),
    officialBlueprint({ id: 'sponsorship-proposal-system', label: 'Sponsorship Proposal System', icon: '◈', packFamily: 'Business', packVersion: '1.1.0', workflowTemplateId: 'local-client-delivery', summary: 'Prepare a sponsorship offer, value map, proposal outline and manual outreach review.', automationGoal: 'Prepare a local sponsorship proposal system. Draft sponsor fit criteria, value map, proposal structure, follow-up outline and review checkpoints. Do not send a proposal, contact sponsors or claim a deal exists.', actionClasses: ['read', 'draft', 'write'], outcome: 'A sponsor proposal package ready for review.' }),
    officialBlueprint({ id: 'campaign-measurement-loop', label: 'Campaign Measurement Loop', icon: '◷', packFamily: 'Business', packVersion: '1.1.0', workflowTemplateId: 'local-campaign-review', summary: 'Define campaign questions, measurement notes, outcome review and the next manual experiment.', automationGoal: 'Prepare a local campaign measurement loop. Define the campaign question, available local observations, metrics, assumptions, review cadence and next experiment. Do not collect external account data or claim results.', actionClasses: ['read', 'draft', 'write'], outcome: 'A reusable campaign review loop.' }),
    officialBlueprint({ id: 'ecommerce-catalog-launch', label: 'E-commerce Catalog Launch', icon: '▤', packFamily: 'Business', packVersion: '1.1.0', workflowTemplateId: 'local-ecommerce-launch', summary: 'Prepare product listing copy, catalog QA, photo checklist, launch review and customer questions.', automationGoal: 'Prepare a local e-commerce catalog launch. Draft listing structure, product facts, image checklist, catalog QA, customer questions and review steps. Do not publish listings, change a store or make a sales claim.', actionClasses: ['read', 'draft', 'write', 'publish'], outcome: 'A catalog launch package ready for manual publishing.' }),
    officialBlueprint({ id: 'customer-feedback-synthesis', label: 'Customer Feedback Synthesis', icon: '⌁', packFamily: 'Research', packVersion: '1.1.0', workflowTemplateId: 'local-research-decision', summary: 'Turn user-supplied feedback into themes, caveats, evidence notes and product decisions.', automationGoal: 'Prepare a local customer feedback synthesis. Cluster user-supplied comments, identify themes, preserve caveats, list evidence gaps and propose review questions. Do not access private accounts or claim survey results.', actionClasses: ['read', 'draft', 'write'], outcome: 'A grounded feedback memo with decision questions.' }),
    officialBlueprint({ id: 'documentation-handoff-system', label: 'Documentation Handoff System', icon: '▣', packFamily: 'Builder', packVersion: '1.1.0', workflowTemplateId: 'local-documentation-handoff', summary: 'Prepare a maintainable handoff: purpose, setup, decisions, verification and ownership cues.', automationGoal: 'Prepare a local documentation handoff. Draft purpose, setup notes, decision log, verification steps, known limits and ownership cues. Do not access repositories, publish documents or claim a handoff occurred.', actionClasses: ['read', 'draft', 'write'], outcome: 'A review-ready technical or operational handoff.' }),
    officialBlueprint({ id: 'meeting-decision-system', label: 'Meeting Decision System', icon: '◇', packFamily: 'Operations', packVersion: '1.1.0', workflowTemplateId: 'local-meeting-decision', summary: 'Prepare agenda, decision framing, note template, actions and an approval-first follow-up draft.', automationGoal: 'Prepare a local meeting decision system. Draft agenda, decision questions, note structure, action checklist and an unsent follow-up outline. Do not schedule, send messages or create tasks in external services.', actionClasses: ['read', 'draft', 'write'], outcome: 'A structured meeting and decision record.' }),
    officialBlueprint({ id: 'job-search-portfolio-system', label: 'Job Search & Portfolio System', icon: '✦', packFamily: 'Personal', packVersion: '1.1.0', workflowTemplateId: 'local-personal-operations', summary: 'Prepare role criteria, portfolio gaps, application materials, review cadence and manual follow-up notes.', automationGoal: 'Prepare a local job search and portfolio system. Draft role criteria, skills evidence, portfolio improvements, application checklist and manual follow-up notes. Do not apply, send messages or claim an interview outcome.', actionClasses: ['read', 'draft', 'write', 'publish'], outcome: 'A focused job-search and portfolio operating system.' }),
    officialBlueprint({ id: 'personal-admin-reset', label: 'Personal Admin Reset', icon: '⌂', packFamily: 'Personal', packVersion: '1.1.0', workflowTemplateId: 'local-personal-operations', summary: 'Reset priorities, documents, reminders, local records and a calm weekly review routine.', automationGoal: 'Prepare a local personal admin reset. Sort priorities, draft a records checklist, define a weekly review routine and capture reminders for manual setup. Do not access accounts, create calendar events or send notifications.', actionClasses: ['read', 'draft', 'write', 'delete'], outcome: 'A calm personal operations reset plan.' }),
    officialBlueprint({ id: 'research-evidence-memo', label: 'Research Evidence Memo', icon: '⌁', packFamily: 'Research', packVersion: '1.1.0', workflowTemplateId: 'local-research-decision', summary: 'Turn a question into a source plan, assumption ledger, evidence memo and decision boundary.', automationGoal: 'Prepare a local research evidence memo. Define the question, source plan, assumptions, supporting and opposing evidence, unknowns and decision boundary. Do not browse automatically or claim live research was completed.', actionClasses: ['read', 'draft', 'write'], outcome: 'A clear evidence memo with uncertainty notes.' }),
    officialBlueprint({ id: 'product-experiment-review', label: 'Product Experiment Review', icon: '◈', packFamily: 'Builder', packVersion: '1.1.0', workflowTemplateId: 'local-product-qa', summary: 'Prepare a testable product question, acceptance criteria, observation plan and safe review checkpoint.', automationGoal: 'Prepare a local product experiment review. Define the customer question, hypothesis, acceptance criteria, observation plan, privacy checks and review checkpoint. Do not change code, publish an experiment or claim a result.', actionClasses: ['read', 'draft', 'write'], outcome: 'A product experiment review packet.' })
  ]),
  insights: Object.freeze([
    Object.freeze({ id: 'market-intelligence-desk', label: 'Research Lab', icon: '↗', desk: 'market', route: '/insights?desk=market', summary: 'Use manual or CSV observations to explore a thesis, evidence and historical scenarios.', actionClasses: Object.freeze(['read', 'draft']), outcome: 'A local research workspace with no price feed, order or recommendation.' }),
    Object.freeze({ id: 'business-intelligence-desk', label: 'Business Research', icon: '⌘', desk: 'business', route: '/insights?desk=business', summary: 'Explore demand, pricing, customer feedback, campaigns and operations as reviewable local briefs.', actionClasses: Object.freeze(['read', 'draft', 'write']), outcome: 'A practical business research brief with uncertainty.' }),
    Object.freeze({ id: 'forecast-studio-desk', label: 'Scenario Studio', icon: '◇', desk: 'forecast', route: '/insights?desk=forecast', summary: 'Record private probabilities, resolution rules and calibration notes without an economic incentive.', actionClasses: Object.freeze(['draft', 'write']), outcome: 'A private non-monetary forecast journal.' }),
    Object.freeze({ id: 'research-journal-desk', label: 'Research Journal', icon: '⌁', desk: 'research', route: '/insights?desk=research', summary: 'Capture claims, sources, caveats and what would change your mind.', actionClasses: Object.freeze(['read', 'draft', 'write']), outcome: 'A traceable local evidence journal.' }),
    Object.freeze({ id: 'local-data-lab-desk', label: 'Local Data Lab', icon: '▤', desk: 'data', route: '/insights?desk=data', summary: 'Add manual values or a user-owned CSV, inspect provenance and create a local receipt.', actionClasses: Object.freeze(['read', 'write']), outcome: 'A local data review with no automatic market feed.' })
  ]),
  crew: Object.freeze([
    Object.freeze({ id: 'eonbot-coordinator', label: 'EONBOT Coordinator', icon: '◌', cityDistrict: 'Command Centre', summary: 'Break a goal into clear, reviewable work packets and route the next step.', role: 'coordinator', chatPrompt: 'Act as an EONBOT Coordinator. Help me turn my goal into a short ordered plan with clear decisions, dependencies, and review points. Do not imply autonomous work, provider calls, or external execution.', outcome: 'A bounded plan with visible decision points.' }),
    Object.freeze({ id: 'researcher', label: 'Researcher', icon: '⌁', cityDistrict: 'Knowledge Archive', summary: 'Structure research questions, sources, evidence needs and uncertainty.', role: 'researcher', chatPrompt: 'Act as an EON Researcher. Help me frame a research plan, identify evidence needs, distinguish facts from assumptions, and produce a source-ready brief. Do not invent citations or claim browsing happened unless the current chat actually has verified sources.', outcome: 'A research brief with uncertainty and evidence requirements.' }),
    Object.freeze({ id: 'builder', label: 'Builder', icon: '▣', cityDistrict: 'Build Workshop', summary: 'Translate an idea into implementation steps, quality gates and test plans.', role: 'builder', chatPrompt: 'Act as an EON Builder. Help me plan an implementation with a small, testable first slice, interface boundaries, risks, code-quality checks, and delivery milestones. Do not deploy, merge, or modify an external system.', outcome: 'An implementation plan and verification checklist.' }),
    Object.freeze({ id: 'creator', label: 'Creator', icon: '✦', cityDistrict: 'Creator Tower', summary: 'Develop a creative direction, asset brief, audience message and content structure.', role: 'creator', chatPrompt: 'Act as an EON Creator. Help me develop a clear original creative direction, asset brief, message structure, and review criteria. Avoid copying protected work and do not claim content was published or generated by an external provider.', outcome: 'An original creative brief and production checklist.' }),
    Object.freeze({ id: 'reviewer', label: 'Reviewer', icon: '◇', cityDistrict: 'Review Hall', summary: 'Check a plan for safety, truthfulness, permissions, quality and missing approvals.', role: 'reviewer', chatPrompt: 'Act as an EON Reviewer. Examine my plan for unsupported claims, privacy issues, missing approvals, dangerous external effects, weak success criteria, and quality gaps. Return a concise go/no-go checklist. Do not approve your own execution or override my decision.', outcome: 'A reviewer checklist with explicit blockers.' })
  ]),
  connections: Object.freeze([
    Object.freeze({ id: 'calendar-relay', label: 'Calendar Relay', icon: '◷', service: 'Calendar', summary: 'Future scheduling and availability connection with visible event approval.', actionClasses: Object.freeze(['read', 'write', 'delete']), lifecycle: 'planned', outcome: 'Future: inspect availability, prepare event changes, then require confirmation.' }),
    Object.freeze({ id: 'mail-relay', label: 'Mail Relay', icon: '✉', service: 'Email', summary: 'Future drafting and sending connection that never captures mailbox passwords.', actionClasses: Object.freeze(['read', 'draft', 'publish']), lifecycle: 'planned', outcome: 'Future: read only approved scope, draft messages, confirm before sending.' }),
    Object.freeze({ id: 'telegram-relay', label: 'Telegram Relay', icon: '◉', service: 'Telegram', summary: 'Future message and channel handoff with destination-visible approval.', actionClasses: Object.freeze(['draft', 'publish']), lifecycle: 'planned', outcome: 'Future: prepare post or message, show destination, ask before send.' }),
    Object.freeze({ id: 'github-workshop', label: 'GitHub Workshop', icon: '⌘', service: 'GitHub', summary: 'Future project and code collaboration connection with deliberate write boundaries.', actionClasses: Object.freeze(['read', 'draft', 'write', 'publish', 'admin']), lifecycle: 'planned', outcome: 'Future: inspect repositories, prepare patches, require review before any remote write.' }),
    Object.freeze({ id: 'cloudflare-tower', label: 'Cloudflare Tower', icon: '▤', service: 'Cloudflare', summary: 'Future deployment review connection, never an invisible production launcher.', actionClasses: Object.freeze(['read', 'draft', 'write', 'publish', 'admin']), lifecycle: 'planned', outcome: 'Future: inspect configured deployment facts, prepare a deployment packet, request final confirmation.' }),
    Object.freeze({ id: 'notion-archive', label: 'Notes Archive', icon: '▤', service: 'Notes service', summary: 'Future workspace note connection that distinguishes read, draft and write.', actionClasses: Object.freeze(['read', 'draft', 'write', 'delete']), lifecycle: 'planned', outcome: 'Future: bring selected notes into a reviewed plan; never bulk copy private workspace data by default.' }),
    Object.freeze({ id: 'community-relay', label: 'Community Relay', icon: '◎', service: 'Community service', summary: 'Future Discord or Slack-style workroom handoff with explicit channel selection.', actionClasses: Object.freeze(['read', 'draft', 'publish']), lifecycle: 'planned', outcome: 'Future: draft an update, show channel and text, require a send confirmation.' }),
    Object.freeze({ id: 'local-device-bridge', label: 'Local Device Bridge', icon: '◫', service: 'Your device', summary: 'Future opt-in local runner for files and desktop tasks under local policies.', actionClasses: Object.freeze(['read', 'draft', 'write', 'delete']), lifecycle: 'planned', outcome: 'Future: run only on the user’s device with visible folder scope and a stop control.' })
  ])
});

function getStorage(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function safeId(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 96);
}

function safeCategory(value = '') {
  const category = String(value || '').trim().toLowerCase();
  return EON_APP_DECK_CATEGORY_IDS.includes(category) ? category : null;
}

function nowIso(now = Date.now()) {
  const time = Number(now);
  return new Date(Number.isFinite(time) ? time : Date.now()).toISOString();
}

function cloneCard(card, category) {
  if (!card) return null;
  return Object.freeze({
    ...card,
    category,
    actionClasses: Object.freeze([...(card.actionClasses || [])]),
    localOnly: true,
    connectionActive: false,
    providerCallActive: false,
    externalExecutionActive: false,
    checkoutActive: false,
    entitlementActive: false
  });
}

function cardFor(category, id) {
  const normalizedCategory = safeCategory(category);
  if (!normalizedCategory) return null;
  return CATALOG[normalizedCategory].find((item) => item.id === safeId(id)) || null;
}

export function listEonAppDeckCategories() {
  return Object.freeze(EON_APP_DECK_CATEGORY_IDS.map((id) => Object.freeze({ ...CATEGORY_META[id], count: CATALOG[id].length })));
}

export function listEonAppDeckCards(category = '') {
  const normalizedCategory = safeCategory(category);
  if (!normalizedCategory) return Object.freeze([]);
  return Object.freeze(CATALOG[normalizedCategory].map((item) => cloneCard(item, normalizedCategory)));
}

export function getEonAppDeckCard(category = '', id = '') {
  return cloneCard(cardFor(category, id), safeCategory(category));
}

export function getEonAppDeckCardById(id = '') {
  const normalized = safeId(id);
  for (const category of EON_APP_DECK_CATEGORY_IDS) {
    const card = cardFor(category, normalized);
    if (card) return cloneCard(card, category);
  }
  return null;
}

export function getEonAppDeckBlueprint(id = '') {
  return getEonAppDeckCard('blueprints', id);
}

export function createEonAppDeckLaunchIntent({ category = '', itemId = '', storage, now = Date.now() } = {}) {
  const normalizedCategory = safeCategory(category);
  const card = cardFor(normalizedCategory, itemId);
  if (!card || !normalizedCategory) return Object.freeze({ ok: false, reason: 'unknown-app-deck-card', intent: null });
  const intent = Object.freeze({
    schema: `${EON_APP_DECK_SCHEMA}.launch.v1`,
    category: normalizedCategory,
    itemId: card.id,
    selectedAt: nowIso(now),
    userSelected: true,
    directRouteOnly: normalizedCategory === 'insights',
    externalExecutionActive: false,
    requiresConfirmationBeforeDraftSave: normalizedCategory === 'blueprints'
  });
  const target = getStorage(storage);
  try { target?.setItem(EON_APP_DECK_SELECTION_KEY, JSON.stringify(intent)); } catch {}
  return Object.freeze({ ok: true, intent });
}

export function readEonAppDeckLaunchIntent({ storage, consume = false } = {}) {
  const target = getStorage(storage);
  let parsed = null;
  try { parsed = JSON.parse(target?.getItem(EON_APP_DECK_SELECTION_KEY) || 'null'); } catch {}
  const category = safeCategory(parsed?.category);
  const card = category ? cardFor(category, parsed?.itemId) : null;
  if (!card || parsed?.userSelected !== true) return null;
  const intent = Object.freeze({
    schema: `${EON_APP_DECK_SCHEMA}.launch.v1`,
    category,
    itemId: card.id,
    selectedAt: String(parsed.selectedAt || ''),
    userSelected: true,
    directRouteOnly: category === 'insights',
    externalExecutionActive: false,
    requiresConfirmationBeforeDraftSave: category === 'blueprints'
  });
  if (consume) {
    try { target?.removeItem(EON_APP_DECK_SELECTION_KEY); } catch {}
  }
  return intent;
}

export function clearEonAppDeckLaunchIntent({ storage } = {}) {
  try { getStorage(storage)?.removeItem(EON_APP_DECK_SELECTION_KEY); } catch {}
}

export function getEonAppDeckTruth() {
  return Object.freeze({
    schema: EON_APP_DECK_SCHEMA,
    version: EON_APP_DECK_VERSION,
    categories: [...EON_APP_DECK_CATEGORY_IDS],
    currentScope: 'local catalog, local selection receipt, foreground Chat prefill, direct local research-desk routing, and Automation draft handoff only',
    neverDoes: Object.freeze([
      'installs third-party code',
      'connects an external account',
      'requests OAuth scopes',
      'runs a provider request',
      'schedules a background job',
      'publishes or sends',
      'spends money',
      'creates a subscription or entitlement'
    ])
  });
}

export function validateEonAppDeckCatalog() {
  const errors = [];
  if (EON_APP_DECK_VERSION !== 3) errors.push('W377 must use App Deck catalog version 3.');
  if (!EON_APP_DECK_W362_BASE_CATEGORY_IDS.every((id) => EON_APP_DECK_CATEGORY_IDS.includes(id))) errors.push('W376 must retain every W362 base category.');
  if (JSON.stringify(EON_APP_DECK_CATEGORY_IDS) !== JSON.stringify(['workrooms', 'blueprints', 'insights', 'crew', 'connections'])) errors.push('W376 must keep the resolved Apps category order.');
  const allIds = new Set();
  for (const category of EON_APP_DECK_CATEGORY_IDS) {
    const cards = CATALOG[category];
    if (!CATEGORY_META[category] || !Array.isArray(cards) || cards.length < 4) errors.push(`${category} needs at least four curated cards.`);
    for (const card of cards) {
      if (!card.id || !card.label || !card.summary || !card.outcome) errors.push(`${category} card is incomplete.`);
      if (allIds.has(card.id)) errors.push(`Duplicate App Deck card id: ${card.id}`);
      allIds.add(card.id);
      for (const actionId of card.actionClasses || []) {
        if (!EON_ACTION_CLASS_IDS.includes(actionId) || !getEonActionClass(actionId)) errors.push(`${card.id} references an invalid action class.`);
      }
      if (/(checkout|subscription|payout|token|nft|wallet|referral)/i.test(JSON.stringify(card))) errors.push(`${card.id} cannot add commercial or value-system wording in the local Apps catalog.`);
    }
  }
  if (CATALOG.workrooms.some((card) => !card.chatPrompt) || CATALOG.crew.some((card) => !card.chatPrompt)) errors.push('Every Workroom and Crew card needs a safe foreground Chat prompt.');
  if (CATALOG.blueprints.length !== 32) errors.push('W377 requires exactly thirty-two official Blueprint cards.');
  if (CATALOG.blueprints.some((card) => card.kind !== 'official-blueprint' || !/^1\.(0|1)\.0$/.test(card.packVersion || '') || !card.packFamily || !card.workflowTemplateId || !card.automationGoal || !card.packSpec?.workroomEligible || !Array.isArray(card.packSpec?.requiredInputs) || !Array.isArray(card.packSpec?.deliverables) || !Array.isArray(card.packSpec?.reviewCheckpoints))) errors.push('Every Blueprint needs official version, family, workflow and institutional local pack metadata.');
  if (CATALOG.insights.length !== 5 || CATALOG.insights.some((card) => !/^\/insights\?desk=(market|business|forecast|research|data)$/.test(card.route || '') || !card.desk)) errors.push('Insights & Forecasts must keep five canonical /insights desk routes.');
  return Object.freeze(errors);
}

export default Object.freeze({
  EON_APP_DECK_SCHEMA,
  EON_APP_DECK_VERSION,
  EON_APP_DECK_SELECTION_KEY,
  EON_APP_DECK_W362_BASE_CATEGORY_IDS,
  EON_APP_DECK_W376_BASE_VERSION,
  EON_APP_DECK_CATEGORY_IDS,
  listEonAppDeckCategories,
  listEonAppDeckCards,
  getEonAppDeckCard,
  getEonAppDeckCardById,
  getEonAppDeckBlueprint,
  createEonAppDeckLaunchIntent,
  readEonAppDeckLaunchIntent,
  clearEonAppDeckLaunchIntent,
  getEonAppDeckTruth,
  validateEonAppDeckCatalog
});
