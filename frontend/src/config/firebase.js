/**
 * Firebase Configuration
 * Used for Phone Authentication only
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get auth instance
export const auth = getAuth(app);

// Set language for phone auth
auth.languageCode = 'en';

/**
 * Setup invisible reCAPTCHA for phone auth
 * Must be called before signInWithPhoneNumber
 */
export function setupRecaptcha(containerId = 'recaptcha-container') {
    if (window.recaptchaVerifier) {
        return window.recaptchaVerifier;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
            console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
            console.log('reCAPTCHA expired');
            window.recaptchaVerifier = null;
        },
    });

    return window.recaptchaVerifier;
}

/**
 * Clear reCAPTCHA verifier
 */
export function clearRecaptcha() {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
}

export default app;
