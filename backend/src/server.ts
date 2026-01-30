import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma.client.js';
import { connectRabbitMQ, disconnectRabbitMQ } from './infrastructure/queue/rabbitmq.client.js';
import { connectRedis, disconnectRedis } from './infrastructure/cache/redis.client.js';
import { wsGateway } from './websocket/index.js';

async function main() {
  console.log('Starting QuickPrint Backend...');

  await connectDatabase();
  await connectRedis();
  await connectRabbitMQ();

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    
    const httpServer = app.server;
    wsGateway.initialize(httpServer);

    console.log(`Server running at http://localhost:${env.PORT}`);
    console.log(`API available at http://localhost:${env.PORT}/api`);
    console.log(`Health check at http://localhost:${env.PORT}/health`);
    console.log(`WebSocket ready for connections`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} received, shutting down...`);
      await app.close();
      await disconnectRabbitMQ();
      await disconnectRedis();
      await disconnectDatabase();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
