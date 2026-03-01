import { logger } from '../../common/utils/logger';

export interface CodeAnalysis {
  file: string;
  language: string;
  issues: CodeIssue[];
  metrics: CodeMetrics;
  suggestions: Suggestion[];
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'info' | 'security' | 'performance' | 'best-practice';
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  column?: number;
  message: string;
  description: string;
  rule?: string;
  code?: string;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity?: number;
  cognitiveComplexity?: number;
  maintainabilityIndex?: number;
  halsteadVolume?: number;
}

export interface Suggestion {
  type: 'improvement' | 'refactoring' | 'optimization' | 'documentation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  code?: string;
  line?: number;
}

export interface ReviewResult {
  id: string;
  pullRequestId: number;
  repository: string;
  provider: string;
  timestamp: Date;
  duration: number;
  files: CodeAnalysis[];
  summary: ReviewSummary;
  recommendations: Recommendation[];
}

export interface ReviewSummary {
  totalFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  securityIssues: number;
  performanceIssues: number;
  linesReviewed: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface Recommendation {
  category: 'security' | 'performance' | 'code-quality' | 'best-practices' | 'documentation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  files: string[];
  lines: number[];
  autoFixable: boolean;
}

export interface DiffFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
  oldFilename?: string;
}

export interface ReviewRequest {
  pullRequestId: number;
  repository: string;
  provider: string;
  owner: string;
  repo: string;
  baseBranch: string;
  headBranch: string;
  author: string;
  title: string;
  description?: string;
  files: DiffFile[];
}

export class CodeAnalyzer {
  /**
   * Analyze a single file's code
   */
  async analyzeFile(
    filename: string,
    content: string,
    patch?: string
  ): Promise<CodeAnalysis> {
    logger.info(`Analyzing file: ${filename}`);

    const language = this.detectLanguage(filename);
    const issues: CodeIssue[] = [];
    const suggestions: Suggestion[] = [];

    // Analyze based on language
    switch (language) {
      case 'typescript':
      case 'javascript':
        this.analyzeJavaScript(content, issues, suggestions, patch);
        break;
      case 'python':
        this.analyzePython(content, issues, suggestions, patch);
        break;
      case 'java':
        this.analyzeJava(content, issues, suggestions, patch);
        break;
      case 'go':
        this.analyzeGo(content, issues, suggestions, patch);
        break;
      case 'rust':
        this.analyzeRust(content, issues, suggestions, patch);
        break;
      default:
        this.analyzeGeneric(content, issues, suggestions, patch);
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(content, language);

    return {
      file: filename,
      language,
      issues,
      metrics,
      suggestions
    };
  }

  /**
   * Analyze JavaScript/TypeScript code
   */
  private analyzeJavaScript(
    content: string,
    issues: CodeIssue[],
    suggestions: Suggestion[],
    patch?: string
  ): void {
    const lines = content.split('\n');

    // Check for console.log in production code
    lines.forEach((line, index) => {
      if (line.includes('console.log') || line.includes('console.error')) {
        issues.push({
          type: 'best-practice',
          severity: 'low',
          line: index + 1,
          message: 'Console statement found',
          description: 'Consider removing console statements in production code or using a proper logging library.',
          rule: 'no-console'
        });
      }

      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info',
          severity: 'low',
          line: index + 1,
          message: 'TODO/FIXME comment found',
          description: 'This comment indicates incomplete code that needs attention.',
          rule: 'no-todo'
        });
      }

      // Check for eval usage
      if (line.includes('eval(')) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: index + 1,
          message: 'Use of eval detected',
          description: 'eval() is dangerous and can execute arbitrary code. Avoid using it.',
          rule: 'no-eval'
        });
      }

      // Check for hardcoded credentials
      if (line.match(/password\s*=\s*['"]/i) || line.match(/api[_-]?key\s*=\s*['"]/i)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: index + 1,
          message: 'Potential hardcoded credentials',
          description: 'Hardcoded credentials pose a serious security risk. Use environment variables instead.',
          rule: 'no-hardcoded-credentials'
        });
      }

      // Check for TODO in comments
      if (line.match(/\/\/\s*TODO/i)) {
        suggestions.push({
          type: 'improvement',
          priority: 'low',
          title: 'Address TODO comment',
          description: 'This TODO should be addressed before merging.',
          line: index + 1
        });
      }
    });

    // Check for common issues
    if (content.includes('var ') && !content.includes('let ') && !content.includes('const ')) {
      suggestions.push({
        type: 'refactoring',
        priority: 'medium',
        title: 'Use let or const instead of var',
        description: 'Modern JavaScript prefers let and const over var for better scoping.',
        code: 'const/let'
      });
    }

    // Check for == instead of ===
    if (content.match(/[^=!]=[^=]/)) {
      suggestions.push({
        type: 'best-practice',
        priority: 'medium',
        title: 'Use strict equality',
        description: 'Use === instead of == to avoid type coercion issues.',
        code: '==='
      });
    }

    // Check function complexity
    this.checkFunctionComplexity(content, issues, suggestions);
  }

  /**
   * Analyze Python code
   */
  private analyzePython(
    content: string,
    issues: CodeIssue[],
    suggestions: Suggestion[],
    patch?: string
  ): void {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for print statements
      if (line.trim().startsWith('print(')) {
        issues.push({
          type: 'best-practice',
          severity: 'low',
          line: index + 1,
          message: 'Print statement found',
          description: 'Consider using the logging module instead of print statements.',
          rule: 'print-statement'
        });
      }

      // Check for TODO
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info',
          severity: 'low',
          line: index + 1,
          message: 'TODO/FIXME comment found',
          description: 'This comment indicates incomplete code that needs attention.'
        });
      }

      // Check for hardcoded credentials
      if (line.match(/password\s*=\s*['"]/i) || line.match(/api[_-]?key\s*=\s*['"]/i)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: index + 1,
          message: 'Potential hardcoded credentials',
          description: 'Hardcoded credentials pose a serious security risk. Use environment variables instead.'
        });
      }

      // Check for except: without specific exception
      if (line.match(/except\s*:/)) {
        issues.push({
          type: 'best-practice',
          severity: 'medium',
          line: index + 1,
          message: 'Bare except clause',
          description: 'Use specific exception types instead of bare except clauses.',
          rule: 'bare-except'
        });
      }
    });

    // Check for Python 2 style
    if (content.includes('print ') && !content.includes('print(')) {
      suggestions.push({
        type: 'refactoring',
        priority: 'high',
        title: 'Update print syntax',
        description: 'This code uses Python 2 print syntax. Update to print() function.'
      });
    }
  }

  /**
   * Analyze Java code
   */
  private analyzeJava(
    content: string,
    issues: CodeIssue[],
    suggestions: Suggestion[],
    patch?: string
  ): void {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for TODO
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info',
          severity: 'low',
          line: index + 1,
          message: 'TODO/FIXME comment found',
          description: 'This comment indicates incomplete code that needs attention.'
        });
      }

      // Check for System.out.println
      if (line.includes('System.out.println')) {
        issues.push({
          type: 'best-practice',
          severity: 'low',
          line: index + 1,
          message: 'System.out.println found',
          description: 'Use a logging framework instead of System.out.println.',
          rule: 'system-out'
        });
      }

      // Check for hardcoded credentials
      if (line.match(/password\s*=\s*["']/i) || line.match(/api[_-]?key\s*=\s*["']/i)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: index + 1,
          message: 'Potential hardcoded credentials',
          description: 'Hardcoded credentials pose a serious security risk.'
        });
      }
    });
  }

  /**
   * Analyze Go code
   */
  private analyzeGo(
    content: string,
    issues: CodeIssue[],
    suggestions: Suggestion[],
    patch?: string
  ): void {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for TODO
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info',
          severity: 'low',
          line: index + 1,
          message: 'TODO/FIXME comment found',
          description: 'This comment indicates incomplete code that needs attention.'
        });
      }

      // Check for hardcoded credentials
      if (line.match(/(password|apikey|secret)\s*:?=\s*"/i)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: index + 1,
          message: 'Potential hardcoded credentials',
          description: 'Hardcoded credentials pose a serious security risk.'
        });
      }

      // Check for error handling
      if (line.includes('panic(')) {
        issues.push({
          type: 'best-practice',
          severity: 'medium',
          line: index + 1,
          message: 'Use of panic detected',
          description: 'Avoid using panic() in production code. Return errors instead.',
          rule: 'no-panic'
        });
      }
    });
  }

  /**
   * Analyze Rust code
   */
  private analyzeRust(
    content: string,
    issues: CodeIssue[],
    suggestions: Suggestion[],
    patch?: string
  ): void {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for TODO
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info',
          severity: 'low',
          line: index + 1,
          message: 'TODO/FIXME comment found',
          description: 'This comment indicates incomplete code that needs attention.'
        });
      }

      // Check for hardcoded credentials
      if (line.match(/(password|apikey|secret)\s*=\s*"/i)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: index + 1,
          message: 'Potential hardcoded credentials',
          description: 'Hardcoded credentials pose a serious security risk.'
        });
      }

      // Check for unsafe blocks
      if (line.includes('unsafe ')) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: index + 1,
          message: 'Unsafe code block',
          description: 'Unsafe blocks bypass Rust safety guarantees. Ensure they are necessary and documented.',
          rule: 'unsafe-block'
        });
      }
    });
  }

  /**
   * Generic analysis for unsupported languages
   */
  private analyzeGeneric(
    content: string,
    issues: CodeIssue[],
    suggestions: Suggestion[],
    patch?: string
  ): void {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info',
          severity: 'low',
          line: index + 1,
          message: 'TODO/FIXME comment found',
          description: 'This comment indicates incomplete code that needs attention.'
        });
      }

      // Check for potential credentials
      if (line.match(/(password|secret|api[_-]?key)\s*[:=]\s*['"]/i)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: index + 1,
          message: 'Potential hardcoded credentials',
          description: 'Hardcoded credentials pose a serious security risk.'
        });
      }
    });
  }

  /**
   * Check function complexity
   */
  private checkFunctionComplexity(
    content: string,
    issues: CodeIssue[],
    suggestions: Suggestion[]
  ): void {
    // Simple cyclomatic complexity check
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(|=>\s*{/g);
    
    if (functionMatches && functionMatches.length > 10) {
      suggestions.push({
        type: 'refactoring',
        priority: 'medium',
        title: 'High number of functions',
        description: 'Consider breaking this file into smaller modules.'
      });
    }
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(content: string, language: string): CodeMetrics {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => line.trim().length > 0).length;

    const metrics: CodeMetrics = {
      linesOfCode
    };

    // Calculate cyclomatic complexity (simplified)
    const controlStructures = content.match(/(if|else|for|while|switch|case|catch|\?\?|\|\||&&)/g);
    if (controlStructures) {
      metrics.cyclomaticComplexity = controlStructures.length + 1;
    }

    return metrics;
  }

  /**
   * Detect programming language from filename
   */
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
}
