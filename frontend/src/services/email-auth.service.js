/**
 * Email Auth Service
 * Frontend API calls for email-based authentication
 */

import apiClient from './api';

export const emailAuthService = {
    /**
     * Send OTP to email
     */
    async sendOTP(email) {
        return apiClient.post('/auth/email/otp/send', { email }, { auth: false });
    },

    /**
     * Verify OTP and get tokens
     */
    async verifyOTP(email, code) {
        const result = await apiClient.post('/auth/email/otp/verify', { email, code }, { auth: false });

        if (result.accessToken) {
            apiClient.setTokens(result.accessToken, result.refreshToken);
            localStorage.setItem('user', JSON.stringify(result.user));
        }

        return result;
    },

    /**
     * Verify OTP only - does NOT create user (for signup flow)
     */
    async verifyOTPOnly(email, code) {
        return apiClient.post('/auth/email/otp/verify-only', { email, code }, { auth: false });
    },

    /**
     * Send magic link for passwordless login
     */
    async sendMagicLink(email) {
        return apiClient.post('/auth/email/magic-link/send', { email }, { auth: false });
    },

    /**
     * Verify magic link token and get tokens
     */
    async verifyMagicLink(token) {
        const result = await apiClient.post('/auth/email/magic-link/verify', { token }, { auth: false });

        if (result.accessToken) {
            apiClient.setTokens(result.accessToken, result.refreshToken);
            localStorage.setItem('user', JSON.stringify(result.user));
        }

        return result;
    },
};

export default emailAuthService;
