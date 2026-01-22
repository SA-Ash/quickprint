import { registerNotificationSubscribers } from './notification.subscriber.js';
import { registerAnalyticsSubscribers } from './analytics.subscriber.js';

export { registerNotificationSubscribers } from './notification.subscriber.js';
export { registerAnalyticsSubscribers } from './analytics.subscriber.js';

export function registerAllSubscribers(): void {
  registerNotificationSubscribers();
  registerAnalyticsSubscribers();
  console.log('[Events] All subscribers registered');
}
