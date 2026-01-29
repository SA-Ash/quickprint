// Firebase configuration for frontend
// Get these values from Firebase Console -> Project Settings -> Your apps -> Web app

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

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

// Disable app verification for testing (remove in production)
// auth.settings.appVerificationDisabledForTesting = true;

// Setup reCAPTCHA verifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const setupRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    },
  });
  
  return recaptchaVerifier;
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

export { RecaptchaVerifier, ConfirmationResult };
