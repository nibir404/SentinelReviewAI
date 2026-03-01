import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface DiffFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

interface CodeIssue {
  id: string;
  type: 'error' | 'warning' | 'info' | 'security' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line: number;
  rule?: string;
}

interface FileAnalysis {
  file: string;
  language: string;
  issues: CodeIssue[];
  metrics: {
    linesOfCode: number;
    complexity: number;
  };
}

interface ReviewResult {
  id: string;
  pullRequestId: number;
  repository: string;
  timestamp: Date;
  summary: {
    totalFiles: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    securityIssues: number;
    performanceIssues: number;
    score: number;
    grade: string;
  };
  files: FileAnalysis[];
}

interface PullRequest {
  id: number;
  title: string;
  author: string;
  repository: string;
  branch: string;
  status: 'open' | 'merged' | 'closed';
  createdAt: string;
  description?: string;
}

export const PRReview: React.FC = () => {
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Mock data
  const pullRequests: PullRequest[] = [
    { id: 142, title: 'Add user authentication', author: 'johndoe', repository: 'frontend', branch: 'feature/auth', status: 'open', createdAt: '2024-06-15T10:30:00Z', description: 'Implements OAuth2 authentication flow' },
    { id: 141, title: 'Fix memory leak in dashboard', author: 'janesmith', repository: 'frontend', branch: 'fix/memory-leak', status: 'open', createdAt: '2024-06-15T09:15:00Z' },
    { id: 140, title: 'Update API endpoints', author: 'bobwilson', repository: 'backend', branch: 'refactor/api', status: 'merged', createdAt: '2024-06-14T16:45:00Z' },
    { id: 139, title: 'Add database migrations', author: 'alicebrown', repository: 'backend', branch: 'feature/migrations', status: 'open', createdAt: '2024-06-14T14:20:00Z' },
    { id: 138, title: 'Optimize image loading', author: 'charlieday', repository: 'mobile', branch: 'perf/images', status: 'closed', createdAt: '2024-06-13T11:00:00Z' }
  ];

  const mockReviewResult: ReviewResult = {
    id: 'rev-001',
    pullRequestId: 142,
    repository: 'frontend',
    timestamp: new Date(),
    summary: {
      totalFiles: 5,
      totalIssues: 12,
      criticalIssues: 2,
      highIssues: 3,
      mediumIssues: 5,
      lowIssues: 2,
      securityIssues: 3,
      performanceIssues: 2,
      score: 78,
      grade: 'C'
    },
    files: [
      {
        file: 'src/auth/Login.tsx',
        language: 'typescript',
        issues: [
          { id: '1', type: 'security', severity: 'critical', message: 'Potential XSS vulnerability in user input', line: 45, rule: 'security/xss' },
          { id: '2', type: 'warning', severity: 'high', message: 'Missing error handling for API calls', line: 78, rule: 'error-handling' },
          { id: '3', type: 'info', severity: 'low', message: 'Consider using useCallback for performance', line: 23, rule: 'react/hooks' }
        ],
        metrics: { linesOfCode: 156, complexity: 8 }
      },
      {
        file: 'src/auth/AuthContext.tsx',
        language: 'typescript',
        issues: [
          { id: '4', type: 'security', severity: 'high', message: 'Sensitive data exposed in console', line: 34, rule: 'security/no-secrets' },
          { id: '5', type: 'warning', severity: 'medium', message: 'Missing dependency in useEffect', line: 67, rule: 'react/exhaustive-deps' }
        ],
        metrics: { linesOfCode: 89, complexity: 5 }
      },
      {
        file: 'src/utils/api.ts',
        language: 'typescript',
        issues: [
          { id: '6', type: 'performance', severity: 'high', message: 'Unnecessary re-renders detected', line: 112, rule: 'performance/re-renders' },
          { id: '7', type: 'error', severity: 'critical', message: 'Unhandled promise rejection', line: 89, rule: 'no-unhandled-rejections' }
        ],
        metrics: { linesOfCode: 234, complexity: 12 }
      }
    ]
  };

  const handleReviewPR = async (pr: PullRequest) => {
    setSelectedPR(pr);
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setReviewResult(mockReviewResult);
      setLoading(false);
    }, 1500);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return '🔒';
      case 'performance': return '⚡';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const filteredFiles = reviewResult?.files.filter(file => {
    if (filter === 'all') return true;
    return file.issues.some(issue => issue.severity === filter);
  }) || [];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Pull Request Review</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PR List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Open Pull Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pullRequests.filter(pr => pr.status === 'open').map(pr => (
                <div
                  key={pr.id}
                  onClick={() => handleReviewPR(pr)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedPR?.id === pr.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">#{pr.id}</span>
                    <Badge variant="primary">{pr.repository}</Badge>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{pr.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{pr.author}</span>
                    <span>•</span>
                    <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Review Results */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedPR ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Select a pull request to view its review
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Analyzing code...</p>
              </CardContent>
            </Card>
          ) : reviewResult ? (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Review Summary - PR #{reviewResult.pullRequestId}</CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{reviewResult.summary.grade}</div>
                        <div className="text-sm text-gray-500">Grade</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold">{reviewResult.summary.score}</div>
                        <div className="text-sm text-gray-500">Score</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{reviewResult.summary.criticalIssues}</div>
                      <div className="text-sm text-red-600">Critical</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{reviewResult.summary.highIssues}</div>
                      <div className="text-sm text-orange-600">High</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{reviewResult.summary.mediumIssues}</div>
                      <div className="text-sm text-yellow-600">Medium</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{reviewResult.summary.lowIssues}</div>
                      <div className="text-sm text-green-600">Low</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filter */}
              <div className="flex gap-2">
                {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                  <Button
                    key={f}
                    variant={filter === f ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>

              {/* File Analysis */}
              <div className="space-y-4">
                {filteredFiles.map(file => (
                  <Card key={file.file}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{file.file}</CardTitle>
                        <div className="flex items-center gap-4">
                          <Badge>{file.language}</Badge>
                          <span className="text-sm text-gray-500">
                            {file.issues.length} issues
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {file.issues.map(issue => (
                          <div
                            key={issue.id}
                            className={`p-3 rounded-lg border-l-4 ${
                              issue.severity === 'critical' ? 'border-red-500 bg-red-50' :
                              issue.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                              issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                              'border-green-500 bg-green-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">{getIssueTypeIcon(issue.type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 text-xs rounded text-white ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                  </span>
                                  <span className="text-sm text-gray-500">Line {issue.line}</span>
                                  {issue.rule && <Badge variant="outline" size="sm">{issue.rule}</Badge>}
                                </div>
                                <p className="text-gray-900">{issue.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="primary">Approve PR</Button>
                <Button variant="danger">Request Changes</Button>
                <Button variant="outline">Add Comment</Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PRReview;
