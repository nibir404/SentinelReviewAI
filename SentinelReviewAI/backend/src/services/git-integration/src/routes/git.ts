import express, { Request, Response } from 'express';
import { GitIntegrationService } from '../services/gitIntegrationService';

const router = express.Router();
const gitService = new GitIntegrationService();

// Get pull request diff
router.get('/diff/:provider/:owner/:repo/:pullNumber', async (req: Request, res: Response) => {
  try {
    const { provider, owner, repo, pullNumber } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const diff = await gitService.getPullRequestDiff(
      { type: provider as any, accessToken: accessToken as string },
      owner,
      repo,
      parseInt(pullNumber)
    );

    res.json({ success: true, data: diff });
  } catch (error) {
    logger.error('Error getting PR diff:', error);
    res.status(500).json({ error: 'Failed to get PR diff' });
  }
});

// Get file content
router.get('/file/:provider/:owner/:repo/*', async (req: Request, res: Response) => {
  try {
    const { provider, owner, repo } = req.params;
    const path = req.params[0];
    const { accessToken, ref } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const content = await gitService.getFileContent(
      { type: provider as any, accessToken: accessToken as string },
      owner,
      repo,
      path,
      ref as string
    );

    res.json({ success: true, data: content });
  } catch (error) {
    logger.error('Error getting file content:', error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

// Get pull requests
router.get('/pulls/:provider/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { provider, owner, repo } = req.params;
    const { accessToken, state = 'open' } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const pullRequests = await gitService.getPullRequests(
      { type: provider as any, accessToken: accessToken as string },
      owner,
      repo,
      state as 'open' | 'closed' | 'all'
    );

    res.json({ success: true, data: pullRequests });
  } catch (error) {
    logger.error('Error getting pull requests:', error);
    res.status(500).json({ error: 'Failed to get pull requests' });
  }
});

// Post comment
router.post('/comment/:provider/:owner/:repo/:pullNumber', async (req: Request, res: Response) => {
  try {
    const { provider, owner, repo, pullNumber } = req.params;
    const { accessToken, body, commitId, path, line } = req.body;

    if (!accessToken || !body) {
      return res.status(400).json({ error: 'Access token and body required' });
    }

    const comment = await gitService.postComment(
      { type: provider as any, accessToken },
      owner,
      repo,
      parseInt(pullNumber),
      body,
      commitId,
      path,
      line
    );

    res.json({ success: true, data: comment });
  } catch (error) {
    logger.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// Create check run (GitHub only)
router.post('/check-run/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const { accessToken, name, status, conclusion, output } = req.body;

    if (!accessToken || !name || !status) {
      return res.status(400).json({ error: 'Access token, name, and status required' });
    }

    const checkRun = await gitService.createCheckRun(
      { type: 'github', accessToken },
      owner,
      repo,
      name,
      status,
      conclusion,
      output
    );

    res.json({ success: true, data: checkRun });
  } catch (error) {
    logger.error('Error creating check run:', error);
    res.status(500).json({ error: 'Failed to create check run' });
  }
});

// Parse webhook event
router.post('/parse-webhook', async (req: Request, res: Response) => {
  try {
    const { provider, event, payload } = req.body;

    if (!provider || !event || !payload) {
      return res.status(400).json({ error: 'Provider, event, and payload required' });
    }

    const parsed = await gitService.parseWebhookEvent(provider, payload, event);

    res.json({ success: true, data: parsed });
  } catch (error) {
    logger.error('Error parsing webhook:', error);
    res.status(500).json({ error: 'Failed to parse webhook' });
  }
});

export { router as gitIntegrationRouter };