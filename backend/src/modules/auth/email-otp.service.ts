/**
 * Email OTP Service
 * Handles email-based OTP and magic link authentication
 */

import { prisma } from '../../infrastructure/database/prisma.client.js';
import { env } from '../../config/env.js';
import { getRedisClient } from '../../infrastructure/cache/redis.client.js';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

// Constants
const OTP_LENGTH = 6;
const OTP_TTL = 300; // 5 minutes
const MAGIC_LINK_TTL = 900; // 15 minutes

function getRedis() {
  const client = getRedisClient();
  if (!client) {
    throw new Error('Redis is not connected');
  }
  return client;
}

function generateOtp(): string {
  return Math.random().toString().slice(2, 2 + OTP_LENGTH);
}

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as string,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as string,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

function parseExpiryToDate(expiry: string): Date {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [, num, unit] = match;
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] || 86400000;
  return new Date(Date.now() + parseInt(num) * ms);
}

// Email template for OTP
function otpEmailTemplate(code: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QuickPrint Verification Code</title>
</head>
<body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 32px; text-align: center;">
      <span style="color: white; font-size: 24px; font-weight: bold;">🖨️ QuickPrint</span>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="margin: 0 0 16px 0; color: #111827;">Verify Your Email</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${greeting} Use this code to verify your email. It expires in 5 minutes.</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">If you didn't request this, ignore this email.</p>
    </div>
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} QuickPrint</p>
    </div>
  </div>
</body>
</html>`;
}

// Email template for magic link
function magicLinkEmailTemplate(url: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sign in to QuickPrint</title>
</head>
<body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 32px; text-align: center;">
      <span style="color: white; font-size: 24px; font-weight: bold;">🖨️ QuickPrint</span>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="margin: 0 0 16px 0; color: #111827;">Sign In to QuickPrint</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${greeting} Click the button below to sign in. This link expires in 15 minutes.</p>
      <div style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Sign In to QuickPrint</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">If you didn't request this, ignore this email.</p>
    </div>
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} QuickPrint</p>
    </div>
  </div>
</body>
</html>`;
}

export const emailOtpService = {
  /**
   * Send OTP to email
   */
  async sendOTP(email: string): Promise<{ message: string }> {
    // Check if user exists with this email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    const code = generateOtp();
    
    // Store OTP in Redis
    await getRedis().setex(`email:otp:${email}`, OTP_TTL, code);

    // Send email (only mock if no SendGrid API key)
    if (!env.SENDGRID_API_KEY) {
      console.log(`[Email OTP Mock] To: ${email} | Code: ${code}`);
    } else {
      try {
        await sgMail.send({
          to: email,
          from: {
            email: env.SENDGRID_FROM_EMAIL || 'noreply@thequickprint.in',
            name: 'QuickPrint',
          },
          subject: `${code} is your QuickPrint verification code`,
          html: otpEmailTemplate(code, user?.name || undefined),
        });
        console.log(`[Email OTP] Sent to: ${email}`);
      } catch (error) {
        console.error('[Email OTP] Failed to send:', error);
        throw new Error('Failed to send verification email');
      }
    }

    return { message: 'Verification code sent to your email' };
  },

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(email: string, code: string, isPartner: boolean = false): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      phone: string;
      email: string | null;
      name: string | null;
      role: string;
      college: string | null;
    };
    isNewUser: boolean;
  }> {
    // Get stored OTP
    const storedCode = await getRedis().get(`email:otp:${email}`);
    
    if (!storedCode) {
      throw new Error('Verification code expired. Please request a new code.');
    }
    
    if (storedCode !== code) {
      throw new Error('Invalid verification code');
    }

    // Delete used OTP
    await getRedis().del(`email:otp:${email}`);

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { email },
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user with email
      user = await prisma.user.create({
        data: {
          phone: `email_${nanoid(8)}`, // Placeholder phone for email-only users
          email,
          authMethod: 'EMAIL_OTP',
          role: isPartner ? 'SHOP' : 'STUDENT', // Set role based on portal
        },
      });
      console.log(`[Email OTP] New user created: ${user.id}`);
    } else {
      // ROLE VALIDATION: Ensure existing user is logging into correct portal
      const expectedRole = isPartner ? 'SHOP' : 'STUDENT';
      if (user.role !== expectedRole) {
        if (user.role === 'SHOP') {
          throw new Error('This email is registered as a Partner. Please use the Partner login.');
        } else {
          throw new Error('This email is registered as a Student. Please use the Student login.');
        }
      }
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

    console.log(`[Email OTP] User authenticated: ${user.id}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
      },
      isNewUser,
    };
  },

  /**
   * Verify OTP only - does NOT create user (for signup flow)
   * Just verifies the code is correct and marks email as verified
   */
  async verifyOTPOnly(email: string, code: string): Promise<{ success: true; verified: true }> {
    const storedCode = await getRedis().get(`email:otp:${email}`);
    
    if (!storedCode) {
      throw new Error('Verification code expired. Please request a new code.');
    }
    
    if (storedCode !== code) {
      throw new Error('Invalid verification code');
    }

    // Delete used OTP
    await getRedis().del(`email:otp:${email}`);
    
    // Mark email as verified in Redis (5 minutes window for signup to complete)
    await getRedis().setex(`email:verified:${email}`, 300, 'true');
    
    console.log(`[Email OTP] Email verified (no user created): ${email}`);
    
    return { success: true, verified: true };
  },

  /**
   * Send magic link for passwordless auth
   */
  async sendMagicLink(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    const token = nanoid(32);
    
    // Store token in Redis
    await getRedis().setex(`email:magic:${token}`, MAGIC_LINK_TTL, email);

    const url = `${env.FRONTEND_URL}/auth/magic-link?token=${token}`;

    // Send email (only mock if no SendGrid API key)
    if (!env.SENDGRID_API_KEY) {
      console.log(`[Magic Link Mock] To: ${email} | URL: ${url}`);
    } else {
      try {
        await sgMail.send({
          to: email,
          from: {
            email: env.SENDGRID_FROM_EMAIL || 'noreply@thequickprint.in',
            name: 'QuickPrint',
          },
          subject: 'Sign in to QuickPrint',
          html: magicLinkEmailTemplate(url, user?.name || undefined),
        });
        console.log(`[Magic Link] Sent to: ${email}`);
      } catch (error) {
        console.error('[Magic Link] Failed to send:', error);
        throw new Error('Failed to send sign-in link');
      }
    }

    return { message: 'Sign-in link sent to your email' };
  },

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      phone: string;
      email: string | null;
      name: string | null;
      role: string;
      college: string | null;
    };
  }> {
    // Get email from token
    const email = await getRedis().get(`email:magic:${token}`);
    
    if (!email) {
      throw new Error('Sign-in link expired or invalid. Please request a new one.');
    }

    // Delete used token
    await getRedis().del(`email:magic:${token}`);

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: `email_${nanoid(8)}`,
          email,
          authMethod: 'EMAIL_OTP',
        },
      });
      console.log(`[Magic Link] New user created: ${user.id}`);
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

    console.log(`[Magic Link] User authenticated: ${user.id}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
      },
    };
  },
};
