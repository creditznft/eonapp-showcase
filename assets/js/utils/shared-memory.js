/**
 * shared-memory.js — Persistent Knowledge Base
 *
 * Eliminates token waste from repetitive context:
 * - Store facts once, reference by ID
 * - Multi-user shared knowledge
 * - Smart cache expiration
 * - Cross-session memory
 */

const MEMORY_STORAGE_KEY = 'eon:shared-memory:v1';
const MAX_MEMORY_SIZE = 1024; // KB

/**
 * Memory entry types
 */
const /** @type {any} */
_MEMORY_TYPES = {
  fact: 'fact',           // General knowledge
  code: 'code',           // Code snippets
  api: 'api',             // API reference
  rule: 'rule',           // Business rule
  context: 'context',     // Session context
  user: 'user',           // User preference
};
void _MEMORY_TYPES;

/**
 * Load shared memory
 */
function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return { entries: {}, stats: { created: Date.now() } };
    return JSON.parse(raw);
  } catch {
    return { entries: {}, stats: { created: Date.now() } };
  }
}

/**
 * Save shared memory
 */
function saveMemory(/** @type {any} */ memory) {
  try {
    const size = new Blob([JSON.stringify(memory)]).size / 1024;
    
    if (size > MAX_MEMORY_SIZE) {
      // Cleanup: remove expired + least accessed
      const entries = Object.values(memory.entries);
      const toRemove = Math.ceil(entries.length * 0.3);
      
      const sortedByAccess = entries.sort((/** @type {any} */ a, /** @type {any} */ b) => (a.accessCount || 0) - (b.accessCount || 0));
      sortedByAccess.slice(0, toRemove).forEach((/** @type {any} */ entry) => {
        delete memory.entries[entry.id];
      });
    }
    
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch (/** @type {any} */
e) {
    console.warn('Failed to save shared memory:', e.message);
  }
}

/**
 * Store a fact in shared memory
 * @param {string} type - fact/code/api/rule/context/user
 * @param {string} content
 * @param {Object} metadata
 */
export function storeMemory(/** @type {any} */ type = 'fact', /** @type {any} */ content = '', /** @type {any} */ metadata = {}) {
  const memory = loadMemory();
  
  // Generate ID based on content hash
  const id = `${type}_${simpleHash(content).substring(0, 8)}`;
  
  memory.entries[id] = {
    id,
    type,
    content,
    metadata,
    createdAt: Date.now(),
    accessCount: 0,
    lastAccessed: null,
  };
  
  saveMemory(memory);
  
  return {
    id,
    memoryId: id,
    tokens: Math.ceil(content.length / 3.5),
    saved: true,
  };
}

/**
 * Retrieve memory by ID (1-2 tokens vs full content)
 */
export function getMemory(/** @type {any} */ id) {
  const memory = loadMemory();
  const entry = memory.entries[id];
  
  if (!entry) return null;
  
  // Update access tracking
  entry.accessCount = (entry.accessCount || 0) + 1;
  entry.lastAccessed = Date.now();
  saveMemory(memory);
  
  return entry;
}

/**
 * Get memory reference (minimal tokens)
 * Returns: [id: type] instead of full content
 */
export function getMemoryReference(/** @type {any} */ id) {
  const entry = getMemory(id);
  if (!entry) return null;
  
  return `[${id}: ${entry.type}]`;
}

/**
 * Search memory by keyword
 */
export function searchMemory(/** @type {any} */ query = '', /** @type {any} */ type = null) {
  const memory = loadMemory();
  const /** @type {any} */
results = [];
  
  Object.values(memory.entries).forEach(/** @type {any} */ entry => {
    if (type && entry.type !== type) return;
    
    if (entry.content.toLowerCase().includes(query.toLowerCase()) ||
        (entry.metadata.tags || []).some((/** @type {any} */ t) => t.includes(query))) {
      results.push({
        id: entry.id,
        type: entry.type,
        preview: entry.content.substring(0, 100),
        accessCount: entry.accessCount,
      });
    }
  });
  
  return results;
}

/**
 * Store user preference (reuse across sessions)
 */
export function storeUserPreference(/** @type {any} */ key = '', /** @type {any} */ value = '') {
  return storeMemory('user', value, { key, preference: true });
}

/**
 * Get user preference by key
 */
export function getUserPreference(/** @type {any} */ key) {
  const memory = loadMemory();
  const entry = Object.values(memory.entries).find(
    (/** @type {any} */ e) => e.type === 'user' && e.metadata.key === key
  );
  return entry ? entry.content : null;
}

/**
 * Store API schema (reuse for all API queries)
 */
export function storeAPISchema(/** @type {any} */ endpoint = '', /** @type {any} */ schema = {}) {
  return storeMemory('api', JSON.stringify(schema), { endpoint });
}

/**
 * Store code snippet for reuse
 */
export function storeCodeSnippet(/** @type {any} */ name = '', /** @type {any} */ code = '', /** @type {any} */ language = 'js') {
  return storeMemory('code', code, { name, language });
}

/**
 * Get code snippet by name
 */
export function getCodeSnippetByName(/** @type {any} */ name) {
  const memory = loadMemory();
  const entry = Object.values(memory.entries).find(
    /** @type {any} */ e => e.type === 'code' && e.metadata.name === name
  );
  return entry || null;
}

/**
 * Store business rule for AI decision-making
 */
export function storeRule(/** @type {any} */ ruleName = '', /** @type {any} */ ruleText = '') {
  return storeMemory('rule', ruleText, { ruleName });
}

/**
 * Get all rules (for compliance checks)
 */
export function getAllRules() {
  const memory = loadMemory();
  return Object.values(memory.entries)
    .filter((/** @type {any} */ e) => e.type === 'rule')
    .map((/** @type {any} */ e) => ({ name: e.metadata.ruleName, content: e.content }));
}

/**
 * Store session context (temp memory for current session)
 */
export function storeSessionContext(/** @type {any} */ key = '', /** @type {any} */ value = '') {
  return storeMemory('context', value, { key, isSession: true, expiresIn: 3600000 }); // 1 hour
}

/**
 * Build memory references for prompt (instead of full content)
 */
export function buildMemoryReferences(/** @type {any} */ types = []) {
  const memory = loadMemory();
  let reference = '';
  
  types.forEach((/** @type {any} */ type) => {
    const entries = Object.values(memory.entries).filter((/** @type {any} */ e) => e.type === type);
    if (entries.length > 0) {
      reference += `Available ${type}s: ${entries.map((/** @type {any} */ e) => `[${e.id}]`).join(', ')}\n`;
    }
  });
  
  return reference;
}

/**
 * Calculate token savings from memory reuse
 */
export function calculateMemorySavings() {
  const memory = loadMemory();
  let totalSaved = 0;
  
  Object.values(memory.entries).forEach((/** @type {any} */ entry) => {
    const contentTokens = Math.ceil(entry.content.length / 3.5);
    const referenceTokens = 2; // [id]
    const savings = (contentTokens - referenceTokens) * (entry.accessCount || 0);
    totalSaved += savings;
  });
  
  return {
    totalEntriesStored: Object.keys(memory.entries).length,
    totalTokensSaved: totalSaved,
    estimatedCostSavings: (totalSaved * 0.0015 / 1000).toFixed(6), // Based on avg pricing
  };
}

/**
 * Export memory for backup
 */
export function exportMemory() {
  const memory = loadMemory();
  const blob = new Blob([JSON.stringify(memory, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const /** @type {any} */
link = document.createElement('a');
  link.href = url;
  link.download = `shared-memory-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Import memory from backup
 */
export function importMemory(/** @type {any} */ jsonFile) {
  const reader = new FileReader();
  reader.onload = (/** @type {any} */ e) => {
    try {
      const memory = JSON.parse(e.target.result);
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
    } catch (/** @type {any} */
err) {
      console.error('Failed to import memory:', err);
    }
  };
  reader.readAsText(jsonFile);
}

/**
 * Clear shared memory
 */
export function clearMemory() {
  localStorage.removeItem(MEMORY_STORAGE_KEY);
}

/**
 * Get memory statistics
 */
export function getMemoryStats() {
  const memory = loadMemory();
  const entries = Object.values(memory.entries);
  
  return {
    totalEntries: entries.length,
    byType: entries.reduce((/** @type {any} */ acc, /** @type {any} */ e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
    totalTokens: entries.reduce((/** @type {any} */ sum, /** @type {any} */ e) => sum + Math.ceil(e.content.length / 3.5), 0),
    totalAccesses: entries.reduce((/** @type {any} */ sum, /** @type {any} */ e) => sum + (e.accessCount || 0), 0),
    mostUsed: entries.sort((/** @type {any} */ a, /** @type {any} */ b) => (b.accessCount || 0) - (a.accessCount || 0))[0],
  };
}

/**
 * Simple hash function
 */
function simpleHash(/** @type {any} */ text = '') {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Cleanup expired session contexts
 */
export function cleanupExpiredMemory() {
  const memory = loadMemory();
  const now = Date.now();
  let removed = 0;
  
  Object.keys(memory.entries).forEach(/** @type {any} */ id => {
    const entry = memory.entries[id];
    if (entry.metadata.isSession) {
      const expiresIn = entry.metadata.expiresIn || 3600000;
      if (now - entry.createdAt > expiresIn) {
        delete memory.entries[id];
        removed++;
      }
    }
  });
  
  if (removed > 0) {
    saveMemory(memory);
  }
  
  return { removed };
}
