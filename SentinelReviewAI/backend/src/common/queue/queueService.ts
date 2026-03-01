import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { logger } from '../utils/logger';

export interface QueueMessage {
  type: string;
  [key: string]: any;
}

export interface QueueConfig {
  url: string;
  exchange?: string;
  queues?: {
    reviewTriggered: string;
    reviewResults: string;
    repositoryUpdated: string;
    mergegateStatus: string;
    webhookTest: string;
  };
}

const defaultConfig: QueueConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchange: 'sentinel_review',
  queues: {
    reviewTriggered: 'review.triggered',
    reviewResults: 'review.results',
    repositoryUpdated: 'repository.updated',
    mergegateStatus: 'mergegate.status',
    webhookTest: 'webhook.test'
  }
};

class QueueService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: QueueConfig;
  private messageHandlers: Map<string, (message: QueueMessage) => Promise<void>> = new Map();

  constructor(config: QueueConfig = defaultConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      // Assert exchange
      await this.channel.assertExchange(this.config.exchange || 'sentinel_review', 'topic', { durable: true });

      // Assert queues
      const queues = this.config.queues || defaultConfig.queues;
      for (const queue of Object.values(queues)) {
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.bindQueue(queue, this.config.exchange || 'sentinel_review', queue);
      }

      logger.info('Queue service connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publish(routingKey: string, message: QueueMessage): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    this.channel?.publish(
      this.config.exchange || 'sentinel_review',
      routingKey,
      messageBuffer,
      { persistent: true }
    );

    logger.info(`Published message to ${routingKey}`, { messageType: message.type });
  }

  async subscribe(
    routingKey: string,
    handler: (message: QueueMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    const queue = routingKey;
    this.messageHandlers.set(queue, handler);

    await this.channel?.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as QueueMessage;
        await handler(content);
        this.channel?.ack(msg);
      } catch (error) {
        logger.error(`Error processing message from ${routingKey}:`, error);
        // Negative acknowledge - requeue the message
        this.channel?.nack(msg, false, true);
      }
    });

    logger.info(`Subscribed to queue: ${routingKey}`);
  }

  async consume(
    queue: string,
    handler: (message: QueueMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    this.messageHandlers.set(queue, handler);

    await this.channel?.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as QueueMessage;
        await handler(content);
        this.channel?.ack(msg);
      } catch (error) {
        logger.error(`Error processing message from ${queue}:`, error);
        this.channel?.nack(msg, false, false); // Don't requeue failed messages
      }
    });

    logger.info(`Consuming from queue: ${queue}`);
  }

  async getQueueStatus(queueName: string): Promise<{ messageCount: number }> {
    if (!this.channel) {
      await this.connect();
    }

    const queue = await this.channel?.checkQueue(queueName);
    return { messageCount: queue?.messageCount || 0 };
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    logger.info('Queue service disconnected');
  }
}

export const queueService = new QueueService();
export default queueService;
