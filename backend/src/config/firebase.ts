// Firebase Admin SDK for backend token verification
import admin from 'firebase-admin';
import { env } from './env.js';

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase is configured
  if (!env.FIREBASE_PROJECT_ID) {
    console.warn('[Firebase] Not configured - skipping initialization');
    return null as unknown as admin.app.App;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase] Admin SDK initialized');
  } catch (error) {
    console.error('[Firebase] Failed to initialize:', error);
    throw error;
  }

  return firebaseApp;
};

export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new Error('Firebase not configured');
  }

  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
};

export const getFirebaseApp = (): admin.app.App | null => firebaseApp;
