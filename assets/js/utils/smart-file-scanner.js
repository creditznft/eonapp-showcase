/**
 * smart-file-scanner.js — Token-Efficient Multi-File Indexing
 *
 * Like Claude's codebase overview:
 * - Index files once with structure summaries (not full content)
 * - Smart snippet extraction on-demand
 * - Avoid re-scanning with persistent index
 * - Drastically reduce input tokens
 */

const INDEX_STORAGE_KEY = 'eon:file-index:v1';
const MAX_INDEX_SIZE = 500; // KB before cleanup

/**
 * File structure summary (replaces full file for context)
 */
function createFileStructure(/** @type {any} */ filename, /** @type {any} */ content = '') {
  const lines = content.split('\n');
  
  return {
    filename,
    size: content.length,
    lines: lines.length,
    structure: extractStructure(filename, content),
    hash: simpleHash(content), // Track changes
    timestamp: Date.now(),
  };
}

/**
 * Extract structure without full content
 */
function extractStructure(/** @type {any} */ filename, /** @type {any} */ content = '') {
  void filename;
  const /** @type {any} */
structure = {
    functions: [],
    classes: [],
    exports: [],
    imports: [],
    topComments: [],
  };
  
  const lines = content.split('\n');
  
  // Extract functions/methods
  const funcRegex = /^\s*(export\s+)?(async\s+)?function\s+(\w+)|(\w+)\s*:\s*function|(\w+)\s*\(\w*\)\s*{|^\s*(async\s+)?(\w+)\s*\(/;
  
  // Extract classes
  const classRegex = /^\s*(export\s+)?class\s+(\w+)/;
  
  // Extract imports/exports
  const importRegex = /^\s*(import|export)\s+/;
  
  lines.forEach((/** @type {string} */ line, /** @type {number} */ idx) => {
    if (idx < 10) {
      const commentMatch = line.match(/^\s*\/\//);
      if (commentMatch) {
        structure.topComments.push(line.trim().substring(2).trim());
      }
    }
    
    const funcMatch = line.match(funcRegex);
    if (funcMatch) {
      const name = funcMatch[3] || funcMatch[4] || funcMatch[5] || funcMatch[8] || 'anonymous';
      structure.functions.push({ name, line: idx + 1 });
    }
    
    const classMatch = line.match(classRegex);
    if (classMatch) {
      structure.classes.push({ name: classMatch[2], line: idx + 1 });
    }
    
    const importMatch = line.match(importRegex);
    if (importMatch) {
      structure.imports.push({ statement: line.trim(), line: idx + 1 });
    }
  });
  
  return structure;
}

/**
 * Simple hash for change detection
 */
function simpleHash(/** @type {any} */ text = '') {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Load or create file index
 */
function loadIndex() {
  try {
    const raw = localStorage.getItem(INDEX_STORAGE_KEY);
    if (!raw) return { files: {}, indexed: 0, totalTokens: 0 };
    return JSON.parse(raw);
  } catch {
    return { files: {}, indexed: 0, totalTokens: 0 };
  }
}

/**
 * Save file index
 */
function saveIndex(/** @type {any} */ index) {
  try {
    const size = new Blob([JSON.stringify(index)]).size / 1024;
    if (size > MAX_INDEX_SIZE) {
      // Cleanup old entries
      const sorted = Object.entries(index.files).sort((/** @type {any} */ a, /** @type {any} */ b) => a[1].timestamp - b[1].timestamp);
      const toRemove = Math.ceil(sorted.length * 0.3);
      sorted.slice(0, toRemove).forEach((/** @type {any} */ [key]) => {
        delete index.files[key];
      });
    }
    localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(index));
  } catch (/** @type {any} */
e) {
    console.warn('Failed to save file index:', e.message);
  }
}

/**
 * Index one or more files for efficient context
 * @param {Array<any>} files - { filename, content }[]
 * @param {boolean} forceRefresh
 */
export function indexFiles(/** @type {any} */ files = [], /** @type {any} */ forceRefresh = false) {
  const index = loadIndex();
  const /** @type {any[]} */
added = [];
  
  files.forEach((/** @type {any} */ { filename, content }) => {
    const hash = simpleHash(content);
    const existing = index.files[filename];
    
    // Skip if unchanged
    if (!forceRefresh && existing && existing.hash === hash) {
      return;
    }
    
    // Create structure summary (much smaller than full content)
    const structure = createFileStructure(filename, content);
    index.files[filename] = structure;
    added.push(filename);
  });
  
  if (added.length > 0) {
    index.indexed = Object.keys(index.files).length;
    saveIndex(index);
  }
  
  return {
    filesIndexed: added.length,
    totalFiles: index.indexed,
    summary: added.map((/** @type {string} */ f) => ({
      file: f,
      size: index.files[f].size,
      lines: index.files[f].lines,
    })),
  };
}

/**
 * Get smart file context (minimal tokens)
 * Returns: file structures + relevant snippets only
 */
export function getSmartContext(/** @type {any} */ files = [], /** @type {any} */ _topicKeywords = []) {
  const index = loadIndex();
  let context = '';
  
  files.forEach((/** @type {string} */ filename) => {
    const file = index.files[filename];
    if (!file) return;
    
    // Add file structure (light weight)
    context += `\n# File: ${filename} (${file.lines} lines, ${file.size} bytes)\n`;
    
    if (file.structure.topComments.length > 0) {
      context += `Description: ${file.structure.topComments.slice(0, 3).join(' ')}\n`;
    }
    
    if (file.structure.classes.length > 0) {
      context += `Classes: ${file.structure.classes.map((/** @type {any} */ c) => c.name).join(', ')}\n`;
    }
    
    if (file.structure.functions.length > 0) {
      context += `Functions: ${file.structure.functions.slice(0, 5).map((/** @type {any} */ f) => f.name).join(', ')}`;
      if (file.structure.functions.length > 5) {
        context += ` (+${file.structure.functions.length - 5} more)`;
      }
      context += '\n';
    }
  });
  
  return context;
}

/**
 * Extract specific snippet from file (only what's needed)
 * @param {string} filename
 * @param {string} functionName - or class name
 * @param {number} _contextLines - lines before/after
 */
export function getSnippet(/** @type {any} */ filename, /** @type {any} */ functionName, /** @type {any} */ _contextLines = 5) {
  // This would require full file access in real implementation
  // For now, return guidance that was indexed
  const index = loadIndex();
  const file = index.files[filename];
  
  if (!file) {
    return { error: 'File not indexed', suggestion: 'Index file first with indexFiles()' };
  }
  
  const func = file.structure.functions.find((/** @type {any} */ f) => f.name === functionName);
  const cls = file.structure.classes.find((/** @type {any} */ c) => c.name === functionName);
  
  return {
    filename,
    found: !!func || !!cls,
    type: func ? 'function' : cls ? 'class' : 'unknown',
    line: func?.line || cls?.line || null,
    context: `Search for ${functionName} near line ${func?.line || cls?.line || '?'}`,
  };
}

/**
 * Get file comparison (what changed?)
 * Useful for reviewing PRs or updates
 */
export function compareFile(/** @type {any} */ filename, /** @type {any} */ newContent) {
  const index = loadIndex();
  const oldFile = index.files[filename];
  
  if (!oldFile) {
    return { status: 'new', message: `${filename} is new` };
  }
  
  const oldHash = oldFile.hash;
  const newHash = simpleHash(newContent);
  
  if (oldHash === newHash) {
    return { status: 'unchanged', message: `${filename} has no changes` };
  }
  
  const oldStructure = oldFile.structure;
  const newStructure = extractStructure(filename, newContent);
  
  return {
    status: 'changed',
    oldFunctions: oldStructure.functions.map((/** @type {any} */ f) => f.name),
    newFunctions: newStructure.functions.map((/** @type {any} */ f) => f.name),
    functionsAdded: newStructure.functions.filter((/** @type {any} */ f) => !oldStructure.functions.find((/** @type {any} */ o) => o.name === f.name)).map((/** @type {any} */ f) => f.name),
    functionsRemoved: oldStructure.functions.filter((/** @type {any} */ f) => !newStructure.functions.find((/** @type {any} */ n) => n.name === f.name)).map((/** @type {any} */ f) => f.name),
    sizeChange: newContent.length - oldFile.size,
  };
}

/**
 * Search across indexed files
 */
export function searchIndex(/** @type {any} */ query = '') {
  const index = loadIndex();
  const /** @type {any} */
results = [];
  
  Object.entries(index.files).forEach((/** @type {any} */ [filename, file]) => {
    // Search in function names
    const funcMatches = file.structure.functions.filter((/** @type {any} */ f) => f.name.includes(query));
    
    // Search in class names
    const classMatches = file.structure.classes.filter((/** @type {any} */ c) => c.name.includes(query));
    
    // Search in imports
    const importMatches = file.structure.imports.filter((/** @type {any} */ i) => i.statement.includes(query));
    
    if (funcMatches.length > 0 || classMatches.length > 0 || importMatches.length > 0) {
      results.push({
        file: filename,
        functions: funcMatches,
        classes: classMatches,
        imports: importMatches,
      });
    }
  });
  
  return results;
}

/**
 * Clear index (full reset)
 */
export function clearIndex() {
  localStorage.removeItem(INDEX_STORAGE_KEY);
}

/**
 * Get index statistics
 */
export function getIndexStats() {
  const index = loadIndex();
  const files = Object.values(index.files);
  
  return {
    filesIndexed: files.length,
    totalLines: files.reduce((/** @type {any} */ sum, /** @type {any} */ f) => sum + f.lines, 0),
    totalSize: files.reduce((/** @type {any} */ sum, /** @type {any} */ f) => sum + f.size, 0),
    totalFunctions: files.reduce((/** @type {any} */ sum, /** @type {any} */ f) => sum + f.structure.functions.length, 0),
    totalClasses: files.reduce((/** @type {any} */ sum, /** @type {any} */ f) => sum + f.structure.classes.length, 0),
    averageFileSize: files.length > 0 ? Math.round(files.reduce((/** @type {any} */ sum, /** @type {any} */ f) => sum + f.size, 0) / files.length) : 0,
  };
}
