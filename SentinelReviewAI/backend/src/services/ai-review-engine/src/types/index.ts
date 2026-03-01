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
  url: string;
}

export interface ReviewContext {
  repository: Repository;
  pullRequest?: PullRequest;
  baseBranch?: string;
  headBranch?: string;
}

export interface ReviewRequest {
  reviewId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  repository: Repository;
  pullRequest?: PullRequest;
  diff?: string;
  baseBranch?: string;
  headBranch?: string;
}

export interface CodeReview {
  id: string;
  reviewId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: string;
  repository: Repository;
  pullRequest?: PullRequest;
  baseBranch?: string;
  headBranch?: string;
  issues: ReviewIssue[];
  summary: string;
  score: number;
  createdAt: string;
  completedAt?: string;
}

export interface ReviewIssue {
  type: 'critical' | 'major' | 'minor' | 'suggestion';
  category: 'security' | 'performance' | 'style' | 'bug' | 'best-practice' | 'documentation';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
  severity: number;
}

export interface ReviewResult {
  summary: string;
  issues: ReviewIssue[];
  score: number;
  recommendations: string[];
}

export interface ReviewOptions {
  language?: string;
  context?: ReviewContext;
}
