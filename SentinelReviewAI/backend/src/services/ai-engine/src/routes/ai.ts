import express, { Request, Response } from 'express';
import { AIReviewEngine } from '../aiReviewEngine';
import { ReviewRequest } from '../codeAnalyzer';

const router = express.Router();
const aiEngine = new AIReviewEngine();

// Review pull request
router.post('/review', async (req: Request, res: Response) => {
  try {
    const reviewRequest: ReviewRequest = req.body;

    if (!reviewRequest.pullRequestId || !reviewRequest.repository || !reviewRequest.files) {
      return res.status(400).json({ 
        error: 'Missing required fields: pullRequestId, repository, files' 
      });
    }

    const result = await aiEngine.reviewPullRequest(reviewRequest);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error reviewing pull request:', error);
    res.status(500).json({ error: 'Failed to review pull request' });
  }
});

// Generate review comment
router.post('/comment', async (req: Request, res: Response) => {
  try {
    const { reviewResult } = req.body;

    if (!reviewResult) {
      return res.status(400).json({ error: 'reviewResult is required' });
    }

    const comment = await aiEngine.generateReviewComment(reviewResult);

    res.json({ success: true, data: { comment } });
  } catch (error) {
    logger.error('Error generating review comment:', error);
    res.status(500).json({ error: 'Failed to generate review comment' });
  }
});

// Analyze single file
router.post('/analyze-file', async (req: Request, res: Response) => {
  try {
    const { filename, content, patch } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'filename and content are required' });
    }

    const { CodeAnalyzer } = await import('../codeAnalyzer');
    const analyzer = new CodeAnalyzer();
    const analysis = await analyzer.analyzeFile(filename, content, patch);

    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('Error analyzing file:', error);
    res.status(500).json({ error: 'Failed to analyze file' });
  }
});

// Get supported languages
router.get('/languages', (req: Request, res: Response) => {
  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'go',
    'rust',
    'ruby',
    'php',
    'swift',
    'kotlin',
    'scala',
    'csharp',
    'cpp',
    'c',
    'html',
    'css',
    'scss',
    'json',
    'yaml',
    'markdown',
    'sql',
    'bash'
  ];

  res.json({ success: true, data: languages });
});

export { router as aiEngineRouter };