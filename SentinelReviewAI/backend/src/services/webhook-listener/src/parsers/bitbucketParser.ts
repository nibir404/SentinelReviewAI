import { logger } from '../utils/logger';
import { ParsedEvent, Repository, PullRequest } from '../types';

export class BitbucketParser {
  async parse(payload: any, event: string): Promise<ParsedEvent | null> {
    logger.info(`Parsing Bitbucket event: ${event}`);

    switch (event) {
      case 'pullrequest:created':
      case 'pullrequest:updated':
      case 'pullrequest:merged':
      case 'pullrequest:declined':
        return this.parsePullRequest(payload);
      case 'repo:push':
        return this.parsePush(payload);
      default:
        return this.parseGeneric(payload, event);
    }
  }

  private parsePullRequest(payload: any): ParsedEvent {
    const pr = payload.pullrequest;
    const repo = payload.repository;

    return {
      provider: 'bitbucket',
      action: payload.event === 'pullrequest:created' ? 'opened' :
             payload.event === 'pullrequest:updated' ? 'synchronize' :
             payload.event === 'pullrequest:merged' ? 'merged' : 'closed',
      repository: this.parseRepository(repo),
      pullRequest: {
        id: pr.id,
        number: pr.id,
        title: pr.title,
        body: pr.description || '',
        author: pr.author.username,
        state: pr.state,
        merged: pr.state === 'MERGED',
        url: pr.links.html.href
      },
      baseBranch: pr.destination.branch.name,
      headBranch: pr.source.branch.name,
      sender: pr.author.username
    };
  }

  private parsePush(payload: any): ParsedEvent {
    const repo = payload.repository;

    return {
      provider: 'bitbucket',
      action: 'push',
      repository: this.parseRepository(repo),
      commits: payload.push?.changes?.[0]?.commits?.map((commit: any) => ({
        sha: commit.hash,
        message: commit.message,
        author: commit.author.raw,
        timestamp: commit.date,
        additions: 0,
        deletions: 0
      })) || [],
      baseBranch: payload.push?.changes?.[0]?.new?.name,
      sender: payload.actor?.username
    };
  }

  private parseGeneric(payload: any, event: string): ParsedEvent {
    const repo = payload.repository || {};

    return {
      provider: 'bitbucket',
      action: event,
      repository: this.parseRepository(repo),
      sender: payload.actor?.username
    };
  }

  private parseRepository(repo: any): Repository {
    return {
      id: repo.uuid,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.links?.html?.href || '',
      defaultBranch: repo.mainbranch?.name || 'main',
      private: repo.is_private
    };
  }
}
