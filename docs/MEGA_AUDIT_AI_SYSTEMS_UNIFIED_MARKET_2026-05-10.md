# EONAPP Mega Audit: AI Systems, Marketplace, NFT, Hive/Swarm/Collab

Date: 2026-05-10
Owner: CEO / Product / Engineering
Audit Scope: EONAPP.CH + eonpackage app-side references
Status: Research complete, execution-ready

---

## 1) Executive Summary

You are very close to a category-defining AI superapp, but one critical product gap is still real in EONAPP:

- Hive/Swarm patterns exist.
- A dedicated Collab mode does not exist as a first-class mode in EONAPP WorkBench.
- Marketplace already supports AI-native types (`template`, `agent`, `compute`) but does not yet expose `dataset`, `workflow`, and `skill-pack` as first-class listing types.

Strong opportunity:

- Use existing EONAPP systems (agent orchestration, model policy routing, KPI/campaign engines, NFT preflight, approvals, signal/trading guardrails).
- Borrow mature patterns from eonpackage app modules (AI Dataset Marketplace, AI Workflow Marketplace, AI Training, AI HiveMind, AI Collaboration Studio).
- Ship one unified marketplace with AI utility assets + NFT provenance wrappers.
- Add AI pet progression tied to real-world value creation and monetization.

---

## 2) Current State Evidence (Hard Findings)

### EONAPP.CH: Confirmed Live

1. WorkBench modes include Ask/Build/Agent/Hive/Signal/Browse and more, but no `collab` mode entry.
2. Hive mode prompt and UX are present (planner/executor/critic/finisher flow).
3. Agent orchestration has policy enforcement, high-risk gating, replay-protected remote envelopes, and approval requirements for publish actions.
4. Model policy routing exists (task-aware + tier-aware provider selection).
5. Marketplace service supports AI-native types (`template`, `agent`, `compute`) and NFT/realm classes.
6. NFT mint preflight exists (CID validation, owner wallet validation, royalty bounds, metadata checks).
7. Business ops domain exists (tasks/reminders/cadence with daily/weekly/monthly scaffolding).
8. KPI + campaign systems are in place and production-ready.

### EONAPP.CH: Confirmed Gaps

1. No first-class Collab mode in WorkBench mode registry.
2. No Boardroom mode implementation for structured 4-agent executive debate.
3. No Business Twin simulation engine integrated into decision flow before execution.
4. No unified listing schema for dataset/workflow/skill-pack in marketplace-service collection types.
5. No native AI-to-AI autonomous commerce policy lane in the EONAPP marketplace flow.

### eonpackage: Confirmed Reference Assets You Can Reuse as Design Inputs

1. AI_Dataset_Marketplace_Enhanced_V5.tsx exists and includes dataset marketplace and AI-to-AI transfer typing.
2. AI_Workflow_Marketplace_Enhanced_V5.tsx exists and includes workflow marketplace concepts.
3. AI_Training_Enhanced_V5.tsx exists and already frames pet-like AI training progression.
4. AI_HiveMind_Enhanced_V5.tsx exists for swarm collaboration behavior.
5. AI_Collaboration_Studio_Enhanced_V5.tsx exists for collaborative contribution workflows.
6. AITrainingContext_V5.ts contains a broad AI domain context and platform taxonomy.

Note: These are references and patterns, not direct drop-ins. EONAPP should selectively port architecture, not blindly copy implementation.

---

## 3) Strategic Product Decision

Build a single coherent super-loop:

User goal -> AI planning -> multi-model collaboration -> asset creation -> marketplace sale -> KPI feedback -> skill/progression unlocks -> higher-value assets.

This gives:

- Retention loop (progression + daily utility)
- Revenue loop (asset monetization)
- Quality loop (ratings + policy gates)
- Trust loop (approval + thresholds + audit trail)

---

## 4) Final Feature Stack (Refined)

## P0 (Ship first)

1. Collab Mode (new first-class mode)
- Add mode key `collab` to WorkBench registry and prompts.
- Multi-model roundtable with explicit role assignment and merge strategy.

2. AI Boardroom Mode
- 4 fixed executive agents: Growth, Finance, Risk, Product.
- Debate rounds + weighted verdict + dissent capture.

3. Confidence-Gated Autonomy v2
- Threshold stack: model confidence + policy score + user trust score.
- If any gate fails: route to approval inbox, never auto-execute.

4. Unified Marketplace v2 Schema
- Add listing classes: `dataset`, `workflow`, `skill_pack`, `agent_profile`, `prompt_pack`.
- Keep one marketplace UX, one ranking/search, one settlement rail.

5. NFT Utility Wrapper
- Optional NFT companion for each AI utility asset with rights hash/version/provenance.

## P1 (Immediately after P0)

6. Simulated Business Twin
- Before execution, run scenario simulation with KPI impact estimates.

7. One-Hour Business Setup
- Offer -> Landing -> Content -> Distribution -> KPI -> Automation in one guided flow.

8. AI Pet Progression
- Leveling, skill trees, specialization classes, streaks, and utility-based XP.

9. AI-to-AI Commerce Guardrails
- Budget caps, category caps, and per-agent permissions for autonomous purchases.

## P2 (Moat + ecosystem scale)

10. Operator Marketplace with audit grades
- Workflow templates with success-rate, risk score, and cost profile metadata.

11. Data/Workflow reputation and quality tiers
- Verified seller system, review weighting, dispute scoring.

12. Realm/Vault monetization bridge
- Publish generated assets to realm storefront flows with end-to-end conversion tracking.

---

## 5) Unified Marketplace Technical Spec (New)

### New listing types

- `dataset`
- `workflow`
- `skill_pack`
- `agent_profile`
- `prompt_pack`
- existing: `template`, `agent`, `compute`, NFT/realm classes

### Required metadata by type

- dataset: format, sample_count, license, lineage_hash, pii_flags
- workflow: step_graph, required_tools, avg_runtime, risk_level
- skill_pack: compatible_models, benchmark_score, safety_grade
- agent_profile: policy_profile_id, specialization, tool_permissions
- prompt_pack: domain, token_budget, eval_score

### NFT wrapper metadata

- utility_asset_id
- provenance_hash
- version
- license_uri
- royalty_bps
- creator_wallet

### Settlement rules

- Utility purchase first, NFT mint optional post-settlement.
- Fail-closed if wallet, ownership proof, or policy checks fail.

---

## 6) Collab + Boardroom Architecture

### Collab Mode pipeline

1. Intent parser
2. Task decomposition
3. Model assignment (local/free/premium by task type)
4. Parallel generation
5. Cross-model critique round
6. Merge candidate generation
7. Human checkpoint (if risk tier requires)
8. Final output + artifact log

### Boardroom Mode pipeline

1. Executive brief creation
2. Growth agent proposal
3. Finance agent challenge
4. Risk agent stress-test
5. Product agent feasibility plan
6. Moderator summary with confidence and conflicts
7. CEO decision pane with approve/reject/defer actions

---

## 7) AI Pet Game Loop (Real Utility, Not Vanity)

### Core loops

- Train: complete useful tasks to earn XP.
- Specialize: unlock domain branches (growth, coding, creator, trading, ops).
- Monetize: publish assets (workflow/dataset/skill) and earn.
- Reinforce: higher reputation unlocks higher-value tasks and listings.

### Anti-gaming controls

- XP only on quality-validated outcomes.
- Diminishing returns on repeated low-value actions.
- Reputation decay for low satisfaction or high dispute rates.

---

## 8) Security and Trust Requirements

1. Keep anti-mass-automation guardrails as non-negotiable.
2. Keep remote envelope nonce/timestamp verification mandatory.
3. Enforce confidence gates before any irreversible action.
4. Require explicit consent for publish, spend, and irreversible on-chain actions.
5. Keep user-owned storage/provenance requirement for all valuable AI assets.

---

## 9) Execution Plan (6 Weeks)

Week 1-2
- Add Collab mode registry, prompts, and UI.
- Add Boardroom mode with 4-agent debate scaffold.
- Expand marketplace schema to new AI listing classes.

Week 3-4
- Add NFT utility wrapper mint path for AI assets.
- Add Business Twin simulation with KPI projection output.
- Add AI pet progression service and XP policy rules.

Week 5-6
- Add AI-to-AI commerce permissions and budget controls.
- Add reputation system + audit grades for workflows/datasets.
- Add realm/vault monetization bridge and KPI tracking hooks.

---

## 10) Success Metrics

1. Time to first valuable asset listed: under 25 minutes.
2. Weekly active operators using Collab/Boardroom: target 35% of active users.
3. AI asset conversion rate (view -> purchase): target +20% over current baseline.
4. Repeat seller rate (30-day): target +25%.
5. Approval-safe automation rate (no policy violations): target 99%+.

---

## 11) Final Recommendation

Do this as a disciplined product stack, not feature sprawl.

- Ship Collab mode first.
- Unify AI asset commerce in one marketplace.
- Add Boardroom + Business Twin for decision quality.
- Add AI pet progression tied to real profits and quality outcomes.

This gives EONAPP a defensible moat: practical autonomous work + market-native AI assets + trusted governance + addictive progression with real utility.
