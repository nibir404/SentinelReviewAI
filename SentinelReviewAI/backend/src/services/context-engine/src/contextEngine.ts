import { logger } from '../../common/utils/logger';
import { ContextStore, ContextEntry, ContextQuery, ContextSummary } from './contextStore';
import { v4 as uuidv4 } from 'uuid';

export interface ContextEngineConfig {
  retentionDays: number;
  maxEntries: number;
}

export class ContextEngine {
  private store: ContextStore;
  private config: ContextEngineConfig;

  constructor(config?: ContextEngineConfig) {
    this.store = new ContextStore();
    this.config = config || {
      retentionDays: 30,
      maxEntries: 10000
    };
  }

  /**
   * Initialize the context engine
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Context Engine');
    
    // Start cleanup job
    this.startCleanupJob();
  }

  /**
   * Record a pull request event
   */
  async recordPullRequest(
    provider: string,
    repository: string,
    pullRequestId: number,
    data: any
  ): Promise<ContextEntry> {
    const entry: ContextEntry = {
      id: uuidv4(),
      type: 'pull_request',
      provider,
      repository,
      pullRequestId,
      data,
      timestamp: new Date()
    };

    return this.store.add(entry);
  }

  /**
   * Record a review event
   */
  async recordReview(
    provider: string,
    repository: string,
    pullRequestId: number,
    data: any
  ): Promise<ContextEntry> {
    const entry: ContextEntry = {
      id: uuidv4(),
      type: 'review',
      provider,
      repository,
      pullRequestId,
      data,
      timestamp: new Date()
    };

    return this.store.add(entry);
  }

  /**
   * Record a comment event
   */
  async recordComment(
    provider: string,
    repository: string,
    pullRequestId: number,
    data: any
  ): Promise<ContextEntry> {
    const entry: ContextEntry = {
      id: uuidv4(),
      type: 'comment',
      provider,
      repository,
      pullRequestId,
      data,
      timestamp: new Date()
    };

    return this.store.add(entry);
  }

  /**
   * Record an issue event
   */
  async recordIssue(
    provider: string,
    repository: string,
    data: any
  ): Promise<ContextEntry> {
    const entry: ContextEntry = {
      id: uuidv4(),
      type: 'issue',
      provider,
      repository,
      data,
      timestamp: new Date()
    };

    return this.store.add(entry);
  }

  /**
   * Record a commit event
   */
  async recordCommit(
    provider: string,
    repository: string,
    data: any
  ): Promise<ContextEntry> {
    const entry: ContextEntry = {
      id: uuidv4(),
      type: 'commit',
      provider,
      repository,
      data,
      timestamp: new Date()
    };

    return this.store.add(entry);
  }

  /**
   * Get context for a pull request
   */
  async getPullRequestContext(
    provider: string,
    repository: string,
    pullRequestId: number
  ): Promise<ContextEntry[]> {
    return this.store.getPullRequestContext(provider, repository, pullRequestId);
  }

  /**
   * Query context entries
   */
  async query(query: ContextQuery): Promise<ContextEntry[]> {
    return this.store.query(query);
  }

  /**
   * Get recent context entries
   */
  async getRecent(limit: number = 10): Promise<ContextEntry[]> {
    return this.store.getRecent(limit);
  }

  /**
   * Get context summary
   */
  async getSummary(): Promise<ContextSummary> {
    return this.store.getSummary();
  }

  /**
   * Get historical context for AI analysis
   */
  async getHistoricalContext(
    provider: string,
    repository: string,
    pullRequestId: number
  ): Promise<{
    previousReviews: any[];
    similarIssues: any[];
    recentChanges: any[];
  }> {
    const context = await this.store.getPullRequestContext(provider, repository, pullRequestId);

    const previousReviews = context.filter(e => e.type === 'review').map(e => e.data);
    const similarIssues = context.filter(e => e.type === 'issue').map(e => e.data);
    const recentChanges = context.filter(e => e.type === 'commit').map(e => e.data);

    return {
      previousReviews,
      similarIssues,
      recentChanges
    };
  }

  /**
   * Start periodic cleanup job
   */
  private startCleanupJob(): void {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        await this.store.cleanup(this.config.retentionDays);
      } catch (error) {
        logger.error('Error during context cleanup:', error);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Clear all context
   */
  async clear(): Promise<void> {
    await this.store.clear();
  }
}

export default new ContextEngine();
