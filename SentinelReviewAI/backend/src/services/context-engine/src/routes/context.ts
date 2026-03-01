import express, { Request, Response } from 'express';
import contextEngine from '../contextEngine';

const router = express.Router();

// Record pull request event
router.post('/pull-request', async (req: Request, res: Response) => {
  try {
    const { provider, repository, pullRequestId, data } = req.body;

    if (!provider || !repository || !pullRequestId || !data) {
      return res.status(400).json({ 
        error: 'provider, repository, pullRequestId, and data are required' 
      });
    }

    const entry = await contextEngine.recordPullRequest(
      provider,
      repository,
      pullRequestId,
      data
    );

    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error('Error recording pull request:', error);
    res.status(500).json({ error: 'Failed to record pull request' });
  }
});

// Record review event
router.post('/review', async (req: Request, res: Response) => {
  try {
    const { provider, repository, pullRequestId, data } = req.body;

    if (!provider || !repository || !pullRequestId || !data) {
      return res.status(400).json({ 
        error: 'provider, repository, pullRequestId, and data are required' 
      });
    }

    const entry = await contextEngine.recordReview(
      provider,
      repository,
      pullRequestId,
      data
    );

    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error('Error recording review:', error);
    res.status(500).json({ error: 'Failed to record review' });
  }
});

// Record comment event
router.post('/comment', async (req: Request, res: Response) => {
  try {
    const { provider, repository, pullRequestId, data } = req.body;

    if (!provider || !repository || !pullRequestId || !data) {
      return res.status(400).json({ 
        error: 'provider, repository, pullRequestId, and data are required' 
      });
    }

    const entry = await contextEngine.recordComment(
      provider,
      repository,
      pullRequestId,
      data
    );

    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error('Error recording comment:', error);
    res.status(500).json({ error: 'Failed to record comment' });
  }
});

// Record issue event
router.post('/issue', async (req: Request, res: Response) => {
  try {
    const { provider, repository, data } = req.body;

    if (!provider || !repository || !data) {
      return res.status(400).json({ 
        error: 'provider, repository, and data are required' 
      });
    }

    const entry = await contextEngine.recordIssue(provider, repository, data);

    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error('Error recording issue:', error);
    res.status(500).json({ error: 'Failed to record issue' });
  }
});

// Record commit event
router.post('/commit', async (req: Request, res: Response) => {
  try {
    const { provider, repository, data } = req.body;

    if (!provider || !repository || !data) {
      return res.status(400).json({ 
        error: 'provider, repository, and data are required' 
      });
    }

    const entry = await contextEngine.recordCommit(provider, repository, data);

    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error('Error recording commit:', error);
    res.status(500).json({ error: 'Failed to record commit' });
  }
});

// Get pull request context
router.get('/pull-request/:provider/:repository/:pullRequestId', async (req: Request, res: Response) => {
  try {
    const { provider, repository, pullRequestId } = req.params;

    const context = await contextEngine.getPullRequestContext(
      provider,
      repository,
      parseInt(pullRequestId)
    );

    res.json({ success: true, data: context });
  } catch (error) {
    logger.error('Error getting pull request context:', error);
    res.status(500).json({ error: 'Failed to get pull request context' });
  }
});

// Get historical context for AI
router.get('/historical/:provider/:repository/:pullRequestId', async (req: Request, res: Response) => {
  try {
    const { provider, repository, pullRequestId } = req.params;

    const historical = await contextEngine.getHistoricalContext(
      provider,
      repository,
      parseInt(pullRequestId)
    );

    res.json({ success: true, data: historical });
  } catch (error) {
    logger.error('Error getting historical context:', error);
    res.status(500).json({ error: 'Failed to get historical context' });
  }
});

// Query context
router.post('/query', async (req: Request, res: Response) => {
  try {
    const query = req.body;

    const results = await contextEngine.query(query);

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error querying context:', error);
    res.status(500).json({ error: 'Failed to query context' });
  }
});

// Get recent context
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const recent = await contextEngine.getRecent(limit);

    res.json({ success: true, data: recent });
  } catch (error) {
    logger.error('Error getting recent context:', error);
    res.status(500).json({ error: 'Failed to get recent context' });
  }
});

// Get context summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await contextEngine.getSummary();

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error getting context summary:', error);
    res.status(500).json({ error: 'Failed to get context summary' });
  }
});

// Clear all context
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    await contextEngine.clear();

    res.json({ success: true, message: 'Context cleared' });
  } catch (error) {
    logger.error('Error clearing context:', error);
    res.status(500).json({ error: 'Failed to clear context' });
  }
});

export { router as contextEngineRouter };