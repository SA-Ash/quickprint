/**
 * RabbitMQ Client for QuickPrint
 * Message queue for async processing (notifications, analytics, file processing)
 */
import amqplib, { type Channel, type ConsumeMessage } from 'amqplib';
import { env } from '../../config/env.js';

// Use the ChannelModel type which is what amqplib.connect returns
type RabbitConnection = Awaited<ReturnType<typeof amqplib.connect>>;

let connection: RabbitConnection | null = null;
let channel: Channel | null = null;

// Queue names as defined in tech spec Section 7.2
export const QUEUES = {
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  FILE_PROCESSING: 'file-processing',
} as const;

// Dead letter queue suffix
const DLQ_SUFFIX = '.dlq';

/**
 * Connect to RabbitMQ
 */
export async function connectRabbitMQ(): Promise<void> {
  if (!env.RABBITMQ_URL) {
    console.warn('⚠️  RABBITMQ_URL not configured, message queue disabled');
    return;
  }

  try {
    connection = await amqplib.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Setup queues with dead letter queues
    for (const queueName of Object.values(QUEUES)) {
      // Create dead letter queue first
      await channel.assertQueue(`${queueName}${DLQ_SUFFIX}`, {
        durable: true,
      });

      // Create main queue with dead letter exchange
      await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': `${queueName}${DLQ_SUFFIX}`,
        },
      });
    }

    console.log('✅ RabbitMQ connected successfully');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });
  } catch (error) {
    console.error('❌ RabbitMQ connection failed:', error);
    // Don't exit - allow app to run without message queue in development
  }
}

/**
 * Disconnect from RabbitMQ
 */
export async function disconnectRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('RabbitMQ disconnected');
  } catch (error) {
    console.error('Error disconnecting RabbitMQ:', error);
  }
}

/**
 * Get the current channel (throws if not connected)
 */
export function getChannel(): Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ() first.');
  }
  return channel;
}

/**
 * Check if RabbitMQ is connected
 */
export function isRabbitMQConnected(): boolean {
  return channel !== null && connection !== null;
}

/**
 * Publish a message to a queue
 */
export async function publishToQueue<T>(
  queueName: string,
  message: T
): Promise<boolean> {
  if (!channel) {
    console.warn('RabbitMQ not connected, message not sent:', queueName);
    return false;
  }

  try {
    const messageBuffer = Buffer.from(JSON.stringify(message));
    return channel.sendToQueue(queueName, messageBuffer, {
      persistent: true, // Message survives broker restart
      contentType: 'application/json',
    });
  } catch (error) {
    console.error(`Error publishing to queue ${queueName}:`, error);
    return false;
  }
}

/**
 * Consume messages from a queue
 */
export async function consumeFromQueue<T>(
  queueName: string,
  handler: (message: T) => Promise<void>
): Promise<void> {
  if (!channel) {
    console.warn('RabbitMQ not connected, cannot consume from:', queueName);
    return;
  }

  try {
    await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as T;
        await handler(content);
        channel?.ack(msg); // Acknowledge successful processing
      } catch (error) {
        console.error(`Error processing message from ${queueName}:`, error);
        // Reject and send to dead letter queue
        channel?.nack(msg, false, false);
      }
    });

    console.log(`Consuming from queue: ${queueName}`);
  } catch (error) {
    console.error(`Error setting up consumer for ${queueName}:`, error);
  }
}
