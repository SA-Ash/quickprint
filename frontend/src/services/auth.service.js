/**
 * Auth Service
 * Handles all authentication-related API calls
 */

import apiClient from './api';

export const authService = {
    /**
     * Initiate phone OTP for student login
     * @param {string} phone - Phone number with country code
     */
    async initiatePhoneOTP(phone) {
        return apiClient.post('/auth/phone/initiate', { phone }, { auth: false });
    },

    /**
     * Verify phone OTP and complete login
     * @param {string} phone - Phone number
     * @param {string} code - OTP code
     * @param {string} college - Optional college name
     */
    async verifyPhoneOTP(phone, code, college) {
        const response = await apiClient.post('/auth/phone/verify', { phone, code, college }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Register a new partner (shop owner)
     * @param {object} data - Registration data
     */
    async partnerRegister(data) {
        const response = await apiClient.post('/auth/partner/register', data, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Partner login with email/password
     * @param {string} email - Partner email
     * @param {string} password - Password
     */
    async partnerLogin(email, password) {
        const response = await apiClient.post('/auth/partner/login', { email, password }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Google OAuth login
     * @param {string} idToken - Google ID token
     */
    async googleAuth(idToken) {
        const response = await apiClient.post('/auth/google', { idToken }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Refresh access token
     */
    async refreshToken() {
        const refreshToken = apiClient.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await apiClient.post('/auth/refresh', { refreshToken }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
        }

        return response;
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await apiClient.post('/auth/logout', {});
        } finally {
            apiClient.clearTokens();
        }
    },

    /**
     * Get current user from local storage
     */
    getCurrentUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!apiClient.getAccessToken();
    },

    /**
     * Update OTP settings
     * @param {object} settings - { enabled, method, email }
     */
    async updateOtpSettings(settings) {
        return apiClient.put('/auth/me/otp', settings);
    },

    /**
     * Get backup codes
     */
    async getBackupCodes() {
        return apiClient.get('/auth/backup-codes');
    },

    /**
     * Generate new backup codes
     */
    async generateBackupCodes() {
        return apiClient.post('/auth/backup-codes', {});
    },

    /**
     * Set password (for users disabling OTP)
     * @param {string} password - New password
     * @param {string} confirmPassword - Confirm password
     */
    async setPassword(password, confirmPassword) {
        return apiClient.post('/auth/set-password', { password, confirmPassword });
    },

    /**
     * Link Google account
     * @param {string} idToken - Google ID token
     */
    async linkGoogleAccount(idToken) {
        return apiClient.post('/auth/google/link', { idToken });
    },

    // Password-based authentication methods

    /**
     * Signup with phone number and password
     * @param {string} phone - Phone number with country code
     * @param {string} password - Password
     * @param {string} name - User's name
     * @param {string} college - Optional college name
     */
    async phonePasswordSignup(phone, password, name, college) {
        const response = await apiClient.post('/auth/phone/password/signup', { phone, password, name, college }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Login with phone number and password
     * @param {string} phone - Phone number with country code
     * @param {string} password - Password
     */
    async phonePasswordLogin(phone, password) {
        const response = await apiClient.post('/auth/phone/password/login', { phone, password }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Signup with email and password
     * @param {string} email - Email address
     * @param {string} password - Password
     * @param {string} name - User's name
     * @param {string} college - Optional college name
     * @param {string} phone - Optional phone number for duplicate checking
     */
    async emailPasswordSignup(email, password, name, college, phone) {
        const response = await apiClient.post('/auth/email/password/signup', { email, password, name, college, phone }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Login with email and password
     * @param {string} email - Email address
     * @param {string} password - Password
     */
    async emailPasswordLogin(email, password) {
        const response = await apiClient.post('/auth/email/password/login', { email, password }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    // ============================================
    // PARTNER 2FA REGISTRATION METHODS
    // ============================================

    /**
     * Step 1: Initiate partner registration with 2FA
     * Stores data and sends OTP to phone
     */
    async initiatePartnerRegister(data) {
        return apiClient.post('/auth/partner/register/initiate', data, { auth: false });
    },

    /**
     * Step 2: Verify phone OTP
     * Sends magic link to email after successful OTP verification
     */
    async verifyPartnerOTP(phone, code) {
        return apiClient.post('/auth/partner/register/verify-otp', { phone, code }, { auth: false });
    },

    /**
     * Step 3: Complete registration via magic link token
     * Creates user and shop, returns auth tokens
     */
    async completePartnerRegister(token) {
        const response = await apiClient.post('/auth/partner/register/verify-email', { token }, { auth: false });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Resend OTP during partner registration
     */
    async resendPartnerOTP(phone) {
        return apiClient.post('/auth/partner/register/resend-otp', { phone }, { auth: false });
    },


    // ============================================
    // FIREBASE REMOVED
    // ============================================

};

export default authService;

