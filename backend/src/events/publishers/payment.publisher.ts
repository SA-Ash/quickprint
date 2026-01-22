import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event.types.js';
import type { PaymentSuccessPayload, PaymentFailedPayload } from '../event.types.js';

export const paymentPublisher = {
  async publishPaymentSuccess(payload: PaymentSuccessPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.PAYMENT_SUCCESS, payload);
  },

  async publishPaymentFailed(payload: PaymentFailedPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.PAYMENT_FAILED, payload);
  },
};
