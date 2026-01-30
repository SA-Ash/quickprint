/**
 * Email Templates - Professional QuickPrint branded HTML templates
 */

// Brand colors
const BRAND_PRIMARY = '#7c3aed'; // Purple
const BRAND_SECONDARY = '#06b6d4'; // Cyan
const BRAND_GRADIENT = 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)';

// Base template wrapper
function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuickPrint</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
    .mso-padding {padding: 20px;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  
  <!-- Main Container -->
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: ${BRAND_GRADIENT}; padding: 32px; text-align: center;">
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="vertical-align: middle;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9V2h12v7" stroke="white" stroke-width="2" fill="none"/>
                      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="white" stroke-width="2" fill="none"/>
                      <rect x="6" y="14" width="12" height="8" rx="1" stroke="white" stroke-width="2" fill="none"/>
                    </svg>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="color: white; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">QuickPrint</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                      © ${new Date().getFullYear()} QuickPrint. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Your trusted campus printing partner.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Button component
function button(text: string, url: string, color: string = BRAND_PRIMARY): string {
  return `
    <table role="presentation" style="margin: 24px 0;">
      <tr>
        <td style="background: ${color}; border-radius: 8px; padding: 14px 28px;">
          <a href="${url}" style="color: white; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">${text}</a>
        </td>
      </tr>
    </table>
  `;
}

// OTP Code display
function otpDisplay(code: string): string {
  return `
    <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
      <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: ${BRAND_PRIMARY};">${code}</p>
    </div>
  `;
}

// Order status badge
function statusBadge(status: string, color: string): string {
  return `<span style="display: inline-block; background: ${color}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">${status}</span>`;
}

// Order details table
function orderDetails(details: { orderNumber: string; items?: string; totalCost?: number; shopName?: string }): string {
  return `
    <table role="presentation" style="width: 100%; background: #f9fafb; border-radius: 8px; margin: 24px 0;">
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-size: 14px;">Order Number</span><br>
          <span style="font-size: 18px; font-weight: 600; color: #111827;">${details.orderNumber}</span>
        </td>
      </tr>
      ${details.shopName ? `
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-size: 14px;">Print Shop</span><br>
          <span style="font-size: 16px; color: #111827;">${details.shopName}</span>
        </td>
      </tr>` : ''}
      ${details.totalCost ? `
      <tr>
        <td style="padding: 16px 20px;">
          <span style="color: #6b7280; font-size: 14px;">Total Amount</span><br>
          <span style="font-size: 20px; font-weight: bold; color: ${BRAND_PRIMARY};">₹${details.totalCost}</span>
        </td>
      </tr>` : ''}
    </table>
  `;
}

// ============================================
// TEMPLATE EXPORTS
// ============================================

export const emailTemplates = {
  /**
   * OTP Verification Email
   */
  otp(code: string, name?: string): string {
    const greeting = name ? `Hi ${name},` : 'Hi there,';
    const content = `
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Verify Your Email</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${greeting} Use the code below to verify your email address. This code expires in <strong>5 minutes</strong>.
      </p>
      ${otpDisplay(code)}
      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    `;
    return baseTemplate(content, `Your QuickPrint verification code is ${code}`);
  },

  /**
   * Magic Link Email
   */
  magicLink(url: string, name?: string): string {
    const greeting = name ? `Hi ${name},` : 'Hi there,';
    const content = `
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Sign In to QuickPrint</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
        ${greeting} Click the button below to securely sign in to your account. This link expires in <strong>15 minutes</strong>.
      </p>
      ${button('Sign In to QuickPrint', url)}
      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
        If you didn't request this, you can safely ignore this email. Someone may have entered your email by mistake.
      </p>
    `;
    return baseTemplate(content, 'Click to sign in to QuickPrint');
  },

  /**
   * Welcome Email
   */
  welcome(name: string, isPartner: boolean = false): string {
    const content = `
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Welcome to QuickPrint! 🎉</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${name}, your account has been created successfully. ${isPartner 
          ? "You're now ready to start receiving print orders from students in your area." 
          : "You can now order prints from nearby shops and skip the queues!"}
      </p>
      <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: ${BRAND_PRIMARY}; font-size: 18px;">Quick Start Guide</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
          ${isPartner ? `
          <li style="margin-bottom: 8px;">Set up your shop profile and pricing</li>
          <li style="margin-bottom: 8px;">Configure your operating hours</li>
          <li style="margin-bottom: 0;">Start accepting orders!</li>
          ` : `
          <li style="margin-bottom: 8px;">Upload your documents</li>
          <li style="margin-bottom: 8px;">Choose a nearby print shop</li>
          <li style="margin-bottom: 0;">Get notified when your prints are ready!</li>
          `}
        </ul>
      </div>
      ${button('Go to Dashboard', isPartner ? 'https://thequickprint.in/partner' : 'https://thequickprint.in/student')}
    `;
    return baseTemplate(content, `Welcome to QuickPrint, ${name}!`);
  },

  /**
   * New Order (for shop owner)
   */
  orderCreated(details: { orderNumber: string; customerName?: string; totalCost: number }): string {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        ${statusBadge('NEW ORDER', '#10b981')}
      </div>
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; text-align: center;">You Have a New Order! 📄</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        A customer has placed a new print order. Please review and confirm.
      </p>
      ${orderDetails({ orderNumber: details.orderNumber, totalCost: details.totalCost })}
      ${button('View Order Details', `https://thequickprint.in/partner/orders/${details.orderNumber}`)}
    `;
    return baseTemplate(content, `New order ${details.orderNumber} received!`);
  },

  /**
   * Order Confirmed (for customer)
   */
  orderConfirmed(details: { orderNumber: string; shopName: string; totalCost: number; estimatedTime?: string }): string {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        ${statusBadge('CONFIRMED', '#3b82f6')}
      </div>
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; text-align: center;">Order Confirmed! ✅</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        Great news! Your order has been confirmed by the print shop.
      </p>
      ${orderDetails({ orderNumber: details.orderNumber, shopName: details.shopName, totalCost: details.totalCost })}
      ${details.estimatedTime ? `
      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        Estimated ready time: <strong>${details.estimatedTime}</strong>
      </p>` : ''}
      ${button('Track Order', `https://thequickprint.in/student/orders/${details.orderNumber}`)}
    `;
    return baseTemplate(content, `Order ${details.orderNumber} confirmed by ${details.shopName}`);
  },

  /**
   * Order Ready (for customer)
   */
  orderReady(details: { orderNumber: string; shopName: string; shopAddress?: string }): string {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        ${statusBadge('READY FOR PICKUP', '#10b981')}
      </div>
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; text-align: center;">Your Prints Are Ready! 🎉</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        Your order is ready for pickup at <strong>${details.shopName}</strong>.
      </p>
      ${orderDetails({ orderNumber: details.orderNumber, shopName: details.shopName })}
      ${details.shopAddress ? `
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Pickup Location</p>
        <p style="margin: 0; color: #111827; font-size: 16px;">${details.shopAddress}</p>
      </div>` : ''}
    `;
    return baseTemplate(content, `Order ${details.orderNumber} is ready for pickup!`);
  },

  /**
   * Order Cancelled
   */
  orderCancelled(details: { orderNumber: string; reason?: string; refundAmount?: number }): string {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        ${statusBadge('CANCELLED', '#ef4444')}
      </div>
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; text-align: center;">Order Cancelled</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        Unfortunately, your order has been cancelled.
      </p>
      ${orderDetails({ orderNumber: details.orderNumber })}
      ${details.reason ? `
      <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 4px 0; color: #991b1b; font-size: 14px; font-weight: 600;">Reason</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 14px;">${details.reason}</p>
      </div>` : ''}
      ${details.refundAmount ? `
      <p style="text-align: center; color: #059669; font-size: 16px; font-weight: 600;">
        ₹${details.refundAmount} will be refunded within 5-7 business days.
      </p>` : ''}
      ${button('Browse Print Shops', 'https://thequickprint.in/student', '#6b7280')}
    `;
    return baseTemplate(content, `Order ${details.orderNumber} has been cancelled`);
  },

  /**
   * Payment Success Receipt
   */
  paymentSuccess(details: { orderNumber: string; amount: number; paymentId: string; date: Date }): string {
    const formattedDate = details.date.toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        ${statusBadge('PAYMENT SUCCESSFUL', '#10b981')}
      </div>
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; text-align: center;">Payment Received! 💳</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        Thank you for your payment. Here's your receipt.
      </p>
      
      <table role="presentation" style="width: 100%; background: #f9fafb; border-radius: 8px; margin: 24px 0;">
        <tr>
          <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 14px;">Order Number</span><br>
            <span style="font-size: 16px; font-weight: 600; color: #111827;">${details.orderNumber}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 14px;">Amount Paid</span><br>
            <span style="font-size: 24px; font-weight: bold; color: ${BRAND_PRIMARY};">₹${details.amount}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 14px;">Transaction ID</span><br>
            <span style="font-size: 14px; font-family: monospace; color: #111827;">${details.paymentId}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 20px;">
            <span style="color: #6b7280; font-size: 14px;">Date & Time</span><br>
            <span style="font-size: 14px; color: #111827;">${formattedDate}</span>
          </td>
        </tr>
      </table>
      
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 24px;">
        This is your official payment receipt. Keep it for your records.
      </p>
    `;
    return baseTemplate(content, `Payment receipt for order ${details.orderNumber}`);
  },
};

export type EmailTemplateType = keyof typeof emailTemplates;
