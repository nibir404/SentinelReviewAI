import { logger } from '../utils/logger';
import { ReviewResult, ReviewOptions, ReviewIssue } from '../types';

export class CodeReviewer {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  async reviewCode(diff: string | undefined, options: ReviewOptions): Promise<ReviewResult> {
    logger.info('Starting code review');

    try {
      // If no diff provided, return a placeholder result
      if (!diff || diff.trim() === '') {
        return this.getEmptyReviewResult();
      }

      // Analyze the diff using AI
      const analysis = await this.analyzeWithAI(diff, options);

      // Parse the analysis into structured issues
      const issues = this.parseIssues(analysis);

      // Calculate score based on issues
      const score = this.calculateScore(issues);

      // Generate summary
      const summary = this.generateSummary(issues);

      return {
        summary,
        issues,
        score,
        recommendations: this.generateRecommendations(issues)
      };
    } catch (error) {
      logger.error('Error during code review:', error);
      return this.getErrorReviewResult();
    }
  }

  private async analyzeWithAI(diff: string, options: ReviewOptions): Promise<string> {
    // If OpenAI API key is available, use it
    if (this.openaiApiKey) {
      try {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: this.openaiApiKey });

        const context = options.context ? `
Repository: ${options.context.repository.fullName}
PR: ${options.context.pullRequest?.title || 'N/A'}
Base: ${options.context.baseBranch} -> Head: ${options.context.headBranch}
` : '';

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert code reviewer. Analyze the following diff and identify:
1. Security vulnerabilities
2. Performance issues
3. Bugs or potential bugs
4. Code style issues
5. Best practice violations
6. Documentation issues

For each issue, provide:
- Type: critical, major, minor, or suggestion
- Category: security, performance, bug, style, best-practice, or documentation
- Message: description of the issue
- File: the file path (if applicable)
- Line: approximate line number (if applicable)
- Suggestion: how to fix the issue (if applicable)

Return your analysis in a structured format.`
            },
            {
              role: 'user',
              content: `${context}\n\nDiff to review:\n${diff}`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        });

        return response.choices[0]?.message?.content || '';
      } catch (error) {
        logger.warn('OpenAI API call failed, using fallback analysis:', error);
      }
    }

    // Fallback: Use rule-based analysis
    return this.fallbackAnalysis(diff);
  }

  private fallbackAnalysis(diff: string): string {
    const issues: string[] = [];

    // Check for common security issues
    if (diff.includes('eval(') || diff.includes('exec(')) {
      issues.push('SECURITY: Avoid using eval() or exec() - potential code injection');
    }

    if (diff.includes('password') || diff.includes('secret') || diff.includes('api_key')) {
      if (!diff.includes('process.env') && !diff.includes('encrypted')) {
        issues.push('SECURITY: Potential hardcoded secret detected');
      }
    }

    // Check for console.log in production code
    if (diff.includes('console.log') && !diff.includes('// debug')) {
      issues.push('STYLE: console.log statement found - consider using proper logging');
    }

    // Check for TODO comments
    if (diff.includes('TODO') || diff.includes('FIXME')) {
      issues.push('DOCUMENTATION: TODO/FIXME comment found');
    }

    // Check for empty catch blocks
    if (diff.includes('catch') && diff.match(/catch[^}]*{[\s]*}/)) {
      issues.push('BUG: Empty catch block - errors are being swallowed');
    }

    // Check for async/await without try/catch
    if (diff.includes('await ') && !diff.includes('try {') && diff.includes('function')) {
      issues.push('BEST-PRACTICE: async function should have error handling');
    }

    return issues.join('\n');
  }

  private parseIssues(analysis: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];

    // Simple parsing - in production, use more robust parsing
    const lines = analysis.split('\n');
    
    for (const line of lines) {
      const issue = this.parseLineToIssue(line);
      if (issue) {
        issues.push(issue);
      }
    }

    // If no issues parsed from AI, use fallback analysis
    if (issues.length === 0 && analysis.includes(':')) {
      const fallbackIssues = this.parseFallbackIssues(analysis);
      issues.push(...fallbackIssues);
    }

    return issues;
  }

  private parseLineToIssue(line: string): ReviewIssue | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) return null;

    // Check for issue markers
    const categoryMatch = trimmed.match(/^(SECURITY|PERFORMANCE|BUG|STYLE|BEST-PRACTICE|DOCUMENTATION):/i);
    const typeMatch = trimmed.match(/^(critical|major|minor|suggestion)/i);

    if (categoryMatch || typeMatch) {
      const category = categoryMatch 
        ? categoryMatch[1].toLowerCase() as ReviewIssue['category']
        : 'best-practice';
      
      const type = typeMatch
        ? typeMatch[1].toLowerCase() as ReviewIssue['type']
        : 'minor';

      return {
        type: this.mapType(type),
        category: this.mapCategory(category),
        message: trimmed.replace(/^(SECURITY|PERFORMANCE|BUG|STYLE|BEST-PRACTICE|DOCUMENTATION|critical|major|minor|suggestion):\s*/i, ''),
        severity: this.mapTypeToSeverity(type)
      };
    }

    return null;
  }

  private parseFallbackIssues(analysis: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = analysis.split('\n').filter(l => l.trim());

    for (const line of lines) {
      if (line.includes(':')) {
        const [category, ...messageParts] = line.split(':');
        const message = messageParts.join(':').trim();
        
        if (message) {
          issues.push({
            type: 'minor',
            category: this.mapCategory(category.toLowerCase()),
            message,
            severity: 3
          });
        }
      }
    }

    return issues;
  }

  private mapType(type: string): ReviewIssue['type'] {
    switch (type) {
      case 'critical': return 'critical';
      case 'major': return 'major';
      case 'suggestion': return 'suggestion';
      default: return 'minor';
    }
  }

  private mapCategory(category: string): ReviewIssue['category'] {
    switch (category) {
      case 'security': return 'security';
      case 'performance': return 'performance';
      case 'bug': return 'bug';
      case 'style': return 'style';
      case 'documentation': return 'documentation';
      default: return 'best-practice';
    }
  }

  private mapTypeToSeverity(type: string): number {
    switch (type) {
      case 'critical': return 1;
      case 'major': return 2;
      case 'suggestion': return 4;
      default: return 3;
    }
  }

  private calculateScore(issues: ReviewIssue[]): number {
    if (issues.length === 0) return 100;

    let deductions = 0;
    for (const issue of issues) {
      deductions += issue.severity * 5;
    }

    return Math.max(0, 100 - deductions);
  }

  private generateSummary(issues: ReviewIssue[]): string {
    if (issues.length === 0) {
      return 'No issues found. Code looks good!';
    }

    const critical = issues.filter(i => i.type === 'critical').length;
    const major = issues.filter(i => i.type === 'major').length;
    const minor = issues.filter(i => i.type === 'minor').length;
    const suggestions = issues.filter(i => i.type === 'suggestion').length;

    let summary = `Found ${issues.length} issue${issues.length > 1 ? 's' : ''}: `;
    const parts: string[] = [];
    
    if (critical > 0) parts.push(`${critical} critical`);
    if (major > 0) parts.push(`${major} major`);
    if (minor > 0) parts.push(`${minor} minor`);
    if (suggestions > 0) parts.push(`${suggestions} suggestions`);

    return summary + parts.join(', ') + '.';
  }

  private generateRecommendations(issues: ReviewIssue[]): string[] {
    const recommendations: string[] = [];

    const securityIssues = issues.filter(i => i.category === 'security');
    if (securityIssues.length > 0) {
      recommendations.push('Address security issues before merging');
    }

    const bugIssues = issues.filter(i => i.category === 'bug');
    if (bugIssues.length > 0) {
      recommendations.push('Fix identified bugs to prevent potential issues');
    }

    const performanceIssues = issues.filter(i => i.category === 'performance');
    if (performanceIssues.length > 0) {
      recommendations.push('Consider performance optimizations');
    }

    if (recommendations.length === 0) {
      recommendations.push('Code is ready for review');
    }

    return recommendations;
  }

  private getEmptyReviewResult(): ReviewResult {
    return {
      summary: 'No code changes to review',
      issues: [],
      score: 100,
      recommendations: ['No changes detected']
    };
  }

  private getErrorReviewResult(): ReviewResult {
    return {
      summary: 'Error during code review',
      issues: [{
        type: 'major',
        category: 'best-practice',
        message: 'Failed to complete code review',
        severity: 2
      }],
      score: 0,
      recommendations: ['Please retry the review']
    };
  }
}
