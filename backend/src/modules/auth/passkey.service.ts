/**
 * Passkey (WebAuthn) Service
 * Handles registration and authentication using passkeys
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { prisma } from '../../infrastructure/database/prisma.client.js';
import { env } from '../../config/env.js';
import { getRedisClient } from '../../infrastructure/cache/redis.client.js';

// Helper to get Redis client with null safety
function getRedis() {
  const client = getRedisClient();
  if (!client) {
    throw new Error('Redis is not connected');
  }
  return client;
}
import jwt from 'jsonwebtoken';

// Relying Party configuration
const rpName = env.RP_NAME || 'QuickPrint';
const rpID = env.RP_ID || 'localhost';
const origin = env.RP_ORIGIN || `http://localhost:5173`;

// Challenge TTL (5 minutes)
const CHALLENGE_TTL = 300;

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
  return { accessToken, refreshToken };
}

function parseExpiryToDate(expiry: string): Date {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [, num, unit] = match;
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] || 86400000;
  return new Date(Date.now() + parseInt(num) * ms);
}

export const passkeyService = {
  /**
   * Generate registration options for creating a new passkey
   */
  async generateRegistrationOptions(userId: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get existing credentials to exclude
    const excludeCredentials = user.passkeys.map((passkey) => ({
      id: passkey.credentialId,
      type: 'public-key' as const,
      transports: passkey.transports as AuthenticatorTransportFuture[],
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(userId),
      userName: user.phone,
      userDisplayName: user.name || user.phone,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    // Store challenge in Redis for verification
    await getRedis().setex(
      `passkey:challenge:${userId}`,
      CHALLENGE_TTL,
      options.challenge
    );

    return options;
  },

  /**
   * Verify registration response and store the credential
   */
  async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON
  ): Promise<{ success: boolean; credentialId: string }> {
    // Get stored challenge
    const expectedChallenge = await getRedis().get(`passkey:challenge:${userId}`);
    if (!expectedChallenge) {
      throw new Error('Registration challenge expired. Please try again.');
    }

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error('[Passkey] Registration verification failed:', error);
      throw new Error('Passkey registration failed');
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('Passkey verification failed');
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Store credential in database
    const passkey = await prisma.passkeyCredential.create({
      data: {
        credentialId: Buffer.from(credential.id),
        userId,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: response.response.transports || [],
      },
    });

    // Update user auth method if first passkey
    const passkeyCount = await prisma.passkeyCredential.count({
      where: { userId },
    });
    if (passkeyCount === 1) {
      await prisma.user.update({
        where: { id: userId },
        data: { authMethod: 'PASSKEY' },
      });
    }

    // Clean up challenge
    await getRedis().del(`passkey:challenge:${userId}`);

    console.log(`[Passkey] Registered new credential for user: ${userId}`);

    return { success: true, credentialId: passkey.id };
  },

  /**
   * Generate authentication options for logging in with passkey
   */
  async generateAuthenticationOptions(
    phone?: string
  ): Promise<PublicKeyCredentialRequestOptionsJSON & { userId?: string }> {
    let allowCredentials: { id: Uint8Array; type: 'public-key'; transports?: AuthenticatorTransportFuture[] }[] = [];
    let userId: string | undefined;

    if (phone) {
      // User specified - get their credentials
      const user = await prisma.user.findUnique({
        where: { phone },
        include: { passkeys: true },
      });

      if (!user || user.passkeys.length === 0) {
        throw new Error('No passkeys registered for this account');
      }

      userId = user.id;
      allowCredentials = user.passkeys.map((passkey) => ({
        id: new Uint8Array(passkey.credentialId),
        type: 'public-key' as const,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store challenge in Redis
    const challengeKey = userId 
      ? `passkey:auth:${userId}` 
      : `passkey:auth:discoverable:${options.challenge}`;
    
    await getRedis().setex(challengeKey, CHALLENGE_TTL, options.challenge);

    return { ...options, userId };
  },

  /**
   * Verify authentication response and issue tokens
   */
  async verifyAuthentication(
    response: AuthenticationResponseJSON,
    userId?: string
  ): Promise<{
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
    // Find the credential
    const credentialIdBuffer = Buffer.from(response.id, 'base64url');
    
    const passkey = await prisma.passkeyCredential.findUnique({
      where: { credentialId: credentialIdBuffer },
      include: { user: true },
    });

    if (!passkey) {
      throw new Error('Passkey not found');
    }

    // Get stored challenge
    const challengeKey = userId
      ? `passkey:auth:${userId}`
      : `passkey:auth:discoverable:${response.response.clientDataJSON}`;
    
    // For discoverable credentials, we need to find the challenge differently
    let expectedChallenge: string | null = null;
    
    if (userId) {
      expectedChallenge = await getRedis().get(`passkey:auth:${userId}`);
    } else {
      // Try to find by scanning (not ideal, but works for discoverable)
      const keys = await getRedis().keys('passkey:auth:discoverable:*');
      for (const key of keys) {
        const challenge = await getRedis().get(key);
        if (challenge) {
          expectedChallenge = challenge;
          break;
        }
      }
    }

    if (!expectedChallenge) {
      throw new Error('Authentication challenge expired. Please try again.');
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: new Uint8Array(passkey.credentialId),
          publicKey: new Uint8Array(passkey.publicKey),
          counter: passkey.counter,
          transports: passkey.transports as AuthenticatorTransportFuture[],
        },
      });
    } catch (error) {
      console.error('[Passkey] Authentication verification failed:', error);
      throw new Error('Passkey authentication failed');
    }

    if (!verification.verified) {
      throw new Error('Passkey verification failed');
    }

    // Update counter
    await prisma.passkeyCredential.update({
      where: { id: passkey.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    // Clean up challenge
    if (userId) {
      await getRedis().del(`passkey:auth:${userId}`);
    }

    // Generate tokens
    const tokens = generateTokens(passkey.user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: passkey.user.id,
        expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRY),
      },
    });

    console.log(`[Passkey] User authenticated: ${passkey.user.id}`);

    return {
      ...tokens,
      user: {
        id: passkey.user.id,
        phone: passkey.user.phone,
        email: passkey.user.email,
        name: passkey.user.name,
        role: passkey.user.role,
        college: passkey.user.college,
      },
    };
  },

  /**
   * List all passkeys for a user
   */
  async listPasskeys(userId: string) {
    const passkeys = await prisma.passkeyCredential.findMany({
      where: { userId },
      select: {
        id: true,
        deviceType: true,
        backedUp: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return passkeys;
  },

  /**
   * Delete a passkey
   */
  async deletePasskey(userId: string, passkeyId: string) {
    const passkey = await prisma.passkeyCredential.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new Error('Passkey not found');
    }

    // Ensure user has at least one passkey or another auth method
    const passkeyCount = await prisma.passkeyCredential.count({
      where: { userId },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (passkeyCount === 1 && !user?.passwordHash) {
      throw new Error('Cannot delete last passkey without a password set');
    }

    await prisma.passkeyCredential.delete({
      where: { id: passkeyId },
    });

    console.log(`[Passkey] Deleted credential: ${passkeyId} for user: ${userId}`);

    return { success: true };
  },
};
