import amqp, { Connection, Channel } from 'amqplib';
import { logger } from '../utils/logger';
import { CodeReview, ReviewRequest, ReviewResult } from '../types';

export class ReviewQueue {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private url: string;
  private reviews: Map<string, CodeReview> = new Map();

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertQueue('review_requests', { durable: true });
      await this.channel.assertQueue('review_results', { durable: true });
      
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async createReview(review: Omit<CodeReview, 'id'>): Promise<string> {
    const id = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullReview: CodeReview = { ...review, id };
    this.reviews.set(id, fullReview);
    logger.info(`Created review: ${id}`);
    return id;
  }

  async getReview(id: string): Promise<CodeReview | null> {
    return this.reviews.get(id) || null;
  }

  async updateReviewStatus(id: string, status: CodeReview['status']): Promise<void> {
    const review = this.reviews.get(id);
    if (review) {
      review.status = status;
      if (status === 'completed') {
        review.completedAt = new Date().toISOString();
      }
      this.reviews.set(id, review);
      logger.info(`Updated review ${id} status to ${status}`);
    }
  }

  async updateReviewResults(id: string, result: ReviewResult): Promise<void> {
    const review = this.reviews.get(id);
    if (review) {
      review.issues = result.issues;
      review.summary = result.summary;
      review.score = result.score;
      review.status = 'completed';
      review.completedAt = new Date().toISOString();
      this.reviews.set(id, review);
      logger.info(`Updated review ${id} results`);
    }
  }

  async publishForReview(request: ReviewRequest): Promise<void> {
    if (!this.channel) {
      throw new Error('Queue channel not initialized');
    }

    this.channel.sendToQueue(
      'review_requests',
      Buffer.from(JSON.stringify(request)),
      { persistent: true }
    );

    logger.info(`Published review request: ${request.reviewId}`);
  }

  async subscribeToReviews(handler: (message: ReviewRequest) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Queue channel not initialized');
    }

    await this.channel.consume('review_requests', async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString()) as ReviewRequest;
          await handler(content);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Error processing review request:', error);
          this.channel?.nack(msg, false, false);
        }
      }
    });

    logger.info('Subscribed to review requests');
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    logger.info('Closed RabbitMQ connection');
  }
}
