import { nanoid } from 'nanoid';
import type { DomainEvent, EventHandler, EventType } from './event.types.js';

type SubscriptionMap = Map<string, Set<EventHandler<unknown>>>;

class EventBus {
  private subscriptions: SubscriptionMap = new Map();
  private isInitialized = false;

 
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[EventBus] Initialized (in-memory mode)');
    this.isInitialized = true;
  }

 
  async publish<T>(eventType: EventType, payload: T): Promise<void> {
    const event: DomainEvent<T> = {
      eventId: nanoid(),
      eventType,
      timestamp: new Date(),
      payload,
    };

    console.log(`[EventBus] Published: ${eventType}`, JSON.stringify(payload));

    const handlers = this.subscriptions.get(eventType);
    if (handlers && handlers.size > 0) {
      const promises = Array.from(handlers).map(async (handler) => {
        try {
          await handler(event as DomainEvent<unknown>);
        } catch (error) {
          console.error(`[EventBus] Handler error for ${eventType}:`, error);
        }
      });
      await Promise.allSettled(promises);
    }
  }

 
  subscribe<T>(eventType: EventType, handler: EventHandler<T>): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }
    
    const handlers = this.subscriptions.get(eventType)!;
    handlers.add(handler as EventHandler<unknown>);
    
    console.log(`[EventBus] Subscribed to: ${eventType}`);

    return () => {
      handlers.delete(handler as EventHandler<unknown>);
      console.log(`[EventBus] Unsubscribed from: ${eventType}`);
    };
  }

  getSubscriberCount(eventType: EventType): number {
    return this.subscriptions.get(eventType)?.size ?? 0;
  }

  clearAll(): void {
    this.subscriptions.clear();
    console.log('[EventBus] Cleared all subscriptions');
  }
}

export const eventBus = new EventBus();
