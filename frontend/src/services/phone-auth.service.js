/**
 * Phone Authentication Service
 * Uses Firebase Phone Auth for OTP verification
 */

import { signInWithPhoneNumber } from 'firebase/auth';
import { auth, setupRecaptcha, clearRecaptcha } from '../config/firebase.js';

// Store confirmation result for OTP verification
let confirmationResult = null;

const phoneAuthService = {
    /**
     * Send OTP to phone number
     * @param {string} phoneNumber - Phone number with country code (e.g., +919999999999)
     * @returns {Promise<void>}
     */
    async sendPhoneOTP(phoneNumber) {
        try {
            console.log('[PhoneAuth] Sending OTP to:', phoneNumber);

            // Clear any existing reCAPTCHA
            clearRecaptcha();

            // Setup reCAPTCHA verifier (async now to ensure cleanup is complete)
            const recaptchaVerifier = await setupRecaptcha('recaptcha-container');

            // Send OTP
            confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

            console.log('[PhoneAuth] OTP sent successfully');
            return { success: true };
        } catch (error) {
            console.error('[PhoneAuth] Send OTP error:', error);

            // Clear reCAPTCHA on error
            clearRecaptcha();

            // Provide user-friendly error messages
            if (error.code === 'auth/invalid-phone-number') {
                throw new Error('Invalid phone number format. Please use format: +919999999999');
            } else if (error.code === 'auth/too-many-requests') {
                throw new Error('Too many attempts. Please try again later.');
            } else if (error.code === 'auth/invalid-app-credential') {
                throw new Error('Authentication configuration error. Please contact support.');
            } else {
                throw new Error(error.message || 'Failed to send OTP. Please try again.');
            }
        }
    },

    /**
     * Verify OTP code
     * @param {string} otp - 6-digit OTP code
     * @returns {Promise<object>} Firebase user credential
     */
    async verifyPhoneOTP(otp) {
        try {
            if (!confirmationResult) {
                throw new Error('No OTP request found. Please request a new OTP.');
            }

            console.log('[PhoneAuth] Verifying OTP...');

            const result = await confirmationResult.confirm(otp);

            console.log('[PhoneAuth] OTP verified successfully');

            // Get the Firebase ID token for backend verification
            const idToken = await result.user.getIdToken();

            return {
                success: true,
                user: result.user,
                idToken: idToken,
                phoneNumber: result.user.phoneNumber,
            };
        } catch (error) {
            console.error('[PhoneAuth] Verify OTP error:', error);

            if (error.code === 'auth/invalid-verification-code') {
                throw new Error('Invalid OTP. Please check and try again.');
            } else if (error.code === 'auth/code-expired') {
                throw new Error('OTP expired. Please request a new one.');
            } else {
                throw new Error(error.message || 'Failed to verify OTP.');
            }
        }
    },

    /**
     * Login with phone - verify OTP and authenticate with backend
     * @param {string} otp - 6-digit OTP code
     * @param {string} college - College name (for students)
     * @param {boolean} isPartner - Whether this is a partner login
     * @returns {Promise<object>} Backend auth response
     */
    async loginWithPhone(otp, college, isPartner = false) {
        try {
            // First verify the OTP with Firebase
            const verifyResult = await this.verifyPhoneOTP(otp);

            // Then send the Firebase token to our backend for verification
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/phone/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken: verifyResult.idToken,
                    phoneNumber: verifyResult.phoneNumber,
                    college: college,
                    isPartner: isPartner,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Backend verification failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[PhoneAuth] Login error:', error);
            throw error;
        }
    },

    /**
     * Clear phone auth state
     */
    clearPhoneAuth() {
        confirmationResult = null;
        clearRecaptcha();
    },

    /**
     * Get current Firebase auth state
     */
    getCurrentUser() {
        return auth.currentUser;
    },
};

export default phoneAuthService;
