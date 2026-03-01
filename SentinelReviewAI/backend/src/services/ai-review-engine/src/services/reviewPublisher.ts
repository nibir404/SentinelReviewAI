import amqp, { Connection, Channel } from 'amqplib';
import { logger } from '../utils/logger';
import { ReviewRequest, ReviewResult } from '../types';

export class ReviewPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue('review_results', { durable: true });
      logger.info('Review publisher connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect review publisher:', error);
      throw error;
    }
  }

  async publishReviewResults(request: ReviewRequest, result: ReviewResult): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    const message = {
      reviewId: request.reviewId,
      provider: request.provider,
      repository: request.repository,
      pullRequest: request.pullRequest,
      baseBranch: request.baseBranch,
      headBranch: request.headBranch,
      result,
      timestamp: new Date().toISOString()
    };

    this.channel?.sendToQueue(
      'review_results',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Published review results for ${request.reviewId}`);
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}
