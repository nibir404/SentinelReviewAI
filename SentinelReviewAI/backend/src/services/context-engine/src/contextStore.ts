import { logger } from '../../common/utils/logger';

export interface ContextEntry {
  id: string;
  type: 'pull_request' | 'review' | 'comment' | 'issue' | 'commit';
  provider: string;
  repository: string;
  pullRequestId?: number;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ContextQuery {
  provider?: string;
  repository?: string;
  pullRequestId?: number;
  type?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

export interface ContextSummary {
  totalEntries: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  byRepository: Record<string, number>;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export class ContextStore {
  private store: Map<string, ContextEntry> = new Map();
  private index: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeIndexes();
  }

  private initializeIndexes(): void {
    // Create indexes for fast lookups
    this.index.set('byProvider', new Set());
    this.index.set('byRepository', new Set());
    this.index.set('byType', new Set());
    this.index.set('byPullRequest', new Set());
  }

  /**
   * Add a new context entry
   */
  async add(entry: ContextEntry): Promise<ContextEntry> {
    const key = this.getKey(entry);
    this.store.set(key, entry);
    
    // Update indexes
    this.updateIndexes(entry);
    
    logger.info(`Added context entry: ${key}`);
    return entry;
  }

  /**
   * Get a context entry by ID
   */
  async get(id: string): Promise<ContextEntry | undefined> {
    return this.store.get(id);
  }

  /**
   * Query context entries
   */
  async query(query: ContextQuery): Promise<ContextEntry[]> {
    let results = Array.from(this.store.values());

    // Filter by provider
    if (query.provider) {
      results = results.filter(e => e.provider === query.provider);
    }

    // Filter by repository
    if (query.repository) {
      results = results.filter(e => e.repository === query.repository);
    }

    // Filter by pull request
    if (query.pullRequestId) {
      results = results.filter(e => e.pullRequestId === query.pullRequestId);
    }

    // Filter by type
    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    // Filter by date range
    if (query.since) {
      results = results.filter(e => e.timestamp >= query.since!);
    }

    if (query.until) {
      results = results.filter(e => e.timestamp <= query.until!);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get context for a specific pull request
   */
  async getPullRequestContext(
    provider: string,
    repository: string,
    pullRequestId: number
  ): Promise<ContextEntry[]> {
    return this.query({
      provider,
      repository,
      pullRequestId,
      limit: 100
    });
  }

  /**
   * Get recent context entries
   */
  async getRecent(limit: number = 10): Promise<ContextEntry[]> {
    return this.query({ limit });
  }

  /**
   * Get context summary
   */
  async getSummary(): Promise<ContextSummary> {
    const entries = Array.from(this.store.values());
    
    const byType: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const byRepository: Record<string, number> = {};

    let oldest = new Date();
    let newest = new Date(0);

    for (const entry of entries) {
      // Count by type
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      
      // Count by provider
      byProvider[entry.provider] = (byProvider[entry.provider] || 0) + 1;
      
      // Count by repository
      byRepository[entry.repository] = (byRepository[entry.repository] || 0) + 1;

      // Track date range
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }

    return {
      totalEntries: entries.length,
      byType,
      byProvider,
      byRepository,
      dateRange: {
        start: oldest,
        end: newest
      }
    };
  }

  /**
   * Delete old entries
   */
  async cleanup(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let deleted = 0;
    const toDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.timestamp < cutoff) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.store.delete(key);
      deleted++;
    }

    logger.info(`Cleaned up ${deleted} old context entries`);
    return deleted;
  }

  /**
   * Clear all context
   */
  async clear(): Promise<void> {
    this.store.clear();
    this.initializeIndexes();
    logger.info('Cleared all context entries');
  }

  private getKey(entry: ContextEntry): string {
    return `${entry.provider}:${entry.repository}:${entry.type}:${entry.id}`;
  }

  private updateIndexes(entry: ContextEntry): void {
    const byProvider = this.index.get('byProvider');
    const byRepository = this.index.get('byRepository');
    const byType = this.index.get('byType');
    const byPullRequest = this.index.get('byPullRequest');

    if (byProvider) byProvider.add(entry.provider);
    if (byRepository) byRepository.add(entry.repository);
    if (byType) byType.add(entry.type);
    if (byPullRequest && entry.pullRequestId) {
      byPullRequest.add(`${entry.pullRequestId}`);
    }
  }
}

export default new ContextStore();
