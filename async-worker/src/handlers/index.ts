import { registerNotificationHandlers, startNotificationConsumer } from './notification.handler.js';
import { registerAnalyticsHandlers, startAnalyticsConsumer } from './analytics.handler.js';
import { registerEmailHandlers } from './email.handler.js';

export { 
  registerNotificationHandlers, 
  startNotificationConsumer,
  registerAnalyticsHandlers, 
  startAnalyticsConsumer,
  registerEmailHandlers 
};

// Deprecated: Use individual consumer start functions instead
export function registerAllHandlers(): void {
  console.warn('[Handlers] registerAllHandlers is deprecated');
  registerNotificationHandlers();
  registerAnalyticsHandlers();
  registerEmailHandlers();
}
