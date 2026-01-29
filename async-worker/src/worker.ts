import { validateWorkerEnv } from './config/env.js';
import { connectRabbitMQ, disconnectRabbitMQ } from './infrastructure/rabbitmq.client.js';
import { startNotificationConsumer } from './handlers/notification.handler.js';
import { startAnalyticsConsumer } from './handlers/analytics.handler.js';

async function startWorker(): Promise<void> {
  console.log('==================================================');
  console.log('  QuickPrint Async Worker');
  console.log('==================================================');

  validateWorkerEnv();
  
  await connectRabbitMQ();
  
  await startNotificationConsumer();
  await startAnalyticsConsumer();

  console.log('[Worker] Running and listening for messages...');
  console.log('[Worker] Press Ctrl+C to stop');
}

async function shutdown(): Promise<void> {
  console.log('\n[Worker] Shutting down...');
  await disconnectRabbitMQ();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startWorker().catch((error) => {
  console.error('[Worker] Failed to start:', error);
  process.exit(1);
});
