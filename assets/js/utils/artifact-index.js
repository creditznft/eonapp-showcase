/**
 * ARTIFACT LINK INDEX SERVICE
 * Central registry for all AI-generated artifacts with provider/model tracking
 * 
 * Spec: Track every artifact created (image, music, video, code) with:
 * - Artifact ID & URL
 * - Provider (OpenAI, Anthropic, local, guide)
 * - Model name & version
 * - Generation timestamp
 * - Creator wallet/user
 * - Links to marketplace/Arweave
 * 
 * Location: assets/js/utils/artifact-index.js
 * Used by: Creator Studio, Marketplace, Analytics
 */

export class ArtifactIndex {
  constructor() {
    /** @type {any[]} */
    this.artifacts = [];
    this.maxArtifacts = 10000; // Keep last 10k
    this.storageKey = 'eon:artifact-index:v2';
    this.loadFromStorage();
  }

  /**
   * Register new artifact in index
   */
  registerArtifact(/** @type {any} */ artifact) {
    const /** @type {any} */
entry = {
      id: artifact.id || this.generateId(),
      type: artifact.type, // 'image', 'music', 'video', 'code', 'text'
      url: artifact.url || null,
      arweaveUrl: artifact.arweaveUrl || null,
      marketplaceUrl: artifact.marketplaceUrl || null,
      
      // AI Metadata
      provider: {
        id: artifact.provider?.id || 'unknown', // 'openai', 'anthropic', 'local', 'guide'
        label: artifact.provider?.label || 'Unknown',
        mode: artifact.provider?.mode || 'guide' // 'cloud', 'local', 'guide'
      },
      model: {
        name: artifact.model?.name || 'unknown',
        version: artifact.model?.version || 'unknown'
      },
      
      // Context
      creator: artifact.creator || null, // wallet or user ID
      workflow: artifact.workflow || null, // 'idea-to-music', 'url-to-research', etc.
      tags: artifact.tags || [], // ['ai-generated', 'premium', 'music', etc.]
      
      // Timestamps
      createdAt: artifact.createdAt || new Date().toISOString(),
      marketplaceAt: null, // When listed for sale
      permanenceAt: null, // When anchored to Arweave
      
      // Quality metadata
      quality: {
        rating: artifact.quality?.rating || null, // 1-10
        feedback: artifact.quality?.feedback || null,
        isNFT: artifact.quality?.isNFT || false,
        rarity: artifact.quality?.rarity || null // 'common', 'rare', 'legendary', etc.
      },
      
      // Performance
      generationTime: artifact.generationTime || null, // ms
      firstTokenLatency: artifact.firstTokenLatency || null, // ms
      
      // Rights & Usage
      licensed: artifact.licensed || false,
      rights: artifact.rights || 'user-owned', // 'user-owned', 'platform', 'shared'
      
      // Provenance
      inputPrompt: artifact.inputPrompt?.slice(0, 500) || null, // Truncated for privacy
      outputLength: artifact.outputLength || null, // characters or tokens
    };

    this.artifacts.push(entry);

    // Evict oldest if over limit
    if (this.artifacts.length > this.maxArtifacts) {
      this.artifacts.shift();
    }

    // Persist
    this.saveToStorage();

    // Log to analytics
    this.trackEvent('artifact-created', entry);

    return entry;
  }

  /**
   * Query artifacts by criteria
   */
  queryArtifacts(/** @type {any} */ filters = {}) {
    let /** @type {any} */
results = [...this.artifacts];

    if (filters.type) {
    results = results.filter((/** @type {any} */ a) => a.type === filters.type);
    }

    if (filters.provider) {
      results = results.filter((/** @type {any} */ a) => a.provider.id === filters.provider);
    }

    if (filters.model) {
      results = results.filter((/** @type {any} */ a) => a.model.name === filters.model);
    }

    if (filters.creator) {
      results = results.filter((/** @type {any} */ a) => a.creator === filters.creator);
    }

    if (filters.hasArweaveUrl) {
      results = results.filter((/** @type {any} */ a) => !!a.arweaveUrl);
    }

    if (filters.isNFT) {
      results = results.filter((/** @type {any} */ a) => a.quality.isNFT);
    }

    if (filters.minRating) {
      results = results.filter((/** @type {any} */ a) => (a.quality.rating || 0) >= filters.minRating);
    }

    // Sort by createdAt desc (newest first)
    results.sort((/** @type {any} */ a, /** @type {any} */ b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));

    return results;
  }

  /**
   * Get artifact by ID
   */
  getArtifact(/** @type {any} */ id) {
    return this.artifacts.find((/** @type {any} */ a) => a.id === id);
  }

  /**
   * Update artifact metadata (e.g., after marketplace listing)
   */
  updateArtifact(/** @type {any} */ id, /** @type {any} */ updates) {
    const artifact = this.getArtifact(id);
    if (!artifact) return null;

    Object.assign(artifact, updates);

    if (updates.marketplaceUrl) {
      artifact.marketplaceAt = new Date().toISOString();
      this.trackEvent('artifact-listed', artifact);
    }

    if (updates.arweaveUrl) {
      artifact.permanenceAt = new Date().toISOString();
      this.trackEvent('artifact-anchored', artifact);
    }

    this.saveToStorage();
    return artifact;
  }

  /**
   * Generate analytics report
   */
  generateAnalytics() {
    const /** @type {any} */
report = {
      totalArtifacts: this.artifacts.length,
      byType: {},
      byProvider: {},
      byModel: {},
      avgGenerationTime: 0,
      avgFirstTokenLatency: 0,
      nftCount: 0,
      permanentCount: 0,
      providerDistribution: {},
      modelDistribution: {},
      qualityDistribution: {},
      timeline: []
    };

    let totalGenTime = 0;
    let totalLatency = 0;
    let genTimeCount = 0;
    let latencyCount = 0;

    // Aggregate statistics
    for (const /** @type {any} */
artifact of this.artifacts) {
      // By type
      report.byType[artifact.type] = (report.byType[artifact.type] || 0) + 1;

      // By provider
      const providerLabel = artifact.provider.label;
      report.byProvider[providerLabel] = (report.byProvider[providerLabel] || 0) + 1;

      // By model
      const modelName = artifact.model.name;
      report.byModel[modelName] = (report.byModel[modelName] || 0) + 1;

      // Generation time
      if (artifact.generationTime) {
        totalGenTime += artifact.generationTime;
        genTimeCount++;
      }

      // First token latency
      if (artifact.firstTokenLatency) {
        totalLatency += artifact.firstTokenLatency;
        latencyCount++;
      }

      // NFT count
      if (artifact.quality.isNFT) {
        report.nftCount++;
      }

      // Permanent count
      if (artifact.permanenceAt) {
        report.permanentCount++;
      }
    }

    // Averages
    report.avgGenerationTime = genTimeCount > 0 ? Math.round(totalGenTime / genTimeCount) : 0;
    report.avgFirstTokenLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

    // Provider distribution percentage
    for (const [provider, count] of Object.entries(report.byProvider)) {
      report.providerDistribution[provider] = Math.round((count / report.totalArtifacts) * 100);
    }

    // Model distribution percentage
    for (const [model, count] of Object.entries(report.byModel)) {
      report.modelDistribution[model] = Math.round((count / report.totalArtifacts) * 100);
    }

    // Quality distribution
    report.qualityDistribution = {
      withRating: this.artifacts.filter(/** @type {any} */ a => a.quality.rating).length,
      nftCount: report.nftCount,
      permanentCount: report.permanentCount,
      licensed: this.artifacts.filter(/** @type {any} */ a => a.licensed).length
    };

    // Timeline: artifacts per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const /** @type {any} */
dailyCount = {};
    for (const /** @type {any} */
artifact of this.artifacts) {
      const date = new Date(artifact.createdAt).toISOString().split('T')[0];
      if (new Date(artifact.createdAt) >= thirtyDaysAgo) {
        dailyCount[date] = (dailyCount[date] || 0) + 1;
      }
    }
    report.timeline = dailyCount;

    return report;
  }

  /**
   * Export artifact index for audit
   */
  exportIndex() {
    return {
      exportedAt: new Date().toISOString(),
      totalCount: this.artifacts.length,
      artifacts: this.artifacts.map(/** @type {any} */ a => ({
        id: a.id,
        type: a.type,
        provider: a.provider,
        model: a.model,
        createdAt: a.createdAt,
        marketplaceUrl: a.marketplaceUrl,
        arweaveUrl: a.arweaveUrl,
        quality: a.quality,
        generationTime: a.generationTime,
        firstTokenLatency: a.firstTokenLatency
      }))
    };
  }

  /**
   * Create audit CSV for provider/model tracking
   */
  exportCSV() {
    const /** @type {any} */
headers = [
      'ID', 'Type', 'Provider', 'Model', 'CreatedAt', 'Creator',
      'GenerationTime(ms)', 'FirstTokenLatency(ms)', 'Quality', 'IsNFT', 
      'HasMarketplaceURL', 'HasArweaveURL', 'Tags'
    ];

    const rows = this.artifacts.map(/** @type {any} */ a => [
      a.id,
      a.type,
      a.provider.label,
      a.model.name,
      a.createdAt,
      a.creator || 'anonymous',
      a.generationTime || '',
      a.firstTokenLatency || '',
      a.quality.rating || '',
      a.quality.isNFT ? 'Yes' : 'No',
      a.marketplaceUrl ? 'Yes' : 'No',
      a.arweaveUrl ? 'Yes' : 'No',
      a.tags.join(';')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(/** @type {any} */ r => r.map(/** @type {any} */ v => `"${v}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Generate ID
   */
  generateId() {
    return `art-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track event for analytics
   */
  trackEvent(/** @type {any} */ eventName, /** @type {any} */ data) {
    // Send to analytics service if available
    if (typeof window !== 'undefined' && window.eonAnalytics?.trackEvent) {
      window.eonAnalytics.trackEvent(eventName, {
        artifactType: data.type,
        provider: data.provider?.id,
        model: data.model?.name,
        ...data
      });
    }
  }

  /**
   * Save index to localStorage
   */
  saveToStorage() {
    try {
      const data = JSON.stringify({
        version: 2,
        artifacts: this.artifacts,
        lastSync: new Date().toISOString()
      });
      localStorage.setItem(this.storageKey, data);
    } catch (/** @type {any} */
e) {
      console.warn('[ArtifactIndex] Failed to save to localStorage:', e);
    }
  }

  /**
   * Load index from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.artifacts = parsed.artifacts || [];
      }
    } catch (/** @type {any} */
e) {
      console.warn('[ArtifactIndex] Failed to load from localStorage:', e);
      this.artifacts = [];
    }
  }

  /**
   * Clear index (for testing)
   */
  clear() {
    this.artifacts = [];
    this.saveToStorage();
  }

  /**
   * Get index statistics
   */
  getStatistics() {
    return {
      totalCount: this.artifacts.length,
      averageGenerationTime: this.artifacts.reduce((/** @type {any} */ sum, /** @type {any} */ a) => sum + (a.generationTime || 0), 0) / this.artifacts.length,
      averageFirstTokenLatency: this.artifacts.reduce((/** @type {any} */ sum, /** @type {any} */ a) => sum + (a.firstTokenLatency || 0), 0) / this.artifacts.length,
      nftCount: this.artifacts.filter(/** @type {any} */ a => a.quality.isNFT).length,
      permanentCount: this.artifacts.filter(/** @type {any} */ a => a.permanenceAt).length,
      topProviders: Object.entries(
        this.artifacts.reduce((/** @type {any} */ acc, /** @type {any} */ a) => {
          acc[a.provider.label] = (acc[a.provider.label] || 0) + 1;
          return acc;
        }, {})
      ).sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1]).slice(0, 5),
      topModels: Object.entries(
        this.artifacts.reduce((/** @type {any} */ acc, /** @type {any} */ a) => {
          acc[a.model.name] = (acc[a.model.name] || 0) + 1;
          return acc;
        }, {})
      ).sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1]).slice(0, 5)
    };
  }
}

// Export singleton
export const artifactIndex = new ArtifactIndex();

// Initialize on window load
if (typeof window !== 'undefined') {
  window.eonArtifactIndex = artifactIndex;
}
