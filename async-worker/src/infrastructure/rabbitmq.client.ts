/**
 * RabbitMQ Client for Async Worker
 * Consumes messages from queues for background processing
 */
import amqplib, { type Channel, type ConsumeMessage } from 'amqplib';
import { env } from '../config/env.js';

type RabbitConnection = Awaited<ReturnType<typeof amqplib.connect>>;

let connection: RabbitConnection | null = null;
let channel: Channel | null = null;

// Queue names (must match backend)
export const QUEUES = {
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  FILE_PROCESSING: 'file-processing',
} as const;

/**
 * Connect to RabbitMQ
 */
export async function connectRabbitMQ(): Promise<void> {
  const rabbitmqUrl = env.RABBITMQ_URL;
  
  if (!rabbitmqUrl) {
    console.error('❌ RABBITMQ_URL not configured - async worker cannot function without RabbitMQ');
    process.exit(1);
  }

  try {
    console.log('[RabbitMQ] Connecting to:', rabbitmqUrl.replace(/:[^:@]+@/, ':****@'));
    connection = await amqplib.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    // Set prefetch to process one message at a time
    await channel.prefetch(1);

    // Ensure queues exist (same config as backend)
    for (const queueName of Object.values(QUEUES)) {
      await channel.assertQueue(`${queueName}.dlq`, { durable: true });
      await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': `${queueName}.dlq`,
        },
      });
    }

    console.log('✅ RabbitMQ connected successfully');

    connection.on('error', (err: Error) => {
      console.error('❌ RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });
  } catch (error) {
    console.error('❌ RabbitMQ connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from RabbitMQ
 */
export async function disconnectRabbitMQ(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ disconnected');
  } catch (error) {
    console.error('Error disconnecting RabbitMQ:', error);
  }
}

/**
 * Get the current channel
 */
export function getChannel(): Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return channel !== null && connection !== null;
}

/**
 * Consume messages from a queue
 */
export async function consumeFromQueue<T>(
  queueName: string,
  handler: (message: T) => Promise<void>
): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ not connected');
  }

  console.log(`[RabbitMQ] Starting consumer for queue: ${queueName}`);

  await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    const startTime = Date.now();
    let content: T;

    try {
      content = JSON.parse(msg.content.toString()) as T;
      console.log(`[RabbitMQ] Processing message from ${queueName}:`, JSON.stringify(content).slice(0, 100));
      
      await handler(content);
      
      channel?.ack(msg);
      console.log(`[RabbitMQ] ✓ Message processed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`[RabbitMQ] ✗ Error processing message from ${queueName}:`, error);
      // Reject and send to dead letter queue
      channel?.nack(msg, false, false);
    }
  });

  console.log(`[RabbitMQ] Consumer registered for: ${queueName}`);
}
