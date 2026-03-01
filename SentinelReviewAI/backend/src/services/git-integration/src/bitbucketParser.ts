import { logger } from '../../common/utils/logger';
import { ParsedEvent } from './githubParser';

export class BitbucketEventParser {
  /**
   * Parse Bitbucket webhook payload
   */
  async parse(payload: any, event: string): Promise<ParsedEvent> {
    logger.info(`Parsing Bitbucket event: ${event}`);

    // Extract event key from header or payload
    const eventKey = event || payload.eventKey;

    switch (eventKey) {
      case 'pullrequest:created':
      case 'pullrequest:updated':
      case 'pullrequest:fulfilled':
      case 'pullrequest:rejected':
        return this.parsePullRequest(payload);
      case 'repo:push':
        return this.parsePush(payload);
      case 'repo:fork':
        return this.parseFork(payload);
      case 'repo:updated':
        return this.parseRepoUpdate(payload);
      default:
        return this.parseGeneric(payload, eventKey);
    }
  }

  /**
   * Parse pull request event
   */
  private parsePullRequest(payload: any): ParsedEvent {
    const pr = payload.pullrequest;
    const repo = payload.repository;

    return {
      provider: 'bitbucket',
      action: payload.eventKey?.replace('pullrequest:', ''),
      repository: {
        id: repo.uuid,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.links.html.href,
        defaultBranch: repo.mainbranch?.name || 'main',
        private: !repo.is_private
      },
      pullRequest: {
        id: pr.id,
        number: pr.id,
        title: pr.title,
        body: pr.description || '',
        author: pr.author?.display_name || pr.author?.username,
        state: pr.state,
        merged: pr.state === 'MERGED',
        url: pr.links.html.href
      },
      baseBranch: pr.destination?.branch?.name,
      headBranch: pr.source?.branch?.name,
      sender: payload.actor?.display_name
    };
  }

  /**
   * Parse push event
   */
  private parsePush(payload: any): ParsedEvent {
    const repo = payload.repository;
    const push = payload.push;

    return {
      provider: 'bitbucket',
      action: 'push',
      repository: {
        id: repo.uuid,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.links.html.href,
        defaultBranch: repo.mainbranch?.name || 'main',
        private: !repo.is_private
      },
      commits: push?.changes?.[0]?.commits?.map((commit: any) => ({
        sha: commit.hash,
        message: commit.message,
        author: commit.author?.raw,
        timestamp: commit.date,
        additions: 0,
        deletions: 0
      })) || [],
      baseBranch: push?.changes?.[0]?.new?.name,
      sender: payload.actor?.display_name
    };
  }

  /**
   * Parse fork event
   */
  private parseFork(payload: any): ParsedEvent {
    const repo = payload.repository;

    return {
      provider: 'bitbucket',
      action: 'fork',
      repository: {
        id: repo.uuid,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.links.html.href,
        defaultBranch: repo.mainbranch?.name || 'main',
        private: !repo.is_private
      },
      sender: payload.actor?.display_name
    };
  }

  /**
   * Parse repository update event
   */
  private parseRepoUpdate(payload: any): ParsedEvent {
    const repo = payload.repository;

    return {
      provider: 'bitbucket',
      action: 'updated',
      repository: {
        id: repo.uuid,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.links.html.href,
        defaultBranch: repo.mainbranch?.name || 'main',
        private: !repo.is_private
      },
      sender: payload.actor?.display_name
    };
  }

  /**
   * Parse generic event
   */
  private parseGeneric(payload: any, event: string): ParsedEvent {
    const repo = payload.repository || {};

    return {
      provider: 'bitbucket',
      action: event,
      repository: {
        id: repo.uuid || '',
        name: repo.name || '',
        fullName: repo.full_name || '',
        url: repo.links?.html?.href || '',
        defaultBranch: repo.mainbranch?.name || 'main',
        private: !repo.is_private
      },
      sender: payload.actor?.display_name
    };
  }
}
