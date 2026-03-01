import { logger } from '../utils/logger';
import { ParsedEvent, Repository, PullRequest } from '../types';

export class GitLabParser {
  async parse(payload: any, event: string): Promise<ParsedEvent | null> {
    logger.info(`Parsing GitLab event: ${event}`);

    switch (event) {
      case 'Merge Request Hook':
        return this.parseMergeRequest(payload);
      case 'Push Hook':
        return this.parsePush(payload);
      default:
        return this.parseGeneric(payload, event);
    }
  }

  private parseMergeRequest(payload: any): ParsedEvent {
    const mr = payload.object_attributes;
    const project = payload.project;
    const user = payload.user;

    return {
      provider: 'gitlab',
      action: mr.action,
      repository: this.parseRepository(project),
      pullRequest: {
        id: mr.id,
        number: mr.iid,
        title: mr.title,
        body: mr.description || '',
        author: user.username,
        state: mr.state,
        merged: mr.state === 'merged',
        url: mr.url
      },
      baseBranch: mr.target_branch,
      headBranch: mr.source_branch,
      sender: user.username
    };
  }

  private parsePush(payload: any): ParsedEvent {
    const project = payload.project;

    return {
      provider: 'gitlab',
      action: 'push',
      repository: this.parseRepository(project),
      commits: payload.commits?.map((commit: any) => ({
        sha: commit.id,
        message: commit.message,
        author: commit.author.name,
        timestamp: commit.timestamp,
        additions: 0,
        deletions: 0
      })) || [],
      baseBranch: payload.ref?.replace('refs/heads/', ''),
      sender: payload.user_username
    };
  }

  private parseGeneric(payload: any, event: string): ParsedEvent {
    const project = payload.project || {};

    return {
      provider: 'gitlab',
      action: event,
      repository: this.parseRepository(project),
      sender: payload.user_username
    };
  }

  private parseRepository(project: any): Repository {
    return {
      id: project.id,
      name: project.name,
      fullName: project.path_with_namespace,
      url: project.web_url,
      defaultBranch: project.default_branch,
      private: project.visibility !== 'public'
    };
  }
}
