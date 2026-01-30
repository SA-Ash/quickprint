/**
 * Email Service - SendGrid Integration
 * Professional email delivery with QuickPrint branding
 */

import sgMail from '@sendgrid/mail';
import { workerEnv } from '../config/env.js';
import { emailTemplates } from './email-templates.js';

// Initialize SendGrid
if (workerEnv.SENDGRID_API_KEY) {
  sgMail.setApiKey(workerEnv.SENDGRID_API_KEY);
}

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  /**
   * Send a raw email
   */
  async send(options: SendOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (workerEnv.USE_MOCK_EMAIL) {
      console.log(`[Email Mock] To: ${options.to} | Subject: ${options.subject}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    if (!workerEnv.SENDGRID_API_KEY) {
      console.warn('[Email] SendGrid API key not configured, skipping email');
      return { success: false, error: 'SendGrid not configured' };
    }

    try {
      const result = await sgMail.send({
        to: options.to,
        from: {
          email: workerEnv.SENDGRID_FROM_EMAIL,
          name: 'QuickPrint',
        },
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      });
      
      const messageId = result[0]?.headers?.['x-message-id'] || `sg_${Date.now()}`;
      console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
      return { success: true, messageId };
    } catch (error: any) {
      console.error('[Email] Failed to send:', error?.response?.body || error);
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // AUTHENTICATION EMAILS
  // ============================================

  /**
   * Send OTP verification email
   */
  async sendOTP(email: string, code: string, name?: string) {
    return this.send({
      to: email,
      subject: `${code} is your QuickPrint verification code`,
      html: emailTemplates.otp(code, name),
    });
  },

  /**
   * Send magic link for passwordless login
   */
  async sendMagicLink(email: string, url: string, name?: string) {
    return this.send({
      to: email,
      subject: 'Sign in to QuickPrint',
      html: emailTemplates.magicLink(url, name),
    });
  },

  /**
   * Send welcome email after signup
   */
  async sendWelcome(email: string, name: string, isPartner: boolean = false) {
    return this.send({
      to: email,
      subject: 'Welcome to QuickPrint! 🎉',
      html: emailTemplates.welcome(name, isPartner),
    });
  },

  // ============================================
  // ORDER NOTIFICATION EMAILS
  // ============================================

  /**
   * Notify shop owner of new order
   */
  async sendOrderCreated(email: string, details: { orderNumber: string; customerName?: string; totalCost: number }) {
    return this.send({
      to: email,
      subject: `New Order Received - ${details.orderNumber}`,
      html: emailTemplates.orderCreated(details),
    });
  },

  /**
   * Notify customer that order was confirmed
   */
  async sendOrderConfirmed(email: string, details: { orderNumber: string; shopName: string; totalCost: number; estimatedTime?: string }) {
    return this.send({
      to: email,
      subject: `Order Confirmed - ${details.orderNumber}`,
      html: emailTemplates.orderConfirmed(details),
    });
  },

  /**
   * Notify customer that order is ready for pickup
   */
  async sendOrderReady(email: string, details: { orderNumber: string; shopName: string; shopAddress?: string }) {
    return this.send({
      to: email,
      subject: `Your Order is Ready! - ${details.orderNumber}`,
      html: emailTemplates.orderReady(details),
    });
  },

  /**
   * Notify customer that order was cancelled
   */
  async sendOrderCancelled(email: string, details: { orderNumber: string; reason?: string; refundAmount?: number }) {
    return this.send({
      to: email,
      subject: `Order Cancelled - ${details.orderNumber}`,
      html: emailTemplates.orderCancelled(details),
    });
  },

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(email: string, details: { orderNumber: string; amount: number; paymentId: string; date: Date }) {
    return this.send({
      to: email,
      subject: `Payment Receipt - ${details.orderNumber}`,
      html: emailTemplates.paymentSuccess(details),
    });
  },
};
