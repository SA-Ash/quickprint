import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma.client.js';
import { wsGateway } from './websocket/index.js';

async function main() {
  console.log('Starting QuickPrint Backend...');

  await connectDatabase();

  const app = await buildApp();

  try {
    // Start HTTP server
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    
    // Initialize WebSocket gateway with the underlying HTTP server
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
      await disconnectDatabase();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
