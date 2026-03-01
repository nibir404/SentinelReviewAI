import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { WebhookHandler } from './handlers/webhookHandler';
import { GitHubParser } from './parsers/githubParser';
import { GitLabParser } from './parsers/gitlabParser';
import { BitbucketParser } from './parsers/bitbucketParser';
import { QueueService } from './services/queueService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4005;

// Initialize services
const queueService = new QueueService();
const githubParser = new GitHubParser();
const gitlabParser = new GitLabParser();
const bitbucketParser = new BitbucketParser();
const webhookHandler = new WebhookHandler(githubParser, gitlabParser, bitbucketParser, queueService);

// Middleware
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'webhook-listener' });
});

// Webhook endpoints
app.post('/webhooks/github', (req: Request, res: Response, next: NextFunction) => {
  webhookHandler.handleWebhook(req, res, next, 'github');
});

app.post('/webhooks/gitlab', (req: Request, res: Response, next: NextFunction) => {
  webhookHandler.handleWebhook(req, res, next, 'gitlab');
});

app.post('/webhooks/bitbucket', (req: Request, res: Response, next: NextFunction) => {
  webhookHandler.handleWebhook(req, res, next, 'bitbucket');
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    await queueService.connect();
    logger.info('Queue service connected');
    
    app.listen(PORT, () => {
      logger.info(`Webhook listener service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
