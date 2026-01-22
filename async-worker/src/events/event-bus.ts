import { EVENT_TYPES, type DomainEvent, type EventType } from './event.types.js';

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe<T>(eventType: EventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);
    console.log(`[EventBus] Subscribed to: ${eventType}`);
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    console.log(`[EventBus] Publishing: ${event.type}`);
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event.type}:`, error);
      }
    }
  }

  clearAll(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
export { EVENT_TYPES };
export type { DomainEvent, EventType };
