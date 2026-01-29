// Firebase configuration for frontend
// Get these values from Firebase Console -> Project Settings -> Your apps -> Web app

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Disable app verification for testing in development mode
// WARNING: Remove this or set to false in production!
if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
  auth.settings.appVerificationDisabledForTesting = true;
  console.log('⚠️ Firebase app verification disabled for testing');
}

// Setup reCAPTCHA verifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

// Initialize reCAPTCHA - must be called before sending OTP
// Pass the ID of the button that triggers sign-in (e.g., 'send-otp-button')
export const setupRecaptcha = (buttonId: string = 'send-otp-button'): RecaptchaVerifier => {
  // Clear existing verifier if present
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.log('Error clearing reCAPTCHA:', e);
    }
    recaptchaVerifier = null;
  }
  
  // Create new invisible reCAPTCHA attached to the button
  recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, can proceed with phone auth
      console.log('reCAPTCHA invisible challenge solved!');
    },
    'expired-callback': () => {
      // Response expired, user needs to solve again
      console.log('reCAPTCHA response expired. Please try again.');
      // Reset the verifier
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {
          console.log('Error clearing expired reCAPTCHA:', e);
        }
        recaptchaVerifier = null;
      }
    }
  });
  
  return recaptchaVerifier;
};

// Get existing verifier or create new one
export const getRecaptchaVerifier = (buttonId: string = 'send-otp-button'): RecaptchaVerifier => {
  if (!recaptchaVerifier) {
    return setupRecaptcha(buttonId);
  }
  return recaptchaVerifier;
};

// Clear the reCAPTCHA verifier
export const clearRecaptcha = (): void => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.log('Error clearing reCAPTCHA:', e);
    }
    recaptchaVerifier = null;
  }
};

export const sendOtp = async (phoneNumber: string): Promise<ConfirmationResult> => {
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized. Call setupRecaptcha first.');
  }
  
  const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
  return confirmationResult;
};

export const verifyOtp = async (confirmationResult: ConfirmationResult, otp: string): Promise<string> => {
  const userCredential = await confirmationResult.confirm(otp);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

export type { ConfirmationResult };
