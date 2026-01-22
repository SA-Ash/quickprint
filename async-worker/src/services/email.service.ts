/**
 * Email Service - Nodemailer
 */

import { workerEnv } from '../config/env.js';
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export const emailService = {
  async send(options: { to: string; subject: string; html: string; text?: string }) {
    if (workerEnv.USE_MOCK_EMAIL) {
      console.log(`[Email Mock] To: ${options.to} | Subject: ${options.subject}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    try {
      const result = await getTransporter().sendMail({
        from: workerEnv.SENDGRID_FROM_EMAIL,
        ...options,
      });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[Email] Failed:', error);
      return { success: false, error: String(error) };
    }
  },

  async sendOrderConfirmation(email: string, details: { orderNumber: string; shopName: string; totalCost: number }) {
    return this.send({
      to: email,
      subject: `Order Confirmed - ${details.orderNumber}`,
      html: `<h2>Order Confirmed!</h2><p>${details.orderNumber} confirmed by ${details.shopName}. Total: ₹${details.totalCost}</p>`,
    });
  },

  async sendPaymentReceipt(email: string, details: { orderNumber: string; amount: number; paymentId: string; date: Date }) {
    return this.send({
      to: email,
      subject: `Payment Receipt - ${details.orderNumber}`,
      html: `<h2>Payment Received</h2><p>₹${details.amount} for ${details.orderNumber}</p>`,
    });
  },

  async sendWelcome(email: string, name: string) {
    return this.send({
      to: email,
      subject: 'Welcome to QuickPrint!',
      html: `<h2>Welcome, ${name}!</h2><p>Start printing today.</p>`,
    });
  },

  async sendOrderReady(email: string, details: { orderNumber: string; shopName: string; shopAddress?: string }) {
    return this.send({
      to: email,
      subject: `Order Ready - ${details.orderNumber}`,
      html: `<h2>Order Ready!</h2><p>${details.orderNumber} is ready at ${details.shopName}</p>`,
    });
  },
};
