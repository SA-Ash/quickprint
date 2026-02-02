/**
 * Firebase Configuration
 * Used for Phone Authentication with App Check (reCAPTCHA v3)
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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

// Enable App Check debug mode ONLY for localhost development
// In production (not localhost), App Check uses real reCAPTCHA v3
if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
        // Use debug token for localhost development
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = 'E01BF0D0-06AB-45FB-A4A6-356418F9918B';
    }
}

// Initialize App Check with reCAPTCHA v3
const RECAPTCHA_V3_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (RECAPTCHA_V3_SITE_KEY) {
    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
            isTokenAutoRefreshEnabled: true,
        });
        console.log('[Firebase] App Check initialized with reCAPTCHA v3');
    } catch (error) {
        console.warn('[Firebase] App Check initialization error:', error);
    }
}

// Get auth instance
export const auth = getAuth(app);

// Set language for phone auth
auth.languageCode = 'en';

/**
 * Setup reCAPTCHA verifier for phone auth
 */
export async function setupRecaptcha(containerId = 'recaptcha-container') {
    // Always clear existing verifier first to prevent "already rendered" error
    clearRecaptcha(containerId);

    // Small delay to ensure DOM is fully cleared before re-rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
            console.log('[Firebase] reCAPTCHA verified');
        },
        'expired-callback': () => {
            console.log('[Firebase] reCAPTCHA expired');
            clearRecaptcha(containerId);
        },
    });

    return window.recaptchaVerifier;
}

/**
 * Clear reCAPTCHA verifier and reset DOM element
 */
export function clearRecaptcha(containerId = 'recaptcha-container') {
    try {
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
    } catch (error) {
        console.warn('[Firebase] Error clearing reCAPTCHA verifier:', error);
        window.recaptchaVerifier = null;
    }

    // Reset the DOM element to ensure it can be re-rendered
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }

    // Also clear any grecaptcha badges that might be lingering
    const badges = document.querySelectorAll('.grecaptcha-badge');
    badges.forEach(badge => {
        if (badge.parentElement) {
            badge.parentElement.removeChild(badge);
        }
    });

    // Clear grecaptcha widgets if they exist (for v2 fallback)
    if (window.grecaptcha && window.grecaptcha.reset) {
        try {
            // Find and reset all grecaptcha widget IDs
            const recaptchaFrames = document.querySelectorAll('iframe[src*="recaptcha"]');
            recaptchaFrames.forEach(frame => {
                if (frame.parentElement) {
                    frame.parentElement.removeChild(frame);
                }
            });
        } catch (e) {
            console.warn('[Firebase] Error resetting grecaptcha:', e);
        }
    }

    // Clear any recaptcha divs created by Firebase
    const recaptchaDivs = document.querySelectorAll('[id^="recaptcha-"]');
    recaptchaDivs.forEach(div => {
        if (div.id !== containerId && div.innerHTML) {
            div.innerHTML = '';
        }
    });
}

export default app;
