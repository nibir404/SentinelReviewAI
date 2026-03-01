import { logger } from '../../common/utils/logger';
import { ParsedEvent } from './githubParser';

export class GitLabEventParser {
  /**
   * Parse GitLab webhook payload
   */
  async parse(payload: any, event: string): Promise<ParsedEvent> {
    logger.info(`Parsing GitLab event: ${event}`);

    switch (event) {
      case 'Merge Request Hook':
        return this.parseMergeRequest(payload);
      case 'Push Hook':
        return this.parsePush(payload);
      case 'Tag Push Hook':
        return this.parseTagPush(payload);
      case 'Issue Hook':
        return this.parseIssue(payload);
      case 'Note Hook':
        return this.parseNote(payload);
      default:
        return this.parseGeneric(payload, event);
    }
  }

  /**
   * Parse merge request event
   */
  private parseMergeRequest(payload: any): ParsedEvent {
    const mr = payload.object_attributes;
    const project = payload.project;
    const user = payload.user;

    return {
      provider: 'gitlab',
      action: mr.action,
      repository: {
        id: project.id,
        name: project.name,
        fullName: project.path_with_namespace,
        url: project.web_url,
        defaultBranch: project.default_branch,
        private: project.visibility !== 'public'
      },
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
      commits: mr.diff_refs ? undefined : undefined, // GitLab provides diffs separately
      sender: user.username
    };
  }

  /**
   * Parse push event
   */
  private parsePush(payload: any): ParsedEvent {
    const project = payload.project;
    const user = payload.user_username;

    return {
      provider: 'gitlab',
      action: 'push',
      repository: {
        id: project.id,
        name: project.name,
        fullName: project.path_with_namespace,
        url: project.web_url,
        defaultBranch: project.default_branch,
        private: project.visibility !== 'public'
      },
      commits: payload.commits?.map((commit: any) => ({
        sha: commit.id,
        message: commit.message,
        author: commit.author.name,
        timestamp: commit.timestamp,
        additions: 0,
        deletions: 0
      })) || [],
      baseBranch: payload.ref?.replace('refs/heads/', ''),
      sender: user
    };
  }

  /**
   * Parse tag push event
   */
  private parseTagPush(payload: any): ParsedEvent {
    const project = payload.project;
    const user = payload.user_username;

    return {
      provider: 'gitlab',
      action: 'tag_push',
      repository: {
        id: project.id,
        name: project.name,
        fullName: project.path_with_namespace,
        url: project.web_url,
        defaultBranch: project.default_branch,
        private: project.visibility !== 'public'
      },
      commits: payload.commits?.map((commit: any) => ({
        sha: commit.id,
        message: commit.message,
        author: commit.author.name,
        timestamp: commit.timestamp,
        additions: 0,
        deletions: 0
      })) || [],
      baseBranch: payload.ref?.replace('refs/tags/', ''),
      sender: user
    };
  }

  /**
   * Parse issue event
   */
  private parseIssue(payload: any): ParsedEvent {
    const issue = payload.object_attributes;
    const project = payload.project;
    const user = payload.user;

    return {
      provider: 'gitlab',
      action: issue.action,
      repository: {
        id: project.id,
        name: project.name,
        fullName: project.path_with_namespace,
        url: project.web_url,
        defaultBranch: project.default_branch,
        private: project.visibility !== 'public'
      },
      sender: user.username
    };
  }

  /**
   * Parse note (comment) event
   */
  private parseNote(payload: any): ParsedEvent {
    const note = payload.object_attributes;
    const project = payload.project;
    const user = payload.user;

    return {
      provider: 'gitlab',
      action: note.noteable_type.toLowerCase(),
      repository: {
        id: project.id,
        name: project.name,
        fullName: project.path_with_namespace,
        url: project.web_url,
        defaultBranch: project.default_branch,
        private: project.visibility !== 'public'
      },
      sender: user.username
    };
  }

  /**
   * Parse generic event
   */
  private parseGeneric(payload: any, event: string): ParsedEvent {
    const project = payload.project || {};

    return {
      provider: 'gitlab',
      action: event,
      repository: {
        id: project.id || 0,
        name: project.name || '',
        fullName: project.path_with_namespace || '',
        url: project.web_url || '',
        defaultBranch: project.default_branch || 'main',
        private: project.visibility !== 'public'
      },
      sender: payload.user_username
    };
  }
}
