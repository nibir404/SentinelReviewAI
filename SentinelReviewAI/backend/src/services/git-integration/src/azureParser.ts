import { logger } from '../../common/utils/logger';

export interface AzurePullRequest {
  pullRequestId: number;
  codeReviewId: number;
  title: string;
  description: string;
  sourceRefName: string;
  targetRefName: string;
  status: string;
  createdBy: {
    displayName: string;
    uniqueName: string;
    id: string;
  };
  creationDate: string;
  mergeId: string;
  lastMergeSourceCommit: {
    commitId: string;
    url: string;
  };
  lastMergeTargetCommit: {
    commitId: string;
    url: string;
  };
}

export interface AzureRepository {
  id: string;
  name: string;
  project: {
    id: string;
    name: string;
  };
  remoteUrl: string;
  webUrl: string;
}

export interface AzureParsedEvent {
  provider: 'azure';
  event: string;
  action: string;
  repository: {
    id: string;
    name: string;
    fullName: string;
    project: string;
    url: string;
  };
  pullRequest?: {
    id: number;
    number: number;
    title: string;
    description: string;
    author: string;
    authorEmail: string;
    state: string;
    merged: boolean;
    mergeable: boolean;
  };
  commits?: any[];
  baseBranch: string;
  headBranch: string;
}

export class AzureEventParser {
  /**
   * Parse Azure DevOps webhook payload
   */
  async parse(payload: any, eventType: string): Promise<AzureParsedEvent> {
    logger.info(`Parsing Azure event: ${eventType}`);

    switch (eventType) {
      case 'git.pullrequest.created':
      case 'git.pullrequest.updated':
        return this.parsePullRequestEvent(payload, eventType);
      case 'git.push':
        return this.parsePushEvent(payload, eventType);
      case 'build.complete':
        return this.parseBuildEvent(payload, eventType);
      default:
        logger.warn(`Unknown Azure event type: ${eventType}`);
        return this.parseGenericEvent(payload, eventType);
    }
  }

  /**
   * Parse pull request created/updated events
   */
  private parsePullRequestEvent(payload: any, eventType: string): AzureParsedEvent {
    const pr: AzurePullRequest = payload.resource;
    const repository: AzureRepository = payload.resource.repository;
    const project = repository.project;

    const action = eventType === 'git.pullrequest.created' ? 'opened' : 'synchronize';

    return {
      provider: 'azure',
      event: eventType,
      action,
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: `${project.name}/${repository.name}`,
        project: project.name,
        url: repository.webUrl
      },
      pullRequest: {
        id: pr.pullRequestId,
        number: pr.pullRequestId,
        title: pr.title,
        description: pr.description || '',
        author: pr.createdBy.displayName,
        authorEmail: pr.createdBy.uniqueName,
        state: pr.status,
        merged: pr.status === 'completed',
        mergeable: pr.status === 'notSet'
      },
      baseBranch: pr.targetRefName.replace('refs/heads/', ''),
      headBranch: pr.sourceRefName.replace('refs/heads/', '')
    };
  }

  /**
   * Parse push events
   */
  private parsePushEvent(payload: any, eventType: string): AzureParsedEvent {
    const resource = payload.resource;
    const repository = resource.repository;
    const project = repository.project;

    const commits = resource.commits?.map((commit: any) => ({
      id: commit.commitId,
      message: commit.comment,
      author: commit.author?.displayName,
      authorEmail: commit.author?.email,
      timestamp: commit.timestamp,
      url: commit.url
    })) || [];

    return {
      provider: 'azure',
      event: eventType,
      action: 'push',
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: `${project.name}/${repository.name}`,
        project: project.name,
        url: repository.webUrl
      },
      commits,
      baseBranch: '',
      headBranch: resource.refUpdates?.[0]?.name?.replace('refs/heads/', '') || ''
    };
  }

  /**
   * Parse build completion events
   */
  private parseBuildEvent(payload: any, eventType: string): AzureParsedEvent {
    const build = payload.resource;
    const project = payload.project;

    return {
      provider: 'azure',
      event: eventType,
      action: 'build_complete',
      repository: {
        id: build.repository?.id || '',
        name: build.repository?.name || '',
        fullName: `${project?.name || 'unknown'}/${build.repository?.name || 'unknown'}`,
        project: project?.name || '',
        url: build.repository?.webUrl || ''
      },
      baseBranch: '',
      headBranch: ''
    };
  }

  /**
   * Parse generic events
   */
  private parseGenericEvent(payload: any, eventType: string): AzureParsedEvent {
    return {
      provider: 'azure',
      event: eventType,
      action: 'unknown',
      repository: {
        id: payload.resource?.repository?.id || '',
        name: payload.resource?.repository?.name || 'unknown',
        fullName: 'unknown/unknown',
        project: payload.resource?.repository?.project?.name || 'unknown',
        url: payload.resource?.repository?.webUrl || ''
      },
      baseBranch: '',
      headBranch: ''
    };
  }

  /**
   * Extract pull request diff from Azure DevOps
   */
  async getPullRequestDiff(
    accessToken: string,
    organization: string,
    project: string,
    repository: string,
    pullRequestId: number
  ): Promise<string> {
    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pullRequests/${pullRequestId}/diffs/commits?api-version=7.0`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get PR diff: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get file content from Azure DevOps repository
   */
  async getFileContent(
    accessToken: string,
    organization: string,
    project: string,
    repository: string,
    path: string,
    ref: string = 'main'
  ): Promise<{ content: string; encoding: string }> {
    const encodedPath = encodeURIComponent(path);
    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?path=${encodedPath}&versionDescriptor.version=${ref}&api-version=7.0`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get file content: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: Buffer.from(data.content || '', data.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8'),
      encoding: data.encoding || 'utf-8'
    };
  }

  /**
   * Post a comment to an Azure DevOps pull request
   */
  async postComment(
    accessToken: string,
    organization: string,
    project: string,
    repository: string,
    pullRequestId: number,
    comment: string,
    threadId?: number
  ): Promise<any> {
    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pullRequests/${pullRequestId}/threads?api-version=7.0`;

    const body = {
      comments: [
        {
          content: comment,
          commentType: 1
        }
      ],
      status: 1
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to post comment: ${response.statusText}`);
    }

    return response.json();
  }
}

export default AzureEventParser;
