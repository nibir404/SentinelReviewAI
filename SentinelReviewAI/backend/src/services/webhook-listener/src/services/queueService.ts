import amqp, { Connection, Channel } from 'amqplib';
import { logger } from '../utils/logger';
import { QueuedEvent } from '../types';

export class QueueService {
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
      
      // Declare queues
      await this.channel.assertQueue('pr_events', { durable: true });
      await this.channel.assertQueue('review_results', { durable: true });
      
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publish(queue: string, message: QueuedEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('Queue channel not initialized');
    }

    this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Published message to ${queue}`);
  }

  async subscribe(queue: string, handler: (message: QueuedEvent) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Queue channel not initialized');
    }

    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString()) as QueuedEvent;
          await handler(content);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          this.channel?.nack(msg, false, false);
        }
      }
    });

    logger.info(`Subscribed to ${queue}`);
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    logger.info('Closed RabbitMQ connection');
  }
}
