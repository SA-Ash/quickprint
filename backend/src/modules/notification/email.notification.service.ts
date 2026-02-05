/**
 * Email Notification Service
 * Handles sending transactional emails for orders and payments via SendGrid
 */

import sgMail from '@sendgrid/mail';
import { env } from '../../config/env.js';
import { prisma } from '../../infrastructure/database/prisma.client.js';

// Initialize SendGrid
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

const FROM_EMAIL = env.SENDGRID_FROM_EMAIL || 'noreply@thequickprint.in';
const FROM_NAME = 'QuickPrint';

// Email template base styles
const baseStyles = `
  body { margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 32px; text-align: center; }
  .header h1 { color: white; font-size: 24px; margin: 0; }
  .content { padding: 32px; }
  .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { margin: 0; color: #9ca3af; font-size: 12px; }
  .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
  .status-processing { background: #dbeafe; color: #1d4ed8; }
  .status-ready { background: #d1fae5; color: #047857; }
  .status-completed { background: #d1fae5; color: #047857; }
  .status-cancelled { background: #fee2e2; color: #dc2626; }
  .order-details { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
  .detail-row:last-child { border-bottom: none; }
  .btn { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
`;

function wrapInTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🖨️ QuickPrint</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} QuickPrint - India's Smart Print Platform</p>
    </div>
  </div>
</body>
</html>`;
}

interface OrderDetails {
  orderNumber: string;
  fileName: string;
  copies: number;
  pages: number;
  colorType: string;
  sides: string;
  totalCost: number;
  shopName: string;
}

export const emailNotificationService = {
  /**
   * Send order confirmation email when order is created
   */
  async sendOrderCreatedEmail(
    email: string,
    name: string | null,
    orderDetails: OrderDetails
  ): Promise<void> {
    if (!env.SENDGRID_API_KEY) {
      console.log(`[Email Mock] Order Created - To: ${email}, Order: ${orderDetails.orderNumber}`);
      return;
    }

    const greeting = name ? `Hi ${name},` : 'Hi there,';
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0;">Order Confirmed! 🎉</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${greeting} Your print order has been received and is being processed.</p>
      
      <div class="order-details">
        <h3 style="margin: 0 0 16px 0; color: #111827;">Order Details</h3>
        <div class="detail-row">
          <span style="color: #6b7280;">Order Number</span>
          <span style="font-weight: 600; color: #2563eb;">${orderDetails.orderNumber}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Document</span>
          <span style="font-weight: 500;">${orderDetails.fileName}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Print Shop</span>
          <span style="font-weight: 500;">${orderDetails.shopName}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Copies × Pages</span>
          <span style="font-weight: 500;">${orderDetails.copies} × ${orderDetails.pages}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Print Type</span>
          <span style="font-weight: 500;">${orderDetails.colorType}, ${orderDetails.sides}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Total</span>
          <span style="font-weight: 700; font-size: 18px; color: #2563eb;">₹${orderDetails.totalCost.toFixed(2)}</span>
        </div>
      </div>
      
      <p style="color: #4b5563; font-size: 14px;">We'll notify you when your order is ready for pickup.</p>
    `;

    try {
      await sgMail.send({
        to: email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `Order Confirmed: ${orderDetails.orderNumber}`,
        html: wrapInTemplate(content, 'Order Confirmed'),
      });
      console.log(`[Email] Order created notification sent to: ${email}`);
    } catch (error) {
      console.error('[Email] Failed to send order created email:', error);
    }
  },

  /**
   * Send order status update email
   */
  async sendOrderStatusEmail(
    email: string,
    name: string | null,
    orderNumber: string,
    status: string,
    shopName: string
  ): Promise<void> {
    if (!env.SENDGRID_API_KEY) {
      console.log(`[Email Mock] Status Update - To: ${email}, Order: ${orderNumber}, Status: ${status}`);
      return;
    }

    const greeting = name ? `Hi ${name},` : 'Hi there,';
    
    const statusInfo: Record<string, { title: string; message: string; badge: string }> = {
      ACCEPTED: {
        title: 'Order Accepted! 📋',
        message: 'Your order has been accepted and is being prepared for printing.',
        badge: '<span class="status-badge status-processing">Processing</span>',
      },
      PRINTING: {
        title: 'Printing in Progress! 🖨️',
        message: 'Your documents are now being printed.',
        badge: '<span class="status-badge status-processing">Printing</span>',
      },
      READY: {
        title: 'Ready for Pickup! 🎉',
        message: 'Great news! Your order is ready and waiting for you at the print shop.',
        badge: '<span class="status-badge status-ready">Ready</span>',
      },
      COMPLETED: {
        title: 'Order Completed! ✅',
        message: 'Your order has been successfully completed. Thank you for using QuickPrint!',
        badge: '<span class="status-badge status-completed">Completed</span>',
      },
      CANCELLED: {
        title: 'Order Cancelled',
        message: 'Unfortunately, your order has been cancelled. If you have any questions, please contact the print shop.',
        badge: '<span class="status-badge status-cancelled">Cancelled</span>',
      },
    };

    const info = statusInfo[status];
    if (!info) return; // Don't send email for unknown statuses

    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0;">${info.title}</h2>
      ${info.badge}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 16px;">${greeting} ${info.message}</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span style="color: #6b7280;">Order Number</span>
          <span style="font-weight: 600; color: #2563eb;">${orderNumber}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Print Shop</span>
          <span style="font-weight: 500;">${shopName}</span>
        </div>
      </div>
      
      ${status === 'READY' ? `
        <p style="text-align: center; margin-top: 24px;">
          <a href="${env.FRONTEND_URL}/student/orders" class="btn">View Order Details</a>
        </p>
      ` : ''}
    `;

    try {
      await sgMail.send({
        to: email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `${info.title} - Order ${orderNumber}`,
        html: wrapInTemplate(content, info.title),
      });
      console.log(`[Email] Status update (${status}) sent to: ${email}`);
    } catch (error) {
      console.error('[Email] Failed to send status update email:', error);
    }
  },

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    email: string,
    name: string | null,
    orderNumber: string,
    amount: number,
    paymentId: string
  ): Promise<void> {
    if (!env.SENDGRID_API_KEY) {
      console.log(`[Email Mock] Payment Confirmation - To: ${email}, Order: ${orderNumber}, Amount: ₹${amount}`);
      return;
    }

    const greeting = name ? `Hi ${name},` : 'Hi there,';
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0;">Payment Successful! 💳</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${greeting} Your payment has been successfully processed.</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span style="color: #6b7280;">Order Number</span>
          <span style="font-weight: 600; color: #2563eb;">${orderNumber}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Amount Paid</span>
          <span style="font-weight: 700; font-size: 18px; color: #047857;">₹${amount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span style="color: #6b7280;">Payment ID</span>
          <span style="font-weight: 500; font-size: 12px;">${paymentId}</span>
        </div>
      </div>
      
      <p style="color: #4b5563; font-size: 14px;">This receipt confirms your payment. Keep it for your records.</p>
    `;

    try {
      await sgMail.send({
        to: email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `Payment Received: ₹${amount.toFixed(2)} for Order ${orderNumber}`,
        html: wrapInTemplate(content, 'Payment Confirmation'),
      });
      console.log(`[Email] Payment confirmation sent to: ${email}`);
    } catch (error) {
      console.error('[Email] Failed to send payment confirmation email:', error);
    }
  },

  /**
   * Helper to get user email from order
   */
  async getOrderUserEmail(orderId: string): Promise<{ email: string | null; name: string | null; orderNumber: string; shopName: string } | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, name: true } },
        shop: { select: { businessName: true } },
      },
    });

    if (!order || !order.user.email) return null;

    return {
      email: order.user.email,
      name: order.user.name,
      orderNumber: order.orderNumber,
      shopName: order.shop.businessName,
    };
  },
};
