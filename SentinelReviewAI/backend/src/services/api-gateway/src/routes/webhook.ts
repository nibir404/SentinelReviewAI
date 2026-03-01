import { Router, Request, Response, NextFunction } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { logger } from '../../../common/utils/logger';

export const webhookRouter = Router();
const webhookController = new WebhookController();

// GitHub webhook endpoint
webhookRouter.post('/github', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.headers['x-github-event'] as string;
    const delivery = req.headers['x-github-delivery'] as string;
    
    logger.info(`Received GitHub webhook: ${event}`, { delivery });

    // Verify webhook signature (in production)
    const signature = req.headers['x-hub-signature-256'] as string;
    
    await webhookController.handleGitHubWebhook(req.body, event, signature);
    
    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    next(error);
  }
});

// GitLab webhook endpoint
webhookRouter.post('/gitlab', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.headers['x-gitlab-event'] as string;
    
    logger.info(`Received GitLab webhook: ${event}`);

    await webhookController.handleGitLabWebhook(req.body, event);
    
    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    next(error);
  }
});

// Bitbucket webhook endpoint
webhookRouter.post('/bitbucket', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.headers['x-bitbucket-event'] as string;
    
    logger.info(`Received Bitbucket webhook: ${event}`);

    await webhookController.handleBitbucketWebhook(req.body, event);
    
    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    next(error);
  }
});

// Azure DevOps webhook endpoint
webhookRouter.post('/azure', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventType = req.headers['x-azure-devops-event-type'] as string;
    
    logger.info(`Received Azure DevOps webhook: ${eventType}`);

    await webhookController.handleAzureWebhook(req.body, eventType);
    
    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    next(error);
  }
});

// Webhook test endpoint
webhookRouter.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await webhookController.testWebhook(req.body);
    
    res.status(200).json({ success: true, message: 'Test webhook processed' });
  } catch (error) {
    next(error);
  }
});
