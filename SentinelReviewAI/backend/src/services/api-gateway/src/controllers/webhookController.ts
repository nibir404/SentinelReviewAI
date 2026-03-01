import { Request, Response } from 'express';
import { logger } from '../../../common/utils/logger';
import { queueService } from '../../../common/queue/queueService';
import { GitHubEventParser } from '../../git-integration/src/githubParser';
import { GitLabEventParser } from '../../git-integration/src/gitlabParser';
import { BitbucketEventParser } from '../../git-integration/src/bitbucketParser';
import { AzureEventParser } from '../../git-integration/src/azureParser';

export class WebhookController {
  private githubParser: GitHubEventParser;
  private gitlabParser: GitLabEventParser;
  private bitbucketParser: BitbucketEventParser;
  private azureParser: AzureEventParser;

  constructor() {
    this.githubParser = new GitHubEventParser();
    this.gitlabParser = new GitLabEventParser();
    this.bitbucketParser = new BitbucketEventParser();
    this.azureParser = new AzureEventParser();
  }

  /**
   * Handle GitHub webhook events
   */
  async handleGitHubWebhook(
    payload: any,
    event: string,
    signature: string
  ): Promise<void> {
    logger.info(`Processing GitHub event: ${event}`);

    try {
      // Verify webhook signature in production
      // await this.verifyGitHubSignature(payload, signature);

      const parsedEvent = await this.githubParser.parse(payload, event);

      switch (event) {
        case 'pull_request':
          await this.handlePullRequest(parsedEvent);
          break;
        case 'pull_request_review':
          await this.handlePullRequestReview(parsedEvent);
          break;
        case 'push':
          await this.handlePush(parsedEvent);
          break;
        case 'check_run':
          await this.handleCheckRun(parsedEvent);
          break;
        default:
          logger.info(`Unhandled GitHub event type: ${event}`);
      }
    } catch (error) {
      logger.error(`Error processing GitHub webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Handle GitLab webhook events
   */
  async handleGitLabWebhook(
    payload: any,
    event: string
  ): Promise<void> {
    logger.info(`Processing GitLab event: ${event}`);

    try {
      const parsedEvent = await this.gitlabParser.parse(payload, event);

      switch (event) {
        case 'Merge Request Hook':
          await this.handleMergeRequest(parsedEvent);
          break;
        case 'Push Hook':
          await this.handlePush(parsedEvent);
          break;
        default:
          logger.info(`Unhandled GitLab event type: ${event}`);
      }
    } catch (error) {
      logger.error(`Error processing GitLab webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Handle Bitbucket webhook events
   */
  async handleBitbucketWebhook(
    payload: any,
    event: string
  ): Promise<void> {
    logger.info(`Processing Bitbucket event: ${event}`);

    try {
      const parsedEvent = await this.bitbucketParser.parse(payload, event);

      switch (event) {
        case 'pullrequest:created':
        case 'pullrequest:updated':
          await this.handlePullRequest(parsedEvent);
          break;
        case 'repo:push':
          await this.handlePush(parsedEvent);
          break;
        default:
          logger.info(`Unhandled Bitbucket event type: ${event}`);
      }
    } catch (error) {
      logger.error(`Error processing Bitbucket webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Handle Azure DevOps webhook events
   */
  async handleAzureWebhook(
    payload: any,
    eventType: string
  ): Promise<void> {
    logger.info(`Processing Azure DevOps event: ${eventType}`);

    try {
      const parsedEvent = await this.azureParser.parse(payload, eventType);

      switch (eventType) {
        case 'git.pullrequest.created':
        case 'git.pullrequest.updated':
          await this.handlePullRequest(parsedEvent);
          break;
        case 'git.push':
          await this.handlePush(parsedEvent);
          break;
        default:
          logger.info(`Unhandled Azure event type: ${eventType}`);
      }
    } catch (error) {
      logger.error(`Error processing Azure webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Handle pull request events across all providers
   */
  private async handlePullRequest(event: any): Promise<void> {
    const { action, repository, pullRequest, commits, baseBranch, headBranch } = event;

    logger.info(`Processing PR: ${pullRequest?.id} action: ${action}`);

    // Only process relevant PR actions
    const relevantActions = ['opened', 'synchronize', 'reopened', 'ready_for_review'];
    
    if (!relevantActions.includes(action)) {
      logger.info(`Skipping PR action: ${action}`);
      return;
    }

    // Queue the review job
    await queueService.publish('review.triggered', {
      type: 'pull_request',
      provider: event.provider,
      repositoryId: repository.id,
      repositoryName: repository.fullName,
      pullRequestId: pullRequest.id,
      pullRequestNumber: pullRequest.number,
      title: pullRequest.title,
      author: pullRequest.author,
      baseBranch,
      headBranch,
      commits: commits || [],
      action: 'new_review',
      timestamp: new Date().toISOString()
    });

    logger.info(`Queued review for PR ${pullRequest.id}`);
  }

  /**
   * Handle pull request review events
   */
  private async handlePullRequestReview(event: any): Promise<void> {
    const { action, repository, pullRequest, review } = event;

    logger.info(`Processing PR review: ${pullRequest.id} action: ${action}`);

    // Track review decisions for learning engine
    if (action === 'submitted') {
      await queueService.publish('review.decision', {
        type: 'pull_request_review',
        provider: event.provider,
        repositoryId: repository.id,
        pullRequestId: pullRequest.id,
        reviewState: review.state,
        reviewer: review.author,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle push events
   */
  private async handlePush(event: any): Promise<void> {
    const { repository, commits, ref, pusher } = event;

    logger.info(`Processing push to ${ref}`);

    // Update repository context/index on push
    await queueService.publish('repository.updated', {
      type: 'push',
      provider: event.provider,
      repositoryId: repository.id,
      repositoryName: repository.fullName,
      ref,
      commits: commits || [],
      pusher: pusher?.name,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle check run events (GitHub)
   */
  private async handleCheckRun(event: any): Promise<void> {
    const { action, repository, checkRun } = event;

    logger.info(`Processing check run: ${checkRun?.name} action: ${action}`);

    // Update merge gate status based on check run
    if (action === 'completed') {
      await queueService.publish('mergegate.status', {
        type: 'check_run',
        provider: event.provider,
        repositoryId: repository.id,
        pullRequestId: checkRun?.pullRequests?.[0]?.id,
        checkName: checkRun?.name,
        status: checkRun?.conclusion,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle merge request events (GitLab)
   */
  private async handleMergeRequest(event: any): Promise<void> {
    const { action, repository, mergeRequest, diffRefs } = event;

    logger.info(`Processing MR: ${mergeRequest?.iid} action: ${action}`);

    const relevantActions = ['open', 'update', 'reopen'];
    
    if (!relevantActions.includes(action)) {
      logger.info(`Skipping MR action: ${action}`);
      return;
    }

    await queueService.publish('review.triggered', {
      type: 'merge_request',
      provider: event.provider,
      repositoryId: repository.id,
      repositoryName: repository.fullName,
      mergeRequestId: mergeRequest.id,
      mergeRequestIID: mergeRequest.iid,
      title: mergeRequest.title,
      author: mergeRequest.author,
      sourceBranch: mergeRequest.sourceBranch,
      targetBranch: mergeRequest.targetBranch,
      action: 'new_review',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(payload: any): Promise<void> {
    logger.info('Processing test webhook', { payload });
    
    // Just log and return - no actual processing
    await queueService.publish('webhook.test', {
      ...payload,
      timestamp: new Date().toISOString()
    });
  }
}
