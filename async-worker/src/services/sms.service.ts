/**
 * SMS Service - Twilio
 */

import { workerEnv } from '../config/env.js';

export const smsService = {
  async send(to: string, message: string) {
    if (workerEnv.USE_MOCK_SMS) {
      console.log(`[SMS Mock] To: ${to} | Message: ${message}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    try {
      const twilio = await import('twilio');
      const client = twilio.default(workerEnv.TWILIO_SID, workerEnv.TWILIO_AUTH_TOKEN);
      const result = await client.messages.create({
        body: message,
        from: workerEnv.TWILIO_PHONE_NUMBER,
        to,
      });
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('[SMS] Failed:', error);
      return { success: false, error: String(error) };
    }
  },

  async sendOrderCreated(phone: string, orderNumber: string) {
    return this.send(phone, `📋 New Order: ${orderNumber}. Open QuickPrint to accept.`);
  },

  async sendOrderConfirmed(phone: string, orderNumber: string, shopName: string) {
    return this.send(phone, `✅ Order ${orderNumber} confirmed by ${shopName}.`);
  },

  async sendOrderReady(phone: string, orderNumber: string, shopName: string) {
    return this.send(phone, `🎉 Order ${orderNumber} is ready at ${shopName}!`);
  },

  async sendPaymentConfirmation(phone: string, amount: number, orderNumber: string) {
    return this.send(phone, `💰 Payment of ₹${amount} received for ${orderNumber}.`);
  },

  async sendOrderCancelled(phone: string, orderNumber: string, reason?: string) {
    return this.send(phone, `❌ Order ${orderNumber} cancelled.${reason ? ` Reason: ${reason}` : ''}`);
  },
};
