import { logger } from '../utils/logger';
import { ParsedEvent, Repository, PullRequest, Commit } from '../types';

export class GitHubParser {
  async parse(payload: any, event: string): Promise<ParsedEvent | null> {
    logger.info(`Parsing GitHub event: ${event}`);

    switch (event) {
      case 'pull_request':
        return this.parsePullRequest(payload);
      case 'push':
        return this.parsePush(payload);
      case 'check_run':
      case 'check_suite':
        return this.parseCheck(payload);
      default:
        return this.parseGeneric(payload, event);
    }
  }

  private parsePullRequest(payload: any): ParsedEvent {
    const pr = payload.pull_request;
    const repo = payload.repository;
    const sender = payload.sender;

    return {
      provider: 'github',
      action: payload.action,
      repository: this.parseRepository(repo),
      pullRequest: {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        author: pr.user.login,
        state: pr.state,
        merged: pr.merged,
        url: pr.html_url
      },
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      sender: sender.login
    };
  }

  private parsePush(payload: any): ParsedEvent {
    const repo = payload.repository;
    const sender = payload.sender;

    return {
      provider: 'github',
      action: 'push',
      repository: this.parseRepository(repo),
      commits: payload.commits?.map((commit: any) => ({
        sha: commit.id,
        message: commit.message,
        author: commit.author.username,
        timestamp: commit.timestamp,
        additions: 0,
        deletions: 0
      })) || [],
      baseBranch: payload.ref?.replace('refs/heads/', ''),
      sender: sender?.login || 'unknown'
    };
  }

  private parseCheck(payload: any): ParsedEvent {
    const repo = payload.repository;
    const sender = payload.sender;

    return {
      provider: 'github',
      action: payload.action,
      repository: this.parseRepository(repo),
      sender: sender.login
    };
  }

  private parseGeneric(payload: any, event: string): ParsedEvent {
    const repo = payload.repository || {};

    return {
      provider: 'github',
      action: event,
      repository: this.parseRepository(repo),
      sender: payload.sender?.login || 'unknown'
    };
  }

  private parseRepository(repo: any): Repository {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      private: repo.private
    };
  }
}
