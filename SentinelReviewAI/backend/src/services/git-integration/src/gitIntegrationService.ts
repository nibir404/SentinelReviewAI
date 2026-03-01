import { logger } from '../../common/utils/logger';
import { GitHubEventParser, ParsedEvent } from './githubParser';
import { GitLabEventParser } from './gitlabParser';
import { BitbucketEventParser } from './bitbucketParser';

export interface GitProvider {
  type: 'github' | 'gitlab' | 'bitbucket';
  accessToken: string;
  webhookSecret?: string;
}

export interface DiffResult {
  files: Array<{
    filename: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
    patch?: string;
    oldFilename?: string;
  }>;
  totalAdditions: number;
  totalDeletions: number;
  totalFiles: number;
}

export interface FileContent {
  filename: string;
  content: string;
  language: string;
  size: number;
}

export class GitIntegrationService {
  private githubParser: GitHubEventParser;
  private gitlabParser: GitLabEventParser;
  private bitbucketParser: BitbucketEventParser;

  constructor() {
    this.githubParser = new GitHubEventParser();
    this.gitlabParser = new GitLabEventParser();
    this.bitbucketParser = new BitbucketEventParser();
  }

  /**
   * Parse webhook event from any provider
   */
  async parseWebhookEvent(
    provider: string,
    payload: any,
    event: string
  ): Promise<ParsedEvent> {
    logger.info(`Parsing webhook event from ${provider}: ${event}`);

    switch (provider.toLowerCase()) {
      case 'github':
        return this.githubParser.parse(payload, event);
      case 'gitlab':
        return this.gitlabParser.parse(payload, event);
      case 'bitbucket':
        return this.bitbucketParser.parse(payload, event);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get pull request diff
   */
  async getPullRequestDiff(
    provider: GitProvider,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<DiffResult> {
    logger.info(`Getting PR diff: ${owner}/${repo}#${pullNumber}`);

    switch (provider.type) {
      case 'github':
        return this.getGitHubDiff(provider.accessToken, owner, repo, pullNumber);
      case 'gitlab':
        return this.getGitLabDiff(provider.accessToken, owner, repo, pullNumber);
      case 'bitbucket':
        return this.getBitbucketDiff(provider.accessToken, owner, repo, pullNumber);
      default:
        throw new Error(`Unsupported provider: ${provider.type}`);
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    provider: GitProvider,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<FileContent> {
    logger.info(`Getting file content: ${owner}/${repo}/${path}`);

    switch (provider.type) {
      case 'github':
        return this.getGitHubFileContent(provider.accessToken, owner, repo, path, ref);
      case 'gitlab':
        return this.getGitLabFileContent(provider.accessToken, owner, repo, path, ref);
      case 'bitbucket':
        return this.getBitbucketFileContent(provider.accessToken, owner, repo, path, ref);
      default:
        throw new Error(`Unsupported provider: ${provider.type}`);
    }
  }

  /**
   * Get list of open pull requests
   */
  async getPullRequests(
    provider: GitProvider,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<any[]> {
    logger.info(`Getting PRs: ${owner}/${repo} (state: ${state})`);

    switch (provider.type) {
      case 'github':
        return this.getGitHubPullRequests(provider.accessToken, owner, repo, state);
      case 'gitlab':
        return this.getGitLabMergeRequests(provider.accessToken, owner, repo, state);
      case 'bitbucket':
        return this.getBitbucketPullRequests(provider.accessToken, owner, repo, state);
      default:
        throw new Error(`Unsupported provider: ${provider.type}`);
    }
  }

  /**
   * Post comment to pull request
   */
  async postComment(
    provider: GitProvider,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
    commitId?: string,
    path?: string,
    line?: number
  ): Promise<any> {
    logger.info(`Posting comment to PR: ${owner}/${repo}#${pullNumber}`);

    switch (provider.type) {
      case 'github':
        return this.postGitHubComment(
          provider.accessToken,
          owner,
          repo,
          pullNumber,
          body,
          commitId,
          path,
          line
        );
      case 'gitlab':
        return this.postGitLabNote(
          provider.accessToken,
          owner,
          repo,
          pullNumber,
          body,
          path,
          line
        );
      case 'bitbucket':
        return this.postBitbucketComment(
          provider.accessToken,
          owner,
          repo,
          pullNumber,
          body,
          path,
          line
        );
      default:
        throw new Error(`Unsupported provider: ${provider.type}`);
    }
  }

  /**
   * Create check run (GitHub)
   */
  async createCheckRun(
    provider: GitProvider,
    owner: string,
    repo: string,
    name: string,
    status: 'queued' | 'in_progress' | 'completed',
    conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out',
    output?: any
  ): Promise<any> {
    if (provider.type !== 'github') {
      throw new Error('Check runs are only supported on GitHub');
    }

    return this.createGitHubCheckRun(
      provider.accessToken,
      owner,
      repo,
      name,
      status,
      conclusion,
      output
    );
  }

  // ==================== GitHub Implementation ====================

  private async getGitHubDiff(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<DiffResult> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const files = await response.json();

    return {
      files: files.map((file: any) => ({
        filename: file.filename,
        status: file.status as any,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
        oldFilename: file.previous_filename
      })),
      totalAdditions: files.reduce((sum: number, f: any) => sum + f.additions, 0),
      totalDeletions: files.reduce((sum: number, f: any) => sum + f.deletions, 0),
      totalFiles: files.length
    };
  }

  private async getGitHubFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<FileContent> {
    const url = ref
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
      : `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return {
      filename: path,
      content,
      language: this.detectLanguage(path),
      size: data.size
    };
  }

  private async getGitHubPullRequests(
    token: string,
    owner: string,
    repo: string,
    state: string
  ): Promise<any[]> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async postGitHubComment(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
    commitId?: string,
    path?: string,
    line?: number
  ): Promise<any> {
    let url = `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`;
    let payload: any = { body };

    if (path && line) {
      url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/comments`;
      payload = {
        body,
        commit_id: commitId,
        path,
        line
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async createGitHubCheckRun(
    token: string,
    owner: string,
    repo: string,
    name: string,
    status: string,
    conclusion?: string,
    output?: any
  ): Promise<any> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/check-runs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          status,
          conclusion,
          output
        })
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== GitLab Implementation ====================

  private async getGitLabDiff(
    token: string,
    owner: string,
    repo: string,
    mrIid: number
  ): Promise<DiffResult> {
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}/merge_requests/${mrIid}/changes`,
      {
        headers: {
          'PRIVATE-TOKEN': token
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    const data = await response.json();
    const files = data.changes || [];

    return {
      files: files.map((file: any) => ({
        filename: file.new_path || file.old_path,
        status: file.new_file ? 'added' : file.deleted_file ? 'deleted' : file.renamed_file ? 'renamed' : 'modified',
        additions: file.diff ? file.diff.split('\n').filter((l: string) => l.startsWith('+')).length : 0,
        deletions: file.diff ? file.diff.split('\n').filter((l: string) => l.startsWith('-')).length : 0,
        patch: file.diff
      })),
      totalAdditions: 0,
      totalDeletions: 0,
      totalFiles: files.length
    };
  }

  private async getGitLabFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<FileContent> {
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}/repository/files/${encodeURIComponent(path)}?ref=${ref || 'main'}`,
      {
        headers: {
          'PRIVATE-TOKEN': token
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return {
      filename: path,
      content,
      language: this.detectLanguage(path),
      size: data.size
    };
  }

  private async getGitLabMergeRequests(
    token: string,
    owner: string,
    repo: string,
    state: string
  ): Promise<any[]> {
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}/merge_requests?state=${state}`,
      {
        headers: {
          'PRIVATE-TOKEN': token
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async postGitLabNote(
    token: string,
    owner: string,
    repo: string,
    mrIid: number,
    body: string,
    path?: string,
    line?: number
  ): Promise<any> {
    const projectId = encodeURIComponent(owner + '/' + repo);
    let url = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests/${mrIid}/notes`;
    let payload: any = { body };

    if (path && line) {
      // Use discussions API for line comments
      url = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests/${mrIid}/discussions`;
      payload = {
        body,
        position: {
          position_type: 'text',
          line,
          path,
          noteable_type: 'MergeRequest'
        }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== Bitbucket Implementation ====================

  private async getBitbucketDiff(
    token: string,
    owner: string,
    repo: string,
    pullId: number
  ): Promise<DiffResult> {
    const response = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/pullrequests/${pullId}/diff`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Bitbucket API error: ${response.statusText}`);
    }

    const diff = await response.text();
    // Parse unified diff format
    const files = this.parseUnifiedDiff(diff);

    return {
      files,
      totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
      totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
      totalFiles: files.length
    };
  }

  private async getBitbucketFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<FileContent> {
    const response = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/src/${ref || 'main'}/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Bitbucket API error: ${response.statusText}`);
    }

    const content = await response.text();

    return {
      filename: path,
      content,
      language: this.detectLanguage(path),
      size: content.length
    };
  }

  private async getBitbucketPullRequests(
    token: string,
    owner: string,
    repo: string,
    state: string
  ): Promise<any[]> {
    const response = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/pullrequests?state=${state}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Bitbucket API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
  }

  private async postBitbucketComment(
    token: string,
    owner: string,
    repo: string,
    pullId: number,
    body: string,
    path?: string,
    line?: number
  ): Promise<any> {
    let url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/pullrequests/${pullId}/comments`;
    let payload: any = { content: { raw: body } };

    if (path && line) {
      payload.inline = { path, line };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Bitbucket API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== Helpers ====================

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash',
      zsh: 'bash',
      dockerfile: 'dockerfile'
    };

    return langMap[ext] || 'text';
  }

  private parseUnifiedDiff(diff: string): Array<any> {
    const files: Array<any> = [];
    const lines = diff.split('\n');
    let currentFile: any = null;

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        if (currentFile) files.push(currentFile);
        const match = line.match(/diff --git a\/(.+) b\/(.+)/);
        currentFile = {
          filename: match ? match[2] : '',
          status: 'modified',
          additions: 0,
          deletions: 0,
          patch: ''
        };
      } else if (line.startsWith('new file')) {
        if (currentFile) currentFile.status = 'added';
      } else if (line.startsWith('deleted file')) {
        if (currentFile) currentFile.status = 'deleted';
      } else if (line.startsWith('rename from')) {
        if (currentFile) currentFile.status = 'renamed';
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        if (currentFile) currentFile.additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        if (currentFile) currentFile.deletions++;
      }

      if (currentFile && line.startsWith('+') || line.startsWith('-')) {
        currentFile.patch += line + '\n';
      }
    }

    if (currentFile) files.push(currentFile);
    return files;
  }
}
