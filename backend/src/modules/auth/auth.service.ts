import { prisma } from '../../infrastructure/database/prisma.client.js';
import { env } from '../../config/env.js';
import { OTP_EXPIRY_MINUTES } from '../../config/constants.js';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import * as argon2 from 'argon2';
import { phoneOtpStrategy } from './strategies/phone-otp.strategy.js';
import { googleOAuthStrategy } from './strategies/google-oauth.strategy.js';
import { shopPublisher } from '../../events/index.js';
import type {
  PhoneInitiateInput,
  PhoneVerifyInput,
  GoogleAuthInput,
  PartnerRegisterInput,
  PartnerLoginInput,
  AuthResponse,
  AuthTokens,
} from './auth.schema.js';

function generateOtp(): string {
  return phoneOtpStrategy.generateOtp(4);
}
function generateTokens(userId: string): AuthTokens {
  const accessToken = jwt.sign({ userId, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

function parseExpiryToDate(expiry: string): Date {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return dayjs().add(7, 'day').toDate();

  const value = parseInt(match[1], 10);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const unitMap = { s: 'second', m: 'minute', h: 'hour', d: 'day' } as const;

  return dayjs().add(value, unitMap[unit]).toDate();
}

export const authService = {
 
  async initiatePhoneOTP(input: PhoneInitiateInput, isSignup = false): Promise<{ message: string }> {
    const { phone } = input;

    if (isSignup) {
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUser) {
        throw new Error('Phone number already registered. Please login instead.');
      }
    }

    const otp = generateOtp();
    const expiresAt = dayjs().add(OTP_EXPIRY_MINUTES, 'minute').toDate();

    await prisma.otpVerification.deleteMany({
      where: { phone },
    });

    await prisma.otpVerification.create({
      data: {
        phone,
        otp,
        expiresAt,
      },
    });
    const result = await phoneOtpStrategy.sendOtp(phone, otp);
    if (!result.success) {
      throw new Error(result.message);
    }

    return { message: 'OTP sent successfully' };
  },

  async verifyPhoneOTP(input: PhoneVerifyInput): Promise<AuthResponse> {
    const { phone, code, college } = input;

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone,
        otp: code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          college: college || null,
          role: 'STUDENT',
        },
      });
      console.log(`👤 New user created: ${user.id}`);
    } else if (college && !user.college) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { college },
      });
    }

    const tokens = generateTokens(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

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

  async googleAuth(input: GoogleAuthInput): Promise<AuthResponse> {
    const { idToken } = input;

    const verifyResult = await googleOAuthStrategy.verifyIdToken(idToken);
    
    if (!verifyResult.success || !verifyResult.payload) {
      throw new Error(verifyResult.error || 'Google authentication failed');
    }

    const { payload } = verifyResult;

    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: `+91${nanoid(10)}`, 
          email: payload.email,
          name: payload.name,
          role: 'STUDENT',
        },
      });
      console.log(`[Google Auth] New user created: ${user.id}`);
    }

    const tokens = generateTokens(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

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


  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    let payload: { userId: string; type: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_SECRET) as typeof payload;
    } catch {
      throw new Error('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired or revoked');
    }
    const tokens = generateTokens(payload.userId);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

    return tokens;
  },

 
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  },

  async verifyAccessToken(accessToken: string) {
    try {
      const payload = jwt.verify(accessToken, env.JWT_SECRET) as {
        userId: string;
        type: string;
      };

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch {
      throw new Error('Invalid access token');
    }
  },

  async partnerRegister(input: PartnerRegisterInput): Promise<AuthResponse> {
    const { email, password, name, phone, shopName, address } = input;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new Error('Phone number already registered');
    }

    const passwordHash = await argon2.hash(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          name,
          passwordHash,
          role: 'SHOP',
        },
      });

      const shop = await tx.shop.create({
        data: {
          ownerId: user.id,
          businessName: shopName,
          address: address,
          location: { lat: 0, lng: 0 }, 
          services: { colorPrinting: true, binding: false, lamination: false },
          pricing: { bwSingle: 2, colorSingle: 10, bwDouble: 3, colorDouble: 15 },
        },
      });

      return { user, shop };
    });

    console.log(`[Partner Registered] User: ${result.user.id}, Shop: ${result.shop.id}`);

    await shopPublisher.publishShopRegistered({
      shopId: result.shop.id,
      ownerId: result.user.id,
      businessName: result.shop.businessName,
    });
    const tokens = generateTokens(result.user.id);

    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        token: tokens.refreshToken,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

    return {
      ...tokens,
      user: {
        id: result.user.id,
        phone: result.user.phone,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        college: result.user.college,
        shopName: result.shop.businessName,
      },
    };
  },

 
  async partnerLogin(input: PartnerLoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { shop: true },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new Error('This account does not use password authentication');
    }

    if (user.role !== 'SHOP') {
      throw new Error('This login is for partners only');
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      throw new Error('Invalid email or password');
    }

    const tokens = generateTokens(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
        shopName: user.shop?.businessName,
      },
    };
  },
};
