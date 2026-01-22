import { env } from '../../../config/env.js';

interface OtpResult {
  success: boolean;
  message: string;
  otp?: string; 
}

export const phoneOtpStrategy = {
  async sendOtp(phone: string, otp: string): Promise<OtpResult> {
    if (env.USE_MOCK_OTP) {
      return this.sendMockOtp(phone, otp);
    }
    return this.sendTwilioOtp(phone, otp);
  },

  async sendMockOtp(phone: string, otp: string): Promise<OtpResult> {
    console.log(`[MOCK OTP] Phone: ${phone}, OTP: ${otp}`);
    return {
      success: true,
      message: 'OTP sent successfully (mock mode)',
      otp,
    };
  },

  async sendTwilioOtp(phone: string, otp: string): Promise<OtpResult> {
    try {
      const twilio = await import('twilio');
      
      const client = twilio.default(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: `Your QuickPrint verification code is: ${otp}. Valid for 5 minutes.`,
        from: env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      console.log(`[TWILIO] OTP sent to ${phone}`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      console.error('[TWILIO] Failed to send OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  },

  generateOtp(length: number = 4): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  },
};
