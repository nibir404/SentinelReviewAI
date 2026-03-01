import { logger } from '../../common/utils/logger';
import { CodeAnalyzer, CodeAnalysis, DiffFile, ReviewRequest, ReviewResult, ReviewSummary, Recommendation } from './codeAnalyzer';
import { v4 as uuidv4 } from 'uuid';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

export class AIReviewEngine {
  private codeAnalyzer: CodeAnalyzer;
  private aiConfig: AIConfig;

  constructor(aiConfig?: AIConfig) {
    this.codeAnalyzer = new CodeAnalyzer();
    this.aiConfig = aiConfig || {
      provider: 'openai',
      model: 'gpt-4'
    };
  }

  /**
   * Perform complete code review on a pull request
   */
  async reviewPullRequest(request: ReviewRequest): Promise<ReviewResult> {
    const startTime = Date.now();
    logger.info(`Starting review for PR #${request.pullRequestId} in ${request.repository}`);

    const files: CodeAnalysis[] = [];
    
    // Analyze each file in the diff
    for (const file of request.files) {
      try {
        // Get file content if it's a modification or addition
        if (file.status === 'added' || file.status === 'modified') {
          // For now, we'll analyze the patch content if available
          // In production, you'd fetch the actual file content
          const analysis = await this.codeAnalyzer.analyzeFile(
            file.filename,
            file.patch || '',
            file.patch
          );
          files.push(analysis);
        }
      } catch (error) {
        logger.error(`Error analyzing file ${file.filename}:`, error);
      }
    }

    // Generate AI-powered insights
    const aiInsights = await this.generateAIInsights(request, files);

    // Calculate summary
    const summary = this.calculateSummary(files);

    // Generate recommendations
    const recommendations = this.generateRecommendations(files, aiInsights);

    const duration = Date.now() - startTime;

    return {
      id: uuidv4(),
      pullRequestId: request.pullRequestId,
      repository: request.repository,
      provider: request.provider,
      timestamp: new Date(),
      duration,
      files,
      summary,
      recommendations
    };
  }

  /**
   * Generate AI-powered insights using LLM
   */
  private async generateAIInsights(request: ReviewRequest, files: CodeAnalysis[]): Promise<any> {
    try {
      // Build prompt for AI analysis
      const prompt = this.buildReviewPrompt(request, files);

      // Call AI API based on configuration
      switch (this.aiConfig.provider) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'anthropic':
          return await this.callAnthropic(prompt);
        default:
          return { insights: [], summary: 'AI analysis not configured' };
      }
    } catch (error) {
      logger.error('Error generating AI insights:', error);
      return { insights: [], summary: 'AI analysis failed' };
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<any> {
    if (!this.aiConfig.apiKey) {
      return { insights: [], summary: 'OpenAI API key not configured' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.aiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.aiConfig.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Analyze pull requests and provide constructive feedback on code quality, security, performance, and best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      insights: [],
      summary: data.choices?.[0]?.message?.content || ''
    };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<any> {
    if (!this.aiConfig.apiKey) {
      return { insights: [], summary: 'Anthropic API key not configured' };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.aiConfig.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.aiConfig.model || 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      insights: [],
      summary: data.content?.[0]?.text || ''
    };
  }

  /**
   * Build review prompt for AI
   */
  private buildReviewPrompt(request: ReviewRequest, files: CodeAnalysis[]): string {
    const fileList = files.map(f => 
      `File: ${f.file} (${f.language})\nIssues: ${f.issues.length}\n${f.issues.map(i => `- ${i.severity}: ${i.message}`).join('\n')}`
    ).join('\n\n');

    return `
Please review this pull request:

Repository: ${request.repository}
PR #${request.pullRequestId}
Title: ${request.title}
Author: ${request.author}
Base Branch: ${request.baseBranch}
Head Branch: ${request.headBranch}

Description:
${request.description || 'No description provided'}

Files Changed:
${fileList}

Please provide:
1. Overall assessment of the code quality
2. Security concerns
3. Performance recommendations
4. Code style and best practices suggestions
5. Any critical issues that should block the merge

Format your response as a detailed code review.
`;
  }

  /**
   * Calculate review summary
   */
  private calculateSummary(files: CodeAnalysis[]): ReviewSummary {
    let totalIssues = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;
    let securityIssues = 0;
    let performanceIssues = 0;
    let linesReviewed = 0;

    for (const file of files) {
      totalIssues += file.issues.length;
      linesReviewed += file.metrics.linesOfCode;

      for (const issue of file.issues) {
        switch (issue.severity) {
          case 'critical':
            criticalIssues++;
            break;
          case 'high':
            highIssues++;
            break;
          case 'medium':
            mediumIssues++;
            break;
          case 'low':
            lowIssues++;
            break;
        }

        if (issue.type === 'security') securityIssues++;
        if (issue.type === 'performance') performanceIssues++;
      }
    }

    // Calculate score (0-100)
    const score = Math.max(0, 100 - (criticalIssues * 10) - (highIssues * 5) - (mediumIssues * 2) - (lowIssues * 1));

    // Calculate grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      totalFiles: files.length,
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      securityIssues,
      performanceIssues,
      linesReviewed,
      score,
      grade
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(files: CodeAnalysis[], aiInsights: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Group issues by category
    const securityIssues: CodeIssue[] = [];
    const performanceIssues: CodeIssue[] = [];
    const codeQualityIssues: CodeIssue[] = [];
    const bestPracticeIssues: CodeIssue[] = [];
    const documentationIssues: CodeIssue[] = [];

    for (const file of files) {
      for (const issue of file.issues) {
        switch (issue.type) {
          case 'security':
            securityIssues.push(issue);
            break;
          case 'performance':
            performanceIssues.push(issue);
            break;
          case 'error':
          case 'warning':
            codeQualityIssues.push(issue);
            break;
          case 'best-practice':
            bestPracticeIssues.push(issue);
            break;
          case 'info':
            documentationIssues.push(issue);
            break;
        }
      }
    }

    // Generate recommendations from issues
    if (securityIssues.length > 0) {
      recommendations.push({
        category: 'security',
        priority: 'critical',
        title: 'Address Security Issues',
        description: `Found ${securityIssues.length} security issue(s) that need immediate attention.`,
        files: [...new Set(securityIssues.map(i => files.find(f => f.issues.includes(i))?.file || ''))],
        lines: securityIssues.map(i => i.line),
        autoFixable: false
      });
    }

    if (performanceIssues.length > 0) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Optimize Performance',
        description: `Found ${performanceIssues.length} performance issue(s) that could impact application performance.`,
        files: [...new Set(performanceIssues.map(i => files.find(f => f.issues.includes(i))?.file || ''))],
        lines: performanceIssues.map(i => i.line),
        autoFixable: false
      });
    }

    if (codeQualityIssues.length > 0) {
      recommendations.push({
        category: 'code-quality',
        priority: 'medium',
        title: 'Improve Code Quality',
        description: `Found ${codeQualityIssues.length} code quality issue(s) that should be addressed.`,
        files: [...new Set(codeQualityIssues.map(i => files.find(f => f.issues.includes(i))?.file || ''))],
        lines: codeQualityIssues.map(i => i.line),
        autoFixable: false
      });
    }

    if (bestPracticeIssues.length > 0) {
      recommendations.push({
        category: 'best-practices',
        priority: 'medium',
        title: 'Follow Best Practices',
        description: `Found ${bestPracticeIssues.length} best practice violation(s).`,
        files: [...new Set(bestPracticeIssues.map(i => files.find(f => f.issues.includes(i))?.file || ''))],
        lines: bestPracticeIssues.map(i => i.line),
        autoFixable: true
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  /**
   * Generate a review summary comment for the PR
   */
  async generateReviewComment(result: ReviewResult): Promise<string> {
    const { summary, recommendations } = result;

    let comment = `# 📊 Code Review Summary\n\n`;
    comment += `## Overall Grade: **${summary.grade}** (Score: ${summary.score}/100)\n\n`;
    comment += `| Metric | Count |\n`;
    comment += `|--------|-------|\n`;
    comment += `| Files Reviewed | ${summary.totalFiles} |\n`;
    comment += `| Lines of Code | ${summary.linesReviewed} |\n`;
    comment += `| Total Issues | ${summary.totalIssues} |\n`;
    comment += `| 🔴 Critical | ${summary.criticalIssues} |\n`;
    comment += `| 🟠 High | ${summary.highIssues} |\n`;
    comment += `| 🟡 Medium | ${summary.mediumIssues} |\n`;
    comment += `| 🟢 Low | ${summary.lowIssues} |\n`;
    comment += `| 🔒 Security | ${summary.securityIssues} |\n`;
    comment += `| ⚡ Performance | ${summary.performanceIssues} |\n\n`;

    if (recommendations.length > 0) {
      comment += `## 🚨 Priority Recommendations\n\n`;
      for (const rec of recommendations.slice(0, 5)) {
        const emoji = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟠' : rec.priority === 'medium' ? '🟡' : '🟢';
        comment += `${emoji} **${rec.title}**\n`;
        comment += `> ${rec.description}\n\n`;
      }
    }

    comment += `---\n`;
    comment += `*Reviewed by SentinelReviewAI* 🤖\n`;

    return comment;
  }
}
