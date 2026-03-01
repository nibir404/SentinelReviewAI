import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { GitHubParser } from '../parsers/githubParser';
import { GitLabParser } from '../parsers/gitlabParser';
import { BitbucketParser } from '../parsers/bitbucketParser';
import { QueueService } from '../services/queueService';
import { ParsedEvent } from '../types';

export class WebhookHandler {
  private githubParser: GitHubParser;
  private gitlabParser: GitLabParser;
  private bitbucketParser: BitbucketParser;
  private queueService: QueueService;

  constructor(
    githubParser: GitHubParser,
    gitlabParser: GitLabParser,
    bitbucketParser: BitbucketParser,
    queueService: QueueService
  ) {
    this.githubParser = githubParser;
    this.gitlabParser = gitlabParser;
    this.bitbucketParser = bitbucketParser;
    this.queueService = queueService;
  }

  async handleWebhook(
    req: Request,
    res: Response,
    _next: NextFunction,
    provider: 'github' | 'gitlab' | 'bitbucket'
  ): Promise<void> {
    try {
      const signature = req.headers['x-hub-signature-256'] as string ||
                       req.headers['x-gitlab-token'] as string ||
                       req.headers['x-hub-signature'] as string;

      // Verify webhook signature
      if (!this.verifySignature(req, provider, signature)) {
        logger.warn(`Invalid signature for ${provider} webhook`);
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event = req.headers['x-github-event'] as string ||
                   req.headers['x-gitlab-event'] as string ||
                   'unknown';

      logger.info(`Received ${provider} webhook: ${event}`);

      // Parse the webhook payload
      const parsedEvent = await this.parsePayload(req.body, provider, event);

      if (!parsedEvent) {
        res.status(400).json({ error: 'Unsupported event type' });
        return;
      }

      // Queue the event for processing
      await this.queueEvent(parsedEvent);

      res.status(200).json({ success: true, message: 'Webhook received' });
    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private verifySignature(
    req: Request,
    provider: string,
    signature?: string
  ): boolean {
    // In development, skip verification
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    if (!signature) {
      return false;
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      return false;
    }

    switch (provider) {
      case 'github':
        return this.verifyGitHubSignature(rawBody, signature);
      case 'gitlab':
        return this.verifyGitLabSignature(signature);
      case 'bitbucket':
        return this.verifyBitbucketSignature(rawBody, signature);
      default:
        return false;
    }
  }

  private verifyGitHubSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  private verifyGitLabSignature(signature: string): boolean {
    const secret = process.env.GITLAB_WEBHOOK_SECRET;
    if (!secret) return false;
    return signature === secret;
  }

  private verifyBitbucketSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.BITBUCKET_WEBHOOK_SECRET;
    if (!secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  private async parsePayload(
    payload: any,
    provider: string,
    event: string
  ): Promise<ParsedEvent | null> {
    switch (provider) {
      case 'github':
        return this.githubParser.parse(payload, event);
      case 'gitlab':
        return this.gitlabParser.parse(payload, event);
      case 'bitbucket':
        return this.bitbucketParser.parse(payload, event);
      default:
        return null;
    }
  }

  private async queueEvent(event: ParsedEvent): Promise<void> {
    // Only queue PR/MR events for review
    if (event.action === 'pull_request' || 
        event.action === 'merge_request' ||
        event.action === 'opened' ||
        event.action === 'synchronize' ||
        event.action === 'update') {
      
      await this.queueService.publish('pr_events', {
        type: 'new_review',
        payload: event,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Queued ${event.provider} PR event for review`);
    }
  }
}
