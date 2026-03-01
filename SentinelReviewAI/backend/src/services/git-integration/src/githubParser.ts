import { logger } from '../../common/utils/logger';

export interface ParsedEvent {
  provider: string;
  action: string;
  repository: {
    id: number;
    name: string;
    fullName: string;
    url: string;
    defaultBranch: string;
    private: boolean;
  };
  pullRequest?: {
    id: number;
    number: number;
    title: string;
    body: string;
    author: string;
    state: string;
    merged: boolean;
    url: string;
  };
  commits?: Array<{
    sha: string;
    message: string;
    author: string;
    timestamp: string;
    additions: number;
    deletions: number;
  }>;
  baseBranch?: string;
  headBranch?: string;
  sender?: string;
}

export class GitHubEventParser {
  /**
   * Parse GitHub webhook payload
   */
  async parse(payload: any, event: string): Promise<ParsedEvent> {
    logger.info(`Parsing GitHub event: ${event}`);

    switch (event) {
      case 'pull_request':
        return this.parsePullRequest(payload);
      case 'pull_request_review':
        return this.parsePullRequestReview(payload);
      case 'pull_request_review_comment':
        return this.parseReviewComment(payload);
      case 'push':
        return this.parsePush(payload);
      case 'check_run':
        return this.parseCheckRun(payload);
      case 'check_suite':
        return this.parseCheckSuite(payload);
      default:
        return this.parseGeneric(payload, event);
    }
  }

  /**
   * Parse pull request event
   */
  private parsePullRequest(payload: any): ParsedEvent {
    const pr = payload.pull_request;
    const repo = payload.repository;

    return {
      provider: 'github',
      action: payload.action,
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private
      },
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
      sender: payload.sender?.login
    };
  }

  /**
   * Parse pull request review event
   */
  private parsePullRequestReview(payload: any): ParsedEvent {
    const pr = payload.pull_request;
    const review = payload.review;
    const repo = payload.repository;

    return {
      provider: 'github',
      action: payload.action,
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private
      },
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
      sender: payload.sender?.login
    };
  }

  /**
   * Parse review comment event
   */
  private parseReviewComment(payload: any): ParsedEvent {
    const comment = payload.comment;
    const pr = payload.pull_request;
    const repo = payload.repository;

    return {
      provider: 'github',
      action: payload.action,
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private
      },
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
      sender: payload.sender?.login
    };
  }

  /**
   * Parse push event
   */
  private parsePush(payload: any): ParsedEvent {
    const repo = payload.repository;

    return {
      provider: 'github',
      action: 'push',
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private
      },
      commits: payload.commits?.map((commit: any) => ({
        sha: commit.id,
        message: commit.message,
        author: commit.author.name,
        timestamp: commit.timestamp,
        additions: 0, // Not provided in push event
        deletions: 0
      })) || [],
      baseBranch: payload.ref?.replace('refs/heads/', ''),
      sender: payload.sender?.login
    };
  }

  /**
   * Parse check run event
   */
  private parseCheckRun(payload: any): ParsedEvent {
    const checkRun = payload.check_run;
    const repo = payload.repository;

    return {
      provider: 'github',
      action: payload.action,
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private
      },
      pullRequest: {
        id: checkRun.pull_requests?.[0]?.id,
        number: checkRun.pull_requests?.[0]?.number,
        title: checkRun.name,
        body: '',
        author: '',
        state: 'open',
        merged: false,
        url: checkRun.html_url
      },
      sender: payload.sender?.login
    };
  }

  /**
   * Parse check suite event
   */
  private parseCheckSuite(payload: any): ParsedEvent {
    const checkSuite = payload.check_suite;
    const repo = payload.repository;

    return {
      provider: 'github',
      action: payload.action,
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private
      },
      sender: payload.sender?.login
    };
  }

  /**
   * Parse generic event
   */
  private parseGeneric(payload: any, event: string): ParsedEvent {
    const repo = payload.repository || {};

    return {
      provider: 'github',
      action: event,
      repository: {
        id: repo.id || 0,
        name: repo.name || '',
        fullName: repo.full_name || '',
        url: repo.html_url || '',
        defaultBranch: repo.default_branch || 'main',
        private: repo.private || false
      },
      sender: payload.sender?.login
    };
  }
}
