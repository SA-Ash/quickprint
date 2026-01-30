/**
 * Firebase Admin SDK Integration
 * Used for verifying Firebase Phone Auth tokens on the backend
 */

import * as admin from 'firebase-admin';
import { env } from '../../config/env.js';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for credentials
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase is configured
  if (!env.FIREBASE_PROJECT_ID) {
    console.warn('[Firebase] Firebase Admin SDK not configured - phone auth will not work');
    return null as any;
  }

  try {
    // Initialize with service account credentials from env
    const serviceAccount: admin.ServiceAccount = {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Handle escaped newlines in private key
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID,
    });

    console.log('[Firebase] Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('[Firebase] Failed to initialize Admin SDK:', error);
    throw error;
  }
}

/**
 * Verify Firebase ID token from phone authentication
 * @param idToken - Firebase ID token from client
 * @returns Decoded token with user info (uid, phone_number, etc.)
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const app = initializeFirebaseAdmin();
  
  if (!app) {
    throw new Error('Firebase Admin SDK not configured');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('[Firebase] Token verification failed:', error.message);
    throw new Error('Invalid or expired Firebase token');
  }
}

/**
 * Get user by phone number from Firebase
 * @param phoneNumber - E.164 formatted phone number
 */
export async function getFirebaseUserByPhone(phoneNumber: string): Promise<admin.auth.UserRecord | null> {
  const app = initializeFirebaseAdmin();
  
  if (!app) {
    return null;
  }

  try {
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if Firebase Admin is configured and ready
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    env.FIREBASE_PRIVATE_KEY
  );
}

export default {
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  getFirebaseUserByPhone,
  isFirebaseConfigured,
};
