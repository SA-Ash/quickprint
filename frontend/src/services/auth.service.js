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
};

export default authService;
