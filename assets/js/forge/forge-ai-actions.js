/**
 * W648B — professional Forge AI action catalogue.
 *
 * Presets are deliberately bounded to the four local text files supported by
 * the first Forge AI release. They guide file sharing and prompt quality; they
 * never bypass the explicit per-request consent or proposal review gates.
 */

export const FORGE_AI_ACTIONS = Object.freeze({
  improve: Object.freeze({
    id: 'improve',
    label: 'Improve project',
    shortLabel: 'Improve',
    description: 'Upgrade structure, design, copy and interaction as one coherent pass.',
    placeholder: 'Make this feel launch-ready: improve information architecture, visual hierarchy, responsive behavior, accessibility and the main user action.',
    files: Object.freeze(['index.html', 'style.css', 'script.js', 'README.md']),
    contract: 'Improve the whole approved experience while preserving its purpose and any working behavior that is not explicitly replaced.'
  }),
  feature: Object.freeze({
    id: 'feature',
    label: 'Add a feature',
    shortLabel: 'Feature',
    description: 'Add one complete browser feature with real visible behavior and states.',
    placeholder: 'Add a searchable project gallery with filters, empty state, keyboard-accessible controls and polished mobile behavior.',
    files: Object.freeze(['index.html', 'style.css', 'script.js', 'README.md']),
    contract: 'Implement one complete feature end to end. Include visible loading, empty, success and error states when they are relevant.'
  }),
  fix: Object.freeze({
    id: 'fix',
    label: 'Fix bugs',
    shortLabel: 'Fix',
    description: 'Repair broken layout or JavaScript without unnecessary redesign.',
    placeholder: 'Fix the mobile navigation and form validation. Keep the existing visual direction and avoid unrelated changes.',
    files: Object.freeze(['index.html', 'style.css', 'script.js']),
    contract: 'Diagnose and repair the described defect with the smallest complete source change. Preserve unrelated design and behavior.'
  }),
  restyle: Object.freeze({
    id: 'restyle',
    label: 'Restyle interface',
    shortLabel: 'Restyle',
    description: 'Create a stronger visual system while keeping content and behavior recognizable.',
    placeholder: 'Restyle this into a premium graphite-and-electric-cyan product experience with restrained motion, stronger typography and cleaner mobile composition.',
    files: Object.freeze(['index.html', 'style.css']),
    contract: 'Create a distinctive, coherent visual system. Preserve semantic content and working behavior unless the instruction explicitly requests a structural change.'
  }),
  accessibility: Object.freeze({
    id: 'accessibility',
    label: 'Accessibility pass',
    shortLabel: 'Accessibility',
    description: 'Improve semantics, keyboard use, focus, contrast and reduced-motion behavior.',
    placeholder: 'Run a comprehensive accessibility pass: semantic landmarks, heading order, labels, keyboard flow, visible focus, contrast and reduced motion.',
    files: Object.freeze(['index.html', 'style.css', 'script.js']),
    contract: 'Prioritize semantic HTML, labels, keyboard operation, focus management, readable contrast, reduced motion and clear error messaging without removing useful features.'
  }),
  performance: Object.freeze({
    id: 'performance',
    label: 'Performance pass',
    shortLabel: 'Performance',
    description: 'Reduce unnecessary work and improve responsive runtime behavior.',
    placeholder: 'Improve runtime performance and responsiveness without changing the product intent. Remove repeated work, layout thrashing and unbounded listeners.',
    files: Object.freeze(['index.html', 'style.css', 'script.js']),
    contract: 'Reduce avoidable DOM work, repeated listeners, oversized effects and blocking behavior. Keep the result dependency-free and visibly equivalent or better.'
  }),
  refactor: Object.freeze({
    id: 'refactor',
    label: 'Refactor source',
    shortLabel: 'Refactor',
    description: 'Improve maintainability and resilience without changing intended behavior.',
    placeholder: 'Refactor the JavaScript into small clear functions, remove duplication, add defensive state handling and preserve all visible behavior.',
    files: Object.freeze(['style.css', 'script.js', 'README.md']),
    contract: 'Improve clarity, naming, decomposition and defensive behavior. Preserve intended output and avoid cosmetic rewrites that do not improve maintainability.'
  }),
  documentation: Object.freeze({
    id: 'documentation',
    label: 'Document project',
    shortLabel: 'Docs',
    description: 'Create useful local documentation for editing, testing and export.',
    placeholder: 'Rewrite the README with project purpose, architecture, file guide, local testing steps, accessibility notes and safe export instructions.',
    files: Object.freeze(['README.md']),
    contract: 'Write accurate project-specific documentation only. Do not invent deployed URLs, credentials, tests or features that the source does not contain.'
  })
});

export const FORGE_AI_ACTION_ORDER = Object.freeze([
  'improve',
  'feature',
  'fix',
  'restyle',
  'accessibility',
  'performance',
  'refactor',
  'documentation'
]);

export function getForgeAiAction(value = 'improve') {
  const key = String(value || '').trim().toLowerCase();
  return FORGE_AI_ACTIONS[key] || FORGE_AI_ACTIONS.improve;
}

export function forgeAiActionOptions() {
  return FORGE_AI_ACTION_ORDER.map((id) => FORGE_AI_ACTIONS[id]);
}
