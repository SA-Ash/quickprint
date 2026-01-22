/**
 * Async Worker - Entry Point
 */

import { validateWorkerEnv } from './config/env.js';
import { registerAllHandlers } from './handlers/index.js';

async function startWorker(): Promise<void> {
  console.log('==================================================');
  console.log('  QuickPrint Async Worker');
  console.log('==================================================');

  validateWorkerEnv();
  registerAllHandlers();

  console.log('[Worker] Running and listening for events...');
  console.log('[Worker] Press Ctrl+C to stop');

  // Keep process alive
  setInterval(() => {}, 1000);
}

process.on('SIGINT', () => {
  console.log('\n[Worker] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Worker] Shutting down...');
  process.exit(0);
});

startWorker().catch((error) => {
  console.error('[Worker] Failed to start:', error);
  process.exit(1);
});
