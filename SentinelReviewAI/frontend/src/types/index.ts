export interface Review {
  id: string;
  organizationId: string;
  repositoryId: string;
  pullRequestId: string;
  provider: 'GITHUB' | 'GITLAB' | 'AZURE' | 'BITBUCKET';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary?: string;
  findings?: ReviewFinding[];
  score?: number;
  baseBranch: string;
  headBranch: string;
  diffUrl?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFinding {
  type: 'issue' | 'suggestion' | 'praise';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  file?: string;
  line?: number;
  code?: string;
  suggestion?: string;
}

export interface Repository {
  id: string;
  organizationId: string;
  provider: 'GITHUB' | 'GITLAB' | 'AZURE' | 'BITBUCKET';
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
}

export interface PullRequest {
  id: string;
  repositoryId: string;
  provider: string;
  number: number;
  title: string;
  description?: string;
  author: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  baseBranch: string;
  headBranch: string;
}

export interface Analytics {
  totalReviews: number;
  completedReviews: number;
  failedReviews: number;
  averageScore: number;
  issuesBySeverity: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  reviewsByDay: {
    date: string;
    count: number;
  }[];
  topRepositories: {
    name: string;
    reviewCount: number;
  }[];
}

export interface Webhook {
  id: string;
  organizationId: string;
  provider: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface Policy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  rules: Record<string, unknown>;
  enforcement: 'MANDATORY' | 'ADVISORY' | 'OPTIONAL';
  enabled: boolean;
}
