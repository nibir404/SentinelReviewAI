export interface Repository {
  id: number;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  private: boolean;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  author: string;
  state: string;
  merged: boolean;
  url: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  additions: number;
  deletions: number;
}

export interface ParsedEvent {
  provider: 'github' | 'gitlab' | 'bitbucket';
  action: string;
  repository: Repository;
  pullRequest?: PullRequest;
  baseBranch?: string;
  headBranch?: string;
  commits?: Commit[];
  sender: string;
}

export interface QueuedEvent {
  type: string;
  payload: ParsedEvent;
  timestamp: string;
}
