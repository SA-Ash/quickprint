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
  PhonePasswordSignupInput,
  PhonePasswordLoginInput,
  EmailPasswordSignupInput,
  EmailPasswordLoginInput,
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
          location: input.location || { lat: 0, lng: 0 },
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

  async updateOtpSettings(
    userId: string,
    input: { enabled: boolean; method?: 'sms' | 'email'; email?: string }
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (!input.enabled && !user.passwordHash) {
      throw new Error('Cannot disable OTP without setting a password first');
    }
    if (input.method === 'email' && !input.email && !user.email) {
      throw new Error('Email is required for email OTP delivery');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        otpEnabled: input.enabled,
        ...(input.method && { otpMethod: input.method }),
        ...(input.email && { email: input.email }),
      },
    });

    return { success: true, message: 'OTP settings updated successfully' };
  },
  async initiateEmailOTP(email: string): Promise<{ message: string }> {
    const otp = generateOtp();
    const expiresAt = dayjs().add(OTP_EXPIRY_MINUTES, 'minute').toDate();
    await prisma.otpVerification.deleteMany({
      where: { phone: email },
    });

    await prisma.otpVerification.create({
      data: {
        phone: email,
        otp,
        expiresAt,
      },
    });

    console.log(`📧 [MOCK EMAIL] OTP for ${email}: ${otp}`);
    
    return { message: 'OTP sent to email successfully' };
  },

  async verifyEmailOTP(email: string, code: string): Promise<AuthResponse> {
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone: email, 
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
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
        otpEnabled: user.otpEnabled,
        otpMethod: user.otpMethod,
        hasPassword: !!user.passwordHash,
        hasGoogleLinked: !!user.googleId,
      },
    };
  },

  async setPassword(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    const passwordHash = await argon2.hash(password);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password set successfully' };
  },

  async generateBackupCodes(userId: string): Promise<{ codes: string[] }> {
    const codes = Array.from({ length: 8 }, () => 
      nanoid(6).toUpperCase()
    );

    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: codes },
    });

    return { codes };
  },

  async getBackupCodes(userId: string): Promise<{ codes: string[] }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });

    return { codes: user?.backupCodes || [] };
  },

  async linkGoogleAccount(userId: string, idToken: string): Promise<{ success: boolean; message: string }> {

    console.log(`[MOCK GOOGLE] Linking Google account for user ${userId} with token: ${idToken.substring(0, 20)}...`);
    
    const mockGoogleId = `google_${nanoid(16)}`;

    await prisma.user.update({
      where: { id: userId },
      data: { googleId: mockGoogleId },
    });

    return { success: true, message: 'Google account linked successfully' };
  },


  async phonePasswordSignup(input: PhonePasswordSignupInput): Promise<AuthResponse> {
    const { phone, password, name, college } = input;

    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new Error('Phone number already registered. Please login instead.');
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        name,
        college: college || null,
        role: 'STUDENT',
        authMethod: 'PHONE_PASSWORD',
        otpEnabled: false,
      },
    });

    console.log(`[Phone Password Signup] New user created: ${user.id}`);

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
        authMethod: user.authMethod,
        hasPassword: true,
      },
    };
  },

  async phonePasswordLogin(input: PhonePasswordLoginInput): Promise<AuthResponse> {
    const { phone, password } = input;

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new Error('Phone number not registered. Please signup first.');
    }

    if (!user.passwordHash) {
      throw new Error('Password not set for this account. Please use OTP login.');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
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
        authMethod: user.authMethod,
        hasPassword: true,
      },
    };
  },

  async emailPasswordSignup(input: EmailPasswordSignupInput): Promise<AuthResponse> {
    const { email, password, name, college } = input;

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered. Please login instead.');
    }

    const passwordHash = await argon2.hash(password);

    // Generate a placeholder phone number for email-only users
    const placeholderPhone = `+91${nanoid(10).replace(/[^0-9]/g, '0').substring(0, 10)}`;

    const user = await prisma.user.create({
      data: {
        phone: placeholderPhone,
        email,
        passwordHash,
        name,
        college: college || null,
        role: 'STUDENT',
        authMethod: 'EMAIL_PASSWORD',
        otpEnabled: false,
      },
    });

    console.log(`[Email Password Signup] New user created: ${user.id}`);

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
        authMethod: user.authMethod,
        hasPassword: true,
      },
    };
  },

  async emailPasswordLogin(input: EmailPasswordLoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Email not registered. Please signup first.');
    }

    if (!user.passwordHash) {
      throw new Error('Password not set for this account. Please use OTP login.');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
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
        authMethod: user.authMethod,
        hasPassword: true,
      },
    };
  },

  // ============================================
  // PARTNER 2FA REGISTRATION FLOW
  // ============================================

  /**
   * Step 1: Initiate partner registration - stores pending data and sends OTP
   */
  async initiatePartnerRegistration(input: PartnerRegisterInput): Promise<{ message: string; phone: string }> {
    const { email, password, name, phone, shopName, address } = input;

    // Check if email/phone already registered
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      throw new Error(existingUser.email === email ? 'Email already registered' : 'Phone number already registered');
    }

    // Check for existing pending registration
    await prisma.pendingPartnerRegistration.deleteMany({
      where: { OR: [{ email }, { phone }] },
    });

    const passwordHash = await argon2.hash(password);
    const expiresAt = dayjs().add(30, 'minute').toDate(); // Registration expires in 30 min

    // Store pending registration
    await prisma.pendingPartnerRegistration.create({
      data: {
        email,
        phone,
        passwordHash,
        name,
        shopName,
        address: address as any,
        location: input.location || { lat: 0, lng: 0 },
        phoneVerified: false,
        emailVerified: false,
        expiresAt,
      },
    });

    // Generate and send OTP
    const otp = phoneOtpStrategy.generateOtp(4);
    const otpExpiresAt = dayjs().add(5, 'minute').toDate();

    await prisma.otpVerification.deleteMany({ where: { phone } });
    await prisma.otpVerification.create({
      data: { phone, otp, expiresAt: otpExpiresAt },
    });

    const result = await phoneOtpStrategy.sendOtp(phone, otp);
    if (!result.success) {
      throw new Error(result.message);
    }

    console.log(`[Partner 2FA] Step 1: OTP sent to ${phone}`);

    return { 
      message: 'OTP sent to your phone. Please verify to continue.', 
      phone 
    };
  },

  /**
   * Step 2: Verify phone OTP and send magic link email
   */
  async verifyPartnerOTP(input: { phone: string; code: string }): Promise<{ message: string; email: string }> {
    const { phone, code } = input;

    // Verify OTP
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

    // Find pending registration
    const pending = await prisma.pendingPartnerRegistration.findUnique({
      where: { phone },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new Error('Registration expired. Please start again.');
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Mark phone as verified and generate email token
    const emailToken = nanoid(32);
    const emailExpiresAt = dayjs().add(15, 'minute').toDate();

    await prisma.pendingPartnerRegistration.update({
      where: { phone },
      data: {
        phoneVerified: true,
        emailToken,
      },
    });

    // Store email verification record
    await prisma.emailVerification.create({
      data: {
        email: pending.email,
        token: emailToken,
        type: 'partner_register',
        expiresAt: emailExpiresAt,
      },
    });

    // Generate magic link
    const magicLink = `${env.FRONTEND_URL || 'http://localhost:5173'}/partner/verify-email?token=${emailToken}`;

    // TODO: Send actual email - for now log it
    console.log(`[Partner 2FA] Step 2: Magic link for ${pending.email}: ${magicLink}`);
    console.log(`[MAGIC LINK] ${magicLink}`);

    return { 
      message: 'Phone verified! Please check your email for the verification link.', 
      email: pending.email 
    };
  },

  /**
   * Step 3: Verify email magic link and complete registration
   */
  async completePartnerRegistration(token: string): Promise<AuthResponse> {
    // Find email verification record
    const emailVerification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!emailVerification || emailVerification.expiresAt < new Date() || emailVerification.verified) {
      throw new Error('Invalid or expired verification link');
    }

    // Find pending registration
    const pending = await prisma.pendingPartnerRegistration.findFirst({
      where: { 
        emailToken: token,
        phoneVerified: true,
      },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new Error('Registration expired. Please start again.');
    }

    // Mark email as verified
    await prisma.emailVerification.update({
      where: { id: emailVerification.id },
      data: { verified: true },
    });

    // Create user and shop in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: pending.email,
          phone: pending.phone,
          name: pending.name,
          passwordHash: pending.passwordHash,
          role: 'SHOP',
        },
      });

      const shop = await tx.shop.create({
        data: {
          ownerId: user.id,
          businessName: pending.shopName,
          address: pending.address as any,
          location: pending.location || { lat: 0, lng: 0 },
          services: { colorPrinting: true, binding: false, lamination: false },
          pricing: { bwSingle: 2, colorSingle: 10, bwDouble: 3, colorDouble: 15 },
        },
      });

      return { user, shop };
    });

    // Clean up pending registration
    await prisma.pendingPartnerRegistration.delete({
      where: { id: pending.id },
    });

    console.log(`[Partner 2FA] Step 3: Registration complete! User: ${result.user.id}, Shop: ${result.shop.id}`);

    // Publish event
    await shopPublisher.publishShopRegistered({
      shopId: result.shop.id,
      ownerId: result.user.id,
      businessName: result.shop.businessName,
    });

    // Generate tokens
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

  /**
   * Resend OTP for partner registration
   */
  async resendPartnerOTP(phone: string): Promise<{ message: string }> {
    const pending = await prisma.pendingPartnerRegistration.findUnique({
      where: { phone },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new Error('No pending registration found. Please start again.');
    }

    if (pending.phoneVerified) {
      throw new Error('Phone already verified. Check your email for the verification link.');
    }

    // Generate new OTP
    const otp = phoneOtpStrategy.generateOtp(4);
    const otpExpiresAt = dayjs().add(5, 'minute').toDate();

    await prisma.otpVerification.deleteMany({ where: { phone } });
    await prisma.otpVerification.create({
      data: { phone, otp, expiresAt: otpExpiresAt },
    });

    const result = await phoneOtpStrategy.sendOtp(phone, otp);
    if (!result.success) {
      throw new Error(result.message);
    }

    return { message: 'OTP resent successfully' };
  },

  // Firebase Phone Auth - verify token and return app JWT
  async verifyFirebaseToken(idToken: string, isSignup = false): Promise<AuthResponse> {
    // Import Firebase admin dynamically
    const { verifyFirebaseToken: verifyToken } = await import('../../config/firebase.js');
    
    // Verify the Firebase ID token
    const decodedToken = await verifyToken(idToken);
    const phone = decodedToken.phone_number;
    
    if (!phone) {
      throw new Error('Phone number not found in Firebase token');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (isSignup) {
      // Signup flow
      if (user) {
        throw new Error('User with this phone already registered');
      }
      
      user = await prisma.user.create({
        data: {
          phone,
          role: 'STUDENT',
          name: phone, // Default name, can be updated later
          authMethod: 'PHONE_OTP',
        },
      });
    } else {
      // Login flow
      if (!user) {
        throw new Error('User not found. Please sign up first.');
      }
    }

    const tokens = generateTokens(user.id);
    
    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
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
        role: user.role as 'STUDENT' | 'PARTNER' | 'ADMIN',
        college: user.college,
      },
    };
  },
};
