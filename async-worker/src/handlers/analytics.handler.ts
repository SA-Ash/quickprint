/**
 * Analytics Handler - Consumes from RabbitMQ analytics queue
 */

import { analyticsService } from '../services/analytics.service.js';
import { consumeFromQueue, QUEUES } from '../infrastructure/rabbitmq.client.js';

interface AnalyticsMessage {
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

async function handleAnalyticsMessage(message: AnalyticsMessage): Promise<void> {
  const { eventType, payload } = message;
  console.log(`[AnalyticsHandler] Processing: ${eventType}`);

  // Map event types to analytics service calls
  if (eventType.startsWith('ORDER_')) {
    await analyticsService.logOrderEvent(eventType.toLowerCase().replace('_', '.'), payload);
  } else if (eventType.startsWith('PAYMENT_')) {
    await analyticsService.logPaymentEvent(eventType.toLowerCase().replace('_', '.'), payload);
  } else if (eventType.startsWith('SHOP_')) {
    await analyticsService.logShopEvent(eventType.toLowerCase().replace('_', '.'), payload);
  } else {
    console.warn(`[AnalyticsHandler] Unknown event type: ${eventType}`);
  }
}

export async function startAnalyticsConsumer(): Promise<void> {
  console.log('[AnalyticsHandler] Starting consumer...');
  await consumeFromQueue<AnalyticsMessage>(QUEUES.ANALYTICS, handleAnalyticsMessage);
  console.log('[AnalyticsHandler] Consumer started');
}

// Keep old export for backwards compatibility
export function registerAnalyticsHandlers(): void {
  console.warn('[AnalyticsHandler] registerAnalyticsHandlers is deprecated, use startAnalyticsConsumer instead');
}
