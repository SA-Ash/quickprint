/**
 * Firebase Admin SDK Configuration
 * Used for verifying Firebase ID tokens on the backend
 */

import admin from 'firebase-admin';
import { env } from '../../config/env.js';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase config is available
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    console.warn('[Firebase Admin] Missing configuration. Phone auth token verification will be disabled.');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        // Private key comes with escaped newlines, need to replace them
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase Admin] Initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
    return null;
  }
}

// Initialize on module load
initializeFirebaseAdmin();

/**
 * Verify a Firebase ID token
 * @param idToken - The Firebase ID token from the client
 * @returns Decoded token with user info, or null if verification fails
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!firebaseApp) {
    console.error('[Firebase Admin] Not initialized, cannot verify token');
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('[Firebase Admin] Token verification failed:', error);
    return null;
  }
}

/**
 * Check if Firebase Admin is configured and ready
 */
export function isFirebaseConfigured(): boolean {
  return firebaseApp !== null;
}
