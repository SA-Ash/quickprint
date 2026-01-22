import { registerNotificationHandlers } from './notification.handler.js';
import { registerAnalyticsHandlers } from './analytics.handler.js';
import { registerEmailHandlers } from './email.handler.js';

export { registerNotificationHandlers, registerAnalyticsHandlers, registerEmailHandlers };

export function registerAllHandlers(): void {
  registerNotificationHandlers();
  registerAnalyticsHandlers();
  registerEmailHandlers();
  console.log('[Handlers] All registered');
}
