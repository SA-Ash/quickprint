/**
 * Phone Authentication Service
 * Uses Firebase Phone Auth for SMS OTP
 */

import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, setupRecaptcha, clearRecaptcha } from '../config/firebase';
import apiClient from './api';

// Store verification ID for OTP verification
let verificationId = null;
let confirmationResult = null;

/**
 * Check if Firebase Phone Auth is configured
 */
const isConfigured = () => {
    return Boolean(
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
};

/**
 * Format phone number to E.164 format for Firebase
 * @param {string} phone - Phone number (can be 10 digits or with country code)
 * @returns {string} - E.164 formatted phone number
 */
const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If 10 digits, assume Indian number and add +91
    if (digits.length === 10) {
        return `+91${digits}`;
    }

    // If already has country code (11+ digits), add +
    if (digits.length > 10 && !phone.startsWith('+')) {
        return `+${digits}`;
    }

    // Already formatted
    return phone.startsWith('+') ? phone : `+${digits}`;
};

/**
 * Send OTP to phone number using Firebase
 * @param {string} phoneNumber - Phone number to send OTP to
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendPhoneOTP = async (phoneNumber) => {
    if (!isConfigured()) {
        throw new Error('Firebase Phone Auth is not configured. Please add Firebase credentials.');
    }

    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        console.log('[PhoneAuth] Sending OTP to:', formattedPhone);

        // Setup reCAPTCHA
        const recaptchaVerifier = setupRecaptcha('recaptcha-container');

        // Send OTP via Firebase
        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        verificationId = confirmationResult.verificationId;

        console.log('[PhoneAuth] OTP sent successfully');
        return {
            success: true,
            message: `OTP sent to ${formattedPhone}`,
            verificationId,
        };
    } catch (error) {
        console.error('[PhoneAuth] Send OTP error:', error);
        clearRecaptcha();

        // Handle specific Firebase errors
        const errorMessages = {
            'auth/invalid-phone-number': 'Invalid phone number format',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/quota-exceeded': 'SMS quota exceeded. Please try again tomorrow.',
            'auth/operation-not-allowed': 'Phone authentication is not enabled in Firebase',
            'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
        };

        throw new Error(errorMessages[error.code] || error.message || 'Failed to send OTP');
    }
};

/**
 * Verify OTP and get Firebase credential
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, user: object, idToken: string}>}
 */
export const verifyPhoneOTP = async (otp) => {
    if (!confirmationResult && !verificationId) {
        throw new Error('No pending verification. Please request a new OTP.');
    }

    try {
        console.log('[PhoneAuth] Verifying OTP...');

        let userCredential;

        if (confirmationResult) {
            // Use confirmation result directly
            userCredential = await confirmationResult.confirm(otp);
        } else {
            // Use verification ID to create credential
            const credential = PhoneAuthProvider.credential(verificationId, otp);
            userCredential = await signInWithCredential(auth, credential);
        }

        const user = userCredential.user;
        const idToken = await user.getIdToken();

        console.log('[PhoneAuth] OTP verified successfully');

        // Clear state
        clearRecaptcha();
        verificationId = null;
        confirmationResult = null;

        return {
            success: true,
            user: {
                uid: user.uid,
                phoneNumber: user.phoneNumber,
            },
            idToken,
        };
    } catch (error) {
        console.error('[PhoneAuth] Verify OTP error:', error);

        const errorMessages = {
            'auth/invalid-verification-code': 'Invalid OTP. Please try again.',
            'auth/code-expired': 'OTP has expired. Please request a new one.',
            'auth/session-expired': 'Session expired. Please request a new OTP.',
        };

        throw new Error(errorMessages[error.code] || error.message || 'Failed to verify OTP');
    }
};

/**
 * Login with phone OTP - verifies with backend and returns JWT
 * @param {string} otp - 6-digit OTP
 * @param {object} userData - Additional user data (name, college for student)
 * @returns {Promise<{user: object, token: string}>}
 */
export const loginWithPhone = async (otp, userData = {}) => {
    // First verify OTP with Firebase
    const { idToken, user: firebaseUser } = await verifyPhoneOTP(otp);

    // Then verify with backend and get our JWT
    const response = await apiClient.post('/auth/phone/verify-token', {
        idToken,
        phoneNumber: firebaseUser.phoneNumber,
        ...userData,
    });

    return response;
};

/**
 * Signup with phone verification (Step 1 of 2FA)
 * @param {string} phoneNumber 
 * @returns {Promise<{success: boolean, verificationId: string}>}
 */
export const initiatePhoneSignup = async (phoneNumber) => {
    return sendPhoneOTP(phoneNumber);
};

/**
 * Verify phone and proceed to email verification (Step 2 of 2FA)
 * @param {string} otp 
 * @param {object} signupData - User signup data
 * @returns {Promise<{success: boolean, pendingEmailVerification: boolean}>}
 */
export const verifyPhoneForSignup = async (otp, signupData) => {
    // Verify phone OTP with Firebase
    const { idToken, user: firebaseUser } = await verifyPhoneOTP(otp);

    // Send verification request to backend - this will trigger email magic link
    const response = await apiClient.post('/auth/signup/verify-phone', {
        idToken,
        phoneNumber: firebaseUser.phoneNumber,
        ...signupData,
    });

    return response;
};

/**
 * Check if phone auth is available
 */
export const isPhoneAuthAvailable = () => isConfigured();

/**
 * Clear any pending verification state
 */
export const clearPhoneAuth = () => {
    clearRecaptcha();
    verificationId = null;
    confirmationResult = null;
};

export default {
    sendPhoneOTP,
    verifyPhoneOTP,
    loginWithPhone,
    initiatePhoneSignup,
    verifyPhoneForSignup,
    isPhoneAuthAvailable,
    clearPhoneAuth,
};
