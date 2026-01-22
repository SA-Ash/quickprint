import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event.types.js';
import type { ShopRegisteredPayload } from '../event.types.js';

export const shopPublisher = {
  async publishShopRegistered(payload: ShopRegisteredPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.SHOP_REGISTERED, payload);
  },
};
